import { Chapter, Book } from '../types/study';

export const mockChapters: Chapter[] = [
  {
    id: 'ch1',
    title: {
      en: 'Chapter 1: General Traffic Rules',
      ja: '第1章：一般交通規則',
      zh: '第一章：通用交通规则',
      pt: 'Capítulo 1: Regras Gerais de Trânsito',
    },
    sub: {
      en: 'Fundamental rules of Japanese roads, driving sides, and pedestrian priorities.',
      ja: '日本の道路の基本原則、通行区分、歩行者の優先について。',
      zh: '日本道路的基本原则、通行区分以及行人优先规则。',
      pt: 'Princípios básicos das estradas japonesas, lados de condução e prioridades dos pedestres.',
    },
    icon: 'car-sport-outline',
    order: 1,
    subtopics: [
      {
        id: 'sub1_1',
        chapterId: 'ch1',
        title: {
          en: '1.1 Keep Left Principle',
          ja: '1.1 左側通行の原則',
          zh: '1.1 左侧通行原则',
          pt: '1.1 Princípio de Manter-se à Esquerda',
        },
        order: 1,
        content: {
          en: 'In Japan, vehicles must keep to the **left side** of the road, while pedestrians keep to the right. This is a fundamental rule of traffic safety.\n\n### Core Rules:\n* **Left Side**: Automobiles, motorcycles, and bicycles must use the left side of the road.\n* **Exemptions**: Passing a slow vehicle, moving around road obstacles, or on one-way streets.',
          ja: '日本では、車両は道路の**左側**を通行し、歩行者は右側を通行しなければなりません。これは交通安全の基本原則です。\n\n### 主な規則：\n* **左側通行**：自動車、バイク、自転車は道路の左側を通行しなければなりません。\n* **例外**：遅い車両の追い越し、障害物の回避、または一方通行の道路。',
          zh: '在日本，车辆必须在道路的**左侧**通行，而行人则在右侧通行。这是交通安全的基本原则。\n\n### 核心规则：\n* **左侧通行**：汽车、摩托车和自行车必须使用道路的左侧。\n* **例外情况**：超越慢行车辆、绕过道路障碍物或在单行道上。',
          pt: 'No Japão, os veículos devem manter-se no **lado esquerdo** da estrada, enquanto os pedestres mantêm-se à direita. Esta é uma regra fundamental de segurança no trânsito.\n\n### Regras Principais:\n* **Lado Esquerdo**: Automóveis, motocicletas e bicicletas devem usar o lado esquerdo da estrada.\n* **Exceções**: Ultrapassagem de veículo lento, desvio de obstáculos na pista ou em ruas de sentido único.',
        },
        tip: {
          en: 'Always keep left, especially when entering roundabouts or turning at intersections!',
          ja: '交差点を曲がる時やラウンドアバウトに入る時は、常に左側を意識しましょう！',
          zh: '在进入环岛或在十字路口转弯时，务必保持靠左！',
          pt: 'Mantenha-se sempre à esquerda, especialmente ao entrar em rotatórias ou ao virar em cruzamentos!',
        },
      },
      {
        id: 'sub1_2',
        chapterId: 'ch1',
        title: {
          en: '1.2 Pedestrians First',
          ja: '1.2 歩行者優先の原則',
          zh: '1.2 行人优先原则',
          pt: '1.2 Prioridade para Pedestres',
        },
        order: 2,
        content: {
          en: 'Pedestrians always have the **highest priority** on Japanese roads. Drivers must show extreme caution near crosswalks.\n\n### Regulations:\n1. **Unregulated Crosswalks**: You must stop if a pedestrian is waiting to cross.\n2. **Sidewalks**: Vehicles crossing sidewalks to enter buildings must stop before crossing.',
          ja: '歩行者は常に日本の道路において**最優先**されます。ドライバーは横断歩道付近で細心の注意を払わなければなりません。\n\n### 規制：\n1. **信号のない横断歩道**：歩行者が横断しようとしている場合は、一時停止しなければなりません。\n2. **歩道**：建物に入るために歩道を横切る場合、その前に一時停止しなければなりません。',
          zh: '行人在日本道路上始终享有**最高优先级**。驾驶员在人行横道附近必须极其小心。\n\n### 相关法规：\n1. **无信号灯人行横道**：如果有行人准备过马路，你必须停车让行。\n2. **人行道**：车辆穿过人行道进入建筑物前，必须先停车。',
          pt: 'Os pedestres sempre têm a **prioridade máxima** nas estradas japonesas. Os motoristas devem demonstrar extremo cuidado perto de faixas de pedestres.\n\n### Regulamentações:\n1. **Faixas de Pedestres sem Semáforo**: Você deve parar se um pedestre estiver esperando para atravessar.\n2. **Calçadas**: Veículos que cruzam calçadas para entrar em prédios devem parar totalmente antes de prosseguir.',
        },
        tip: {
          en: 'Failing to stop for pedestrians at a crosswalk can result in heavy fines and points deduction.',
          ja: '横断歩道で歩行者に道を譲らないと、厳しい反則金と違反点数の減点対象となります。',
          zh: '在人行横道前不停车避让行人可能会导致重罚并扣分。',
          pt: 'Não parar para pedestres na faixa pode resultar em multas pesadas e perda de pontos na carteira.',
        },
      },
    ],
  },
  {
    id: 'ch2',
    title: {
      en: 'Chapter 2: Signals and Signs',
      ja: '第2章：信号と標識',
      zh: '第二章：信号与标志',
      pt: 'Capítulo 2: Sinais e Placas',
    },
    sub: {
      en: 'Interpretation of traffic signals, regulatory signs, and road markers.',
      ja: '交通信号、規制標識、道路表示の解釈について。',
      zh: '交通信号灯、指示标志和路面标记的含义与解读。',
      pt: 'Interpretação de sinais de trânsito, placas regulamentares e marcações na pista.',
    },
    icon: 'warning-outline',
    order: 2,
    subtopics: [
      {
        id: 'sub2_1',
        chapterId: 'ch2',
        title: {
          en: '2.1 Traffic Light Signals',
          ja: '2.1 信号機の信号',
          zh: '2.1 交通信号灯',
          pt: '2.1 Sinais Semafóricos',
        },
        order: 1,
        content: {
          en: 'Japanese traffic lights follow standard color rules, but have unique arrow layouts for turns.\n\n### Signal Meanings:\n* **Green**: Go (if safe).\n* **Yellow**: Stop (unless you cannot stop safely before the line).\n* **Red**: Stop completely.\n* **Green Arrows**: You may proceed in the direction of the arrow even if the circular signal is red.',
          ja: '日本の信号機は標準的な色の規則に従いますが、右左折用の独自の矢印信号があります。\n\n### 信号の意味：\n* **青色**：進むことができる（安全な場合）。\n* **黄色**：停止位置で停止しなければならない（安全に停止できない場合を除く）。\n* **赤色**：停止しなければならない。\n* **青色の矢印**：丸信号が赤であっても、矢印の方向へ進むことができます。',
          zh: '日本的交通信号灯遵循标准颜色规则，但对于转弯有特殊的箭头指示设计。\n\n### 信号灯含义：\n* **绿灯**：允许通行（在安全情况下）。\n* **黄灯**：必须停车（除非由于距离太近无法在停止线前安全停车）。\n* **红灯**：必须停止。\n* **绿色箭头灯**：即使圆形红灯亮起，车辆也可以按照箭头指示方向行驶。',
          pt: 'Os semáforos japoneses seguem as regras de cores padrão, mas possuem layouts de seta exclusivos para conversões.\n\n### Significados dos Sinais:\n* **Verde**: Siga (se estiver seguro).\n* **Amarelo**: Pare (a menos que não consiga parar com segurança antes da linha de parada).\n* **Vermelho**: Pare totalmente.\n* **Setas Verdes**: Você pode prosseguir na direção da seta, mesmo se o sinal circular principal estiver vermelho.',
        },
      },
    ],
  },
];

