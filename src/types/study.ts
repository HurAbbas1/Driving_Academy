export interface Subtopic {
  id: string;
  chapterId: string;
  title: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  content: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  order: number;
  imageUrl?: string;
  tip?: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
}

export interface Chapter {
  id: string;
  title: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  sub: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  icon: string; // Ionicons name
  order: number;
  subtopics: Subtopic[];
}

export interface Book {
  id: string;
  title: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  description: {
    en: string;
    ja: string;
    zh: string;
    pt: string;
  };
  icon: string;
  chapters: Chapter[];
}

