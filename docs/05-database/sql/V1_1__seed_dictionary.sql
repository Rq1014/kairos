-- =============================================================
--  Kairos-kakomon 初始化脚本 V1.1 — 字典种子数据
--  数据来源：Kairos-kakomon/src/mocks/data.ts
--    - KAKOMON_UNIVERSITIES (23 所大学)
--    - UNI_GRADS            (14 所大学的研究科)
--    - UNI_MAJORS           (10 个研究科的专业)
--  其余 9 所大学 (tsukuba/hiroshima/chiba/yokohama/tus/meiji/chuo/ritsumeikan/kansai)
--  及 52 个研究科目前 mock 数据未提供专业，后续按需补录。
-- =============================================================

USE `kakomon`;
SET NAMES utf8mb4;

-- -------------------------------------------------------------
--  1. university — 23 所大学
--  sort_order 倒序 desc 即得到与前端 KAKOMON_UNIVERSITIES 数组相同的排序。
-- -------------------------------------------------------------

INSERT INTO `university`
    (`code`, `name_cn`, `name_jp`, `name_en`, `short_name`, `type`, `region`, `region_group`, `sort_order`)
VALUES
    -- 旧帝大 7 所
    ('todai',        '东京大学',       '東京大学',       'The University of Tokyo',           '东大',     'national', '关东',   '首都圏', 230),
    ('kyodai',       '京都大学',       '京都大学',       'Kyoto University',                  '京大',     'national', '关西',   '关西圏', 220),
    ('osakau',       '大阪大学',       '大阪大学',       'Osaka University',                  '阪大',     'national', '关西',   '关西圏', 210),
    ('tohoku',       '东北大学',       '東北大学',       'Tohoku University',                 '东北大',   'national', '东北',   '东北',   200),
    ('nagoya',       '名古屋大学',     '名古屋大学',     'Nagoya University',                 '名大',     'national', '中部',   '中部',   190),
    ('kyushu',       '九州大学',       '九州大学',       'Kyushu University',                 '九大',     'national', '九州',   '九州',   180),
    ('hokudai',      '北海道大学',     '北海道大学',     'Hokkaido University',               '北大',     'national', '北海道', '北海道', 170),
    -- 国立非旧帝
    ('titech',       '东京工业大学',   '東京科学大学',   'Institute of Science Tokyo',        '东工大',   'national', '关东',   '首都圏', 160),
    ('hitotsubashi', '一桥大学',       '一橋大学',       'Hitotsubashi University',           '一桥',     'national', '关东',   '首都圏', 150),
    ('tsukuba',      '筑波大学',       '筑波大学',       'University of Tsukuba',             '筑波',     'national', '关东',   '首都圏', 140),
    ('kobe',         '神户大学',       '神戸大学',       'Kobe University',                   '神户',     'national', '关西',   '关西圏', 130),
    ('hiroshima',    '广岛大学',       '広島大学',       'Hiroshima University',              '广岛大',   'national', '中国',   '中部',   120),
    ('chiba',        '千叶大学',       '千葉大学',       'Chiba University',                  '千叶大',   'national', '关东',   '首都圏', 110),
    ('yokohama',     '横浜国立大学',   '横浜国立大学',   'Yokohama National University',      '横国',     'national', '关东',   '首都圏', 100),
    -- 私立 9 所
    ('waseda',       '早稻田大学',     '早稲田大学',     'Waseda University',                 '早大',     'private',  '关东',   '首都圏',  90),
    ('keio',         '庆应义塾大学',   '慶應義塾大学',   'Keio University',                   '庆应',     'private',  '关东',   '首都圏',  80),
    ('tus',          '东京理科大学',   '東京理科大学',   'Tokyo University of Science',       '理科大',   'private',  '关东',   '首都圏',  70),
    ('sophia',       '上智大学',       '上智大学',       'Sophia University',                 '上智',     'private',  '关东',   '首都圏',  60),
    ('meiji',        '明治大学',       '明治大学',       'Meiji University',                  '明治',     'private',  '关东',   '首都圏',  50),
    ('chuo',         '中央大学',       '中央大学',       'Chuo University',                   '中央',     'private',  '关东',   '首都圏',  40),
    ('ritsumeikan',  '立命馆大学',     '立命館大学',     'Ritsumeikan University',            '立命馆',   'private',  '关西',   '关西圏',  30),
    ('doshisha',     '同志社大学',     '同志社大学',     'Doshisha University',               '同志社',   'private',  '关西',   '关西圏',  20),
    ('kansai',       '关西大学',       '関西大学',       'Kansai University',                 '关大',     'private',  '关西',   '关西圏',  10);

