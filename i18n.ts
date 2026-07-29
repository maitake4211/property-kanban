// ============================================================
// i18n — English is the default; Japanese and Chinese
// (Simplified / Traditional) are used when the Obsidian
// interface language is set accordingly.
// ============================================================

import { getLanguage } from "obsidian";

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
  "popover.sort": "Sorting",
  "popover.sortProperty": "Property",
  "popover.sortOrder": "Order",
  "popover.sortAsc": "Ascending",
  "popover.sortDesc": "Descending",
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
  "notice.samplesSeeded": "Created sample tasks in \"{folder}\". Feel free to edit or delete them.",

  // Sample tasks seeded on first board open
  "sample.categoryValue": "Tutorial",
  "sample.projectA": "Sample project A",
  "sample.projectB": "Sample project B",
  "sample.title1": "1. Try moving this card",
  "sample.body1":
    "This is a sample card. Every card on the board is a regular Markdown note in the `{folder}` folder.\n\n" +
    "- Drag this card to another column — the `{field}` property of this note updates instantly\n" +
    "- Click the card title on the board to open the note\n" +
    "- The tags on the card show the frontmatter properties above\n\n" +
    "You can delete the sample cards whenever you like (`⋯` menu on the card → Delete).",
  "sample.title2": "2. Add your own tasks",
  "sample.body2":
    "Create new tasks from the \"+ New task\" button at the top of the board, or \"+ Add card\" at the bottom of each column.\n\n" +
    "- The create form suggests values already used by other cards, and you can type new values freely\n" +
    "- Editing the frontmatter of this note directly also updates the board immediately\n" +
    "- Deleting or moving the note removes the card from the board",
  "sample.title3": "3. Make it your own",
  "sample.body3":
    "The board adapts to your own property names and values.\n\n" +
    "- Columns are generated automatically from the values your notes actually use — rename a `{field}` value in a note and the column follows\n" +
    "- The ⚙ button on the board switches the grouping property (lane/column), sorting, column visibility, and zoom\n" +
    "- Settings → Property Kanban → \"Card display properties\" chooses which properties appear on cards, with colors",
  "sample.title4": "4. How swimlanes work",
  "sample.body4":
    "The board opens in swimlane view: one row per `project` (Sample project A / Sample project B), with `{field}` columns inside each row.\n\n" +
    "- Dragging a card across lanes updates both `project` and `{field}` at once\n" +
    "- Any two frontmatter properties can be combined — pick them under ⚙ → Grouping (Lane / Column)\n" +
    "- For a simple one-dimensional board, set Lane to `{field}` and Column to \"None\"",

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
  "settings.addFromFolder": "Add from task folder",
  "settings.addFromFolderDesc": "Pick a frontmatter field found in notes in the task folder.",
  "settings.noNewFields": "No new fields found",
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
  "popover.sort": "並び替え",
  "popover.sortProperty": "プロパティ",
  "popover.sortOrder": "順序",
  "popover.sortAsc": "昇順",
  "popover.sortDesc": "降順",
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
  "notice.samplesSeeded": "サンプルタスクを「{folder}」に作成しました。自由に編集・削除できます。",

  "sample.categoryValue": "チュートリアル",
  "sample.projectA": "サンプル案件A",
  "sample.projectB": "サンプル案件B",
  "sample.title1": "1. カードを動かしてみる",
  "sample.body1":
    "これはサンプルカードです。ボード上のカードは、`{folder}` フォルダ内の普通のMarkdownノートです。\n\n" +
    "- このカードを別の列へドラッグ&ドロップしてみてください。このノートの `{field}` プロパティが即座に書き換わります\n" +
    "- ボード上のカードタイトルをクリックすると、このノートが開きます\n" +
    "- カード上のタグは、上のfrontmatterプロパティの値です\n\n" +
    "サンプルカードは不要になったら自由に削除してください（カードの `⋯` メニュー →「削除」）。",
  "sample.title2": "2. タスクを追加する",
  "sample.body2":
    "新しいタスクは、ボード上部の「+ 新規タスク」または各列下部の「+ カード追加」から作成できます。\n\n" +
    "- 作成フォームには他のカードで使われている値がサジェストされ、新しい値も自由に入力できます\n" +
    "- このノートのfrontmatterを直接編集しても、ボードに即座に反映されます\n" +
    "- ノートを削除・移動すると、カードもボードから消えます",
  "sample.title3": "3. 自分の運用に合わせる",
  "sample.body3":
    "ボードは自分のプロパティ名・値に合わせてカスタマイズできます。\n\n" +
    "- 列はノートが実際に使っている値から自動生成されます。ノート側で `{field}` の値を変えれば列も変わります\n" +
    "- ボード右上の ⚙ から、グルーピングに使うプロパティ（レーン/カラム）・並び替え・列の表示/非表示・ズームを変更できます\n" +
    "- 設定 → Property Kanban →「カード表示プロパティ」でカード上に表示する項目と色を選べます",
  "sample.title4": "4. スイムレーンの仕組み",
  "sample.body4":
    "ボードは初期状態でスイムレーン表示です。`project` ごとの行（サンプル案件A / サンプル案件B）に分かれ、行の中が `{field}` の列になっています。\n\n" +
    "- レーンをまたいでカードをドラッグすると、`project` と `{field}` が同時に更新されます\n" +
    "- 組み合わせは自由です。ボード右上の ⚙ →「グループ」でレーン/カラムに使うプロパティを切り替えられます\n" +
    "- 1次元のシンプルなボードにしたい時は、レーンを `{field}`、カラムを「なし」にしてください",

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
  "settings.addFromFolder": "タスクフォルダから追加",
  "settings.addFromFolderDesc": "タスクフォルダ内のノートで使われているfrontmatterフィールドから選択。",
  "settings.noNewFields": "追加できるフィールドがありません",
  "settings.addProperty": "プロパティを追加",
  "settings.addPropertyDesc": "frontmatterのフィールド名を入力。",
  "settings.addPropertyPlaceholder": "例: 担当者",
  "settings.add": "追加",
};

