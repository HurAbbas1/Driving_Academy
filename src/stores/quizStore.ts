import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase/config';
import { useAuthStore } from './authStore';
import { useStudyStore } from './studyStore';
import { Question, QuizSession, QuizHistoryItem, QuizViewMode } from '../types/quiz';

interface WrongQuestionState {
  questionId: string;
  consecutiveCorrectCount: number;
}

interface QuizState {
  questions: Question[];
  history: QuizHistoryItem[];
  bookmarkedQuestions: string[]; // questionIds
  wrongQuestions: WrongQuestionState[]; // tracked wrong questions
  activeSession: QuizSession | null;
  loading: boolean;

  viewMode: QuizViewMode;
  setViewMode: (mode: QuizViewMode) => void;

  // Actions
  startNewQuiz: (questionIdsFilter?: string[], bookIdFilter?: string, chapterIdFilter?: string) => void;
  selectAnswer: (questionId: string, optionIndex: number) => void;
  toggleFlagQuestion: (questionId: string) => void;
  toggleBookmarkQuestion: (questionId: string) => void;
  submitQuiz: () => Promise<void>;
  cancelQuiz: () => void;
  incrementElapsed: () => void;
  loadQuizState: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  viewMode: 'dashboard',
  setViewMode: (viewMode) => set({ viewMode }),
  history: [],
  bookmarkedQuestions: [],
  wrongQuestions: [],
  activeSession: null,
  loading: false,

  startNewQuiz: (questionIdsFilter, bookIdFilter, chapterIdFilter) => {
    const { questions } = get();
    const questionsPool = questions;
    let pool = questionsPool.filter(q => q.options && q.options.length > 0);
    
    if (questionIdsFilter && questionIdsFilter.length > 0) {
      pool = pool.filter(q => questionIdsFilter.includes(q.id));
    }

    // Chapter Quiz Randomizer (20 MCQs from the chapter)
    if (chapterIdFilter) {
      let chapterPool = pool.filter(q => q.chapterId === chapterIdFilter);
      
      // Fallback: If no questions are found for this specific chapter, load questions for the entire book
      if (chapterPool.length === 0) {
        console.log(`[QuizStore] No questions found for chapter ${chapterIdFilter}. Falling back to book questions...`);
        const studyState = useStudyStore.getState();
        const book = studyState.books.find(b => b.chapters.some(c => c.id === chapterIdFilter));
        if (book) {
          chapterPool = pool.filter(q => q.bookId === book.id);
        }
      }

      let selected = shuffleArray(chapterPool).slice(0, 20);
      
      selected = selected.map(q => {
        const originalOptions = [...q.options];
        const shuffledOptions = shuffleArray(originalOptions);
        return {
          ...q,
          options: shuffledOptions,
        };
      });

      const session: QuizSession = {
        id: Math.random().toString(36).substr(2, 9),
        questions: selected,
        currentIndex: 0,
        userAnswers: {},
        flaggedQuestions: [],
        startTime: Date.now(),
        elapsedSeconds: 0,
      };

      set({ activeSession: session });
      return;
    }

    // Overall Final Exam Randomizer (draw up to 15 questions per dynamic book)
    if (bookIdFilter === 'final') {
      const selectedQuestions: Question[] = [];
      const uniqueBookIds = Array.from(new Set(pool.map(q => q.bookId).filter(Boolean)));
      
      if (uniqueBookIds.length > 0) {
        uniqueBookIds.forEach((bId) => {
          const bookPool = pool.filter(q => q.bookId === bId);
          const bookSelected = shuffleArray(bookPool).slice(0, 15);
          selectedQuestions.push(...bookSelected);
        });
      } else {
        selectedQuestions.push(...shuffleArray(pool).slice(0, 30));
      }
      
      let selected = shuffleArray(selectedQuestions);
      
      selected = selected.map(q => {
        const originalOptions = [...q.options];
        const shuffledOptions = shuffleArray(originalOptions);
        return {
          ...q,
          options: shuffledOptions,
        };
      });

      const session: QuizSession = {
        id: Math.random().toString(36).substr(2, 9),
        questions: selected,
        currentIndex: 0,
        userAnswers: {},
        flaggedQuestions: [],
        startTime: Date.now(),
        elapsedSeconds: 0,
      };

      set({ activeSession: session });
      return;
    }

    // Default book or global filters (capped at 50)
    if (bookIdFilter) {
      pool = pool.filter(q => q.bookId === bookIdFilter);
    }

    let selected = shuffleArray(pool).slice(0, 50);

    selected = selected.map(q => {
      const originalOptions = [...q.options];
      const shuffledOptions = shuffleArray(originalOptions);
      return {
        ...q,
        options: shuffledOptions,
      };
    });

    const session: QuizSession = {
      id: Math.random().toString(36).substr(2, 9),
      questions: selected,
      currentIndex: 0,
      userAnswers: {},
      flaggedQuestions: [],
      startTime: Date.now(),
      elapsedSeconds: 0,
    };

    set({ activeSession: session });
  },

