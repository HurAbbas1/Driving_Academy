import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase/config';
import { useAuthStore } from './authStore';
import { Book, Chapter } from '../types/study';
import { mockBooks, mockChapters } from '../services/studyData';

interface ReadingProgress {
  completedSubtopics: string[]; // subtopicIds
  lastReadSubtopicId: string | null;
  lastReadChapterId: string | null;
}

interface StudyState {
  books: Book[];
  chapters: Chapter[];
  bookmarkedPages: string[]; // subtopicIds
  progress: ReadingProgress;
  downloadedChapters: string[]; // chapterIds
  loading: boolean;
  selectedBookId: string | null;

  // Actions
  setSelectedBookId: (id: string | null) => void;
  toggleBookmark: (subtopicId: string) => Promise<void>;
  markAsRead: (subtopicId: string, chapterId: string) => Promise<void>;
  setLastRead: (subtopicId: string, chapterId: string) => Promise<void>;
  downloadChapter: (chapterId: string) => Promise<void>;
  deleteDownload: (chapterId: string) => Promise<void>;
  loadStudyState: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  books: [],
  chapters: [],
  bookmarkedPages: [],
  progress: {
    completedSubtopics: [],
    lastReadSubtopicId: null,
    lastReadChapterId: null,
  },
  downloadedChapters: [],
  loading: false,
  selectedBookId: null,

  setSelectedBookId: (id) => set({ selectedBookId: id }),

