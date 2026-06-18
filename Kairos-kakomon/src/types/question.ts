export type MasteryStatus = 'mastered' | 'unclear' | 'wrong';
export type MatchType = 'exact_question' | 'same_point' | 'similar_method';
export type RelatedLevel = 1 | 2 | 3;

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'very_hard';

export interface KakomonQuestion {
  id: string;
  universityId: string;
  graduateSchool: string;
  /** 该题归属的专业 id 列表（来自 UNI_MAJORS）。一题可属于多个专业（共享题），缺省视为该研究科全专业通用。 */
  majorIds?: string[];
  year: number;
  subject: string;
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
