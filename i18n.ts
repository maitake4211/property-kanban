// ============================================================
// i18n — English is the default; Japanese is used when the
// Obsidian interface language is set to 日本語.
// ============================================================

const en = {
  // Ribbon / commands
  "ribbon.open": "Open property kanban",
  "command.openBoard": "Open board",
  "command.rebuildHierarchy": "Rebuild parent/child links",

  // View
  "view.title": "Property Kanban",

  // Board
  "board.newTask": "+ New task",
  "board.viewSettings": "Board options",
  "board.addCard": "+ Add card",

  // Settings popover
  "popover.group": "Grouping",
  "popover.zoom": "Zoom",
  "popover.cardProperties": "Card properties",
  "popover.columnOrder": "Column order & visibility",
  "popover.openPluginSettings": "Open plugin settings…",
  "popover.noFields": "No fields available",
  "popover.lane": "Lane",
  "popover.column": "Column",
  "popover.none": "None",
  "popover.noDisplayProps": "No display properties configured",
  "popover.laneSection": "Lane: {field}",
  "popover.columnSection": "Column: {field}",
  "popover.reset": "Reset",

  // Card menu
  "menu.copyPath": "Copy path",
  "menu.vaultPath": "Vault path",
  "menu.obsidianLink": "Obsidian link",
  "menu.obsidianUrl": "Obsidian URL",
  "menu.systemPath": "System path",
  "menu.setParent": "Set parent…",
  "menu.clearParent": "Remove parent",
  "menu.addChild": "Add child…",
  "menu.delete": "Delete",

  // Modals
  "modal.selectParentPlaceholder": "Select a parent task",
  "modal.deleteTitle": "Delete task",
  "modal.deleteMessage": "Delete \"{name}\"? The note will be moved to the trash.",
  "modal.dontAskAgain": "Don't ask again",
  "modal.cancel": "Cancel",
  "modal.delete": "Delete",
  "modal.createTitle": "Create new task",
  "modal.titleName": "Title",
  "modal.titlePlaceholder": "Enter a task name",
  "modal.valuePlaceholderExisting": "Select or type a new value",
  "modal.valuePlaceholderNew": "Enter {field}",
  "modal.parentNone": "No parent task",
  "modal.parentCurrent": "Parent: {name}",
  "modal.changeParent": "Change",
  "modal.selectParent": "Select parent",
  "modal.clearParent": "Clear",
  "modal.create": "Create",

  // Notices
  "notice.cannotParentSelf": "A note cannot be its own parent",
  "notice.cyclicParent": "Cannot create a cyclic parent/child relationship",
  "notice.noFrontmatter": "Cannot set parent: the note has no frontmatter",
  "notice.hierarchyRebuilt": "Rebuilt parent/child links ({count} notes updated)",
  "notice.cardMoved": "\"{name}\" → {dest}",
  "notice.quickAction": "\"{name}\": {field} → {value}",
  "notice.systemPathUnavailable": "The system path is not available in this environment",
  "notice.parentCleared": "Removed the parent of \"{name}\"",
  "notice.copied": "{label} copied to clipboard",
  "notice.copyFailed": "Failed to copy to clipboard",
  "notice.deleted": "\"{name}\" moved to trash",
  "notice.noParentCandidates": "No candidate parent notes available",
  "notice.parentSet": "Set the parent of \"{child}\" to \"{parent}\"",
  "notice.titleRequired": "Enter a title",
  "notice.duplicateTask": "A task with the same name already exists",
  "notice.created": "Created \"{title}\"",

  // Settings tab
  "settings.taskFolder": "Task folder",
  "settings.taskFolderDesc": "Folder path where task notes are stored.",
  "settings.quickActionHeading": "Quick action button",
  "settings.quickActionDesc": "Show a button on each card that instantly sets a property to a preset value.",
  "settings.quickActionShow": "Show button",
  "settings.quickActionLabel": "Button label",
  "settings.quickActionLabelDesc": "Text shown on the card (e.g. Done).",
  "settings.quickActionField": "Target field",
  "settings.quickActionFieldDesc": "Frontmatter field to update.",
  "settings.quickActionValue": "Value to set",
  "settings.quickActionValueDesc": "Value written to the field when the button is clicked.",
  "settings.hierarchyHeading": "Parent/child links",
  "settings.hierarchyDesc": "Manage parent/child relationships between cards as frontmatter wikilinks. The child's parent link is the source of truth; the parent's children list is generated automatically, so you can follow the hierarchy in Obsidian's graph view.",
  "settings.parentField": "Parent field name",
  "settings.parentFieldDesc": "Frontmatter field written to child notes for the parent link.",
  "settings.childrenField": "Children field name",
  "settings.childrenFieldDesc": "Frontmatter field auto-generated on parent notes for the children list.",
  "settings.maintainChildren": "Maintain children list",
  "settings.maintainChildrenDesc": "Keep a wikilink list of children on parent notes. When off, only the one-way parent link is written.",
  "settings.showEmptyParent": "Add empty parent field to new cards",
  "settings.showEmptyParentDesc": "Write an empty parent field even when a card is created without a parent.",
  "settings.rebuildHierarchy": "Rebuild parent/child links",
  "settings.rebuildHierarchyDesc": "Regenerate all children lists from the parent links (source of truth).",
  "settings.rebuild": "Rebuild",
  "settings.displayPropsHeading": "Card display properties",
  "settings.displayPropsDesc": "Configure which frontmatter properties are shown on cards.",
  "settings.fieldLabel": "Field: {field}",
  "settings.deleteTooltip": "Delete",
  "settings.addProperty": "Add property",
  "settings.addPropertyDesc": "Enter a frontmatter field name.",
  "settings.addPropertyPlaceholder": "e.g. assignee",
  "settings.add": "Add",
};

