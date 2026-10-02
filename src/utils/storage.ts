import { WorkoutSettings } from '../types';
import { DEFAULT_WORKOUT_SETTINGS } from '../data/exercises';

export const WORKOUT_STORAGE_KEY = 'core_coach_custom_action_settings_v1';

export function loadSavedWorkoutSettings(): { settings: WorkoutSettings; isSaved: boolean } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { settings: DEFAULT_WORKOUT_SETTINGS, isSaved: false };
  }

  try {
    const raw = localStorage.getItem(WORKOUT_STORAGE_KEY);
    if (!raw) {
      return { settings: DEFAULT_WORKOUT_SETTINGS, isSaved: false };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { settings: DEFAULT_WORKOUT_SETTINGS, isSaved: false };
    }

    // Merge carefully so newly added settings fields get safe defaults
    const merged: WorkoutSettings = {
      ...DEFAULT_WORKOUT_SETTINGS,
      ...parsed,
      hideModelGuide: Boolean(parsed.hideModelGuide),
      autoTransitionAfterExercise: parsed.autoTransitionAfterExercise !== undefined ? Boolean(parsed.autoTransitionAfterExercise) : true,
      betweenExerciseRestSeconds: Number(parsed.betweenExerciseRestSeconds) || 40,
      enableCooldownStretch: parsed.enableCooldownStretch !== undefined ? Boolean(parsed.enableCooldownStretch) : true,
      exercises: {
        'dead-bug': {
          ...DEFAULT_WORKOUT_SETTINGS.exercises['dead-bug'],
          ...(parsed.exercises?.['dead-bug'] || {}),
        },
        'bird-dog': {
          ...DEFAULT_WORKOUT_SETTINGS.exercises['bird-dog'],
          ...(parsed.exercises?.['bird-dog'] || {}),
        },
        'plank': {
          ...DEFAULT_WORKOUT_SETTINGS.exercises['plank'],
          ...(parsed.exercises?.['plank'] || {}),
        },
        'side-plank': {
          ...DEFAULT_WORKOUT_SETTINGS.exercises['side-plank'],
          ...(parsed.exercises?.['side-plank'] || {}),
        },
        'glute-bridge': {
          ...DEFAULT_WORKOUT_SETTINGS.exercises['glute-bridge'],
          ...(parsed.exercises?.['glute-bridge'] || {}),
        },
      },
    };

    return { settings: merged, isSaved: true };
  } catch (err) {
    console.warn('[storage] Error loading saved workout settings:', err);
    return { settings: DEFAULT_WORKOUT_SETTINGS, isSaved: false };
  }
}

export function saveWorkoutSettings(settings: WorkoutSettings): { success: boolean; timestamp: number } {
  const timestamp = Date.now();
  const settingsWithTimestamp: WorkoutSettings = {
    ...settings,
    lastSavedTimestamp: timestamp,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return { success: false, timestamp };
  }

  try {
    localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(settingsWithTimestamp));
    return { success: true, timestamp };
  } catch (err) {
    console.warn('[storage] Error saving workout settings to localStorage:', err);
    return { success: false, timestamp };
  }
}

export function clearSavedWorkoutSettings(): WorkoutSettings {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(WORKOUT_STORAGE_KEY);
    } catch (err) {
      console.warn('[storage] Error clearing workout settings:', err);
    }
  }
  return DEFAULT_WORKOUT_SETTINGS;
}
