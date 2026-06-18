// ============================================================
// 各大学的研究科 / 学部清单（选学校时可附带选择）
// ============================================================
const UNI_GRADS = {
  todai:    ["情报理工学系研究科", "工学系研究科", "理学系研究科", "经济学研究科", "新领域创成科学研究科", "综合文化研究科"],
  titech:   ["情报理工学院", "工学院", "理学院", "物质理工学院", "环境社会理工学院"],
  kyodai:   ["工学研究科", "理学研究科", "情报学研究科", "经济学研究科", "农学研究科"],
  waseda:   ["基干理工学研究科", "创造理工学研究科", "先进理工学研究科", "经济学研究科", "商学研究科"],
  keio:     ["理工学研究科", "经济学研究科", "商学研究科", "法学研究科", "媒体研究科"],
  osakau:   ["工学研究科", "基础工学研究科", "理学研究科", "情报科学研究科"],
  hitotsubashi: ["经济学研究科", "商学研究科", "法学研究科", "社会学研究科"],
  kobe:     ["工学研究科", "经济学研究科", "海事科学研究科", "国际文化学研究科"],
  nagoya:   ["工学研究科", "情报学研究科", "理学研究科", "经济学研究科"],
  kyushu:   ["工学府", "情报科学府", "理学府", "经济学府"],
  hokudai:  ["工学院", "理学院", "农学院", "情报科学院"],
  tohoku:   ["工学研究科", "理学研究科", "情报科学研究科", "经济学研究科"],
  sophia:   ["理工学研究科", "经济学研究科", "外国语学研究科", "全球研究研究科"],
  doshisha: ["理工学研究科", "经济学研究科", "商学研究科", "法学研究科"],
};

// 各研究科下的细分専攻 / コース（key 格式："schoolId::研究科名"）
const UNI_MAJORS = {
  "todai::情报理工学系研究科": [
    { id: "cs",   label: "コンピュータ科学", short: "CS",   desc: "算法 / OS / 编译" },
    { id: "eeis", label: "电子情报学",       short: "EEIS", desc: "电子 + 情报融合" },
    { id: "mi",   label: "数理情报学",       short: "MI",   desc: "应用数学 / 统计" },
    { id: "si",   label: "システム情报学",   short: "SI",   desc: "系统设计 / 控制" },
    { id: "ii",   label: "知能机械情报学",   short: "IME",  desc: "机器人 / AI" },
    { id: "cnsi", label: "创造情报学",       short: "CNSI", desc: "创新 / 交叉" },
  ],
  "todai::工学系研究科": [
    { id: "ee",   label: "电气系工学", short: "EE",  desc: "电力 / 通信" },
    { id: "me",   label: "机械工学",   short: "ME",  desc: "机械设计" },
    { id: "ce",   label: "土木工学",   short: "CE",  desc: "土木 / 建筑" },
    { id: "ae",   label: "航空宇宙工学", short: "AE", desc: "航空 / 航天" },
    { id: "ap",   label: "应用物理学", short: "AP",  desc: "物理 + 工程" },
    { id: "mse",  label: "材料工学",   short: "MSE", desc: "金属 / 半导体" },
  ],
  "todai::理学系研究科": [
    { id: "math", label: "数学",     short: "Math", desc: "纯粹 / 应用" },
    { id: "phys", label: "物理学",   short: "Phys", desc: "理论 / 实验" },
    { id: "chem", label: "化学",     short: "Chem", desc: "" },
    { id: "bio",  label: "生物科学", short: "Bio",  desc: "" },
  ],
  "todai::经济学研究科": [
    { id: "econ", label: "经济专攻",       short: "Econ", desc: "宏观 / 微观" },
    { id: "mgmt", label: "经营专攻",       short: "Mgmt", desc: "管理 / 战略" },
    { id: "fin",  label: "金融システム",   short: "Fin",  desc: "金融工程" },
  ],
  "titech::情报理工学院": [
    { id: "mcs",  label: "数理・计算科学", short: "MCS", desc: "算法 + 数学" },
    { id: "is",   label: "情报工学",       short: "IS",  desc: "软件 / 系统" },
    { id: "ai",   label: "知能情报",       short: "AI",  desc: "AI / ML" },
  ],
  "titech::工学院": [
    { id: "ee",  label: "电気電子",     short: "EE",  desc: "电子设计" },
    { id: "me",  label: "机械系",       short: "ME",  desc: "机械工程" },
    { id: "sys", label: "システム制御", short: "Sys", desc: "控制 / 机器人" },
  ],
  "kyodai::情报学研究科": [
    { id: "ii",  label: "知能情报学",       short: "II",  desc: "AI / NLP" },
    { id: "si",  label: "社会情报学",       short: "SI",  desc: "数据 + 社会" },
    { id: "sys", label: "系统科学",         short: "Sys", desc: "控制系统" },
    { id: "cis", label: "通信情报システム", short: "CIS", desc: "网络 / 通信" },
  ],
  "kyodai::工学研究科": [
    { id: "ee",  label: "电气工学", short: "EE",  desc: "" },
    { id: "me",  label: "机械工学", short: "ME",  desc: "" },
    { id: "mse", label: "材料工学", short: "MSE", desc: "" },
  ],
  "waseda::基干理工学研究科": [
    { id: "cs",   label: "情报理工",     short: "CS",   desc: "" },
    { id: "math", label: "数学应用数理", short: "Math", desc: "" },
    { id: "me",   label: "机械科学",     short: "ME",   desc: "" },
  ],
  "keio::理工学研究科": [
    { id: "oe", label: "开放工学",   short: "OE", desc: "" },
    { id: "is", label: "情报工学",   short: "IS", desc: "" },
    { id: "bp", label: "基础理工学", short: "BP", desc: "" },
  ],
};

// ============================================================
// Kakomon mock data — stable field names for future backend.
// ============================================================

