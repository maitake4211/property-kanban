import {
  AbstractInputSuggest,
  App,
  FileSystemAdapter,
  FuzzySuggestModal,
  ItemView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  TextComponent,
  WorkspaceLeaf,
  setIcon,
} from "obsidian";

import { t } from "./i18n";

import {
  parseFrontmatter,
  updateFrontmatterContent,
  quoteIfNeeded,
  parseWikiLink,
  formatWikiLink,
  setListField,
  removeFrontmatterField,
  getCardsForColumn,
  collectAllFields,
  resolveAllColumns as resolveAllColumnsFn,
  isColumnHidden as isColumnHiddenFn,
} from "./utils";

// ============================================================
// Types
// ============================================================

type TagColor = "blue" | "green" | "red" | "yellow" | "purple" | "gray";

interface DisplayProperty {
  field: string;
  label: string;
  enabled: boolean;
  color: TagColor;
  prefix: string;
  hideInvalid: boolean;
}

interface PropertyKanbanSettings {
  taskFolder: string;
  statusField: string;
  columns: string[];
  createdField: string;
  cardDisplayProperties: DisplayProperty[];
  skipDeleteConfirm: boolean;
  boardZoom: number;
  activeGroupField: string;
  activeSubGroupField: string;
  columnOrders: Record<string, string[]>;
  hiddenColumns: Record<string, string[]>;
  laneHeights: Record<string, number>;
  quickActionEnabled: boolean;
  quickActionLabel: string;
  quickActionField: string;
  quickActionValue: string;
  parentField: string;
  childrenField: string;
  maintainChildrenList: boolean;
  showEmptyParentField: boolean;
}

const DEFAULT_SETTINGS: PropertyKanbanSettings = {
  taskFolder: "tasks",
  statusField: "status",
  columns: ["To do", "In progress", "Done"],
  createdField: "created",
  cardDisplayProperties: [
    { field: "category", label: "category", enabled: true, color: "blue", prefix: "", hideInvalid: false },
    { field: "project", label: "project", enabled: true, color: "green", prefix: "", hideInvalid: false },
    { field: "due", label: "due", enabled: true, color: "red", prefix: "Due: ", hideInvalid: true },
    { field: "created", label: "created", enabled: false, color: "yellow", prefix: "Created: ", hideInvalid: true },
  ],
  skipDeleteConfirm: false,
  boardZoom: 100,
  activeGroupField: "status",
  activeSubGroupField: "",
  columnOrders: {},
  hiddenColumns: {},
  laneHeights: {},
  quickActionEnabled: false,
  quickActionLabel: "Done",
  quickActionField: "status",
  quickActionValue: "Done",
  parentField: "parent",
  childrenField: "children",
  maintainChildrenList: true,
  showEmptyParentField: false,
};

const DEFAULT_LANE_HEIGHT = 500;

const VIEW_TYPE = "property-kanban-view";

// ============================================================
// Plugin
// ============================================================

export default class PropertyKanbanPlugin extends Plugin {
  settings: PropertyKanbanSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => new KanbanView(leaf, this));

    this.addRibbonIcon("layout-dashboard", t("ribbon.open"), () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-board",
      name: t("command.openBoard"),
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "rebuild-hierarchy",
      name: t("command.rebuildHierarchy"),
      callback: () => this.rebuildHierarchy(),
    });

    this.addSettingTab(new PropertyKanbanSettingTab(this.app, this));
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const newLeaf = workspace.getLeaf("tab");
      await newLeaf.setViewState({ type: VIEW_TYPE, active: true });
      leaf = newLeaf;
    }
    workspace.revealLeaf(leaf);
  }

  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /** Refresh all open Kanban views so setting changes take effect immediately */
  refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof KanbanView) view.refresh();
    }
  }

  // ----------------------------------------------------------
  // Parent / child hierarchy sync
  //
  // The child's parent link is the single source of truth. The parent's
  // children list is a derived projection, regenerated wholesale from the
  // set of notes pointing at it. Both live in the note frontmatter so
  // Obsidian's graph view and backlinks can follow the hierarchy.
  // ----------------------------------------------------------

  /** All task notes in the configured folder. */
  taskFiles(): TFile[] {
    const folder = this.app.vault.getAbstractFileByPath(this.settings.taskFolder);
    if (!(folder instanceof TFolder)) return [];
    return folder.children.filter(
      (f): f is TFile => f instanceof TFile && f.extension === "md"
    );
  }

  /** Shortest unambiguous wikilink text for a file (basename, or path if needed). */
  private linkTargetFor(file: TFile): string {
    return this.app.metadataCache.fileToLinktext(file, "", true);
  }

  /** Resolve the parent note of a task file via its parent frontmatter link. */
  async parentFileOf(file: TFile): Promise<TFile | null> {
    const content = await this.app.vault.read(file);
    const fm = parseFrontmatter(content);
    const linkpath = parseWikiLink(fm[this.settings.parentField] ?? "");
    if (!linkpath) return null;
    const dest = this.app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
    return dest instanceof TFile ? dest : null;
  }

  /** All task notes whose parent link points at the given file. */
  async childrenOf(parent: TFile, allFiles?: TFile[]): Promise<TFile[]> {
    const files = allFiles ?? this.taskFiles();
    const children: TFile[] = [];
    for (const f of files) {
      if (f.path === parent.path) continue;
      const p = await this.parentFileOf(f);
      if (p && p.path === parent.path) children.push(f);
    }
    return children;
  }

  /** True if `ancestor` is an ancestor of (or equal to) `start`. */
  private async isAncestor(ancestor: TFile, start: TFile): Promise<boolean> {
    const seen = new Set<string>();
    let current: TFile | null = start;
    while (current) {
      if (current.path === ancestor.path) return true;
      if (seen.has(current.path)) break; // guard against pre-existing cycles
      seen.add(current.path);
      current = await this.parentFileOf(current);
    }
    return false;
  }

  /** Regenerate a parent's children list from the notes currently pointing at it. */
  async regenerateChildrenList(parent: TFile): Promise<void> {
    if (!this.settings.maintainChildrenList) return;
    const children = await this.childrenOf(parent);
    const items = children
      .map((c) => formatWikiLink(this.linkTargetFor(c)))
      .sort();
    const content = await this.app.vault.read(parent);
    const updated = setListField(content, this.settings.childrenField, items);
    if (updated !== null && updated !== content) {
      await this.app.vault.modify(parent, updated);
    }
  }

  /**
   * Set (or clear, when parent is null) the parent of a child note, keeping
   * the affected parents' children lists in sync. Returns true on success.
   */
  async setParent(child: TFile, parent: TFile | null): Promise<boolean> {
    if (parent) {
      if (parent.path === child.path) {
        new Notice(t("notice.cannotParentSelf"));
        return false;
      }
      if (await this.isAncestor(child, parent)) {
        new Notice(t("notice.cyclicParent"));
        return false;
      }
    }

    const oldParent = await this.parentFileOf(child);

    const content = await this.app.vault.read(child);
    const updated = parent
      ? updateFrontmatterContent(
          content,
          this.settings.parentField,
          formatWikiLink(this.linkTargetFor(parent))
        )
      : removeFrontmatterField(content, this.settings.parentField);
    if (updated === null) {
      new Notice(t("notice.noFrontmatter"));
      return false;
    }
    if (updated !== content) await this.app.vault.modify(child, updated);

    if (oldParent && oldParent.path !== parent?.path) {
      await this.regenerateChildrenList(oldParent);
    }
    if (parent) await this.regenerateChildrenList(parent);
    return true;
  }

  /**
   * Detach a note from the hierarchy on deletion: drop it from its parent's
   * children list and clear the parent link of its former children.
   */
  async detachOnDelete(file: TFile): Promise<void> {
    const allFiles = this.taskFiles();
    const parent = await this.parentFileOf(file);
    const children = await this.childrenOf(file, allFiles);
    for (const c of children) {
      const content = await this.app.vault.read(c);
      const updated = removeFrontmatterField(content, this.settings.parentField);
      if (updated !== null && updated !== content) {
        await this.app.vault.modify(c, updated);
      }
    }
    if (parent) await this.regenerateChildrenList(parent);
  }

  /** Rebuild every children list from the parent links (source of truth). */
  async rebuildHierarchy(): Promise<void> {
    const allFiles = this.taskFiles();
    // Map each parent path to its children.
    const childrenByParent = new Map<string, TFile[]>();
    for (const f of allFiles) {
      const p = await this.parentFileOf(f);
      if (!p) continue;
      const arr = childrenByParent.get(p.path) ?? [];
      arr.push(f);
      childrenByParent.set(p.path, arr);
    }
    let changed = 0;
    for (const f of allFiles) {
      const items = (childrenByParent.get(f.path) ?? [])
        .map((c) => formatWikiLink(this.linkTargetFor(c)))
        .sort();
      const content = await this.app.vault.read(f);
      const updated = this.settings.maintainChildrenList
        ? setListField(content, this.settings.childrenField, items)
        : removeFrontmatterField(content, this.settings.childrenField);
      if (updated !== null && updated !== content) {
        await this.app.vault.modify(f, updated);
        changed++;
      }
    }
    new Notice(t("notice.hierarchyRebuilt", { count: changed }));
    this.refreshViews();
  }
}

