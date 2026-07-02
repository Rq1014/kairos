import type { ExamPaper } from '@/types/question';
import { KAKOMON_PAPERS } from '@/mocks/data';

export interface PaperQueryParams {
  universityId?: string;
  graduateSchool?: string;
  majorId?: string | null;
}

export async function getPapers(params: PaperQueryParams = {}): Promise<ExamPaper[]> {
  return KAKOMON_PAPERS.filter((p) => {
    if (params.universityId && p.universityId !== params.universityId) return false;
    if (params.graduateSchool && p.graduateSchool !== params.graduateSchool) return false;
    if (params.majorId && p.majorId && p.majorId !== params.majorId) return false;
    return true;
  }).sort((a, b) => b.year - a.year);
}

export async function getPaper(id: string): Promise<ExamPaper> {
  const hit = KAKOMON_PAPERS.find((p) => p.id === id);
  if (!hit) throw new Error(`Paper not found: ${id}`);
  return hit;
}