const KAKOMON_USER = {
  id: "u1",
  nickname: "张同学",
  email: "zhang@example.com",
  major: "情报理工",
  targetUniversityIds: ["todai", "titech"],
  isPro: false,
  freeAiRemaining: 1,
  tokenBalance: 6,
  solvedCount: 42,
  unclearCount: 11,
  wrongCount: 8,
  favoriteCount: 17,
  aiAskCount: 23,
  contributorPoints: 240,
  nextExam: {
    name: "东大 · 情报理工修考 一次",
    date: "2026-08-25",
    durationDays: 2,
  },
  weakPoints: [
    { subject: "线性代数", point: "固有值与对角化", level: 4, count: 6 },
    { subject: "线性代数", point: "二次型", level: 3, count: 4 },
    { subject: "微积分",   point: "重积分", level: 3, count: 3 },
    { subject: "微积分",   point: "傅里叶级数", level: 2, count: 2 },
    { subject: "概率统计", point: "假设检验", level: 2, count: 2 },
    { subject: "算法",     point: "动态规划", level: 4, count: 5 },
    { subject: "算法",     point: "图论 BFS/DFS", level: 1, count: 1 },
    { subject: "数据结构", point: "平衡二叉树", level: 1, count: 1 },
  ],
};

const KAKOMON_UNIVERSITIES = [
  {
    id: "todai", nameCn: "东京大学", nameJp: "東京大学", nameEn: "The University of Tokyo",
    short: "东大", type: "national", region: "关东", regionGroup: "首都圏",
    rating: 4.7, examDifficulty: "very_hard", pastExamCount: 312, reviewCount: 184,
    hotSubjects: ["数学", "情报", "物理"],
    dimensions: { 难度: 95, 完整度: 88, 透明度: 72, 合格经验: 92, 口碑: 96, 资料丰富度: 90 },
    tags: ["热门", "国立", "理工"],
    professorHighlights: [
      { name: "山田 健司", lab: "情报理工 · 计算机科学专攻", direction: "分布式系统 / 并发理论", reviewCount: 12 },
      { name: "佐藤 浩", lab: "工学系 · 电子情报工学", direction: "信号处理 / 机器学习", reviewCount: 9 },
    ],
    accent: "blue",
    suitableFor: "线性代数 + 算法基础扎实者",
  },
  {
    id: "titech", nameCn: "东京工业大学", nameJp: "東京科学大学", nameEn: "Institute of Science Tokyo",
    short: "东工大", type: "national", region: "关东", regionGroup: "首都圏",
    rating: 4.5, examDifficulty: "hard", pastExamCount: 256, reviewCount: 142,
    hotSubjects: ["数学", "情报", "工学"],
    dimensions: { 难度: 88, 完整度: 92, 透明度: 80, 合格经验: 78, 口碑: 88, 资料丰富度: 85 },
    tags: ["热门", "国立", "理工"],
    professorHighlights: [
      { name: "高桥 修", lab: "情报理工学院 · 数理計算科学", direction: "数值最适化 / 凸优化", reviewCount: 8 },
    ],
    accent: "teal",
    suitableFor: "工科背景且数学功底强",
  },
  {
    id: "kyodai", nameCn: "京都大学", nameJp: "京都大学", nameEn: "Kyoto University",
    short: "京大", type: "national", region: "关西", regionGroup: "关西圏",
    rating: 4.6, examDifficulty: "hard", pastExamCount: 198, reviewCount: 121,
    hotSubjects: ["数学", "工学", "经济"],
    dimensions: { 难度: 90, 完整度: 80, 透明度: 70, 合格经验: 84, 口碑: 92, 资料丰富度: 78 },
    tags: ["热门", "国立"],
    professorHighlights: [],
    accent: "indigo",
    suitableFor: "想做基础研究方向",
  },
  {
    id: "waseda", nameCn: "早稻田大学", nameJp: "早稲田大学", nameEn: "Waseda University",
    short: "早大", type: "private", region: "关东", regionGroup: "首都圏",
    rating: 4.2, examDifficulty: "medium", pastExamCount: 174, reviewCount: 98,
    hotSubjects: ["经济", "商科", "情报"],
    dimensions: { 难度: 72, 完整度: 70, 透明度: 60, 合格经验: 80, 口碑: 84, 资料丰富度: 70 },
    tags: ["私立", "文商"],
    professorHighlights: [],
    accent: "indigo",
    suitableFor: "文商 / 经济方向",
  },
  {
    id: "keio", nameCn: "庆应义塾大学", nameJp: "慶應義塾大学", nameEn: "Keio University",
    short: "庆应", type: "private", region: "关东", regionGroup: "首都圏",
    rating: 4.3, examDifficulty: "medium", pastExamCount: 156, reviewCount: 86,
    hotSubjects: ["经济", "商科", "理工"],
    dimensions: { 难度: 75, 完整度: 68, 透明度: 65, 合格经验: 82, 口碑: 86, 资料丰富度: 68 },
    tags: ["私立"],
    professorHighlights: [],
    accent: "indigo",
    suitableFor: "经济 / 商科 / 理工综合",
  },
  {
    id: "osakau", nameCn: "大阪大学", nameJp: "大阪大学", nameEn: "Osaka University",
    short: "阪大", type: "national", region: "关西", regionGroup: "关西圏",
    rating: 4.1, examDifficulty: "hard", pastExamCount: 142, reviewCount: 64,
    hotSubjects: ["工学", "理学"],
    dimensions: { 难度: 82, 完整度: 65, 透明度: 60, 合格经验: 70, 口碑: 78, 资料丰富度: 60 },
    tags: ["国立", "理工"],
    professorHighlights: [],
    accent: "blue",
    suitableFor: "理工方向 + 关西地区",
  },
  {
    id: "hitotsubashi", nameCn: "一桥大学", nameJp: "一橋大学", nameEn: "Hitotsubashi University",
    short: "一桥", type: "national", region: "关东", regionGroup: "首都圏",
    rating: 4.3, examDifficulty: "hard", pastExamCount: 124, reviewCount: 72,
    hotSubjects: ["经济", "商科", "法学"],
    dimensions: { 难度: 86, 完整度: 72, 透明度: 68, 合格经验: 76, 口碑: 88, 资料丰富度: 70 },
    tags: ["热门", "国立", "文商"],
    professorHighlights: [],
    accent: "indigo",
    suitableFor: "经济 / 商科 / 法学顶尖",
  },
  {
    id: "kobe", nameCn: "神户大学", nameJp: "神戸大学", nameEn: "Kobe University",
    short: "神户", type: "national", region: "关西", regionGroup: "关西圏",
    rating: 4.0, examDifficulty: "medium", pastExamCount: 108, reviewCount: 52,
    hotSubjects: ["经济", "工学", "海事"],
    dimensions: { 难度: 72, 完整度: 70, 透明度: 65, 合格经验: 70, 口碑: 78, 资料丰富度: 60 },
    tags: ["国立"],
    professorHighlights: [],
    accent: "blue",
    suitableFor: "经济底色 + 关西",
  },
  {
    id: "nagoya", nameCn: "名古屋大学", nameJp: "名古屋大学", nameEn: "Nagoya University",
    short: "名大", type: "national", region: "中部", regionGroup: "中部",
    rating: 4.2, examDifficulty: "hard", pastExamCount: 132, reviewCount: 58,
    hotSubjects: ["理工", "医学", "文学"],
    dimensions: { 难度: 80, 完整度: 75, 透明度: 70, 合格经验: 72, 口碑: 82, 资料丰富度: 68 },
    tags: ["国立", "旧帝大"],
    professorHighlights: [],
    accent: "blue",
    suitableFor: "理工方向 + 中部地区",
  },
  {
    id: "kyushu", nameCn: "九州大学", nameJp: "九州大学", nameEn: "Kyushu University",
    short: "九大", type: "national", region: "九州", regionGroup: "九州",
    rating: 4.0, examDifficulty: "medium", pastExamCount: 96, reviewCount: 40,
    hotSubjects: ["工学", "理学", "医学"],
    dimensions: { 难度: 72, 完整度: 68, 透明度: 70, 合格经验: 65, 口碑: 76, 资料丰富度: 58 },
    tags: ["国立", "旧帝大"],
    professorHighlights: [],
    accent: "teal",
    suitableFor: "九州地区 + 性价比高",
  },
  {
    id: "hokudai", nameCn: "北海道大学", nameJp: "北海道大学", nameEn: "Hokkaido University",
    short: "北大", type: "national", region: "北海道", regionGroup: "北海道",
    rating: 4.0, examDifficulty: "medium", pastExamCount: 88, reviewCount: 38,
    hotSubjects: ["农学", "工学", "文学"],
    dimensions: { 难度: 68, 完整度: 62, 透明度: 68, 合格经验: 62, 口碑: 78, 资料丰富度: 55 },
    tags: ["国立", "旧帝大"],
    professorHighlights: [],
    accent: "teal",
    suitableFor: "农学 / 生命科学",
  },
  {
    id: "tohoku", nameCn: "东北大学", nameJp: "東北大学", nameEn: "Tohoku University",
    short: "东北大", type: "national", region: "东北", regionGroup: "东北",
    rating: 4.2, examDifficulty: "hard", pastExamCount: 118, reviewCount: 56,
    hotSubjects: ["工学", "理学", "材料"],
    dimensions: { 难度: 80, 完整度: 75, 透明度: 72, 合格经验: 70, 口碑: 80, 资料丰富度: 65 },
    tags: ["国立", "旧帝大", "理工"],
    professorHighlights: [],
    accent: "blue",
    suitableFor: "材料 / 机械工程",
  },
  {
    id: "sophia", nameCn: "上智大学", nameJp: "上智大学", nameEn: "Sophia University",
    short: "上智", type: "private", region: "关东", regionGroup: "首都圏",
    rating: 4.0, examDifficulty: "medium", pastExamCount: 86, reviewCount: 42,
    hotSubjects: ["外语", "国际关系", "文商"],
    dimensions: { 难度: 68, 完整度: 60, 透明度: 65, 合格经验: 70, 口碑: 78, 资料丰富度: 58 },
    tags: ["私立", "文商"],
    professorHighlights: [],
    accent: "indigo",
    suitableFor: "外语 / 国际业务",
  },
  {
    id: "doshisha", nameCn: "同志社大学", nameJp: "同志社大学", nameEn: "Doshisha University",
    short: "同志社", type: "private", region: "关西", regionGroup: "关西圏",
    rating: 3.9, examDifficulty: "medium", pastExamCount: 78, reviewCount: 36,
    hotSubjects: ["经济", "法学", "商科"],
    dimensions: { 难度: 65, 完整度: 58, 透明度: 62, 合格经验: 68, 口碑: 74, 资料丰富度: 55 },
    tags: ["私立", "文商", "关西"],
    professorHighlights: [],
    accent: "indigo",
    suitableFor: "关西私立 / 文商方向",
  },
];

