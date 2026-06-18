# Kakomon · 技术规格文档（TSD）

**版本：** v1.3  
**日期：** 2026-05-14  
**平台：** iOS · React Native · Expo SDK 55  
**归属：** Kairos 生态 · Kakomon 独立模块

---

## 一、技术选型

### 1.1 前端技术栈

| 层级 | 选型 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Expo | SDK 55 | Managed Workflow，支持 EAS Build |
| 框架 | React Native | 0.83+ | 搭配 New Architecture |
| 语言 | TypeScript | 5.x | 严格模式 |
| 导航 | Expo Router | v4 | 基于文件的路由，兼容 Kairos 路由命名空间 |
| 状态管理 | Zustand | 5.x | 轻量，支持 persist 中间件 |
| 服务器状态 | TanStack Query | v5 | 缓存 + 自动重试 + 乐观更新 |
| 表单 | React Hook Form | v7 | 搭配 Zod 校验 |
| 本地存储 | Expo SecureStore | — | JWT Token 安全存储 |
| 持久化 | AsyncStorage | — | 用户偏好 / 草稿 |
| 动画 | React Native Reanimated | v3 | Bottom Sheet / 页面切换 |
| 图标 | @expo/vector-icons (Feather) | — | 对应原型 Lucide 风格 |
| 图片 | expo-image | — | 懒加载 + 渐进式 |
| 底部抽屉 | @gorhom/bottom-sheet | v5 | AI Context Sheet |
| 字体 | expo-font | — | 预加载 PingFang SC 备用 |
| 网络 | axios | 1.x | + axios-retry 自动重试 |
| 环境变量 | expo-constants | — | EAS 多环境配置 |

### 1.2 后端技术栈（参考，由后端团队决定）

| 层级 | 选型 | 说明 |
|------|------|------|
| 运行时 | Node.js 22 / Python 3.12 | 任选，接口契约由本 TSD 定义 |
| API 风格 | REST + JSON | 版本前缀 `/api/v1/` |
| 认证 | JWT（Access + Refresh Token）| Access 15 分钟，Refresh 30 天 |
| 数据库 | PostgreSQL 16 | 主数据库 |
| 搜索 | Elasticsearch 8 / PgVector | 全文搜索 + 向量相似题 |
| 缓存 | Redis 7 | AI 额度计数 / 热点题目缓存 |
| AI 网关 | Claude API / OpenAI API | 后端统一调用，前端不直接访问 |
| 文件存储 | S3 兼容（题目原图）| CDN 加速 |
| 推送 | Expo Push Notification Service | 通知中心 |

---

## 二、项目目录结构

```
kairos-kakomon/                    ← Expo 项目根
├── app/                           ← Expo Router 路由根
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx            ← Bottom Tab 布局
│   │   ├── study/
│   │   │   ├── index.tsx          ← 学习仪表板
│   │   │   ├── search.tsx
│   │   │   ├── wrong-book.tsx
│   │   │   ├── references.tsx
│   │   │   └── notifications.tsx
│   │   ├── university/
│   │   │   ├── index.tsx          ← 大学列表
│   │   │   ├── compare.tsx
│   │   │   └── [id]/
│   │   │       ├── index.tsx      ← 大学详情
│   │   │       └── professor/[name].tsx
│   │   ├── forum/
│   │   │   ├── index.tsx          ← 论坛首页
│   │   │   ├── compose.tsx
│   │   │   ├── groups/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [id].tsx
│   │   │   └── [threadId]/
│   │   │       └── index.tsx
│   │   └── profile/
│   │       ├── index.tsx
│   │       └── settings.tsx
│   ├── questions/
│   │   ├── [id]/
│   │   │   ├── index.tsx          ← 题目详情
│   │   │   └── ai-chat.tsx        ← AI 对话
│   │   └── list/[universityId].tsx
│   ├── paywall.tsx
│   └── _layout.tsx                ← 根布局（Auth 守卫）
│
├── src/
│   ├── api/                       ← API 客户端
│   │   ├── client.ts              ← axios 实例
│   │   ├── auth.ts
│   │   ├── universities.ts
│   │   ├── questions.ts
│   │   ├── forum.ts
│   │   ├── ai.ts
│   │   └── user.ts
│   ├── store/                     ← Zustand store
│   │   ├── authStore.ts
│   │   ├── studyStore.ts
│   │   └── uiStore.ts
│   ├── hooks/                     ← TanStack Query hooks
│   │   ├── useUniversities.ts
│   │   ├── useQuestions.ts
│   │   ├── useForum.ts
│   │   └── useAi.ts
│   ├── components/                ← 原子 / 分子组件
│   │   ├── ui/
│   │   │   ├── Card.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Segmented.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   └── Icon.tsx
│   │   ├── study/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── MasteryControl.tsx
│   │   │   ├── RelatedLevel.tsx
│   │   │   ├── ReferenceCard.tsx
│   │   │   └── WeakPointBar.tsx
│   │   ├── university/
│   │   │   ├── UniversityCard.tsx
│   │   │   └── DimensionBars.tsx
│   │   └── forum/
│   │       ├── ThreadCard.tsx
│   │       └── ReplyItem.tsx
│   ├── constants/
│   │   ├── colors.ts              ← 设计 token
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── types/                     ← 全局 TypeScript 类型
│   │   ├── user.ts
│   │   ├── university.ts
│   │   ├── question.ts
│   │   ├── forum.ts
│   │   └── api.ts
│   └── utils/
│       ├── format.ts
│       └── storage.ts
│
├── assets/
├── app.json
├── eas.json
├── tsconfig.json
└── package.json
```

