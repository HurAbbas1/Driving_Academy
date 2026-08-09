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
  addQuestions: (newQuestions: any[]) => void;
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

const DEFAULT_FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'q_fallback_1',
    bookId: 'book_official_japan_handbook',
    chapterId: 'ch_official_1',
    category: 'Rules of the Road',
    difficulty: 'medium',
    text: {
      en: "When turning left at an intersection onto a two-lane road in Japan, which lane must you enter?",
      ja: "日本で交差点を左折して片側2車線の道路に入るとき、どの車線に入らなければなりませんか？",
      zh: "在日本交叉路口左转进入同向两车道道路时，必须驶入哪条车道？",
      pt: "Ao virar à esquerda em um cruzamento para uma via de duas faixas no Japão, em qual faixa você deve entrar?"
    },
    options: [
      { en: "The leftmost lane, keeping tight along the curb.", ja: "道路の左端に沿って一番左側の車線に入る。", zh: "紧靠路边驶入最左侧车道。", pt: "A faixa mais à esquerda, mantendo-se junto ao meio-fio.", isCorrect: true },
      { en: "The right lane directly to prepare for overtaking.", ja: "追越しに備えて直接右側車線に入る。", zh: "为了准备超车直接驶入右侧车道。", pt: "A faixa da direita diretamente para se preparar para ultrapassar.", isCorrect: false },
      { en: "Any lane as long as you do not hit oncoming cars.", ja: "対向車にぶつからなければどちらの車線でも良い。", zh: "只要不庄到对向车辆，任何车道都可以。", pt: "Qualquer faixa, desde que não atinja os carros no sentido contrário.", isCorrect: false }
    ],
    explanation: {
      en: "Japan is a left-driving country. Drivers making a left turn must keep tightly along the left curb and enter the leftmost lane.",
      ja: "日本は左側通行です。左折するときは道路の左端に寄って小さく曲がり、一番左側の車線に入ります。",
      zh: "日本实行靠左行驶。左转时必须紧靠道路左侧小转弯并驶入最左侧车道。",
      pt: "O Japão é um país de condução pela esquerda. Ao virar à esquerda, mantenha-se junto ao meio-fio e entre na faixa da esquerda."
    }
  },
  {
    id: 'q_fallback_2',
    bookId: 'book_official_japan_handbook',
    chapterId: 'ch_official_1',
    category: 'Pedestrian Protection',
    difficulty: 'hard',
    text: {
      en: "A pedestrian is waiting to cross at a signal-less crosswalk. What is your legal obligation?",
      ja: "信号のない横断歩道で歩行者が渡ろうとして待っています。ドライバーの法的義務は何ですか？",
      zh: "在没有信号灯的人行横道前，有行人正在等待过马路。驾驶员的法定义务是什么？",
      pt: "Um pedestre está aguardando para atravessar em uma faixa sem semáforo. Qual é a sua obrigação legal?"
    },
    options: [
      { en: "Stop completely before the stop line and yield right-of-way to the pedestrian.", ja: "停止線の手前で完全静止し、歩行者に道を譲る。", zh: "在停止线前完全停稳，礼让行人优先通行。", pt: "Parar totalmente antes da linha de retenção e dar preferência ao pedestre.", isCorrect: true },
      { en: "Honk your horn to warn the pedestrian and continue at constant speed.", ja: "クラクションを鳴らして歩行者に警告し、そのままの速度で進む。", zh: "按喇叭警告行人并保持原速通过。", pt: "Buzinar para alertar o pedestre e continuar na mesma velocidade.", isCorrect: false }
    ],
    explanation: {
      en: "Under Article 38 of the Road Traffic Law, drivers must stop cleanly before crosswalk stop lines when pedestrians are waiting to cross.",
      ja: "道路交通法第38条に基づき、歩行者が渡ろうとしている横断歩道の手前では完全静止しなければなりません。",
      zh: "根据道路交通法第38条，当横断步道有行人等待时，必须在停止线前停稳礼让。",
      pt: "De acordo com o Artigo 38 da Lei de Trânsito, o motorista deve parar totalmente antes da faixa quando houver pedestres aguardando."
    }
  },
  {
    id: 'q_fallback_3',
    bookId: 'book_official_japan_handbook',
    chapterId: 'ch_official_2',
    category: 'Traffic Signals',
    difficulty: 'medium',
    text: {
      en: "Is it legal to turn left or right on a steady red traffic signal in Japan?",
      ja: "日本で赤信号のときに左折または右折することは許可されていますか？",
      zh: "在日本面对红灯信号时，是否允许红灯左转或右转？",
      pt: "É permitido virar à esquerda ou à direita no sinal vermelho no Japão?"
    },
    options: [
      { en: "No, turning on red is strictly prohibited unless a 'Left Turn Permitted (左折可)' sign is posted.", ja: "いいえ、「左折可」の標示板がない限り、赤信号での曲がりは禁止されています。", zh: "不允许，除非立有“左折可”特殊告示牌，否则严禁红灯转弯。", pt: "Não, virar no vermelho é estritamente proibido, a menos que haja a placa 'Conversão à Esquerda Permitida (左折可)'.", isCorrect: true },
      { en: "Yes, left turns on red are allowed after making a full stop.", ja: "はい、一時停止した後であれば左折は許可されています。", zh: "允许，只要完全停稳后就可以红灯左转。", pt: "Sim, virar à esquerda no vermelho é permitido após parada total.", isCorrect: false }
    ],
    explanation: {
      en: "Japan does not have a general 'turn on red' rule. Red means mandatory stop unless an explicit 'Left Turn Permitted' (左折可) sign is present.",
      ja: "日本には一般的な赤信号右左折ルールはありません。「左折可」の標示がない限り赤信号での通行は禁止です。",
      zh: "日本没有通用的红灯转弯规则。红灯必须停车，除非有明确的“左折可”标志。",
      pt: "O Japão não possui permissão geral para virar no vermelho. Vermelho significa parada obrigatória."
    }
  }
];

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  viewMode: 'dashboard',
  setViewMode: (viewMode) => set({ viewMode }),
  history: [],
  bookmarkedQuestions: [],
  wrongQuestions: [],
  activeSession: null,
  loading: false,

  addQuestions: (newQuestions) => {
    const { questions } = get();
    const updated = [...newQuestions, ...questions];
    set({ questions: updated });
    AsyncStorage.setItem('ai-custom-questions', JSON.stringify(updated)).catch(() => {});
  },

  startNewQuiz: (questionIdsFilter, bookIdFilter, chapterIdFilter) => {
    const { questions } = get();
    const questionsPool = questions;
    let pool = questionsPool.filter(q => q.options && q.options.length > 0);
    
    if (questionIdsFilter && questionIdsFilter.length > 0) {
      pool = pool.filter(q => questionIdsFilter.includes(q.id));
    }

      // Chapter Quiz Randomizer (5 MCQs from the chapter)
      if (chapterIdFilter) {
        let chapterPool = pool.filter(q => q.chapterId === chapterIdFilter);
        
        // Fallback 1: If no questions found for chapterId, try bookId
        if (chapterPool.length === 0) {
          const studyState = useStudyStore.getState();
          const book = studyState.books.find(b => b.chapters.some(c => c.id === chapterIdFilter));
          if (book) {
            chapterPool = pool.filter(q => q.bookId === book.id);
          }
        }

        // Fallback 2: If still empty, use all available questions in pool
        if (chapterPool.length === 0) {
          chapterPool = pool.length > 0 ? pool : DEFAULT_FALLBACK_QUESTIONS;
        }

        let selected = shuffleArray(chapterPool).slice(0, Math.min(6, chapterPool.length));
        if (selected.length === 0) selected = DEFAULT_FALLBACK_QUESTIONS;

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

    // Overall Final Exam Randomizer (draw 50 questions from all chapters)
    if (bookIdFilter === 'final') {
      let selected = shuffleArray(pool).slice(0, 50);
      if (selected.length === 0) selected = DEFAULT_FALLBACK_QUESTIONS;
      
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

    set({
      history: newHistory,
      wrongQuestions: updatedWrongQuestions,
      bookmarkedQuestions,
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
      await AsyncStorage.setItem('bookmarked-questions', JSON.stringify(bookmarkedQuestions));

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
              history: newHistory,
              wrongQuestions: updatedWrongQuestions,
              bookmarks: {
                ...existingData.bookmarks,
                questions: bookmarkedQuestions
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

      const storedCustomQuestions = await AsyncStorage.getItem('ai-custom-questions');
      if (storedCustomQuestions) {
        try {
          const customQs = JSON.parse(storedCustomQuestions);
          dbQuestions = [...customQs, ...dbQuestions];
        } catch (e) {}
      }

      set({
        questions: dbQuestions.length > 0 ? dbQuestions : DEFAULT_FALLBACK_QUESTIONS,
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
    const userId = (user as any)?.id || (user as any)?.uid;
    if (!user || !userId || userId === 'mock-user-123') return;

    try {
      const { data: record } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
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

        const localBookmarks = get().bookmarkedQuestions;
        const mergedBookmarks = localBookmarks.length > 0 ? localBookmarks : cloudBookmarks;

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
            user_id: userId,
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