const KAKOMON_QUESTIONS = [
  {
    id: "q-todai-2024-math-3",
    universityId: "todai", graduateSchool: "情报理工学系研究科",
    year: 2024, subject: "数学", questionNo: "第3问",
    title: "固有值与对角化",
    bodyText: "设 3×3 实对称矩阵 A 满足 A·v₁ = 2v₁，A·v₂ = -v₂，A·v₃ = 5v₃，其中 v₁, v₂, v₃ 是相互正交的单位向量。\n（1）证明 A 必可对角化；\n（2）求 Aⁿ 的一般表达式（n 为正整数）；\n（3）若再设 B = A² - 6A + 5I，判断 B 是否可逆，并求其特征值。",
    formulaPreview: ["A·vᵢ = λᵢ·vᵢ,  i = 1, 2, 3", "求 Aⁿ  及  B = A² - 6A + 5I"],
    knowledgePoints: ["线性代数", "固有值", "对角化", "二次型"],
    difficultyLabel: "中等偏难",
    crowdDifficultyRate: 0.68,
    crowdVotes: { easy: 12, medium: 38, hard: 84 },
    masteryStatus: null,
    standardExplanation: [
      { title: "Step 1 · 判断可对角化性", body: "实对称矩阵的三个不同特征值 (2, -1, 5) 对应的特征向量 v₁, v₂, v₃ 已正交且单位化，故矩阵 P = [v₁ v₂ v₃] 为正交矩阵，A = P·diag(2,-1,5)·Pᵀ。" },
      { title: "Step 2 · 计算 Aⁿ", body: "由 A = P·D·Pᵀ 立刻得到 Aⁿ = P·diag(2ⁿ, (-1)ⁿ, 5ⁿ)·Pᵀ。这是因正交矩阵 P 满足 PᵀP = I。" },
      { title: "Step 3 · 分析 B 可逆性", body: "B = A² - 6A + 5I 的特征值为 λᵢ² - 6λᵢ + 5。代入 λ ∈ {2, -1, 5}：B 的特征值为 -3, 12, 0。其中含 0，故 B 不可逆。" },
    ],
    referenceMatches: [
      { id: "r1", bookTitle: "マセマ 线性代数", chapter: "第4章 固有值与固有向量", pageRange: "P.128-131",
        matchType: "exact_question", reason: "几乎相同题型：实对称矩阵对角化 + 计算 Aⁿ。",
        rewrittenSummary: "本节先讲解实对称矩阵正交对角化定理，再用相同模板计算 Aⁿ。例题与本题结构一致，可直接对照解题步骤。" },
      { id: "r2", bookTitle: "演习 大学院入试 数学", chapter: "线代演习篇 例题 12", pageRange: "P.56",
        matchType: "same_point", reason: "同知识点 — 固有值多项式与可逆性判定。",
        rewrittenSummary: "通过特征值代入 f(A) 判断 f(A) 是否可逆，是修考常见的考点延伸。" },
      { id: "r3", bookTitle: "青本 数学（东大编）", chapter: "对角化基础与应用", pageRange: "P.204",
        matchType: "similar_method", reason: "相似解法 — 用正交矩阵简化求幂运算。",
        rewrittenSummary: "教科书侧重于解法套路，先正交化再求幂；推导过程简洁。" },
    ],
    relatedQuestions: [
      { id: "rq1", level: 1, title: "实对称矩阵的对角化与求幂", universityId: "titech", universityName: "东工大", year: 2021, subject: "数学", questionNo: "第2问", reason: "完全相同考点：正交对角化 + 求 Aⁿ。", confidence: 0.94 },
      { id: "rq2", level: 1, title: "二次型标准化", universityId: "todai", universityName: "东大", year: 2019, subject: "数学", questionNo: "第3问", reason: "同校不同年份，相同套路。", confidence: 0.88 },
      { id: "rq3", level: 2, title: "矩阵多项式可逆性判定", universityId: "kyodai", universityName: "京大", year: 2022, subject: "数学", questionNo: "第1问", reason: "相同方法：用特征值代入多项式。", confidence: 0.79 },
      { id: "rq4", level: 2, title: "实对称矩阵的正交化", universityId: "titech", universityName: "东工大", year: 2018, subject: "数学", questionNo: "第1问", reason: "同父概念：Gram-Schmidt 与正交对角化。", confidence: 0.73 },
      { id: "rq5", level: 3, title: "Hermite 矩阵的酉对角化", universityId: "kyodai", universityName: "京大", year: 2020, subject: "数学", questionNo: "第4问", reason: "跨校 + 相邻概念：复数域下的对角化。", confidence: 0.62 },
      { id: "rq6", level: 3, title: "可逆性 × 行列式表达", universityId: "osakau", universityName: "阪大", year: 2023, subject: "数学", questionNo: "第2问", reason: "跨校相似题，可做迁移练习。", confidence: 0.55 },
    ],
    hasOriginalImage: true,
  },
  {
    id: "q-titech-2021-math-2",
    universityId: "titech", graduateSchool: "情报理工学院",
    year: 2021, subject: "数学", questionNo: "第2问",
    title: "二次型标准化",
    knowledgePoints: ["线性代数", "二次型", "正交变换"],
    difficultyLabel: "中等",
    crowdDifficultyRate: 0.52,
  },
  {
    id: "q-kyodai-2023-math-1",
    universityId: "kyodai", graduateSchool: "工学研究科",
    year: 2023, subject: "数学", questionNo: "第1问",
    title: "多重积分与极坐标",
    knowledgePoints: ["微积分", "重积分", "极坐标变换"],
    difficultyLabel: "中等偏难",
    crowdDifficultyRate: 0.62,
  },
  {
    id: "q-waseda-2024-stat-2",
    universityId: "waseda", graduateSchool: "经济学研究科",
    year: 2024, subject: "统计", questionNo: "第2问",
    title: "假设检验：Z 检验与 P 值",
    knowledgePoints: ["概率统计", "假设检验", "Z 检验"],
    difficultyLabel: "中等",
    crowdDifficultyRate: 0.45,
  },
  {
    id: "q-todai-2023-math-1",
    universityId: "todai", graduateSchool: "情报理工学系研究科",
    year: 2023, subject: "数学", questionNo: "第1问",
    title: "线性变换与基变换",
    knowledgePoints: ["线性代数", "线性变换", "基"],
    difficultyLabel: "中等",
    crowdDifficultyRate: 0.55,
    masteryStatus: "mastered",
  },
  {
    id: "q-todai-2024-info-2",
    universityId: "todai", graduateSchool: "情报理工学系研究科",
    year: 2024, subject: "情报", questionNo: "第2问",
    title: "动态规划：背包问题变形",
    knowledgePoints: ["算法", "动态规划"],
    difficultyLabel: "难",
    crowdDifficultyRate: 0.78,
    masteryStatus: "wrong",
  },
];

