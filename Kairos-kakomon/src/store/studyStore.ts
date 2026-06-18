import { create } from 'zustand';

interface StudyState {
  selectedSubjectFilter: string | null;
  selectedDifficultyFilter: string | null;
  searchQuery: string;

  setSubjectFilter: (subject: string | null) => void;
  setDifficultyFilter: (difficulty: string | null) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  selectedSubjectFilter: null,
  selectedDifficultyFilter: null,
  searchQuery: '',

  setSubjectFilter: (subject) => set({ selectedSubjectFilter: subject }),
  setDifficultyFilter: (difficulty) => set({ selectedDifficultyFilter: difficulty }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () => set({ selectedSubjectFilter: null, selectedDifficultyFilter: null, searchQuery: '' }),
}));
