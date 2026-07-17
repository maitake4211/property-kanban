import {
  parseFrontmatter,
  updateFrontmatterContent,
  quoteIfNeeded,
  parseWikiLink,
  formatWikiLink,
  setListField,
  removeFrontmatterField,
  buildFrontmatter,
  getCardsForColumn,
  collectAllFields,
  resolveAllColumns,
  isColumnHidden,
} from "./utils";

// ============================================================
// parseFrontmatter
// ============================================================

describe("parseFrontmatter", () => {
  it("基本的なfrontmatterをパースできる", () => {
    const content = `---
ステータス: 未着手
カテゴリ: 開発
案件: beta
---
本文`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      ステータス: "未着手",
      カテゴリ: "開発",
      案件: "beta",
    });
  });

  it("ダブルクォートで囲まれた値のクォートを除去する", () => {
    const content = `---
ステータス: "Pending: blocked"
---`;
    const result = parseFrontmatter(content);
    expect(result["ステータス"]).toBe("Pending: blocked");
  });

  it("シングルクォートで囲まれた値のクォートを除去する", () => {
    const content = `---
ステータス: 'Pending: review'
---`;
    const result = parseFrontmatter(content);
    expect(result["ステータス"]).toBe("Pending: review");
  });

  it("frontmatterがないコンテンツは空オブジェクトを返す", () => {
    const content = "本文のみ";
    expect(parseFrontmatter(content)).toEqual({});
  });

  it("空のfrontmatterは空オブジェクトを返す", () => {
    const content = `---

---`;
    expect(parseFrontmatter(content)).toEqual({});
  });

  it("コロンを含まない行はスキップする", () => {
    const content = `---
ステータス: 未着手
これは不正な行
カテゴリ: 開発
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      ステータス: "未着手",
      カテゴリ: "開発",
    });
  });

  it("値にコロンを含むフィールドをパースできる", () => {
    const content = `---
URL: "https://example.com"
---`;
    const result = parseFrontmatter(content);
    expect(result["URL"]).toBe("https://example.com");
  });

  it("値が空のフィールドをパースできる", () => {
    const content = `---
期限:
---`;
    const result = parseFrontmatter(content);
    expect(result["期限"]).toBe("");
  });

  it("CRLFの改行コードに対応する", () => {
    const content = "---\r\nステータス: 完了\r\n---\r\n本文";
    const result = parseFrontmatter(content);
    expect(result["ステータス"]).toBe("完了");
  });
});

// ============================================================
// updateFrontmatterContent
// ============================================================

describe("updateFrontmatterContent", () => {
  const baseContent = `---
ステータス: 未着手
カテゴリ: 開発
---
本文の内容`;

  it("既存フィールドの値を更新できる", () => {
    const result = updateFrontmatterContent(baseContent, "ステータス", "進行中");
    expect(result).not.toBeNull();
    const parsed = parseFrontmatter(result!);
    expect(parsed["ステータス"]).toBe("進行中");
    expect(parsed["カテゴリ"]).toBe("開発");
  });

  it("コロンを含む値は自動でクォートされる", () => {
    const result = updateFrontmatterContent(baseContent, "ステータス", "Pending: blocked");
    expect(result).toContain('"Pending: blocked"');
    const parsed = parseFrontmatter(result!);
    expect(parsed["ステータス"]).toBe("Pending: blocked");
  });

  it("存在しないフィールドは末尾に追加される", () => {
    const result = updateFrontmatterContent(baseContent, "案件", "beta");
    expect(result).not.toBeNull();
    const parsed = parseFrontmatter(result!);
    expect(parsed["案件"]).toBe("beta");
    expect(parsed["ステータス"]).toBe("未着手");
  });

  it("frontmatterがないコンテンツにはnullを返す", () => {
    const result = updateFrontmatterContent("本文のみ", "ステータス", "完了");
    expect(result).toBeNull();
  });

  it("本文を壊さない", () => {
    const result = updateFrontmatterContent(baseContent, "ステータス", "完了");
    expect(result).toContain("本文の内容");
  });

  it("CRLFの改行コードに対応する", () => {
    const content = "---\r\nステータス: 未着手\r\n---\r\n本文";
    const result = updateFrontmatterContent(content, "ステータス", "完了");
    expect(result).not.toBeNull();
    const parsed = parseFrontmatter(result!);
    expect(parsed["ステータス"]).toBe("完了");
  });

  it("コロンを含まない行（空行など）はスキップして既存フィールドを更新する", () => {
    const content = `---
ステータス: 未着手

カテゴリ: 開発
---
本文`;
    const result = updateFrontmatterContent(content, "カテゴリ", "運用");
    expect(result).not.toBeNull();
    const parsed = parseFrontmatter(result!);
    expect(parsed["ステータス"]).toBe("未着手");
    expect(parsed["カテゴリ"]).toBe("運用");
  });
});

// ============================================================
// quoteIfNeeded
// ============================================================

describe("quoteIfNeeded", () => {
  it("コロンを含む値をクォートする", () => {
    expect(quoteIfNeeded("Pending: blocked")).toBe('"Pending: blocked"');
  });

  it("ダブルクォートを含む値をエスケープしてクォートする", () => {
    expect(quoteIfNeeded('値に"引用符"あり')).toBe('"値に\\"引用符\\"あり"');
  });

  it("特殊文字がなければそのまま返す", () => {
    expect(quoteIfNeeded("未着手")).toBe("未着手");
    expect(quoteIfNeeded("完了")).toBe("完了");
  });

  it("空文字列はそのまま返す", () => {
    expect(quoteIfNeeded("")).toBe("");
  });

  it("wikilinkを含む値をクォートする", () => {
    expect(quoteIfNeeded("[[親タスク]]")).toBe('"[[親タスク]]"');
  });
});

// ============================================================
// parseWikiLink
// ============================================================

describe("parseWikiLink", () => {
  it("単純なwikilinkからノート名を取り出す", () => {
    expect(parseWikiLink("[[親タスク]]")).toBe("親タスク");
  });

  it("前後の空白を無視する", () => {
    expect(parseWikiLink("  [[親タスク]]  ")).toBe("親タスク");
  });

  it("パス付きwikilinkをそのまま返す", () => {
    expect(parseWikiLink("[[task/親タスク]]")).toBe("task/親タスク");
  });

  it("エイリアス付きはエイリアス前を返す", () => {
    expect(parseWikiLink("[[親タスク|別名]]")).toBe("親タスク");
  });

  it("見出し付きは見出し前を返す", () => {
    expect(parseWikiLink("[[親タスク#見出し]]")).toBe("親タスク");
  });

  it("wikilinkでなければnullを返す", () => {
    expect(parseWikiLink("ただの文字列")).toBeNull();
    expect(parseWikiLink("")).toBeNull();
  });

  it("空のwikilinkはnullを返す", () => {
    expect(parseWikiLink("[[]]")).toBeNull();
    expect(parseWikiLink("[[#見出しのみ]]")).toBeNull();
  });
});

// ============================================================
// formatWikiLink
// ============================================================

describe("formatWikiLink", () => {
  it("ターゲットをwikilinkで囲む", () => {
    expect(formatWikiLink("親タスク")).toBe("[[親タスク]]");
  });
});

// ============================================================
// setListField
// ============================================================

describe("setListField", () => {
  const base = "---\nステータス: 進行中\n作成日時: 2026-07-06\n---\n本文";

  it("新しいブロックリストを追記する", () => {
    const result = setListField(base, "子", ["[[A]]", "[[B]]"]);
    expect(result).toContain("子:\n  - \"[[A]]\"\n  - \"[[B]]\"");
    expect(result).toContain("ステータス: 進行中");
    expect(result).toContain("本文");
  });

  it("既存のブロックリストを置き換える", () => {
    const content =
      '---\nステータス: 進行中\n子:\n  - "[[A]]"\n  - "[[B]]"\n---\n本文';
    const result = setListField(content, "子", ["[[C]]"]);
    expect(result).toContain('子:\n  - "[[C]]"');
    expect(result).not.toContain("[[A]]");
    expect(result).not.toContain("[[B]]");
  });

  it("空配列ならフィールドを削除する", () => {
    const content =
      '---\nステータス: 進行中\n子:\n  - "[[A]]"\n---\n本文';
    const result = setListField(content, "子", []);
    expect(result).not.toContain("子:");
    expect(result).not.toContain("[[A]]");
    expect(result).toContain("ステータス: 進行中");
  });

  it("既存のスカラー値も置き換えられる", () => {
    const content = '---\n子: "[[A]]"\nステータス: 進行中\n---\n本文';
    const result = setListField(content, "子", ["[[B]]"]);
    expect(result).toContain('子:\n  - "[[B]]"');
    expect(result).toContain("ステータス: 進行中");
  });

  it("他フィールドのブロックリストは温存する", () => {
    const content =
      "---\nタグ:\n  - a\n  - b\nステータス: 進行中\n---\n本文";
    const result = setListField(content, "子", ["[[A]]"]);
    expect(result).toContain("タグ:\n  - a\n  - b");
    expect(result).toContain('子:\n  - "[[A]]"');
  });

  it("frontmatterがなければnullを返す", () => {
    expect(setListField("本文のみ", "子", ["[[A]]"])).toBeNull();
  });
});

// ============================================================
// removeFrontmatterField
// ============================================================

describe("removeFrontmatterField", () => {
  it("スカラーフィールドを削除する", () => {
    const content = '---\n親: "[[X]]"\nステータス: 進行中\n---\n本文';
    const result = removeFrontmatterField(content, "親");
    expect(result).not.toContain("親:");
    expect(result).toContain("ステータス: 進行中");
  });

  it("存在しないフィールドは何も変えない", () => {
    const content = "---\nステータス: 進行中\n---\n本文";
    const result = removeFrontmatterField(content, "親");
    expect(result).toContain("ステータス: 進行中");
  });

  it("frontmatterがなければnullを返す", () => {
    expect(removeFrontmatterField("本文のみ", "親")).toBeNull();
  });
});

// ============================================================
// buildFrontmatter
// ============================================================

describe("buildFrontmatter", () => {
  it("全プロパティ指定でfrontmatterを生成する", () => {
    const result = buildFrontmatter({
      statusField: "ステータス",
      status: "未着手",
      categoryField: "カテゴリ",
      category: "開発",
      projectField: "案件",
      project: "beta",
      createdField: "作成日時",
      createdDate: "2026-05-26",
      deadlineField: "期限",
      deadline: "2026-06-30",
    });
    const parsed = parseFrontmatter(result);
    expect(parsed["ステータス"]).toBe("未着手");
    expect(parsed["カテゴリ"]).toBe("開発");
    expect(parsed["案件"]).toBe("beta");
    expect(parsed["作成日時"]).toBe("2026-05-26");
    expect(parsed["期限"]).toBe("2026-06-30");
  });

  it("オプションのカテゴリ・案件を省略できる", () => {
    const result = buildFrontmatter({
      statusField: "ステータス",
      status: "進行中",
      createdField: "作成日時",
      createdDate: "2026-05-26",
      deadlineField: "期限",
    });
    const parsed = parseFrontmatter(result);
    expect(parsed["ステータス"]).toBe("進行中");
    expect(parsed["カテゴリ"]).toBeUndefined();
    expect(parsed["案件"]).toBeUndefined();
    expect(parsed["期限"]).toBe("");
  });

  it("コロンを含むステータスは自動でクォートされる", () => {
    const result = buildFrontmatter({
      statusField: "ステータス",
      status: "Pending: blocked",
      createdField: "作成日時",
      createdDate: "2026-05-26",
      deadlineField: "期限",
    });
    expect(result).toContain('"Pending: blocked"');
    const parsed = parseFrontmatter(result);
    expect(parsed["ステータス"]).toBe("Pending: blocked");
  });

  it("---で囲まれた有効なfrontmatterブロックを生成する", () => {
    const result = buildFrontmatter({
      statusField: "ステータス",
      status: "未着手",
      createdField: "作成日時",
      createdDate: "2026-05-26",
      deadlineField: "期限",
    });
    expect(result).toMatch(/^---\n[\s\S]*\n---\n$/);
  });
});

// ============================================================
// getCardsForColumn
// ============================================================

describe("getCardsForColumn", () => {
  const fileMap = new Map<string, Record<string, string>>([
    ["task/task1.md", { ステータス: "未着手", カテゴリ: "開発" }],
    ["task/task2.md", { ステータス: "進行中", カテゴリ: "調査" }],
    ["task/task3.md", { ステータス: "未着手", カテゴリ: "報連相" }],
    ["task/task4.md", { ステータス: "完了" }],
    ["task/task5.md", { ステータス: "Pending: blocked" }],
  ]);

  it("指定ステータスのカードだけを返す", () => {
    const cards = getCardsForColumn(fileMap, "未着手", "ステータス", "未着手");
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.name)).toEqual(["task1", "task3"]);
  });

  it("進行中カラムのカードを返す", () => {
    const cards = getCardsForColumn(fileMap, "進行中", "ステータス", "未着手");
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("task2");
  });

  it("コロンを含むステータスのカードを返す", () => {
    const cards = getCardsForColumn(fileMap, "Pending: blocked", "ステータス", "未着手");
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("task5");
  });

  it("該当なしのカラムは空配列を返す", () => {
    const cards = getCardsForColumn(fileMap, "リリース待ち", "ステータス", "未着手");
    expect(cards).toHaveLength(0);
  });

  it("ステータス未設定のカードは最初のカラムに振り分けられる", () => {
    const mapWithNoStatus = new Map<string, Record<string, string>>([
      ["task/noStatus.md", { カテゴリ: "開発" }],
    ]);
    const cards = getCardsForColumn(mapWithNoStatus, "未着手", "ステータス", "未着手");
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("noStatus");
  });

  it("ステータス未設定のカードは最初のカラム以外には含まれない", () => {
    const mapWithNoStatus = new Map<string, Record<string, string>>([
      ["task/noStatus.md", { カテゴリ: "開発" }],
    ]);
    const cards = getCardsForColumn(mapWithNoStatus, "進行中", "ステータス", "未着手");
    expect(cards).toHaveLength(0);
  });

  it("ファイル名から.mdを除去してnameに設定する", () => {
    const cards = getCardsForColumn(fileMap, "完了", "ステータス", "未着手");
    expect(cards[0].name).toBe("task4");
    expect(cards[0].path).toBe("task/task4.md");
  });

  it("ステータス以外のフィールドでもグルーピングできる", () => {
    const cards = getCardsForColumn(fileMap, "調査", "カテゴリ", "開発");
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("task2");
  });

  it("カテゴリ未設定のカードはfirstColumnに振り分けられる", () => {
    const cards = getCardsForColumn(fileMap, "開発", "カテゴリ", "開発");
    // task4, task5にはカテゴリがないのでfirstColumn(開発)に入る
    const names = cards.map((c) => c.name);
    expect(names).toContain("task1");
    expect(names).toContain("task4");
    expect(names).toContain("task5");
  });
});

// ============================================================
// collectAllFields
// ============================================================

describe("collectAllFields", () => {
  const fileMap = new Map<string, Record<string, string>>([
    ["task1.md", { ステータス: "未着手", カテゴリ: "開発", 案件: "beta" }],
    ["task2.md", { ステータス: "進行中", 担当者: "田中" }],
    ["task3.md", { ステータス: "完了", カテゴリ: "調査", 期限: "2026-06-01" }],
  ]);

  it("全ファイルのフィールド名をユニークに収集する", () => {
    const fields = collectAllFields(fileMap);
    expect(fields).toContain("ステータス");
    expect(fields).toContain("カテゴリ");
    expect(fields).toContain("案件");
    expect(fields).toContain("担当者");
    expect(fields).toContain("期限");
  });

  it("結果がソートされている", () => {
    const fields = collectAllFields(fileMap);
    const sorted = [...fields].sort();
    expect(fields).toEqual(sorted);
  });

  it("重複なく返す", () => {
    const fields = collectAllFields(fileMap);
    const unique = new Set(fields);
    expect(fields.length).toBe(unique.size);
  });

  it("空のfileMapでは空配列を返す", () => {
    expect(collectAllFields(new Map())).toEqual([]);
  });
});

// ============================================================
// resolveAllColumns
// ============================================================

describe("resolveAllColumns", () => {
  const fileMap = new Map<string, Record<string, string>>([
    ["task1.md", { ステータス: "未着手", 案件: "beta" }],
    ["task2.md", { ステータス: "進行中", 案件: "Alpha" }],
    ["task3.md", { ステータス: "完了", 案件: "beta" }],
    ["task4.md", { ステータス: "未着手", 案件: "gamma" }],
    ["task5.md", { ステータス: "進行中", 期限: "Invalid date" }],
  ]);

  it("指定フィールドのユニークな値をソートして返す", () => {
    const cols = resolveAllColumns(fileMap, "ステータス");
    expect(cols).toEqual(["完了", "未着手", "進行中"]);
  });

  it("案件フィールドでも動作する", () => {
    const cols = resolveAllColumns(fileMap, "案件");
    expect(cols).toEqual(["Alpha", "beta", "gamma"]);
  });

  it("Invalid dateの値は除外する", () => {
    const cols = resolveAllColumns(fileMap, "期限");
    expect(cols).toEqual([]);
  });

  it("savedOrderが指定されたらその順序を優先する", () => {
    const cols = resolveAllColumns(fileMap, "ステータス", ["進行中", "未着手", "完了"]);
    expect(cols).toEqual(["進行中", "未着手", "完了"]);
  });

  it("savedOrderにない新しい値は末尾に追加される", () => {
    const cols = resolveAllColumns(fileMap, "ステータス", ["進行中"]);
    expect(cols[0]).toBe("進行中");
    expect(cols).toContain("未着手");
    expect(cols).toContain("完了");
    expect(cols.length).toBe(3);
  });

  it("savedOrderにあるがファイルに存在しない値は除外される", () => {
    const cols = resolveAllColumns(fileMap, "ステータス", ["削除済み", "進行中", "未着手", "完了"]);
    expect(cols).not.toContain("削除済み");
    expect(cols).toEqual(["進行中", "未着手", "完了"]);
  });

  it("存在しないフィールドは空配列を返す", () => {
    const cols = resolveAllColumns(fileMap, "存在しない");
    expect(cols).toEqual([]);
  });

  it("空のfileMapでは空配列を返す", () => {
    expect(resolveAllColumns(new Map(), "ステータス")).toEqual([]);
  });
});

// ============================================================
// isColumnHidden
// ============================================================

describe("isColumnHidden", () => {
  const hiddenColumns: Record<string, string[]> = {
    ステータス: ["完了", "Pending: blocked"],
    案件: ["Alpha"],
  };

  it("折りたたまれたカラムはtrueを返す", () => {
    expect(isColumnHidden(hiddenColumns, "ステータス", "完了")).toBe(true);
    expect(isColumnHidden(hiddenColumns, "ステータス", "Pending: blocked")).toBe(true);
    expect(isColumnHidden(hiddenColumns, "案件", "Alpha")).toBe(true);
  });

  it("折りたたまれていないカラムはfalseを返す", () => {
    expect(isColumnHidden(hiddenColumns, "ステータス", "未着手")).toBe(false);
    expect(isColumnHidden(hiddenColumns, "案件", "beta")).toBe(false);
  });

  it("定義のないフィールドはfalseを返す", () => {
    expect(isColumnHidden(hiddenColumns, "カテゴリ", "開発")).toBe(false);
  });

  it("空のhiddenColumnsではfalseを返す", () => {
    expect(isColumnHidden({}, "ステータス", "完了")).toBe(false);
  });
});