const KAKOMON_THREADS = [
  {
    id: "t1", title: "东大2024数学第3问，为什么一定可对角化？",
    type: "question_discussion",
    universityId: "todai", questionId: "q-todai-2024-math-3",
    tags: ["线性代数", "对角化"],
    replyCount: 18, viewCount: 412,
    hasAcceptedAnswer: true,
    authorBadge: "passed", authorName: "已合格 · 王同学",
    excerpt: "题目说三个特征向量已经正交且单位化，是不是直接套实对称矩阵正交对角化定理就行？还是要严格证明对应不同特征值的特征向量必正交？",
    lastActivity: "2 小时前",
  },
  {
    id: "t2", title: "求东工大情报理工 2022 数学解析",
    type: "material_request",
    universityId: "titech",
    tags: ["资料互助", "数学"],
    replyCount: 6, viewCount: 132,
    hasAcceptedAnswer: false,
    authorBadge: "preparing", authorName: "备考中 · 李同学",
    excerpt: "有谁手里有 2022 年东工大情报理工的数学全套答案吗？可以付费获取，或者用我手里的 2023 早大资料交换。",
    materialRequestStatus: "unsolved",
    lastActivity: "1 天前",
  },
  {
    id: "t3", title: "青本 P204 和东大这题是不是同一个套路？",
    type: "question_discussion",
    universityId: "todai", questionId: "q-todai-2024-math-3",
    tags: ["参考书", "对角化"],
    replyCount: 9, viewCount: 268,
    hasAcceptedAnswer: false,
    authorBadge: "preparing", authorName: "备考中 · 陈同学",
    excerpt: "我对照看了一下，感觉解法 90% 一样，但是青本的最后一步用的是行列式而不是特征值。哪种更稳妥？",
    lastActivity: "5 小时前",
  },
  {
    id: "t4", title: "东大 vs 东工大 情报修考难度怎么选？",
    type: "experience",
    universityId: "todai",
    tags: ["合格经验", "选校"],
    replyCount: 24, viewCount: 891,
    hasAcceptedAnswer: false,
    authorBadge: "verified", authorName: "运营验证 · Kakomon",
    excerpt: "从过去三年的真题对比来看：东大数学难度上限更高，东工大覆盖面更广。本帖整理了两校的考点交集。",
    lastActivity: "3 天前",
  },
  {
    id: "t5", title: "东大同校备考小组 · 5 月线下答疑",
    type: "study_circle",
    universityId: "todai",
    tags: ["同校备考", "线下"],
    replyCount: 12, viewCount: 305,
    hasAcceptedAnswer: false,
    authorBadge: "passed", authorName: "已合格 · 张学姐",
    excerpt: "本周日下午 14:00 在本郷キャンパス附近咖啡店，主题：线代 + 算法。报名请回复邮箱前缀。",
    lastActivity: "8 小时前",
  },
  {
    id: "t6", title: "马上面试，求东大教授研究方向 cheatsheet",
    type: "material_request",
    universityId: "todai",
    tags: ["资料互助", "面试"],
    replyCount: 11, viewCount: 178,
    hasAcceptedAnswer: true,
    authorBadge: "preparing", authorName: "备考中 · Liu",
    excerpt: "已收集到 2 份学长整理。已采纳第 3 楼回复，附带链接。感谢！",
    materialRequestStatus: "solved",
    lastActivity: "刚刚",
  },
];

