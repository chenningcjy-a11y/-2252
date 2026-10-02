export interface KoreanItem {
  id: string;
  korean: string;
  pronunciation: string;
  chinese: string;
  usageTip?: string;
  unit: number; // 1, 2, 3, 4
}

export interface KoreanDialogue {
  id: string;
  title: string;
  lines: {
    speaker: string;
    korean: string;
    pronunciation: string;
    chinese: string;
  }[];
}

export interface KoreanUnit {
  unitNumber: number;
  title: string;
  subtitle: string;
  durationMinutes: number;
  description: string;
}

export const KOREAN_UNITS: KoreanUnit[] = [
  {
    unitNumber: 1,
    title: '第一节：高频日常问候与能量短句',
    subtitle: 'Daily Energy & Greetings',
    durationMinutes: 5,
    description: '建立语感发音肌肉记忆，掌握韩国日常生活最高频的打招呼与激励口头语。',
  },
  {
    unitNumber: 2,
    title: '第二节：健身运动与身心自律韩语',
    subtitle: 'Fitness & Mindset Korean',
    durationMinutes: 5,
    description: '掌握深呼吸、核心收紧、坚持动作与自律锻炼的地道韩语表达。',
  },
  {
    unitNumber: 3,
    title: '第三节：实用情境对话与口语影子跟读',
    subtitle: 'Situational Dialogue & Shadowing',
    durationMinutes: 5,
    description: '结合对话情境，开启耳朵听力，模仿自然语调并大声跟读（Shadowing）。',
  },
  {
    unitNumber: 4,
    title: '第四节：闪卡快速记忆与自我听力通关',
    subtitle: 'Flashcards & Memory Check',
    durationMinutes: 5,
    description: '通过翻转卡片与听音辨义，固化今日20分钟记忆，达成今天学习目标！',
  },
];

export const KOREAN_PRACTICE_ITEMS: KoreanItem[] = [
  // Unit 1: 日常问候与能量短句 (5分钟)
  {
    id: 'k1-1',
    unit: 1,
    korean: '안녕하세요!',
    pronunciation: 'an-nyeong-ha-se-yo!',
    chinese: '你好！/ 您好！',
    usageTip: '韩国最经典通用礼貌问候语，见面时微躬致意更地道。',
  },
  {
    id: 'k1-2',
    unit: 1,
    korean: '오늘도 힘차게 화이팅!',
    pronunciation: 'o-neul-do him-cha-ge hwa-i-ting!',
    chinese: '今天也元气满满，加油！',
    usageTip: '화이팅 (Fighting) 源自英语，是韩国最常用的鼓劲鼓励词汇。',
  },
  {
    id: 'k1-3',
    unit: 1,
    korean: '수고하셨습니다.',
    pronunciation: 'su-go-ha-syeot-seum-ni-da.',
    chinese: '辛苦了 / 感谢付出。',
    usageTip: '训练、练习或工作结束告别时对彼此说的尊重体贴用语。',
  },
  {
    id: 'k1-4',
    unit: 1,
    korean: '감사합니다, 좋은 하루 되세요!',
    pronunciation: 'gam-sa-ham-ni-da, jo-eun ha-ru doe-se-yo!',
    chinese: '谢谢你，祝你有美好的一天！',
    usageTip: '温暖充满亲和力的结尾祝福语。',
  },
  {
    id: 'k1-5',
    unit: 1,
    korean: '괜찮아요, 천천히 하면 돼요.',
    pronunciation: 'gwaen-chan-a-yo, cheon-cheon-hi ha-myeon dwae-yo.',
    chinese: '没关系的，慢慢来就好。',
    usageTip: '安慰自己或伙伴不要焦虑，按自己的步调前行。',
  },
  {
    id: 'k1-6',
    unit: 1,
    korean: '내일 또 만나요!',
    pronunciation: 'nae-il tto man-na-yo!',
    chinese: '明天再相见吧！',
    usageTip: '约定明天的训练与相会，养成持续坚持的习惯。',
  },

  // Unit 2: 健身运动与自律表达 (5分钟)
  {
    id: 'k2-1',
    unit: 2,
    korean: '오늘 운동 시작해 볼까요?',
    pronunciation: 'o-neul un-dong si-jak-hae bol-kka-yo?',
    chinese: '今天运动开始吧？',
    usageTip: '운동(运动) 是汉字词，发音和中文非常亲近。',
  },
  {
    id: 'k2-2',
    unit: 2,
    korean: '호흡을 깊게 들이쉬고 천천히 내쉬세요.',
    pronunciation: 'ho-heub-eul gip-ge deu-ri-swi-go cheon-cheon-hi nae-swi-se-yo.',
    chinese: '深长吸气，然后缓慢呼气。',
    usageTip: '호흡(呼吸) 也是汉字词，深长呼吸是核心发力与拉伸的灵魂。',
  },
  {
    id: 'k2-3',
    unit: 2,
    korean: '코어에 단단하게 힘을 주세요.',
    pronunciation: 'ko-eo-e dan-dan-ha-ge him-eul ju-se-yo.',
    chinese: '核心紧紧收紧发力。',
    usageTip: '코어即Core(核心)，힘을 주다指施加力量/发力。',
  },
  {
    id: 'k2-4',
    unit: 2,
    korean: '자세를 바르게 유지하세요.',
    pronunciation: 'ja-se-reul ba-reu-ge yu-ji-ha-se-yo.',
    chinese: '保持姿态端正标准。',
    usageTip: '质量重于数量，动作姿态绝不折腰变形。',
  },
  {
    id: 'k2-5',
    unit: 2,
    korean: '조금만 더 버텨봐요, 할 수 있어요!',
    pronunciation: 'jo-geum-man deo beo-tyeo-bwa-yo, hal su iss-eo-yo!',
    chinese: '再坚持一下下，你能做到的！',
    usageTip: '버티다指支撑/坚持住，平板支撑或力竭边缘给自己的最强暗示。',
  },
  {
    id: 'k2-6',
    unit: 2,
    korean: '몸의 긴장을 풀고 편안하게 스트레칭해요.',
    pronunciation: 'mom-ui gin-jang-eul pul-go pyeon-an-ha-ge seu-teu-re-ching-hae-yo.',
    chinese: '释放身体张力，舒服地拉伸。',
    usageTip: '스트레칭为Stretching(拉伸)，让身心彻底平静。',
  },
  {
    id: 'k2-7',
    unit: 2,
    korean: '매일 꾸준히 하는 게 가장 중요해요.',
    pronunciation: 'mae-il kku-jun-hi ha-neun ge ga-jang jung-yo-hae-yo.',
    chinese: '每天持之以恒才是最重要的。',
    usageTip: '꾸준히(坚持不懈地)，双轨交替的自律底色。',
  },
];