---

## 三、TypeScript 类型定义（Types）

### 3.1 用户（user.ts）

```typescript
export type UserPlan = 'free' | 'pro' | 'token';

export interface NextExam {
  name: string;          // e.g. "东大 · 情报理工修考 一次"
  date: string;          // ISO 8601 date "2026-08-25"
  durationDays: number;  // 考试持续天数
}

// 目标校（对应 user_target_schools 表）
export interface UserTargetSchool {
  universityId: string;
  type: 'daigakuin' | 'gakubu';
  gradSchool?: string;    // 研究科名称（e.g. 情报理工学系研究科）
  majorId?: string;       // 専攻 ID（e.g. 'cs'）
  subjects: string[];     // 选定科目标签
  priority: number;       // 志愿顺序（0 = 第一志愿）
}

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  major: string;
  targetSchools: UserTargetSchool[];   // 替代旧的 targetUniversityIds: string[]
  isPro: boolean;
  freeAiRemaining: number;     // 今日免费 AI 次数剩余
  tokenBalance: number;         // 代币余额
  solvedCount: number;
  unclearCount: number;
  wrongCount: number;
  favoriteCount: number;
  aiAskCount: number;
  contributorPoints: number;
  weakPoints: WeakPoint[];
  nextExam?: NextExam;          // 最近目标考试（用于仪表板倒计时）
  createdAt: string;            // ISO 8601
}

// EditTargetSheet 本地 UI 状态（提交前转换为 UserTargetSchool[]）
export interface EditTargetConfig {
  type: 'daigakuin' | 'gakubu';
  schools: string[];                        // universityId[]
  schoolGrads: Record<string, string>;      // universityId → 研究科名称
  schoolMajors: Record<string, string>;     // universityId → majorId
  subjects: string[];
  grad: string;
}

export interface WeakPoint {
  subject: string;              // 线性代数 / 微积分 / ...
  point: string;                // 固有值与对角化 / ...
  level: 1 | 2 | 3 | 4 | 5;   // 1=轻微 5=严重
  count: number;                // 错题数
}

export interface AiQuota {
  freeRemaining: number;
  tokenBalance: number;
  isPro: boolean;
  askCostToken: number;         // 非 Pro 每次消耗 Token 数
}
```

### 3.2 大学（university.ts）