const KAKOMON_THREAD_REPLIES = {
  t1: [
    { id: "r1", author: "王学长", badge: "passed", time: "1 小时前", body: "实对称矩阵的特征向量在不同特征值下天然正交，这是谱定理的内容。题目把它们正交且单位化是给你方便，不用证明。直接写 P = [v₁ v₂ v₃] 就好。", upvotes: 24, isAccepted: true },
    { id: "r2", author: "Tanaka", badge: "verified", time: "30 分钟前", body: "补充一下：对角化条件是「存在 n 个线性无关特征向量」，实对称矩阵的特殊性在于这 n 个特征向量可以选成正交基。所以 P 自然是正交矩阵。", upvotes: 14, isAccepted: false },
    { id: "r3", author: "Mei", badge: "preparing", time: "20 分钟前", body: "Step 3 我算出来 B 的特征值是 -3, 12, 0，所以 B 不可逆。但有个疑问：题目没说 v₁, v₂, v₃ 一定线性无关吧？", upvotes: 4, isAccepted: false },
  ],
};

const KAKOMON_RECENT_ACTIVITY = [
  { type: "answered", text: "完成了「东大 2023 数学 第1问」", time: "今天 10:24", icon: "check" },
  { type: "ai", text: "向 AI 提问关于「对角化」", time: "昨天 21:08", icon: "sparkles" },
  { type: "wrong", text: "标记「2024 数学第3问」为不会", time: "昨天 19:45", icon: "x" },
  { type: "favorite", text: "收藏「东工大 2021 数学第2问」", time: "前天", icon: "bookmark" },
];

// ============================================================
// 错题本 / 弱点扩展数据
// ============================================================
const KAKOMON_WRONG_QUESTIONS = [
  { id: "wq1", questionId: "q-todai-2024-math-3", subject: "线性代数", point: "对角化", universityShort: "东大", year: 2024, questionNo: "数学 第3问", title: "固有值与对角化",
    wrongCount: 2, lastWrongAt: "今天 10:24", nextReviewAt: "明天", masteryLevel: 1, tags: ["间隔重复"] },
  { id: "wq2", questionId: "q-todai-2024-info-2", subject: "算法", point: "动态规划", universityShort: "东大", year: 2024, questionNo: "情报 第2问", title: "动态规划：背包问题变形",
    wrongCount: 3, lastWrongAt: "昨天 19:45", nextReviewAt: "今天", masteryLevel: 0, tags: ["再次复习"] },
  { id: "wq3", questionId: "q-titech-2021-math-2", subject: "线性代数", point: "二次型", universityShort: "东工大", year: 2021, questionNo: "数学 第2问", title: "二次型标准化",
    wrongCount: 1, lastWrongAt: "3 天前", nextReviewAt: "今天", masteryLevel: 2, tags: ["即将掌握"] },
  { id: "wq4", questionId: "q-kyodai-2023-math-1", subject: "微积分", point: "重积分", universityShort: "京大", year: 2023, questionNo: "数学 第1问", title: "多重积分与极坐标",
    wrongCount: 1, lastWrongAt: "5 天前", nextReviewAt: "后天", masteryLevel: 2, tags: [] },
  { id: "wq5", questionId: "q-todai-2024-math-3", subject: "概率统计", point: "假设检验", universityShort: "早大", year: 2024, questionNo: "统计 第2问", title: "假设检验：Z 检验与 P 值",
    wrongCount: 1, lastWrongAt: "1 周前", nextReviewAt: "明天", masteryLevel: 1, tags: [] },
  { id: "wq6", questionId: "q-titech-2021-math-2", subject: "算法", point: "图论 BFS/DFS", universityShort: "东工大", year: 2020, questionNo: "情报 第3问", title: "无向图最短路径",
    wrongCount: 1, lastWrongAt: "2 周前", nextReviewAt: "下周", masteryLevel: 2, tags: ["快忘了"] },
];

