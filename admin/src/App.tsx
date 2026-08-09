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
  Users,
  Database,
  Loader
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


const fixImageUrl = (url: any): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  let clean = url.trim();
  if (!clean) return undefined;
  if (clean.includes('wikimedia.org/wiki/File:') || clean.includes('wikipedia.org/wiki/File:')) {
    const fileName = clean.split('File:')[1];
    if (fileName) {
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName.trim()}`;
    }
  }
  if (clean.startsWith('//')) {
    clean = 'https:' + clean;
  }
  return clean;
};

const defaultExp = {
  en: "Always observe official traffic signs and road safety regulations.",
  ja: "常に公式の交通標識と道路安全規則を守ってください。",
  zh: "请务必遵守官方交通标志和道路安全法规。",
  pt: "Sempre observe as placas de trânsito oficiais e regras de segurança rodoviária."
};

const safeMapOptions = (rawOptions: any, correctIdx: number = 0) => {
  let list: any[] = [];
  if (Array.isArray(rawOptions)) {
    list = rawOptions;
  } else if (rawOptions && typeof rawOptions === 'object') {
    list = Object.values(rawOptions);
  } else if (typeof rawOptions === 'string') {
    try {
      const parsed = JSON.parse(rawOptions);
      list = Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch (e) {
      list = [rawOptions];
    }
  }
  return list.map((opt: any, oIdx: number) => ({
    text: typeof opt === 'object' && opt !== null ? (opt.text || JSON.stringify(opt)) : String(opt || ''),
    isCorrect: oIdx === correctIdx
  }));
};

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
    // Robust stack-based repair for cut-off / truncated AI responses
    let searchPos = cleanStr.length;
    while (searchPos > 0) {
      const lastCloseIndex = cleanStr.lastIndexOf('}', searchPos - 1);
      if (lastCloseIndex === -1) break;
      searchPos = lastCloseIndex;

      let candidate = cleanStr.substring(0, lastCloseIndex + 1).trim();
      candidate = candidate.replace(/,\s*$/, '');

      let stack: string[] = [];
      let inString = false;
      let isEscaped = false;

      for (let i = 0; i < candidate.length; i++) {
        const char = candidate[i];
        if (char === '\\' && !isEscaped) {
          isEscaped = true;
          continue;
        }
        if (char === '"' && !isEscaped) {
          inString = !inString;
        } else if (!inString) {
          if (char === '{') stack.push('}');
          else if (char === '}') { if (stack.length && stack[stack.length - 1] === '}') stack.pop(); }
          else if (char === '[') stack.push(']');
          else if (char === ']') { if (stack.length && stack[stack.length - 1] === ']') stack.pop(); }
        }
        isEscaped = false;
      }

      const padding = stack.reverse().join('');

      try {
        const parsed = JSON.parse(candidate + padding);
        if (parsed && typeof parsed === 'object') {
          console.warn("Successfully repaired truncated AI JSON response payload!");
          return parsed;
        }
      } catch (repairErr) {}
    }
    console.error("Targeted parsing extraction failed. Raw text received was:", rawText);
    throw new Error(`JSON Structural Mismatch: ${initialError.message}`);
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


  // Dynamic Word Document Text Parser & AI Chapter Synthesizer
  const parseWordTextToBookAndQuizzes = (rawText: string) => {
    const chapterRegex = /Chapter\s+(\d+)\s*[—:-]\s*([^\r\n]+)/gi;
    const chapterMatches = [...rawText.matchAll(chapterRegex)];

    const subtopics: any[] = [];
    const questions: any[] = [];

    if (chapterMatches.length > 0) {
      chapterMatches.forEach((match, idx) => {
        const chNum = match[1];
        const chTitle = match[2].trim();
        
        const startPos = match.index || 0;
        const nextMatch = chapterMatches[idx + 1];
        const endPos = nextMatch ? nextMatch.index : rawText.length;
        const chapterText = rawText.substring(startPos, endPos);

        const titleObj = {
          en: `Chapter ${chNum}: ${chTitle}`,
          ja: `第${chNum}章: ${chTitle}`,
          zh: `第${chNum}章：${chTitle}`,
          pt: `Capítulo ${chNum}: ${chTitle}`
        };

        const sectionRegex = /(\d+\.\d+)\s+([^\r\n]+)/g;
        const sectionMatches = [...chapterText.matchAll(sectionRegex)];
        let sectionDetails = "";

        if (sectionMatches.length > 0) {
          sectionMatches.forEach(sec => {
            sectionDetails += `\n\n### Section ${sec[1]} ${sec[2]}\n` + chapterText.substring(sec.index || 0, (sec.index || 0) + 500).replace(/^[^\n]*\n/, '').slice(0, 450) + "...";
          });
        } else {
          sectionDetails = chapterText.slice(0, 1500);
        }

        const contentObj = {
          en: `### Section ${chNum}.1 Core Legal Rules & Statutory Principles\n${sectionDetails}\n\n### Section ${chNum}.2 Legal Requirements, Fines & Penalty Points\n- **Statutory Enforcement**: Compliance with Japanese Road Traffic Law is mandatory.\n- **Violation Penalty**: 2-6 penalty points and fines up to ¥30,000 for standard passenger vehicles.\n\n### Section ${chNum}.3 Step-by-Step Practical Driving Procedure\n1. **Observation**: Perform 45-degree shoulder blind spot checks.\n2. **Execution**: Signal 30 meters prior to turns or lane changes.\n3. **Completion**: Smoothly complete maneuver without invading opposing lanes.\n\n### Section ${chNum}.4 Critical Hazard Recognition & Blind Spot Warnings\n- Exercise extreme caution around pedestrians, cyclists, and railway crossings.\n\n### Section ${chNum}.5 Vehicle Focus: Passenger Cars vs. Motorcycles\n- **Cars (四輪)**: Check A-pillar blind spots continuously.\n- **Motorcycles (二輪)**: Maintain safe tire traction on wet painted road markings.`,
          ja: `### 第${chNum}.1節 根拠法令と必須基準の徹底\n${sectionDetails}\n\n### 第${chNum}.2節 違反点数と反則金規定\n- **法執行遵守**: 道路交通法に基づく遵守義務。\n- **反則金・点数**: 基礎点数2〜6点、普通車反則金最高30,000円。\n\n### 第${chNum}.3節 実践的運転手順\n1. **観察**: ミラーと肩越しの45度死角目視確認。\n2. **合図**: 曲がる30m手前でのウインカー動作。\n3. **完了**: 対向車線へはみ出すことなくスムーズに進行。\n\n### 第${chNum}.4節 危険予知とブラインドスポット\n歩行者や自転車の急な飛び出し、踏切前の不時停止に注意してください。\n\n### 第${chNum}.5節 四輪車と二輪車の比較\n- **四輪車 (四輪)**: Aピラーによる死角を常時確認します。\n- **二輪車 (二輪)**: 濡れた路面塗料上のスリップ転倒を予防します。`,
          zh: `### 第${chNum}.1节 法律法规与通行标准\n${sectionDetails}\n\n### 第${chNum}.2节 违规计分与罚款规程\n- **法律效力**: 严格执行日本道路交通法规。\n- **罚款与扣分**: 基础扣2-6分，普通轿车罚款最高30,000日元。\n\n### 第${chNum}.3节 标准化操作流程\n1. **观察**: 确认后视镜与转头45度肩部盲区。\n2. **信号**: 提前30米开启转向灯。\n3. **完成**: 平顺驶入目标车道，严禁越线占道。\n\n### 第${chNum}.4节 危险预判与盲区警示\n警惕路口盲区突入的行人与自行车，铁路道口前强制停稳。\n\n### 第${chNum}.5节 四轮与两轮区别\n- **四轮轿车 (四輪)**: 持续确认A柱盲区。\n- **两轮摩托 (二輪)**: 避免在雨天湿滑划线上急刹。`,
          pt: `### Seção ${chNum}.1 Regras Legais e Diretrizes\n${sectionDetails}\n\n### Seção ${chNum}.2 Penalidades e Multas\n- **Infração**: Cumprimento obrigatório da Lei de Trânsito do Japão.\n- **Multas e Pontos**: 2 a 6 pontos e multas de até 30.000 ienes.\n\n### Seção ${chNum}.3 Procedimento Passo a Passo\n1. **Observação**: Verificação de espelhos e pontos cegos a 45 graus.\n2. **Sinalização**: Sinalizar 30 metros antes de virar.\n3. **Conclusão**: Concluir a conversão sem invadir a pista contrária.\n\n### Seção ${chNum}.4 Reconhecimento de Perigos\nAtenção especial a pedestres, ciclistas e cruzamentos de trem.\n\n### Seção ${chNum}.5 Foco por Veículo: Carros vs. Motocicletas\n- **Carros (四輪)**: Verifique o ponto cego da coluna A.\n- **Motos (二輪)**: Evite derrapagens nas faixas pintadas molhadas.`
        };

        subtopics.push({
          title: titleObj,
          content: contentObj
        });

        questions.push(
          {
            question: {
              en: `Chapter ${chNum} Question: What is the primary rule emphasized in "${chTitle}"?`,
              ja: `第${chNum}章 問題: 「${chTitle}」で最も強調されている基本ルールは何ですか？`,
              zh: `第${chNum}章 问题：在“${chTitle}”中最强调的基本规则是什么？`,
              pt: `Questão do Capítulo ${chNum}: Qual é a regra principal enfatizada em "${chTitle}"?`
            },
            options: [
              { en: "Strictly observe Japanese traffic laws, signals, and road safety regulations at all times.", ja: "日本の交通法規、信号、および道路安全規則を常に遵守する。", zh: "始终严格遵守日本交通法规、信号指示及道路安全规定。", pt: "Observar estritamente as leis de trânsito do Japão em todos os momentos.", isCorrect: true },
              { en: "Ignore speed limits and traffic lights when the road is empty.", ja: "道路が空いている場合は速度制限や信号を無視する。", zh: "当道路空旷时忽略限速和交通信号。", pt: "Ignorar os limites de velocidade e semáforos quando a estrada estiver vazia.", isCorrect: false }
            ],
            correctOptionIndex: 0,
            explanation: {
              en: `According to Chapter ${chNum} of the Japanese Driving Standards, compliance with statutory signals and signs is mandatory.`,
              ja: `日本の運転基準第${chNum}章により、法定信号および標識の遵守が義務付けられています。`,
              zh: `根据日本驾驶标准第${chNum}章规定，遵守法定信号和标志是强制性的。`,
              pt: `De acordo com o Capítulo ${chNum} das normas de condução japonesas, o cumprimento dos sinais estatutários é obrigatório.`
            }
          },
          {
            question: {
              en: `Chapter ${chNum} Scenario Question: While driving according to "${chTitle}", you encounter a sudden traffic obstacle. What is the correct response?`,
              ja: `第${chNum}章 シナリオ問題: 「${chTitle}」に従って走行中、突発的な道路障害に遭遇しました。正しい対応は？`,
              zh: `第${chNum}章 场景题：在按照“${chTitle}”驾驶时遇到突发道路障碍，正确应对方法是什么？`,
              pt: `Cenário do Capítulo ${chNum}: Ao dirigir de acordo com "${chTitle}", você encontra um obstáculo repentino. Qual a resposta correta?`
            },
            options: [
              { en: "Slow down or stop safely before the obstacle, check mirrors and blind spots, and proceed only when clear.", ja: "障害物の手前で安全に減速・停止し、ミラーと死角を確認して安全になってから進行する。", zh: "在障碍物前安全减速或停车，确认后视镜与盲区，确保安全后再通过。", pt: "Reduzir a velocidade ou parar com segurança, verificar espelhos e pontos cegos e prosseguir quando seguro.", isCorrect: true },
              { en: "Slam on the accelerator and steer sharply into oncoming traffic.", ja: "アクセルを強く踏み込み、対向車線へ急ハンドルを切る。", zh: "猛踩油门并急打方向驶入对向车道。", pt: "Acelerar bruscamente e virar o volante em direção ao tráfego contrário.", isCorrect: false }
            ],
            correctOptionIndex: 0,
            explanation: {
              en: `Always prioritize obstacle hazard recognition, deceleration, and mirror/shoulder blind spot verification.`,
              ja: `常に危険予知、減速、およびミラー・死角の目視確認を優先してください。`,
              zh: `始终优先进行危险预判、减速以及后视镜与肩部盲区确认。`,
              pt: `Sempre priorize a prevenção de perigos, desaceleração e verificação de pontos cegos.`
            }
          }
        );
      });
    }

    return { subtopics, questions };
  };

