import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  Globe, 
  Settings, 
  Users 
} from 'lucide-react';
import { supabase } from './supabase';

// Mock collections to support CRUD state inside the admin dashboard
interface AdminQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: { en: string; ja: string; zh: string; pt: string };
  explanation: { en: string; ja: string; zh: string; pt: string };
}

interface AdminChapter {
  id: string;
  title: { en: string; ja: string; zh: string; pt: string };
  order: number;
}

const cleanAndParseJSON = (rawText: string) => {
  let cleanStr = rawText.trim();
  
  // Clean markdown fences if they still slip through
  if (cleanStr.startsWith("```json")) {
    cleanStr = cleanStr.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanStr.startsWith("```")) {
    cleanStr = cleanStr.replace(/^```/, "").replace(/```$/, "").trim();
  }

  try {
    return JSON.parse(cleanStr);
  } catch (initialError: any) {
    // Structural repair for cut-off responses
    try {
      if (!cleanStr.endsWith("}")) {
        // If it got cut off mid-subtopic array element
        if (cleanStr.includes('"subtopics": [')) {
          const lastValidIndex = cleanStr.lastIndexOf('}');
          if (lastValidIndex !== -1) {
            cleanStr = cleanStr.substring(0, lastValidIndex + 1) + ']}';
          }
        } else {
          cleanStr += "}";
        }
      }
      return JSON.parse(cleanStr);
    } catch (repairError: any) {
      console.error("Targeted parsing extraction failed. Raw text received was:", rawText);
      throw new Error(`JSON Structural Mismatch: ${repairError.message}`);
    }
  }
};