const zh: typeof en = {
  "ribbon.open": "打开 Property Kanban",
  "command.openBoard": "打开看板",
  "command.rebuildHierarchy": "重建父子链接",

  "view.title": "Property Kanban",

  "board.newTask": "+ 新建任务",
  "board.viewSettings": "看板设置",
  "board.addCard": "+ 添加卡片",

  "popover.group": "分组",
  "popover.sort": "排序",
  "popover.sortProperty": "属性",
  "popover.sortOrder": "顺序",
  "popover.sortAsc": "升序",
  "popover.sortDesc": "降序",
  "popover.zoom": "缩放",
  "popover.cardProperties": "卡片显示属性",
  "popover.columnOrder": "列排序与显示",
  "popover.openPluginSettings": "打开插件设置…",
  "popover.noFields": "没有可用的字段",
  "popover.lane": "泳道",
  "popover.column": "列",
  "popover.none": "无",
  "popover.noDisplayProps": "尚未配置显示属性",
  "popover.laneSection": "泳道：{field}",
  "popover.columnSection": "列：{field}",
  "popover.reset": "重置",

  "menu.copyPath": "复制路径",
  "menu.vaultPath": "仓库路径",
  "menu.obsidianLink": "Obsidian 链接",
  "menu.obsidianUrl": "Obsidian URL",
  "menu.systemPath": "系统路径",
  "menu.setParent": "设置父任务…",
  "menu.clearParent": "移除父任务",
  "menu.addChild": "添加子任务…",
  "menu.delete": "删除",

  "modal.selectParentPlaceholder": "选择父任务",
  "modal.deleteTitle": "删除任务",
  "modal.deleteMessage": "确定删除「{name}」？笔记将被移至回收站。",
  "modal.dontAskAgain": "不再询问",
  "modal.cancel": "取消",
  "modal.delete": "删除",
  "modal.createTitle": "新建任务",
  "modal.titleName": "标题",
  "modal.titlePlaceholder": "输入任务名称",
  "modal.valuePlaceholderExisting": "选择或输入新值",
  "modal.valuePlaceholderNew": "输入 {field}",
  "modal.parentNone": "无父任务",
  "modal.parentCurrent": "父任务：{name}",
  "modal.changeParent": "更改",
  "modal.selectParent": "选择父任务",
  "modal.clearParent": "清除",
  "modal.create": "创建",

  "notice.cannotParentSelf": "笔记不能作为自己的父任务",
  "notice.cyclicParent": "不能创建循环的父子关系",
  "notice.noFrontmatter": "无法设置父任务：笔记没有 frontmatter",
  "notice.hierarchyRebuilt": "已重建父子链接（更新了 {count} 个笔记）",
  "notice.cardMoved": "「{name}」→ {dest}",
  "notice.quickAction": "「{name}」：{field} → {value}",
  "notice.systemPathUnavailable": "当前环境无法获取系统路径",
  "notice.parentCleared": "已移除「{name}」的父任务",
  "notice.copied": "{label}已复制到剪贴板",
  "notice.copyFailed": "复制到剪贴板失败",
  "notice.deleted": "「{name}」已移至回收站",
  "notice.noParentCandidates": "没有可选的父任务",
  "notice.parentSet": "已将「{child}」的父任务设为「{parent}」",
  "notice.titleRequired": "请输入标题",
  "notice.duplicateTask": "已存在同名任务",
  "notice.created": "已创建「{title}」",
  "notice.samplesSeeded": "已在「{folder}」中创建示例任务，可随意编辑或删除。",

  "sample.categoryValue": "教程",
  "sample.projectA": "示例项目A",
  "sample.projectB": "示例项目B",
  "sample.title1": "1. 试着移动这张卡片",
  "sample.body1":
    "这是一张示例卡片。看板上的每张卡片都是 `{folder}` 文件夹中的普通 Markdown 笔记。\n\n" +
    "- 把这张卡片拖到其他列，本笔记的 `{field}` 属性会立即更新\n" +
    "- 点击看板上的卡片标题即可打开笔记\n" +
    "- 卡片上的标签显示的是上方的 frontmatter 属性\n\n" +
    "不再需要示例卡片时可以随时删除（卡片的 `⋯` 菜单 →「删除」）。",
  "sample.title2": "2. 添加自己的任务",
  "sample.body2":
    "可以通过看板顶部的「+ 新建任务」或每列底部的「+ 添加卡片」创建新任务。\n\n" +
    "- 创建表单会提示其他卡片已使用的值，也可以自由输入新值\n" +
    "- 直接编辑本笔记的 frontmatter 也会立即反映到看板\n" +
    "- 删除或移动笔记后，卡片也会从看板上消失",
  "sample.title3": "3. 按自己的方式使用",
  "sample.body3":
    "看板可以适配你自己的属性名和属性值。\n\n" +
    "- 列是根据笔记实际使用的值自动生成的。在笔记中修改 `{field}` 的值，列也会随之变化\n" +
    "- 通过看板右上角的 ⚙ 可以切换分组属性（泳道/列）、排序、列的显示/隐藏和缩放\n" +
    "- 在 设置 → Property Kanban →「卡片显示属性」中选择卡片上显示的属性及其颜色",
  "sample.title4": "4. 泳道的工作方式",
  "sample.body4":
    "看板默认以泳道视图打开：每个 `project` 一行（示例项目A / 示例项目B），行内是 `{field}` 的列。\n\n" +
    "- 跨泳道拖动卡片时，`project` 和 `{field}` 会同时更新\n" +
    "- 任意两个 frontmatter 属性都可以组合，在 ⚙ →「分组」（泳道/列）中选择\n" +
    "- 想要简单的一维看板时，把泳道设为 `{field}`、列设为「无」",

  "settings.taskFolder": "任务文件夹",
  "settings.taskFolderDesc": "存放任务笔记的文件夹路径。",
  "settings.quickActionHeading": "快捷操作按钮",
  "settings.quickActionDesc": "在卡片上显示一个按钮，一键将属性设置为预设值。",
  "settings.quickActionShow": "显示按钮",
  "settings.quickActionLabel": "按钮文字",
  "settings.quickActionLabelDesc": "卡片上显示的文字（例如 Done）。",
  "settings.quickActionField": "目标字段",
  "settings.quickActionFieldDesc": "要更新的 frontmatter 字段。",
  "settings.quickActionValue": "设置的值",
  "settings.quickActionValueDesc": "点击按钮时写入字段的值。",
  "settings.hierarchyHeading": "父子关系",
  "settings.hierarchyDesc": "以 frontmatter wikilink 管理卡片之间的父子关系。子笔记的父链接是权威数据，父笔记的子列表自动生成，因此可以在 Obsidian 的关系图中追踪层级。",
  "settings.parentField": "父字段名",
  "settings.parentFieldDesc": "写入子笔记的父链接 frontmatter 字段名。",
  "settings.childrenField": "子字段名",
  "settings.childrenFieldDesc": "在父笔记上自动生成的子列表 frontmatter 字段名。",
  "settings.maintainChildren": "自动维护子列表",
  "settings.maintainChildrenDesc": "在父笔记上维护子任务的 wikilink 列表。关闭后仅写入单向的父链接。",
  "settings.showEmptyParent": "为新卡片添加空的父字段",
  "settings.showEmptyParentDesc": "即使创建卡片时未指定父任务，也写入空的父字段。",
  "settings.rebuildHierarchy": "重建父子链接",
  "settings.rebuildHierarchyDesc": "以父链接（权威数据）为准，重新生成所有子列表。",
  "settings.rebuild": "重建",
  "settings.displayPropsHeading": "卡片显示属性",
  "settings.displayPropsDesc": "配置卡片上显示哪些 frontmatter 属性。",
  "settings.fieldLabel": "字段：{field}",
  "settings.deleteTooltip": "删除",
  "settings.addFromFolder": "从任务文件夹添加",
  "settings.addFromFolderDesc": "从任务文件夹的笔记中检测到的 frontmatter 字段中选择。",
  "settings.noNewFields": "没有可添加的字段",
  "settings.addProperty": "添加属性",
  "settings.addPropertyDesc": "输入 frontmatter 字段名。",
  "settings.addPropertyPlaceholder": "例如：assignee",
  "settings.add": "添加",
};