// ============================================================
// Kanban View
// ============================================================

class KanbanView extends ItemView {
  plugin: PropertyKanbanPlugin;
  private fileMap: Map<string, Record<string, string>> = new Map();
  private dragData: { filePath: string; sourceColumn: string; sourceLane?: string } | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private settingsPopover: HTMLElement | null = null;
  private settingsPopoverCleanup: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: PropertyKanbanPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return t("view.title");
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  async onOpen() {
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && this.isTaskFile(file)) {
          this.scheduleRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile && this.isTaskFile(file)) {
          this.scheduleRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile && this.isTaskFile(file)) {
          this.scheduleRefresh();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", () => {
        this.scheduleRefresh();
      })
    );

    await this.refresh();
  }

  async onClose(): Promise<void> {
    this.closeSettingsPopover();
  }

  private isTaskFile(file: TFile): boolean {
    return file.path.startsWith(this.plugin.settings.taskFolder + "/");
  }

  /** Update a single frontmatter field by reading/writing file content directly */
  private async updateFrontmatterField(
    file: TFile,
    field: string,
    value: string
  ): Promise<void> {
    const content = await this.app.vault.read(file);
    const updated = updateFrontmatterContent(content, field, value);
    if (updated !== null) {
      await this.app.vault.modify(file, updated);
    }
  }

  private async loadTasks(): Promise<void> {
    this.fileMap.clear();
    const folder = this.app.vault.getAbstractFileByPath(
      this.plugin.settings.taskFolder
    );
    if (!(folder instanceof TFolder)) return;

    const files = folder.children.filter(
      (f): f is TFile => f instanceof TFile && f.extension === "md"
    );

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const fm = parseFrontmatter(content);
      this.fileMap.set(file.path, fm);
    }
  }

  /** Debounced refresh to avoid rapid re-renders */
  private scheduleRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refresh(), 150);
  }

  async refresh(): Promise<void> {
    await this.loadTasks();
    this.render();
  }

  private render(): void {
    const container = this.contentEl;
    const savedScroll = this.captureScrollPositions(container);
    container.empty();
    container.addClass("nk-container");

    // Header
    const header = container.createDiv({ cls: "nk-header" });
    header.createEl("h2", { text: t("view.title") });

    const headerActions = header.createDiv({ cls: "nk-header-actions" });

    // Add task button (primary action, always visible)
    const addBtn = headerActions.createEl("button", {
      text: t("board.newTask"),
      cls: "nk-add-btn",
    });
    addBtn.addEventListener("click", () => {
      new CardCreateModal(this.app, this.plugin, () => this.refresh(), this.fileMap).open();
    });

    // Settings toggle button (gear icon)
    const toolbarBtn = headerActions.createEl("button", {
      cls: "nk-toolbar-toggle",
    });
    setIcon(toolbarBtn, "settings");
    toolbarBtn.setAttribute("aria-label", t("board.viewSettings"));
    toolbarBtn.setAttribute("aria-expanded", "false");
    toolbarBtn.setAttribute("aria-haspopup", "dialog");
    toolbarBtn.setAttribute("type", "button");
    toolbarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSettingsPopover(toolbarBtn, container);
    });
    if (this.settingsPopover) {
      this.closeSettingsPopover();
    }

    // Board
    const board = container.createDiv({ cls: "nk-board" });
    board.dataset.scrollKey = "board";
    board.style.setProperty("zoom", `${this.plugin.settings.boardZoom / 100}`);
    const groupField = this.plugin.settings.activeGroupField;
    const subField = this.plugin.settings.activeSubGroupField;

    if (subField && subField !== groupField) {
      this.renderSwimLanes(board, groupField, subField);
    } else {
      const columns = this.resolveColumns(groupField);
      for (const colName of columns) {
        const cards = this.getCardsForCol(colName, groupField, columns[0]);
        this.renderColumn(board, colName, cards, groupField);
      }
    }

    this.restoreScrollPositions(container, savedScroll);
  }

  private captureScrollPositions(
    container: HTMLElement
  ): Map<string, { left: number; top: number }> {
    const positions = new Map<string, { left: number; top: number }>();
    container.querySelectorAll<HTMLElement>("[data-scroll-key]").forEach((el) => {
      const key = el.dataset.scrollKey;
      if (key) positions.set(key, { left: el.scrollLeft, top: el.scrollTop });
    });
    return positions;
  }

  private restoreScrollPositions(
    container: HTMLElement,
    positions: Map<string, { left: number; top: number }>
  ): void {
    if (positions.size === 0) return;
    container.querySelectorAll<HTMLElement>("[data-scroll-key]").forEach((el) => {
      const key = el.dataset.scrollKey;
      if (!key) return;
      const pos = positions.get(key);
      if (pos) {
        el.scrollLeft = pos.left;
        el.scrollTop = pos.top;
      }
    });
  }

  /** Render swim lane layout: primary group = rows, sub group = columns within each row */
  private renderSwimLanes(
    board: HTMLElement,
    primaryField: string,
    subField: string
  ): void {
    board.addClass("nk-board-lanes");

    // Collect primary group values (lanes)
    const laneValues = this.resolveColumns(primaryField);
    // Collect sub group values (columns shared across all lanes)
    const subColumns = this.resolveColumns(subField);

    for (const laneValue of laneValues) {
      // Skip hidden lanes
      if (this.isColumnHidden(primaryField, laneValue)) continue;

      // All cards in this lane
      const laneCards = this.getCardsForCol(laneValue, primaryField, laneValues[0]);

      const lane = board.createDiv({ cls: "nk-lane" });

      // Lane header
      const laneHeader = lane.createDiv({ cls: "nk-lane-header" });
      laneHeader.createEl("span", { text: laneValue, cls: "nk-lane-title" });
      laneHeader.createEl("span", { text: `${laneCards.length}`, cls: "nk-lane-count" });

      // Lane body: columns for sub-group
      const laneBody = lane.createDiv({ cls: "nk-lane-body" });
      const heightKey = `${primaryField}:::${laneValue}`;
      laneBody.dataset.scrollKey = `lane:${heightKey}`;
      const savedHeight = this.plugin.settings.laneHeights[heightKey];
      if (savedHeight) laneBody.style.height = `${savedHeight}px`;

      for (const subCol of subColumns) {
        const colCards = laneCards.filter((c) => {
          const v = c.fm[subField];
          return v === subCol || (!v && subCol === subColumns[0]);
        });

        this.renderColumn(laneBody, subCol, colCards, subField, laneValue);
      }

      // Resize handle to adjust lane height by dragging
      const handle = lane.createDiv({ cls: "nk-lane-resize-handle" });
      this.attachLaneResize(handle, laneBody, heightKey);
    }
  }

  /** Drag the bottom handle to resize a swim lane's height (persisted per lane) */
  private attachLaneResize(
    handle: HTMLElement,
    laneBody: HTMLElement,
    key: string
  ): void {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = this.plugin.settings.laneHeights[key] ?? DEFAULT_LANE_HEIGHT;
      const zoom = this.plugin.settings.boardZoom / 100;
      document.body.addClass("nk-resizing-row");

      const onMove = (ev: MouseEvent) => {
        const delta = (ev.clientY - startY) / zoom;
        const h = Math.max(150, Math.round(startHeight + delta));
        laneBody.style.height = `${h}px`;
      };
      const onUp = async () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.removeClass("nk-resizing-row");
        const h = parseInt(laneBody.style.height, 10);
        this.plugin.settings.laneHeights[key] = Number.isFinite(h) ? h : DEFAULT_LANE_HEIGHT;
        await this.plugin.saveSettings();
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  private toggleSettingsPopover(triggerBtn: HTMLElement, container: HTMLElement): void {
    if (this.settingsPopover) {
      this.closeSettingsPopover();
      return;
    }
    this.openSettingsPopover(triggerBtn, container);
  }

  private openSettingsPopover(triggerBtn: HTMLElement, container: HTMLElement): void {
    triggerBtn.addClass("is-active");
    triggerBtn.setAttribute("aria-expanded", "true");

    const popover = document.body.createDiv({ cls: "nk-settings-popover" });
    this.settingsPopover = popover;

    const positionPopover = () => {
      const rect = triggerBtn.getBoundingClientRect();
      popover.style.top = `${rect.bottom + 6}px`;
      const right = Math.max(8, window.innerWidth - rect.right);
      popover.style.right = `${right}px`;
    };
    positionPopover();

    this.renderSettingsPopoverContent(popover, container);

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popover.contains(target) || triggerBtn.contains(target)) return;
      this.closeSettingsPopover();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        this.closeSettingsPopover();
        triggerBtn.focus();
      }
    };
    const onResize = () => positionPopover();

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    this.settingsPopoverCleanup = () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      triggerBtn.removeClass("is-active");
      triggerBtn.setAttribute("aria-expanded", "false");
    };
  }

  private closeSettingsPopover(): void {
    this.settingsPopoverCleanup?.();
    this.settingsPopoverCleanup = null;
    this.settingsPopover?.remove();
    this.settingsPopover = null;
  }

  private renderSettingsPopoverContent(popover: HTMLElement, container: HTMLElement): void {
    popover.empty();

    const groupSection = this.createPopoverSection(popover, t("popover.group"));
    this.renderGroupSelectors(groupSection, popover, container);

    const zoomSection = this.createPopoverSection(popover, t("popover.zoom"));
    this.renderZoomControls(zoomSection, container);

    const visSection = this.createPopoverSection(popover, t("popover.cardProperties"));
    this.renderVisibilityList(visSection, container);

    const orderSection = this.createPopoverSection(popover, t("popover.columnOrder"));
    this.renderOrderSections(orderSection, container);

    // Footer
    const footer = popover.createDiv({ cls: "nk-popover-footer" });
    const settingsLink = footer.createEl("button", {
      cls: "nk-popover-link",
      text: t("popover.openPluginSettings"),
      attr: { type: "button" },
    });
    settingsLink.addEventListener("click", () => {
      // Obsidian's settings API is not in public types but stable in practice
      const setting = (this.app as unknown as { setting?: { open?: () => void; openTabById?: (id: string) => void } }).setting;
      setting?.open?.();
      setting?.openTabById?.("property-kanban");
      this.closeSettingsPopover();
    });
  }

  private createPopoverSection(popover: HTMLElement, title: string): HTMLElement {
    const section = popover.createDiv({ cls: "nk-popover-section" });
    section.createEl("div", { cls: "nk-popover-section-title", text: title });
    return section.createDiv({ cls: "nk-popover-section-body" });
  }

  private renderGroupSelectors(
    parent: HTMLElement,
    popover: HTMLElement,
    container: HTMLElement
  ): void {
    const allFields = this.collectFields();
    if (allFields.length === 0) {
      parent.createEl("div", { cls: "nk-popover-empty", text: t("popover.noFields") });
      return;
    }

    const laneRow = parent.createDiv({ cls: "nk-popover-row" });
    laneRow.createEl("span", { cls: "nk-popover-row-label", text: t("popover.lane") });
    const groupSelect = laneRow.createEl("select", { cls: "nk-group-select" });
    for (const field of allFields) {
      groupSelect.createEl("option", { text: field }).value = field;
    }
    groupSelect.value = this.plugin.settings.activeGroupField;
    groupSelect.addEventListener("change", async () => {
      this.plugin.settings.activeGroupField = groupSelect.value;
      await this.plugin.saveSettings();
      this.rerenderBoard(container);
      this.renderSettingsPopoverContent(popover, container);
    });

    const colRow = parent.createDiv({ cls: "nk-popover-row" });
    colRow.createEl("span", { cls: "nk-popover-row-label", text: t("popover.column") });
    const subGroupSelect = colRow.createEl("select", { cls: "nk-group-select" });
    subGroupSelect.createEl("option", { text: t("popover.none") }).value = "";
    for (const field of allFields) {
      subGroupSelect.createEl("option", { text: field }).value = field;
    }
    subGroupSelect.value = this.plugin.settings.activeSubGroupField;
    subGroupSelect.addEventListener("change", async () => {
      this.plugin.settings.activeSubGroupField = subGroupSelect.value;
      await this.plugin.saveSettings();
      this.rerenderBoard(container);
      this.renderSettingsPopoverContent(popover, container);
    });
  }

  private renderZoomControls(parent: HTMLElement, container: HTMLElement): void {
    const zoomGroup = parent.createDiv({ cls: "nk-zoom-group" });
    const zoomOut = zoomGroup.createEl("button", { text: "−", cls: "nk-zoom-btn", attr: { type: "button" } });
    const zoomLabel = zoomGroup.createEl("span", {
      text: `${this.plugin.settings.boardZoom}%`,
      cls: "nk-zoom-label",
    });
    const zoomIn = zoomGroup.createEl("button", { text: "+", cls: "nk-zoom-btn", attr: { type: "button" } });

    const applyZoom = async (delta: number) => {
      const zoom = Math.min(200, Math.max(50, this.plugin.settings.boardZoom + delta));
      this.plugin.settings.boardZoom = zoom;
      await this.plugin.saveSettings();
      zoomLabel.setText(`${zoom}%`);
      const boardEl = container.querySelector(".nk-board") as HTMLElement | null;
      if (boardEl) boardEl.style.setProperty("zoom", `${zoom / 100}`);
    };
    zoomOut.addEventListener("click", () => applyZoom(-10));
    zoomIn.addEventListener("click", () => applyZoom(10));
  }

  private renderVisibilityList(parent: HTMLElement, container: HTMLElement): void {
    const props = this.plugin.settings.cardDisplayProperties;
    if (props.length === 0) {
      parent.createEl("div", { cls: "nk-popover-empty", text: t("popover.noDisplayProps") });
      return;
    }
    for (const dp of props) {
      const row = parent.createDiv({ cls: "nk-vis-row" });
      const label = row.createEl("label", { cls: "nk-vis-label" });
      const checkbox = label.createEl("input");
      checkbox.type = "checkbox";
      checkbox.checked = dp.enabled;
      checkbox.addClass("nk-vis-checkbox");
      label.createSpan({ text: dp.label || dp.field });
      checkbox.addEventListener("change", async () => {
        dp.enabled = checkbox.checked;
        await this.plugin.saveSettings();
        this.rerenderBoard(container);
      });
    }
  }

  private renderOrderSections(parent: HTMLElement, container: HTMLElement): void {
    const groupField = this.plugin.settings.activeGroupField;
    const subField = this.plugin.settings.activeSubGroupField;
    const isSwimLane = subField && subField !== groupField;

    const rerender = () => {
      parent.empty();
      build();
    };

    const build = () => {
      const primaryLabel = t("popover.laneSection", { field: groupField });
      this.renderOrderSection(parent, primaryLabel, groupField, container, rerender);
      if (isSwimLane) {
        this.renderOrderSection(parent, t("popover.columnSection", { field: subField }), subField, container, rerender);
      }
    };

    build();
  }

  /** Render a single order section for a field */
  private renderOrderSection(
    panel: HTMLElement,
    title: string,
    field: string,
    container: HTMLElement,
    rerender: () => void
  ): void {
    const section = panel.createDiv({ cls: "nk-order-section" });
    section.createEl("span", { text: title, cls: "nk-order-title" });

    const columns = this.resolveAllColumns(field);
    const list = section.createDiv({ cls: "nk-order-list" });
    let dragIdx: number | null = null;

    const buildRows = () => {
      list.empty();
      for (let i = 0; i < columns.length; i++) {
        const hidden = this.isColumnHidden(field, columns[i]);
        const row = list.createDiv({ cls: `nk-order-row ${hidden ? "nk-order-row-hidden" : ""}` });
        row.setAttribute("draggable", "true");

        // Drag handle
        row.createEl("span", { text: "⠿", cls: "nk-order-drag-handle" });

        // Visibility checkbox
        const checkbox = row.createEl("input");
        checkbox.type = "checkbox";
        checkbox.checked = !hidden;
        checkbox.addClass("nk-order-checkbox");
        checkbox.addEventListener("change", async () => {
          const hiddenList = this.plugin.settings.hiddenColumns[field] ?? [];
          if (checkbox.checked) {
            this.plugin.settings.hiddenColumns[field] = hiddenList.filter((c) => c !== columns[i]);
          } else {
            hiddenList.push(columns[i]);
            this.plugin.settings.hiddenColumns[field] = hiddenList;
          }
          await this.plugin.saveSettings();
          buildRows();
          this.rerenderBoard(container);
        });

        row.createEl("span", { text: columns[i], cls: "nk-order-name" });

        // Drag events
        row.addEventListener("dragstart", () => {
          dragIdx = i;
          row.addClass("nk-order-row-dragging");
        });
        row.addEventListener("dragend", () => {
          row.removeClass("nk-order-row-dragging");
          dragIdx = null;
        });
        row.addEventListener("dragover", (e) => {
          e.preventDefault();
          row.addClass("nk-order-row-dragover");
        });
        row.addEventListener("dragleave", () => {
          row.removeClass("nk-order-row-dragover");
        });
        row.addEventListener("drop", async (e) => {
          e.preventDefault();
          row.removeClass("nk-order-row-dragover");
          if (dragIdx === null || dragIdx === i) return;
          const moved = columns.splice(dragIdx, 1)[0];
          columns.splice(i, 0, moved);
          this.plugin.settings.columnOrders[field] = [...columns];
          await this.plugin.saveSettings();
          dragIdx = null;
          buildRows();
          this.rerenderBoard(container);
        });
      }
    };

    buildRows();

    const resetBtn = section.createEl("button", {
      text: t("popover.reset"),
      cls: "nk-order-reset-btn",
    });
    resetBtn.addEventListener("click", async () => {
      delete this.plugin.settings.columnOrders[field];
      delete this.plugin.settings.hiddenColumns[field];
      await this.plugin.saveSettings();
      rerender();
      this.rerenderBoard(container);
    });
  }

  /** Get all columns including hidden ones (for order panel) */
  private resolveAllColumns(field: string): string[] {
    return resolveAllColumnsFn(
      this.fileMap,
      field,
      this.plugin.settings.columnOrders[field]
    );
  }

  /** Re-render only the board portion (preserving panels) */
  private rerenderBoard(container: HTMLElement): void {
    const savedScroll = this.captureScrollPositions(container);
    const boardEl = container.querySelector(".nk-board");
    if (boardEl) boardEl.remove();
    const newBoard = container.createDiv({ cls: "nk-board" });
    newBoard.dataset.scrollKey = "board";
    newBoard.style.setProperty("zoom", `${this.plugin.settings.boardZoom / 100}`);
    const gf = this.plugin.settings.activeGroupField;
    const subField = this.plugin.settings.activeSubGroupField;

    if (subField && subField !== gf) {
      this.renderSwimLanes(newBoard, gf, subField);
    } else {
      const cols = this.resolveColumns(gf);
      for (const colName of cols) {
        const cards = this.getCardsForCol(colName, gf, cols[0]);
        this.renderColumn(newBoard, colName, cards, gf);
      }
    }

    this.restoreScrollPositions(container, savedScroll);
  }

  private collectFields(): string[] {
    return collectAllFields(this.fileMap);
  }

  /** Resolve visible columns (hidden ones filtered out) */
  private resolveColumns(field: string): string[] {
    const all = this.resolveAllColumns(field);
    const hidden = this.plugin.settings.hiddenColumns[field] ?? [];
    return all.filter((c) => !hidden.includes(c));
  }

  private isColumnHidden(field: string, col: string): boolean {
    return isColumnHiddenFn(this.plugin.settings.hiddenColumns, field, col);
  }

  private getCardsForCol(
    colName: string,
    field: string,
    firstColumn: string
  ): { path: string; name: string; fm: Record<string, string> }[] {
    return getCardsForColumn(
      this.fileMap,
      colName,
      field,
      firstColumn
    );
  }

  private renderColumn(
    board: HTMLElement,
    colName: string,
    cards: { path: string; name: string; fm: Record<string, string> }[],
    groupField?: string,
    laneValue?: string
  ): void {
    const field = groupField ?? this.plugin.settings.activeGroupField;
    const col = board.createDiv({ cls: "nk-column" });

    // Column header
    const colHeader = col.createDiv({ cls: "nk-column-header" });
    colHeader.createEl("span", { text: colName, cls: "nk-column-title" });
    colHeader.createEl("span", {
      text: `${cards.length}`,
      cls: "nk-column-count",
    });

    // Drop zone
    const cardList = col.createDiv({ cls: "nk-card-list" });
    cardList.dataset.scrollKey = `cards:${laneValue ?? ""}:::${field}:::${colName}`;

    cardList.addEventListener("dragover", (e) => {
      e.preventDefault();
      cardList.addClass("nk-drag-over");
    });

    cardList.addEventListener("dragleave", () => {
      cardList.removeClass("nk-drag-over");
    });

    cardList.addEventListener("drop", async (e) => {
      e.preventDefault();
      cardList.removeClass("nk-drag-over");
      if (!this.dragData) return;

      const sameColumn = this.dragData.sourceColumn === colName;
      const sameLane = !laneValue || this.dragData.sourceLane === laneValue;
      if (sameColumn && sameLane) return;

      const file = this.app.vault.getAbstractFileByPath(this.dragData.filePath);
      if (!(file instanceof TFile)) return;

      // Update sub-group field (column) if changed
      if (!sameColumn) {
        await this.updateFrontmatterField(file, field, colName);
      }

      // Update primary group field (lane) if changed
      if (laneValue && !sameLane) {
        const primaryField = this.plugin.settings.activeGroupField;
        await this.updateFrontmatterField(file, primaryField, laneValue);
      }

      const parts = [];
      if (laneValue && !sameLane) parts.push(laneValue);
      if (!sameColumn) parts.push(colName);
      new Notice(t("notice.cardMoved", { name: file.basename, dest: parts.join(" / ") }));
      this.dragData = null;
    });

    // Cards
    for (const card of cards) {
      this.renderCard(cardList, card, colName, laneValue);
    }

    // Add card button at bottom
    const addInCol = cardList.createDiv({ cls: "nk-add-in-column" });
    addInCol.createEl("span", { text: t("board.addCard") });
    addInCol.addEventListener("click", () => {
      const defaults: Record<string, string> = {};
      defaults[field] = colName;
      if (laneValue) {
        defaults[this.plugin.settings.activeGroupField] = laneValue;
      }
      new CardCreateModal(
        this.app,
        this.plugin,
        () => this.refresh(),
        this.fileMap,
        defaults
      ).open();
    });
  }

  private renderCard(
    cardList: HTMLElement,
    card: { path: string; name: string; fm: Record<string, string> },
    colName: string,
    laneValue?: string
  ): void {
    const el = cardList.createDiv({ cls: "nk-card" });
    el.setAttribute("draggable", "true");

    el.addEventListener("dragstart", () => {
      this.dragData = { filePath: card.path, sourceColumn: colName, sourceLane: laneValue };
      el.addClass("nk-dragging");
    });

    el.addEventListener("dragend", () => {
      el.removeClass("nk-dragging");
    });

    // Card header row (title + menu)
    const cardHeader = el.createDiv({ cls: "nk-card-header" });

    // Card title (clickable to open note)
    const title = cardHeader.createDiv({ cls: "nk-card-title" });
    title.setText(card.name);
    title.addEventListener("click", () => {
      const file = this.app.vault.getAbstractFileByPath(card.path);
      if (file instanceof TFile) {
        this.openFileInLeaf(file);
      }
    });

    // Three-dot menu button
    const menuBtn = cardHeader.createDiv({ cls: "nk-card-menu-btn" });
    menuBtn.setText("\u22EF"); // horizontal ellipsis ⋯
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showCardMenu(menuBtn, card.path, card.name);
    });

    // Tags row
    const tags = el.createDiv({ cls: "nk-card-tags" });

    for (const dp of this.plugin.settings.cardDisplayProperties) {
      if (!dp.enabled) continue;
      const value = card.fm[dp.field];
      if (!value) continue;
      if (dp.hideInvalid && value === "Invalid date") continue;
      const text = dp.prefix ? `${dp.prefix}${value}` : value;
      tags.createEl("span", { text, cls: `nk-tag nk-tag-${dp.color}` });
    }

    // Quick action button (e.g. set status to Done)
    const qa = this.plugin.settings;
    if (
      qa.quickActionEnabled &&
      qa.quickActionField &&
      qa.quickActionValue &&
      card.fm[qa.quickActionField] !== qa.quickActionValue
    ) {
      const btn = tags.createEl("button", {
        text: qa.quickActionLabel || qa.quickActionValue,
        cls: "nk-card-quick-action",
      });
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const file = this.app.vault.getAbstractFileByPath(card.path);
        if (!(file instanceof TFile)) return;
        await this.updateFrontmatterField(file, qa.quickActionField, qa.quickActionValue);
        new Notice(t("notice.quickAction", { name: card.name, field: qa.quickActionField, value: qa.quickActionValue }));
      });
    }
  }

  private openFileInLeaf(file: TFile): void {
    // If the note is already open in another tab, jump to it instead of
    // opening a duplicate.
    const existing = this.app.workspace
      .getLeavesOfType("markdown")
      .find((leaf) => {
        const state = leaf.getViewState();
        return state.state?.file === file.path;
      });
    if (existing) {
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      return;
    }
    this.app.workspace.getLeaf("tab").openFile(file);
  }

  private showCardMenu(
    anchorEl: HTMLElement,
    filePath: string,
    fileName: string
  ): void {
    // Close any existing menu
    document.querySelector(".nk-card-menu")?.remove();

    const menu = document.body.createDiv({ cls: "nk-card-menu" });

    // Position near the anchor
    const rect = anchorEl.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${rect.right}px`;

    // Copy path (with submenu)
    const copyItem = menu.createDiv({ cls: "nk-card-menu-item nk-card-menu-item-has-sub" });
    copyItem.setText(t("menu.copyPath"));
    copyItem.createSpan({ cls: "nk-card-menu-item-arrow", text: "▸" });

    const submenu = copyItem.createDiv({ cls: "nk-card-submenu" });
    const addCopyOption = (label: string, build: () => string | null) => {
      const item = submenu.createDiv({ cls: "nk-card-menu-item" });
      item.setText(label);
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        menu.remove();
        const value = build();
        if (value === null) return;
        await this.copyToClipboard(value, label);
      });
    };

    addCopyOption(t("menu.vaultPath"), () => filePath);
    addCopyOption(t("menu.obsidianLink"), () => {
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) return null;
      return this.app.fileManager.generateMarkdownLink(file, "");
    });
    addCopyOption(t("menu.obsidianUrl"), () => {
      const vault = encodeURIComponent(this.app.vault.getName());
      const path = encodeURIComponent(filePath);
      return `obsidian://open?vault=${vault}&file=${path}`;
    });
    addCopyOption(t("menu.systemPath"), () => {
      const adapter = this.app.vault.adapter;
      if (!(adapter instanceof FileSystemAdapter)) {
        new Notice(t("notice.systemPathUnavailable"));
        return null;
      }
      const base = adapter.getBasePath().replace(/\/+$/, "");
      return `${base}/${filePath}`;
    });

    // Parent / child hierarchy
    const fm = this.fileMap.get(filePath);
    const hasParent = !!parseWikiLink(fm?.[this.plugin.settings.parentField] ?? "");

    const setParentItem = menu.createDiv({ cls: "nk-card-menu-item" });
    setParentItem.setText(t("menu.setParent"));
    setParentItem.addEventListener("click", async (e) => {
      e.stopPropagation();
      menu.remove();
      await this.openParentSelect(filePath);
    });

    if (hasParent) {
      const clearParentItem = menu.createDiv({ cls: "nk-card-menu-item" });
      clearParentItem.setText(t("menu.clearParent"));
      clearParentItem.addEventListener("click", async (e) => {
        e.stopPropagation();
        menu.remove();
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile && (await this.plugin.setParent(file, null))) {
          new Notice(t("notice.parentCleared", { name: fileName }));
          this.refresh();
        }
      });
    }

    const addChildItem = menu.createDiv({ cls: "nk-card-menu-item" });
    addChildItem.setText(t("menu.addChild"));
    addChildItem.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.remove();
      const parentFile = this.app.vault.getAbstractFileByPath(filePath);
      if (!(parentFile instanceof TFile)) return;
      new CardCreateModal(
        this.app,
        this.plugin,
        () => this.refresh(),
        this.fileMap,
        undefined,
        parentFile
      ).open();
    });

    // Delete option
    const deleteItem = menu.createDiv({ cls: "nk-card-menu-item nk-card-menu-item-danger" });
    deleteItem.setText(t("menu.delete"));
    deleteItem.addEventListener("click", () => {
      menu.remove();
      this.handleDeleteCard(filePath, fileName);
    });

    // Close menu when clicking elsewhere
    const closeHandler = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener("click", closeHandler, true);
      }
    };
    setTimeout(() => document.addEventListener("click", closeHandler, true), 0);
  }

  private async copyToClipboard(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      new Notice(t("notice.copied", { label }));
    } catch (err) {
      console.error(err);
      new Notice(t("notice.copyFailed"));
    }
  }

  private async handleDeleteCard(
    filePath: string,
    fileName: string
  ): Promise<void> {
    if (this.plugin.settings.skipDeleteConfirm) {
      await this.deleteFile(filePath, fileName);
    } else {
      new DeleteConfirmModal(this.app, this.plugin, fileName, async () => {
        await this.deleteFile(filePath, fileName);
      }).open();
    }
  }

  private async deleteFile(filePath: string, fileName: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) return;
    await this.plugin.detachOnDelete(file);
    await this.app.vault.trash(file, true);
    new Notice(t("notice.deleted", { name: fileName }));
  }

  /** Open a fuzzy picker of candidate parents (excludes self + descendants). */
  private async openParentSelect(childPath: string): Promise<void> {
    const child = this.app.vault.getAbstractFileByPath(childPath);
    if (!(child instanceof TFile)) return;

    // Exclude the child itself and its descendants to prevent cycles.
    const excluded = new Set<string>([child.path]);
    const allFiles = this.plugin.taskFiles();
    const queue: TFile[] = [child];
    while (queue.length > 0) {
      const node = queue.shift()!;
      const kids = await this.plugin.childrenOf(node, allFiles);
      for (const k of kids) {
        if (!excluded.has(k.path)) {
          excluded.add(k.path);
          queue.push(k);
        }
      }
    }

    const candidates = allFiles.filter((f) => !excluded.has(f.path));
    if (candidates.length === 0) {
      new Notice(t("notice.noParentCandidates"));
      return;
    }

    new ParentSelectModal(this.app, candidates, async (parent) => {
      if (await this.plugin.setParent(child, parent)) {
        new Notice(t("notice.parentSet", { child: child.basename, parent: parent.basename }));
        this.refresh();
      }
    }).open();
  }
}

