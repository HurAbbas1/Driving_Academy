export interface QuestionOption {
  text: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  isCorrect: boolean;
}

export interface QuestionVariation {
  text: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  options: QuestionOption[];
  explanation: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
}

export interface Question {
  id: string;
  text: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  options: QuestionOption[];
  explanation: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  refBookId?: string;
  refChapterId?: string;
  refSubtopicId?: string;
  variations?: QuestionVariation[];
}

export interface QuizSession {
  id: string;
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<string, number>; // questionId -> selectedOptionIndex
  flaggedQuestions: string[]; // questionId[]
  startTime: number;
  endTime?: number;
  elapsedSeconds: number;
}

export interface QuizHistoryItem {
  id: string;
  score: number;
  total: number;
  correctCount: number;
  incorrectCount: number;
  date: number;
  elapsedSeconds: number;
}

export type QuizViewMode = 'dashboard' | 'countdown' | 'active' | 'results' | 'review' | 'bookmarks' | 'wrongAnswers';

