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
  isAnonymous?: boolean;
}

export interface ThreadReply {
  id: string;
  author: string;
  badge: AuthorBadge;
  time: string;
  body: string;
  upvotes: number;
  isAccepted: boolean;
  isAnonymous?: boolean;
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
