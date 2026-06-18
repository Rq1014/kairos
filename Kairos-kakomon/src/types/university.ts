export type ExamDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard';
export type UniversityType = 'national' | 'private';
export type AccentColor = 'blue' | 'teal' | 'indigo' | 'amber' | 'rose';
export type RegionGroup = '首都圏' | '关西圏' | '中部' | '东北' | '北海道' | '九州' | '中国';

export interface University {
  id: string;
  nameCn: string;
  nameJp: string;
  nameEn: string;
  short: string;
  nickname?: string;
  type: UniversityType;
  region: string;
  regionGroup: RegionGroup;
  rating: number;
  examDifficulty: ExamDifficulty;
  pastExamCount: number;
  reviewCount: number;
  hotSubjects: string[];
  dimensions: UniversityDimensions;
  tags: string[];
  professorHighlights: ProfessorHighlight[];
  accent: AccentColor;
  suitableFor: string;
  /** 校徽图片 URL（后端维护）。为空时回退到首字母色块。 */
  logoUrl?: string;
  qsRank?: number;        // QS World University Rankings
  domesticRank?: number;  // 日本国内综合排名（文科省/THE等）
  subjectRanks?: Record<string, number>; // 预留：按专业领域排名，后端接口
}

export type UniGrads = Record<string, string[]>;

export interface MajorOption {
  id: string;
  label: string;
  short: string;
  desc: string;
}
export type UniMajors = Record<string, MajorOption[]>;

export interface UniversityDimensions {
  难度: number;
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
  aiSummary: ProfessorAiSummary | null;
  admission: { yearly: number; applyRatio: number; passRate: number };
  publications: number;
  relatedQuestions: string[];
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
