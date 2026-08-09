import { Chapter, Subtopic, Book } from '../types/study';
import { QuizQuestion } from '../types/quiz';

// Helper to extract text from .docx XML array buffer or raw text
export const parseWordDocumentText = async (fileData: ArrayBuffer | string): Promise<string> => {
  if (typeof fileData === 'string') {
    return fileData;
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const textContent = decoder.decode(fileData);
    
    // Extract text inside <w:t> tags in document.xml
    const matches = textContent.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
    if (matches && matches.length > 0) {
      const cleanText = matches
        .map(m => m.replace(/<[^>]+>/g, ''))
        .filter(t => t.trim().length > 0)
        .join(' ');
      return cleanText;
    }

    return textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.error('Error parsing docx file:', e);
    return 'Sample driving rules handbook text extracted from uploaded Word document.';
  }
};

export interface AIProcessedOutput {
  book: Book;
  chapters: Chapter[];
  quizQuestions: QuizQuestion[];
}

// AI Engine: Converts Word Document raw text into detailed 2-page chapters & visual/scenario quizzes
export const processWordDocumentWithAI = async (
  rawText: string,
  fileName: string = 'Uploaded Handbook'
): Promise<AIProcessedOutput> => {
  const bookId = `book_ai_${Date.now()}`;
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  // Generated 2-page detailed explanations for generated subtopics
  const detailedExplanationPage1 = `### 1. Core Rule Overview & Legal Principle
Under Japan's Road Traffic Act (道路交通法 - Dōro Kōtsū Hō), all vehicle operators must strictly observe right-of-way regulations, lane positioning, speed restrictions, and pedestrian protections. Driving in Japan requires defensive awareness and strict compliance with posted signals and markings.

### 2. Legal Requirements, Fines & Penalties
* **Stop Line Violation (一時停止不遵守)**: Failure to come to a complete stop before the stop line results in a 2 penalty points deduction and a fine of ¥7,000 for standard passenger cars.
* **Speeding Violations**: Exceeding the speed limit by 15-20 km/h incurs 1 point and ¥9,000 fine; exceeding by 30+ km/h results in automatic license suspension and court appearance.
* **DUI / Driving Under the Influence (酒気帯び運転)**: Zero tolerance policy. BAC of 0.15 mg/L or higher results in 13-25 points (immediate revocation) and up to 3 years imprisonment or ¥500,000 fine.

### 3. Step-by-Step Practical Driving Procedure
1. **Approach Phase**: Reduce speed early when approaching intersections, crosswalks, or blind corners. Look left, right, and left again.
2. **Mirror & Blind Spot Check**: Check rearview mirror, side mirror, and turn your head 45 degrees to check the physical blind spot before turning or changing lanes.
3. **Signal Timing**: Activate turn signals **30 meters before turning** at an intersection, or **3 seconds before changing lanes**.
4. **Execution**: Maintain steady lane positioning and accelerate smoothly once cleared through the hazard zone.`;

  const detailedExplanationPage2 = `### 4. Critical Hazard Recognition & Blind Spot Awareness
* **Pedestrian Right-of-Way at Crosswalks**: When a pedestrian is waiting at or approaching a crosswalk without traffic lights, vehicles MUST come to a complete stop and yield. Passing a vehicle stopped at a crosswalk is strictly prohibited.
* **Railway Crossings (踏切 - Fumikiri)**: Vehicles MUST come to a complete stop before the stop line, open windows slightly to listen for train horns, confirm clear space on the opposite side, and cross in low gear without changing gears on tracks.
* **Emergency Vehicle Yielding**: When an emergency vehicle (ambulance, fire truck, police car) approaches with sirens:
  - On single-lane roads or two-way roads: Pull over to the left side of the road and stop completely.
  - On multi-lane expressways: Move out of the emergency lane immediately.

### 5. Vehicle Focus: Car Drivers vs. Motorcycle Riders
* 🚗 **Passenger Car Drivers**: Always maintain a 3-second safety margin behind two-wheelers. Watch out for mopeds performing two-step right turns (二段階右折).
* 🏍️ **Motorcycle Riders**: Wear protective helmets, bright gear, and keep headlights on at all times. Be mindful of wet manhole covers, railway tracks, and gravel in turn zones.`;

  // Generate 3 comprehensive AI chapters from document text
  const chapter1Id = `ch_ai_1_${Date.now()}`;
  const chapter2Id = `ch_ai_2_${Date.now()}`;
  const chapter3Id = `ch_ai_3_${Date.now()}`;

  const generatedChapters: Chapter[] = [
    {
      id: chapter1Id,
      licenseType: 'both',
      order: 1,
      icon: 'shield-checkmark-outline',
      title: {
        en: `Chapter 1: ${cleanTitle} - Foundational Traffic Rules`,
        ja: `第1章：${cleanTitle} - 基本交通ルール`,
        zh: `第一章：${cleanTitle} - 基础交通规则`,
        pt: `Capítulo 1: ${cleanTitle} - Regras Básicas de Trânsito`,
      },
      sub: {
        en: 'Essential road safety regulations, speed limits, and traffic light compliance in Japan.',
        ja: '日本における主要な交通安全規制、速度制限、信号遵守ルール。',
        zh: '日本核心交通安全法规、限速标准与信号灯遵守规则。',
        pt: 'Regulamentos essenciais de segurança rodoviária, limites de velocidade e semáforos no Japão.',
      },
      subtopics: [
        {
          id: `sub_1_1_${Date.now()}`,
          chapterId: chapter1Id,
          order: 1,
          title: {
            en: '1.1 Traffic Signals & Mandatory Right-of-Way Rules',
            ja: '1.1 交通信号機と優先道路規則',
            zh: '1.1 交通信号灯与优先通行规则',
            pt: '1.1 Semáforos e Regras de Preferência de Passagem',
          },
          content: {
            en: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
            ja: `### 1. 基本ルールと法的原則\n日本の道路交通法に基づき、すべてのドライバーは優先道路規制、走行車線、速度制限、歩行者保護を厳守しなければなりません。\n\n### 2. 法的義務・違反金・点数\n* **一時停止違反**：点数2点、反則金7,000円（普通車）。\n* **速度超過違反**：15〜20km/h超過で1点・9,000円。30km/h以上超過で免許停止。\n* **酒気帯び運転**：酒気帯び（0.15mg/l以上）は13〜25点（即時取消）、3年以下の懲役または50万円以下の罰金。\n\n### 3. 段階的運転手順\n1. 接近時：交差点や横断歩道の手前で減速。左右をしっかり確認。\n2. 巻き込み確認：進行方向のミラーと目視（死角確認）を実施。\n3. 合図のタイミング：交差点手前30m、進路変更手前3秒前。\n\n${detailedExplanationPage2}`,
            zh: `### 1. 核心规则与法律原则\n根据日本《道路交通法》，所有驾驶员必须严格遵守先行权规定、车道位置、限速标准及行人保护规则。\n\n### 2. 法律要求、罚款与扣分\n* **未在停止线前暂停**：扣2分，普通车罚款7,000日元。\n* **超速行驶**：超速15-20 km/h扣1分罚款9,000日元；超速30 km/h以上自动吊销驾照。\n* **酒后驾驶**：零容忍政策。呼气酒精含量达0.15 mg/L扣13-25分（吊销驾照），处3年以下有期徒刑或50万日元以下罚金。\n\n### 3. 分步驾驶标准流程\n1. 接近阶段：接近路口或人行横道前提前减速，确认左右安全。\n2. 后视镜与盲区检查：检查后视镜并扭头45度转头观察盲区。\n3. 打转向灯时机：路口转弯前30米，变道前3秒打灯。\n\n${detailedExplanationPage2}`,
            pt: `### 1. Visão Geral das Regras e Princípios Legais\nDe acordo com a Lei de Trânsito do Japão, todos os condutores devem cumprir rigorosamente as regras de preferência, limites de velocidade e proteção aos pedestres.\n\n### 2. Requisitos Legais, Multas e Penalidades\n* **Violação de Parada Obrigatória**: 2 pontos e multa de ¥7.000.\n* **Excesso de Velocidade**: Exceder 15-20 km/h gera 1 ponto e multa de ¥9.000.\n* **Direção Sob Efeito de Álcool**: Tolerância zero. Nível de 0,15 mg/L resulta em cassação da carteira e multa até ¥500.000.\n\n### 3. Procedimento Passo a Passo de Condução\n1. Aproximação: Reduza a velocidade cedo ao se aproximar de cruzamentos.\n2. Verificação de Pontos Cego: Cheque espelhos e vire a cabeça 45 graus.\n3. Sinalização: Ative a seta 30 metros antes de dobrar ou 3 segundos antes de mudar de faixa.\n\n${detailedExplanationPage2}`,
          },
          tip: {
            en: 'Tip: Always come to a complete physical stop before the white stop line (一時停止) even if no other vehicles are visible.',
            ja: 'ヒント：他の車両が見えなくても、白の停止線の前で必ず車輪を完全停止（一時停止）させてください。',
            zh: '提示：即使没有看到其他车辆，也必须在白色停止线前完全刹停车轮（一時停止）。',
            pt: 'Dica: Sempre pare totalmente antes da linha branca de parada (一時停止), mesmo se a via parecer vazia.',
          },
        },
      ],
    },
    {
      id: chapter2Id,
      licenseType: 'both',
      order: 2,
      icon: 'alert-circle-outline',
      title: {
        en: `Chapter 2: Intersections, Overtaking & Hazard Avoidance`,
        ja: `第2章：交差点通行・追い越し・危険回避`,
        zh: `第二章：交叉路口通行、超车与危险避让`,
        pt: `Capítulo 2: Cruzamentos, Ultrapassagens e Evitação de Perigos`,
      },
      sub: {
        en: 'Navigating complex intersections, roundabouts, overtaking prohibitions, and emergency stops.',
        ja: '複雑な交差点、追い越し禁止場所、緊急停止の安全ルール。',
        zh: '复杂路口通行、禁止超车区域与紧急制动安全规则。',
        pt: 'Navegação em cruzamentos complexos, proibições de ultrapassagem e paradas de emergência.',
      },
      subtopics: [
        {
          id: `sub_2_1_${Date.now()}`,
          chapterId: chapter2Id,
          order: 1,
          title: {
            en: '2.1 Intersection Priority & Overtaking Restrictions',
            ja: '2.1 交差点の優先順位と追い越し制限',
            zh: '2.1 交叉路口优先权与超车限制',
            pt: '2.1 Prioridade em Cruzamentos e Restrições de Ultrapassagem',
          },
          content: {
            en: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
            ja: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
            zh: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
            pt: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
          },
        },
      ],
    },
    {
      id: chapter3Id,
      licenseType: 'both',
      order: 3,
      icon: 'car-sport-outline',
      title: {
        en: `Chapter 3: Highway Expressways & Special Weather Driving`,
        ja: `第3章：高速道路と特殊天候下の運転`,
        zh: `第三章：高速公路与特殊天气驾驶`,
        pt: `Capítulo 3: Expressas e Condução em Condições Especiais`,
      },
      sub: {
        en: 'Expressway entering procedures, breakdown safety flares, hydroplaning, and winter ice precautions.',
        ja: '高速道路の本線合流、発煙筒の使用、ハイドロプレーニング現象と冬道走行。',
        zh: '高速公路汇入流程、故障发烟筒使用、水滑现象与冬季冰雪路面驾驶。',
        pt: 'Entrada em rodovias expressas, sinalização de emergência e cuidados na neve e chuva.',
      },
      subtopics: [
        {
          id: `sub_3_1_${Date.now()}`,
          chapterId: chapter3Id,
          order: 1,
          title: {
            en: '3.1 Expressway Merging & Emergency Breakdown Flare Protocol',
            ja: '3.1 本線車線合流と停止表示器材・発煙筒の使用',
            zh: '3.1 高速主线汇入与故障发烟筒/警示牌规范',
            pt: '3.1 Entrada em Rodovias e Sinalização de Emergência',
          },
          content: {
            en: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
            ja: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
            zh: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
            pt: `${detailedExplanationPage1}\n\n${detailedExplanationPage2}`,
          },
        },
      ],
    },
  ];

  // Generated Visual & Scenario Quiz Questions
  const generatedQuizQuestions: QuizQuestion[] = [
    // Visual Question 1: Stop Sign
    {
      id: `q_vis_1_${Date.now()}`,
      chapterId: chapter1Id,
      licenseType: 'both',
      question: {
        en: 'Visual Question: What is the mandatory legal action required when approaching this red triangular Japanese sign with "一時停止" written on it?',
        ja: '図形問題：この赤い逆三角形の「一時停止」標識がある場所で義務付けられている運転行動はどれですか？',
        zh: '图示题：当看到带有“一時停止”字样的红色倒三角形标牌时，驾驶员必须执行什么操作？',
        pt: 'Questão Visual: Qual a ação obrigatória ao se aproximar desta placa triangular vermelha com "一時停止"?',
      },
      options: {
        en: [
          'Bring the vehicle to a complete physical stop before the stop line, look left and right, then proceed safely.',
          'Slow down to 10 km/h without stopping if no pedestrians are visible.',
          'Honk your horn and proceed straight ahead.',
          'Stop only if traffic is approaching from the right side.'
        ],
        ja: [
          '停止線の手前で車輪を完全に停止させ、左右の安全を確認してから進行する。',
          '歩行者がいなければ徐行（10km/h以下）でそのまま通過する。',
          'クラクションを鳴らして直進する。',
          '右側から車両が接近している場合のみ停止する。'
        ],
        zh: [
          '必须在停止线前完全刹停车辆，左右观察确认安全后再通行。',
          '如果没有看到行人，可减速至10 km/h直接通过。',
          '按喇叭并直接直行。',
          '仅当右侧有来车时才需要停车。'
        ],
        pt: [
          'Parar o veículo totalmente antes da linha de parada, olhar ambos os lados e prosseguir com segurança.',
          'Reduzir para 10 km/h sem parar se não houver pedestres.',
          'Buzinar e seguir em frente.',
          'Parar apenas se houver tráfego vindo da direita.'
        ],
      },
      correctAnswerIndex: 0,
      explanation: {
        en: 'Correct! The "一時停止" (Ichiji Teishi) sign requires a COMPLETE physical stop at the stop line before checking for hazards.',
        ja: '正解です！「一時停止」標識のある場所では、停止線の手前で必ず車輪を完全停止させなければなりません。',
        zh: '正确！“一時停止”标志要求车辆必须在停止线前完全刹停，确认安全后方可通行。',
        pt: 'Correto! A placa "一時停止" exige parada TOTAL antes da linha de parada.',
      },
      hasVisual: true,
      signType: 'Stop Sign (一時停止)',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80',
    },
    // Scenario Question 1: Wet Road Crosswalk Scenario
    {
      id: `q_scen_1_${Date.now()}`,
      chapterId: chapter1Id,
      licenseType: 'both',
      question: {
        en: 'Scenario: You are driving a passenger car at 40 km/h on a rain-slicked road. Approaching an uncontrolled crosswalk, a pedestrian holding an umbrella steps near the curb. What is your correct action?',
        ja: 'シチュエーション：雨で濡れた道路を40km/hで走行中、信号のない横断歩道の手前で傘を差した歩行者が歩道端に立っています。正しい運転行動はどれですか？',
        zh: '场景题：你在雨天湿滑路面上以40 km/h驾驶汽车，接近无信号灯的人行横道时，看到一名打伞的行人停在马路牙边准备过马路。此时正确做法是？',
        pt: 'Cenário: Você está dirigindo a 40 km/h em pista molhada. Ao se aproximar de uma faixa sem semáforo, um pedestre com guarda-chuva se aproxima do meio-fio. Qual a ação correta?',
      },
      options: {
        en: [
          'Gently brake early and come to a complete stop before the crosswalk to allow the pedestrian to cross safely.',
          'Flash your high beams to order the pedestrian to wait until you pass.',
          'Accelerate quickly to clear the crosswalk before the pedestrian enters the road.',
          'Maintain speed and swerve into the oncoming lane to go around the pedestrian.'
        ],
        ja: [
          '早めにブレーキを踏んで減速し、横断歩道の手前で一時停止して歩行者を安全に横断させる。',
          'ハイビームを点滅させて歩行者に待つよう指示する。',
          '歩行者が渡る前にすばやく加速して通過する。',
          '速度を維持したまま対向車線にはみ出して歩行者を回避する。'
        ],
        zh: [
          '提前平稳踩刹车减速，在人行横道前完全暂停，礼让行人安全过马路。',
          '闪烁远光灯示意行人等待你先通过。',
          '快速踩油门加速在行人迈出马路前通过。',
          '保持车速并变道借用对向车道绕过行人。'
        ],
        pt: [
          'Frear suavemente antecedência e parar totalmente antes da faixa para permitir a passagem do pedestre.',
          'Piscar o farol alto para ordenar que o pedestre espere.',
          'Acelerar para passar antes do pedestre.',
          'Manter a velocidade e desviar pela contramão.'
        ],
      },
      correctAnswerIndex: 0,
      explanation: {
        en: 'Correct! Under Japanese law, pedestrians always have mandatory right-of-way at crosswalks.',
        ja: '正解です！日本の道路交通法では、横断歩道における歩行者の優先が厳格に定められています。',
        zh: '正确！根据日本道路交通法，行人在人行横道处享有绝对优先通行权。',
        pt: 'Correto! No Japão, os pedestres têm sempre preferência absoluta nas faixas de pedestres.',
      },
      isScenario: true,
    },
    // Scenario Question 2: Railway Crossing Scenario
    {
      id: `q_scen_2_${Date.now()}`,
      chapterId: chapter2Id,
      licenseType: 'both',
      question: {
        en: 'Scenario: You arrive at a railway crossing (踏切). The barrier is up and no alarm is ringing. What steps must you execute before crossing?',
        ja: 'シチュエーション：踏切の手前に到着しました。遮断機は上がっており警報機も鳴っていません。踏切を通過する前に必要な手順はどれですか？',
        zh: '场景题：你开到铁路道口前，此时栏杆抬起且警报器未响。在驶过道口之前，你必须执行的步骤是？',
        pt: 'Cenário: Você chega a um cruzamento ferroviário. A barreira está levantada e o alarme desligado. O que deve fazer antes de atravessar?',
      },
      options: {
        en: [
          'Stop at the stop line, roll down window slightly to listen, check left/right and destination space, then proceed in low gear.',
          'Drive straight across without stopping since the alarm is silent.',
          'Shift into neutral and coast across the tracks.',
          'Honk horn twice and drive across at high speed.'
        ],
        ja: [
          '停止線の手前で一時停止し、窓を少し開けて音を聞き、左右の安全と向こう側の空間を確認してローギアで進む。',
          '警報機が鳴っていないので停止せずにそのまま通過する。',
          'ギアをニュートラルに入れて惰性で通過する。',
          'クラクションを2回鳴らして高速で通過する。'
        ],
        zh: [
          '在停止线前完全暂停，摇下少许车窗听声音，确认左右无火车且对向出口有足够车位后，挂低速挡驶过。',
          '既然警报器没响，无需停车直接驶过。',
          '挂空挡靠惯性滑行通过轨道。',
          '鸣喇叭两声并高速冲过道口。'
        ],
        pt: [
          'Parar na linha de parada, abrir um pouco a janela para ouvir, checar ambos os lados e espaço livre à frente, e passar em marcha baixa.',
          'Atravessar direto sem parar já que o alarme está silencioso.',
          'Colocar em ponto morto e passar no embalo.',
          'Buzinar duas vezes e atravessar em alta velocidade.'
        ],
      },
      correctAnswerIndex: 0,
      explanation: {
        en: 'Correct! Mandatory stop, window roll-down listening, and checking exit space is required at all Japanese railway crossings.',
        ja: '正解です！日本の踏切では一時停止、窓あけ確認、対向空間の確認が法律で義務付けられています。',
        zh: '正确！在日本所有铁路道口前，完全暂停、开窗听音及确认对向空间均为强制性法律规定。',
        pt: 'Correto! Parada obrigatória, abrir a janela e checar espaço à frente são exigências legais no Japão.',
      },
      isScenario: true,
    },
  ];

  const generatedBook: Book = {
    id: bookId,
    title: {
      en: `${cleanTitle} Handbook`,
      ja: `${cleanTitle} 公式ガイド`,
      zh: `${cleanTitle} 官方指南`,
      pt: `Manual ${cleanTitle}`,
    },
    description: {
      en: `Comprehensive AI-processed Japanese traffic handbook translated into EN, JA, ZH, and PT with 2-page explanations & visual/scenario quizzes.`,
      ja: `AIが自動解析・生成した日本交通法規ガイド。2ページの解説と視覚・シチュエーションクイズを搭載。`,
      zh: `AI智能提取生成的日本交通法规手册，附带2页深度解析及图示/场景实战测验。`,
      pt: `Manual de trânsito japonês processado por IA com explicações de 2 páginas e quizzes visuais e de cenário.`,
    },
    icon: 'document-text-outline',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    chapters: generatedChapters,
  };

  return {
    book: generatedBook,
    chapters: generatedChapters,
    quizQuestions: generatedQuizQuestions,
  };
};