export const KOREAN_DIALOGUES: KoreanDialogue[] = [
  {
    id: 'dialogue-1',
    title: '对话一：问候与今日训练状态',
    lines: [
      {
        speaker: '敏秀 (민수)',
        korean: '오늘 컨디션 어때요?',
        pronunciation: 'o-neul keon-di-syeon eo-ttae-yo?',
        chinese: '今天身体状态感觉怎么样？',
      },
      {
        speaker: '智恩 (지은)',
        korean: '아주 좋아요! 오늘 20분 동안 집중해 볼게요.',
        pronunciation: 'a-ju jo-a-yo! o-neul i-sip-bun dong-an jip-jung-hae bol-ge-yo.',
        chinese: '非常好！今天这20分钟我要全神贯注。',
      },
      {
        speaker: '敏秀 (민수)',
        korean: '멋져요! 무리하지 말고 자기 페이스대로 해요.',
        pronunciation: 'meot-jyeo-yo! mu-ri-ha-ji mal-go ja-gi pe-i-seu-dae-ro hae-yo.',
        chinese: '太酷了！别逞强，按照自己的节奏来。',
      },
    ],
  },
  {
    id: 'dialogue-2',
    title: '对话二：练完后的成就感与明天相约',
    lines: [
      {
        speaker: '教练 (코치)',
        korean: '오늘 연습 끝났어요! 정말 수고 많으셨어요.',
        pronunciation: 'o-neul yeon-seup kkeun-nass-eo-yo! jeong-mal su-go man-eu-syeoss-eo-yo.',
        chinese: '今天的练习结束啦！大家真的辛苦了。',
      },
      {
        speaker: '学员 (회원)',
        korean: '땀도 흘리고 머리도 맑아져서 정말 뿌듯해요!',
        pronunciation: 'ttam-do heul-li-go meo-ri-do malg-a-jyeo-seo jeong-mal ppu-deut-hae-yo!',
        chinese: '流了汗头脑也变清爽了，特别有成就感！',
      },
      {
        speaker: '教练 (코치)',
        korean: '내일도 잊지 말고 꼭 다시 찾아오세요!',
        pronunciation: 'nae-il-do it-ji mal-go kkok da-si cha-ja-o-se-yo!',
        chinese: '明天也别忘了，一定要再来打卡哦！',
      },
    ],
  },
];
