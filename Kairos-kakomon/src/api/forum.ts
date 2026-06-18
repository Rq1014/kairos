import type { PaginatedResponse } from '@/types/api';
import type {
  ForumThread,
  StudyGroup,
  ThreadReply,
  ThreadType,
} from '@/types/forum';
import {
  KAKOMON_GROUPS,
  KAKOMON_THREADS,
  KAKOMON_THREAD_REPLIES,
} from '@/mocks/data';

export interface ForumThreadDetail extends ForumThread {
  body: string;
  createdAt: string;
  replies: ThreadReply[];
}

export interface ForumThreadParams {
  page?: number;
  pageSize?: number;
  type?: ThreadType;
  universityId?: string;
  questionId?: string;
  keyword?: string;
}

export interface CreateThreadRequest {
  title: string;
  type: ThreadType;
  body: string;
  universityId?: string;
  questionId?: string;
  tags?: string[];
}

export interface StudyGroupParams {
  page?: number;
  pageSize?: number;
  universityId?: string;
  subject?: string;
  joined?: boolean;
}

function paginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    total: items.length,
    page,
    pageSize,
    hasMore: start + slice.length < items.length,
  };
}

function filterThreads(items: ForumThread[], params: ForumThreadParams = {}) {
  const keyword = params.keyword?.trim().toLowerCase();
  return items.filter((t) => {
    if (params.type && t.type !== params.type) return false;
    if (params.universityId && t.universityId !== params.universityId) return false;
    if (params.questionId && t.questionId !== params.questionId) return false;
    if (keyword) {
      const hay = `${t.title} ${t.excerpt} ${t.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    return true;
  });
}

export async function getForumThreads(
  params?: ForumThreadParams,
): Promise<PaginatedResponse<ForumThread>> {
  const filtered = filterThreads(KAKOMON_THREADS, params);
  return paginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
}

export async function createForumThread(payload: CreateThreadRequest): Promise<ForumThread> {
  return {
    id: `t-${Date.now()}`,
    title: payload.title,
    type: payload.type,
    universityId: payload.universityId,
    questionId: payload.questionId,
    tags: payload.tags ?? [],
    replyCount: 0,
    viewCount: 0,
    hasAcceptedAnswer: false,
    authorBadge: 'preparing',
    authorName: '当前用户',
    excerpt: payload.body.slice(0, 80),
    lastActivity: '刚刚',
  };
}

export async function getForumThread(id: string): Promise<ForumThreadDetail> {
  const t = KAKOMON_THREADS.find((it) => it.id === id);
  if (!t) throw new Error(`Thread not found: ${id}`);
  return {
    ...t,
    body: t.excerpt,
    createdAt: new Date().toISOString(),
    replies: KAKOMON_THREAD_REPLIES[id] ?? [],
  };
}

export async function getForumReplies(
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<ThreadReply>> {
  return paginate(KAKOMON_THREAD_REPLIES[id] ?? [], params?.page ?? 1, params?.pageSize ?? 20);
}

export async function createForumReply(_id: string, body: string): Promise<ThreadReply> {
  return {
    id: `r-${Date.now()}`,
    author: '当前用户',
    badge: 'preparing',
    time: '刚刚',
    body,
    upvotes: 0,
    isAccepted: false,
  };
}

export async function upvoteForumReply(
  _threadId: string,
  _replyId: string,
): Promise<{ upvotes: number; voted: true }> {
  return { upvotes: 1, voted: true };
}

export async function acceptForumReply(
  _threadId: string,
  _replyId: string,
): Promise<{ accepted: boolean; threadHasAcceptedAnswer: boolean }> {
  return { accepted: true, threadHasAcceptedAnswer: true };
}

function filterGroups(items: StudyGroup[], params: StudyGroupParams = {}) {
  return items.filter((g) => {
    if (params.universityId && g.target !== params.universityId) return false;
    if (params.subject && g.subject !== params.subject) return false;
    return true;
  });
}

export async function getStudyGroups(
  params?: StudyGroupParams,
): Promise<PaginatedResponse<StudyGroup>> {
  const filtered = filterGroups(KAKOMON_GROUPS, params);
  return paginate(filtered, params?.page ?? 1, params?.pageSize ?? 20);
}

export async function joinStudyGroup(
  id: string,
): Promise<{ id: string; joined: true; memberCount: number }> {
  const g = KAKOMON_GROUPS.find((it) => it.id === id);
  return { id, joined: true, memberCount: (g?.memberCount ?? 0) + 1 };
}