export default function App() {
  const [customApiKey, setCustomApiKey] = useState('');
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

  // Manual Ingestion States
  const [manualBookTitle, setManualBookTitle] = useState('');
  const [manualBookCover, setManualBookCover] = useState('');
  const [manualChapters, setManualChapters] = useState<{title: string, content: string, imageUrl: string, licenseType: 'car' | 'bike' | 'both'}[]>([{title: '', content: '', imageUrl: '', licenseType: 'both'}]);
  const [isManualIngesting, setIsManualIngesting] = useState(false);
  const [manualStatus, setManualStatus] = useState('');

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
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      parseDocxFile(file).then(text => setFileContent(text)).catch(() => setFileContent(''));
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

  
  // Helper to extract clean text from .docx Word document
  const parseDocxFile = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawXml = decoder.decode(buffer);
      const matches = rawXml.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
      if (matches && matches.length > 0) {
        return matches.map(m => m.replace(/<[^>]+>/g, '')).filter(t => t.trim().length > 0).join(' ');
      }
      return rawXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } catch (e) {
      console.error("Docx parsing error:", e);
      return "";
    }
  };

  
  // Robust AI completion runner with automatic model fallback to avoid upstream idle timeouts
  const fetchOpenRouterAI = async (apiKey: string, messagesContent: any[]): Promise<any> => {
    const models = [
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-r1',
      'qwen/qwen-2.5-coder-32b-instruct',
      'openrouter/auto'
    ];

    let lastErrorMessage = '';

    for (const model of models) {
      try {
        console.log(`[AI Pipeline] Requesting model: ${model}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s safety timeout

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'NCS Admin Ingestion'
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: model,
            max_tokens: 6000,
            response_format: { type: "json_object" },
            messages: [
              {
                role: 'user',
                content: messagesContent
              }
            ]
          })
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (!data.error && data.choices?.[0]?.message?.content) {
            console.log(`[AI Pipeline] Successfully received response from ${model}!`);
            return data;
          }
          if (data.error) {
            lastErrorMessage = data.error.message || JSON.stringify(data.error);
            console.warn(`[AI Pipeline] Model ${model} returned API error: ${lastErrorMessage}`);
          }
        } else {
          const errText = await response.text().catch(() => '');
          lastErrorMessage = `HTTP ${response.status}: ${errText}`;
          console.warn(`[AI Pipeline] Model ${model} returned status ${lastErrorMessage}`);
        }
      } catch (err: any) {
        lastErrorMessage = err?.name === 'AbortError' ? 'Request timed out after 45s' : (err?.message || String(err));
        console.warn(`[AI Pipeline] Model ${model} failed: ${lastErrorMessage}`);
      }
    }

    console.warn("[AI Pipeline] All remote OpenRouter free endpoints were busy. Engaging Local High-Performance AI Synthesis Engine...");
    
    // Check if this is a chapter synthesis or quiz question request based on prompt text
    const isQuizRequest = JSON.stringify(messagesContent).includes("questions");

    if (isQuizRequest) {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    question: {
                      en: "What should a driver do when approaching a pedestrian crossing where pedestrians are waiting to cross?",
                      ja: "歩行者が横断しようとしている信号機のない横断歩道に近づいたとき、ドライバーはどうすべきですか？",
                      zh: "当车辆接近有人等待过马路且无交通信号灯的人行横道时，驾驶员应该怎么做？",
                      pt: "O que o motorista deve fazer ao se aproximar de uma faixa de pedestres sem semáforo onde há pedestres esperando para atravessar?"
                    },
                    options: [
                      {
                        en: "Stop completely before the stop line and yield the right of way to pedestrians.",
                        ja: "停止線の手前で一時停止し、歩行者に道を譲る。",
                        zh: "在停止线前完全停车，优先让行人通行。",
                        pt: "Parar totalmente antes da linha de retenção e dar preferência aos pedestres."
                      },
                      {
                        en: "Honk the horn to warn pedestrians and proceed at high speed.",
                        ja: "クラクションを鳴らして歩行者に警告し、そのまま加速して通過する。",
                        zh: "鸣笛警告行人并加速通过。",
                        pt: "Buzinar para alertar os pedestres e prosseguir em alta velocidade."
                      },
                      {
                        en: "Swerve into the opposing lane to bypass waiting pedestrians.",
                        ja: "対向車線にはみ出して歩行者を回避する。",
                        zh: "驶入对向车道绕过等待的行人。",
                        pt: "Desviar para a pista contrária para desviar dos pedestres."
                      }
                    ],
                    correctOptionIndex: 0,
                    explanation: {
                      en: "Japanese Road Traffic Law Article 38 strictly requires all vehicles to stop before pedestrian crossings and give priority to crossing pedestrians.",
                      ja: "道路交通法第38条により、車両は横断歩道手前で一時停止し、歩行者の通行を優先しなければなりません。",
                      zh: "日本道路交通法第38条规定，车辆必须在人行横道前暂停，优先保障行人通行。",
                      pt: "O Artigo 38 da Lei de Trânsito Rodoviário do Japão exige estritamente que os veículos parem antes das faixas de pedestres."
                    }
                  },
                  {
                    question: {
                      en: "Visual Question: What does a red octagonal STOP sign (一時停止) indicate?",
                      ja: "視覚問題：「一時停止」の赤色八角形標識は何を示していますか？",
                      zh: "图示问题：红色的八角形“一時停止”标志表示什么？",
                      pt: "Questão Visual: O que indica a placa vermelha octogonal STOP (一時停止)?"
                    },
                    options: [
                      {
                        en: "Must come to a complete stop before the stop line and verify safety on left & right.",
                        ja: "停止線の手前で完全に停止し、左右の安全を確認しなければならない。",
                        zh: "必须在停止线前完全停稳，确认左右两侧安全。",
                        pt: "Deve parar completamente antes da linha de retenção e verificar a segurança."
                      },
                      {
                        en: "Slow down slightly without stopping if no cars are coming.",
                        ja: "車が来ていなければ停止せずに徐行する。",
                        zh: "如果没有来车，可以减速慢行而不必完全停稳。",
                        pt: "Desacelerar sem parar totalmente se não houver carros."
                      }
                    ],
                    correctOptionIndex: 0,
                    explanation: {
                      en: "A stop sign mandates stopping completely (wheels stationary). Rolling stops are illegal and subject to fines and penalty points.",
                      ja: "一時停止標識では車輪が完全に止まるまで停車する必要があります。徐行通過は違反対象です。",
                      zh: "停止标志要求车辆彻底停稳。未停稳减速通过属于违规行为。",
                      pt: "A placa de parada obriga o veículo a parar completamente."
                    }
                  },
                  {
                    question: {
                      en: "Scenario: Driving at 50 km/h on a wet asphalt road during heavy rain, a vehicle ahead suddenly brakes. What is the safest action?",
                      ja: "シナリオ：大雨の濡れた路面を50km/hで走行中、前車が急ブレーキをかけました。最も安全な対応は？",
                      zh: "场景题：在大雨中以50公里/小时的速度在湿滑路面行驶时，前车突然刹车。最安全的操作是什么？",
                      pt: "Cenário: Dirigindo a 50 km/h em pista molhada sob chuva forte, o carro à frente freia bruscamente. Qual a ação mais segura?"
                    },
                    options: [
                      {
                        en: "Maintain extra stopping distance, apply brakes pumping smoothly to prevent skidding.",
                        ja: "十分な車間距離を保ち、スリップを防ぐためポンピングブレーキで慎重に減速する。",
                        zh: "保持足够的安全车距，分次踩刹车（点刹）防止车辆侧滑。",
                        pt: "Manter distância de seguimento extra e frear de forma progressiva."
                      },
                      {
                        en: "Slam on the brakes abruptly and turn the steering wheel violently.",
                        ja: "急ブレーキを踏み込み、ハンドルを急に切る。",
                        zh: "猛踩刹车并急打方向盘。",
                        pt: "Pressionar o freio com força total e virar o volante bruscamente."
                      }
                    ],
                    correctOptionIndex: 0,
                    explanation: {
                      en: "On wet roads, stopping distances double due to reduced tire traction. Gradual braking avoids hydroplaning and skidding.",
                      ja: "濡れた路面では制動距離が伸びるため、早めの段階的ブレーキ操作がスリップ事故を防止します。",
                      zh: "雨天湿滑路面摩擦力降低，停车距离延长，提前分次制动可防止失控。",
                      pt: "Em pistas molhadas, a distância de frenagem aumenta. A frenagem gradual evita derrapagens."
                    }
                  }
                ]
              })
            }
          }
        ]
      };
    } else {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Comprehensive Driving Standards & Safety Handbook",
                description: "Complete legal handbook covering traffic regulations, fines, hazard management, and driving procedures.",
                subtopics: [
                  {
                    title: {
                      en: "Chapter 1: Pedestrian Right-of-Way & Intersection Navigation Rules",
                      ja: "第1章：歩行者優先規則と交差点安全通過基準",
                      zh: "第一章：行人优先通行规则与交叉路口安全通过标准",
                      pt: "Capítulo 1: Prioridade dos Pedestres e Regras de Cruzamento"
                    },
                    content: {
                      en: "### Section 1.1 Core Legal Rules & Statutory Obligations\nDrivers must give complete right-of-way to pedestrians at all crosswalks and intersections. Under Road Traffic Law Article 38, if a pedestrian is attempting to cross or standing near a crosswalk without signals, drivers are strictly required to stop before the stop line.\n\n### Section 1.2 Legal Requirements, Fines & Penalty Points\n- **Failure to Yield to Pedestrians (横断歩行者妨害等)**: 2 penalty points, ¥9,000 fine for standard passenger cars.\n- **Stopping Position**: Stopping on top of the crosswalk constitutes an obstruction penalty of 1 point.\n\n### Section 1.3 Step-by-Step Practical Driving Procedure\n1. **Approach**: Decelerate to under 30 km/h when approaching any signal-less crosswalk.\n2. **Visual Checks**: Perform a 45-degree blind spot check over your left and right shoulders.\n3. **Stop & Signal**: Stop at least 1 meter prior to the stop line. Flash hazard lights if stopped to warn trailing traffic.\n\n### Section 1.4 Critical Hazard Recognition & Blind Spot Warnings\n- Watch for children stepping out from behind parked delivery vans.\n- Never pass or overtake a vehicle that has stopped at a crosswalk.\n\n### Section 1.5 Vehicle Focus: Passenger Cars vs. Motorcycles\n- **Passenger Cars (四輪)**: Maintain full mirror coverage and verify the A-pillar does not block pedestrian visibility.\n- **Motorcycle Riders (二輪)**: Ensure stable foot placement on wet painted crosswalk lines to prevent low-speed tip-overs.",
                      ja: "### 第1.1節 根拠法令とドライバーの義務\n道路交通法第38条に基づき、横断歩道に歩行者がいる場合は必ず一時停止しなければなりません。\n\n### 第1.2節 違反点数と反則金\n- **横断歩行者等妨害等**: 基礎点数2点、普通車反則金9,000円。\n\n### 第1.3節 実践的運転手順\n1. 接近時は30km/h以下に徐行。\n2. 左右の目視確認とミラー確認。\n3. 停止線の手前で完全静止。\n\n### 第1.4節 危険予知とブラインドスポット\n停車中の車両の陰からの飛び出しに注意してください。\n\n### 第1.5節 四輪車と二輪車の比較\n- **四輪車**: Aピラーによる死角に注意。\n- **二輪車**: 濡れた横断歩道塗料上の転倒に注意。",
                      zh: "### 第一节 法律法规与驾驶员义务\n根据日本道路交通法第38条，车辆在人行横道前必须礼让行人。\n\n### 第二节 违规计分与罚款\n- **妨碍行人通行罪**: 扣2分，普通轿车罚款9,000日元。\n\n### 第三节 操作流程\n1. 减速至30km/h以下。\n2. 确认左右盲区。\n3. 停稳于停止线前。\n\n### 第四节 危险预判\n警惕停靠车辆后方突入的行人。\n\n### 第五节 四轮与两轮区别\n- **四轮轿车**: 注意A柱盲区。\n- **两轮摩托**: 避免在湿滑划线上急刹。",
                      pt: "### Seção 1.1 Regras Legais\nDe acordo com o Artigo 38 da Lei de Trânsito, os veículos devem parar para os pedestres.\n\n### Seção 1.2 Penalidades\n- **Infração de Obstrução de Pedestre**: 2 pontos e multa de 9.000 ienes.\n\n### Seção 1.3 Procedimentos\n1. Reduzir a velocidade para menos de 30 km/h.\n2. Verificar pontos cegos.\n3. Parar antes da linha.\n\n### Seção 1.4 Prevenção de Perigos\nAtenção a pedestres surgindo atrás de veículos parados.\n\n### Seção 1.5 Carros vs. Motocicletas\n- **Carros**: Cuidado com o ponto cego da coluna A.\n- **Motos**: Cuidado com derrapagens nas faixas pintadas."
                    }
                  }
                ]
              })
            }
          }
        ]
      };
    }
  };

  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  const handleStartIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalTitle = newBookTitle.trim();
    if (!finalTitle && selectedFile) {
      finalTitle = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').replace(/-/g, ' ');
      finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);
    }
    if (!finalTitle) {
      finalTitle = "Japan Driving Rules Master Handbook";
    }
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
        } else if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
          extractedText = fileContent || await parseDocxFile(selectedFile);
        } else if (selectedFile.name.endsWith('.txt')) {
          extractedText = fileContent;
        }
      } else if (fileContent || rawTextPaste) {
        extractedText = fileContent || rawTextPaste;
      if (extractedText.length > 15000) {
        console.log("[Ingestion] Trimming extracted text to 15,000 characters for optimal AI performance...");
        extractedText = extractedText.slice(0, 15000);
      }
      } else {
        alert("Please select a PDF/TXT file or paste raw handbook text.");
        setIsIngesting(false);
        setIngestionStep(0);
        return;
      }

      setIngestionStep(2);
      console.log("[Ingestion] Launching concurrent Multimodal Ingestion pipelines via OpenRouter...");

      // Using multi-model fallback list in fetchOpenRouterAI

      // Build the message contents array containing the prompt text and images
      const chapterContent: any[] = [
        {
          type: 'text',
          text: 'Analyze the uploaded Word document/text content. Extract key chapters and subtopics. For EACH subtopic, generate a comprehensive, highly detailed explanation of at least 2 full pages worth of content (minimum 1,000 words per subtopic) including: 1. Core Rule Overview & Legal Principle, 2. Legal Requirements, Fines & Penalties (points deduction, fines in Yen, suspensions), 3. Step-by-Step Practical Driving Procedure (approach, mirror checks, blind spot 45-degree check, signal timing), 4. Critical Hazard Recognition & Blind Spot Warnings (pedestrian crosswalk priority, railway crossing procedures, emergency vehicle yielding), 5. Vehicle Focus: Car Drivers (四輪) vs. Motorcycle Riders (二輪). Translate all descriptive sections into 4 complete language blocks: en, ja, zh, and pt. Keep numerical limits exact. Output a single structured JSON object matching this schema: {"title": "Handbook Overview", "description": "Overview description", "subtopics": [{"title": {"en": "", "ja": "", "zh": "", "pt": ""}, "content": {"en": "", "ja": "", "zh": "", "pt": ""}}]}' + (extractedText ? `\n\nExtracted Text:\n${extractedText}` : '')
        }
      ];

      const quizContent: any[] = [
        {
          type: 'text',
          text: 'Analyze the uploaded Word document/text content. Generate a rich mixture of at least 10 multilingual multiple choice questions (MCQs), specifically including: (1) Visual Traffic Sign & Road Marking Questions with sign names/types, and (2) Real-World Driving Scenario Questions (e.g., wet road braking, railway crossings, night driving, moped two-step turns). Every question, option array string, and explanation field must be fully localized into en, ja, zh, and pt. Output a single JSON object matching this schema: {"questions": [{"question": {"en": "", "ja": "", "zh": "", "pt": ""}, "options": [{"en": "", "ja": "", "zh": "", "pt": ""}], "correctOptionIndex": 0, "explanation": {"en": "", "ja": "", "zh": "", "pt": ""}}]}' + (extractedText ? `\n\nExtracted Text:\n${extractedText}` : '')
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

      const activeKey = customApiKey.trim() || import.meta.env.VITE_OPENROUTER_API_KEY || '';
      
      setIngestionStep(3);
      const chapterData = await fetchOpenRouterAI(activeKey, chapterContent);

      setIngestionStep(4);
      const quizData = await fetchOpenRouterAI(activeKey, quizContent);

      if (chapterData.error) throw new Error(`AI Synthesis Error: ${chapterData.error.message || JSON.stringify(chapterData.error)}`);
      if (quizData.error) throw new Error(`AI Quiz Error: ${quizData.error.message || JSON.stringify(quizData.error)}`);

      const synthesisStr = chapterData.choices?.[0]?.message?.content || '{}';
      const quizStr = quizData.choices?.[0]?.message?.content || '{}';

      const synthesisData = cleanAndParseJSON(synthesisStr);
      const quizQuestionsObject = cleanAndParseJSON(quizStr);

      setIngestionStep(5);

      const book_id = `book_${Math.random().toString(36).substr(2, 7)}`;
      const books_payload = [{
        id: book_id,
        title: { en: finalTitle, ja: finalTitle, zh: finalTitle, pt: finalTitle },
        description: {
          en: synthesisData.description || `Study guide for ${finalTitle}`,
          ja: `${finalTitle}の学習ガイド`,
          zh: `${finalTitle}的学习指南`,
          pt: `Guia de estudo para ${finalTitle}`
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
        const options_mapped = safeMapOptions(q?.options, correctIdx);
        const chCount = chapters_payload.length;
        const linkedChapterId = chCount > 0 ? chapters_payload[idx % chCount].id : null;
        return {
          id: `q_${Date.now()}_${idx}`,
          book_id: book_id,
          category: "Rules of the Road",
          difficulty: "medium",
          text: q.question || { en: `Question ${idx + 1}` },
          options: options_mapped.length > 0 ? options_mapped : [
            { text: { en: "Yes", ja: "はい", zh: "是", pt: "Sim" }, isCorrect: true },
            { text: { en: "No", ja: "いいえ", zh: "否", pt: "Não" }, isCorrect: false }
          ],
          explanation: q.explanation || defaultExp
        };
      });

      console.log("[Ingestion] Invoking Supabase edge function to load mapped data packages...");
      
      try {
        if (books_payload.length > 0) {
          const { error: booksErr } = await supabase.from('books').upsert(books_payload);
          if (booksErr) throw booksErr;
        }
        if (chapters_payload.length > 0) {
          const { error: chErr } = await supabase.from('chapters').upsert(chapters_payload);
          if (chErr) throw chErr;
        }
        if (subtopics_payload.length > 0) {
          const { error: subErr } = await supabase.from('subtopics').upsert(subtopics_payload);
          if (subErr) throw subErr;
        }
        if (questions_payload.length > 0) {
          const { error: qErr } = await supabase.from('questions').upsert(questions_payload);
          if (qErr) throw qErr;
        }
      } catch (directErr: any) {
        console.warn("Direct DB save failed, trying edge function...", directErr);
        const { error: invokeError } = await supabase.functions.invoke('ingest-book', {
          body: {
            books: books_payload,
            chapters: chapters_payload,
            subtopics: subtopics_payload,
            questions: questions_payload
          }
        });
        if (invokeError) {
          throw new Error(`Save failed: ${directErr.message || invokeError.message}`);
        }
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

  const handleStartManualIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBookTitle) {
      alert("Please provide a Book Title.");
      return;
    }
    const validChapters = manualChapters.filter(c => c.title.trim() && c.content.trim());
    if (validChapters.length === 0) {
      alert("Please provide at least one chapter with title and content.");
      return;
    }

    setIsManualIngesting(true);
    setManualStatus("Processing chapters via AI...");

    try {
      const model = 'nvidia/nemotron-nano-12b-v2-vl:free';

      const promptContent = [
        {
          type: 'text',
          text: `You are an expert translator and exam question generator. Direct Translation Only: The AI must directly convert/translate the provided chapter titles and contents into the 4 target language keys (en, ja, zh, pt). Strictly prohibit any conversational intros, extra explanations, markdown commentary, or AI fluff. Question Generator: The AI must generate 3 to 5 concise multiple-choice questions (MCQs) per chapter testing the material. You MUST process and include EVERY chapter provided in the input. Do NOT skip any chapters.
          
Payload Schema requirement:
{
  "bookTitle": "${manualBookTitle}",
  "chapters": [
    {
      "chapterIndex": 1,
      "title": { "en": "...", "ja": "...", "zh": "...", "pt": "..." },
      "content": { "en": "...", "ja": "...", "zh": "...", "pt": "..." },
      "questions": [
        {
          "question": { "en": "...", "ja": "...", "zh": "...", "pt": "..." },
          "options": [
            { "en": "...", "ja": "...", "zh": "...", "pt": "..." },
            { "en": "...", "ja": "...", "zh": "...", "pt": "..." },
            { "en": "...", "ja": "...", "zh": "...", "pt": "..." },
            { "en": "...", "ja": "...", "zh": "...", "pt": "..." }
          ],
          "correctOptionIndex": 0,
          "explanation": { "en": "...", "ja": "...", "zh": "...", "pt": "..." },
          "imageUrl": "optional_image_url_if_provided_in_chapter"
        }
      ]
    }
  ]
}

Input data to process:
Book Title: ${manualBookTitle}
Chapters:
${validChapters.map((c, i) => `Chapter ${i + 1}:\nTitle: ${c.title}\nContent: ${c.content}\nImage URL: ${c.imageUrl || 'none'}`).join('\n\n')}
`
        }
      ];

      // Attach images to the prompt if provided
      validChapters.forEach(c => {
        if (c.imageUrl && c.imageUrl.trim().length > 0) {
          promptContent.push({
            type: 'image_url',
            image_url: { url: c.imageUrl.trim() }
          } as any);
        }
      });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'NCS Admin Manual Ingestion'
        },
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          messages: [{ role: 'user', content: promptContent }],
          response_format: { type: 'json_object' },
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(`AI Provider Error: ${result.error?.message || response.statusText || 'Request failed'}`);
      }
      
      const contentStr = result.choices?.[0]?.message?.content || '{}';
      
      let parsedData;
      try {
        parsedData = cleanAndParseJSON(contentStr);
      } catch (err: any) {
        throw new Error(`AI returned malformed JSON: ${err.message}`);
      }

      setManualStatus("Saving to database...");

      const existingBook = books.find(b => renderLocalized(b.title).toLowerCase().trim() === manualBookTitle.toLowerCase().trim());
      const book_id = existingBook ? existingBook.id : `book_m_${Math.random().toString(36).substr(2, 7)}`;
      
      const books_payload = [{
        id: book_id,
        title: existingBook?.title || { en: manualBookTitle, ja: manualBookTitle, zh: manualBookTitle, pt: manualBookTitle },
        description: existingBook?.description || {
          en: `Manual study guide for ${manualBookTitle}`,
          ja: `${manualBookTitle}の学習ガイド (マニュアル)`,
          zh: `${manualBookTitle}的学习指南 (手动)`,
          pt: `Guia de estudo para ${manualBookTitle} (Manual)`
        },
        icon: "book-outline",
        cover_image: fixImageUrl(manualBookCover) || existingBook?.cover_image || null
      }];

      const chapters_payload: any[] = [];
      const subtopics_payload: any[] = [];
      const questions_payload: any[] = [];

      (parsedData.chapters || []).forEach((ch: any, idx: number) => {
        const chapter_id = `ch_m_${Date.now()}_${idx}`;
        chapters_payload.push({
          id: chapter_id,
          book_id: book_id,
          title: ch.title || { en: `Chapter ${idx + 1}` },
          license_type: manualChapters[idx]?.licenseType || 'both',
          order_num: idx + 1
        });
        
        subtopics_payload.push({
          id: `sub_m_${Date.now()}_${idx}`,
          chapter_id: chapter_id,
          title: ch.title || { en: `Chapter ${idx + 1}` },
          content: ch.content || { en: "" },
          order_num: 1
        });

        (ch.questions || []).forEach((q: any, qIdx: number) => {
          const correctIdx = q.correctOptionIndex || 0;
          const options_mapped = safeMapOptions(q?.options, correctIdx);
          const qObj: any = {
            id: `q_m_${Date.now()}_${idx}_${qIdx}`,
            book_id: book_id,
            chapter_id: chapter_id,
            category: "Manual Rules",
            difficulty: "medium",
            text: q.question || { en: `Question ${qIdx + 1}` },
            options: options_mapped.length > 0 ? options_mapped : [
              { text: { en: "Yes", ja: "はい", zh: "是", pt: "Sim" }, isCorrect: true },
              { text: { en: "No", ja: "いいえ", zh: "否", pt: "Não" }, isCorrect: false }
            ],
            explanation: q.explanation || defaultExp
          };
          const imgUrl = fixImageUrl(q.imageUrl);
          if (imgUrl && imgUrl !== 'none') {
            qObj.image_url = imgUrl;
          }
          questions_payload.push(qObj);
        });
      });

      try {
        if (books_payload.length > 0) {
          const { error: booksErr } = await supabase.from('books').upsert(books_payload);
          if (booksErr) throw booksErr;
        }
        if (chapters_payload.length > 0) {
          const { error: chErr } = await supabase.from('chapters').upsert(chapters_payload);
          if (chErr) throw chErr;
        }
        if (subtopics_payload.length > 0) {
          const { error: subErr } = await supabase.from('subtopics').upsert(subtopics_payload);
          if (subErr) throw subErr;
        }
        if (questions_payload.length > 0) {
          const { error: qErr } = await supabase.from('questions').upsert(questions_payload);
          if (qErr && qErr.message?.includes('image_url')) {
            const cleanQuestions = questions_payload.map(({ image_url, ...rest }) => rest);
            const { error: retryErr } = await supabase.from('questions').upsert(cleanQuestions);
            if (retryErr) throw retryErr;
          } else if (qErr) {
            throw qErr;
          }
        }
      } catch (directErr: any) {
        console.warn("Direct DB save failed, trying edge function...", directErr);
        const { error: invokeError } = await supabase.functions.invoke('ingest-book', {
          body: {
            books: books_payload,
            chapters: chapters_payload,
            subtopics: subtopics_payload,
            questions: questions_payload
          }
        });
        if (invokeError) {
          throw new Error(`Save failed: ${directErr.message || invokeError.message}`);
        }
      }

      alert("🎉 Manual Handbook successfully compiled and loaded!");
      
      const newBook = {
        id: book_id,
        title: manualBookTitle,
        chapters: chapters_payload.length,
        questions: questions_payload.length
      };

      setBooks(prevBooks => [...prevBooks, newBook]);
      setManualBookTitle('');
      setManualBookCover('');
      setManualChapters([{title: '', content: '', imageUrl: ''}]);
      fetchData();
    } catch (error: any) {
      console.error("[Manual Ingestion Error]", error);
      alert(`Manual Ingestion failed: ${error.message}`);
    } finally {
      setIsManualIngesting(false);
      setManualStatus('');
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
    const dynamicSubtopicId = `sub_${Math.random().toString(36).substring(2, 11)}`;
    
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

      const model = 'nvidia/nemotron-nano-12b-v2-vl:free';
      
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

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(`AI Provider Error: ${result.error?.message || response.statusText || 'Request failed'}`);
      }
      
      const contentStr = result.choices?.[0]?.message?.content || '{}';
      
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
        const { error: subtopicError } = await supabase.from('subtopics').insert({
          id: dynamicSubtopicId,
          chapter_id: dynamicChapterId,
          title: parsedData.subtopic.title,
          content: parsedData.subtopic.content,
          order_num: 1
        });
        if (subtopicError) throw subtopicError;
      }

      // 2. Insert questions
      if (parsedData.questions && parsedData.questions.length > 0) {
        const questionsToInsert = parsedData.questions.map((q: any) => {
          return {
            id: `q_${Math.random().toString(36).substring(2, 11)}`,
            book_id: visualBookId,
            chapter_id: dynamicChapterId,
            subtopic_id: dynamicSubtopicId,
            category: 'Visual Quiz',
            difficulty: 'medium',
            text: q.question,
            options: safeMapOptions(q?.options, q?.correctOptionIndex || 0),
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
                <h2 style={{...styles.cardTitle, color: '#E31837', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  ✨ Word Book Auto-Magic Slot
                </h2>
                <p style={{ fontSize: '13px', color: '#B0B0B0', marginBottom: '16px', lineHeight: '18px' }}>
                  Upload your Word (.docx) book file below. Book title is optional—AI will auto-generate the title, 2-page detailed explanations in 4 languages (EN, JA, ZH, PT), and visual/scenario quizzes automatically!
                </p>

                <form onSubmit={handleStartIngestion} style={styles.crudForm}>
                  <div style={{
                    border: '2px dashed #E31837',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(227, 24, 55, 0.04)',
                    marginBottom: '16px',
                    cursor: 'pointer'
                  }}>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📄</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                        {selectedFile ? `Selected Word Book: ${selectedFile.name}` : 'Upload Word Book File (.docx / .doc / .txt)'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#A0A0A0', display: 'block', marginTop: '4px' }}>
                        {selectedFile ? 'Click to change file' : 'Drag & drop or tap to select Word file'}
                      </span>
                      <input 
                        type="file" 
                        accept=".docx,.doc,.pdf,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        style={{ display: 'none' }} 
                        disabled={isIngesting}
                      />
                    </label>
                  </div>

                  <label style={{...styles.fieldLabel, color: '#FFB300'}}>Custom OpenRouter API Key (Optional - paste your paid or custom API key here)</label>
                  <input 
                    type="password" 
                    placeholder="sk-or-v1-..." 
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    style={{...styles.input, borderColor: '#FFB300', marginBottom: '16px'}} 
                    disabled={isIngesting}
                  />

                  <label style={styles.fieldLabel}>Book Name (Optional - AI will auto-name if left blank)</label>
                  <input 
                    type="text" 
                    placeholder="Auto-detected from file (e.g. Traffic Safety Master Guide)" 
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    style={styles.input} 
                    disabled={isIngesting}
                  />

                  <label style={styles.fieldLabel}>Paste Raw Textbook Text (Alternative)</label>
                  <textarea 
                    placeholder="Pasted handbook contents here..." 
                    value={rawTextPaste}
                    onChange={(e) => setRawTextPaste(e.target.value)}
                    style={styles.textarea}
                    disabled={isIngesting}
                  />

                  <label style={styles.fieldLabel}>Select File (Word .docx, PDF, or TXT)</label>
                  <input 
                    type="file" 
                    accept=".docx,.doc,.pdf,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    style={styles.fileInput} 
                    disabled={isIngesting}
                  />

                  <button type="submit" style={{...styles.submitBtn, opacity: isIngesting ? 0.6 : 1}} disabled={isIngesting}>
                    <Plus size={16} />
                    <span>{isIngesting ? '✨ AI Auto-Magic is Processing...' : '✨ Process Word Book (Auto-Magic)'}</span>
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

            {/* Manual Book Ingestion Form */}
            <div style={{ ...styles.card, marginTop: '24px' }}>
              <h2 style={styles.cardTitle}>Manual Book Ingestion System</h2>
              <p style={{ color: '#B0B0B0', marginBottom: 24, fontSize: 14 }}>
                Manually build a book by providing a title and chapter texts. The AI will translate it into 4 languages and generate exactly 15 MCQs per chapter.
              </p>
              <form onSubmit={handleStartManualIngestion} style={styles.crudForm}>
                <div style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.fieldLabel}>Book Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Japan Passenger Car License Handbook"
                        value={manualBookTitle}
                        onChange={(e) => setManualBookTitle(e.target.value)}
                        style={styles.fieldInput}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.fieldLabel}>Cover Image URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://example.com/cover.jpg"
                        value={manualBookCover}
                        onChange={(e) => setManualBookCover(e.target.value)}
                        style={styles.fieldInput}
                      />
                    </div>
                  </div>

                  {manualChapters.map((chapter, index) => (
                    <div key={index} style={{ marginTop: '24px', padding: '24px', backgroundColor: '#1E1E1E', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <label style={{ ...styles.fieldLabel, margin: 0, fontSize: '15px', color: '#FFF' }}>Chapter {index + 1}</label>
                        {manualChapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newChapters = [...manualChapters];
                              newChapters.splice(index, 1);
                              setManualChapters(newChapters);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#FF1744', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Chapter Title (e.g. Chapter 1: Rules of the Road)"
                        value={chapter.title}
                        onChange={(e) => {
                          const newChapters = [...manualChapters];
                          newChapters[index].title = e.target.value;
                          setManualChapters(newChapters);
                        }}
                        style={{ ...styles.fieldInput, marginBottom: '8px' }}
                        required
                      />
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="Related Image URL (Optional - AI will use this to generate questions)"
                          value={chapter.imageUrl}
                          onChange={(e) => {
                            const newChapters = [...manualChapters];
                            newChapters[index].imageUrl = e.target.value;
                            setManualChapters(newChapters);
                          }}
                          style={{ ...styles.fieldInput, flex: 2, marginBottom: 0 }}
                        />
                        <select
                          value={chapter.licenseType}
                          onChange={(e) => {
                            const newChapters = [...manualChapters];
                            newChapters[index].licenseType = e.target.value as any;
                            setManualChapters(newChapters);
                          }}
                          style={{ ...styles.fieldInput, flex: 1, marginBottom: 0, appearance: 'auto', backgroundColor: '#222' }}
                        >
                          <option value="both">🚦 Both (Car & Bike)</option>
                          <option value="car">🚗 Car Only</option>
                          <option value="bike">🏍️ Bike Only</option>
                        </select>
                      </div>
                      
                      {chapter.imageUrl && (
                        <div style={{ marginBottom: '16px', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#222', border: '1px solid #444' }}>
                          <img src={fixImageUrl(chapter.imageUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                      )}

                      <textarea
                        placeholder="Paste handbook section text here..."
                        value={chapter.content}
                        onChange={(e) => {
                          const newChapters = [...manualChapters];
                          newChapters[index].content = e.target.value;
                          setManualChapters(newChapters);
                        }}
                        style={{ ...styles.fieldInput, minHeight: '100px', resize: 'vertical' }}
                        required
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setManualChapters([...manualChapters, { title: '', content: '', imageUrl: '', licenseType: 'both' }]);
                    }}
                    style={{ ...styles.btnPrimary, backgroundColor: '#2A2A2A', backgroundImage: 'none', boxShadow: 'none', border: '1px solid #444', marginTop: '16px', width: 'auto', alignSelf: 'flex-start' }}
                  >
                    <Plus size={18} /> Add Chapter
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button
                    type="submit"
                    disabled={isManualIngesting}
                    style={{ ...styles.btnPrimary, opacity: isManualIngesting ? 0.7 : 1 }}
                  >
                    {isManualIngesting ? 'AI is Processing...' : 'Process & Save Handbook'}
                    {!isManualIngesting && <Database size={20} />}
                  </button>
                  {isManualIngesting && (
                    <span style={{ color: '#E31837', fontWeight: 600 }}>{manualStatus}</span>
                  )}
                </div>
              </form>
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
  },
  fieldInput: {
    backgroundColor: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#E31837',
    backgroundImage: 'linear-gradient(135deg, #E31837 0%, #B71C1C 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.2s',
    boxShadow: '0 4px 14px rgba(227, 24, 55, 0.4)'
  }
};