-- -------------------------------------------------------------
--  2. grad_school — 研究科 / 学院
--  仅插入前端 mock UNI_GRADS 已声明的 14 所大学 × N 研究科。
--  code 用纯 ASCII 短码，便于 URL / 缓存键。响应里同时回 nameJp。
--  同一大学内 sort_order 倒序 desc 与 mock 数组顺序一致。
-- -------------------------------------------------------------

-- ── 东京大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'todai');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'info-sci',           '情报理工学系研究科',     'daigakuin', 60),
    (@uni, 'engineering',        '工学系研究科',           'daigakuin', 50),
    (@uni, 'science',            '理学系研究科',           'daigakuin', 40),
    (@uni, 'economics',          '经济学研究科',           'daigakuin', 30),
    (@uni, 'new-domain',         '新领域创成科学研究科',   'daigakuin', 20),
    (@uni, 'integrated-culture', '综合文化研究科',         'daigakuin', 10);

-- ── 东京工业大学 ────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'titech');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'info-sci',     '情报理工学院',     'daigakuin', 50),
    (@uni, 'engineering',  '工学院',           'daigakuin', 40),
    (@uni, 'science',      '理学院',           'daigakuin', 30),
    (@uni, 'materials',    '物质理工学院',     'daigakuin', 20),
    (@uni, 'env-social',   '环境社会理工学院', 'daigakuin', 10);

-- ── 京都大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'kyodai');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'engineering',  '工学研究科',     'daigakuin', 50),
    (@uni, 'science',      '理学研究科',     'daigakuin', 40),
    (@uni, 'informatics',  '情报学研究科',   'daigakuin', 30),
    (@uni, 'economics',    '经济学研究科',   'daigakuin', 20),
    (@uni, 'agriculture',  '农学研究科',     'daigakuin', 10);

-- ── 早稻田大学 ──────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'waseda');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'core-sci',     '基干理工学研究科', 'daigakuin', 50),
    (@uni, 'creative-sci', '创造理工学研究科', 'daigakuin', 40),
    (@uni, 'advanced-sci', '先进理工学研究科', 'daigakuin', 30),
    (@uni, 'economics',    '经济学研究科',     'daigakuin', 20),
    (@uni, 'commerce',     '商学研究科',       'daigakuin', 10);

-- ── 庆应义塾大学 ────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'keio');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'science-engineering', '理工学研究科', 'daigakuin', 50),
    (@uni, 'economics',           '经济学研究科', 'daigakuin', 40),
    (@uni, 'commerce',            '商学研究科',   'daigakuin', 30),
    (@uni, 'law',                 '法学研究科',   'daigakuin', 20),
    (@uni, 'media',               '媒体研究科',   'daigakuin', 10);

-- ── 大阪大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'osakau');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'engineering',       '工学研究科',     'daigakuin', 40),
    (@uni, 'basic-engineering', '基础工学研究科', 'daigakuin', 30),
    (@uni, 'science',           '理学研究科',     'daigakuin', 20),
    (@uni, 'info-science',      '情报科学研究科', 'daigakuin', 10);

-- ── 一桥大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'hitotsubashi');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'economics', '经济学研究科', 'daigakuin', 40),
    (@uni, 'commerce',  '商学研究科',   'daigakuin', 30),
    (@uni, 'law',       '法学研究科',   'daigakuin', 20),
    (@uni, 'sociology', '社会学研究科', 'daigakuin', 10);