// ============================================================
// Field Value Suggest
// ============================================================

/** Type-ahead for frontmatter values: suggests existing values while
 *  still allowing free text input for new ones. */
class FieldValueSuggest extends AbstractInputSuggest<string> {
  private values: string[];
  private textInputEl: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, values: string[]) {
    super(app, inputEl);
    this.textInputEl = inputEl;
    this.values = values;
  }

  getSuggestions(query: string): string[] {
    const q = query.toLowerCase();
    return this.values.filter((v) => v.toLowerCase().includes(q));
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(value);
  }

  selectSuggestion(value: string): void {
    this.setValue(value);
    // Notify the TextComponent so its onChange handler picks up the value
    this.textInputEl.dispatchEvent(new Event("input"));
    this.close();
  }
}

// ============================================================
// Parent Select Modal
// ============================================================

class ParentSelectModal extends FuzzySuggestModal<TFile> {
  private candidates: TFile[];
  private onChoose: (file: TFile) => void;

  constructor(app: App, candidates: TFile[], onChoose: (file: TFile) => void) {
    super(app);
    this.candidates = candidates;
    this.onChoose = onChoose;
    this.setPlaceholder(t("modal.selectParentPlaceholder"));
  }

  getItems(): TFile[] {
    return this.candidates;
  }

