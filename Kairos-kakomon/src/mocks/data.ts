import type { University, UniGrads, UniMajors } from '@/types/university';
import type { KakomonQuestion, WrongQuestion, KnowledgeMatrixGroup, ReferenceBook, ExamPaper } from '@/types/question';
import type { ForumThread, ThreadReply, StudyGroup } from '@/types/forum';
import type { UserProfile } from '@/types/user';

// ─── 研究科列表 ────────────────────────────────────────────
export const UNI_GRADS: UniGrads = {
  todai:        ['info-sci', 'engineering', 'science', 'economics', 'new-domain', 'integrated-culture'],
  titech:       ['info-sci', 'engineering', 'science', 'materials', 'env-social'],
  kyodai:       ['engineering', 'science', 'informatics', 'economics', 'agriculture'],
  waseda:       ['core-sci', 'creative-sci', 'advanced-sci', 'economics', 'commerce'],
  keio:         ['science-engineering', 'economics', 'commerce', 'law', 'media'],
  osakau:       ['engineering', 'basic-engineering', 'science', 'info-science'],
  hitotsubashi: ['economics', 'commerce', 'law', 'sociology'],
  kobe:         ['engineering', 'economics', 'maritime', 'intl-culture'],
  nagoya:       ['engineering', 'informatics', 'science', 'economics'],
  kyushu:       ['engineering', 'info-science', 'science', 'economics'],
  hokudai:      ['engineering', 'science', 'agriculture', 'info-science'],
  tohoku:       ['engineering', 'science', 'info-science', 'economics'],
  sophia:       ['science-engineering', 'economics', 'foreign-languages', 'global-studies'],
  doshisha:     ['science-engineering', 'economics', 'commerce', 'law'],
};

/** 研究科 code → 日文显示名。复合键 `大学::code`（同 code 跨校日文名不同）。 */
export const GRAD_SCHOOL_NAMES: Record<string, string> = {
  'todai::info-sci': '情报理工学系研究科', 'todai::engineering': '工学系研究科', 'todai::science': '理学系研究科',
  'todai::economics': '经济学研究科', 'todai::new-domain': '新领域创成科学研究科', 'todai::integrated-culture': '综合文化研究科',
  'titech::info-sci': '情报理工学院', 'titech::engineering': '工学院', 'titech::science': '理学院', 'titech::materials': '物质理工学院', 'titech::env-social': '环境社会理工学院',
  'kyodai::engineering': '工学研究科', 'kyodai::science': '理学研究科', 'kyodai::informatics': '情报学研究科', 'kyodai::economics': '经济学研究科', 'kyodai::agriculture': '农学研究科',
  'waseda::core-sci': '基干理工学研究科', 'waseda::creative-sci': '创造理工学研究科', 'waseda::advanced-sci': '先进理工学研究科', 'waseda::economics': '经济学研究科', 'waseda::commerce': '商学研究科',
  'keio::science-engineering': '理工学研究科', 'keio::economics': '经济学研究科', 'keio::commerce': '商学研究科', 'keio::law': '法学研究科', 'keio::media': '媒体研究科',
  'osakau::engineering': '工学研究科', 'osakau::basic-engineering': '基础工学研究科', 'osakau::science': '理学研究科', 'osakau::info-science': '情报科学研究科',
  'hitotsubashi::economics': '经济学研究科', 'hitotsubashi::commerce': '商学研究科', 'hitotsubashi::law': '法学研究科', 'hitotsubashi::sociology': '社会学研究科',
  'kobe::engineering': '工学研究科', 'kobe::economics': '经济学研究科', 'kobe::maritime': '海事科学研究科', 'kobe::intl-culture': '国际文化学研究科',
  'nagoya::engineering': '工学研究科', 'nagoya::informatics': '情报学研究科', 'nagoya::science': '理学研究科', 'nagoya::economics': '经济学研究科',
  'kyushu::engineering': '工学府', 'kyushu::info-science': '情报科学府', 'kyushu::science': '理学府', 'kyushu::economics': '经济学府',
  'hokudai::engineering': '工学院', 'hokudai::science': '理学院', 'hokudai::agriculture': '农学院', 'hokudai::info-science': '情报科学院',
  'tohoku::engineering': '工学研究科', 'tohoku::science': '理学研究科', 'tohoku::info-science': '情报科学研究科', 'tohoku::economics': '经济学研究科',
  'sophia::science-engineering': '理工学研究科', 'sophia::economics': '经济学研究科', 'sophia::foreign-languages': '外国语学研究科', 'sophia::global-studies': '全球研究研究科',
  'doshisha::science-engineering': '理工学研究科', 'doshisha::economics': '经济学研究科', 'doshisha::commerce': '商学研究科', 'doshisha::law': '法学研究科',
};

/** 研究科 code → 完整日文显示名(不截断)。查不到回退 code 本身。供标题/副标题/breadcrumb 用。 */
export function gradName(universityId: string, code: string): string {
  if (!code) return '';
  return GRAD_SCHOOL_NAMES[`${universityId}::${code}`] ?? code;
}

// ─── 専攻 / コース ─────────────────────────────────────────
export const UNI_MAJORS: UniMajors = {
  'todai::info-sci': [
    { id: 'cs',   label: 'コンピュータ科学', short: 'CS',   desc: '算法 / OS / 编译' },
    { id: 'eeis', label: '电子情报学',       short: 'EEIS', desc: '电子 + 情报融合' },
    { id: 'mi',   label: '数理情报学',       short: 'MI',   desc: '应用数学 / 统计' },
    { id: 'si',   label: 'システム情报学',   short: 'SI',   desc: '系统设计 / 控制' },
    { id: 'ii',   label: '知能机械情报学',   short: 'IME',  desc: '机器人 / AI' },
    { id: 'cnsi', label: '创造情报学',       short: 'CNSI', desc: '创新 / 交叉' },
  ],
  'todai::engineering': [
    { id: 'ee',  label: '电气系工学',   short: 'EE',  desc: '电力 / 通信' },
    { id: 'me',  label: '机械工学',     short: 'ME',  desc: '机械设计' },
    { id: 'ce',  label: '土木工学',     short: 'CE',  desc: '土木 / 建筑' },
    { id: 'ae',  label: '航空宇宙工学', short: 'AE',  desc: '航空 / 航天' },
    { id: 'ap',  label: '应用物理学',   short: 'AP',  desc: '物理 + 工程' },
    { id: 'mse', label: '材料工学',     short: 'MSE', desc: '金属 / 半导体' },
  ],
  'todai::science': [
    { id: 'math', label: '数学',     short: 'Math', desc: '纯粹 / 应用' },
    { id: 'phys', label: '物理学',   short: 'Phys', desc: '理论 / 实验' },
    { id: 'chem', label: '化学',     short: 'Chem', desc: '' },
    { id: 'bio',  label: '生物科学', short: 'Bio',  desc: '' },
  ],
  'todai::economics': [
    { id: 'econ', label: '经济专攻',     short: 'Econ', desc: '宏观 / 微观' },
    { id: 'mgmt', label: '经营专攻',     short: 'Mgmt', desc: '管理 / 战略' },
    { id: 'fin',  label: '金融システム', short: 'Fin',  desc: '金融工程' },
  ],
  'titech::info-sci': [
    { id: 'mcs', label: '数理・计算科学', short: 'MCS', desc: '算法 + 数学' },
    { id: 'is',  label: '情报工学',       short: 'IS',  desc: '软件 / 系统' },
    { id: 'ai',  label: '知能情报',       short: 'AI',  desc: 'AI / ML' },
  ],
  'titech::engineering': [
    { id: 'ee',  label: '电気電子',     short: 'EE',  desc: '电子设计' },
    { id: 'me',  label: '机械系',       short: 'ME',  desc: '机械工程' },
    { id: 'sys', label: 'システム制御', short: 'Sys', desc: '控制 / 机器人' },
  ],
  'kyodai::informatics': [
    { id: 'ii',  label: '知能情报学',       short: 'II',  desc: 'AI / NLP' },
    { id: 'si',  label: '社会情报学',       short: 'SI',  desc: '数据 + 社会' },
    { id: 'sys', label: '系统科学',         short: 'Sys', desc: '控制系统' },
    { id: 'cis', label: '通信情报システム', short: 'CIS', desc: '网络 / 通信' },
  ],
  'kyodai::engineering': [
    { id: 'ee',  label: '电气工学', short: 'EE',  desc: '' },
    { id: 'me',  label: '机械工学', short: 'ME',  desc: '' },
    { id: 'mse', label: '材料工学', short: 'MSE', desc: '' },
  ],
  'waseda::core-sci': [
    { id: 'cs',   label: '情报理工',     short: 'CS',   desc: '' },
    { id: 'math', label: '数学应用数理', short: 'Math', desc: '' },
    { id: 'me',   label: '机械科学',     short: 'ME',   desc: '' },
  ],
  'keio::science-engineering': [
    { id: 'oe', label: '开放工学',   short: 'OE', desc: '' },
    { id: 'is', label: '情报工学',   short: 'IS', desc: '' },
    { id: 'bp', label: '基础理工学', short: 'BP', desc: '' },
  ],
};