-- ── 神户大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'kobe');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'engineering',  '工学研究科',       'daigakuin', 40),
    (@uni, 'economics',    '经济学研究科',     'daigakuin', 30),
    (@uni, 'maritime',     '海事科学研究科',   'daigakuin', 20),
    (@uni, 'intl-culture', '国际文化学研究科', 'daigakuin', 10);

-- ── 名古屋大学 ──────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'nagoya');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'engineering', '工学研究科',   'daigakuin', 40),
    (@uni, 'informatics', '情报学研究科', 'daigakuin', 30),
    (@uni, 'science',     '理学研究科',   'daigakuin', 20),
    (@uni, 'economics',   '经济学研究科', 'daigakuin', 10);

-- ── 九州大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'kyushu');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'engineering',  '工学府',     'daigakuin', 40),
    (@uni, 'info-science', '情报科学府', 'daigakuin', 30),
    (@uni, 'science',      '理学府',     'daigakuin', 20),
    (@uni, 'economics',    '经济学府',   'daigakuin', 10);

-- ── 北海道大学 ──────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'hokudai');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'engineering',  '工学院',     'daigakuin', 40),
    (@uni, 'science',      '理学院',     'daigakuin', 30),
    (@uni, 'agriculture',  '农学院',     'daigakuin', 20),
    (@uni, 'info-science', '情报科学院', 'daigakuin', 10);

-- ── 东北大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'tohoku');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'engineering',  '工学研究科',     'daigakuin', 40),
    (@uni, 'science',      '理学研究科',     'daigakuin', 30),
    (@uni, 'info-science', '情报科学研究科', 'daigakuin', 20),
    (@uni, 'economics',    '经济学研究科',   'daigakuin', 10);

-- ── 上智大学 ────────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'sophia');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'science-engineering', '理工学研究科',     'daigakuin', 40),
    (@uni, 'economics',           '经济学研究科',     'daigakuin', 30),
    (@uni, 'foreign-languages',   '外国语学研究科',   'daigakuin', 20),
    (@uni, 'global-studies',      '全球研究研究科',   'daigakuin', 10);

-- ── 同志社大学 ──────────────────────────────────────────────
SET @uni := (SELECT id FROM `university` WHERE code = 'doshisha');
INSERT INTO `grad_school` (`university_id`, `code`, `name_jp`, `category`, `sort_order`) VALUES
    (@uni, 'science-engineering', '理工学研究科', 'daigakuin', 40),
    (@uni, 'economics',           '经济学研究科', 'daigakuin', 30),
    (@uni, 'commerce',            '商学研究科',   'daigakuin', 20),
    (@uni, 'law',                 '法学研究科',   'daigakuin', 10);

-- -------------------------------------------------------------
--  3. major — 专业 / 専攻 / コース
--  仅插入前端 mock UNI_MAJORS 已声明的 10 个研究科 × N 专业。
-- -------------------------------------------------------------

-- ── 东京大学 · 情报理工学系研究科 ──────────────────────────
SET @uni  := (SELECT id FROM `university` WHERE code = 'todai');
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'info-sci');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'cs',   'コンピュータ科学', 'CS',   '算法 / OS / 编译',   60),
    (@uni, @grad, 'eeis', '电子情报学',       'EEIS', '电子 + 情报融合',    50),
    (@uni, @grad, 'mi',   '数理情报学',       'MI',   '应用数学 / 统计',    40),
    (@uni, @grad, 'si',   'システム情报学',   'SI',   '系统设计 / 控制',    30),
    (@uni, @grad, 'ii',   '知能机械情报学',   'IME',  '机器人 / AI',        20),
    (@uni, @grad, 'cnsi', '创造情报学',       'CNSI', '创新 / 交叉',        10);