  getItemText(file: TFile): string {
    return file.basename;
  }

  onChooseItem(file: TFile): void {
    this.onChoose(file);
  }
}

// ============================================================
// Delete Confirm Modal
// ============================================================

class DeleteConfirmModal extends Modal {
  plugin: PropertyKanbanPlugin;
  fileName: string;
  onConfirm: () => Promise<void>;

  constructor(
    app: App,
    plugin: PropertyKanbanPlugin,
    fileName: string,
    onConfirm: () => Promise<void>
  ) {
    super(app);
    this.plugin = plugin;
    this.fileName = fileName;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nk-modal");

    contentEl.createEl("h3", { text: t("modal.deleteTitle") });
    contentEl.createEl("p", {
      text: t("modal.deleteMessage", { name: this.fileName }),
      cls: "nk-delete-msg",
    });

    // "Don't ask again" checkbox
    let skipNext = false;
    const checkRow = contentEl.createDiv({ cls: "nk-delete-check-row" });
    const checkLabel = checkRow.createEl("label", { cls: "nk-delete-check-label" });
    const checkbox = checkLabel.createEl("input");
    checkbox.type = "checkbox";
    checkbox.addClass("nk-delete-checkbox");
    checkLabel.createSpan({ text: t("modal.dontAskAgain") });
    checkbox.addEventListener("change", () => {
      skipNext = checkbox.checked;
    });

    // Buttons
    const btnRow = contentEl.createDiv({ cls: "nk-delete-btn-row" });

    const cancelBtn = btnRow.createEl("button", { text: t("modal.cancel") });
    cancelBtn.addEventListener("click", () => this.close());

    const deleteBtn = btnRow.createEl("button", {
      text: t("modal.delete"),
      cls: "nk-delete-confirm-btn",
    });
    deleteBtn.addEventListener("click", async () => {
      if (skipNext) {
        this.plugin.settings.skipDeleteConfirm = true;
        await this.plugin.saveSettings();
      }
      this.close();
      await this.onConfirm();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ============================================================
// Card Create Modal
// ============================================================

class CardCreateModal extends Modal {
  plugin: PropertyKanbanPlugin;
  onDone: () => void;
  defaultFieldValues: Record<string, string>;
  fileMap: Map<string, Record<string, string>>;

  private titleInput = "";
  private fieldValues: Record<string, string> = {};
  private fields: { field: string; label: string }[] = [];
  private selectedParent: TFile | null;

  constructor(
    app: App,
    plugin: PropertyKanbanPlugin,
    onDone: () => void,
    fileMap: Map<string, Record<string, string>>,
    defaultFieldValues?: Record<string, string>,
    defaultParent?: TFile
  ) {
    super(app);
    this.plugin = plugin;
    this.onDone = onDone;
    this.fileMap = fileMap;
    this.defaultFieldValues = defaultFieldValues ?? {};
    this.selectedParent = defaultParent ?? null;
  }

  /** Collect unique values for a field from existing tasks */
  private getFieldValues(field: string): string[] {
    const values = new Set<string>();
    for (const fm of this.fileMap.values()) {
      const v = fm[field];
      if (v && v !== "Invalid date") values.add(v);
    }
    return [...values].sort();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nk-modal");

    contentEl.createEl("h3", { text: t("modal.createTitle") });

    // Title
    new Setting(contentEl).setName(t("modal.titleName")).addText((text) => {
      text.setPlaceholder(t("modal.titlePlaceholder")).onChange((v) => {
        this.titleInput = v;
      });
      setTimeout(() => text.inputEl.focus(), 50);
    });

    // Input fields are driven by the configured card display properties
    // (plus the grouping fields), so the create form stays aligned with
    // what the board actually shows — not every stray frontmatter key.
    const createdField = this.plugin.settings.createdField;
    const { parentField, childrenField } = this.plugin.settings;

    const fields = this.fields;
    fields.length = 0;
    const pushField = (field: string, label?: string) => {
      if (!field || field === createdField) return;
        // Parent / child links are managed separately (see the parent row below);
      // never surface them as free-text form inputs.
      if (field === parentField || field === childrenField) return;
      if (fields.some((f) => f.field === field)) return;
      fields.push({ field, label: label || field });
    };
    // Grouping fields the column "+ Add card" button pre-fills
    pushField(this.plugin.settings.activeGroupField);
    pushField(this.plugin.settings.activeSubGroupField);
    // Configured card display properties
    for (const dp of this.plugin.settings.cardDisplayProperties) {
      pushField(dp.field, dp.label);
    }
    // Any explicitly provided defaults not already covered
    for (const field of Object.keys(this.defaultFieldValues)) {
      pushField(field);
    }

    for (const { field, label } of fields) {
      const existingValues = this.getFieldValues(field);

      // Text input with type-ahead over existing values, so users can pick
      // a known value or type a brand-new one.
      new Setting(contentEl).setName(label).addText((text) => {
        text.setPlaceholder(
          existingValues.length > 0
            ? t("modal.valuePlaceholderExisting")
            : t("modal.valuePlaceholderNew", { field })
        );
        if (this.defaultFieldValues[field]) {
          text.setValue(this.defaultFieldValues[field]);
          this.fieldValues[field] = this.defaultFieldValues[field];
        }
        text.onChange((v) => {
          this.fieldValues[field] = v;
        });
        if (existingValues.length > 0) {
          new FieldValueSuggest(this.app, text.inputEl, existingValues);
        }
      });
    }

    // Parent link row
    const parentSetting = new Setting(contentEl).setName(parentField);
    const renderParentControl = () => {
      parentSetting.setDesc(
        this.selectedParent
          ? t("modal.parentCurrent", { name: this.selectedParent.basename })
          : t("modal.parentNone")
      );
      parentSetting.controlEl.empty();
      parentSetting.addButton((btn) =>
        btn.setButtonText(this.selectedParent ? t("modal.changeParent") : t("modal.selectParent")).onClick(() => {
          const candidates = this.plugin
            .taskFiles()
            .filter((f) => f.path !== this.selectedParent?.path);
          new ParentSelectModal(this.app, candidates, (parent) => {
            this.selectedParent = parent;
            renderParentControl();
          }).open();
        })
      );
      if (this.selectedParent) {
        parentSetting.addExtraButton((btn) =>
          btn.setIcon("x").setTooltip(t("modal.clearParent")).onClick(() => {
            this.selectedParent = null;
            renderParentControl();
          })
        );
      }
    };
    renderParentControl();

    // Create button
    new Setting(contentEl).addButton((btn) => {
      btn.setButtonText(t("modal.create")).setCta().onClick(() => this.createCard());
    });
  }

  async createCard() {
    const title = this.titleInput.trim();
    if (!title) {
      new Notice(t("notice.titleRequired"));
      return;
    }

    const { settings } = this.plugin;
    const folder = settings.taskFolder;

    const existing = this.app.vault.getAbstractFileByPath(folder);
    if (!existing) {
      await this.app.vault.createFolder(folder);
    }

    const filePath = `${folder}/${title}.md`;

    if (this.app.vault.getAbstractFileByPath(filePath)) {
      new Notice(t("notice.duplicateTask"));
      return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Build frontmatter from the form fields. Fields left blank are still
    // written (as empty properties) so the card carries the configured
    // display properties from the start.
    const lines: string[] = ["---"];
    for (const { field } of this.fields) {
      const val = this.fieldValues[field] ?? "";
      lines.push(val ? `${field}: ${quoteIfNeeded(val)}` : `${field}:`);
    }
    // Parent link is applied after creation (keeps the parent's children
    // list in sync). Optionally emit an empty parent field as a placeholder.
    if (!this.selectedParent && settings.showEmptyParentField) {
      lines.push(`${settings.parentField}:`);
    }
    lines.push(`${settings.createdField}: ${dateStr}`);
    lines.push("---");
    lines.push("");

    const created = await this.app.vault.create(filePath, lines.join("\n"));
    if (this.selectedParent && created instanceof TFile) {
      await this.plugin.setParent(created, this.selectedParent);
    }
    new Notice(t("notice.created", { title }));
    this.close();
    setTimeout(() => this.onDone(), 200);
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ============================================================
// Settings Tab
// ============================================================

class PropertyKanbanSettingTab extends PluginSettingTab {
  plugin: PropertyKanbanPlugin;

  constructor(app: App, plugin: PropertyKanbanPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t("settings.taskFolder"))
      .setDesc(t("settings.taskFolderDesc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.taskFolder).onChange(async (v) => {
          this.plugin.settings.taskFolder = v;
          await this.plugin.saveSettings();
        })
      );

    // Quick action button
    new Setting(containerEl)
      .setName(t("settings.quickActionHeading"))
      .setDesc(t("settings.quickActionDesc"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.quickActionShow"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.quickActionEnabled).onChange(async (v) => {
          this.plugin.settings.quickActionEnabled = v;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.quickActionLabel"))
      .setDesc(t("settings.quickActionLabelDesc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.quickActionLabel).onChange(async (v) => {
          this.plugin.settings.quickActionLabel = v;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.quickActionField"))
      .setDesc(t("settings.quickActionFieldDesc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.quickActionField).onChange(async (v) => {
          this.plugin.settings.quickActionField = v;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.quickActionValue"))
      .setDesc(t("settings.quickActionValueDesc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.quickActionValue).onChange(async (v) => {
          this.plugin.settings.quickActionValue = v;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        })
      );

    // Parent / child hierarchy
    new Setting(containerEl)
      .setName(t("settings.hierarchyHeading"))
      .setDesc(t("settings.hierarchyDesc"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.parentField"))
      .setDesc(t("settings.parentFieldDesc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.parentField).onChange(async (v) => {
          this.plugin.settings.parentField = v.trim() || DEFAULT_SETTINGS.parentField;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.childrenField"))
      .setDesc(t("settings.childrenFieldDesc"))
      .addText((text) =>
        text.setValue(this.plugin.settings.childrenField).onChange(async (v) => {
          this.plugin.settings.childrenField = v.trim() || DEFAULT_SETTINGS.childrenField;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.maintainChildren"))
      .setDesc(t("settings.maintainChildrenDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.maintainChildrenList).onChange(async (v) => {
          this.plugin.settings.maintainChildrenList = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.showEmptyParent"))
      .setDesc(t("settings.showEmptyParentDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showEmptyParentField).onChange(async (v) => {
          this.plugin.settings.showEmptyParentField = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("settings.rebuildHierarchy"))
      .setDesc(t("settings.rebuildHierarchyDesc"))
      .addButton((btn) =>
        btn.setButtonText(t("settings.rebuild")).onClick(() => this.plugin.rebuildHierarchy())
      );

    // Card display properties
    new Setting(containerEl)
      .setName(t("settings.displayPropsHeading"))
      .setDesc(t("settings.displayPropsDesc"))
      .setHeading();

    const TAG_COLORS: TagColor[] = ["blue", "green", "red", "yellow", "purple", "gray"];

    const propsContainer = containerEl.createDiv();
    const renderProps = () => {
      propsContainer.empty();
      for (let i = 0; i < this.plugin.settings.cardDisplayProperties.length; i++) {
        const dp = this.plugin.settings.cardDisplayProperties[i];

        new Setting(propsContainer)
          .setName(dp.label || dp.field)
          .setDesc(t("settings.fieldLabel", { field: dp.field }))
          .addToggle((toggle) =>
            toggle.setValue(dp.enabled).onChange(async (v) => {
              dp.enabled = v;
              await this.plugin.saveSettings();
            })
          )
          .addDropdown((dd) => {
            for (const c of TAG_COLORS) {
              dd.addOption(c, c);
            }
            dd.setValue(dp.color);
            dd.onChange(async (v) => {
              dp.color = v as TagColor;
              await this.plugin.saveSettings();
            });
          })
          .addExtraButton((btn) =>
            btn.setIcon("trash").setTooltip(t("settings.deleteTooltip")).onClick(async () => {
              this.plugin.settings.cardDisplayProperties.splice(i, 1);
              await this.plugin.saveSettings();
              renderProps();
            })
          );
      }
    };

    renderProps();

    // Add new display property
    let newFieldInput: TextComponent | null = null;
    new Setting(containerEl)
      .setName(t("settings.addProperty"))
      .setDesc(t("settings.addPropertyDesc"))
      .addText((text) => {
        newFieldInput = text;
        text.setPlaceholder(t("settings.addPropertyPlaceholder"));
      })
      .addButton((btn) =>
        btn.setButtonText(t("settings.add")).onClick(async () => {
          const val = newFieldInput?.getValue().trim();
          if (!val) return;
          this.plugin.settings.cardDisplayProperties.push({
            field: val,
            label: val,
            enabled: true,
            color: "gray",
            prefix: "",
            hideInvalid: false,
          });
          await this.plugin.saveSettings();
          newFieldInput?.setValue("");
          renderProps();
        })
      );
  }
}
