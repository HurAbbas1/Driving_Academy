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

export interface RecentChapterItem {
  chapterId: string;
  accessedAt: number;
}

interface StudyState {
  books: Book[];
  chapters: Chapter[];
  bookmarkedPages: string[]; // subtopicIds
  bookmarkedChapters: string[]; // chapterIds
  recentChapters: RecentChapterItem[];
  progress: ReadingProgress;
  downloadedChapters: string[]; // chapterIds
  notes: Record<string, string>; // chapterId -> noteText
  loading: boolean;
  selectedBookId: string | null;

  // Actions
  addBook: (book: Book) => void;
  setSelectedBookId: (id: string | null) => void;
  toggleBookmark: (subtopicId: string) => Promise<void>;
  toggleBookmarkChapter: (chapterId: string) => Promise<void>;
  addRecentChapter: (chapterId: string) => Promise<void>;
  clearRecentChapters: () => Promise<void>;
  markAsRead: (subtopicId: string, chapterId: string) => Promise<void>;
  setLastRead: (subtopicId: string, chapterId: string) => Promise<void>;
  downloadChapter: (chapterId: string) => Promise<void>;
  deleteDownload: (chapterId: string) => Promise<void>;
  toggleDownloadChapter: (chapterId: string) => Promise<void>;
  saveChapterNote: (chapterId: string, noteText: string) => Promise<void>;
  deleteChapterNote: (chapterId: string) => Promise<void>;
  loadStudyState: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  books: [],
  chapters: [],
  bookmarkedPages: [],
  bookmarkedChapters: [],
  recentChapters: [],
  progress: {
    completedSubtopics: [],
    lastReadSubtopicId: null,
    lastReadChapterId: null,
  },
  downloadedChapters: [],
  notes: {},
  loading: false,
  selectedBookId: null,

  addBook: (newBook) => {
    const { books, chapters } = get();
    const updatedBooks = [newBook, ...books];
    const updatedChapters = [...newBook.chapters, ...chapters];
    set({ books: updatedBooks, chapters: updatedChapters });
    AsyncStorage.setItem('ai-custom-books', JSON.stringify(updatedBooks)).catch(() => {});
  },

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

  toggleBookmarkChapter: async (chapterId) => {
    const { bookmarkedChapters, bookmarkedPages, chapters } = get();
    const isBookmarked = bookmarkedChapters.includes(chapterId) || bookmarkedPages.some(id => id === chapterId || id.startsWith(chapterId));
    
    const targetChapter = chapters.find(c => c.id === chapterId);
    const subtopicIds = targetChapter && targetChapter.subtopics ? targetChapter.subtopics.map(s => s.id) : [];

    let newBookmarkedChapters: string[];
    let newBookmarkedPages: string[];

    if (isBookmarked) {
      newBookmarkedChapters = bookmarkedChapters.filter(id => id !== chapterId);
      newBookmarkedPages = bookmarkedPages.filter(id => id !== chapterId && !subtopicIds.includes(id) && !id.startsWith(chapterId));
    } else {
      newBookmarkedChapters = Array.from(new Set([...bookmarkedChapters, chapterId]));
      newBookmarkedPages = Array.from(new Set([...bookmarkedPages, chapterId, ...subtopicIds]));
    }

    set({ 
      bookmarkedChapters: newBookmarkedChapters,
      bookmarkedPages: newBookmarkedPages
    });

    await AsyncStorage.setItem('bookmarked-chapters', JSON.stringify(newBookmarkedChapters));
    await AsyncStorage.setItem('bookmarked-pages', JSON.stringify(newBookmarkedPages));
  },

  addRecentChapter: async (chapterId) => {
    const { recentChapters } = get();
    const filtered = recentChapters.filter(item => item.chapterId !== chapterId);
    const updated = [{ chapterId, accessedAt: Date.now() }, ...filtered].slice(0, 20);
    set({ recentChapters: updated });
    await AsyncStorage.setItem('recent-chapters', JSON.stringify(updated));
  },

  clearRecentChapters: async () => {
    set({ recentChapters: [] });
    await AsyncStorage.removeItem('recent-chapters');
  },

  toggleDownloadChapter: async (chapterId) => {
    const { downloadedChapters } = get();
    const isDownloaded = downloadedChapters.includes(chapterId);
    const newDownloads = isDownloaded
      ? downloadedChapters.filter(id => id !== chapterId)
      : [...downloadedChapters, chapterId];
    set({ downloadedChapters: newDownloads });
    await AsyncStorage.setItem('downloaded-chapters', JSON.stringify(newDownloads));
  },

  saveChapterNote: async (chapterId, noteText) => {
    const { notes } = get();
    const updated = { ...notes, [chapterId]: noteText };
    set({ notes: updated });
    await AsyncStorage.setItem('study-chapter-notes', JSON.stringify(updated));
  },

  deleteChapterNote: async (chapterId) => {
    const { notes } = get();
    const updated = { ...notes };
    delete updated[chapterId];
    set({ notes: updated });
    await AsyncStorage.setItem('study-chapter-notes', JSON.stringify(updated));
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
      const storedBookmarkedChapters = await AsyncStorage.getItem('bookmarked-chapters');
      const storedRecent = await AsyncStorage.getItem('recent-chapters');
      const storedProgress = await AsyncStorage.getItem('reading-progress');
      const storedDownloads = await AsyncStorage.getItem('downloaded-chapters');
      const storedNotes = await AsyncStorage.getItem('study-chapter-notes');

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
      }

      const storedCustomBooks = await AsyncStorage.getItem('ai-custom-books');
      if (storedCustomBooks) {
        try {
          const customBooks: Book[] = JSON.parse(storedCustomBooks);
          for (const cb of customBooks) {
            if (!finalBooks.some((b) => b.id === cb.id)) {
              finalBooks.unshift(cb);
              finalChapters.unshift(...cb.chapters);
            }
          }
        } catch (e) {}
      }

      // Deduplicate chapters by unique ID to prevent duplicate React keys
      const uniqueChaptersMap = new Map<string, Chapter>();
      finalChapters.forEach((ch) => {
        if (!uniqueChaptersMap.has(ch.id)) {
          uniqueChaptersMap.set(ch.id, ch);
        }
      });
      const uniqueChapters = Array.from(uniqueChaptersMap.values());

      set({
        books: finalBooks,
        chapters: uniqueChapters,
        bookmarkedPages: storedBookmarks ? JSON.parse(storedBookmarks) : [],
        bookmarkedChapters: storedBookmarkedChapters ? JSON.parse(storedBookmarkedChapters) : [],
        recentChapters: storedRecent ? JSON.parse(storedRecent) : [],
        progress: storedProgress ? JSON.parse(storedProgress) : { completedSubtopics: [], lastReadSubtopicId: null, lastReadChapterId: null },
        downloadedChapters: storedDownloads ? JSON.parse(storedDownloads) : [],
        notes: storedNotes ? JSON.parse(storedNotes) : {},
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