export const mockBooks: Book[] = [
  {
    id: 'book1',
    title: {
      en: 'Japanese Driving Handbook',
      ja: '日本の自動車運転教本',
      zh: '日本汽车驾驶手册',
      pt: 'Manual de Condução Japonês',
    },
    description: {
      en: 'Complete guide to traffic laws, regulations, and driving safety in Japan.',
      ja: '日本の交通法規、規制、運転の安全性に関する完全なガイド。',
      zh: '日本交通法规、条例及驾驶安全完整指南。',
      pt: 'Guia completo para leis de trânsito, regulamentos e segurança ao dirigir no Japão.',
    },
    icon: 'car-sport-outline',
    chapters: mockChapters,
  },
  {
    id: 'book2',
    title: {
      en: 'Motorcycle License Handbook',
      ja: '二輪免許教本',
      zh: '摩托车驾驶执照手册',
      pt: 'Manual de Habilitação de Motocicleta',
    },
    description: {
      en: 'Key safety procedures and handling rules specifically for motorcycle riders.',
      ja: '二輪車ライダー特有の安全手順と取り扱い規則。',
      zh: '针对摩托车骑手的关键安全程序和操作规则。',
      pt: 'Procedimentos de segurança e regras de manuseio específicas para motociclistas.',
    },
    icon: 'bicycle-outline',
    chapters: [
      {
        id: 'ch3',
        title: {
          en: 'Chapter 3: Riding Techniques',
          ja: '第3章：ライディングテクニック',
          zh: '第三章：骑行技巧',
          pt: 'Capítulo 3: Técnicas de Pilotagem',
        },
        sub: {
          en: 'Safety checks and balancing techniques for motorcycles.',
          ja: '二輪車の安全点検とバランス技術について。',
          zh: '摩托车的安全检查与平衡技巧。',
          pt: 'Verificações de segurança e técnicas de equilíbrio para motocicletas.',
        },
        icon: 'rainy-outline',
        order: 1,
        subtopics: [
          {
            id: 'sub3_1',
            chapterId: 'ch3',
            title: {
              en: '3.1 Safe Braking Techniques',
              ja: '3.1 安全なブレーキ操作',
              zh: '3.1 安全制动技巧',
              pt: '3.1 Técnicas de Frenagem Segura',
            },
            order: 1,
            content: {
              en: 'When braking on a motorcycle, apply both front and rear brakes simultaneously. The front brake provides about 70% of the stopping power.',
              ja: '二輪車でブレーキをかけるときは、前後輪のブレーキを同時に作動させます。前輪ブレーキが制動力の約70%を占めます。',
              zh: '摩托车制动时，应同时使用前刹和后刹。前刹提供约70%的制动力。',
              pt: 'Ao frear uma motocicleta, aplique os freios dianteiro e traseiro simultaneamente. O freio dianteiro fornece cerca de 70% da força de parada.',
            }
          }
        ]
      }
    ]
  }
];