// 知识点矩阵：科目 → [{point, count, mastery 0~1, overlap[]}]
const KAKOMON_KNOWLEDGE_MATRIX = [
  { subject: "线性代数", color: "blue", total: 18,
    points: [
      { point: "固有值与对角化", count: 6, mastery: 0.35, overlap: ["东大", "东工大"] },
      { point: "二次型",         count: 4, mastery: 0.50, overlap: ["东工大"] },
      { point: "线性变换",       count: 3, mastery: 0.85, overlap: ["东大"] },
      { point: "矩阵的秩",       count: 2, mastery: 0.70, overlap: [] },
    ],
  },
  { subject: "微积分", color: "teal", total: 14,
    points: [
      { point: "重积分",     count: 3, mastery: 0.55, overlap: ["京大"] },
      { point: "傅里叶级数", count: 2, mastery: 0.60, overlap: ["东工大"] },
      { point: "微分方程",   count: 2, mastery: 0.75, overlap: [] },
    ],
  },
  { subject: "概率统计", color: "indigo", total: 9,
    points: [
      { point: "假设检验",       count: 2, mastery: 0.60, overlap: ["早大"] },
      { point: "贝叶斯推断",     count: 2, mastery: 0.45, overlap: [] },
      { point: "马尔科夫链",     count: 1, mastery: 0.80, overlap: [] },
    ],
  },
  { subject: "算法", color: "rose", total: 16,
    points: [
      { point: "动态规划",     count: 5, mastery: 0.30, overlap: ["东大", "京大"] },
      { point: "图论 BFS/DFS", count: 1, mastery: 0.85, overlap: [] },
      { point: "贪心",         count: 1, mastery: 0.90, overlap: [] },
    ],
  },
];

// ============================================================
// 参考书索引
// ============================================================
const KAKOMON_REFERENCE_BOOKS = [
  { id: "rb-masema-linalg", title: "马セマ 线性代数", titleJp: "マセマ 線形代数", author: "馬場 敬之",
    cover: "blue", category: "考研用书", rating: 4.6, ownedByCount: 8420,
    coveredQuestionCount: 124, popularSchools: ["东大", "东工大", "京大"], lastUpdate: "2023版",
    tags: ["入门友好", "套路型", "线代必备"],
    chapters: [
      { id: "c1", chapter: "第3章 矩阵的运算与逆", pages: "P.78-95", questionCount: 18, knowledgePoints: ["矩阵运算", "逆矩阵"] },
      { id: "c2", chapter: "第4章 固有值与固有向量", pages: "P.96-135", questionCount: 32, knowledgePoints: ["固有值", "对角化"], hot: true },
      { id: "c3", chapter: "第5章 二次型与正交变换", pages: "P.136-160", questionCount: 24, knowledgePoints: ["二次型", "正交变换"] },
      { id: "c4", chapter: "第6章 内积空间", pages: "P.161-188", questionCount: 14, knowledgePoints: ["内积", "Gram-Schmidt"] },
    ],
  },
  { id: "rb-aohon-math", title: "青本 数学", titleJp: "青本 数学", author: "東大编委会",
    cover: "indigo", category: "校内编纂", rating: 4.4, ownedByCount: 5210,
    coveredQuestionCount: 96, popularSchools: ["东大"], lastUpdate: "2024版",
    tags: ["东大对口", "解法套路", "进阶"],
    chapters: [
      { id: "c1", chapter: "对角化基础与应用", pages: "P.190-218", questionCount: 22, knowledgePoints: ["对角化", "求幂"], hot: true },
      { id: "c2", chapter: "二次型化简", pages: "P.219-240", questionCount: 16, knowledgePoints: ["二次型"] },
      { id: "c3", chapter: "线性变换的几何", pages: "P.241-262", questionCount: 12, knowledgePoints: ["线性变换"] },
    ],
  },
  { id: "rb-yanshu-math", title: "演习 大学院入试 数学", titleJp: "演習 大学院入試 数学", author: "藤田 宏",
    cover: "amber", category: "考研用书", rating: 4.3, ownedByCount: 3680,
    coveredQuestionCount: 72, popularSchools: ["东大", "东工大", "阪大"], lastUpdate: "2022版",
    tags: ["题量大", "演习重视"],
    chapters: [
      { id: "c1", chapter: "线代演习篇", pages: "P.40-78", questionCount: 28, knowledgePoints: ["固有值", "二次型"] },
      { id: "c2", chapter: "微积分演习篇", pages: "P.80-128", questionCount: 32, knowledgePoints: ["重积分", "微分方程"] },
      { id: "c3", chapter: "概率统计演习篇", pages: "P.130-158", questionCount: 12, knowledgePoints: ["假设检验"] },
    ],
  },
  { id: "rb-akahon-todai", title: "赤本 东大", titleJp: "赤本 東大編", author: "教学社",
    cover: "rose", category: "真题集", rating: 4.5, ownedByCount: 4920,
    coveredQuestionCount: 156, popularSchools: ["东大"], lastUpdate: "2025版",
    tags: ["真题", "10 年合集"],
    chapters: [
      { id: "c1", chapter: "2024 年度 真题", pages: "P.10-58", questionCount: 12, knowledgePoints: ["全科目"], hot: true },
      { id: "c2", chapter: "2023 年度 真题", pages: "P.60-108", questionCount: 12, knowledgePoints: ["全科目"] },
      { id: "c3", chapter: "2022 年度 真题", pages: "P.110-158", questionCount: 12, knowledgePoints: ["全科目"] },
    ],
  },
  { id: "rb-cs-algo", title: "算法导论 简译", titleJp: "アルゴリズム入門", author: "CLRS 译注",
    cover: "teal", category: "学科教材", rating: 4.7, ownedByCount: 3120,
    coveredQuestionCount: 88, popularSchools: ["东大", "东工大"], lastUpdate: "2021版",
    tags: ["情报必备", "深度"],
    chapters: [
      { id: "c1", chapter: "动态规划", pages: "P.282-340", questionCount: 24, knowledgePoints: ["DP", "背包"], hot: true },
      { id: "c2", chapter: "图论基础", pages: "P.420-468", questionCount: 18, knowledgePoints: ["BFS", "DFS"] },
    ],
  },
];

