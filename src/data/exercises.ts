import { ExerciseGuide, WorkoutSettings } from '../types';

export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettings = {
  voiceEnabled: true,
  selectedVoiceId: 'coach-sunny',
  vibrationEnabled: true,
  soundFxEnabled: true,
  audioVolume: 1.0,
  userWeightKg: 65,
  announceCalories: true,
  calorieDisplayMode: 'total',
  hideModelGuide: false,
  autoTransitionAfterExercise: true, // 动作做完自动倒计时休息，无需手动点击确认
  betweenExerciseRestSeconds: 40,   // 做完一个动作休息40秒自动做下一个动作
  enableCooldownStretch: true,       // 训练做完后自动进入5-7分钟放松拉伸环节
  exercises: {
    'dead-bug': {
      sets: 3,
      repsPerSide: 8,
      repPaceSeconds: 3.5,
      restSeconds: 40,
    },
    'bird-dog': {
      sets: 3,
      repsPerSide: 8,
      repPaceSeconds: 4.0,
      restSeconds: 40,
    },
    'plank': {
      sets: 3,
      holdSeconds: 20,
      repPaceSeconds: 1.0,
      restSeconds: 50,
    },
    'side-plank': {
      sets: 3,
      holdSeconds: 15,
      repPaceSeconds: 1.0,
      restSeconds: 40,
    },
    'glute-bridge': {
      sets: 3,
      repsTotal: 15,
      repPaceSeconds: 3.0,
      restSeconds: 45,
    },
  },
};

