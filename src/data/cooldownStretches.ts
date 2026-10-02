export interface StretchAction {
  id: string;
  name: string;
  enName: string;
  target: string;
  focusArea: string; // '腹部、脊柱' | '腹部' | '腰背、肩膀' | '臀部、髋部' | '大腿后侧' | '髋前侧' | '肩部、胸部'
  isUnilateral: boolean; // 是否分单双侧 (如臀肌拉伸、腿后侧、髋屈肌、肩部)
  durationPerSide: number; // 秒数
  instruction: string;
  keyRule: string;
  breathingTip: string;
  iconName?: string;
}

export const COOLDOWN_STRETCHES: StretchAction[] = [
  {
    id: 'cat-cow',
    name: '猫牛式',
    enName: 'Cat-Cow Pose',
    target: '放松脊柱、腹部',
    focusArea: '脊柱与腹部柔和延展',
    isUnilateral: false,
    durationPerSide: 40,
    instruction: '四肢着地。吸气时背部慢慢下沉、胸口打开抬头；呼气时背部慢慢拱起低头。连续慢慢做，不需要追求大幅度。',
    keyRule: '跟随缓慢深长的呼吸呼吸，不要硬掰，重点是脊柱波浪般的节律放松。',
    breathingTip: '下沉吸气，拱背呼气，动作慢而平缓。'
  },
  {
    id: 'cobra-pose',
    name: '轻柔眼镜蛇式',
    enName: 'Gentle Cobra Pose',
    target: '温和拉伸腹部',
    focusArea: '腹直肌与腹前壁拉伸',
    isUnilateral: false,
    durationPerSide: 25, // 20-30秒
    instruction: '趴下，双手放在胸部两侧，慢慢撑起上半身。骨盆贴近垫子，双肩下沉远离耳朵。',
    keyRule: '腹部有轻微温和拉伸感即可，不要为了抬得过高而硬折腰椎。',
    breathingTip: '保持平稳深呼吸，胸口自然向前延伸。'
  },
  {
    id: 'child-pose',
    name: '儿童式',
    enName: "Child's Pose",
    target: '放松腰背、肩膀',
    focusArea: '背部肌肉、腰方肌与肩关节减压',
    isUnilateral: false,
    durationPerSide: 50, // 40-60秒
    instruction: '跪姿，臀部向后坐向脚后跟，双臂向前延伸，前额轻贴地面或垫子。',
    keyRule: '核心训练后的黄金放松姿势。整个人彻底沉入垫面，卸去所有肌肉紧张。',
    breathingTip: '深长吸气感受后背膨胀，呼气全身放松下沉。'
  },
  {
    id: 'glute-stretch',
    name: '臀肌拉伸',
    enName: 'Figure 4 Glute Stretch',
    target: '放松臀部、髋部',
    focusArea: '臀大肌与臀深层外旋肌群',
    isUnilateral: true,
    durationPerSide: 30, // 每侧30秒
    instruction: '仰卧，一条腿弯曲，另一条腿脚踝搭在对侧膝盖上方成“4”字型，双手抱住支撑腿大腿后侧，慢慢向胸部方向拉近。',
    keyRule: '刚才做了不少臀桥，这里重点放松臀部外侧与深层。保持骶骨平稳贴垫。',
    breathingTip: '每次呼气时，温和把腿向身体靠近一点点，不要憋气。'
  },
  {
    id: 'hamstring-stretch',
    name: '坐姿腿后侧拉伸',
    enName: 'Seated Hamstring Stretch',
    target: '放松大腿后侧',
    focusArea: '腘绳肌腱与小腿上部',
    isUnilateral: true,
    durationPerSide: 30, // 每侧30秒
    instruction: '坐姿或平躺均可。一条腿向前伸直，另一条腿屈膝脚掌内贴，上身从髋部折叠慢慢向伸直腿方向靠近。',
    keyRule: '绝对不要弹震用力拉扯！保持温和持续的牵拉感即可，脚尖自然放松或轻勾。',
    breathingTip: '吸气延展脊柱，呼气身体从髋部向前微倾。'
  },
  {
    id: 'hip-flexor-stretch',
    name: '髋屈肌拉伸',
    enName: 'Low Lunge Hip Flexor Stretch',
    target: '放松髋前侧',
    focusArea: '髂腰肌与股直肌',
    isUnilateral: true,
    durationPerSide: 30, // 每侧30秒
    instruction: '做一个低位单腿跪姿弓步：前腿屈膝90度，后膝着地向后延伸，躯干保持直立，骨盆微微后倾并轻轻向前推。',
    keyRule: '不要塌腰，腹部微收，感受后腿髋关节前侧被温和拉长。',
    breathingTip: '深长而均匀的呼吸，随着呼气髋部柔和向前下沉。'
  },
  {
    id: 'shoulder-cross-stretch',
    name: '肩部/胸部拉伸',
    enName: 'Cross-Body Shoulder Stretch',
    target: '放松上肢肩背与胸部',
    focusArea: '三角肌后束、上背部与胸大肌',
    isUnilateral: true,
    durationPerSide: 20, // 左右各 15-20秒
    instruction: '一只手臂横跨胸前，另一只手小臂扣住其大臂靠近肘部，轻轻把手臂向身体方向拉近，头部可轻轻看向同侧。',
    keyRule: '沉肩不要耸肩，放松平板支撑和鸟狗式中用力支撑的肩颈肌群。',
    breathingTip: '平缓呼吸，左右均匀释放上肢张力。'
  }
];