// ============================================================
// 学习圈 / Study Groups（QQ 群式讨论组）
// ============================================================
const KAKOMON_GROUPS = [
  { id: "g-todai-math", name: "东大数学 · 修考 2025", emoji: "🧮", scope: "school+subject", target: "todai", subject: "数学",
    memberCount: 184, dailyActive: 48, avgProgress: 62, ownerName: "王学长",
    desc: "专攻东大情报/工学系数学。每周一三五 21:00 共同刷题，群内已沉淀 80+ 笔记。",
    badges: ["活跃", "已合格 5 人"], openSlots: 16,
    todayTask: "线代 · 对角化 5 道",
    accent: "blue", verified: true, joined: false,
  },
  { id: "g-titech-info", name: "东工大情报理工 · 2025 修", emoji: "💻", scope: "school+subject", target: "titech", subject: "情报",
    memberCount: 96, dailyActive: 22, avgProgress: 48, ownerName: "Tanaka",
    desc: "算法 + 数学 + 专业课。配套笔记 Notion 共建，欢迎来卷。",
    badges: ["互助积分高"], openSlots: 32,
    todayTask: "DP · 背包变形 3 道",
    accent: "teal", verified: false, joined: true,
  },
  { id: "g-kyodai-eng", name: "京大工学研究科 备考圈", emoji: "🏛", scope: "school", target: "kyodai",
    memberCount: 62, dailyActive: 12, avgProgress: 35, ownerName: "Mei",
    desc: "关西党的修考小角落。每月一次线下答疑。",
    badges: ["关西", "线下"], openSlots: 38,
    todayTask: "微积分 · 重积分",
    accent: "indigo", verified: false, joined: false,
  },
  { id: "g-linalg-deep", name: "线代死磕组（跨校）", emoji: "📐", scope: "subject", subject: "线性代数",
    memberCount: 312, dailyActive: 87, avgProgress: 71, ownerName: "已合格 · 张学姐",
    desc: "只刷线代。从基础到 Hermite 矩阵，每天 3 道高难度。",
    badges: ["高强度", "跨校"], openSlots: 0,
    todayTask: "Hermite 矩阵酉对角化",
    accent: "rose", verified: true, joined: false,
  },
  { id: "g-passed-share", name: "已合格学长答疑屋", emoji: "🎓", scope: "experience",
    memberCount: 42, dailyActive: 8, avgProgress: 100, ownerName: "运营",
    desc: "已合格学长每周 1 次 Q&A，主题轮流：选校 / 面试 / 教授沟通。",
    badges: ["运营验证"], openSlots: 8,
    todayTask: "本周主题：面试套路",
    accent: "green", verified: true, joined: false,
  },
];

const KAKOMON_GROUP_MESSAGES = {
  "g-todai-math": [
    { id: "m1", from: "王学长", badge: "passed", time: "10:24", body: "今天的任务发下啦：固有值 + 对角化 5 道，难度递增。@张同学 你昨天那个 Step3 的疑问解决了吗？", pinned: true },
    { id: "m2", from: "张同学", badge: "preparing", time: "10:28", body: "解决啦，看了 P204 那个例题豁然开朗。" },
    { id: "m3", from: "Mei", badge: "preparing", time: "10:30", body: "B 不可逆我也是这样算的，但是题目最后那一问要不要写「故 ker B ≠ {0}」啊", attachQuestion: { qId: "q-todai-2024-math-3", title: "固有值与对角化" } },
    { id: "m4", from: "Tanaka", badge: "verified", time: "10:31", body: "写一句更稳，但不写也能拿到 90% 的分。东大评分老师对答案的「严谨度」要求很高，但不要写废话。" },
    { id: "m5", from: "张同学", badge: "preparing", time: "10:35", body: "懂了 🫡。今天打卡：3 / 5", react: "👍 6" },
    { id: "m6", from: "Liu", badge: "preparing", time: "刚刚", body: "组队连麦做后面 2 道？我开个 Voice。", system: true },
  ],
};

const KAKOMON_GROUP_MEMBERS = [
  { name: "王学长",    badge: "passed",    role: "群主", progress: 100, lastActive: "在线" },
  { name: "Tanaka",   badge: "verified",  role: "管理员", progress: 92, lastActive: "5 分钟前" },
  { name: "张同学",   badge: "preparing", role: "成员", progress: 62, lastActive: "在线", isMe: true },
  { name: "Mei",      badge: "preparing", role: "成员", progress: 48, lastActive: "10 分钟前" },
  { name: "Liu",      badge: "preparing", role: "成员", progress: 35, lastActive: "刚刚" },
  { name: "陈同学",   badge: "preparing", role: "成员", progress: 28, lastActive: "1 小时前" },
];

const KAKOMON_GROUP_EVENTS = [
  { date: "今天 21:00", title: "线代对角化 共刷 5 题",  type: "study",    attendees: 24 },
  { date: "周三 20:00", title: "学长 Q&A · 选校建议",   type: "qa",       attendees: 38 },
  { date: "周日 14:00", title: "本郷キャンパス 线下",   type: "offline",  attendees: 12 },
];

// ============================================================
// 教授详情（扩展自 UNIVERSITIES.professorHighlights）
// ============================================================
const KAKOMON_PROFESSOR_DETAILS = {
  "山田 健司": {
    nameJp: "山田 健司", nameRoman: "YAMADA Kenji",
    university: "todai", lab: "情报理工学系研究科 · 计算机科学专攻",
    title: "教授", since: 2014,
    direction: "分布式系统 / 并发理论 / 形式化验证",
    recentTopics: ["分布式一致性", "TLA+ 形式化", "并发数据结构"],
    aiSummary: {
      researchFocus: "近 3 年发表方向集中在分布式一致性算法（Raft 改进、CRDT）和并发数据结构形式化验证。和 NTT R&D 长期合作。",
      examPattern: "出题偏向算法证明而非编码题。常考动态规划 + 图论组合题，喜欢让考生写时间复杂度证明。",
      interviewStyle: "面试风格直接，会针对研究计划深挖 30 分钟以上。要求清楚说明 \"为什么是我\"。",
      recommendation: "适合：算法基础扎实 + 想做系统方向 + 不怵理论推导。",
    },
    admission: { yearly: 4, applyRatio: 8.2, passRate: 0.12 },
    publications: 78,
    relatedQuestions: ["q-todai-2024-info-2", "q-todai-2024-math-3"],
    experiences: [
      { author: "已合格 · 王同学", time: "2024 春", text: "面试问了 4 个研究计划相关问题，其中一个是 \"如果你的方案在网络分区下失败怎么办\"。建议提前准备 fallback 方案。", upvotes: 24 },
      { author: "已合格 · Tanaka", time: "2023 秋", text: "笔试动态规划要求写出最优子结构证明。我当时只写了状态转移方程被扣了 10 分。", upvotes: 18 },
    ],
  },
};