export const CORE_EXERCISES: ExerciseGuide[] = [
  {
    id: 'dead-bug',
    name: '死虫式',
    enName: 'Dead Bug',
    target: '腹部核心稳定、控制腰部',
    type: 'reps-unilateral',
    defaultSets: 3,
    repsPerSide: 8,
    repsTotal: 16,
    restSeconds: 40, // 30-45秒区间
    repPaceSeconds: 3.5, // 伸展 1.5s，停顿 0.5s，收回 1.5s
    startPrompt: '第一项训练：死虫式。准备仰卧，屈膝抬腿双手向天花板。',
    switchSidePrompt: '换边！换另一侧手脚进行8次。',
    keyRule: '手脚在移动的时候，腰不要明显拱起来！如果伸到底时腰开始离地，就把动作幅度缩小。',
    startingPose: [
      '躺在地面或瑜伽垫上',
      '双腿抬起，大腿与地面约 90°',
      '小腿与大腿约 90°，像坐在空中',
      '双手伸向天花板',
      '腰部自然贴近地面，不要故意用力死压'
    ],
    actionSteps: [
      '先动右手和左腿：右手向头顶方向慢慢伸，左腿向前下方伸',
      '伸到底部稳定片刻，然后平稳收回到起始位置',
      '完成一侧8次后，换左手和右腿同样进行8次',
      '左右各8次为一组完整动作'
    ],
    breathingTip: '伸手脚的时候呼气，收回来的时候吸气。',
    shakingTip: '如果伸到底后核心开始发抖，只要腰没有明显拱起、动作还能控制且没有疼痛，通常可以继续保持几秒然后回来休息。',
    mistakes: [
      '❌ 追求手脚伸得过远导致腰部悬空离地',
      '❌ 伸展时憋气',
      '❌ 动作过快没有控制核心发力'
    ],
    danceBenefit: '建立仰卧骨盆与下腹深层抗伸展控制，在大幅度躯干舞动中稳固脊柱中立位。'
  },
  {
    id: 'bird-dog',
    name: '鸟狗式',
    enName: 'Bird Dog',
    target: '核心稳定 + 平衡 + 身体协调',
    type: 'reps-unilateral',
    defaultSets: 3,
    repsPerSide: 8,
    repsTotal: 16,
    restSeconds: 40, // 30-45秒
    repPaceSeconds: 4.0, // 伸出 1.5s，顶峰保持 1-2s，收回 1.5s
    startPrompt: '第二项训练：鸟狗式。四肢着地支撑，准备保持身体平直。',
    switchSidePrompt: '换边！换另一侧手脚进行8次。',
    keyRule: '虽然手脚在动，但身体躯干坚如磐石基本不动！不要追求把腿抬得特别高。',
    startingPose: [
      '四肢着地跪姿：双手在肩膀正下方，双膝在髋部正下方',
      '背部保持平直中立，眼睛看地面',
      '身体形成肩膀 → 背部 → 髋部 → 膝盖一条稳定线'
    ],
    actionSteps: [
      '右手向前伸，左腿向后伸（不要追求抬得特别高）',
      '在顶峰水平线保持 1–2秒，感受对角线核心收紧',
      '然后慢慢平稳收回',
      '一侧8次做完后，换左手 + 右腿做8次'
    ],
    breathingTip: '伸展时均匀呼气，顶峰保持时平稳呼吸，收回时吸气。',
    shakingTip: '若单腿伸展出现身体侧倾摇晃，可先缩短伸展距离，先稳住髋部水平。',
    mistakes: [
      '❌ 为了把腿抬高而把腰部扭起来',
      '❌ 身体左右晃荡重心漂移',
      '❌ 脚或手抬得太高导致塌腰',
      '❌ 动作特别快没有顶峰停顿'
    ],
    danceBenefit: '极高价值的舞蹈协调动作！强化对角线动力链传递，提高旋转与跳跃时的身体抗扭转稳定。'
  },
  {
    id: 'plank',
    name: '平板支撑',
    enName: 'Plank',
    target: '整个核心的抗伸展能力',
    type: 'timed-hold',
    defaultSets: 3,
    holdSeconds: 20, // 先做20秒，可渐进
    restSeconds: 50, // 45-60秒
    repPaceSeconds: 1.0,
    startPrompt: '第三项训练：平板支撑20秒。前臂撑地，双腿向后伸直。',
    keyRule: '想象有人准备轻轻推你的肚子，腹部主动收紧准备挨一下轻撞！头背臀腿一条直线。',
    startingPose: [
      '前臂撑地，手肘在肩膀正下方，前臂平贴地面',
      '双腿向后伸直，脚尖点地支撑',
      '身体尽量形成 头 → 背 → 臀 → 腿 一条直线'
    ],
    actionSteps: [
      '收紧臀部与股四头肌，腹部如被撞击般主动紧张收紧',
      '不要拼命向内吸肚子，而是保持抗推张力',
      '坚持20秒倒计时，保持顺畅深呼吸'
    ],
    breathingTip: '千万不要憋气！用鼻吸口呼，小口均匀呼吸，维持腹压。',
    mistakes: [
      '❌ 塌腰：屁股和腰往下掉，压迫腰椎',
      '❌ 撅屁股：屁股抬得特别高，核心失去负荷'
    ],
    danceBenefit: '全身张力整合，消除动作发散，跳舞时让全身成为一个稳固有力的整体。'
  },
  {
    id: 'side-plank',
    name: '侧平板',
    enName: 'Side Plank',
    target: '腹部侧面的核心稳定能力',
    type: 'timed-unilateral',
    defaultSets: 3,
    holdSeconds: 15, // 每侧15秒
    restSeconds: 40, // 30-45秒
    repPaceSeconds: 1.0,
    startPrompt: '第四项训练：侧平板支撑。先从右侧开始，手肘支撑地面。',
    switchSidePrompt: '换边！立刻调整为对侧手肘支撑，准备抬起髋部。',
    keyRule: '头 → 肩膀 → 髋 → 脚形成一条线。不要让髋部慢慢掉下来，若控制不住就放下来休息。',
    startingPose: [
      '侧躺，前臂撑地，肘关节在肩关节正下方',
      '双腿伸直重叠或交错，上位手放在身体侧上方或髋部',
      '【简化版可选】：如果标准版太难，把下方那条腿屈膝撑地，支撑面更大'
    ],
    actionSteps: [
      '侧腹发力将髋部推离地面抬起',
      '保持身体侧面一条斜线 15秒',
      '语音播报换边后，翻转到对侧做 15秒'
    ],
    breathingTip: '侧腹发力时保持胸腔展开，均匀缓慢呼吸。',
    shakingTip: '若侧腰剧烈发抖且髋部下沉，应降级采用屈膝简化版，姿态质量第一。',
    mistakes: [
      '❌ 髋部向下塌陷失去高度',
      '❌ 身体前倾或后仰，肩膀与髋未在同一垂直平面',
      '❌ 为了坚持时间而动作变形硬顶'
    ],
    danceBenefit: '显著增强侧向抗侧屈与胯部倾斜控制，提升摆胯、侧身定点与单腿重心的力量。'
  },
  {
    id: 'glute-bridge',
    name: '臀桥',
    enName: 'Glute Bridge',
    target: '臀部 + 后侧链 + 核心稳定',
    type: 'reps',
    defaultSets: 3,
    repsTotal: 15,
    restSeconds: 45, // 45秒
    repPaceSeconds: 3.0, // 抬起 1s，顶峰停 1s，下落 1s
    startPrompt: '最后一项：臀桥15次。仰卧屈膝，双脚踩地。',
    keyRule: '主要是臀部在收缩发力，而不是腰在拼命往上顶！抬到肩膀-髋部-膝盖一条斜线即可。',
    startingPose: [
      '仰卧在垫子上，双膝弯曲',
      '双脚平踩地面，双脚与髋部同宽',
      '双手自然放在身体两侧',
      '脚跟距离臀部约 1 到 2 个手掌的距离'
    ],
    actionSteps: [
      '脚掌均匀踩地，臀部主动收缩发力将髋部向上推起',
      '抬到 肩膀 → 髋部 → 膝盖 大致形成一条平整斜线',
      '在顶部停顿 1秒，充分夹紧臀部',
      '然后有控制地慢慢下沉接近地面，紧接着重复下一次'
    ],
    breathingTip: '髋部上推时呼气夹臀，顶部停顿，慢慢下落时吸气。',
    mistakes: [
      '❌ 顶部拼命拱腰把肚子挺得过高，变成腰椎代偿',
      '❌ 膝盖内扣或过度外展',
      '❌ 抬起与下落速度过快，没有顶峰收缩'
    ],
    danceBenefit: '跳舞核心基石！强化骨盆前后倾稳定能力，直接决定腿部延伸踢腿与胯部律动的清晰度。'
  }
];
