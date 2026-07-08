export type MasteryStatus = 'mastered' | 'unclear' | 'wrong';
export type MatchType = 'exact_question' | 'same_point' | 'similar_method';
export type RelatedLevel = 1 | 2 | 3;

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'very_hard';

export interface KakomonQuestion {
  id: string;
  universityId: string;
  graduateSchool: string;
  /** 该题归属的主专业 id（来自 UNI_MAJORS）。缺省视为该研究科全专业通用。 */
  majorId?: string;
  year: number;
  subject: string;
  /** 科目机器 code（用于过滤/查询，如 "math"）。展示名用 subject。 */
  subjectCode: string;
  questionNo: string;
  title: string;
  bodyText?: string;
  originalImageUrl?: string;
  formulaPreview?: string[];
  knowledgePoints: string[];
  difficultyLabel: string;
  difficultyLevel?: DifficultyLevel;
  crowdDifficultyRate: number;
  crowdVotes?: { easy: number; medium: number; hard: number };
  masteryStatus?: MasteryStatus | null;
  standardExplanation?: ExplanationStep[];
  referenceMatches?: ReferenceMatch[];
  relatedQuestions?: RelatedQuestion[];
  hasOriginalImage?: boolean;
  /** 结构化题干内容块（优先渲染；缺省时回退 bodyText）。 */
  contentBlocks?: ContentBlock[];
  /** 所属试卷 id（模考按试卷组织）。 */
  paperId?: string;
  /** 大问在试卷内的顺序。 */
  orderIndex?: number;
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
  confidence: number;
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
  mastery: number;
  overlap: string[];
}

export interface ReferenceBook {
  id: string;
  title: string;
  titleJp: string;
  author: string;
  cover: string;
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

export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'math'; latex: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'table'; rows: string[][]; caption?: string };

/** 一份完整试卷（大学×研究科×年份×科目），下辖多个大问。 */
export interface ExamPaper {
  id: string;
  universityId: string;
  graduateSchool: string;
  majorId?: string | null;
  year: number;
  subject: string;
  /** 科目机器 code（用于过滤/查询）。展示名用 subject。 */
  subjectCode: string;
  /** 展示标题，如「平成29年度 大学院入学試験問題 数学」。 */
  title: string;
  /** 考试时长（分钟），用于模考倒计时。 */
  durationMinutes?: number;
  totalScore?: number | null;
  /** 选做规则，如 6 問中 3 問選択 → { total: 6, choose: 3 }。 */
  selectRule?: { total: number; choose: number };
  /** 注意事项文本数组。 */
  instructions?: string[];
  /** 大问 id 顺序。 */
  questionIds: string[];
}