// 给资料互助加更丰富的 detail
const KAKOMON_MATERIAL_REQUEST_DETAIL = {
  t2: {
    requestType: "需要", // "需要" | "我有"
    target: { university: "titech", year: 2022, subject: "情报理工 数学", part: "全套答案" },
    progress: 2, // 0=求助 1=有人响应 2=进行中 3=已采纳
    canOffer: ["2023 早大 经济统计 全套", "2022 京大工学 数学", "Notion 学习笔记访问权"],
    timeline: [
      { time: "1 天前", text: "李同学 发起求助", icon: "alert" },
      { time: "20 小时前", text: "陈同学 表示可以提供（待确认）", icon: "user" },
      { time: "12 小时前", text: "双方私聊中…", icon: "message" },
      { time: "—", text: "等待采纳", icon: "check", future: true },
    ],
    offers: [
      { author: "陈同学", badge: "passed", time: "20 小时前", body: "我有 2022 整套（含手写答案）。可以用你的 2023 早大资料交换吗？", upvotes: 5 },
      { author: "Liu",    badge: "preparing", time: "8 小时前", body: "+1 我有部分扫描，但只有数学第 1 问。", upvotes: 2 },
    ],
  },
};

// ============================================================
// 通知中心
// ============================================================
const KAKOMON_NOTIFICATIONS = [
  { id: "n1", type: "exam",   title: "东大 2024 数学第3问 已上线", body: "你目标校的最新过去问 · 含标准解析 + 3 本参考书匹配", time: "5 分钟前", unread: true, icon: "book", color: "blue", actionLabel: "立即查看", questionId: "q-todai-2024-math-3" },
  { id: "n2", type: "weak",   title: "弱点提醒：动态规划 错题 5 道", body: "建议今日复习。系统已为你排好 3 道精选练习。", time: "1 小时前", unread: true, icon: "flame", color: "rose", actionLabel: "开始复习" },
  { id: "n3", type: "mention",title: "王学长 在「东大2024数学第3问」回复了你", body: "「实对称矩阵的特征向量在不同特征值下天然正交…」", time: "3 小时前", unread: true, icon: "message", color: "indigo", actionLabel: "查看回复" },
  { id: "n4", type: "contrib",title: "你上传的「マセマ 线代 P.128 索引」被采纳", body: "已发放积分 +60，距离 1 个月 Pro 还差 60 分。", time: "昨天 18:20", unread: false, icon: "trophy", color: "amber", actionLabel: "查看积分" },
  { id: "n5", type: "system", title: "新版本 v0.4.2 已发布", body: "参考书索引页全新上线 · 跨校关联算法升级 · 错题本支持知识点矩阵视图。", time: "2 天前", unread: false, icon: "sparkles", color: "teal", actionLabel: "查看更新" },
  { id: "n6", type: "mention",title: "@ 你被 Mei 在「青本 P204…」中提到", body: "「@张同学 你之前那个对照笔记还在吗？」", time: "3 天前", unread: false, icon: "message", color: "indigo", actionLabel: "查看帖子" },
];

// ============================================================
// Pro 计划
// ============================================================
const KAKOMON_PLANS = [
  { id: "monthly",  label: "月付",   price: 38,  unit: "元 / 月",  savings: null,            badge: null },
  { id: "yearly",   label: "年付",   price: 288, unit: "元 / 年",  savings: "省 168 元",     badge: "推荐" },
  { id: "lifetime", label: "永久",   price: 698, unit: "元 · 永久", savings: "一次付清",     badge: null },
];
const KAKOMON_PLAN_FEATURES = [
  { feature: "标准解析",            free: "✓",       pro: "✓" },
  { feature: "参考书页码匹配",      free: "✓",       pro: "✓" },
  { feature: "AI 提问",             free: "1 次/日",  pro: "无限" },
  { feature: "AI 深度扩展讲解",     free: "—",        pro: "✓" },
  { feature: "跨校相似题（L3）",    free: "预览 2 题", pro: "全部" },
  { feature: "弱点地图深度分析",    free: "近 7 天",   pro: "全期 + 预测" },
  { feature: "AI 论坛总结",         free: "—",        pro: "✓" },
  { feature: "新过去问优先解锁",    free: "—",        pro: "提前 7 天" },
];

// ============================================================
// 搜索：热门关键词 / 最近搜索
// ============================================================
const KAKOMON_SEARCH_HOT = [
  "对角化", "动态规划", "二次型", "傅里叶", "假设检验", "图论", "微分方程", "矩阵的秩",
];
const KAKOMON_SEARCH_RECENT = ["东大 2024 数学", "对角化", "DP 背包"];

// expose to window for cross-file Babel scripts
Object.assign(window, {
  UNI_GRADS, UNI_MAJORS,
  KAKOMON_USER, KAKOMON_UNIVERSITIES, KAKOMON_QUESTIONS, KAKOMON_THREADS,
  KAKOMON_THREAD_REPLIES, KAKOMON_RECENT_ACTIVITY,
  KAKOMON_WRONG_QUESTIONS, KAKOMON_KNOWLEDGE_MATRIX,
  KAKOMON_REFERENCE_BOOKS, KAKOMON_SEARCH_HOT, KAKOMON_SEARCH_RECENT,
  KAKOMON_NOTIFICATIONS, KAKOMON_PLANS, KAKOMON_PLAN_FEATURES,
  KAKOMON_GROUPS, KAKOMON_GROUP_MESSAGES, KAKOMON_GROUP_MEMBERS, KAKOMON_GROUP_EVENTS,
  KAKOMON_PROFESSOR_DETAILS, KAKOMON_MATERIAL_REQUEST_DETAIL,
});