```typescript
export type ExamDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard';
export type UniversityType = 'national' | 'private';
export type AccentColor = 'blue' | 'teal' | 'indigo' | 'amber' | 'rose';
export type RegionGroup = '首都圏' | '关西圏' | '中部' | '东北' | '北海道' | '九州';

export interface University {
  id: string;
  nameCn: string;
  nameJp: string;
  nameEn: string;
  short: string;                // 东大 / 东工大
  nickname?: string;            // 额外搜索昵称（东工大 / 工大 等）
  type: UniversityType;
  region: string;               // 关东 / 关西（宽泛描述）
  regionGroup: RegionGroup;     // 精确地区组（用于 SchoolSearchPicker 筛选）
  rating: number;               // 0–5.0
  examDifficulty: ExamDifficulty;
  pastExamCount: number;
  reviewCount: number;
  hotSubjects: string[];
  dimensions: UniversityDimensions;
  tags: string[];
  professorHighlights: ProfessorHighlight[];
  accent: AccentColor;
  suitableFor: string;
}

// 研究科列表（UNI_GRADS）: universityId → 研究科名称数组
export type UniGrads = Record<string, string[]>;

// 专攻方向（UNI_MAJORS）: "universityId::研究科名" → MajorOption[]
export interface MajorOption {
  id: string;      // e.g. "cs"
  label: string;   // e.g. "コンピュータ科学"
  short: string;   // e.g. "CS"
  desc: string;    // e.g. "算法 / OS / 编译"
}
export type UniMajors = Record<string, MajorOption[]>;

export interface UniversityDimensions {
  难度: number;                  // 0–100
  完整度: number;
  透明度: number;
  合格经验: number;
  口碑: number;
  资料丰富度: number;
}

export interface ProfessorHighlight {
  name: string;
  lab: string;
  direction: string;
  reviewCount: number;
}

export interface ProfessorDetail {
  nameJp: string;
  nameRoman: string;
  university: string;
  lab: string;
  title: string;
  since: number;
  direction: string;
  recentTopics: string[];
  aiSummary: ProfessorAiSummary | null; // null = 未解锁（Free 用户）
  admission: {
    yearly: number;
    applyRatio: number;
    passRate: number;
  };
  publications: number;
  relatedQuestions: string[];   // questionId[]
  experiences: ProfessorExperience[];
}

export interface ProfessorAiSummary {
  researchFocus: string;
  examPattern: string;
  interviewStyle: string;
  recommendation: string;
}

export interface ProfessorExperience {
  author: string;
  time: string;
  text: string;
  upvotes: number;
}
```

### 3.3 题目（question.ts）

```typescript
export type MasteryStatus = 'mastered' | 'unclear' | 'wrong';
export type MatchType = 'exact_question' | 'same_point' | 'similar_method';
export type RelatedLevel = 1 | 2 | 3;

export interface KakomonQuestion {
  id: string;
  universityId: string;
  graduateSchool: string;
  year: number;
  subject: string;
  questionNo: string;
  title: string;
  bodyText: string;
  originalImageUrl?: string;     // CDN URL
  formulaPreview?: string[];
  knowledgePoints: string[];
  difficultyLabel: string;
  crowdDifficultyRate: number;   // 0–1，偏难比例
  crowdVotes: {
    easy: number;
    medium: number;
    hard: number;
  };
  masteryStatus?: MasteryStatus; // 用户个人状态
  standardExplanation: ExplanationStep[];
  referenceMatches: ReferenceMatch[];
  relatedQuestions: RelatedQuestion[];
  hasOriginalImage: boolean;
}

export interface ExplanationStep {
  title: string;
  body: string;
}

export interface ReferenceMatch {
  id: string;
  bookTitle: string;
  chapter: string;
  pageRange: string;
  matchType: MatchType;
  reason: string;
  rewrittenSummary: string;
}

export interface RelatedQuestion {
  id: string;
  level: RelatedLevel;
  title: string;
  universityId: string;
  universityName: string;
  year: number;
  subject: string;
  questionNo: string;
  reason: string;
  confidence: number;           // 0–1
}

export interface WrongQuestion {
  id: string;
  questionId: string;
  subject: string;
  point: string;
  universityShort: string;
  year: number;
  questionNo: string;
  title: string;
  wrongCount: number;
  lastWrongAt: string;
  nextReviewAt: string;
  masteryLevel: 0 | 1 | 2 | 3;
  tags: string[];
}

export interface KnowledgeMatrixGroup {
  subject: string;
  color: string;
  total: number;
  points: KnowledgePoint[];
}

export interface KnowledgePoint {
  point: string;
  count: number;
  mastery: number;              // 0–1
  overlap: string[];            // 目标校名称
}

export interface ReferenceBook {
  id: string;
  title: string;
  titleJp: string;
  author: string;
  cover: string;                // accent color
  category: string;
  rating: number;
  ownedByCount: number;
  coveredQuestionCount: number;
  popularSchools: string[];
  lastUpdate: string;
  tags: string[];
  chapters: ReferenceChapter[];
}

export interface ReferenceChapter {
  id: string;
  chapter: string;
  pages: string;
  questionCount: number;
  knowledgePoints: string[];
  hot?: boolean;
}
```

### 3.4 论坛（forum.ts）

