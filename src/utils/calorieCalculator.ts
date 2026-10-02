import { ExerciseConfig, WorkoutSettings } from '../types';

export const EXERCISE_MET_VALUES: Record<string, number> = {
  'dead-bug': 3.8,      // 动态核心抗伸展
  'bird-dog': 4.0,      // 对角线支撑与身体平衡
  'plank': 4.2,         // 全身等长等张核心张力
  'side-plank': 4.0,    // 侧向链与腹斜肌等长支撑
  'glute-bridge': 3.8,  // 臀大肌与后链动力学收缩
};

/**
 * 计算单组动作的有效耗时（秒）
 */
export function getSetDurationSeconds(
  exerciseId: string,
  config: ExerciseConfig
): number {
  if (exerciseId === 'dead-bug' || exerciseId === 'bird-dog') {
    const reps = config.repsPerSide || 8;
    const pace = config.repPaceSeconds || 3.5;
    return Math.round(reps * 2 * pace);
  }
  if (exerciseId === 'plank') {
    return config.holdSeconds || 20;
  }
  if (exerciseId === 'side-plank') {
    const hold = config.holdSeconds || 15;
    return hold * 2; // 两侧
  }
  if (exerciseId === 'glute-bridge') {
    const reps = config.repsTotal || 15;
    const pace = config.repPaceSeconds || 3.0;
    return Math.round(reps * pace);
  }
  return 45;
}

/**
 * 根据 ACSM 代谢当量公式计算单组消耗卡路里
 * Formula: kcal = (MET * 3.5 * weightKg / 200) * (durationSeconds / 60)
 */
export function calculateSetCalories(
  exerciseId: string,
  config: ExerciseConfig,
  weightKg: number = 65
): { durationSeconds: number; calories: number } {
  const met = EXERCISE_MET_VALUES[exerciseId] || 4.0;
  const durationSeconds = getSetDurationSeconds(exerciseId, config);
  const minutes = durationSeconds / 60;
  const kcal = (met * 3.5 * weightKg / 200) * minutes;

  // 保证至少有基础消耗，保留1位小数
  const formattedCalories = Math.max(0.5, Number(kcal.toFixed(1)));

  return {
    durationSeconds,
    calories: formattedCalories,
  };
}

/**
 * 预估按照当前配置全部动作完成后的总消耗卡路里
 */
export function calculateTotalEstimatedCalories(
  settings: WorkoutSettings,
  weightKg: number = 65
): number {
  let totalKcal = 0;
  const exerciseIds = Object.keys(settings.exercises) as Array<keyof WorkoutSettings['exercises']>;

  for (const id of exerciseIds) {
    const config = settings.exercises[id];
    const singleSet = calculateSetCalories(id, config, weightKg);
    totalKcal += singleSet.calories * config.sets;
  }

  return Number(totalKcal.toFixed(1));
}