const ja: typeof en = {
  "ribbon.open": "Property Kanbanを開く",
  "command.openBoard": "ボードを開く",
  "command.rebuildHierarchy": "親子リンクを再構築",

  "view.title": "Property Kanban",

  "board.newTask": "+ 新規タスク",
  "board.viewSettings": "ビュー設定",
  "board.addCard": "+ カード追加",

  "popover.group": "グループ",
  "popover.zoom": "ズーム",
  "popover.cardProperties": "カードに表示する項目",
  "popover.columnOrder": "列の並び替え・表示",
  "popover.openPluginSettings": "プラグイン設定を開く…",
  "popover.noFields": "利用可能なフィールドがありません",
  "popover.lane": "レーン",
  "popover.column": "カラム",
  "popover.none": "なし",
  "popover.noDisplayProps": "表示プロパティが登録されていません",
  "popover.laneSection": "レーン「{field}」",
  "popover.columnSection": "カラム「{field}」",
  "popover.reset": "リセット",

  "menu.copyPath": "パスをコピー",
  "menu.vaultPath": "Vault相対パス",
  "menu.obsidianLink": "Obsidianリンク形式",
  "menu.obsidianUrl": "Obsidian URL",
  "menu.systemPath": "システムフルパス",
  "menu.setParent": "親を設定…",
  "menu.clearParent": "親を解除",
  "menu.addChild": "子を追加…",
  "menu.delete": "削除",

  "modal.selectParentPlaceholder": "親にするタスクを選択",
  "modal.deleteTitle": "タスクの削除",
  "modal.deleteMessage": "「{name}」を削除しますか？ノートはゴミ箱に移動されます。",
  "modal.dontAskAgain": "次回から確認しない",
  "modal.cancel": "キャンセル",
  "modal.delete": "削除",
  "modal.createTitle": "新規タスク作成",
  "modal.titleName": "タイトル",
  "modal.titlePlaceholder": "タスク名を入力",
  "modal.valuePlaceholderExisting": "選択または新規入力",
  "modal.valuePlaceholderNew": "{field}を入力",
  "modal.parentNone": "親タスクなし",
  "modal.parentCurrent": "親: {name}",
  "modal.changeParent": "変更",
  "modal.selectParent": "親を選択",
  "modal.clearParent": "解除",
  "modal.create": "作成",

  "notice.cannotParentSelf": "自分自身を親にはできません",
  "notice.cyclicParent": "循環する親子関係は設定できません",
  "notice.noFrontmatter": "frontmatter がないため親を設定できません",
  "notice.hierarchyRebuilt": "親子リンクを再構築しました（{count}件更新）",
  "notice.cardMoved": "「{name}」→ {dest}",
  "notice.quickAction": "「{name}」: {field} → {value}",
  "notice.systemPathUnavailable": "システムフルパスはこの環境では取得できません",
  "notice.parentCleared": "「{name}」の親を解除しました",
  "notice.copied": "{label}をコピーしました",
  "notice.copyFailed": "クリップボードへのコピーに失敗しました",
  "notice.deleted": "「{name}」を削除しました",
  "notice.noParentCandidates": "設定できる親候補がありません",
  "notice.parentSet": "「{child}」の親を「{parent}」に設定しました",
  "notice.titleRequired": "タイトルを入力してください",
  "notice.duplicateTask": "同名のタスクが既に存在します",
  "notice.created": "「{title}」を作成しました",

  "settings.taskFolder": "タスクフォルダ",
  "settings.taskFolderDesc": "タスクノートを保存するフォルダパス。",
  "settings.quickActionHeading": "クイックアクションボタン",
  "settings.quickActionDesc": "カード上にプロパティを即座に書き換えるボタンを表示します。",
  "settings.quickActionShow": "ボタンを表示",
  "settings.quickActionLabel": "ボタンのラベル",
  "settings.quickActionLabelDesc": "カードに表示する文字（例: 完了）。",
  "settings.quickActionField": "対象フィールド",
  "settings.quickActionFieldDesc": "書き換えるfrontmatterフィールド名。",
  "settings.quickActionValue": "設定する値",
  "settings.quickActionValueDesc": "ボタン押下時にフィールドにセットされる値。",
  "settings.hierarchyHeading": "親子関係",
  "settings.hierarchyDesc": "カード同士の親子関係をfrontmatterのwikilinkで管理します。子ノートの親リンクが正データで、親ノートの子リストは自動生成されます（Obsidianのグラフビューで親子を追えます）。",
  "settings.parentField": "親フィールド名",
  "settings.parentFieldDesc": "子ノートに書き込む親リンクのfrontmatterフィールド名。",
  "settings.childrenField": "子フィールド名",
  "settings.childrenFieldDesc": "親ノートに自動生成する子リストのfrontmatterフィールド名。",
  "settings.maintainChildren": "子リストを自動生成",
  "settings.maintainChildrenDesc": "親ノートに子のwikilinkリストを維持します。OFFにすると親リンク（片方向）のみになります。",
  "settings.showEmptyParent": "新規カードに空の親欄を出す",
  "settings.showEmptyParentDesc": "親を指定せずに作成したカードにも、空の親フィールドを書き込みます。",
  "settings.rebuildHierarchy": "親子リンクを再構築",
  "settings.rebuildHierarchyDesc": "全ノートの親リンクを正として、子リストを一括で再生成します。",
  "settings.rebuild": "再構築",
  "settings.displayPropsHeading": "カード表示プロパティ",
  "settings.displayPropsDesc": "カード上に表示するfrontmatterプロパティを設定します。",
  "settings.fieldLabel": "フィールド: {field}",
  "settings.deleteTooltip": "削除",
  "settings.addProperty": "プロパティを追加",
  "settings.addPropertyDesc": "frontmatterのフィールド名を入力。",
  "settings.addPropertyPlaceholder": "例: 担当者",
  "settings.add": "追加",
};

export type TranslationKey = keyof typeof en;

const LOCALES: Record<string, typeof en> = { en, ja };

/** Obsidian stores the interface language in localStorage ("language"). */
function currentLocale(): typeof en {
  const lang = window.localStorage.getItem("language") ?? "en";
  return LOCALES[lang] ?? en;
}

/** Translate a key, substituting `{name}` placeholders from vars. */
export function t(
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let text: string = currentLocale()[key] ?? en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