```typescript
export type ThreadType =
  | 'question_discussion'
  | 'material_request'
  | 'experience'
  | 'study_circle';

export type AuthorBadge = 'preparing' | 'passed' | 'verified';
export type MaterialRequestStatus = 'unsolved' | 'in_progress' | 'solved';

export interface ForumThread {
  id: string;
  title: string;
  type: ThreadType;
  universityId?: string;
  questionId?: string;
  tags: string[];
  replyCount: number;
  viewCount: number;
  hasAcceptedAnswer: boolean;
  authorBadge: AuthorBadge;
  authorName: string;
  excerpt: string;
  lastActivity: string;
  materialRequestStatus?: MaterialRequestStatus;
}

export interface ThreadReply {
  id: string;
  author: string;
  badge: AuthorBadge;
  time: string;
  body: string;
  upvotes: number;
  isAccepted: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  emoji: string;
  scope: 'school+subject' | 'school' | 'subject' | 'experience';
  target?: string;
  subject?: string;
  memberCount: number;
  dailyActive: number;
  avgProgress: number;
  ownerName: string;
  desc: string;
  badges: string[];
  openSlots: number;
  todayTask: string;
  accent: string;
  verified: boolean;
  joined: boolean;
}

export interface GroupMessage {
  id: string;
  from: string;
  badge: AuthorBadge;
  time: string;
  body: string;
  pinned?: boolean;
  attachQuestion?: { qId: string; title: string };
  react?: string;
  system?: boolean;
}

export interface Notification {
  id: string;
  type: 'exam' | 'weak' | 'mention' | 'contrib' | 'system';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  icon: string;
  color: string;
  actionLabel: string;
  questionId?: string;
  threadId?: string;
}
```

### 3.5 API 通用类型（api.ts）

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;               // e.g. "UNAUTHORIZED", "QUOTA_EXCEEDED"
  message: string;
  details?: Record<string, unknown>;
}
```

---

## 四、后端 API 接口规范

**Base URL：** `https://api.kairos.app/api/v1`  
**认证方式：** Bearer JWT（Header: `Authorization: Bearer <access_token>`）  
**Content-Type：** `application/json`  
**时间格式：** ISO 8601（UTC）

### 4.1 认证（Auth）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/auth/login` | 邮箱密码登录 |
| `POST` | `/auth/register` | 注册 |
| `POST` | `/auth/refresh` | 刷新 Access Token |
| `POST` | `/auth/logout` | 登出（服务端注销 Refresh Token）|
| `POST` | `/auth/forgot-password` | 忘记密码（发邮件）|

**POST /auth/login**
```json
// Request
{ "email": "zhang@example.com", "password": "..." }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { /* UserProfile */ }
  }
}

// Error 401
{ "success": false, "code": "INVALID_CREDENTIALS", "message": "邮箱或密码错误" }
```

---

### 4.2 用户（User）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/users/me` | 获取当前用户信息（含 targetSchools）|
| `PATCH` | `/users/me` | 更新用户基础信息（nickname / major / nextExam）|
| `GET` | `/users/me/target-schools` | 获取目标校列表 |
| `PUT` | `/users/me/target-schools` | 全量替换目标校配置（EditTargetSheet 提交）|
| `GET` | `/users/me/ai-quota` | 获取 AI 额度状态 |
| `GET` | `/users/me/stats` | 获取学习统计 |
| `GET` | `/users/me/weak-points` | 获取弱点地图 |
| `GET` | `/users/me/notifications` | 获取通知列表 |
| `PATCH` | `/users/me/notifications/:id/read` | 标记通知已读 |

**PUT /users/me/target-schools**
```json
// Request（全量替换，不做增量 patch）
{
  "targetSchools": [
    {
      "universityId": "todai",
      "type": "daigakuin",
      "gradSchool": "情报理工学系研究科",
      "majorId": "cs",
      "subjects": ["数学", "情报"],
      "priority": 0
    },
    {
      "universityId": "titech",
      "type": "daigakuin",
      "gradSchool": "情報理工学院",
      "majorId": "cs",
      "subjects": ["数学", "情報"],
      "priority": 1
    }
  ]
}

// Response 200
{
  "success": true,
  "data": {
    "targetSchools": [ /* UserTargetSchool[] */ ],
    "updatedAt": "2026-05-14T12:00:00Z"
  }
}
```

**GET /users/me/ai-quota**
```json
// Response 200
{
  "success": true,
  "data": {
    "freeRemaining": 1,
    "tokenBalance": 6,
    "isPro": false,
    "askCostToken": 1,
    "resetAt": "2026-05-15T00:00:00Z"
  }
}
```

---

### 4.3 大学（Universities）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/universities` | 大学列表（支持筛选/搜索/排序）|
| `GET` | `/universities/:id` | 大学详情 |
| `GET` | `/universities/:id/questions` | 该大学题目列表 |
| `GET` | `/universities/:id/reviews` | 该大学评分列表 |
| `POST` | `/universities/:id/reviews` | 提交评分 |
| `GET` | `/universities/:id/professors` | 教授列表 |
| `GET` | `/universities/professors/:name` | 教授详情 |
| `GET` | `/universities/compare` | 大学对比（?ids=todai,titech）|