// ─── 大学列表 ───────────────────────────────────────────────
export const KAKOMON_UNIVERSITIES: University[] = [
  // ── 旧帝大 ──────────────────────────────────────────────────
  {
    id: 'todai', nameCn: '东京大学', nameJp: '東京大学', nameEn: 'The University of Tokyo',
    short: '东大', nickname: '东大', type: 'national', region: '关东', regionGroup: '首都圏',
    rating: 4.7, examDifficulty: 'very_hard', pastExamCount: 312, reviewCount: 184,
    hotSubjects: ['数学', '情报', '物理'],
    dimensions: { 难度: 95, 完整度: 88, 透明度: 72, 合格经验: 92, 口碑: 96, 资料丰富度: 90 },
    tags: ['热门', '国立', '理工'], accent: 'blue', suitableFor: '线性代数 + 算法基础扎实者',
    qsRank: 28, domesticRank: 1,
    professorHighlights: [
      { name: '山田 健司', lab: '情报理工 · 计算机科学专攻', direction: '分布式系统 / 并发理论', reviewCount: 12 },
      { name: '佐藤 浩',   lab: '工学系 · 电子情报工学',    direction: '信号处理 / 机器学习',  reviewCount: 9 },
    ],
  },
  {
    id: 'kyodai', nameCn: '京都大学', nameJp: '京都大学', nameEn: 'Kyoto University',
    short: '京大', nickname: '京大', type: 'national', region: '关西', regionGroup: '关西圏',
    rating: 4.6, examDifficulty: 'hard', pastExamCount: 198, reviewCount: 121,
    hotSubjects: ['数学', '工学', '经济'],
    dimensions: { 难度: 90, 完整度: 80, 透明度: 70, 合格经验: 84, 口碑: 92, 资料丰富度: 78 },
    tags: ['热门', '国立'], accent: 'indigo', suitableFor: '想做基础研究方向',
    qsRank: 46, domesticRank: 2, professorHighlights: [],
  },
  {
    id: 'osakau', nameCn: '大阪大学', nameJp: '大阪大学', nameEn: 'Osaka University',
    short: '阪大', nickname: '阪大', type: 'national', region: '关西', regionGroup: '关西圏',
    rating: 4.1, examDifficulty: 'hard', pastExamCount: 142, reviewCount: 64,
    hotSubjects: ['工学', '理学', '医学'],
    dimensions: { 难度: 82, 完整度: 65, 透明度: 60, 合格经验: 70, 口碑: 78, 资料丰富度: 60 },
    tags: ['国立', '理工', '旧帝大'], accent: 'blue', suitableFor: '理工方向 + 关西地区',
    qsRank: 185, domesticRank: 4, professorHighlights: [],
  },
  {
    id: 'tohoku', nameCn: '东北大学', nameJp: '東北大学', nameEn: 'Tohoku University',
    short: '东北大', nickname: '东北', type: 'national', region: '东北', regionGroup: '东北',
    rating: 4.2, examDifficulty: 'hard', pastExamCount: 118, reviewCount: 56,
    hotSubjects: ['工学', '理学', '材料'],
    dimensions: { 难度: 80, 完整度: 75, 透明度: 72, 合格经验: 70, 口碑: 80, 资料丰富度: 65 },
    tags: ['国立', '旧帝大', '理工'], accent: 'blue', suitableFor: '材料 / 机械工程',
    qsRank: 223, domesticRank: 5, professorHighlights: [],
  },
  {
    id: 'nagoya', nameCn: '名古屋大学', nameJp: '名古屋大学', nameEn: 'Nagoya University',
    short: '名大', nickname: '名大', type: 'national', region: '中部', regionGroup: '中部',
    rating: 4.2, examDifficulty: 'hard', pastExamCount: 132, reviewCount: 58,
    hotSubjects: ['理工', '医学', '文学'],
    dimensions: { 难度: 80, 完整度: 75, 透明度: 70, 合格经验: 72, 口碑: 82, 资料丰富度: 68 },
    tags: ['国立', '旧帝大'], accent: 'blue', suitableFor: '理工方向 + 中部地区',
    qsRank: 231, domesticRank: 6, professorHighlights: [],
  },
  {
    id: 'kyushu', nameCn: '九州大学', nameJp: '九州大学', nameEn: 'Kyushu University',
    short: '九大', nickname: '九大', type: 'national', region: '九州', regionGroup: '九州',
    rating: 4.0, examDifficulty: 'medium', pastExamCount: 96, reviewCount: 40,
    hotSubjects: ['工学', '理学', '医学'],
    dimensions: { 难度: 72, 完整度: 68, 透明度: 70, 合格经验: 65, 口碑: 76, 资料丰富度: 58 },
    tags: ['国立', '旧帝大'], accent: 'teal', suitableFor: '九州地区 + 性价比高',
    qsRank: 285, domesticRank: 7, professorHighlights: [],
  },
  {
    id: 'hokudai', nameCn: '北海道大学', nameJp: '北海道大学', nameEn: 'Hokkaido University',
    short: '北大', nickname: '北大', type: 'national', region: '北海道', regionGroup: '北海道',
    rating: 4.0, examDifficulty: 'medium', pastExamCount: 88, reviewCount: 38,
    hotSubjects: ['农学', '工学', '生命科学'],
    dimensions: { 难度: 68, 完整度: 62, 透明度: 68, 合格经验: 62, 口碑: 78, 资料丰富度: 55 },
    tags: ['国立', '旧帝大'], accent: 'teal', suitableFor: '农学 / 生命科学',
    qsRank: 350, domesticRank: 8, professorHighlights: [],
  },
  // ── 国立（非旧帝） ───────────────────────────────────────────
  {
    id: 'titech', nameCn: '东京工业大学', nameJp: '東京科学大学', nameEn: 'Institute of Science Tokyo',
    short: '东工大', nickname: '东工大', type: 'national', region: '关东', regionGroup: '首都圏',
    rating: 4.5, examDifficulty: 'hard', pastExamCount: 256, reviewCount: 142,
    hotSubjects: ['数学', '情报', '工学'],
    dimensions: { 难度: 88, 完整度: 92, 透明度: 80, 合格经验: 78, 口碑: 88, 资料丰富度: 85 },
    tags: ['热门', '国立', '理工'], accent: 'teal', suitableFor: '工科背景且数学功底强',
    qsRank: 168, domesticRank: 3,
    professorHighlights: [
      { name: '高桥 修', lab: '情报理工学院 · 数理計算科学', direction: '数值最适化 / 凸优化', reviewCount: 8 },
    ],
  },
  {
    id: 'hitotsubashi', nameCn: '一桥大学', nameJp: '一橋大学', nameEn: 'Hitotsubashi University',
    short: '一桥', nickname: '一桥', type: 'national', region: '关东', regionGroup: '首都圏',
    rating: 4.3, examDifficulty: 'hard', pastExamCount: 124, reviewCount: 72,
    hotSubjects: ['经济', '商科', '法学'],
    dimensions: { 难度: 86, 完整度: 72, 透明度: 68, 合格经验: 76, 口碑: 88, 资料丰富度: 70 },
    tags: ['热门', '国立', '文商'], accent: 'indigo', suitableFor: '经济 / 商科 / 法学顶尖',
    domesticRank: 17, professorHighlights: [],
  },
  {
    id: 'tsukuba', nameCn: '筑波大学', nameJp: '筑波大学', nameEn: 'University of Tsukuba',
    short: '筑波', nickname: '筑波', type: 'national', region: '关东', regionGroup: '首都圏',
    rating: 4.0, examDifficulty: 'medium', pastExamCount: 104, reviewCount: 58,
    hotSubjects: ['情报', '体育', '理工'],
    dimensions: { 难度: 70, 完整度: 68, 透明度: 70, 合格经验: 72, 口碑: 76, 资料丰富度: 62 },
    tags: ['国立'], accent: 'blue', suitableFor: '情报 / 学际领域研究',
    qsRank: 548, domesticRank: 9, professorHighlights: [],
  },
  {
    id: 'kobe', nameCn: '神户大学', nameJp: '神戸大学', nameEn: 'Kobe University',
    short: '神户', nickname: '神户', type: 'national', region: '关西', regionGroup: '关西圏',
    rating: 4.0, examDifficulty: 'medium', pastExamCount: 108, reviewCount: 52,
    hotSubjects: ['经济', '工学', '海事'],
    dimensions: { 难度: 72, 完整度: 70, 透明度: 65, 合格经验: 70, 口碑: 78, 资料丰富度: 60 },
    tags: ['国立'], accent: 'blue', suitableFor: '经济底色 + 关西',
    qsRank: 555, domesticRank: 11, professorHighlights: [],
  },
  {
    id: 'hiroshima', nameCn: '广岛大学', nameJp: '広島大学', nameEn: 'Hiroshima University',
    short: '广岛大', nickname: '広大', type: 'national', region: '中国', regionGroup: '中部',
    rating: 3.9, examDifficulty: 'medium', pastExamCount: 82, reviewCount: 44,
    hotSubjects: ['教育', '工学', '理学'],
    dimensions: { 难度: 66, 完整度: 60, 透明度: 65, 合格经验: 62, 口碑: 72, 资料丰富度: 55 },
    tags: ['国立'], accent: 'teal', suitableFor: '教育 / 理工 + 中国地区',
    qsRank: 551, domesticRank: 12, professorHighlights: [],
  },
  {
    id: 'chiba', nameCn: '千叶大学', nameJp: '千葉大学', nameEn: 'Chiba University',
    short: '千叶大', nickname: '千大', type: 'national', region: '关东', regionGroup: '首都圏',
    rating: 3.8, examDifficulty: 'medium', pastExamCount: 76, reviewCount: 38,
    hotSubjects: ['医学', '工学', '园艺'],
    dimensions: { 难度: 65, 完整度: 58, 透明度: 62, 合格经验: 60, 口碑: 72, 资料丰富度: 52 },
    tags: ['国立'], accent: 'teal', suitableFor: '医学 / 园艺 + 首都圈国立',
    qsRank: 701, domesticRank: 15, professorHighlights: [],
  },
  {
    id: 'yokohama', nameCn: '横浜国立大学', nameJp: '横浜国立大学', nameEn: 'Yokohama National University',
    short: '横国', nickname: '横国', type: 'national', region: '关东', regionGroup: '首都圏',
    rating: 3.8, examDifficulty: 'medium', pastExamCount: 68, reviewCount: 32,
    hotSubjects: ['工学', '经济', '教育'],
    dimensions: { 难度: 65, 完整度: 55, 透明度: 60, 合格经验: 58, 口碑: 70, 资料丰富度: 50 },
    tags: ['国立'], accent: 'blue', suitableFor: '工学 / 经济 + 性价比型首都圈',
    qsRank: 751, domesticRank: 20, professorHighlights: [],
  },
  // ── 私立上位 ─────────────────────────────────────────────────
  {
    id: 'waseda', nameCn: '早稻田大学', nameJp: '早稲田大学', nameEn: 'Waseda University',
    short: '早大', nickname: '早大', type: 'private', region: '关东', regionGroup: '首都圏',
    rating: 4.2, examDifficulty: 'medium', pastExamCount: 174, reviewCount: 98,
    hotSubjects: ['经济', '商科', '情报'],
    dimensions: { 难度: 72, 完整度: 70, 透明度: 60, 合格经验: 80, 口碑: 84, 资料丰富度: 70 },
    tags: ['私立', '文商'], accent: 'indigo', suitableFor: '文商 / 经济方向',
    qsRank: 669, domesticRank: 16, professorHighlights: [],
  },
  {
    id: 'keio', nameCn: '庆应义塾大学', nameJp: '慶應義塾大学', nameEn: 'Keio University',
    short: '庆应', nickname: '庆应', type: 'private', region: '关东', regionGroup: '首都圏',
    rating: 4.3, examDifficulty: 'medium', pastExamCount: 156, reviewCount: 86,
    hotSubjects: ['经济', '商科', '理工'],
    dimensions: { 难度: 75, 完整度: 68, 透明度: 65, 合格经验: 82, 口碑: 86, 资料丰富度: 68 },
    tags: ['私立'], accent: 'indigo', suitableFor: '经济 / 商科 / 理工综合',
    qsRank: 658, domesticRank: 14, professorHighlights: [],
  },
  {
    id: 'tus', nameCn: '东京理科大学', nameJp: '東京理科大学', nameEn: 'Tokyo University of Science',
    short: '理科大', nickname: '理科大', type: 'private', region: '关东', regionGroup: '首都圏',
    rating: 4.0, examDifficulty: 'medium', pastExamCount: 92, reviewCount: 48,
    hotSubjects: ['数学', '物理', '工学'],
    dimensions: { 难度: 72, 完整度: 62, 透明度: 65, 合格经验: 68, 口碑: 76, 资料丰富度: 60 },
    tags: ['私立', '理工'], accent: 'teal', suitableFor: '理工系私立中性价比最高',
    domesticRank: 23, professorHighlights: [],
  },
  {
    id: 'sophia', nameCn: '上智大学', nameJp: '上智大学', nameEn: 'Sophia University',
    short: '上智', nickname: '上智', type: 'private', region: '关东', regionGroup: '首都圏',
    rating: 4.0, examDifficulty: 'medium', pastExamCount: 86, reviewCount: 42,
    hotSubjects: ['外语', '国际关系', '文商'],
    dimensions: { 难度: 68, 完整度: 60, 透明度: 65, 合格经验: 70, 口碑: 78, 资料丰富度: 58 },
    tags: ['私立', '文商'], accent: 'indigo', suitableFor: '外语 / 国际业务',
    qsRank: 906, domesticRank: 22, professorHighlights: [],
  },
  {
    id: 'meiji', nameCn: '明治大学', nameJp: '明治大学', nameEn: 'Meiji University',
    short: '明治', nickname: '明治', type: 'private', region: '关东', regionGroup: '首都圏',
    rating: 3.8, examDifficulty: 'medium', pastExamCount: 64, reviewCount: 38,
    hotSubjects: ['法学', '商科', '经济'],
    dimensions: { 难度: 62, 完整度: 55, 透明度: 58, 合格经验: 62, 口碑: 68, 资料丰富度: 50 },
    tags: ['私立', '文商', 'MARCH'], accent: 'rose', suitableFor: '法学 / 商科 + MARCH 首选',
    domesticRank: 42, professorHighlights: [],
  },
  {
    id: 'chuo', nameCn: '中央大学', nameJp: '中央大学', nameEn: 'Chuo University',
    short: '中央', nickname: '中大', type: 'private', region: '关东', regionGroup: '首都圏',
    rating: 3.7, examDifficulty: 'medium', pastExamCount: 58, reviewCount: 30,
    hotSubjects: ['法学', '经济', '理工'],
    dimensions: { 难度: 62, 完整度: 52, 透明度: 56, 合格经验: 60, 口碑: 66, 资料丰富度: 48 },
    tags: ['私立', '文商', 'MARCH'], accent: 'rose', suitableFor: '法学名门 + 理工均衡',
    domesticRank: 48, professorHighlights: [],
  },
  {
    id: 'ritsumeikan', nameCn: '立命馆大学', nameJp: '立命館大学', nameEn: 'Ritsumeikan University',
    short: '立命馆', nickname: '立命', type: 'private', region: '关西', regionGroup: '关西圏',
    rating: 3.8, examDifficulty: 'medium', pastExamCount: 72, reviewCount: 36,
    hotSubjects: ['情报', '经济', '理工'],
    dimensions: { 难度: 62, 完整度: 55, 透明度: 60, 合格经验: 65, 口碑: 68, 资料丰富度: 52 },
    tags: ['私立', '关西', '关关同立'], accent: 'amber', suitableFor: '情报 / 理工 + 关西中坚',
    domesticRank: 30, professorHighlights: [],
  },
  {
    id: 'doshisha', nameCn: '同志社大学', nameJp: '同志社大学', nameEn: 'Doshisha University',
    short: '同志社', nickname: '同社', type: 'private', region: '关西', regionGroup: '关西圏',
    rating: 3.9, examDifficulty: 'medium', pastExamCount: 78, reviewCount: 36,
    hotSubjects: ['经济', '法学', '商科'],
    dimensions: { 难度: 65, 完整度: 58, 透明度: 62, 合格经验: 68, 口碑: 74, 资料丰富度: 55 },
    tags: ['私立', '文商', '关西', '关关同立'], accent: 'indigo', suitableFor: '关西私立 / 文商旗舰',
    domesticRank: 35, professorHighlights: [],
  },
  {
    id: 'kansai', nameCn: '关西大学', nameJp: '関西大学', nameEn: 'Kansai University',
    short: '关大', nickname: '関大', type: 'private', region: '关西', regionGroup: '关西圏',
    rating: 3.7, examDifficulty: 'medium', pastExamCount: 54, reviewCount: 28,
    hotSubjects: ['法学', '商科', '社会'],
    dimensions: { 难度: 60, 完整度: 52, 透明度: 56, 合格经验: 60, 口碑: 64, 资料丰富度: 46 },
    tags: ['私立', '关西', '关关同立'], accent: 'amber', suitableFor: '关西地区文商性价比',
    domesticRank: 36, professorHighlights: [],
  },
];