  toggleBookmark: async (subtopicId) => {
    const { bookmarkedPages } = get();
    const user = useAuthStore.getState().user;
    
    const newBookmarks = bookmarkedPages.includes(subtopicId)
      ? bookmarkedPages.filter(id => id !== subtopicId)
      : [...bookmarkedPages, subtopicId];

    set({ bookmarkedPages: newBookmarks });
    
    try {
      await AsyncStorage.setItem('bookmarked-pages', JSON.stringify(newBookmarks));
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
              bookmarks: {
                ...existingData.bookmarks,
                pages: newBookmarks
              }
            }
          });
      }
    } catch (e) {
      console.error('Failed to sync bookmarks', e);
    }
  },

  markAsRead: async (subtopicId, chapterId) => {
    const { progress } = get();
    const user = useAuthStore.getState().user;
    
    if (progress.completedSubtopics.includes(subtopicId)) return;

    const newCompleted = [...progress.completedSubtopics, subtopicId];
    const newProgress = {
      ...progress,
      completedSubtopics: newCompleted,
      lastReadSubtopicId: subtopicId,
      lastReadChapterId: chapterId,
    };

    set({ progress: newProgress });
    
    try {
      await AsyncStorage.setItem('reading-progress', JSON.stringify(newProgress));
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
              progress: newProgress
            }
          });
      }
    } catch (e) {
      console.error('Failed to sync reading progress', e);
    }
  },

  setLastRead: async (subtopicId, chapterId) => {
    const { progress } = get();
    const newProgress = {
      ...progress,
      lastReadSubtopicId: subtopicId,
      lastReadChapterId: chapterId,
    };
    set({ progress: newProgress });
    await AsyncStorage.setItem('reading-progress', JSON.stringify(newProgress));
  },

  downloadChapter: async (chapterId) => {
    const { downloadedChapters } = get();
    if (downloadedChapters.includes(chapterId)) return;

    const newDownloads = [...downloadedChapters, chapterId];
    set({ downloadedChapters: newDownloads });
    await AsyncStorage.setItem('downloaded-chapters', JSON.stringify(newDownloads));
  },

  deleteDownload: async (chapterId) => {
    const { downloadedChapters } = get();
    const newDownloads = downloadedChapters.filter(id => id !== chapterId);
    set({ downloadedChapters: newDownloads });
    await AsyncStorage.setItem('downloaded-chapters', JSON.stringify(newDownloads));
  },

  loadStudyState: async () => {
    set({ loading: true });
    try {
      const storedBookmarks = await AsyncStorage.getItem('bookmarked-pages');
      const storedProgress = await AsyncStorage.getItem('reading-progress');
      const storedDownloads = await AsyncStorage.getItem('downloaded-chapters');

      let finalBooks: Book[] = [];
      let finalChapters: Chapter[] = [];

      try {
        const { data: dbBooks } = await supabase.from('books').select('*');
        const { data: dbChapters } = await supabase.from('chapters').select('*');
        const { data: dbSubtopics } = await supabase.from('subtopics').select('*');

        if (dbBooks && dbBooks.length > 0) {
          const mappedChapters: Chapter[] = (dbChapters || []).map((ch) => {
            const subs = (dbSubtopics || [])
              .filter((sub) => sub.chapter_id === ch.id)
              .sort((a, b) => (a.order_num || 0) - (b.order_num || 0))
              .map((sub) => ({
                id: sub.id,
                chapterId: sub.chapter_id,
                title: sub.title,
                content: sub.content,
                order: sub.order_num || 1,
                tip: sub.tip || undefined
              }));

            return {
              id: ch.id,
              title: ch.title,
              sub: ch.title,
              icon: 'book-outline',
              order: ch.order_num || 1,
              licenseType: ch.license_type || 'both',
              subtopics: subs
            };
          });

          finalBooks = dbBooks.map((b) => {
            const chs = mappedChapters.filter((ch) => {
              const dbCh = (dbChapters || []).find((dbc) => dbc.id === ch.id);
              return dbCh && dbCh.book_id === b.id;
            });

            const bookCoverMap: Record<string, string> = {
              'book_jaf_guide': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&q=80',
              'book_rules_of_road_part2': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&q=80',
              'book_traffic_rules_full': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&q=80',
              'book1': 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=1000&q=80',
              'book2': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1000&q=80',
            };

            return {
              id: b.id,
              title: b.title,
              description: b.description || { en: '', ja: '', zh: '', pt: '' },
              icon: b.icon || 'car-sport-outline',
              coverImage: bookCoverMap[b.id] || b.cover_image || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&q=80',
              chapters: chs
            };
          });

          finalChapters = mappedChapters;
        }
      } catch (dbErr) {
        console.warn("[Supabase] Failed to fetch database books, falling back to static metadata:", dbErr);
      }

      if (finalBooks.length === 0) {
        finalBooks = mockBooks;
        finalChapters = mockChapters;
      } else {
        const existingIds = new Set(finalBooks.map((b) => b.id));
        for (const mb of mockBooks) {
          if (!existingIds.has(mb.id)) {
            finalBooks.push(mb);
            finalChapters.push(...mb.chapters);
          }
        }
      }

      set({
        books: finalBooks,
        chapters: finalChapters,
        bookmarkedPages: storedBookmarks ? JSON.parse(storedBookmarks) : [],
        progress: storedProgress ? JSON.parse(storedProgress) : { completedSubtopics: [], lastReadSubtopicId: null, lastReadChapterId: null },
        downloadedChapters: storedDownloads ? JSON.parse(storedDownloads) : [],
      });
    } catch (e) {
      console.error('Failed to load study state', e);
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
        const cloudBookmarks = cloudData.bookmarks?.pages || [];
        const cloudProgress = cloudData.progress || { completedSubtopics: [], lastReadSubtopicId: null, lastReadChapterId: null };

        const localProgress = get().progress;
        const mergedCompleted = Array.from(new Set([
          ...(localProgress.completedSubtopics || []),
          ...(cloudProgress.completedSubtopics || []),
        ]));

        const localBookmarks = get().bookmarkedPages;
        const mergedBookmarks = localBookmarks.length > 0 ? localBookmarks : cloudBookmarks;

        const mergedProgress = {
          completedSubtopics: mergedCompleted,
          lastReadSubtopicId: cloudProgress.lastReadSubtopicId || localProgress.lastReadSubtopicId,
          lastReadChapterId: cloudProgress.lastReadChapterId || localProgress.lastReadChapterId,
        };

        set({
          bookmarkedPages: mergedBookmarks,
          progress: mergedProgress,
        });

        await AsyncStorage.setItem('bookmarked-pages', JSON.stringify(mergedBookmarks));
        await AsyncStorage.setItem('reading-progress', JSON.stringify(mergedProgress));

        await supabase
          .from('user_data')
          .upsert({
            user_id: userId,
            data: {
              ...cloudData,
              bookmarks: { ...cloudData.bookmarks, pages: mergedBookmarks },
              progress: mergedProgress,
            }
          });
      }
    } catch (e) {
      console.error('Cloud study synchronization failed', e);
    }
  },
}));