**GET /universities 查询参数**
```
?q=东大                    关键词搜索（中文/日文/英文/昵称）
&type=national             national | private
&region=关东               关东 | 关西（宽泛）
&regionGroup=首都圏        首都圏|关西圏|中部|东北|北海道|九州（精确，用于 SchoolSearchPicker）
&tags[]=热门               多值筛选
&sort=rating               rating | pastExamCount | reviewCount
&page=1&pageSize=20
```

新增端点：
```
GET  /universities/grads/:id     → string[]          该大学的研究科列表
GET  /universities/majors        → MajorOption[]     ?universityId=todai&grad=情报理工学系研究科
```

**GET /universities/:id/professors/:name**
```json
// Response 200（Free 用户）
{
  "success": true,
  "data": {
    "nameJp": "山田 健司",
    "nameRoman": "YAMADA Kenji",
    "lab": "情报理工学系研究科 · 计算机科学专攻",
    "direction": "分布式系统 / 并发理论",
    "recentTopics": ["分布式一致性", "TLA+ 形式化"],
    "aiSummary": null,           // ← null 表示 Pro 锁定
    "admission": { "yearly": 4, "applyRatio": 8.2, "passRate": 0.12 },
    "publications": 78,
    "experiences": [ /* ProfessorExperience[] */ ]
  }
}
```

---

### 4.4 题目（Questions）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/questions` | 题目列表（搜索/筛选/分页）|
| `GET` | `/questions/:id` | 题目详情 |
| `GET` | `/questions/:id/related` | 三级关联题目 |
| `POST` | `/questions/:id/mastery` | 标记掌握情况 |
| `POST` | `/questions/:id/vote` | 众包难度投票 |
| `POST` | `/questions/:id/favorite` | 收藏/取消收藏 |
| `GET` | `/questions/wrong-book` | 错题本列表 |
| `GET` | `/questions/knowledge-matrix` | 知识点矩阵 |
| `GET` | `/questions/recommendations` | 推荐题目（基于弱点）|

**GET /questions 查询参数**
```
?q=对角化                  关键词
&universityId=todai
&subject=数学
&year=2024
&knowledgePoints[]=固有值
&difficulty=hard           easy|medium|hard|very_hard
&masteryStatus=wrong       mastered|unclear|wrong|null
&sort=year_desc            year_desc|difficulty|crowdRate
&page=1&pageSize=20
```

**GET /questions/:id**
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "q-todai-2024-math-3",
    "universityId": "todai",
    "graduateSchool": "情报理工学系研究科",
    "year": 2024,
    "subject": "数学",
    "questionNo": "第3问",
    "title": "固有值与对角化",
    "bodyText": "设 3×3 实对称矩阵...",
    "originalImageUrl": "https://cdn.kairos.app/questions/q-todai-2024-math-3.jpg",
    "formulaPreview": ["A·vᵢ = λᵢ·vᵢ"],
    "knowledgePoints": ["线性代数", "固有值", "对角化"],
    "difficultyLabel": "中等偏难",
    "crowdDifficultyRate": 0.68,
    "crowdVotes": { "easy": 12, "medium": 38, "hard": 84 },
    "masteryStatus": null,       // 用户个人状态
    "standardExplanation": [ /* ExplanationStep[] */ ],
    "referenceMatches": [ /* ReferenceMatch[] */ ],
    "relatedQuestions": [ /* RelatedQuestion[] */ ],
    "hasOriginalImage": true
  }
}
```

**POST /questions/:id/mastery**
```json
// Request
{ "status": "wrong" }   // mastered | unclear | wrong

// Response 200
{
  "success": true,
  "data": {
    "masteryStatus": "wrong",
    "addedToWrongBook": true,
    "weakPointsUpdated": ["线性代数/固有值"]
  }
}
```

**GET /questions/:id/related**
```json
// Response 200（Free 用户：L3 仅返回前 2 条 + isPro=false 标记）
{
  "success": true,
  "data": {
    "level1": [ /* RelatedQuestion[] */ ],
    "level2": [ /* RelatedQuestion[] */ ],
    "level3": [ /* RelatedQuestion[] 前2条 */ ],
    "level3Total": 4,
    "isPro": false               // 前端据此显示锁定提示
  }
}
```

---

### 4.5 AI 对话（AI）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/ai/ask` | 发起 AI 提问（计费）|
| `POST` | `/ai/chat/:sessionId` | 追问（同一对话）|
| `GET` | `/ai/sessions` | 历史问答列表 |
| `GET` | `/ai/sessions/:id` | 历史问答详情 |

