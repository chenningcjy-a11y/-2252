import { DailyTrainingRecord, TrainingCalendarData, TrainingTrack } from '../types';

const CALENDAR_STORAGE_KEY = 'training_calendar_data_v1';
const DAILY_PROMPT_KEY = 'daily_welcome_prompt_date_v1';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatChineseDate(dateStr?: string): { fullDate: string; weekday: string; shortDate: string } {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[d.getDay()] || '';

  return {
    fullDate: `${year}年${month}月${day}日 ${weekday}`,
    weekday,
    shortDate: `${month}月${day}日`,
  };
}

export function loadCalendarData(): TrainingCalendarData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { records: {} };
  }

  try {
    const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) return { records: {} };
    const parsed = JSON.parse(raw);
    return {
      records: parsed?.records || {},
      lastCompletedTrack: parsed?.lastCompletedTrack,
    };
  } catch (err) {
    console.warn('[dailyTracker] Error loading calendar data:', err);
    return { records: {} };
  }
}

export function saveCalendarData(data: TrainingCalendarData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[dailyTracker] Error saving calendar data:', err);
  }
}

export function recordTrainingCompletion(
  track: TrainingTrack, 
  durationSec: number, 
  calories = 0
): { record: DailyTrainingRecord; isNewDayCompletion: boolean } {
  const data = loadCalendarData();
  const today = getTodayDateString();
  const existing = data.records[today];
  const isNewDayCompletion = !existing || (!existing.completedCore && !existing.completedKorean);

  const updatedRecord: DailyTrainingRecord = {
    date: today,
    completedCore: existing ? (existing.completedCore || track === 'core') : track === 'core',
    completedKorean: existing ? (existing.completedKorean || track === 'korean') : track === 'korean',
    coreSeconds: track === 'core' ? ((existing?.coreSeconds || 0) + durationSec) : existing?.coreSeconds,
    coreCalories: track === 'core' ? ((existing?.coreCalories || 0) + calories) : existing?.coreCalories,
    koreanSeconds: track === 'korean' ? ((existing?.koreanSeconds || 0) + durationSec) : existing?.koreanSeconds,
    lastCompletedAt: Date.now(),
  };

  data.records[today] = updatedRecord;
  data.lastCompletedTrack = track;
  saveCalendarData(data);

  return { record: updatedRecord, isNewDayCompletion };
}

/**
 * Check if the daily prompt modal has already been displayed today
 */
export function hasSeenDailyPromptToday(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;
  try {
    const lastPromptDate = localStorage.getItem(DAILY_PROMPT_KEY);
    return lastPromptDate === getTodayDateString();
  } catch {
    return false;
  }
}

export function markDailyPromptSeenToday(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(DAILY_PROMPT_KEY, getTodayDateString());
  } catch {
    // Ignore error
  }
}

/**
 * Alternating recommendation logic:
 * "一天做核心训练，一天练韩语20分钟"
 * If last completed was 'core', recommend 'korean'.
 * If last completed was 'korean', recommend 'core'.
 */
export function getRecommendedTrackToday(customData?: TrainingCalendarData): { recommended: TrainingTrack; reason: string } {
  const data = customData || loadCalendarData();
  const today = getTodayDateString();
  const todayRecord = data.records[today];

  // If today already completed one of them, recommend the other or indicate done
  if (todayRecord?.completedCore && !todayRecord.completedKorean) {
    return {
      recommended: 'korean',
      reason: '今日核心已达标，建议进行20分钟韩语练习，双轨平衡！',
    };
  }
  if (todayRecord?.completedKorean && !todayRecord.completedCore) {
    return {
      recommended: 'core',
      reason: '今日韩语已达标，建议进行核心强化训练！',
    };
  }

  // Check last completed track from previous days
  if (data.lastCompletedTrack === 'core') {
    return {
      recommended: 'korean',
      reason: '上次完成了核心训练，今日按双轨交替计划进行【20分钟韩语沉浸训练】！',
    };
  } else if (data.lastCompletedTrack === 'korean') {
    return {
      recommended: 'core',
      reason: '上次完成了韩语练习，今日按双轨交替计划进行【核心强化训练】！',
    };
  }

  // Default fallback: core training
  return {
    recommended: 'core',
    reason: '今日双轨轮换推荐：【核心强化训练】唤醒身月中轴！',
  };
}

export function getCalendarStats(customData?: TrainingCalendarData): {
  totalDays: number;
  currentStreak: number;
  completedToday: boolean;
  completedCoreToday: boolean;
  completedKoreanToday: boolean;
} {
  const data = customData || loadCalendarData();
  const today = getTodayDateString();
  const records = data.records;

  const datesWithCompletion = Object.keys(records).filter(d => {
    const r = records[d];
    return r && (r.completedCore || r.completedKorean);
  });

  const totalDays = datesWithCompletion.length;

  const todayRecord = records[today];
  const completedToday = Boolean(todayRecord && (todayRecord.completedCore || todayRecord.completedKorean));
  const completedCoreToday = Boolean(todayRecord?.completedCore);
  const completedKoreanToday = Boolean(todayRecord?.completedKorean);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();

  // If not completed today yet, start checking from yesterday to preserve streak
  if (!completedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const ds = `${y}-${m}-${d}`;

    const r = records[ds];
    if (r && (r.completedCore || r.completedKorean)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalDays,
    currentStreak,
    completedToday,
    completedCoreToday,
    completedKoreanToday,
  };
}