  selectAnswer: (questionId, optionIndex) => {
    const { activeSession } = get();
    if (!activeSession) return;

    // Lock answer selection once answered
    if (activeSession.userAnswers[questionId] !== undefined) return;

    const newAnswers = {
      ...activeSession.userAnswers,
      [questionId]: optionIndex,
    };

    set({
      activeSession: {
        ...activeSession,
        userAnswers: newAnswers,
      },
    });
  },

  toggleFlagQuestion: (questionId) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const flagged = activeSession.flaggedQuestions.includes(questionId)
      ? activeSession.flaggedQuestions.filter(id => id !== questionId)
      : [...activeSession.flaggedQuestions, questionId];

    set({
      activeSession: {
        ...activeSession,
        flaggedQuestions: flagged,
      },
    });
  },

  toggleBookmarkQuestion: async (questionId) => {
    const { bookmarkedQuestions } = get();
    const user = useAuthStore.getState().user;

    const newBookmarks = bookmarkedQuestions.includes(questionId)
      ? bookmarkedQuestions.filter(id => id !== questionId)
      : [...bookmarkedQuestions, questionId];

    set({ bookmarkedQuestions: newBookmarks });

    try {
      await AsyncStorage.setItem('bookmarked-questions', JSON.stringify(newBookmarks));
      const userId = user?.id || user?.uid;
      if (userId && userId !== 'mock-user-123') {
        const { data: record } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', userId)
          .single();
          
        const existingData = record?.data || {};
        await supabase
          .from('user_data')
          .upsert({
            user_id: userId,
            data: {
              ...existingData,
              bookmarks: {
                ...(existingData.bookmarks || {}),
                questions: newBookmarks
              }
            }
          });
      }
    } catch (e) {
      console.error(e);
    }
  },

  submitQuiz: async () => {
    const { activeSession, history, wrongQuestions, bookmarkedQuestions } = get();
    if (!activeSession) return;

    const user = useAuthStore.getState().user;
    const endTime = Date.now();
    const elapsedSeconds = Math.round((endTime - activeSession.startTime) / 1000);

    let correctCount = 0;
    let incorrectCount = 0;
    const updatedWrongQuestions = [...wrongQuestions];

    activeSession.questions.forEach((q) => {
      const selectedIndex = activeSession.userAnswers[q.id];
      const selectedOption = selectedIndex !== undefined ? q.options[selectedIndex] : null;

      if (selectedOption && selectedOption.isCorrect) {
        correctCount += 1;
        // Track correct answer to check if it can be removed from wrong questions list
        const wrongIdx = updatedWrongQuestions.findIndex(wq => wq.questionId === q.id);
        if (wrongIdx !== -1) {
          const wq = updatedWrongQuestions[wrongIdx];
          const newCorrectCount = wq.consecutiveCorrectCount + 1;
          if (newCorrectCount >= 3) {
            // Remove after 3 consecutive correct answers
            updatedWrongQuestions.splice(wrongIdx, 1);
          } else {
            updatedWrongQuestions[wrongIdx] = {
              ...wq,
              consecutiveCorrectCount: newCorrectCount,
            };
          }
        }
      } else {
        incorrectCount += 1;
        // Add to wrong questions list or reset correct streak
        const wrongIdx = updatedWrongQuestions.findIndex(wq => wq.questionId === q.id);
        if (wrongIdx === -1) {
          updatedWrongQuestions.push({ questionId: q.id, consecutiveCorrectCount: 0 });
        } else {
          updatedWrongQuestions[wrongIdx] = {
            questionId: q.id,
            consecutiveCorrectCount: 0,
          };
        }
      }
    });

    const scorePercent = Math.round((correctCount / activeSession.questions.length) * 100);

    const historyItem: QuizHistoryItem = {
      id: activeSession.id,
      score: scorePercent,
      total: activeSession.questions.length,
      correctCount,
      incorrectCount,
      date: endTime,
      elapsedSeconds,
    };

    const newHistory = [historyItem, ...history];

    // Auto bookmark questions flagged during the quiz
    const mergedBookmarks = Array.from(new Set([
      ...bookmarkedQuestions,
      ...activeSession.flaggedQuestions
    ]));

    set({
      history: newHistory,
      wrongQuestions: updatedWrongQuestions,
      bookmarkedQuestions: mergedBookmarks,
      activeSession: {
        ...activeSession,
        endTime,
        elapsedSeconds,
      },
    });

    // Simulate AI question rephrasing:
    // If a question in the quiz session has variations, swap its contents with the variation in-memory.
    const questionsPool = get().questions;
    activeSession.questions.forEach((q) => {
      if (q.variations && q.variations.length > 0) {
        const globalQ = questionsPool.find((mq) => mq.id === q.id);
        if (globalQ) {
          const variation = q.variations[0];
          const oldDetails = {
            text: globalQ.text,
            options: globalQ.options,
            explanation: globalQ.explanation,
          };
          
          globalQ.text = variation.text;
          globalQ.options = variation.options;
          globalQ.explanation = variation.explanation;
          globalQ.variations = [oldDetails];
          
          console.log(`[AI Ingestion] Question ${q.id} has been dynamically rephrased by AI for the next attempt.`);
        }
      }
    });

    try {
      await AsyncStorage.setItem('quiz-history', JSON.stringify(newHistory));
      await AsyncStorage.setItem('wrong-questions', JSON.stringify(updatedWrongQuestions));
      await AsyncStorage.setItem('bookmarked-questions', JSON.stringify(mergedBookmarks));

      const userId = user?.id;
      if (userId && userId !== 'mock-user-123') {
        const { data: record } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', userId)
          .single();
          
        const existingData = record?.data || {};
        await supabase
          .from('user_data')
          .upsert({
            user_id: userId,
            data: {
              ...existingData,
              history: newHistory,
              wrongQuestions: updatedWrongQuestions,
              bookmarks: {
                ...existingData.bookmarks,
                questions: mergedBookmarks
              }
            }
          });
      }
    } catch (e) {
      console.error('Failed to save quiz results', e);
    }
  },

  cancelQuiz: () => {
    set({ activeSession: null });
  },

  incrementElapsed: () => {
    const { activeSession } = get();
    if (!activeSession || activeSession.endTime) return;

    set({
      activeSession: {
        ...activeSession,
        elapsedSeconds: activeSession.elapsedSeconds + 1,
      },
    });
  },

  loadQuizState: async () => {
    set({ loading: true });
    try {
      const storedHistory = await AsyncStorage.getItem('quiz-history');
      const storedBookmarks = await AsyncStorage.getItem('bookmarked-questions');
      const storedWrong = await AsyncStorage.getItem('wrong-questions');

      let dbQuestions: Question[] = [];
      try {
        const { data } = await supabase.from('questions').select('*');
        if (data && data.length > 0) {
          dbQuestions = data.map((q) => ({
            id: q.id,
            bookId: q.book_id,
            chapterId: q.chapter_id,
            subtopicId: q.subtopic_id,
            category: q.category || 'general',
            difficulty: q.difficulty || 'medium',
            text: q.text,
            options: q.options,
            explanation: q.explanation,
            variations: q.variations || undefined
          }));
        }
      } catch (dbErr) {
        console.warn("[Supabase] Failed to fetch quiz questions:", dbErr);
      }

      set({
        questions: dbQuestions,
        history: storedHistory ? JSON.parse(storedHistory) : [],
        bookmarkedQuestions: storedBookmarks ? JSON.parse(storedBookmarks) : [],
        wrongQuestions: storedWrong ? JSON.parse(storedWrong) : [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  },

  syncWithCloud: async () => {
    const user = useAuthStore.getState().user;
    if (!user || user.id === 'mock-user-123') return;

    try {
      const { data: record } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user.id)
        .single();

      if (record?.data) {
        const cloudData = record.data;
        const cloudHistory = cloudData.history || [];
        const cloudBookmarks = cloudData.bookmarks?.questions || [];
        const cloudWrong = cloudData.wrongQuestions || [];

        // Simple sync: union/merge lists
        const localHistory = get().history;
        const mergedHistory = [...localHistory];
        cloudHistory.forEach((ch: any) => {
          if (!mergedHistory.some(lh => lh.id === ch.id)) {
            mergedHistory.push(ch);
          }
        });
        mergedHistory.sort((a, b) => b.date - a.date);

        const mergedBookmarks = Array.from(new Set([
          ...get().bookmarkedQuestions,
          ...cloudBookmarks,
        ]));

        // Merge wrong questions
        const localWrong = get().wrongQuestions;
        const mergedWrong = [...localWrong];
        cloudWrong.forEach((cw: any) => {
          if (!mergedWrong.some(lw => lw.questionId === cw.questionId)) {
            mergedWrong.push(cw);
          }
        });

        set({
          history: mergedHistory,
          bookmarkedQuestions: mergedBookmarks,
          wrongQuestions: mergedWrong,
        });

        await AsyncStorage.setItem('quiz-history', JSON.stringify(mergedHistory));
        await AsyncStorage.setItem('bookmarked-questions', JSON.stringify(mergedBookmarks));
        await AsyncStorage.setItem('wrong-questions', JSON.stringify(mergedWrong));

        await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            data: {
              ...cloudData,
              history: mergedHistory,
              bookmarks: {
                ...cloudData.bookmarks,
                questions: mergedBookmarks
              },
              wrongQuestions: mergedWrong
            }
          });
      }
    } catch (e) {
      console.error('Quiz cloud sync failed', e);
    }
  },
}));