**POST /ai/ask**
```json
// Request
{
  "questionId": "q-todai-2024-math-3",
  "direction": "情报",
  "targetSchools": ["todai", "titech"],
  "knowledgePoints": ["线性代数", "固有值"],
  "userText": "为什么这里一定可以对角化？"
}

// Response 200（扣费成功，流式 or 一次性）
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "costType": "free",          // free | token | pro
    "tokensConsumed": 0,
    "freeRemainingAfter": 0,
    "answer": {
      "sections": [
        { "title": "思路", "body": "..." },
        { "title": "关键考点", "body": "..." },
        { "title": "常见误区", "body": "..." },
        { "title": "推荐练习", "body": "..." }
      ],
      "chips": ["换种说法", "给我类似题", "推荐参考书页码"]
    }
  }
}

// Error 402（额度不足）
{
  "success": false,
  "code": "QUOTA_EXCEEDED",
  "message": "今日免费次数已用完，请充值 Token 或升级 Pro"
}
```

**AI 流式返回（Server-Sent Events）**  
建议后端支持 SSE，路径同上，请求头增加 `Accept: text/event-stream`。

---

### 4.6 论坛（Forum）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/forum/threads` | 帖子列表（筛选/分页）|
| `POST` | `/forum/threads` | 发帖 |
| `GET` | `/forum/threads/:id` | 帖子详情 + 回复 |
| `POST` | `/forum/threads/:id/replies` | 发回复 |
| `POST` | `/forum/threads/:id/replies/:rid/accept` | 采纳答案 |
| `POST` | `/forum/threads/:id/replies/:rid/upvote` | 点赞 |
| `GET` | `/forum/groups` | 学习圈列表 |
| `POST` | `/forum/groups/:id/join` | 加入学习圈 |
| `GET` | `/forum/groups/:id/messages` | 群消息列表 |
| `POST` | `/forum/groups/:id/messages` | 发群消息 |

**GET /forum/threads 查询参数**
```
?type=question_discussion    帖子类型过滤
&universityId=todai
&questionId=q-todai-2024-math-3
&tags[]=线性代数
&sort=latest                 latest | hot | unanswered
&page=1&pageSize=20
```

---

### 4.7 订阅 / 计划（Billing）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/billing/plans` | 获取所有订阅计划 |
| `POST` | `/billing/subscribe` | 发起订阅（前端传 Apple IAP receipt）|
| `POST` | `/billing/verify-receipt` | 验证 Apple IAP receipt |
| `GET` | `/billing/status` | 当前订阅状态 |

> iOS 端必须通过 Apple IAP，后端负责收据验证（App Store Connect API）。

**POST /billing/subscribe（iOS）**
```json
// Request
{
  "platform": "ios",
  "productId": "com.kairos.kakomon.pro.yearly",
  "receiptData": "<base64 encoded receipt>"
}

// Response 200
{
  "success": true,
  "data": {
    "isPro": true,
    "planId": "yearly",
    "expiresAt": "2027-05-14T00:00:00Z"
  }
}
```

---

### 4.8 参考书（References）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/references/books` | 参考书列表 |
| `GET` | `/references/books/:id` | 参考书详情 + 章节 |
| `GET` | `/references/books/:id/chapters/:cid/questions` | 章节关联题目 |

---

## 五、状态管理设计

### 5.1 authStore（Zustand + SecureStore）

```typescript
interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isLoggedIn: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (patch: Partial<UserProfile>) => void;
}
```

### 5.2 studyStore

```typescript
interface StudyState {
  // 当前会话状态（不持久化）
  currentQuestionId: string | null;
  aiSheetOpen: boolean;
  aiSheetQuestionId: string | null;

  // 本地乐观更新（待同步到后端）
  masteryOverrides: Record<string, MasteryStatus>;
  bookmarks: Set<string>;

  // Actions
  setMastery: (questionId: string, status: MasteryStatus) => void;
  toggleBookmark: (questionId: string) => void;
  openAiSheet: (questionId: string) => void;
  closeAiSheet: () => void;
}
```

### 5.3 uiStore

```typescript
interface UiState {
  density: 'compact' | 'default' | 'cozy';
  accentColor: 'blue' | 'teal' | 'indigo';

  // Actions
  setDensity: (d: UiState['density']) => void;
}
```

---

## 六、导航结构（Expo Router）

