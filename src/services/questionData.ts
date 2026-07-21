import { Question } from '../types/quiz';

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    refBookId: 'book1',
    refChapterId: 'ch2',
    refSubtopicId: 'sub2_1',
    text: {
      en: 'What does a flashing red traffic signal mean?',
      ja: '赤色の点滅信号はどういう意味ですか？',
      zh: '红灯闪烁的交通信号意味着什么？',
      pt: 'O que significa um sinal de trânsito vermelho piscante?',
    },
    options: [
      {
        text: {
          en: 'Proceed at slow speed while checking for safety.',
          ja: '安全を確認しながら徐行して進む。',
          zh: '在确认安全的同时减速慢行通过。',
          pt: 'Siga em velocidade reduzida enquanto verifica a segurança.',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Stop completely before the stop line, check safety, and then proceed.',
          ja: '停止線の直前で一時停止し、安全を確認した後に進む。',
          zh: '必须在停止线前完全停车，确认安全后方可通行。',
          pt: 'Pare totalmente antes da linha de parada, verifique a segurança e então prossiga.',
        },
        isCorrect: true,
      },
      {
        text: {
          en: 'You must wait until the signal turns green.',
          ja: '青信号になるまで待たなければならない。',
          zh: '必须等待信号灯变绿。',
          pt: 'Você deve esperar até que o sinal fique verde.',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Proceed only if turning left.',
          ja: '左折する場合のみ進むことができる。',
          zh: '仅在左转时可以通行。',
          pt: 'Prossiga apenas se estiver virando à esquerda.',
        },
        isCorrect: false,
      },
    ],
    explanation: {
      en: 'A flashing red light indicates that you must stop completely before the stop line, perform a safety check, and proceed only when safe.',
      ja: '赤色の点滅信号は、停止線の直前で一時停止し、左右の安全を確認した後に進行できることを意味します。',
      zh: '闪烁的红灯表示您必须在停止线前完全停车，进行安全检查，仅在安全时方可通行。',
      pt: 'Um sinal vermelho piscante indica que você deve parar totalmente antes da linha de parada, fazer a verificação de segurança e prosseguir apenas quando estiver seguro.',
    },
    category: 'Signals',
    difficulty: 'easy',
    variations: [
      {
        text: {
          en: 'What action is required when encountering a blinking red light signal?',
          ja: '赤色の点滅信号に遭遇したとき、どのような行動が必要ですか？',
          zh: '遇到红灯闪烁信号时需要采取什么行动？',
          pt: 'Qual ação é necessária ao encontrar um sinal de luz vermelha piscante?',
        },
        options: [
          {
            text: {
              en: 'Slow down and check for cross traffic before moving.',
              ja: '徐行し、交差する交通を確認してから進む。',
              zh: '减速慢行，并在行进前确认交叉路口交通状况。',
              pt: 'Diminua a velocidade e verifique o tráfego antes de seguir.',
            },
            isCorrect: false,
          },
          {
            text: {
              en: 'Stop at the stop line, perform a safety check, and proceed only when clear.',
              ja: '停止線で一時停止し、安全確認を行って安全な場合にのみ進む。',
              zh: '在停止线处停车，进行安全检查，仅在安全时才可通过。',
              pt: 'Pare na linha de parada, faça a verificação de segurança e prossiga apenas quando estiver livre.',
            },
            isCorrect: true,
          },
          {
            text: {
              en: 'Wait until the signal turns to a steady green lamp.',
              ja: '信号が常時青信号に変わるまで待つ。',
              zh: '等待信号变为持续绿灯。',
              pt: 'Espere até que o sinal mude para uma luz verde constante.',
            },
            isCorrect: false,
          },
          {
            text: {
              en: 'Proceed without stopping as long as no other cars are present.',
              ja: '他車がいない限り、一時停止せずに進む。',
              zh: '只要没有其他车辆，就无需停车直接通行。',
              pt: 'Prossiga sem parar, desde que não haja outros carros presentes.',
            },
            isCorrect: false,
          }
        ],
        explanation: {
          en: 'Blinking red lights indicate a mandatory complete stop and safety check before proceeding.',
          ja: '点滅する赤信号は、進む前に義務的な完全停止と安全確認を要求します。',
          zh: '闪烁的红灯表示在继续行驶前必须完全停车并进行安全检查。',
          pt: 'As luzes vermelhas piscantes indicam uma parada total obrigatória e verificação de segurança antes de prosseguir.',
        }
      }
    ]
  },
  {
    id: 'q2',
    refBookId: 'book1',
    refChapterId: 'ch1', // mapped to General Traffic Rules
    text: {
      en: 'What is the default speed limit for standard passenger vehicles on ordinary public roads in Japan when not otherwise posted?',
      ja: '指定されていない場合、一般道路における普通乗用車の法定最高速度はどれですか？',
      zh: '在没有标明限速标牌的情况下，普通轿车在日本一般公路上的法定最高限速是多少？',
      pt: 'Qual é o limite de velocidade padrão para veículos de passageiros comuns em estradas públicas no Japão quando não houver placa sinalizadora?',
    },
    options: [
      {
        text: {
          en: '40 km/h',
          ja: '40 km/h',
          zh: '40 公里/小时',
          pt: '40 km/h',
        },
        isCorrect: false,
      },
      {
        text: {
          en: '50 km/h',
          ja: '50 km/h',
          zh: '50 公里/小时',
          pt: '50 km/h',
        },
        isCorrect: false,
      },
      {
        text: {
          en: '60 km/h',
          ja: '60 km/h',
          zh: '60 公里/小时',
          pt: '60 km/h',
        },
        isCorrect: true,
      },
      {
        text: {
          en: '80 km/h',
          ja: '80 km/h',
          zh: '80 公里/小时',
          pt: '80 km/h',
        },
        isCorrect: false,
      },
    ],
    explanation: {
      en: 'The statutory speed limit for standard passenger cars on general/ordinary public roads is 60 km/h unless designated otherwise by signs.',
      ja: '標識や表示によって速度が指定されていない一般道路での普通自動車の法定最高速度は60km/hです。',
      zh: '在没有交通标志或标线指定速度的一般公路上，普通汽车的法定最高时速为 60 公里/小时。',
      pt: 'O limite legal de velocidade para automóveis comuns em estradas públicas gerais é de 60 km/h, a menos que indicado de outra forma por placas.',
    },
    category: 'Speed Limits',
    difficulty: 'medium',
  },
  {
    id: 'q3',
    refBookId: 'book1',
    refChapterId: 'ch2',
    refSubtopicId: 'sub2_1',
    text: {
      en: 'When a green arrow signal points to the right, can standard passenger cars make a U-turn?',
      ja: '青色の矢印信号が右を指しているとき、普通自動車は転回（Uターン）できますか？',
      zh: '当绿色指示箭头指向右侧时，普通汽车可以进行U转（掉头）吗？',
      pt: 'Quando um sinal de seta verde aponta para a direita, os carros de passageiros comuns podem fazer um retorno (U-turn)?',
    },
    options: [
      {
        text: {
          en: 'Yes, U-turns are permitted in this direction unless prohibited by signs.',
          ja: 'はい、転回禁止の標識がない限り、転回することができます。',
          zh: '可以，除非有禁止掉头标志，否则可以掉头。',
          pt: 'Sim, retornos são permitidos nesta direção, a menos que proibidos por placas.',
        },
        isCorrect: true,
      },
      {
        text: {
          en: 'No, arrow signals only allow left and right turns.',
          ja: 'いいえ、矢印信号は左右折のみを許可するものです。',
          zh: '不可以，箭头信号仅允许左转和右转。',
          pt: 'Não, os sinais de seta só permitem conversões à esquerda e à direita.',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Only motorcycles can make U-turns.',
          ja: '二輪車のみ転回が許可されている。',
          zh: '仅允许摩托车掉头。',
          pt: 'Apenas motocicletas podem fazer retornos.',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Only commercial vehicles can make U-turns.',
          ja: '大型商用車のみ転回が許可されている。',
          zh: '仅商用大型车辆允许掉头。',
          pt: 'Apenas veículos comerciais podem fazer retornos.',
        },
        isCorrect: false,
      },
    ],
    explanation: {
      en: 'Under Japanese traffic law, a vehicle may perform a U-turn (転回) at a green right-turn arrow, provided there is no sign explicitly prohibiting U-turns.',
      ja: '右折の青矢印信号が表示されている場合、転回（Uターン）禁止の場所でなければ、転回することができます。',
      zh: '根据日本交通法，当右转绿色箭头点亮时，在没有明令禁止掉头的路口，车辆是可以进行掉头（U转）的。',
      pt: 'De acordo com a lei de trânsito japonesa, um veículo pode realizar um retorno (U-turn) em uma seta de conversão à direita verde, desde que não haja placa proibindo explicitamente os retornos.',
    },
    category: 'Signals',
    difficulty: 'hard',
  },
  {
    id: 'q4',
    refBookId: 'book1',
    refChapterId: 'ch1',
    refSubtopicId: 'sub1_2',
    text: {
      en: 'What is the correct action when crossing a sidewalk to enter a driveway?',
      ja: '歩道を横切って道路外の施設（駐車場など）に入る際の正しい行動はどれですか？',
      zh: '穿过人行道进入车道（如停车场等）时的正确做法是什么？',
      pt: 'Qual é a ação correta ao cruzar uma calçada para entrar em uma garagem?',
    },
    options: [
      {
        text: {
          en: 'Slow down and check for pedestrians before crossing.',
          ja: '徐行し、歩行者を確認しながら横切る。',
          zh: '减速慢行，确认没有行人后再穿过。',
          pt: 'Reduza a velocidade e verifique a presença de pedestres antes de atravessar.',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Stop completely just before entering the sidewalk, check safety, and proceed.',
          ja: '歩道に入る直前で一時停止し、安全を確認してから進む。',
          zh: '必须在进入人行道前完全停车，确认安全后慢速穿过。',
          pt: 'Pare totalmente antes de entrar na calçada, verifique a segurança e prossiga.',
        },
        isCorrect: true,
      },
      {
        text: {
          en: 'Sound your horn to warn pedestrians and cross quickly.',
          ja: 'クラクションを鳴らして歩行者に警告し、素早く横切る。',
          zh: '鸣喇叭警告行人并快速通过。',
          pt: 'Buzine para alertar os pedestres e atravesse rapidamente.',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Vehicles have priority, so cross without stopping.',
          ja: '車両が優先なので、停止せずに横切る。',
          zh: '车辆优先，因此无需停车直接穿过。',
          pt: 'Os veículos têm prioridade, portanto cruze sem parar.',
        },
        isCorrect: false,
      },
    ],
    explanation: {
      en: 'Before crossing any sidewalk or side strip to enter/exit a roadway facility, vehicles must stop completely just before the crossing to ensure pedestrian safety.',
      ja: '道路外の場所に入るために歩道や路側帯を横切る場合は、その直前で一時停止し、歩行者の通行を妨げないようにしなければなりません。',
      zh: '为了进入道路外场所（如加油站或停车场）而需要穿过人行道或路侧带时，车辆必须在人行道前完全停车，避让行人，确认安全后再通过。',
      pt: 'Antes de cruzar qualquer calçada ou faixa lateral para entrar/sair de uma garagem ou estabelecimento, os veículos devem parar totalmente logo antes do cruzamento para garantir a segurança dos pedestres.',
    },
    category: 'Pedestrians',
    difficulty: 'medium',
  },
  {
    id: 'q5',
    refBookId: 'book1',
    refChapterId: 'ch1',
    refSubtopicId: 'sub1_1',
    text: {
      en: 'Which side of the road must vehicles keep to in Japan?',
      ja: '日本国内において、車両は道路のどちら側を通行しなければなりませんか？',
      zh: '在日本，车辆应该在道路的哪一侧通行？',
      pt: 'De qual lado da estrada os veículos devem andar no Japão?',
    },
    options: [
      {
        text: {
          en: 'Right side',
          ja: '右側',
          zh: '右侧',
          pt: 'Lado direito',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Left side',
          ja: '左側',
          zh: '左侧',
          pt: 'Lado esquerdo',
        },
        isCorrect: true,
      },
      {
        text: {
          en: 'Center lane only',
          ja: '中央車線のみ',
          zh: '仅中间车道',
          pt: 'Apenas na faixa central',
        },
        isCorrect: false,
      },
      {
        text: {
          en: 'Whichever side has less traffic',
          ja: '交通量が少ない側',
          zh: '车辆较少的一侧',
          pt: 'O lado que tiver menos tráfego',
        },
        isCorrect: false,
      },
    ],
    explanation: {
      en: 'In Japan, the keep-left rule is fundamental: vehicles travel on the left side of the road, while pedestrians keep to the right side.',
      ja: '日本では車両は道路の左側を通行する「左側通行」が原則となっています。（歩行者は右側通行が原則です）',
      zh: '在日本，左侧通行是基本原则：车辆在道路左侧行驶，行人在右侧行走。',
      pt: 'No Japão, a regra de manter-se à esquerda é fundamental: os veículos trafegam pelo lado esquerdo da estrada, enquanto os pedestres andam pela direita.',
    },
    category: 'General Rules',
    difficulty: 'easy',
  },
  {
    id: 'q6',
    refBookId: 'book2',
    refChapterId: 'ch3',
    refSubtopicId: 'sub3_1',
    text: {
      en: 'What is the correct front-to-rear braking force distribution for a motorcycle?',
      ja: '二輪車の正しい前後輪のブレーキ力配分はどれですか？',
      zh: '摩托车前后刹车力度的正确分配比例是多少？',
      pt: 'Qual é a distribuição correta da força de frenagem dianteira e traseira para uma motocicleta?',
    },
    options: [
      {
        text: {
          en: '70% front, 30% rear',
          ja: '前輪70%、後輪30%',
          zh: '前刹70%，后刹30%',
          pt: '70% dianteira, 30% traseira',
        },
        isCorrect: true,
      },
      {
        text: {
          en: '30% front, 70% rear',
          ja: '前輪30%、後輪70%',
          zh: '前刹30%，后刹70%',
          pt: '30% dianteira, 70% traseira',
        },
        isCorrect: false,
      },
      {
        text: {
          en: '50% front, 50% rear',
          ja: '前輪50%、後輪50%',
          zh: '前刹50%，后刹50%',
          pt: '50% dianteira, 50% traseira',
        },
        isCorrect: false,
      },
      {
        text: {
          en: '100% front, 0% rear',
          ja: '前輪100%、後輪0%',
          zh: '前刹100%，后刹0%',
          pt: '100% dianteira, 0% traseira',
        },
        isCorrect: false,
      },
    ],
    explanation: {
      en: 'Because braking transfers the weight of the motorcycle forward, the front brake provides approximately 70% of the effective stopping power.',
      ja: 'ブレーキをかけると二輪車の荷重が前方に移動するため、前輪ブレーキが有効な制動力の約70%を供給します。',
      zh: '由于制动时摩托车的重心会前移，前刹提供了大约70%的有效制动力。',
      pt: 'Como a frenagem transfere o peso da motocicleta para a frente, o freio dianteiro fornece aproximadamente 70% da força de parada efetiva.',
    },
    category: 'Motorcycle Safety',
    difficulty: 'medium',
  }
];