// ─── 过去问题目 ─────────────────────────────────────────────
export const KAKOMON_QUESTIONS: KakomonQuestion[] = [
  {
    id: 'q-todai-2024-math-3',
    universityId: 'todai', graduateSchool: 'info-sci',
    majorIds: ['cs', 'mi', 'si'],
    year: 2024, subject: '数学', questionNo: '第3问',
    title: '固有值与对角化',
    bodyText: '设 3×3 实对称矩阵 A 满足 A·v₁ = 2v₁，A·v₂ = -v₂，A·v₃ = 5v₃，其中 v₁, v₂, v₃ 是相互正交的单位向量。\n（1）证明 A 必可对角化；\n（2）求 Aⁿ 的一般表达式（n 为正整数）；\n（3）若再设 B = A² - 6A + 5I，判断 B 是否可逆，并求其特征值。',
    formulaPreview: ['A·vᵢ = λᵢ·vᵢ,  i = 1, 2, 3', '求 Aⁿ  及  B = A² - 6A + 5I'],
    paperId: 'p-todai-2024-math',
    orderIndex: 3,
    contentBlocks: [
      { type: 'text', content: '設 3×3 実対称行列 A について、以下の問いに答えよ。' },
      { type: 'math', latex: 'A v_1 = 2 v_1,\\quad A v_2 = -v_2,\\quad A v_3 = 5 v_3' },
      { type: 'text', content: 'ここで v₁, v₂, v₃ は互いに直交する単位ベクトルである。' },
      { type: 'text', content: '(1) A が対角化可能であることを示せ。' },
      { type: 'text', content: '(2) 自然数 n に対し Aⁿ の一般式を求めよ。' },
      { type: 'math', latex: 'B = A^2 - 6A + 5I' },
      { type: 'text', content: '(3) B が可逆かどうか判定し、その固有値を求めよ。' },
    ],
    knowledgePoints: ['线性代数', '固有值', '对角化', '二次型'],
    difficultyLabel: '中等偏难',
    difficultyLevel: 'hard',
    crowdDifficultyRate: 0.68,
    crowdVotes: { easy: 12, medium: 38, hard: 84 },
    masteryStatus: null,
    standardExplanation: [
      { title: 'Step 1 · 判断可对角化性', body: '实对称矩阵的三个不同特征值 (2, -1, 5) 对应的特征向量 v₁, v₂, v₃ 已正交且单位化，故矩阵 P = [v₁ v₂ v₃] 为正交矩阵，A = P·diag(2,-1,5)·Pᵀ。' },
      { title: 'Step 2 · 计算 Aⁿ', body: '由 A = P·D·Pᵀ 立刻得到 Aⁿ = P·diag(2ⁿ, (-1)ⁿ, 5ⁿ)·Pᵀ。这是因正交矩阵 P 满足 PᵀP = I。' },
      { title: 'Step 3 · 分析 B 可逆性', body: 'B = A² - 6A + 5I 的特征值为 λᵢ² - 6λᵢ + 5。代入 λ ∈ {2, -1, 5}：B 的特征值为 -3, 12, 0。其中含 0，故 B 不可逆。' },
    ],
    referenceMatches: [
      {
        id: 'r1', bookTitle: 'マセマ 线性代数', chapter: '第4章 固有值与固有向量', pageRange: 'P.128-131',
        matchType: 'exact_question', reason: '几乎相同题型：实对称矩阵对角化 + 计算 Aⁿ。',
        rewrittenSummary: '本节先讲解实对称矩阵正交对角化定理，再用相同模板计算 Aⁿ。例题与本题结构一致，可直接对照解题步骤。',
      },
      {
        id: 'r2', bookTitle: '演习 大学院入试 数学', chapter: '线代演习篇 例题 12', pageRange: 'P.56',
        matchType: 'same_point', reason: '同知识点 — 固有值多项式与可逆性判定。',
        rewrittenSummary: '通过特征值代入 f(A) 判断 f(A) 是否可逆，是修考常见的考点延伸。',
      },
      {
        id: 'r3', bookTitle: '青本 数学（东大编）', chapter: '对角化基础与应用', pageRange: 'P.204',
        matchType: 'similar_method', reason: '相似解法 — 用正交矩阵简化求幂运算。',
        rewrittenSummary: '教科书侧重于解法套路，先正交化再求幂；推导过程简洁。',
      },
    ],
    relatedQuestions: [
      { id: 'rq1', level: 1, title: '实对称矩阵的对角化与求幂', universityId: 'titech', universityName: '东工大', year: 2021, subject: '数学', questionNo: '第2问', reason: '完全相同考点：正交对角化 + 求 Aⁿ。', confidence: 0.94 },
      { id: 'rq2', level: 1, title: '二次型标准化', universityId: 'todai', universityName: '东大', year: 2019, subject: '数学', questionNo: '第3问', reason: '同校不同年份，相同套路。', confidence: 0.88 },
      { id: 'rq3', level: 2, title: '矩阵多项式可逆性判定', universityId: 'kyodai', universityName: '京大', year: 2022, subject: '数学', questionNo: '第1问', reason: '相同方法：用特征值代入多项式。', confidence: 0.79 },
    ],
    hasOriginalImage: true,
  },
  {
    id: 'q-titech-2021-math-2',
    universityId: 'titech', graduateSchool: 'info-sci',
    majorIds: ['mcs', 'is'],
    year: 2021, subject: '数学', questionNo: '第2问',
    title: '二次型标准化',
    knowledgePoints: ['线性代数', '二次型', '正交变换'],
    difficultyLabel: '中等',
    difficultyLevel: 'medium',
    crowdDifficultyRate: 0.52,
    masteryStatus: null,
  },
  {
    id: 'q-kyodai-2023-math-1',
    universityId: 'kyodai', graduateSchool: 'engineering',
    majorIds: ['ee', 'me', 'mse'],
    year: 2023, subject: '数学', questionNo: '第1问',
    title: '多重积分与极坐标',
    knowledgePoints: ['微积分', '重积分', '极坐标变换'],
    difficultyLabel: '中等偏难',
    difficultyLevel: 'hard',
    crowdDifficultyRate: 0.62,
    masteryStatus: null,
  },
  {
    id: 'q-waseda-2024-stat-2',
    universityId: 'waseda', graduateSchool: 'economics',
    year: 2024, subject: '统计', questionNo: '第2问',
    title: '假设检验：Z 检验与 P 值',
    knowledgePoints: ['概率统计', '假设检验', 'Z 检验'],
    difficultyLabel: '中等',
    difficultyLevel: 'medium',
    crowdDifficultyRate: 0.45,
    masteryStatus: null,
  },
  {
    id: 'q-todai-2023-math-1',
    universityId: 'todai', graduateSchool: 'info-sci',
    majorIds: ['mi', 'cs', 'si'],
    year: 2023, subject: '数学', questionNo: '第1问',
    title: '线性变换与基变换',
    knowledgePoints: ['线性代数', '线性变换', '基'],
    difficultyLabel: '中等',
    difficultyLevel: 'medium',
    crowdDifficultyRate: 0.55,
    masteryStatus: 'mastered',
  },
  {
    id: 'q-todai-2024-info-2',
    universityId: 'todai', graduateSchool: 'info-sci',
    majorIds: ['cs', 'ii'],
    year: 2024, subject: '情报', questionNo: '第2问',
    title: '动态规划：背包问题变形',
    knowledgePoints: ['算法', '动态规划'],
    difficultyLabel: '难',
    difficultyLevel: 'very_hard',
    crowdDifficultyRate: 0.78,
    masteryStatus: 'wrong',
  },

  // ── 扩充题库（多校 × 多年 × 多专题 × 难度）──────────────────
  // 东大
  { id: 'q-todai-2026-math-1', universityId: 'todai', graduateSchool: 'info-sci', majorIds: ['cs', 'mi', 'si', 'eeis'], year: 2026, subject: '数学', questionNo: '第1问', title: '矩阵的 Jordan 标准形', knowledgePoints: ['线性代数', 'Jordan标准形', '广义特征向量'], difficultyLabel: '难', difficultyLevel: 'very_hard', crowdDifficultyRate: 0.81, masteryStatus: null },
  { id: 'q-todai-2026-math-2', universityId: 'todai', graduateSchool: 'info-sci', majorIds: ['cs', 'mi', 'si'], year: 2026, subject: '数学', questionNo: '第2问', title: '重积分与变量代换', knowledgePoints: ['微积分', '重积分', '雅可比行列式'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.5, masteryStatus: null },
  { id: 'q-todai-2025-math-2', universityId: 'todai', graduateSchool: 'info-sci', majorIds: ['mi', 'cs'], year: 2025, subject: '数学', questionNo: '第2问', title: '二次型与正定性判定', knowledgePoints: ['线性代数', '二次型', '正定矩阵'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.54, masteryStatus: null },
  { id: 'q-todai-2025-info-1', universityId: 'todai', graduateSchool: 'info-sci', majorIds: ['cs', 'ii'], year: 2025, subject: '情报', questionNo: '第1问', title: '图算法：最短路与 Dijkstra', knowledgePoints: ['算法', '图论', '最短路'], difficultyLabel: '中等偏难', difficultyLevel: 'hard', crowdDifficultyRate: 0.66, masteryStatus: null },
  { id: 'q-todai-2022-math-1', universityId: 'todai', graduateSchool: 'info-sci', majorIds: ['mi', 'cs', 'si'], year: 2022, subject: '数学', questionNo: '第1问', title: '傅里叶级数展开', knowledgePoints: ['微积分', '傅里叶级数', '周期函数'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.57, masteryStatus: null },
  // 东大 2024 数学：与 q-todai-2024-math-3 同卷，凑齐一张「6问选3」类整卷（此处 3 问选 2）供模考演示
  { id: 'q-todai-2024-math-1', universityId: 'todai', graduateSchool: 'info-sci', majorIds: ['cs', 'mi', 'si'], year: 2024, subject: '数学', questionNo: '第1问', paperId: 'p-todai-2024-math', orderIndex: 1, title: '定积分与常微分方程', bodyText: '（1）以下の定積分を求めよ。\n（2）微分方程式の一般解と特異解を求めよ。', knowledgePoints: ['微积分', '定积分', '微分方程'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.5, masteryStatus: null },
  { id: 'q-todai-2024-math-2', universityId: 'todai', graduateSchool: 'info-sci', majorIds: ['cs', 'mi', 'si'], year: 2024, subject: '数学', questionNo: '第2问', paperId: 'p-todai-2024-math', orderIndex: 2, title: '3 次正方行列的固有值与幂', bodyText: '3 次正方行列 A について、固有値をすべて求め、Aⁿ を求めよ。', knowledgePoints: ['线性代数', '固有值', '矩阵幂'], difficultyLabel: '中等偏难', difficultyLevel: 'hard', crowdDifficultyRate: 0.6, masteryStatus: null },

  // 东工大
  { id: 'q-titech-2026-math-1', universityId: 'titech', graduateSchool: 'info-sci', majorIds: ['mcs', 'is', 'ai'], year: 2026, subject: '数学', questionNo: '第1问', title: '固有值问题与对角化', knowledgePoints: ['线性代数', '固有值', '对角化'], difficultyLabel: '中等偏难', difficultyLevel: 'hard', crowdDifficultyRate: 0.64, masteryStatus: null },
  { id: 'q-titech-2025-info-1', universityId: 'titech', graduateSchool: 'info-sci', majorIds: ['is', 'ai'], year: 2025, subject: '情报', questionNo: '第1问', title: '动态规划：编辑距离', knowledgePoints: ['算法', '动态规划', '字符串'], difficultyLabel: '难', difficultyLevel: 'very_hard', crowdDifficultyRate: 0.74, masteryStatus: null },
  { id: 'q-titech-2024-math-1', universityId: 'titech', graduateSchool: 'info-sci', majorIds: ['mcs', 'is'], year: 2024, subject: '数学', questionNo: '第1问', title: '线性空间与基的变换', knowledgePoints: ['线性代数', '线性变换', '基'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.52, masteryStatus: null },
  // 理学院尚未在 UNI_MAJORS 配置专攻 → majorIds 留空，视为全研究科通用题
  { id: 'q-titech-2023-physics-1', universityId: 'titech', graduateSchool: 'science', year: 2023, subject: '物理', questionNo: '第1问', title: '一维势阱中的薛定谔方程', knowledgePoints: ['物理', '量子力学', '薛定谔方程'], difficultyLabel: '难', difficultyLevel: 'very_hard', crowdDifficultyRate: 0.8, masteryStatus: null },

  // 京大
  { id: 'q-kyodai-2026-math-1', universityId: 'kyodai', graduateSchool: 'engineering', majorIds: ['ee', 'me', 'mse'], year: 2026, subject: '数学', questionNo: '第1问', title: '常微分方程：齐次与非齐次', knowledgePoints: ['微积分', '微分方程', '常系数'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.55, masteryStatus: null },
  { id: 'q-kyodai-2025-math-1', universityId: 'kyodai', graduateSchool: 'engineering', majorIds: ['ee', 'me', 'mse'], year: 2025, subject: '数学', questionNo: '第1问', title: '重积分与极坐标变换', knowledgePoints: ['微积分', '重积分', '极坐标变换'], difficultyLabel: '中等偏难', difficultyLevel: 'hard', crowdDifficultyRate: 0.63, masteryStatus: null },
  { id: 'q-kyodai-2024-stat-1', universityId: 'kyodai', graduateSchool: 'informatics', majorIds: ['si', 'ii'], year: 2024, subject: '统计', questionNo: '第1问', title: '最大似然估计', knowledgePoints: ['概率统计', '最大似然', '参数估计'], difficultyLabel: '中等偏难', difficultyLevel: 'hard', crowdDifficultyRate: 0.61, masteryStatus: null },

  // 早大（基干理工现已配置专攻；经济学研究科未配置 → 留空）
  { id: 'q-waseda-2026-stat-1', universityId: 'waseda', graduateSchool: 'economics', year: 2026, subject: '统计', questionNo: '第1问', title: '回归分析与最小二乘', knowledgePoints: ['概率统计', '回归分析', '最小二乘'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.48, masteryStatus: null },
  { id: 'q-waseda-2025-stat-1', universityId: 'waseda', graduateSchool: 'economics', year: 2025, subject: '统计', questionNo: '第1问', title: '假设检验：t 检验', knowledgePoints: ['概率统计', '假设检验', 't检验'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.46, masteryStatus: null },

  // 庆应
  { id: 'q-keio-2025-math-1', universityId: 'keio', graduateSchool: 'science-engineering', majorIds: ['oe', 'is', 'bp'], year: 2025, subject: '数学', questionNo: '第1问', title: '复变函数与留数定理', knowledgePoints: ['微积分', '复变函数', '留数'], difficultyLabel: '难', difficultyLevel: 'very_hard', crowdDifficultyRate: 0.76, masteryStatus: null },
  { id: 'q-keio-2024-info-1', universityId: 'keio', graduateSchool: 'science-engineering', majorIds: ['is'], year: 2024, subject: '情报', questionNo: '第1问', title: '计算复杂度与 NP 问题', knowledgePoints: ['算法', '复杂度', 'NP'], difficultyLabel: '中等偏难', difficultyLevel: 'hard', crowdDifficultyRate: 0.6, masteryStatus: null },

  // 阪大（基础工学研究科未配置专攻 → 留空，全研究科通用）
  { id: 'q-osakau-2025-math-1', universityId: 'osakau', graduateSchool: 'basic-engineering', year: 2025, subject: '数学', questionNo: '第1问', title: '线性代数：秩与解空间', knowledgePoints: ['线性代数', '秩', '解空间'], difficultyLabel: '中等', difficultyLevel: 'medium', crowdDifficultyRate: 0.51, masteryStatus: null },
  { id: 'q-osakau-2024-math-1', universityId: 'osakau', graduateSchool: 'basic-engineering', year: 2024, subject: '数学', questionNo: '第1问', title: '固有值与二次型', knowledgePoints: ['线性代数', '固有值', '二次型'], difficultyLabel: '中等偏难', difficultyLevel: 'hard', crowdDifficultyRate: 0.65, masteryStatus: null },
];

// ─── 论坛帖子 ───────────────────────────────────────────────
export const KAKOMON_THREADS: ForumThread[] = [
  {
    id: 't1', title: '东大2024数学第3问，为什么一定可对角化？',
    type: 'question_discussion',
    universityId: 'todai', questionId: 'q-todai-2024-math-3',
    tags: ['线性代数', '对角化'],
    replyCount: 18, viewCount: 412,
    hasAcceptedAnswer: true,
    authorBadge: 'passed', authorName: '已合格 · 王同学',
    excerpt: '题目说三个特征向量已经正交且单位化，是不是直接套实对称矩阵正交对角化定理就行？还是要严格证明对应不同特征值的特征向量必正交？',
    lastActivity: '2 小时前',
  },
  {
    id: 't2', title: '求东工大情报理工 2022 数学解析',
    type: 'material_request',
    universityId: 'titech',
    tags: ['资料互助', '数学'],
    replyCount: 6, viewCount: 132,
    hasAcceptedAnswer: false,
    authorBadge: 'preparing', authorName: '备考中 · 李同学',
    excerpt: '有谁手里有 2022 年东工大情报理工的数学全套答案吗？可以付费获取，或者用我手里的 2023 早大资料交换。',
    materialRequestStatus: 'unsolved',
    lastActivity: '1 天前',
  },
  {
    id: 't3', title: '青本 P204 和东大这题是不是同一个套路？',
    type: 'question_discussion',
    universityId: 'todai', questionId: 'q-todai-2024-math-3',
    tags: ['参考书', '对角化'],
    replyCount: 9, viewCount: 268,
    hasAcceptedAnswer: false,
    authorBadge: 'preparing', authorName: '备考中 · 陈同学',
    excerpt: '我对照看了一下，感觉解法 90% 一样，但是青本的最后一步用的是行列式而不是特征值。哪种更稳妥？',
    lastActivity: '5 小时前',
  },
  {
    id: 't4', title: '东大 vs 东工大 情报修考难度怎么选？',
    type: 'experience',
    universityId: 'todai',
    tags: ['合格经验', '选校'],
    replyCount: 24, viewCount: 891,
    hasAcceptedAnswer: false,
    authorBadge: 'verified', authorName: '运营验证 · Kakomon',
    excerpt: '从过去三年的真题对比来看：东大数学难度上限更高，东工大覆盖面更广。本帖整理了两校的考点交集。',
    lastActivity: '3 天前',
  },
  {
    id: 't5', title: '东大同校备考小组 · 5 月线下答疑',
    type: 'study_circle',
    universityId: 'todai',
    tags: ['同校备考', '线下'],
    replyCount: 12, viewCount: 305,
    hasAcceptedAnswer: false,
    authorBadge: 'passed', authorName: '已合格 · 张学姐',
    excerpt: '本周日下午 14:00 在本郷キャンパス附近咖啡店，主题：线代 + 算法。报名请回复邮箱前缀。',
    lastActivity: '8 小时前',
  },
  {
    id: 't6', title: '马上面试，求东大教授研究方向 cheatsheet',
    type: 'material_request',
    universityId: 'todai',
    tags: ['资料互助', '面试'],
    replyCount: 11, viewCount: 178,
    hasAcceptedAnswer: true,
    authorBadge: 'preparing', authorName: '备考中 · Liu',
    excerpt: '已收集到 2 份学长整理。已采纳第 3 楼回复，附带链接。感谢！',
    materialRequestStatus: 'solved',
    lastActivity: '刚刚',
  },
];

// ─── 帖子回复 ───────────────────────────────────────────────
export const KAKOMON_THREAD_REPLIES: Record<string, ThreadReply[]> = {
  t1: [
    { id: 'r1', author: '王学长', badge: 'passed', time: '1 小时前', body: '实对称矩阵的特征向量在不同特征值下天然正交，这是谱定理的内容。题目把它们正交且单位化是给你方便，不用证明。直接写 P = [v₁ v₂ v₃] 就好。', upvotes: 24, isAccepted: true },
    { id: 'r2', author: 'Tanaka', badge: 'verified', time: '30 分钟前', body: '补充一下：对角化条件是「存在 n 个线性无关特征向量」，实对称矩阵的特殊性在于这 n 个特征向量可以选成正交基。所以 P 自然是正交矩阵。', upvotes: 14, isAccepted: false },
    { id: 'r3', author: 'Mei', badge: 'preparing', time: '20 分钟前', body: 'Step 3 我算出来 B 的特征值是 -3, 12, 0，所以 B 不可逆。但有个疑问：题目没说 v₁, v₂, v₃ 一定线性无关吧？', upvotes: 4, isAccepted: false },
  ],
  t2: [
    { id: 'r1', author: '田中学姐', badge: 'passed', time: '2 天前', body: '我当年是这么准备的：先把过去3年题目全部过一遍，整理出考点频率表。动态规划每年必考，建议先把背包问题的三种变形搞清楚。', upvotes: 18, isAccepted: true },
    { id: 'r2', author: 'Liu', badge: 'preparing', time: '1 天前', body: '请问线代部分会考 Jordan 标准形吗？感觉东大的题很少出现这个…', upvotes: 6, isAccepted: false },
    { id: 'r3', author: '王学长', badge: 'passed', time: '20 小时前', body: 'Jordan 形基本不考，重点还是对角化 + 正交化 + 二次型。东大更喜欢考应用而不是形式化理论。', upvotes: 11, isAccepted: false },
  ],
  t3: [
    { id: 'r1', author: '上传者A', badge: 'passed', time: '3 小时前', body: '已上传2023年考試問題 (PDFリンク)。答案部分我手写了解题思路，请在 Google Drive 里找。', upvotes: 22, isAccepted: true },
    { id: 'r2', author: 'Chen', badge: 'preparing', time: '1 小时前', body: '谢谢！有没有2022年的？网上找不到。', upvotes: 2, isAccepted: false },
  ],
  t4: [
    { id: 'r1', author: '对比帖作者', badge: 'verified', time: '3 天前', body: '核心区别：东大数学上限极高（会出综合性大题），东工大覆盖面广（每年科目组合变化大）。东大适合数学强的同学，东工大更考验全科平衡。', upvotes: 34, isAccepted: false },
    { id: 'r2', author: 'Kim', badge: 'preparing', time: '2 天前', body: '东工大的情报系除了数学还考情报理论吗？这里说的"情报"是指什么？', upvotes: 5, isAccepted: false },
    { id: 'r3', author: '东工大合格者', badge: 'passed', time: '1 天前', body: '情报系考数学（线代+微积分）+情报基础（算法+计算理论+数据结构），没有情报理论的专项考试。', upvotes: 16, isAccepted: false },
  ],
  t5: [
    { id: 'r1', author: '组织者', badge: 'passed', time: '5 天前', body: '名额还有4个，报名截止本周四。地点本郷 Starbucks 二楼，需要带自己的过去问和错题本。', upvotes: 8, isAccepted: false },
    { id: 'r2', author: 'Wang', badge: 'preparing', time: '3 天前', body: '我报名！发我 discord 联系方式吗？想和大家组个线上刷题群。', upvotes: 3, isAccepted: false },
  ],
  t6: [
    { id: 'r1', author: 'Zhang学长', badge: 'passed', time: '2 天前', body: '整理好了一份教授研究方向 + 面试风格的表，共 12 名教授。通过邮件发给你，请在 DM 留联系方式。', upvotes: 31, isAccepted: true },
    { id: 'r2', author: '感谢楼主', badge: 'preparing', time: '1 天前', body: '好人一生平安！我也需要，能私发给我一份吗？', upvotes: 7, isAccepted: false },
  ],
};

// ─── 学习圈 ──────────────────────────────────────────────────
export const KAKOMON_GROUPS: StudyGroup[] = [
  {
    id: 'g1',
    name: '东大情报 · 线代特训队',
    emoji: '📐',
    scope: 'school+subject',
    target: 'todai',
    subject: '线性代数',
    memberCount: 18,
    dailyActive: 7,
    avgProgress: 72,
    ownerName: '王学长',
    desc: '专攻东大情报理工修考数学，每周打卡3题，重点攻克固有值与二次型。',
    badges: ['🏆 旧帝大专项', '每日打卡'],
    openSlots: 2,
    todayTask: '今日任务：完成 2024年 东大数学 第3题（固有值与对角化）',
    accent: 'blue',
    verified: true,
    joined: true,
  },
  {
    id: 'g2',
    name: '动态规划算法道场',
    emoji: '⚡',
    scope: 'subject',
    subject: '算法',
    memberCount: 34,
    dailyActive: 12,
    avgProgress: 58,
    ownerName: 'TanakaSensei',
    desc: '从背包问题到区间DP，系统刷完东大·东工大近5年算法考题。',
    badges: ['高频考点', '东大·东工大'],
    openSlots: 8,
    todayTask: '今日任务：LCS最长公共子序列 + 3道DP变形题',
    accent: 'indigo',
    verified: false,
    joined: false,
  },
  {
    id: 'g3',
    name: '概率统计备考群',
    emoji: '📊',
    scope: 'subject',
    subject: '概率统计',
    memberCount: 22,
    dailyActive: 9,
    avgProgress: 61,
    ownerName: 'Mei',
    desc: '早大·一桥经济系必考概率统计，每天一题，附带解析讲解。',
    badges: ['文商专项', '每日题目'],
    openSlots: 5,
    todayTask: '今日任务：Z检验 + t检验 · 早大2023年统计题精讲',
    accent: 'amber',
    verified: false,
    joined: false,
  },
  {
    id: 'g4',
    name: '关西旧帝大攻略圈',
    emoji: '🌸',
    scope: 'school',
    target: 'kyodai',
    memberCount: 27,
    dailyActive: 10,
    avgProgress: 55,
    ownerName: '京大合格者A',
    desc: '京大·阪大·神户共同备考，分享各校过去问和合格经验。',
    badges: ['合格者在线', '关西旧帝大'],
    openSlots: 3,
    todayTask: '今日：分享京大2023年情报学考题 + 答案讨论',
    accent: 'teal',
    verified: true,
    joined: false,
  },
  {
    id: 'g5',
    name: '修考合格经验分享团',
    emoji: '🎓',
    scope: 'experience',
    memberCount: 41,
    dailyActive: 15,
    avgProgress: 80,
    ownerName: 'Kakomon运营',
    desc: '已合格学长学姐分享修考备战经验，Q&A 实时解答。',
    badges: ['官方认证', '已合格学长'],
    openSlots: 20,
    todayTask: '本周话题：面试准备篇 · 如何回答「志望理由」',
    accent: 'indigo',
    verified: true,
    joined: false,
  },
  {
    id: 'g6',
    name: '东工大情报 · 刷题小队',
    emoji: '🔬',
    scope: 'school+subject',
    target: 'titech',
    subject: '情报',
    memberCount: 14,
    dailyActive: 6,
    avgProgress: 63,
    ownerName: 'Kim',
    desc: '针对东工大情报理工学院，每天攻克一道过去问并整理解题思路。',
    badges: ['东工大专项', '情报系'],
    openSlots: 4,
    todayTask: '今日：东工大2022年情报基础 · 算法设计第2题',
    accent: 'teal',
    verified: false,
    joined: false,
  },
];

// ─── Demo 用户 ──────────────────────────────────────────────
export const DEMO_USER: UserProfile = {
  id: 'u1',
  nickname: '张同学',
  email: 'zhang@example.com',
  major: '情报理工',
  isPro: false,
  freeAiRemaining: 1,
  tokenBalance: 6,
  solvedCount: 42,
  unclearCount: 11,
  wrongCount: 8,
  favoriteCount: 17,
  aiAskCount: 23,
  contributorPoints: 240,
  targetSchools: [
    { universityId: 'todai', type: 'daigakuin', gradSchool: 'info-sci', majorId: 'cs', subjects: ['数学', '情报'], priority: 1 },
    { universityId: 'titech', type: 'daigakuin', gradSchool: 'info-sci', majorId: 'is', subjects: ['数学'], priority: 2 },
  ],
  weakPoints: [
    { subject: '线性代数', point: '固有值与对角化', level: 4, count: 6 },
    { subject: '线性代数', point: '二次型',         level: 3, count: 4 },
    { subject: '微积分',   point: '重积分',         level: 3, count: 3 },
    { subject: '微积分',   point: '傅里叶级数',     level: 2, count: 2 },
    { subject: '概率统计', point: '假设检验',       level: 2, count: 2 },
    { subject: '算法',     point: '动态规划',       level: 4, count: 5 },
  ],
  nextExam: {
    name: '东大 · 情报理工修考 一次',
    date: '2026-08-25',
    durationDays: 2,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  onboardingCompleted: true,
};

// ─── 错题本 ─────────────────────────────────────────────────
export const KAKOMON_WRONG_QUESTIONS: WrongQuestion[] = [
  { id: 'wq1', questionId: 'q-todai-2024-math-3', subject: '线性代数', point: '固有值与对角化', universityShort: '东大', year: 2024, questionNo: '第3问', title: '固有值与对角化', wrongCount: 3, lastWrongAt: '2 天前', nextReviewAt: '今天', masteryLevel: 1, tags: ['高频', '东大重点'] },
  { id: 'wq2', questionId: 'q-todai-2024-info-2', subject: '算法', point: '动态规划', universityShort: '东大', year: 2024, questionNo: '第2问', title: '动态规划：背包问题变形', wrongCount: 2, lastWrongAt: '5 天前', nextReviewAt: '今天', masteryLevel: 0, tags: ['极难'] },
  { id: 'wq3', questionId: 'q-kyodai-2023-math-1', subject: '微积分', point: '重积分', universityShort: '京大', year: 2023, questionNo: '第1问', title: '多重积分与极坐标', wrongCount: 1, lastWrongAt: '1 周前', nextReviewAt: '明天', masteryLevel: 2, tags: [] },
  { id: 'wq4', questionId: 'q-waseda-2024-stat-2', subject: '概率统计', point: '假设检验', universityShort: '早大', year: 2024, questionNo: '第2问', title: '假设检验：Z 检验与 P 值', wrongCount: 1, lastWrongAt: '3 天前', nextReviewAt: '后天', masteryLevel: 2, tags: [] },
  { id: 'wq5', questionId: 'q-titech-2021-math-2', subject: '线性代数', point: '二次型', universityShort: '东工大', year: 2021, questionNo: '第2问', title: '二次型标准化', wrongCount: 2, lastWrongAt: '1 周前', nextReviewAt: '3 天后', masteryLevel: 1, tags: ['跨校关联'] },
];

// ─── 知识点矩阵 ─────────────────────────────────────────────
export const KAKOMON_KNOWLEDGE_MATRIX: KnowledgeMatrixGroup[] = [
  {
    subject: '线性代数', color: 'blue', total: 5,
    points: [
      { point: '固有值与对角化', count: 3, mastery: 0.3, overlap: ['东大', '东工大'] },
      { point: '二次型',         count: 2, mastery: 0.5, overlap: ['东工大'] },
      { point: '线性变换',       count: 1, mastery: 0.7, overlap: [] },
    ],
  },
  {
    subject: '微积分', color: 'teal', total: 2,
    points: [
      { point: '重积分',   count: 1, mastery: 0.55, overlap: ['京大'] },
      { point: '傅里叶级数', count: 1, mastery: 0.6, overlap: [] },
    ],
  },
  {
    subject: '概率统计', color: 'amber', total: 1,
    points: [
      { point: '假设检验', count: 1, mastery: 0.65, overlap: ['早大'] },
    ],
  },
  {
    subject: '算法', color: 'rose', total: 2,
    points: [
      { point: '动态规划', count: 2, mastery: 0.2, overlap: ['东大'] },
    ],
  },
];

// ─── 参考书索引 ──────────────────────────────────────────────
export const KAKOMON_REFERENCE_BOOKS: ReferenceBook[] = [
  {
    id: 'b1', title: 'マセマ 线性代数', titleJp: 'マセマ 線形代数', author: '馬場敬之', cover: 'blue',
    category: '考研用书', rating: 4.8, ownedByCount: 3241, coveredQuestionCount: 48,
    popularSchools: ['东大', '东工大', '京大'],
    lastUpdate: '2023年版', tags: ['线代', '入门', '旧帝大'],
    chapters: [
      { id: 'c1', chapter: '第1章 行列式', pages: 'P.1-42', questionCount: 6, knowledgePoints: ['行列式', 'Cramer法则'], hot: false },
      { id: 'c2', chapter: '第2章 向量与线性空间', pages: 'P.43-88', questionCount: 9, knowledgePoints: ['线性无关', '基与维数'], hot: false },
      { id: 'c3', chapter: '第3章 矩阵的运算', pages: 'P.89-126', questionCount: 11, knowledgePoints: ['矩阵乘法', '逆矩阵', '分块矩阵'], hot: true },
      { id: 'c4', chapter: '第4章 固有值与固有向量', pages: 'P.128-168', questionCount: 14, knowledgePoints: ['固有值', '对角化', '二次型'], hot: true },
      { id: 'c5', chapter: '第5章 内积空间', pages: 'P.169-200', questionCount: 8, knowledgePoints: ['内积', '正交化', '施密特'], hot: false },
    ],
  },
  {
    id: 'b2', title: '演习 大学院入试 数学', titleJp: '演習 大学院入試の数学', author: '齋藤正彦ほか', cover: 'indigo',
    category: '真题集', rating: 4.6, ownedByCount: 1876, coveredQuestionCount: 62,
    popularSchools: ['东大', '京大', '阪大'],
    lastUpdate: '2022年版', tags: ['全科目', '演习', '旧帝大'],
    chapters: [
      { id: 'c1', chapter: '线代演习篇', pages: 'P.1-80', questionCount: 24, knowledgePoints: ['线代全范围'], hot: true },
      { id: 'c2', chapter: '微积分演习篇', pages: 'P.81-160', questionCount: 22, knowledgePoints: ['微积分全范围'], hot: false },
      { id: 'c3', chapter: '概率统计篇', pages: 'P.161-220', questionCount: 16, knowledgePoints: ['概率', '统计检验'], hot: false },
    ],
  },
  {
    id: 'b3', title: '青本 数学（东大编）', titleJp: '青チャート 大学院 東大数学', author: 'Kakomon编辑部', cover: 'teal',
    category: '校内编纂', rating: 4.5, ownedByCount: 982, coveredQuestionCount: 36,
    popularSchools: ['东大'],
    lastUpdate: '2024年版', tags: ['东大专项', '解析', '高难度'],
    chapters: [
      { id: 'c1', chapter: '线代基础与应用', pages: 'P.1-88', questionCount: 18, knowledgePoints: ['对角化', '求幂', '二次型'], hot: true },
      { id: 'c2', chapter: '微积分与级数', pages: 'P.89-166', questionCount: 12, knowledgePoints: ['级数', '傅里叶', '拉普拉斯'], hot: false },
      { id: 'c3', chapter: '概率论', pages: 'P.167-210', questionCount: 6, knowledgePoints: ['概率', '极限定理'], hot: false },
    ],
  },
  {
    id: 'b4', title: 'マセマ 確率統計', titleJp: 'マセマ 確率統計', author: '馬場敬之', cover: 'amber',
    category: '考研用书', rating: 4.4, ownedByCount: 1540, coveredQuestionCount: 28,
    popularSchools: ['早大', '一桥', '京大'],
    lastUpdate: '2022年版', tags: ['概率统计', '入门', '经济系'],
    chapters: [
      { id: 'c1', chapter: '第1章 概率基础', pages: 'P.1-50', questionCount: 8, knowledgePoints: ['条件概率', 'Bayes'], hot: false },
      { id: 'c2', chapter: '第2章 随机变量与分布', pages: 'P.51-110', questionCount: 12, knowledgePoints: ['正态分布', '期望', '方差'], hot: true },
      { id: 'c3', chapter: '第3章 统计检验', pages: 'P.111-160', questionCount: 8, knowledgePoints: ['Z检验', 't检验', 'P值'], hot: true },
    ],
  },
];

// ─── 搜索 ────────────────────────────────────────────────────
export const KAKOMON_SEARCH_RECENT: string[] = ['对角化', '东大数学', '假设检验'];
export const KAKOMON_SEARCH_HOT: string[] = ['固有值', '动态规划', '重积分', '假设检验', '傅里叶', '二次型'];

// ─── 试卷（模考按试卷组织）────────────────────────────────────
export const KAKOMON_PAPERS: ExamPaper[] = [
  {
    id: 'p-todai-2024-math',
    universityId: 'todai',
    graduateSchool: 'info-sci',
    majorId: null,
    year: 2024,
    subject: '数学',
    title: '2024年度 大学院入学試験問題 数学',
    durationMinutes: 150,
    totalScore: null,
    selectRule: { total: 3, choose: 2 },
    instructions: [
      '試験開始の合図があるまで問題冊子を開かないこと。',
      '解答は日本語または英語で記述すること。',
    ],
    questionIds: ['q-todai-2024-math-1', 'q-todai-2024-math-2', 'q-todai-2024-math-3'],
  },
];