const zhTW: typeof en = {
  "ribbon.open": "開啟 Property Kanban",
  "command.openBoard": "開啟看板",
  "command.rebuildHierarchy": "重建父子連結",

  "view.title": "Property Kanban",

  "board.newTask": "+ 新增任務",
  "board.viewSettings": "看板設定",
  "board.addCard": "+ 新增卡片",

  "popover.group": "分組",
  "popover.sort": "排序",
  "popover.sortProperty": "屬性",
  "popover.sortOrder": "順序",
  "popover.sortAsc": "遞增",
  "popover.sortDesc": "遞減",
  "popover.zoom": "縮放",
  "popover.cardProperties": "卡片顯示屬性",
  "popover.columnOrder": "欄位排序與顯示",
  "popover.openPluginSettings": "開啟外掛程式設定…",
  "popover.noFields": "沒有可用的欄位",
  "popover.lane": "泳道",
  "popover.column": "欄",
  "popover.none": "無",
  "popover.noDisplayProps": "尚未設定顯示屬性",
  "popover.laneSection": "泳道：{field}",
  "popover.columnSection": "欄：{field}",
  "popover.reset": "重設",

  "menu.copyPath": "複製路徑",
  "menu.vaultPath": "儲存庫路徑",
  "menu.obsidianLink": "Obsidian 連結",
  "menu.obsidianUrl": "Obsidian URL",
  "menu.systemPath": "系統路徑",
  "menu.setParent": "設定父任務…",
  "menu.clearParent": "移除父任務",
  "menu.addChild": "新增子任務…",
  "menu.delete": "刪除",

  "modal.selectParentPlaceholder": "選擇父任務",
  "modal.deleteTitle": "刪除任務",
  "modal.deleteMessage": "確定刪除「{name}」？筆記將移至垃圾桶。",
  "modal.dontAskAgain": "不再詢問",
  "modal.cancel": "取消",
  "modal.delete": "刪除",
  "modal.createTitle": "建立新任務",
  "modal.titleName": "標題",
  "modal.titlePlaceholder": "輸入任務名稱",
  "modal.valuePlaceholderExisting": "選擇或輸入新值",
  "modal.valuePlaceholderNew": "輸入 {field}",
  "modal.parentNone": "無父任務",
  "modal.parentCurrent": "父任務：{name}",
  "modal.changeParent": "變更",
  "modal.selectParent": "選擇父任務",
  "modal.clearParent": "清除",
  "modal.create": "建立",

  "notice.cannotParentSelf": "筆記不能作為自己的父任務",
  "notice.cyclicParent": "不能建立循環的父子關係",
  "notice.noFrontmatter": "無法設定父任務：筆記沒有 frontmatter",
  "notice.hierarchyRebuilt": "已重建父子連結（更新了 {count} 個筆記）",
  "notice.cardMoved": "「{name}」→ {dest}",
  "notice.quickAction": "「{name}」：{field} → {value}",
  "notice.systemPathUnavailable": "目前環境無法取得系統路徑",
  "notice.parentCleared": "已移除「{name}」的父任務",
  "notice.copied": "{label}已複製到剪貼簿",
  "notice.copyFailed": "複製到剪貼簿失敗",
  "notice.deleted": "「{name}」已移至垃圾桶",
  "notice.noParentCandidates": "沒有可選的父任務",
  "notice.parentSet": "已將「{child}」的父任務設為「{parent}」",
  "notice.titleRequired": "請輸入標題",
  "notice.duplicateTask": "已存在同名任務",
  "notice.created": "已建立「{title}」",
  "notice.samplesSeeded": "已在「{folder}」中建立範例任務，可隨意編輯或刪除。",

  "sample.categoryValue": "教學",
  "sample.projectA": "範例專案A",
  "sample.projectB": "範例專案B",
  "sample.title1": "1. 試著移動這張卡片",
  "sample.body1":
    "這是一張範例卡片。看板上的每張卡片都是 `{folder}` 資料夾中的普通 Markdown 筆記。\n\n" +
    "- 把這張卡片拖曳到其他欄，本筆記的 `{field}` 屬性會立即更新\n" +
    "- 點擊看板上的卡片標題即可開啟筆記\n" +
    "- 卡片上的標籤顯示的是上方的 frontmatter 屬性\n\n" +
    "不再需要範例卡片時可以隨時刪除（卡片的 `⋯` 選單 →「刪除」）。",
  "sample.title2": "2. 新增自己的任務",
  "sample.body2":
    "可以透過看板頂部的「+ 新增任務」或每欄底部的「+ 新增卡片」建立新任務。\n\n" +
    "- 建立表單會提示其他卡片已使用的值，也可以自由輸入新值\n" +
    "- 直接編輯本筆記的 frontmatter 也會立即反映到看板\n" +
    "- 刪除或移動筆記後，卡片也會從看板上消失",
  "sample.title3": "3. 依自己的方式使用",
  "sample.body3":
    "看板可以配合你自己的屬性名稱和屬性值。\n\n" +
    "- 欄是根據筆記實際使用的值自動產生的。在筆記中修改 `{field}` 的值，欄也會隨之變化\n" +
    "- 透過看板右上角的 ⚙ 可以切換分組屬性（泳道/欄）、排序、欄的顯示/隱藏和縮放\n" +
    "- 在 設定 → Property Kanban →「卡片顯示屬性」中選擇卡片上顯示的屬性及其顏色",
  "sample.title4": "4. 泳道的運作方式",
  "sample.body4":
    "看板預設以泳道檢視開啟：每個 `project` 一列（範例專案A / 範例專案B），列內是 `{field}` 的欄。\n\n" +
    "- 跨泳道拖曳卡片時，`project` 和 `{field}` 會同時更新\n" +
    "- 任意兩個 frontmatter 屬性都可以組合，在 ⚙ →「分組」（泳道/欄）中選擇\n" +
    "- 想要簡單的一維看板時，把泳道設為 `{field}`、欄設為「無」",

  "settings.taskFolder": "任務資料夾",
  "settings.taskFolderDesc": "存放任務筆記的資料夾路徑。",
  "settings.quickActionHeading": "快速操作按鈕",
  "settings.quickActionDesc": "在卡片上顯示一個按鈕，一鍵將屬性設為預設值。",
  "settings.quickActionShow": "顯示按鈕",
  "settings.quickActionLabel": "按鈕文字",
  "settings.quickActionLabelDesc": "卡片上顯示的文字（例如 Done）。",
  "settings.quickActionField": "目標欄位",
  "settings.quickActionFieldDesc": "要更新的 frontmatter 欄位。",
  "settings.quickActionValue": "設定的值",
  "settings.quickActionValueDesc": "點擊按鈕時寫入欄位的值。",
  "settings.hierarchyHeading": "父子關係",
  "settings.hierarchyDesc": "以 frontmatter wikilink 管理卡片之間的父子關係。子筆記的父連結是權威資料，父筆記的子清單自動產生，因此可以在 Obsidian 的關聯圖中追蹤層級。",
  "settings.parentField": "父欄位名稱",
  "settings.parentFieldDesc": "寫入子筆記的父連結 frontmatter 欄位名稱。",
  "settings.childrenField": "子欄位名稱",
  "settings.childrenFieldDesc": "在父筆記上自動產生的子清單 frontmatter 欄位名稱。",
  "settings.maintainChildren": "自動維護子清單",
  "settings.maintainChildrenDesc": "在父筆記上維護子任務的 wikilink 清單。關閉後僅寫入單向的父連結。",
  "settings.showEmptyParent": "為新卡片加入空的父欄位",
  "settings.showEmptyParentDesc": "即使建立卡片時未指定父任務，也寫入空的父欄位。",
  "settings.rebuildHierarchy": "重建父子連結",
  "settings.rebuildHierarchyDesc": "以父連結（權威資料）為準，重新產生所有子清單。",
  "settings.rebuild": "重建",
  "settings.displayPropsHeading": "卡片顯示屬性",
  "settings.displayPropsDesc": "設定卡片上顯示哪些 frontmatter 屬性。",
  "settings.fieldLabel": "欄位：{field}",
  "settings.deleteTooltip": "刪除",
  "settings.addFromFolder": "從任務資料夾新增",
  "settings.addFromFolderDesc": "從任務資料夾的筆記中偵測到的 frontmatter 欄位中選擇。",
  "settings.noNewFields": "沒有可新增的欄位",
  "settings.addProperty": "新增屬性",
  "settings.addPropertyDesc": "輸入 frontmatter 欄位名稱。",
  "settings.addPropertyPlaceholder": "例如：assignee",
  "settings.add": "新增",
};

export type TranslationKey = keyof typeof en;

const LOCALES: Record<string, typeof en> = { en, ja, zh, "zh-TW": zhTW };

/** Resolve the dictionary for the current Obsidian interface language. */
function currentLocale(): typeof en {
  return LOCALES[getLanguage()] ?? en;
}

/** Translate a key, substituting `{name}` placeholders from vars. */
export function t(
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  let text: string = currentLocale()[key] ?? en[key];
  if (vars) {
    for (const name of Object.keys(vars)) {
      text = text.split(`{${name}}`).join(String(vars[name]));
    }
  }
  return text;
}