-- ── 东京大学 · 工学系研究科 ────────────────────────────────
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'engineering');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'ee',  '电气系工学',   'EE',  '电力 / 通信',  60),
    (@uni, @grad, 'me',  '机械工学',     'ME',  '机械设计',     50),
    (@uni, @grad, 'ce',  '土木工学',     'CE',  '土木 / 建筑',  40),
    (@uni, @grad, 'ae',  '航空宇宙工学', 'AE',  '航空 / 航天',  30),
    (@uni, @grad, 'ap',  '应用物理学',   'AP',  '物理 + 工程',  20),
    (@uni, @grad, 'mse', '材料工学',     'MSE', '金属 / 半导体', 10);

-- ── 东京大学 · 理学系研究科 ────────────────────────────────
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'science');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'math', '数学',     'Math', '纯粹 / 应用', 40),
    (@uni, @grad, 'phys', '物理学',   'Phys', '理论 / 实验', 30),
    (@uni, @grad, 'chem', '化学',     'Chem', NULL,          20),
    (@uni, @grad, 'bio',  '生物科学', 'Bio',  NULL,          10);

-- ── 东京大学 · 经济学研究科 ────────────────────────────────
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'economics');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'econ', '经济专攻',     'Econ', '宏观 / 微观', 30),
    (@uni, @grad, 'mgmt', '经营专攻',     'Mgmt', '管理 / 战略', 20),
    (@uni, @grad, 'fin',  '金融システム', 'Fin',  '金融工程',    10);

-- ── 东京工业大学 · 情报理工学院 ────────────────────────────
SET @uni  := (SELECT id FROM `university` WHERE code = 'titech');
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'info-sci');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'mcs', '数理・计算科学', 'MCS', '算法 + 数学',  30),
    (@uni, @grad, 'is',  '情报工学',       'IS',  '软件 / 系统',  20),
    (@uni, @grad, 'ai',  '知能情报',       'AI',  'AI / ML',      10);

-- ── 东京工业大学 · 工学院 ──────────────────────────────────
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'engineering');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'ee',  '电気電子',     'EE',  '电子设计',     30),
    (@uni, @grad, 'me',  '机械系',       'ME',  '机械工程',     20),
    (@uni, @grad, 'sys', 'システム制御', 'Sys', '控制 / 机器人', 10);

-- ── 京都大学 · 情报学研究科 ────────────────────────────────
SET @uni  := (SELECT id FROM `university` WHERE code = 'kyodai');
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'informatics');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'ii',  '知能情报学',         'II',  'AI / NLP',      40),
    (@uni, @grad, 'si',  '社会情报学',         'SI',  '数据 + 社会',   30),
    (@uni, @grad, 'sys', '系统科学',           'Sys', '控制系统',      20),
    (@uni, @grad, 'cis', '通信情报システム',   'CIS', '网络 / 通信',   10);

-- ── 京都大学 · 工学研究科 ──────────────────────────────────
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'engineering');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'ee',  '电气工学', 'EE',  NULL, 30),
    (@uni, @grad, 'me',  '机械工学', 'ME',  NULL, 20),
    (@uni, @grad, 'mse', '材料工学', 'MSE', NULL, 10);

-- ── 早稻田大学 · 基干理工学研究科 ──────────────────────────
SET @uni  := (SELECT id FROM `university` WHERE code = 'waseda');
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'core-sci');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'cs',   '情报理工',     'CS',   NULL, 30),
    (@uni, @grad, 'math', '数学应用数理', 'Math', NULL, 20),
    (@uni, @grad, 'me',   '机械科学',     'ME',   NULL, 10);

-- ── 庆应义塾大学 · 理工学研究科 ────────────────────────────
SET @uni  := (SELECT id FROM `university` WHERE code = 'keio');
SET @grad := (SELECT id FROM `grad_school` WHERE university_id = @uni AND code = 'science-engineering');
INSERT INTO `major` (`university_id`, `grad_school_id`, `code`, `label`, `short`, `description`, `sort_order`) VALUES
    (@uni, @grad, 'oe', '开放工学',   'OE', NULL, 30),
    (@uni, @grad, 'is', '情报工学',   'IS', NULL, 20),
    (@uni, @grad, 'bp', '基础理工学', 'BP', NULL, 10);