```typescript
// app/(tabs)/_layout.tsx
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar }}>
      <Tabs.Screen name="study" options={{ title: '学习', tabBarIcon: BookIcon }} />
      <Tabs.Screen name="university" options={{ title: '大学', tabBarIcon: GraphIcon }} />
      <Tabs.Screen name="forum" options={{ title: '论坛', tabBarIcon: ForumIcon }} />
      <Tabs.Screen name="profile" options={{ title: '我的', tabBarIcon: UserIcon }} />
    </Tabs>
  );
}
```

**路由命名空间（Kairos 合并兼容）**
```
/kakomon                    → study/index
/kakomon/universities       → university/index
/kakomon/universities/:id   → university/[id]/index
/kakomon/questions/:id      → questions/[id]/index
/kakomon/questions/:id/ask  → questions/[id]/ai-chat
/kakomon/forum              → forum/index
/kakomon/forum/:threadId    → forum/[threadId]/index
/profile                    → profile/index
/settings                   → profile/settings
```

---

## 七、设计 Token（colors.ts）

```typescript
export const Colors = {
  // Slate base
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // 学习/过去问 — 蓝
  blue50:  '#eff6ff',
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',

  // AI/参考书 — 青
  teal50:  '#f0fdfa',
  teal100: '#ccfbf1',
  teal500: '#14b8a6',
  teal600: '#0d9488',

  // 论坛/社区 — 靛
  indigo50:  '#eef2ff',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',

  // 难度/评分 — 琥珀
  amber50:  '#fffbeb',
  amber500: '#f59e0b',
  amber600: '#d97706',

  // 已合格/已采纳 — 绿
  green50:  '#f0fdf4',
  green500: '#22c55e',
  green600: '#16a34a',

  // 错题/弱点 — 玫红
  rose50:  '#fff1f2',
  rose500: '#f43f5e',
  rose600: '#e11d48',

  // Pro 渐变
  proGradientStart: '#f59e0b',
  proGradientEnd:   '#f43f5e',
} as const;
```

---

## 八、性能与质量要求

| 指标 | 目标值 |
|------|--------|
| 冷启动时间（JS bundle TTI）| < 2s |
| 题目详情页首屏渲染 | < 300ms（有缓存）|
| 底部 Tab 切换 | < 100ms |
| API 超时设置 | 10s（AI 接口 30s）|
| TanStack Query staleTime | 5 分钟（题目/大学）|
| 离线降级 | 已缓存数据可读；操作队列等待恢复 |
| 图片懒加载 | expo-image + 占位 skeleton |
| Bundle 大小 | < 4MB（JS bundle gzip）|

---

## 九、iOS 专项配置

### 9.1 app.json 关键字段

```json
{
  "expo": {
    "name": "Kakomon",
    "slug": "kairos-kakomon",
    "version": "1.0.0",
    "platforms": ["ios"],
    "ios": {
      "bundleIdentifier": "com.kairos.kakomon",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "用于扫描上传过去问原图",
        "NSPhotoLibraryUsageDescription": "用于上传参考书页面照片"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        { "ios": { "newArchEnabled": true } }
      ]
    ]
  }
}
```

### 9.2 Push Notification（Expo）

```typescript
// 注册设备 Token，后端存储用于推送
const token = await registerForPushNotificationsAsync();
await api.post('/users/me/push-token', { token, platform: 'ios' });
```

### 9.3 IAP（Apple 内购）

- 推荐使用 **`expo-iap`**（Expo 官方维护）或 **`react-native-purchases`（RevenueCat）**；旧版 `expo-in-app-purchases` 已停止维护，不应使用
- RevenueCat 选项优势：自动处理 Apple Server Notifications V2（续订/取消/退款），减少自建验证维护成本；劣势：第三方依赖 + 按收入抽成
- `expo-iap` 选项优势：Expo 生态原生；需自建后端 receipt 验证逻辑（App Store Server API v2）
- 产品 ID 命名规范：`com.kairos.kakomon.pro.{monthly|yearly|lifetime}`
- 购买完成后将 receipt 发送至 `/billing/verify-receipt`，后端验证后更新用户 Pro 状态

---

## 十、错误码规范