// Helper to render localized values safely and avoid react object child render crashes (handles double-nested values recursively)
const renderLocalized = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    const val = field.en || field.ja || field.zh || field.pt;
    if (val) {
      if (typeof val === 'string') return val;
      if (typeof val === 'object') return renderLocalized(val);
    }
    const keys = Object.keys(field);
    if (keys.length > 0) {
      const firstVal = field[keys[0]];
      if (typeof firstVal === 'string') return firstVal;
      if (typeof firstVal === 'object') return renderLocalized(firstVal);
    }
  }
  return '';
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // default true for preview
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'chapters' | 'ingestion' | 'users'>('dashboard');

  // Dynamic Ingested Handbook States
  const [books, setBooks] = useState<any[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Selection states for CRUD forms
  const [newQBookId, setNewQBookId] = useState('');
  const [newChapterBookId, setNewChapterBookId] = useState('');

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState(0);
  const [newBookTitle, setNewBookTitle] = useState('');
  
  // File upload and pasted text states
  const [fileContent, setFileContent] = useState('');
  const [rawTextPaste, setRawTextPaste] = useState('');
  const [generatedSubtopics, setGeneratedSubtopics] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Visual AI Ingestion States
  const [visualFiles, setVisualFiles] = useState<File[]>([]);
  const [visualBookId, setVisualBookId] = useState('');

  const [isVisualIngesting, setIsVisualIngesting] = useState(false);
  const [visualStatus, setVisualStatus] = useState('');

  // States and refs for dual-pane matched scrolling and sentence highlighting
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [compareLang, setCompareLang] = useState<'ja' | 'zh' | 'pt'>('ja');

  const enScrollRef = React.useRef<HTMLDivElement>(null);
  const compScrollRef = React.useRef<HTMLDivElement>(null);
  const isScrollingRef = React.useRef<string | null>(null);

  // Fetch data from Supabase DB
  const fetchData = async () => {
    try {
      const { data: dbBooks, error: booksError } = await supabase
        .from('books')
        .select('*');
      if (booksError) throw booksError;

      const { data: dbChapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*');
      if (chaptersError) throw chaptersError;

      const { data: dbQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*');
      if (questionsError) throw questionsError;

      const mappedBooks = (dbBooks || []).map(b => {
        const bookChapters = (dbChapters || []).filter(c => c.book_id === b.id).length;
        const bookQuestions = (dbQuestions || []).filter(q => q.book_id === b.id).length;
        return {
          id: b.id,
          title: b.title,
          chapters: bookChapters,
          questions: bookQuestions
        };
      });
      setBooks(mappedBooks);

      if (dbBooks && dbBooks.length > 0) {
        setNewQBookId(prev => prev || dbBooks[0].id);
        setNewChapterBookId(prev => prev || dbBooks[0].id);
      }

      const mappedChapters = (dbChapters || []).map(c => ({
        id: c.id,
        book_id: c.book_id,
        title: c.title,
        order: c.order_num
      }));
      setChapters(mappedChapters);

      const mappedQuestions = (dbQuestions || []).map(q => ({
        id: q.id,
        book_id: q.book_id,
        category: q.category || 'General',
        difficulty: q.difficulty || 'medium',
        text: q.text || { en: '', ja: '', zh: '', pt: '' },
        explanation: q.explanation || { en: '', ja: '', zh: '', pt: '' }
      }));
      setQuestions(mappedQuestions);

      // Fetch user profiles for User Management
      const { data: dbUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('*');
      
      if (usersError) {
        console.warn("Could not fetch user_profiles (likely due to RLS). Proceeding with empty users list.", usersError);
      } else {
        const mappedUsers = (dbUsers || []).map(u => ({
          user_id: u.user_id,
          email: u.profile?.email || 'N/A',
          displayName: u.profile?.displayName || 'User',
          language: u.profile?.language || 'en',
          streakCurrent: u.profile?.streak?.current ?? 0,
          streakLongest: u.profile?.streak?.longest ?? 0,
          createdAt: u.profile?.createdAt || u.created_at || 'N/A',
          lastActive: u.profile?.lastActive || u.updated_at || 'N/A',
        }));
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error("Error loading data from Supabase:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleScroll = (source: 'en' | 'comp') => {
    const src = source === 'en' ? enScrollRef.current : compScrollRef.current;
    const dest = source === 'en' ? compScrollRef.current : enScrollRef.current;
    if (!src || !dest) return;

    if (isScrollingRef.current && isScrollingRef.current !== source) return;

    isScrollingRef.current = source;
    dest.scrollTop = src.scrollTop;

    if ((window as any).scrollSyncTimeout) {
      clearTimeout((window as any).scrollSyncTimeout);
    }
    (window as any).scrollSyncTimeout = setTimeout(() => {
      isScrollingRef.current = null;
    }, 150);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setFileContent(text);
      };
      reader.readAsText(file);
    } else {
      setFileContent('');
    }
  };

  // Dynamically load pdf.js from CDN
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  // Extract text and render pages to canvas image data URLs (JPEG format)
  const parsePdfFile = async (file: File): Promise<{ text: string; images: string[] }> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const images: string[] = [];
    
    // Process up to 10 pages to keep requests fast and within token limits
    const numPages = Math.min(pdf.numPages, 10);
    console.log(`[Frontend] Parsing PDF: ${pdf.numPages} pages found. Processing first ${numPages} pages...`);
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n--- Page ${i} ---\n` + pageText;
      
      // Render to canvas
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
        images.push(imgData);
      }
    }
    
    return { text: fullText, images };
  };

  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  const handleStartIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle) return;
    setIsIngesting(true);
    setIngestionStep(1);

    try {
      let extractedText = '';
      let pageImages: string[] = [];

      if (selectedFile) {
        if (selectedFile.name.endsWith('.pdf')) {
          console.log("[Frontend] Rendering PDF pages to canvas and extracting text...");
          const parsed = await parsePdfFile(selectedFile);
          extractedText = parsed.text;
          pageImages = parsed.images;
        } else if (selectedFile.name.endsWith('.txt')) {
          extractedText = fileContent;
        }
      } else if (fileContent || rawTextPaste) {
        extractedText = fileContent || rawTextPaste;
      } else {
        alert("Please select a PDF/TXT file or paste raw handbook text.");
        setIsIngesting(false);
        setIngestionStep(0);
        return;
      }

      setIngestionStep(2);
      console.log("[Ingestion] Launching concurrent Multimodal Ingestion pipelines via OpenRouter...");

      const model = 'openrouter/free';

      // Build the message contents array containing the prompt text and images
      const chapterContent: any[] = [
        {
          type: 'text',
          text: 'Analyze the attached driving handbook pages (shown as images below) and the extracted text. Read all the text, tables, and visually describe all road signs, traffic rules, and lane layouts in complete detail. Include a practical, real-life driving scenario/example for better user understanding within each subtopic content. Translate all descriptive sections into 4 language blocks: en, ja, zh, and pt. Keep numerical limits exact. Output a single structured JSON object matching this schema: {"title": "Handbook Overview", "description": "Overview description", "subtopics": [{"title": {"en": "", "ja": "", "zh": "", "pt": ""}, "content": {"en": "", "ja": "", "zh": "", "pt": ""}}]}' + (extractedText ? `\n\nExtracted Text:\n${extractedText}` : '')
        }
      ];

      const quizContent: any[] = [
        {
          type: 'text',
          text: 'Analyze the attached driving handbook pages (shown as images below) and the extracted text. Generate exactly 8 multilingual multiple choice questions (MCQs) testing rules, signs, and driving regulations. Every question, option array string, and explanation field must be fully localized into en, ja, zh, and pt. Output a single JSON object matching this schema: {"questions": [{"question": {"en": "", "ja": "", "zh": "", "pt": ""}, "options": [{"en": "", "ja": "", "zh": "", "pt": ""}], "correctOptionIndex": 0, "explanation": {"en": "", "ja": "", "zh": "", "pt": ""}}]}' + (extractedText ? `\n\nExtracted Text:\n${extractedText}` : '')
        }
      ];

      // Attach page images as standard image_url structures
      pageImages.forEach((imgBase64) => {
        const imageElement = {
          type: 'image_url',
          image_url: {
            url: imgBase64
          }
        };
        chapterContent.push(imageElement);
        quizContent.push(imageElement);
      });

      const chapterPromise = fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', 
          'X-Title': 'Auto-Mod-AR Ingestion'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 8000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: 'user',
              content: chapterContent
            }
          ]
        })
      });

      setIngestionStep(3);
      const quizPromise = fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', 
          'X-Title': 'Auto-Mod-AR Ingestion'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 8000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: 'user',
              content: quizContent
            }
          ]
        })
      });

      setIngestionStep(4);
      const [chapterRes, quizRes] = await Promise.all([chapterPromise, quizPromise]);

      if (chapterRes.status === 429 || quizRes.status === 429) {
        console.warn('[Rate Limit] Throttled. Waiting 30 seconds...');
        alert('Rate limit hit. Please try again in 1 minute.');
        setIsIngesting(false);
        setIngestionStep(0);
        return;
      }

      if (!chapterRes.ok || !quizRes.ok) {
        const chErr = !chapterRes.ok ? await chapterRes.text() : '';
        const qErr = !quizRes.ok ? await quizRes.text() : '';
        throw new Error(`OpenRouter connection error.\nChapter: ${chapterRes.status} (${chErr})\nQuiz: ${quizRes.status} (${qErr})`);
      }

      const chapterData = await chapterRes.json();
      const quizData = await quizRes.json();

      const synthesisData = cleanAndParseJSON(chapterData.choices[0].message.content);
      const quizQuestionsObject = cleanAndParseJSON(quizData.choices[0].message.content);

      setIngestionStep(5);

      const book_id = `book_${Math.random().toString(36).substr(2, 7)}`;
      const books_payload = [{
        id: book_id,
        title: { en: newBookTitle, ja: newBookTitle, zh: newBookTitle, pt: newBookTitle },
        description: {
          en: synthesisData.description || `Study guide for ${newBookTitle}`,
          ja: `${newBookTitle}の学習ガイド`,
          zh: `${newBookTitle}的学习指南`,
          pt: `Guia de estudo para ${newBookTitle}`
        },
        icon: "car-sport-outline"
      }];

      const chapters_payload: any[] = [];
      const subtopics_payload: any[] = [];

      (synthesisData.subtopics || []).forEach((sub: any, idx: number) => {
        const chapter_id = `ch_${Date.now()}_${idx}`;
        chapters_payload.push({
          id: chapter_id,
          book_id: book_id,
          title: sub.title || { en: `Chapter ${idx + 1}` },
          order_num: idx + 1
        });
        subtopics_payload.push({
          id: `sub_${Date.now()}_${idx}`,
          chapter_id: chapter_id,
          title: sub.title || { en: `Chapter ${idx + 1}` },
          content: sub.content || { en: "" },
          order_num: 1
        });
      });

      const questions_payload = (quizQuestionsObject.questions || []).map((q: any, idx: number) => {
        const correctIdx = q.correctOptionIndex || 0;
        const options_mapped = (q.options || []).map((opt: any, oIdx: number) => ({
          text: opt,
          isCorrect: oIdx === correctIdx
        }));
        const chCount = chapters_payload.length;
        const linkedChapterId = chCount > 0 ? chapters_payload[idx % chCount].id : null;
        return {
          id: `q_${Date.now()}_${idx}`,
          book_id: book_id,
          category: "Rules of the Road",
          difficulty: "medium",
          text: q.question,
          options: options_mapped,
          explanation: q.explanation
        };
      });

      console.log("[Ingestion] Invoking Supabase edge function to load mapped data packages...");
      
      const { error: invokeError } = await supabase.functions.invoke('ingest-book', {
        body: {
          books: books_payload,
          chapters: chapters_payload,
          subtopics: subtopics_payload,
          questions: questions_payload
        }
      });

      if (invokeError) {
        throw new Error(`Edge function invocation failed: ${invokeError.message || invokeError}`);
      }

      console.log('🎉 Ingestion pipeline complete! Visual PDF elements fully processed.');

      // Update local state
      const newBook = {
        id: book_id,
        title: newBookTitle,
        chapters: chapters_payload.length || 1,
        questions: questions_payload.length || 8
      };

      setBooks(prevBooks => [...prevBooks, newBook]);
      setNewBookTitle('');
      setFileContent('');
      setRawTextPaste('');
      setSelectedFile(null);

      alert("🎉 Handbook successfully compiled and loaded!");
    } catch (apiError: any) {
      console.error('[Ingestion] Pipeline failed:', apiError);
      alert(`Ingestion failed: ${apiError.message || apiError}`);
    } finally {
      setIsIngesting(false);
      setIngestionStep(0);
    }
  };

  const handleVisualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVisualFiles(Array.from(e.target.files));
    }
  };

  const handleStartVisualIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visualBookId) {
      alert("Please select a Book to attach the images.");
      return;
    }
    if (visualFiles.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    setIsVisualIngesting(true);
    setVisualStatus("Uploading images to Supabase Storage...");
    
    const dynamicChapterId = `chap_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      const uploadedImageUrls: string[] = [];
      const imageBase64s: string[] = [];

      for (let i = 0; i < visualFiles.length; i++) {
        const file = visualFiles[i];
        
        // Convert to base64 for Gemini
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        const base64Str = await base64Promise;
        imageBase64s.push(base64Str);

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${visualBookId}/${dynamicChapterId}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('handbook-images')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('handbook-images')
          .getPublicUrl(filePath);
          
        uploadedImageUrls.push(publicUrlData.publicUrl);
      }

      setVisualStatus("Analyzing images with AI...");

      const model = 'openrouter/free';
      
      const promptContent: any[] = [
        {
          type: 'text',
          text: 'Analyze the attached pictures in high detail. First, generate a new chapter title and description that accurately describes the specific visual content shown. Then generate a detailed explanation related to these specific pictures, including a real-life driving example for better user understanding. Crucially, generate exactly 3 multilingual multiple choice questions (MCQs) that directly test the users understanding of the specific visual concepts, signs, or situations shown in the image. Do not generate generic questions; they must be tightly coupled to what is seen in the image. All text must be fully localized into en, ja, zh, and pt. Output a single JSON object matching this schema: {"chapter": {"title": {"en": "", "ja": "", "zh": "", "pt": ""}, "description": {"en": "", "ja": "", "zh": "", "pt": ""}}, "subtopic": {"title": {"en": "", "ja": "", "zh": "", "pt": ""}, "content": {"en": "", "ja": "", "zh": "", "pt": ""}}, "questions": [{"question": {"en": "", "ja": "", "zh": "", "pt": ""}, "options": [{"en": "", "ja": "", "zh": "", "pt": ""}], "correctOptionIndex": 0, "explanation": {"en": "", "ja": "", "zh": "", "pt": ""}}]}'
        }
      ];

      imageBase64s.forEach((imgBase64) => {
        promptContent.push({
          type: 'image_url',
          image_url: { url: imgBase64 }
        });
      });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:8081',
          'X-Title': 'NCS Admin'
        },
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          messages: [{ role: 'user', content: promptContent }],
          response_format: { type: 'json_object' },
        })
      });

      if (!response.ok) throw new Error(`OpenRouter API error: ${response.statusText}`);
      
      const result = await response.json();
      const contentStr = result.choices[0].message.content || '{}';
      
      let parsedData;
      try {
        parsedData = cleanAndParseJSON(contentStr);
      } catch (err: any) {
        throw new Error(`AI returned malformed JSON: ${err.message}`);
      }

      setVisualStatus("Saving generated content to database...");

      // 0. Insert Chapter
      if (parsedData.chapter) {
        const { data: existingChapters } = await supabase.from('chapters')
          .select('order_num')
          .eq('book_id', visualBookId)
          .order('order_num', { ascending: false })
          .limit(1);
          
        const chapterOrder = (existingChapters && existingChapters.length > 0) ? (existingChapters[0].order_num + 1) : 1;

        const { error: chapterError } = await supabase.from('chapters').insert({
          id: dynamicChapterId,
          book_id: visualBookId,
          title: parsedData.chapter.title,
          order_num: chapterOrder
        });
        if (chapterError) throw chapterError;
      }

      // 1. Insert subtopic
      if (parsedData.subtopic) {
        const enhancedContent = Object.keys(parsedData.subtopic.content).reduce((acc: any, key) => {
          acc[key] = parsedData.subtopic.content[key] + `\n\n![Visual Context](${uploadedImageUrls[0]})`;
          return acc;
        }, {});

        const { error: subtopicError } = await supabase.from('subtopics').insert({
          id: `sub_${Math.random().toString(36).substring(2, 11)}`,
          chapter_id: dynamicChapterId,
          title: parsedData.subtopic.title,
          content: enhancedContent,
          order_num: 1 // First subtopic in this dynamically created chapter
        });
        if (subtopicError) throw subtopicError;
      }

      // 2. Insert questions
      if (parsedData.questions && parsedData.questions.length > 0) {
        const questionsToInsert = parsedData.questions.map((q: any) => {
          const enhancedText = Object.keys(q.question).reduce((acc: any, key) => {
            acc[key] = q.question[key] + `\n\n![Visual Context](${uploadedImageUrls[0]})`;
            return acc;
          }, {});

          return {
            id: `q_${Math.random().toString(36).substring(2, 11)}`,
            book_id: visualBookId,
            category: 'Visual Quiz',
            difficulty: 'medium',
            text: enhancedText,
            options: q.options.map((opt: any, idx: number) => ({
              text: opt,
              isCorrect: idx === q.correctOptionIndex
            })),
            explanation: q.explanation
          };
        });

        const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert);
        if (questionsError) throw questionsError;
      }

      alert("🎉 Visual ingestion completed successfully!");
      setVisualFiles([]);
      fetchData(); // refresh dashboard
    } catch (error: any) {
      console.error("[Visual Ingestion Error]", error);
      alert(`Visual Ingestion failed: ${error.message}`);
    } finally {
      setIsVisualIngesting(false);
      setVisualStatus('');
    }
  };

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form states for adding new items
  const [newCategory, setNewCategory] = useState('Signals');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [newQTextEn, setNewQTextEn] = useState('');
  const [newQTextJa, setNewQTextJa] = useState('');
  const [newExplEn, setNewExplEn] = useState('');
  const [newExplJa, setNewExplJa] = useState('');

  const [newChapterTitleEn, setNewChapterTitleEn] = useState('');
  const [newChapterTitleJa, setNewChapterTitleJa] = useState('');

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQTextEn || !newQTextJa || !newQBookId) {
      alert("Please fill in question text and select a book.");
      return;
    }

    try {
      const questionId = `q_${Date.now()}`;
      const { error } = await supabase
        .from('questions')
        .insert({
          id: questionId,
          book_id: newQBookId,
          category: newCategory,
          difficulty: newDifficulty,
          text: { 
            en: newQTextEn, 
            ja: newQTextJa, 
            zh: newQTextEn + ' (ZH)', 
            pt: newQTextEn + ' (PT)' 
          },
          options: [
            { text: { en: "Option A", ja: "選択肢A", zh: "选项A", pt: "Opção A" }, isCorrect: true },
            { text: { en: "Option B", ja: "選択肢B", zh: "选项B", pt: "Opção B" }, isCorrect: false },
            { text: { en: "Option C", ja: "選択肢C", zh: "选项C", pt: "Opção C" }, isCorrect: false },
            { text: { en: "Option D", ja: "選択肢D", zh: "选项D", pt: "Opção D" }, isCorrect: false }
          ],
          explanation: { 
            en: newExplEn || "Default Explanation", 
            ja: newExplJa || "デフォルトの解説", 
            zh: (newExplEn || "Default Explanation") + ' (ZH)', 
            pt: (newExplEn || "Default Explanation") + ' (PT)' 
          }
        });
      if (error) throw error;

      setNewQTextEn('');
      setNewQTextJa('');
      setNewExplEn('');
      setNewExplJa('');
      fetchData();
      alert("Question added successfully!");
    } catch (err: any) {
      alert("Failed to add question: " + err.message);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitleEn || !newChapterTitleJa || !newChapterBookId) {
      alert("Please enter chapter title and select a book.");
      return;
    }

    try {
      const chapterId = `ch_${Date.now()}`;
      const { error } = await supabase
        .from('chapters')
        .insert({
          id: chapterId,
          book_id: newChapterBookId,
          title: { 
            en: newChapterTitleEn, 
            ja: newChapterTitleJa, 
            zh: newChapterTitleEn + ' (ZH)', 
            pt: newChapterTitleEn + ' (PT)' 
          },
          order_num: chapters.filter(c => c.book_id === newChapterBookId).length + 1
        });
      if (error) throw error;

      // Add a default subtopic for study flow
      await supabase
        .from('subtopics')
        .insert({
          id: `sub_${Date.now()}`,
          chapter_id: chapterId,
          title: { 
            en: newChapterTitleEn, 
            ja: newChapterTitleJa, 
            zh: newChapterTitleEn + ' (ZH)', 
            pt: newChapterTitleEn + ' (PT)' 
          },
          content: {
            en: "Study content placeholder.",
            ja: "学習コンテンツのプレースホルダー。",
            zh: "学习内容占位符。",
            pt: "Espaço reservado para conteúdo de estudo."
          },
          order_num: 1
        });

      setNewChapterTitleEn('');
      setNewChapterTitleJa('');
      fetchData();
      alert("Chapter added successfully!");
    } catch (err: any) {
      alert("Failed to add chapter: " + err.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this question from the database?");
    if (!confirmDelete) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Failed to delete question: " + err.message);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chapter and all its subtopics from the database?");
    if (!confirmDelete) return;
    try {
      // 1. Delete subtopics
      const { error: subtopicError } = await supabase.from('subtopics').delete().eq('chapter_id', id);
      if (subtopicError) throw subtopicError;
      
      // 2. Delete chapter
      const { error: chapterError } = await supabase.from('chapters').delete().eq('id', id);
      if (chapterError) throw chapterError;
      
      fetchData();
    } catch (err: any) {
      alert("Failed to delete chapter: " + err.message);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this book? This will permanently remove the book, all its chapters, subtopics, questions, explanations, and all translations from the database."
    );
    if (!confirmDelete) return;

    try {
      // 1. Fetch chapters
      const { data: bookChapters, error: fetchChError } = await supabase
        .from('chapters')
        .select('id')
        .eq('book_id', bookId);
      if (fetchChError) throw fetchChError;

      const chapterIds = (bookChapters || []).map(c => c.id);

      // 2. Delete subtopics
      if (chapterIds.length > 0) {
        const { error: deleteSubError } = await supabase
          .from('subtopics')
          .delete()
          .in('chapter_id', chapterIds);
        if (deleteSubError) throw deleteSubError;
      }

      // 3. Delete chapters
      const { error: deleteChError } = await supabase
        .from('chapters')
        .delete()
        .eq('book_id', bookId);
      if (deleteChError) throw deleteChError;

      // 4. Delete questions
      const { error: deleteQError } = await supabase
        .from('questions')
        .delete()
        .eq('book_id', bookId);
      if (deleteQError) throw deleteQError;

      // 5. Delete the book
      const { error: deleteBookError } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);
      if (deleteBookError) throw deleteBookError;

      alert("Book and all associated content successfully deleted from database.");
      fetchData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Login view rendering
  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <div style={styles.logoBadge}>NCS</div>
          <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 800 }}>Admin Login</h2>
          <p style={{ color: '#B0B0B0', fontSize: 14, marginBottom: 24 }}>New Sunshine Driving Academy Console</p>
          
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} style={styles.form}>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input} 
              required 
            />
            <button type="submit" style={styles.loginBtn}>Sign In to Console</button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard layout rendering
  return (
    <div style={styles.adminWrapper}>
      {/* Sidebar Navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoBadgeSmall}>NCS</div>
          <span style={styles.sidebarBrand}>NCS Admin</span>
        </div>

        <nav style={styles.nav}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{...styles.navItem, ...(activeTab === 'dashboard' && styles.navItemActive)}}
          >
            <BarChart size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('questions')} 
            style={{...styles.navItem, ...(activeTab === 'questions' && styles.navItemActive)}}
          >
            <HelpCircle size={18} />
            <span>Question Bank</span>
          </button>

          <button 
            onClick={() => setActiveTab('chapters')} 
            style={{...styles.navItem, ...(activeTab === 'chapters' && styles.navItemActive)}}
          >
            <BookOpen size={18} />
            <span>Chapters Editor</span>
          </button>

          <button 
            onClick={() => setActiveTab('ingestion')} 
            style={{...styles.navItem, ...(activeTab === 'ingestion' && styles.navItemActive)}}
          >
            <Globe size={18} />
            <span>AI Ingestion Pipeline</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')} 
            style={{...styles.navItem, ...(activeTab === 'users' && styles.navItemActive)}}
          >
            <Users size={18} />
            <span>User Management</span>
          </button>
        </nav>

        <button onClick={() => setIsLoggedIn(false)} style={styles.logoutButton}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Body Contents */}
      <main style={styles.mainContent}>
        {/* Render: Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={styles.pageTitle}>Dashboard Overview</h1>
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <Users size={24} color="#E31837" />
                <h3 style={styles.metricVal}>{users.length}</h3>
                <p style={styles.metricLbl}>Total Enrolled Users</p>
              </div>

              <div style={styles.metricCard}>
                <HelpCircle size={24} color="#00C853" />
                <h3 style={styles.metricVal}>{questions.length}</h3>
                <p style={styles.metricLbl}>Active Questions</p>
              </div>

              <div style={styles.metricCard}>
                <BookOpen size={24} color="#FFB300" />
                <h3 style={styles.metricVal}>{chapters.length}</h3>
                <p style={styles.metricLbl}>Handbook Chapters</p>
              </div>
            </div>

            {/* Demographics Card */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Enrolled Language Distribution</h2>
              <div style={styles.barList}>
                {(() => {
                  const total = users.length || 1;
                  const getPercent = (lang: string) => Math.round((users.filter(u => u.language === lang).length / total) * 100);
                  const langs = [
                    { label: 'English', code: 'en' },
                    { label: 'Japanese', code: 'ja' },
                    { label: 'Chinese', code: 'zh' },
                    { label: 'Portuguese', code: 'pt' }
                  ];
                  return langs.map(l => {
                    const percent = getPercent(l.code);
                    return (
                      <div key={l.code} style={styles.barRow}>
                        <span style={styles.barLabel}>{l.label}</span>
                        <div style={styles.barBg}><div style={{...styles.barFill, width: `${percent}%`}} /></div>
                        <span style={styles.barValue}>{percent}%</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Render: Questions Manager */}
        {activeTab === 'questions' && (
          <div>
            <h1 style={styles.pageTitle}>Question Bank Manager</h1>

            {/* Add question form */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Add New Question</h2>
              <form onSubmit={handleAddQuestion} style={styles.crudForm}>
                <div style={styles.formRow}>
                  <select 
                    value={newQBookId} 
                    onChange={(e) => setNewQBookId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    <option value="">-- Choose Target Book --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>{renderLocalized(b.title)}</option>
                    ))}
                  </select>

                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={styles.select}
                  >
                    <option value="Signals">Signals</option>
                    <option value="General Rules">General Rules</option>
                    <option value="Speed Limits">Speed Limits</option>
                  </select>

                  <select 
                    value={newDifficulty} 
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    style={styles.select}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <input 
                  type="text" 
                  placeholder="Question Text (English)" 
                  value={newQTextEn}
                  onChange={(e) => setNewQTextEn(e.target.value)}
                  style={styles.input} 
                  required
                />
                <input 
                  type="text" 
                  placeholder="Question Text (Japanese)" 
                  value={newQTextJa}
                  onChange={(e) => setNewQTextJa(e.target.value)}
                  style={styles.input} 
                  required
                />

                <textarea 
                  placeholder="Explanation (English)" 
                  value={newExplEn}
                  onChange={(e) => setNewExplEn(e.target.value)}
                  style={styles.textarea}
                />
                <textarea 
                  placeholder="Explanation (Japanese)" 
                  value={newExplJa}
                  onChange={(e) => setNewExplJa(e.target.value)}
                  style={styles.textarea}
                />

                <button type="submit" style={styles.submitBtn}>
                  <Plus size={16} />
                  <span>Add Question</span>
                </button>
              </form>
            </div>

            {/* Questions list */}
            <h2 style={styles.sectionTitle}>Active Question List</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Difficulty</th>
                    <th style={styles.th}>Question (EN)</th>
                    <th style={styles.th}>Question (JA)</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.tag}>{q.category}</span></td>
                      <td style={styles.td}><span style={{...styles.tag, color: q.difficulty === 'easy' ? '#00C853' : '#FFB300'}}>{q.difficulty}</span></td>
                      <td style={styles.td}>{q.text?.en || renderLocalized(q.text)}</td>
                      <td style={styles.td}>{q.text?.ja || renderLocalized(q.text)}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleDeleteQuestion(q.id)} style={styles.actionBtn}>
                          <Trash2 size={16} color="#FF1744" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Render: Chapters editor */}
        {activeTab === 'chapters' && (
          <div>
            <h1 style={styles.pageTitle}>Handbook Chapter Manager</h1>

            {/* Add Chapter Form */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Add New Chapter</h2>
              <form onSubmit={handleAddChapter} style={styles.crudForm}>
                <select 
                  value={newChapterBookId} 
                  onChange={(e) => setNewChapterBookId(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">-- Choose Target Book --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{renderLocalized(b.title)}</option>
                  ))}
                </select>

                <input 
                  type="text" 
                  placeholder="Chapter Title (English)" 
                  value={newChapterTitleEn}
                  onChange={(e) => setNewChapterTitleEn(e.target.value)}
                  style={styles.input} 
                  required
                />
                <input 
                  type="text" 
                  placeholder="Chapter Title (Japanese)" 
                  value={newChapterTitleJa}
                  onChange={(e) => setNewChapterTitleJa(e.target.value)}
                  style={styles.input} 
                  required
                />

                <button type="submit" style={styles.submitBtn}>
                  <Plus size={16} />
                  <span>Add Chapter</span>
                </button>
              </form>
            </div>

            {/* Chapters list */}
            <h2 style={styles.sectionTitle}>Handbook Chapters</h2>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Order</th>
                    <th style={styles.th}>Chapter Title (EN)</th>
                    <th style={styles.th}>Chapter Title (JA)</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((ch) => (
                    <tr key={ch.id} style={styles.tr}>
                      <td style={styles.td}>{ch.order}</td>
                      <td style={styles.td}>{ch.title?.en || renderLocalized(ch.title)}</td>
                      <td style={styles.td}>{ch.title?.ja || renderLocalized(ch.title)}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleDeleteChapter(ch.id)} style={styles.actionBtn}>
                          <Trash2 size={16} color="#FF1744" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Render: Ingestion Pipeline */}
        {activeTab === 'ingestion' && (
          <div>
            <h1 style={styles.pageTitle}>AI Book Ingestion & Quiz Generator</h1>
            <p style={{ color: '#B0B0B0', marginBottom: 24, fontSize: 14 }}>
              Upload driving handbooks, guidelines, or manuals. The AI will extract content, strip copyrights, translate, and generate chapter-specific quizzes.
            </p>

            <div style={styles.grid2}>
              {/* Left Form */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Ingest New Handbook</h2>
                <form onSubmit={handleStartIngestion} style={styles.crudForm}>
                  <label style={styles.fieldLabel}>Handbook Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Heavy Vehicles Special License" 
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    style={styles.input} 
                    disabled={isIngesting}
                    required
                  />

                  <label style={styles.fieldLabel}>Paste Raw Textbook Text (Alternative)</label>
                  <textarea 
                    placeholder="Pasted handbook contents here..." 
                    value={rawTextPaste}
                    onChange={(e) => setRawTextPaste(e.target.value)}
                    style={styles.textarea}
                    disabled={isIngesting}
                  />

                  <label style={styles.fieldLabel}>Select File (PDF or TXT)</label>
                  <input 
                    type="file" 
                    accept="application/pdf,text/plain"
                    onChange={handleFileChange}
                    style={styles.fileInput} 
                    disabled={isIngesting}
                  />

                  <button type="submit" style={{...styles.submitBtn, opacity: isIngesting ? 0.6 : 1}} disabled={isIngesting}>
                    <Plus size={16} />
                    <span>{isIngesting ? 'AI is Processing...' : 'Start Ingestion'}</span>
                  </button>
                </form>

                {isIngesting && (
                  <div style={styles.progressSection}>
                    <h3 style={styles.progressHeader}>AI Pipeline Status:</h3>
                    
                    <div style={styles.stepRow}>
                      {ingestionStep > 1 ? (
                        <span className="success-checkmark">✓</span>
                      ) : ingestionStep === 1 ? (
                        <span className="pulse-active">●</span>
                      ) : (
                        <span className="pending-dot">○</span>
                      )}
                      <span style={{ marginLeft: 12, color: ingestionStep === 1 ? '#FFF' : '#A0A0A0', transition: 'color 0.3s' }}>
                        Uploading source materials & stripping format...
                      </span>
                    </div>

                    <div style={styles.stepRow}>
                      {ingestionStep > 2 ? (
                        <span className="success-checkmark">✓</span>
                      ) : ingestionStep === 2 ? (
                        <span className="pulse-active">●</span>
                      ) : (
                        <span className="pending-dot">○</span>
                      )}
                      <span style={{ marginLeft: 12, color: ingestionStep === 2 ? '#FFF' : '#A0A0A0', transition: 'color 0.3s' }}>
                        AI Content Synthesis (stripping copyrights)...
                      </span>
                    </div>

                    <div style={styles.stepRow}>
                      {ingestionStep > 3 ? (
                        <span className="success-checkmark">✓</span>
                      ) : ingestionStep === 3 ? (
                        <span className="pulse-active">●</span>
                      ) : (
                        <span className="pending-dot">○</span>
                      )}
                      <span style={{ marginLeft: 12, color: ingestionStep === 3 ? '#FFF' : '#A0A0A0', transition: 'color 0.3s' }}>
                        Multilingual translation (EN, JA, ZH, PT)...
                      </span>
                    </div>

                    <div style={styles.stepRow}>
                      {ingestionStep > 4 ? (
                        <span className="success-checkmark">✓</span>
                      ) : ingestionStep === 4 ? (
                        <span className="pulse-active">●</span>
                      ) : (
                        <span className="pending-dot">○</span>
                      )}
                      <span style={{ marginLeft: 12, color: ingestionStep === 4 ? '#FFF' : '#A0A0A0', transition: 'color 0.3s' }}>
                        Generating questions & explanations with LLM...
                      </span>
                    </div>

                    <div style={styles.stepRow}>
                      {ingestionStep > 5 ? (
                        <span className="success-checkmark">✓</span>
                      ) : ingestionStep === 5 ? (
                        <span className="pulse-active">●</span>
                      ) : (
                        <span className="pending-dot">○</span>
                      )}
                      <span style={{ marginLeft: 12, color: ingestionStep === 5 ? '#FFF' : '#A0A0A0', transition: 'color 0.3s' }}>
                        Uploading generated content & quiz bank to database...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right List */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Ingested Handbooks ({books.length})</h2>
                <div style={styles.booksList}>
                  {books.map(b => (
                    <div key={b.id} style={styles.bookListItem}>
                      <div style={styles.bookListInfo}>
                        <h4 style={styles.bookListTitle}>{renderLocalized(b.title)}</h4>
                        <p style={styles.bookListSub}>
                          Chapters: {b.chapters} | Generated Quiz Pool: {b.questions} questions
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={styles.activeTag}>Active</span>
                        <button 
                          onClick={() => handleDeleteBook(b.id)} 
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Delete Book and all associated content"
                        >
                          <Trash2 size={16} color="#FF1744" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual AI Ingestion Form */}
            <div style={{ ...styles.card, marginTop: '24px' }}>
              <h2 style={styles.cardTitle}>Visual AI Ingestion (Upload Pictures)</h2>
              <p style={{ color: '#B0B0B0', marginBottom: 24, fontSize: 14 }}>
                Upload images of handbook pages or specific signs. The AI will analyze them, provide a real-life explanation, and generate related quizzes.
              </p>
              <form onSubmit={handleStartVisualIngestion} style={styles.crudForm}>
                <div style={{ gap: '16px' }}>
                  <div>
                    <label style={styles.fieldLabel}>Select Book</label>
                    <select 
                      value={visualBookId} 
                      onChange={(e) => {
                        setVisualBookId(e.target.value);
                      }} 
                      style={styles.select}
                      required
                    >
                      <option value="">-- Choose a Book --</option>
                      {books.map(b => (
                        <option key={b.id} value={b.id}>{renderLocalized(b.title)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label style={styles.fieldLabel} style={{ marginTop: '16px', display: 'block', color: '#B0B0B0', fontSize: '13px', marginBottom: '8px' }}>Upload Images (Multiple Allowed)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleVisualFileChange}
                  style={styles.fileInput} 
                  disabled={isVisualIngesting}
                  required
                />

                {visualFiles.length > 0 && (
                  <p style={{ color: '#FFF', fontSize: 14, marginTop: 8 }}>
                    {visualFiles.length} image(s) selected
                  </p>
                )}

                <button type="submit" style={{...styles.submitBtn, marginTop: '24px', opacity: isVisualIngesting ? 0.6 : 1}} disabled={isVisualIngesting}>
                  <Plus size={16} />
                  <span>{isVisualIngesting ? 'AI is Processing Images...' : 'Start Visual Ingestion'}</span>
                </button>
              </form>

              {isVisualIngesting && visualStatus && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#1A1A1A', borderRadius: '8px' }}>
                  <p style={{ color: '#00E676', margin: 0, fontWeight: 'bold' }}>{visualStatus}</p>
                </div>
              )}
            </div>

            {/* Translated Output Review Box */}
            {/* Translated Output Review Box */}
            {generatedSubtopics && generatedSubtopics.length > 0 && (
              <div style={{...styles.card, marginTop: '24px', width: '100%'}}>
                <h2 style={styles.cardTitle}>✨ AI Copyright-Free Synthesis & Translation Review</h2>
                <p style={{ color: '#B0B0B0', fontSize: '13px', marginBottom: '20px' }}>
                  Verify that the meaning of rules, numbers, and limitations remains identical across translations. Use matched scrolls to view side-by-side.
                </p>

                {/* Comparison Selector Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    onClick={() => setCompareLang('ja')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: compareLang === 'ja' ? '#E31837' : '#1A1A1A',
                      color: '#FFF',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    Compare with Japanese (🇯🇵)
                  </button>
                  <button 
                    onClick={() => setCompareLang('zh')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: compareLang === 'zh' ? '#E31837' : '#1A1A1A',
                      color: '#FFF',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    Compare with Chinese (🇨🇳)
                  </button>
                  <button 
                    onClick={() => setCompareLang('pt')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: compareLang === 'pt' ? '#E31837' : '#1A1A1A',
                      color: '#FFF',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    Compare with Portuguese (🇧🇷)
                  </button>
                </div>

                {/* Dual-Pane matched scroll-binding structure */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '480px' }}>
                  {/* Left Column: English */}
                  <div 
                    ref={enScrollRef}
                    onScroll={() => handleScroll('en')}
                    style={{ overflowY: 'auto', height: '100%', paddingRight: '12px', borderRight: '1px solid #2A2A2A' }}
                  >
                    <strong style={{ color: '#E31837', fontSize: '13px', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>ENGLISH (🇬🇧)</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {generatedSubtopics.map((sub, sIdx) => (
                        <div 
                          key={sIdx}
                          onMouseEnter={() => setHoveredIdx(sIdx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          style={{
                            padding: '16px',
                            backgroundColor: '#121212',
                            borderRadius: '8px',
                            border: hoveredIdx === sIdx ? '1px solid #E31837' : '1px solid #2A2A2A',
                            boxShadow: hoveredIdx === sIdx ? '0 0 12px rgba(227, 24, 55, 0.25)' : 'none',
                            transition: 'all 0.2s ease-in-out',
                            cursor: 'pointer'
                          }}
                        >
                          <h4 style={{ margin: '0 0 8px 0', color: '#FFF', fontSize: '15px' }}>{sub.title.en}</h4>
                          <div style={{ color: '#DDD', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{sub.content.en}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Comparative Language (JA, ZH, PT) */}
                  <div 
                    ref={compScrollRef}
                    onScroll={() => handleScroll('comp')}
                    style={{ overflowY: 'auto', height: '100%', paddingLeft: '4px' }}
                  >
                    <strong style={{ 
                      color: compareLang === 'ja' ? '#00C853' : compareLang === 'zh' ? '#FFB300' : '#29B6F6', 
                      fontSize: '13px', 
                      display: 'block', 
                      marginBottom: '12px', 
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      {compareLang === 'ja' ? 'Japanese (🇯🇵)' : compareLang === 'zh' ? 'Chinese (🇨🇳)' : 'Portuguese (🇧🇷)'}
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {generatedSubtopics.map((sub, sIdx) => (
                        <div 
                          key={sIdx}
                          onMouseEnter={() => setHoveredIdx(sIdx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          style={{
                            padding: '16px',
                            backgroundColor: '#121212',
                            borderRadius: '8px',
                            border: hoveredIdx === sIdx ? '1px solid #E31837' : '1px solid #2A2A2A',
                            boxShadow: hoveredIdx === sIdx ? '0 0 12px rgba(227, 24, 55, 0.25)' : 'none',
                            transition: 'all 0.2s ease-in-out',
                            cursor: 'pointer'
                          }}
                        >
                          <h4 style={{ margin: '0 0 8px 0', color: '#FFF', fontSize: '15px' }}>{sub.title[compareLang as 'ja'|'zh'|'pt']}</h4>
                          <div style={{ color: '#DDD', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{sub.content[compareLang as 'ja'|'zh'|'pt']}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Render: User Management */}
        {activeTab === 'users' && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={{ ...styles.pageTitle, marginBottom: '8px' }}>User Management</h2>
                <p style={{ color: '#A0A0A0', fontSize: '14px', margin: 0 }}>
                  Track learner engagement, streaks, and platform activity.
                </p>
              </div>
            </div>

            <div style={{ ...styles.card, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#A0A0A0' }}>Display Name</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#A0A0A0' }}>Virtual Email</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#A0A0A0' }}>Current Streak</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#A0A0A0' }}>Longest Streak</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#A0A0A0' }}>Created At</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#A0A0A0' }}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#A0A0A0' }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #222', backgroundColor: idx % 2 === 0 ? '#1A1A1A' : 'transparent' }}>
                        <td style={{ padding: '16px' }}>{user.displayName}</td>
                        <td style={{ padding: '16px', color: '#A0A0A0' }}>{user.email}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            backgroundColor: user.streakCurrent > 0 ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: user.streakCurrent > 0 ? '#00C853' : '#FFF'
                          }}>
                            {user.streakCurrent} {user.streakCurrent === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>{user.streakLongest} days</td>
                        <td style={{ padding: '16px', color: '#A0A0A0' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '16px', color: '#A0A0A0' }}>{new Date(user.lastActive).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sidebar visual theme inline CSS
const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D'
  },
  loginBox: {
    backgroundColor: '#1A1A1A',
    padding: '40px',
    borderRadius: '16px',
    width: '380px',
    textAlign: 'center',
    border: '1px solid #2A2A2A',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    backgroundColor: '#E31837',
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: '900',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px'
  },
  logoBadgeSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#E31837',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '900',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    backgroundColor: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  textarea: {
    backgroundColor: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    minHeight: '80px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  select: {
    backgroundColor: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: '15px',
    outline: 'none',
    flex: 1
  },
  loginBtn: {
    backgroundColor: '#E31837',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.2s'
  },
  adminWrapper: {
    display: 'flex',
    minHeight: '100vh'
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#1A1A1A',
    borderRight: '1px solid #2A2A2A',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '40px'
  },
  sidebarBrand: {
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '0.5px'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#B0B0B0',
    fontSize: '15px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%'
  },
  navItemActive: {
    backgroundColor: '#2A2A2A',
    color: '#E31837'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#FF1744',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    marginTop: 'auto',
    width: '100%'
  },
  mainContent: {
    flex: 1,
    padding: '40px',
    backgroundColor: '#0D0D0D',
    overflowY: 'auto'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '32px'
  },
  metricsGrid: {
    display: 'flex',
    gap: '24px',
    marginBottom: '32px'
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  metricVal: {
    fontSize: '32px',
    fontWeight: '800',
    margin: 0
  },
  metricLbl: {
    color: '#B0B0B0',
    fontSize: '14px',
    margin: 0
  },
  card: {
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '20px',
    margin: 0
  },
  barList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  barLabel: {
    width: '120px',
    fontSize: '14px',
    fontWeight: '600'
  },
  barBg: {
    flex: 1,
    height: '10px',
    backgroundColor: '#2A2A2A',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#E31837',
    borderRadius: '5px'
  },
  barValue: {
    width: '40px',
    fontSize: '14px',
    fontWeight: '700',
    textAlign: 'right'
  },
  crudForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#E31837',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '16px'
  },
  tableCard: {
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    backgroundColor: '#2A2A2A'
  },
  th: {
    padding: '16px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#B0B0B0'
  },
  tr: {
    borderBottom: '1px solid #2A2A2A'
  },
  td: {
    padding: '16px',
    fontSize: '14px'
  },
  tag: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'start'
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#B0B0B0',
    marginTop: '16px',
    marginBottom: '6px'
  },
  fileInput: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: '#121212',
    border: '1px dashed #2A2A2A',
    borderRadius: '8px',
    color: '#FFF',
    fontSize: '14px',
    marginBottom: '20px',
    boxSizing: 'border-box'
  },
  progressSection: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #2A2A2A'
  },
  progressHeader: {
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: '14px',
    color: '#E31837',
    margin: 0
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '14px'
  },
  booksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  bookListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#121212',
    border: '1px solid #2A2A2A',
    borderRadius: '8px'
  },
  bookListInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  bookListTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#FFF',
    margin: 0
  },
  bookListSub: {
    fontSize: '12px',
    color: '#888',
    margin: 0
  },
  activeTag: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#00C853',
    backgroundColor: 'rgba(0,200,83,0.1)',
    padding: '4px 8px',
    borderRadius: '4px'
  }
};
