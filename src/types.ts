export type ExerciseType = 'reps-unilateral' | 'timed-hold' | 'timed-unilateral' | 'reps';

export interface ExerciseGuide {
  id: string;
  name: string;
  enName: string;
  target: string;
  type: ExerciseType;
  defaultSets: number;
  repsPerSide?: number;
  repsTotal?: number;
  holdSeconds?: number;
  restSeconds: number;
  repPaceSeconds: number; // e.g. 3.5s or 4s
  switchSidePrompt?: string;
  startPrompt: string;
  keyRule: string;
  startingPose: string[];
  actionSteps: string[];
  breathingTip: string;
  shakingTip?: string;
  mistakes: string[];
  danceBenefit: string;
}

export type WorkoutPhase = 
  | 'idle'                     // Before starting
  | 'prep_countdown'          // 3-2-1 countdown before a set
  | 'exercising'              // Active rep or hold
  | 'switch_side_prep'        // Brief 3s pause when switching sides in unilateral exercise
  | 'resting'                 // Set rest period (30-45s / 50s)
  | 'manual_next_wait'        // All sets of exercise finished! (Only if auto transition is disabled)
  | 'exercise_rest_transition' // Automatically resting 40s between exercises without manual click!
  | 'cooldown_stretching'     // 5-7 mins post-workout cooldown stretching routine
  | 'completed';              // All exercises and cooldown finished

export interface ExerciseConfig {
  sets: number;
  repsPerSide?: number;
  repsTotal?: number;
  holdSeconds?: number;
  repPaceSeconds: number; // 每次动作耗时 (秒)
  restSeconds: number;    // 组间休息间隔 (秒)
}

export interface CompletedSetRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  durationSeconds: number;
  calories: number;
  timestamp: number;
}

export interface WorkoutSettings {
  voiceEnabled: boolean;
  selectedVoiceId: string;        // 选中的教练语音ID (至少10款以上可选)
  vibrationEnabled: boolean;
  soundFxEnabled: boolean;
  audioVolume: number;
  userWeightKg: number;           // 用户体重(kg)，用于精确计算卡路里消耗 (默认65)
  announceCalories: boolean;       // 完成每组时语音播报消耗卡路里
  calorieDisplayMode: 'total' | 'last_set'; // 右上角计数选项显示模式
  hideModelGuide: boolean;        // 在设置中隐藏人物模型指导
  autoTransitionAfterExercise: boolean; // 一个动作做完后自动倒计时休息，不用手动确认 (默认 true)
  betweenExerciseRestSeconds: number;   // 动作间切换休息时长 (默认 40 秒)
  enableCooldownStretch: boolean;       // 训练完成后自动进入5-7分钟拉伸放松环节 (默认 true)
  lastSavedTimestamp?: number;    // 上次自定义动作数据保存的时间戳
  exercises: {
    'dead-bug': ExerciseConfig;
    'bird-dog': ExerciseConfig;
    'plank': ExerciseConfig;
    'side-plank': ExerciseConfig;
    'glute-bridge': ExerciseConfig;
  };
}

export interface WorkoutStats {
  totalSeconds: number;
  completedSets: number;
  totalSets: number;
  totalCalories: number;
  setRecords: CompletedSetRecord[];
  startTime: number | null;
  endTime: number | null;
}

export type TrainingTrack = 'core' | 'korean';

export interface DailyTrainingRecord {
  date: string; // 'YYYY-MM-DD'
  completedCore: boolean;
  completedKorean: boolean;
  coreSeconds?: number;
  coreCalories?: number;
  koreanSeconds?: number;
  lastCompletedAt: number;
}

export interface TrainingCalendarData {
  records: Record<string, DailyTrainingRecord>; // key: 'YYYY-MM-DD'
  lastCompletedTrack?: TrainingTrack;
}