| code | HTTP | 说明 |
|------|------|------|
| `UNAUTHORIZED` | 401 | Token 无效或过期 |
| `FORBIDDEN` | 403 | 权限不足（如非 Pro 访问 Pro 内容）|
| `NOT_FOUND` | 404 | 资源不存在 |
| `QUOTA_EXCEEDED` | 402 | AI 额度不足 |
| `INVALID_INPUT` | 400 | 参数校验失败 |
| `CONFLICT` | 409 | 已收藏 / 已投票等重复操作 |
| `RATE_LIMITED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

前端统一错误处理（axios interceptor）：
- `401` → 自动 refresh token，失败后跳转登录页
- `402` → 弹出升级 Pro / 充值 Token 引导
- `403` → Toast 提示权限不足
- `5xx` → Toast 提示"服务暂时不可用，请稍后重试"

---

## 十一、Shared Services（跨模块能力边界）

K1–K4 业务模块之外，以下能力必须单独实现，不得散落在各业务路由中。

### 11.1 Auth（认证）

| 职责 | 说明 |
|------|------|
| JWT 签发与刷新 | Access 15min / Refresh 30天 |
| Refresh Token 存储 | PostgreSQL `refresh_tokens` 表（或 Redis），支持单设备注销 |
| 密码重置流程 | 邮件验证码，限频 5 次/小时 |
| **不负责** | 权限判断（isPro/quota）由 Billing 决定 |

### 11.2 Billing & Entitlement（计费与权限）

| 职责 | 说明 |
|------|------|
| `isPro` 判断 | `subscriptions` 表 status='active' AND expires_at > NOW() |
| Apple IAP 验证 | App Store Server API v2（非旧版 verifyReceipt）+ Server Notifications V2 Webhook |
| Token 钱包 | `token_balances` 表 + Redis 原子扣款（Lua 脚本防超扣）|
| 权限截断 | 所有 Pro-gated 字段（aiSummary、L3 related）在此层过滤，业务层不做判断 |

> **重要**：billing/entitlement 必须在开发 K1 账户时同步实现，否则后续所有模块的权限判断都无处挂靠。

### 11.3 AI Quota（AI 配额）

| 职责 | 说明 |
|------|------|
| 免费次数 | Redis `ai:quota:{userId}:{YYYY-MM-DD}` 计数，每日 00:00 UTC 重置（定时任务）|
| 扣费原子性 | 预扣 → 调用 Claude API → 成功确认 / 失败回滚（Redis Lua 脚本）|
| 审计日志 | `ai_daily_usage` 表记录每日使用量（Redis 为主，DB 为审计）|
| 防刷 | 每用户每天免费 1 次 / Token 模式上限 100 次；后端强制，前端不可绕过 |

### 11.4 Search（搜索与推荐）

| 功能 | V1 实现 | V2 升级 |
|------|---------|---------|
| 题目全文搜索 | PostgreSQL FTS（GIN 索引 + pg_bigm 中日文支持）| Elasticsearch 8 |
| 大学/参考书搜索 | PostgreSQL ILIKE + GIN | ES |
| 相似题推荐 | pgvector（questions.embedding 列）+ 余弦相似度 | ES KNN |
| 弱点驱动推荐 | 查询 user_mastery 错题知识点 → 匹配同点未做题 | ML 排序 |

### 11.5 Notification（通知）

| 触发场景 | V1 实现 |
|----------|---------|
| 考试倒计时提醒 | 定时任务，读 `user_profiles.next_exam_date`，提前 30/7/1 天推送 |
| 论坛回复提醒 | 发帖时记录 user_id，被回复时异步推送 |
| 系统公告 | 管理后台广播 |
| 推送实现 | Expo Push API（单/批量）；设备 Token 存 `push_tokens` 表 |

### 11.6 Moderation（内容审核）

| 内容类型 | V1 策略 |
|----------|---------|
| 论坛帖子/回复 | 发布后立即可见；举报接口 → 运营人工审核 → 可设为 `hidden` |
| 大学评价 / 教授经验 | 同上 |
| 用户贡献（题目图片）| V1 不开放用户上传；运营手动导入 |
| 审核状态字段 | 各 UGC 表均有 `status` 列：`active / hidden / removed` |

### 11.7 Content Ingestion（内容导入）

**这是非研发工作，但直接决定产品能否上线。**

| 内容 | 最低 V1 量 | 导入方式 |
|------|-----------|---------|
| 过去问题目 + 解析 | ≥ 200 题（≥ 3 校 × ≥ 3 年）| 管理后台 + 批量 CSV |
| 参考书章节匹配 | ≥ 100 题有匹配 | CSV 导入脚本 |
| 举一反三关联 | ≥ 50 组 | pgvector 预计算 + 人工标注 |
| 大学/教授数据（14 所）| 完整 | 管理后台录入 |
| 论坛种子帖子 | ≥ 50 帖 | 运营发布 |

**建议：Phase 0 期间同步启动内容录入，否则 Phase 1 验收时产品将是空壳。**
