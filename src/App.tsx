/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CORE_EXERCISES, DEFAULT_WORKOUT_SETTINGS } from './data/exercises';
import { CompletedSetRecord, ExerciseGuide, WorkoutPhase, WorkoutSettings } from './types';
import { Human3DExerciseModel } from './components/Human3DExerciseModel';
import { ExerciseGuidanceModal } from './components/ExerciseGuidanceModal';
import { SettingsModal } from './components/SettingsModal';
import { WorkoutCompleteModal } from './components/WorkoutCompleteModal';
import { CalorieDetailModal } from './components/CalorieDetailModal';
import { SubjectSelectionView } from './components/SubjectSelectionView';
import { TrainingCalendarModal } from './components/TrainingCalendarModal';
import { KoreanPracticeView } from './components/KoreanPracticeView';
import { calculateSetCalories } from './utils/calorieCalculator';
import { triggerVibration, speakText, soundEffects, cancelSpeech } from './utils/audioVibration';
import { loadSavedWorkoutSettings, saveWorkoutSettings } from './utils/storage';
import { 
  getTodayDateString, 
  loadCalendarData, 
  recordTrainingCompletion, 
  getRecommendedTrackToday, 
  getCalendarStats 
} from './utils/dailyTracker';
import { TrainingTrack, TrainingCalendarData } from './types';
import { COOLDOWN_STRETCHES, StretchAction } from './data/cooldownStretches';
import { CooldownStretchingView } from './components/CooldownStretchingView';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Settings, 
  BookOpen, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Timer, 
  Flame, 
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  ArrowRight,
  Zap,
  Activity,
  FastForward,
  Eye,
  EyeOff,
  Target,
  Wind,
  HeartHandshake,
  Calendar,
  Languages,
  Dumbbell
} from 'lucide-react';

export default function App() {
  // Settings with per-exercise custom configurations (automatically loaded from persistent storage)
  const [settings, setSettings] = useState<WorkoutSettings>(() => {
    return loadSavedWorkoutSettings().settings;
  });

  // Automatically persist custom workout action configurations whenever settings change
  useEffect(() => {
    saveWorkoutSettings(settings);
  }, [settings]);

  // Workout state
  const [exerciseIndex, setExerciseIndex] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [phase, setPhase] = useState<WorkoutPhase>('idle');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Unilateral tracking
  const [currentSide, setCurrentSide] = useState<'A' | 'B'>('A');
  const [currentRep, setCurrentRep] = useState<number>(1);
  const [repSubPhase, setRepSubPhase] = useState<'extend' | 'hold' | 'return' | 'ready'>('ready');

  // Timers & Stats
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [totalWorkoutSeconds, setTotalWorkoutSeconds] = useState<number>(0);
  const [completedSetsCount, setCompletedSetsCount] = useState<number>(0);

  // Calorie Tracking & Notification
  const [completedSetRecords, setCompletedSetRecords] = useState<CompletedSetRecord[]>([]);
  const [lastSetCalories, setLastSetCalories] = useState<number | null>(null);
  const [showCalorieToast, setShowCalorieToast] = useState<boolean>(false);
  const [showCalorieModal, setShowCalorieModal] = useState<boolean>(false);

  // Cooldown Stretching State (User request: 5-7分钟拉伸放松：猫牛式、眼镜蛇式、儿童式、臀肌、腿后侧、髋屈肌、肩胸)
  const [cooldownStretchIndex, setCooldownStretchIndex] = useState<number>(0);
  const [cooldownSide, setCooldownSide] = useState<'A' | 'B'>('A');

  // Dual-Track & Calendar State (User request: 打开时中心显示要学习的科目，选择后专注执行，不提供顶部切换)
  const [calendarData, setCalendarData] = useState<TrainingCalendarData>(() => loadCalendarData());
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<TrainingTrack | null>(null);
  const [completedTrackForModal, setCompletedTrackForModal] = useState<TrainingTrack>('core');

  const todayDateStr = getTodayDateString();
  const calendarStats = getCalendarStats(calendarData);
  const recommendedTrackInfo = getRecommendedTrackToday(calendarData);

  // Modals
  const [showGuidanceModal, setShowGuidanceModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Computed Total Calories
  const totalCaloriesBurned = completedSetRecords.reduce((acc, r) => acc + r.calories, 0);

  const currentExercise: ExerciseGuide = CORE_EXERCISES[exerciseIndex] || CORE_EXERCISES[0];
  const totalExercises = CORE_EXERCISES.length;

  // Extract active customized configuration for current exercise
  const currentExId = currentExercise.id as keyof WorkoutSettings['exercises'];
  const currentConfig = settings.exercises[currentExId] || DEFAULT_WORKOUT_SETTINGS.exercises[currentExId];

  // Dynamic total sets across all exercises based on current settings
  const totalSetsOverall = Object.values(settings.exercises).reduce((acc, cfg) => acc + cfg.sets, 0);

  // Wake lock ref to keep screen on while exercising on the mat
  const wakeLockRef = useRef<unknown>(null);

  // Acquire wake lock when training begins
  useEffect(() => {
    if (phase !== 'idle' && phase !== 'completed' && 'wakeLock' in navigator) {
      try {
        (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } })
          .wakeLock.request('screen')
          .then(lock => {
            wakeLockRef.current = lock;
          })
          .catch(() => {});
      } catch {
        // Ignore wakeLock errors
      }
    }
    return () => {
      if (wakeLockRef.current && typeof (wakeLockRef.current as { release: () => Promise<void> }).release === 'function') {
        (wakeLockRef.current as { release: () => Promise<void> }).release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [phase]);

  // Stable references to prevent interval cancellation during countdowns & reps
  const totalWorkoutSecondsRef = useRef<number>(0);
  const totalCaloriesBurnedRef = useRef<number>(0);
  const timeRemainingRef = useRef<number>(0);

  useEffect(() => {
    totalWorkoutSecondsRef.current = totalWorkoutSeconds;
  }, [totalWorkoutSeconds]);

  useEffect(() => {
    totalCaloriesBurnedRef.current = totalCaloriesBurned;
  }, [totalCaloriesBurned]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  // Voice wrapper
  const announce = useCallback((text: string, interrupt = true) => {
    if (settings.voiceEnabled) {
      speakText(text, {
        enabled: true,
        interrupt,
        voiceId: settings.selectedVoiceId,
        volume: settings.audioVolume,
      });
    }
  }, [settings.voiceEnabled, settings.selectedVoiceId, settings.audioVolume]);

  // Haptic & Sound wrapper
  const triggerHaptic = useCallback((pattern: number | number[] = 100) => {
    triggerVibration(pattern, settings.vibrationEnabled, settings.soundFxEnabled);
  }, [settings.vibrationEnabled, settings.soundFxEnabled]);

  // START ENTIRE WORKOUT OR START NEXT SET
  const startSetCountdown = useCallback((exIdx: number, setNum: number) => {
    setExerciseIndex(exIdx);
    setCurrentSet(setNum);
    setCurrentSide('A');
    setCurrentRep(1);
    setRepSubPhase('ready');
    setPhase('prep_countdown');
    timeRemainingRef.current = 3;
    setTimeRemaining(3);
    setIsPaused(false);

    const targetEx = CORE_EXERCISES[exIdx];
    soundEffects.playTone('countdown', 0.4);
    announce(`准备开始：${targetEx.name}，第${setNum}组。3，2，1`);
  }, [announce]);

  // Kickoff workout from idle
  const handleStartWorkout = () => {
    setTotalWorkoutSeconds(0);
    totalWorkoutSecondsRef.current = 0;
    startSetCountdown(0, 1);
  };

  // Skip Rest button
  const handleSkipRest = () => {
    if (phase === 'resting') {
      soundEffects.playTone('go', 0.5);
      cancelSpeech();
      startSetCountdown(exerciseIndex, currentSet);
    }
  };

  // Start cooldown stretching routine
  const startCooldownStretching = useCallback((startIndex = 0) => {
    cancelSpeech();
    soundEffects.playTone('complete', 0.6);
    setPhase('cooldown_stretching');
    setCooldownStretchIndex(startIndex);
    setCooldownSide('A');
    setIsPaused(false);

    const firstStretch = COOLDOWN_STRETCHES[startIndex] || COOLDOWN_STRETCHES[0];
    timeRemainingRef.current = firstStretch.durationPerSide;
    setTimeRemaining(firstStretch.durationPerSide);
    announce(`训练完成！现在进入拉伸放松环节。第1项：${firstStretch.name}，保持${firstStretch.durationPerSide}秒。以舒服牵拉为准，跟随呼吸缓慢进行。`);
  }, [announce]);

  // Finish entire core workout (User requested: "训练完成后，提示训练已达标，请明天再来训练")
  const completeCoreWorkout = useCallback(() => {
    recordTrainingCompletion('core', totalWorkoutSecondsRef.current, totalCaloriesBurnedRef.current);
    setCalendarData(loadCalendarData());
    setCompletedTrackForModal('core');
    setPhase('completed');
    soundEffects.playTone('complete', 0.8);
    announce('太棒了！今日核心训练已达标！请明天再来训练！');
  }, [announce]);

  // Finish 20-min Korean Practice
  const handleCompleteKoreanPractice = useCallback((durationSeconds: number) => {
    recordTrainingCompletion('korean', durationSeconds);
    setCalendarData(loadCalendarData());
    setCompletedTrackForModal('korean');
    setTotalWorkoutSeconds(durationSeconds);
    totalWorkoutSecondsRef.current = durationSeconds;
    setPhase('completed');
    soundEffects.playTone('complete', 0.8);
    announce('太棒了！今日20分钟韩语学习已达标，今日学习结束！请明天再来训练！');
  }, [announce]);

  // Next manual exercise button (when manual confirmation is enabled or user clicks in preview)
  const handleProceedToNextExercise = () => {
    cancelSpeech();
    soundEffects.playTone('complete', 0.5);
    const nextIdx = exerciseIndex + 1;
    if (nextIdx < totalExercises) {
      startSetCountdown(nextIdx, 1);
    } else {
      // Finished all core exercises!
      if (settings.enableCooldownStretch) {
        startCooldownStretching(0);
      } else {
        completeCoreWorkout();
      }
    }
  };

  // Finish a set handler
  const handleFinishSet = useCallback(() => {
    setCompletedSetsCount(prev => prev + 1);
    triggerHaptic([200, 100, 200]);
    soundEffects.playTone('rest', 0.6);

    // Calculate calories for this completed set
    const setKcalData = calculateSetCalories(
      currentExercise.id, 
      currentConfig, 
      settings.userWeightKg || 65
    );
    const newRecord: CompletedSetRecord = {
      id: `${currentExercise.id}-s${currentSet}-${Date.now()}`,
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      setNumber: currentSet,
      durationSeconds: setKcalData.durationSeconds,
      calories: setKcalData.calories,
      timestamp: Date.now(),
    };

    setCompletedSetRecords(prev => [...prev, newRecord]);
    setLastSetCalories(setKcalData.calories);
    setShowCalorieToast(true);
    setTimeout(() => {
      setShowCalorieToast(false);
    }, 4000);

    const maxSets = currentConfig.sets;
    const nextSet = currentSet + 1;

    if (nextSet <= maxSets) {
      // Rest between sets of the same exercise
      const restSec = currentConfig.restSeconds;
      setPhase('resting');
      setTimeRemaining(restSec);
      setCurrentSet(nextSet);

      if (settings.announceCalories) {
        announce(`第${currentSet}组完成！消耗约${setKcalData.calories}千卡，休息${restSec}秒，调整呼吸`);
      } else {
        announce(`第${currentSet}组完成！休息${restSec}秒，调整呼吸`);
      }
    } else {
      // ALL SETS FINISHED FOR THIS EXERCISE!
      const nextExIdx = exerciseIndex + 1;

      if (nextExIdx < totalExercises) {
        const nextEx = CORE_EXERCISES[nextExIdx];
        
        // User requested: 不需要点击确认，直接改为休息时间（默认40秒），休息结束后自动进入下一动作
        if (settings.autoTransitionAfterExercise) {
          const restSec = settings.betweenExerciseRestSeconds || 40;
          setPhase('exercise_rest_transition');
          setTimeRemaining(restSec);

          if (settings.announceCalories) {
            announce(`${currentExercise.name}全部组数完成！消耗约${setKcalData.calories}千卡。休息${restSec}秒后，自动开始下一个动作：${nextEx.name}。`);
          } else {
            announce(`${currentExercise.name}全部完成！休息${restSec}秒后，自动开始下一个动作：${nextEx.name}。`);
          }
        } else {
          // Manual fallback if user toggled manual mode in settings
          setPhase('manual_next_wait');
          setTimeRemaining(0);
          if (settings.announceCalories) {
            announce(`第${currentSet}组完成！消耗约${setKcalData.calories}千卡。${currentExercise.name}全部组数已完成！点击屏幕按钮开始下一组训练：${nextEx.name}`);
          } else {
            announce(`${currentExercise.name}全部组数已完成！太棒了！点击屏幕按钮开始下一组训练：${nextEx.name}`);
          }
        }
      } else {
        // ALL 5 CORE EXERCISES COMPLETED!
        soundEffects.playTone('complete', 0.7);
        const projectedTotal = (totalCaloriesBurned + setKcalData.calories).toFixed(1);

        if (settings.enableCooldownStretch) {
          // Enter 5-7 min cooldown stretch routine
          announce(`太棒了！五大核心动作全部顺利完成，累计消耗约${projectedTotal}千卡！现在自动进入放松拉伸，帮助脊柱、腹部与髋臀恢复。`);
          startCooldownStretching(0);
        } else {
          completeCoreWorkout();
        }
      }
    }
  }, [
    currentSet, 
    currentConfig, 
    currentExercise, 
    exerciseIndex, 
    totalExercises, 
    settings.userWeightKg, 
    settings.announceCalories, 
    settings.autoTransitionAfterExercise,
    settings.betweenExerciseRestSeconds,
    settings.enableCooldownStretch,
    totalCaloriesBurned,
    announce, 
    triggerHaptic,
    startCooldownStretching,
    completeCoreWorkout
  ]);

  // SKIP CURRENT SET (User request: "在下面增加跳过当前组选项，可以跳过当前组合")
  const handleSkipCurrentSet = useCallback(() => {
    if (phase === 'idle' || phase === 'completed') return;

    cancelSpeech();
    soundEffects.playTone('switch', 0.5);
    triggerHaptic([120, 60, 120]);
    setCompletedSetsCount(prev => prev + 1);

    const maxSets = currentConfig.sets;
    const nextSet = currentSet + 1;

    if (nextSet <= maxSets) {
      // Still have sets left -> enter rest period before next set
      const restSec = currentConfig.restSeconds;
      setPhase('resting');
      setTimeRemaining(restSec);
      setCurrentSet(nextSet);
      announce(`已跳过当前第${currentSet}组，进入组间休息${restSec}秒`);
    } else {
      // All sets of current exercise completed/skipped
      const nextExIdx = exerciseIndex + 1;

      if (nextExIdx < totalExercises) {
        const nextEx = CORE_EXERCISES[nextExIdx];
        if (settings.autoTransitionAfterExercise) {
          const restSec = settings.betweenExerciseRestSeconds || 40;
          setPhase('exercise_rest_transition');
          setTimeRemaining(restSec);
          announce(`已跳过当前组。${currentExercise.name}完成，休息${restSec}秒后自动开始：${nextEx.name}`);
        } else {
          setPhase('manual_next_wait');
          setTimeRemaining(0);
          announce(`已跳过当前组。${currentExercise.name}完成，请手动点击按钮开始下一项：${nextEx.name}`);
        }
      } else {
        if (settings.enableCooldownStretch) {
          announce('已跳过最后一组，五大核心动作全部结束！现在进入拉伸放松环节。');
          startCooldownStretching(0);
        } else {
          completeCoreWorkout();
        }
      }
    }
  }, [
    phase, 
    currentSet, 
    currentConfig, 
    currentExercise, 
    exerciseIndex, 
    totalExercises, 
    settings.autoTransitionAfterExercise,
    settings.betweenExerciseRestSeconds,
    settings.enableCooldownStretch,
    announce, 
    triggerHaptic,
    startCooldownStretching,
    completeCoreWorkout
  ]);

  // Next / Previous step within Cooldown Stretching
  const handleNextCooldownStretch = useCallback(() => {
    cancelSpeech();
    soundEffects.playTone('switch', 0.5);
    const curr = COOLDOWN_STRETCHES[cooldownStretchIndex];

    if (curr.isUnilateral && cooldownSide === 'A') {
      // Switch to side B
      setCooldownSide('B');
      setTimeRemaining(curr.durationPerSide);
      triggerHaptic([120, 60, 120]);
      announce(`换对侧拉伸，保持${curr.durationPerSide}秒。平稳呼吸。`);
    } else {
      // Next stretch action
      const nextIdx = cooldownStretchIndex + 1;
      if (nextIdx < COOLDOWN_STRETCHES.length) {
        setCooldownStretchIndex(nextIdx);
        setCooldownSide('A');
        const nextStretch = COOLDOWN_STRETCHES[nextIdx];
        setTimeRemaining(nextStretch.durationPerSide);
        soundEffects.playTone('go', 0.5);
        announce(`第${nextIdx + 1}项拉伸：${nextStretch.name}，${nextStretch.target}，保持${nextStretch.durationPerSide}秒。`);
      } else {
        // All cooldown stretches finished!
        completeCoreWorkout();
      }
    }
  }, [cooldownStretchIndex, cooldownSide, announce, triggerHaptic, completeCoreWorkout]);

  const handlePrevCooldownStretch = useCallback(() => {
    cancelSpeech();
    soundEffects.playTone('switch', 0.5);
    const curr = COOLDOWN_STRETCHES[cooldownStretchIndex];

    if (curr.isUnilateral && cooldownSide === 'B') {
      setCooldownSide('A');
      setTimeRemaining(curr.durationPerSide);
      announce(`返回左侧/侧A，保持${curr.durationPerSide}秒。`);
    } else if (cooldownStretchIndex > 0) {
      const prevIdx = cooldownStretchIndex - 1;
      const prevStretch = COOLDOWN_STRETCHES[prevIdx];
      setCooldownStretchIndex(prevIdx);
      setCooldownSide('A');
      setTimeRemaining(prevStretch.durationPerSide);
      announce(`返回第${prevIdx + 1}项：${prevStretch.name}`);
    }
  }, [cooldownStretchIndex, cooldownSide, announce]);

  const handleJumpToCooldownStretch = useCallback((targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= COOLDOWN_STRETCHES.length) return;
    cancelSpeech();
    soundEffects.playTone('go', 0.4);
    const stretch = COOLDOWN_STRETCHES[targetIdx];
    setCooldownStretchIndex(targetIdx);
    setCooldownSide('A');
    setTimeRemaining(stretch.durationPerSide);
    announce(`切换到第${targetIdx + 1}项：${stretch.name}，保持${stretch.durationPerSide}秒。`);
  }, [announce]);

  const handleFinishCooldownEarly = useCallback(() => {
    cancelSpeech();
    completeCoreWorkout();
  }, [completeCoreWorkout]);

  // Manual rep trigger (if user wants to tap rep themselves)
  const handleManualRep = () => {
    if (phase !== 'exercising' || isPaused) return;

    triggerHaptic(120);
    soundEffects.playTone('rep', 0.5);

    if (currentExercise.type === 'reps-unilateral') {
      const repsTarget = currentConfig.repsPerSide || 8;
      if (currentRep < repsTarget) {
        const nextRep = currentRep + 1;
        setCurrentRep(nextRep);
        announce(`${nextRep}`);
      } else {
        // Side finished
        if (currentSide === 'A') {
          // Switch to Side B
          setPhase('switch_side_prep');
          setTimeRemaining(3);
          triggerHaptic([150, 80, 150]);
          soundEffects.playTone('switch', 0.6);
          announce(`换边！准备另一侧进行${repsTarget}次。3，2，1，开始`);
        } else {
          // Both sides finished -> complete set!
          handleFinishSet();
        }
      }
    } else if (currentExercise.type === 'reps') {
      // Bilateral reps (Glute bridge)
      const targetReps = currentConfig.repsTotal || 15;
      if (currentRep < targetReps) {
        const nextRep = currentRep + 1;
        setCurrentRep(nextRep);
        announce(`${nextRep}`);
      } else {
        handleFinishSet();
      }
    }
  };

  // Stable callback refs to ensure the timer interval is NEVER prematurely cleared or restarted
  const announceRef = useRef(announce);
  announceRef.current = announce;

  const triggerHapticRef = useRef(triggerHaptic);
  triggerHapticRef.current = triggerHaptic;

  const handleFinishSetRef = useRef(handleFinishSet);
  handleFinishSetRef.current = handleFinishSet;

  const startSetCountdownRef = useRef(startSetCountdown);
  startSetCountdownRef.current = startSetCountdown;

  const startCooldownStretchingRef = useRef(startCooldownStretching);
  startCooldownStretchingRef.current = startCooldownStretching;

  const handleNextCooldownStretchRef = useRef(handleNextCooldownStretch);
  handleNextCooldownStretchRef.current = handleNextCooldownStretch;

  // Main Execution Engine Timer
  useEffect(() => {
    if (phase === 'idle' || phase === 'completed' || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      // 1. Increment total workout elapsed time
      setTotalWorkoutSeconds(prev => {
        totalWorkoutSecondsRef.current = prev + 1;
        return prev + 1;
      });

      // 2. In manual wait phase, elapsed time increments but no countdown runs
      if (phase === 'manual_next_wait') {
        return;
      }

      // 3. PREP COUNTDOWN (3 -> 2 -> 1 -> START)
      if (phase === 'prep_countdown') {
        const curSec = timeRemainingRef.current;
        if (curSec <= 1) {
          timeRemainingRef.current = 0;
          setTimeRemaining(0);
          setPhase('exercising');
          setCurrentRep(1);
          setRepSubPhase('extend');
          soundEffects.playTone('go', 0.5);
          triggerHapticRef.current(150);

          if (currentExercise.type === 'timed-hold') {
            const holdSec = currentConfig.holdSeconds || 20;
            timeRemainingRef.current = holdSec;
            setTimeRemaining(holdSec);
            announceRef.current(`开始平板支撑，坚持${holdSec}秒！腹部收紧如挨推！`);
          } else if (currentExercise.type === 'timed-unilateral') {
            const holdSec = currentConfig.holdSeconds || 15;
            timeRemainingRef.current = holdSec;
            setTimeRemaining(holdSec);
            announceRef.current(`开始侧平板，支撑侧发力，坚持${holdSec}秒！`);
          } else {
            timeRemainingRef.current = 0;
            setTimeRemaining(0);
            announceRef.current('开始！1');
          }
        } else {
          const nextSec = curSec - 1;
          timeRemainingRef.current = nextSec;
          setTimeRemaining(nextSec);
          soundEffects.playTone('countdown', 0.3);
        }
      }

      // 4. SWITCH SIDE PREP (3 -> 2 -> 1 -> START SIDE B)
      else if (phase === 'switch_side_prep') {
        const curSec = timeRemainingRef.current;
        if (curSec <= 1) {
          timeRemainingRef.current = 0;
          setTimeRemaining(0);
          setPhase('exercising');
          setCurrentSide('B');
          setCurrentRep(1);
          setRepSubPhase('extend');
          soundEffects.playTone('go', 0.5);
          triggerHapticRef.current(150);

          if (currentExercise.type === 'timed-unilateral') {
            const holdSec = currentConfig.holdSeconds || 15;
            timeRemainingRef.current = holdSec;
            setTimeRemaining(holdSec);
            announceRef.current(`对侧开始，坚持${holdSec}秒！保持身体一条线！`);
          } else {
            timeRemainingRef.current = 0;
            setTimeRemaining(0);
            announceRef.current('换边开始！1');
          }
        } else {
          const nextSec = curSec - 1;
          timeRemainingRef.current = nextSec;
          setTimeRemaining(nextSec);
          soundEffects.playTone('countdown', 0.3);
        }
      }

      // 5. RESTING COUNTDOWN (Between sets of same exercise)
      else if (phase === 'resting') {
        const curSec = timeRemainingRef.current;
        if (curSec <= 1) {
          timeRemainingRef.current = 0;
          setTimeRemaining(0);
          startSetCountdownRef.current(exerciseIndex, currentSet);
        } else {
          const nextSec = curSec - 1;
          timeRemainingRef.current = nextSec;
          setTimeRemaining(nextSec);

          if (nextSec === 5) {
            announceRef.current('准备下一组，请就位');
          }
          if (nextSec <= 3 && nextSec >= 1) {
            soundEffects.playTone('countdown', 0.2);
          }
        }
      }

      // 6. TIMED HOLD EXERCISES (Plank & Side Plank)
      else if (phase === 'exercising' && (currentExercise.type === 'timed-hold' || currentExercise.type === 'timed-unilateral')) {
        const curSec = timeRemainingRef.current;
        if (curSec <= 1) {
          timeRemainingRef.current = 0;
          setTimeRemaining(0);

          if (currentExercise.type === 'timed-unilateral' && currentSide === 'A') {
            setPhase('switch_side_prep');
            timeRemainingRef.current = 3;
            setTimeRemaining(3);
            triggerHapticRef.current([150, 80, 150]);
            soundEffects.playTone('switch', 0.6);
            announceRef.current('换边！准备另一侧侧平板');
          } else {
            handleFinishSetRef.current();
          }
        } else {
          const nextSec = curSec - 1;
          timeRemainingRef.current = nextSec;
          setTimeRemaining(nextSec);

          if (nextSec <= 3) {
            soundEffects.playTone('countdown', 0.35);
            triggerHapticRef.current(80);
          } else if (nextSec % 5 === 0) {
            soundEffects.playTone('tick', 0.2);
            triggerHapticRef.current(60);
          }
        }
      }

      // 7. EXERCISE REST TRANSITION COUNTDOWN (Automatic 40s rest between exercises without manual click)
      else if (phase === 'exercise_rest_transition') {
        const curSec = timeRemainingRef.current;
        if (curSec <= 1) {
          timeRemainingRef.current = 0;
          setTimeRemaining(0);

          const nextIdx = exerciseIndex + 1;
          if (nextIdx < totalExercises) {
            startSetCountdownRef.current(nextIdx, 1);
          } else {
            if (settings.enableCooldownStretch) {
              startCooldownStretchingRef.current(0);
            } else {
              setPhase('completed');
            }
          }
        } else {
          const nextSec = curSec - 1;
          timeRemainingRef.current = nextSec;
          setTimeRemaining(nextSec);

          if (nextSec === 5) {
            const nextEx = CORE_EXERCISES[exerciseIndex + 1];
            if (nextEx) {
              announceRef.current(`休息即将结束，准备下一项训练：${nextEx.name}，请就位`);
            }
          }
          if (nextSec <= 3 && nextSec >= 1) {
            soundEffects.playTone('countdown', 0.25);
            triggerHapticRef.current(60);
          }
        }
      }

      // 8. COOLDOWN STRETCHING TIMER COUNTDOWN (5-7 mins post-workout routine)
      else if (phase === 'cooldown_stretching') {
        const curSec = timeRemainingRef.current;
        if (curSec <= 1) {
          timeRemainingRef.current = 0;
          setTimeRemaining(0);
          handleNextCooldownStretchRef.current();
        } else {
          const nextSec = curSec - 1;
          timeRemainingRef.current = nextSec;
          setTimeRemaining(nextSec);

          if (nextSec <= 3 && nextSec >= 1) {
            soundEffects.playTone('countdown', 0.2);
            triggerHapticRef.current(50);
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    phase, 
    isPaused, 
    currentExercise, 
    currentSide, 
    exerciseIndex, 
    currentSet, 
    currentConfig,
    totalExercises,
    settings.enableCooldownStretch
  ]);

  // Automated Metronome for Repetition Exercises (Dead Bug, Bird Dog, Glute Bridge)
  // Ensures steady, rhythmic pacing with tactile vibrations and voice announcements
  useEffect(() => {
    if (
      phase !== 'exercising' || 
      isPaused || 
      currentExercise.type === 'timed-hold' || 
      currentExercise.type === 'timed-unilateral'
    ) {
      return;
    }

    const paceTotalMs = (currentConfig.repPaceSeconds || 3.5) * 1000;
    const extendMs = paceTotalMs * 0.45;
    const holdMs = paceTotalMs * 0.25;

    let holdTimeout: NodeJS.Timeout;
    let returnTimeout: NodeJS.Timeout;
    let finishRepTimeout: NodeJS.Timeout;

    // Sub-phase: extend
    setRepSubPhase('extend');

    // Sub-phase: hold (trigger vibration on hold)
    holdTimeout = setTimeout(() => {
      setRepSubPhase('hold');
      triggerHapticRef.current(90);
      soundEffects.playTone('tick', 0.3);
    }, extendMs);

    // Sub-phase: return
    returnTimeout = setTimeout(() => {
      setRepSubPhase('return');
    }, extendMs + holdMs);

    // Rep completed -> advance rep
    finishRepTimeout = setTimeout(() => {
      triggerHapticRef.current(120);
      soundEffects.playTone('rep', 0.45);

      if (currentExercise.type === 'reps-unilateral') {
        const repsTarget = currentConfig.repsPerSide || 8;
        if (currentRep < repsTarget) {
          const nextR = currentRep + 1;
          setCurrentRep(nextR);
          announceRef.current(`${nextR}`);
        } else {
          // Reached target reps for this side
          if (currentSide === 'A') {
            setPhase('switch_side_prep');
            timeRemainingRef.current = 3;
            setTimeRemaining(3);
            triggerHapticRef.current([150, 80, 150]);
            soundEffects.playTone('switch', 0.6);
            announceRef.current(`换边！准备另一侧进行${repsTarget}次`);
          } else {
            handleFinishSetRef.current();
          }
        }
      } else if (currentExercise.type === 'reps') {
        const targetReps = currentConfig.repsTotal || 15;
        if (currentRep < targetReps) {
          const nextR = currentRep + 1;
          setCurrentRep(nextR);
          announceRef.current(`${nextR}`);
        } else {
          handleFinishSetRef.current();
        }
      }
    }, paceTotalMs);

    return () => {
      clearTimeout(holdTimeout);
      clearTimeout(returnTimeout);
      clearTimeout(finishRepTimeout);
    };
  }, [
    phase, 
    isPaused, 
    currentRep, 
    currentSide, 
    currentExercise, 
    currentConfig
  ]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-zinc-950 pb-8 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between w-full max-w-full overflow-x-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
            {selectedTrack === 'korean' ? '한' : 'C'}
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-xs sm:text-base md:text-lg tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
              <span>
                {selectedTrack === 'korean' 
                  ? '韩语自主学习监督' 
                  : selectedTrack === 'core' 
                    ? '核心动作监督器' 
                    : '双轨自律计划'}
              </span>
              {selectedTrack && (
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 hidden xs:inline-flex">
                  {selectedTrack === 'core' ? '核心修复' : '韩语20分钟'}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-zinc-400 hidden md:block truncate">
              {selectedTrack === 'korean'
                ? '20分钟专注倒计时 · 结束自动提醒达标'
                : selectedTrack === 'core'
                  ? '5大核心动作 · 灵动节拍 · 动态语音 · 组间监督'
                  : '专注每日训练 · 一天核心强化，一天韩语沉浸20分钟'}
            </p>
          </div>
        </div>

        {/* Action / Settings controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* Re-select subject button when a track is active */}
          {selectedTrack && (
            <button
              id="reselect-subject-header-btn"
              onClick={() => {
                if (phase !== 'idle' && phase !== 'completed') {
                  if (window.confirm('当前正在训练中，确定要退出并重新选择今日科目吗？')) {
                    cancelSpeech();
                    setPhase('idle');
                    setSelectedTrack(null);
                  }
                } else {
                  setSelectedTrack(null);
                }
              }}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition flex items-center gap-1.5"
              title="重新选择今日学习/训练科目"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">更换科目</span>
            </button>
          )}

          {/* Calorie Counter Option (Only when in core workout track) */}
          {selectedTrack === 'core' && (
            <div className="relative">
              <button
                id="calorie-counter-top-btn"
                onClick={() => setShowCalorieModal(true)}
                className={`group relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition ${
                  showCalorieToast 
                    ? 'bg-zinc-800 border-white text-white ring-2 ring-white/30 shadow-md' 
                    : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-600 text-zinc-200'
                }`}
                title="卡路里计数选项 (点击查看消耗明细与设置)"
              >
                <Flame className={`w-3.5 h-3.5 text-zinc-300 fill-current shrink-0 ${showCalorieToast ? 'animate-pulse text-white' : ''}`} />
                <div className="flex items-baseline gap-0.5 sm:gap-1 font-mono">
                  <span className="font-black text-white text-xs sm:text-sm">
                    {settings.calorieDisplayMode === 'last_set' && lastSetCalories !== null
                      ? `+${lastSetCalories.toFixed(1)}`
                      : totalCaloriesBurned.toFixed(1)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 font-sans">
                    {settings.calorieDisplayMode === 'last_set' ? '组' : 'kcal'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 transition ml-0.5 hidden xs:inline-block" />

                {/* Floating Badge on set finish */}
                {showCalorieToast && lastSetCalories !== null && (
                  <span className="absolute -bottom-8 right-0 z-50 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-white text-zinc-950 font-black text-[11px] shadow-lg animate-bounce border border-zinc-300">
                    +{lastSetCalories.toFixed(1)} kcal!
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Total Elapsed Timer (Only in core track) */}
          {selectedTrack === 'core' && (
            <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-zinc-900 rounded-xl text-[11px] sm:text-xs font-mono text-zinc-300 border border-zinc-800">
              <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 shrink-0" />
              <span>{formatTime(totalWorkoutSeconds)}</span>
            </div>
          )}

          {/* Quick Voice Toggle (Only in core track) */}
          {selectedTrack === 'core' && (
            <button
              id="quick-voice-toggle-btn"
              onClick={() => setSettings(s => ({ ...s, voiceEnabled: !s.voiceEnabled }))}
              className={`p-1.5 sm:p-2 rounded-lg border transition ${
                settings.voiceEnabled 
                  ? 'bg-white text-zinc-950 border-white font-bold' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400'
              }`}
              title={settings.voiceEnabled ? '语音开启' : '语音静音'}
            >
              {settings.voiceEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          )}

          {/* Quick 3D Model Guide Visibility Toggle (Only in core track) */}
          {selectedTrack === 'core' && (
            <button
              id="quick-model-toggle-btn"
              onClick={() => setSettings(s => ({ ...s, hideModelGuide: !s.hideModelGuide }))}
              className={`p-1.5 sm:p-2 rounded-lg border transition flex items-center gap-1.5 text-xs ${
                settings.hideModelGuide
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  : 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700'
              }`}
              title={settings.hideModelGuide ? '人物模型指导已隐藏（极简模式），点击恢复显示' : '人物模型指导显示中，点击隐藏'}
            >
              {settings.hideModelGuide ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-200" />}
              <span className="hidden lg:inline font-semibold text-[11px]">
                {settings.hideModelGuide ? '模型已隐藏' : '3D模型'}
              </span>
            </button>
          )}

          {/* Action Guide Button (Only in core track) */}
          {selectedTrack === 'core' && (
            <button
              id="open-guidance-btn"
              onClick={() => setShowGuidanceModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-zinc-200 border border-zinc-800 transition flex items-center gap-1.5"
              title="动作指南"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden sm:inline">动作指南</span>
            </button>
          )}

          {/* Calendar Button (Always accessible) */}
          <button
            id="open-calendar-top-btn"
            onClick={() => setShowCalendarModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5"
            title="训练打卡日历 (点击查看已经训练完成的天)"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="hidden sm:inline">打卡日历</span>
            {calendarStats.totalDays > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-700">
                {calendarStats.totalDays}天
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            id="open-settings-btn"
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition shrink-0"
            title="监督器参数设置 (时间/次数/休息)"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden min-w-0">
        {!selectedTrack ? (
          /* Center display of subject selection upon opening */
          <SubjectSelectionView
            recommendedTrack={recommendedTrackInfo.recommended}
            recommendationReason={recommendedTrackInfo.reason}
            calendarStats={calendarStats}
            todayDateStr={todayDateStr}
            onSelectTrack={(track) => {
              setSelectedTrack(track);
            }}
            onOpenCalendar={() => setShowCalendarModal(true)}
          />
        ) : selectedTrack === 'korean' ? (
          /* Korean Practice Mode - No top switcher bar */
          <KoreanPracticeView
            onCompletePractice={handleCompleteKoreanPractice}
            onExitPractice={() => setSelectedTrack(null)}
            voiceVolume={settings.audioVolume}
          />
        ) : (
          /* Core Workout Mode - No top switcher bar */
          <>
            {/* Overall Progress Bar */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-zinc-300" />
              <span>
                {phase === 'cooldown_stretching' 
                  ? `🧘 训练后拉伸放松：第 ${cooldownStretchIndex + 1} / ${COOLDOWN_STRETCHES.length} 项 · ${COOLDOWN_STRETCHES[cooldownStretchIndex]?.name || ''}`
                  : phase === 'exercise_rest_transition'
                    ? `💆 动作间休息过渡中（${timeRemaining}秒后自动开始第 ${exerciseIndex + 2} 项：${CORE_EXERCISES[exerciseIndex + 1]?.name || ''}）`
                    : `当前动作：第 ${exerciseIndex + 1} / ${totalExercises} 项 · ${currentExercise.name}`}
              </span>
            </span>
            <span className="font-mono text-zinc-400">
              {phase === 'cooldown_stretching'
                ? `拉伸进度 ${cooldownStretchIndex + 1}/${COOLDOWN_STRETCHES.length}`
                : `已完成 ${completedSetsCount} / ${totalSetsOverall} 组`}
            </span>
          </div>

          {/* Step Segmented Bar (5 Core Exercises + 1 Optional Cooldown Stretch) */}
          <div className={`grid gap-1.5 h-2 rounded-full overflow-hidden bg-zinc-950 p-0.5 ${settings.enableCooldownStretch ? 'grid-cols-6' : 'grid-cols-5'}`}>
            {CORE_EXERCISES.map((ex, idx) => {
              const isPassed = idx < exerciseIndex || phase === 'cooldown_stretching';
              const isCurrent = idx === exerciseIndex && phase !== 'cooldown_stretching';
              return (
                <div
                  key={ex.id}
                  className={`h-full rounded-sm transition-all duration-500 ${
                    isPassed
                      ? 'bg-zinc-400'
                      : isCurrent
                        ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                        : 'bg-zinc-800/60'
                  }`}
                  title={`${idx + 1}. ${ex.name}`}
                />
              );
            })}
            {settings.enableCooldownStretch && (
              <div
                className={`h-full rounded-sm transition-all duration-500 ${
                  phase === 'cooldown_stretching'
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                    : 'bg-zinc-800/60'
                }`}
                title="6. 训练后拉伸放松 (5-7min)"
              />
            )}
          </div>

          {/* Exercise Step Pills */}
          <div className={`grid gap-1 pt-2.5 text-center text-[10px] sm:text-xs font-medium ${settings.enableCooldownStretch ? 'grid-cols-6' : 'grid-cols-5'}`}>
            {CORE_EXERCISES.map((ex, idx) => {
              const isCurrent = idx === exerciseIndex && phase !== 'cooldown_stretching';
              const isPassed = idx < exerciseIndex || phase === 'cooldown_stretching';
              return (
                <div key={ex.id} className="min-w-0">
                  <button
                    id={`jump-step-${ex.id}`}
                    onClick={() => {
                      if (phase === 'idle' || confirm(`切换到 ${ex.name}？`)) {
                        cancelSpeech();
                        setExerciseIndex(idx);
                        setCurrentSet(1);
                        setPhase('idle');
                      }
                    }}
                    className={`w-full py-1 px-0.5 rounded-lg transition truncate block ${
                      isCurrent
                        ? 'text-white font-bold bg-zinc-800 border border-zinc-700'
                        : isPassed
                          ? 'text-zinc-500 line-through'
                          : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {idx + 1}. {ex.name}
                  </button>
                </div>
              );
            })}
            {settings.enableCooldownStretch && (
              <div className="min-w-0">
                <button
                  id="jump-step-cooldown"
                  onClick={() => {
                    if (phase === 'cooldown_stretching') return;
                    if (phase === 'idle' || confirm('直接进入 5–7分钟拉伸放松环节？')) {
                      startCooldownStretching(0);
                    }
                  }}
                  className={`w-full py-1 px-0.5 rounded-lg transition truncate block ${
                    phase === 'cooldown_stretching'
                      ? 'text-white font-bold bg-zinc-800 border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="训练后拉伸放松 (5-7min)"
                >
                  6. 拉伸放松
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= HERO ACTIVE WORKOUT SUPERVISOR CARD ================= */}
        {phase === 'idle' ? (
          /* IDLE / READY TO START CARD */
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold mb-4">
              <Zap className="w-3.5 h-3.5 text-zinc-300" />
              <span>灵动节拍 · 动态语音 · 触感震动</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
              5个核心动作 · 全程智能监督训练
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-6 leading-relaxed">
              严格遵循教练标准动作次序：死虫式 → 鸟狗式 → 平板支撑 → 侧平板 → 臀桥。每个动作的单侧次数、耗时与组间休息时间均可在设置中灵活调整，组间由语音监督休息，动作完成后手动切换。
            </p>

            {/* Quick Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6 text-left">
              <div className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
                <div className="text-[11px] text-zinc-400">死虫式设置</div>
                <div className="text-sm font-bold text-white font-mono">
                  {settings.exercises['dead-bug'].repsPerSide}侧×2 · {settings.exercises['dead-bug'].sets}组
                </div>
              </div>
              <div className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
                <div className="text-[11px] text-zinc-400">平板支撑设置</div>
                <div className="text-sm font-bold text-white font-mono">
                  {settings.exercises['plank'].holdSeconds}秒 · 歇{settings.exercises['plank'].restSeconds}s
                </div>
              </div>
              <div className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
                <div className="text-[11px] text-zinc-400">触感与音色</div>
                <div className="text-sm font-bold text-zinc-200">13款自然音色+震动</div>
              </div>
              <div className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
                <div className="text-[11px] text-zinc-400">训练质量</div>
                <div className="text-sm font-bold text-zinc-200">抗伸展&骨盆稳定</div>
              </div>
            </div>

            {/* 3D Human Biomechanical Preview or Hidden Banner */}
            {settings.hideModelGuide ? (
              <div className="max-w-2xl mx-auto mb-8 p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-700 flex items-center justify-center shrink-0">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>3D 人物模型指导已在设置中隐藏</span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-zinc-700">
                        极简省电模式
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      训练界面将专注于计时、节拍震动与标准动作要点监督，可随时在右上角设置中重新开启 3D 人物模型。
                    </p>
                  </div>
                </div>
                <button
                  id="unhide-model-idle-btn"
                  onClick={() => setSettings(s => ({ ...s, hideModelGuide: false }))}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition shrink-0 flex items-center justify-center gap-1.5"
                  title="恢复显示 3D 人物模型"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-300" />
                  <span>恢复显示3D模型</span>
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto mb-8 text-left">
                <div className="flex items-center justify-between px-2 mb-2 text-xs">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>3D 生物力学真人动作模型 · {currentExercise.name}</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">支持 360° 拖拽观察与透视切换</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                  <Human3DExerciseModel
                    exercise={currentExercise}
                    phase="exercising"
                    currentSide="A"
                    currentRep={1}
                    totalRepsCurrentSide={currentConfig.repsPerSide || 8}
                    repSubPhase="ready"
                    timeRemaining={0}
                  />
                </div>
              </div>
            )}

            {/* Buttons row: Start and Settings */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="start-workout-main-btn"
                onClick={handleStartWorkout}
                className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl text-lg sm:text-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.98] inline-flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>开始训练 · 第一项：死虫式</span>
              </button>
              <button
                id="open-settings-idle-btn"
                onClick={() => setShowSettingsModal(true)}
                className="w-full sm:w-auto px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded-2xl text-base border border-zinc-800 transition flex items-center justify-center gap-2"
              >
                <Settings className="w-5 h-5 text-zinc-400" />
                <span>自定义动作时间与次数</span>
              </button>
            </div>
          </div>
        ) : phase === 'cooldown_stretching' ? (
          /* COOLDOWN STRETCHING VIEW (5-7 mins post-workout routine) */
          <CooldownStretchingView
            stretchIndex={cooldownStretchIndex}
            currentSide={cooldownSide}
            timeRemaining={timeRemaining}
            isPaused={isPaused}
            totalElapsedSeconds={totalWorkoutSeconds}
            onTogglePause={() => {
              const next = !isPaused;
              setIsPaused(next);
              if (next) {
                cancelSpeech();
                soundEffects.playTone('tick', 0.5);
              } else {
                soundEffects.playTone('go', 0.5);
              }
            }}
            onSkipCurrentStretch={handleNextCooldownStretch}
            onPreviousStretch={handlePrevCooldownStretch}
            onFinishCooldown={handleFinishCooldownEarly}
            onSelectStretch={handleJumpToCooldownStretch}
          />
        ) : phase === 'exercise_rest_transition' ? (
          /* AUTOMATIC EXERCISE REST TRANSITION CARD (User request: 不用确认了，直接改为休息时间就好了) */
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-9 text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Ambient subtle breath pulse ring */}
            <div className="w-20 h-20 rounded-3xl bg-zinc-800 text-white flex items-center justify-center mx-auto mb-4 border border-zinc-700 shadow-inner">
              <Timer className="w-10 h-10 text-zinc-200 animate-pulse" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold font-mono border border-zinc-700">
                {currentExercise.name} 全部组数已完成
              </span>
              <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold font-mono border border-zinc-700 inline-flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-current text-zinc-400" />
                <span>累计 {totalCaloriesBurned.toFixed(1)} kcal</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              动作完成 · 自动休息过渡中
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
              无需爬起来点击屏幕，躺在垫子上充分深长呼吸、平复心率。倒计时结束将自动开始下一项。
            </p>

            {/* Giant Rest Countdown Timer */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm mx-auto mb-6">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1">
                休息倒计时 · 自动切入
              </div>
              <div className="text-7xl sm:text-8xl font-black font-mono text-white tracking-tight">
                {timeRemaining}
                <span className="text-2xl text-zinc-500 ml-1">秒</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 mt-2">
                <Wind className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                <span>深长吸气感受腹部膨胀，缓慢呼气全身放松</span>
              </div>
            </div>

            {/* Next exercise preview */}
            {exerciseIndex + 1 < totalExercises ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-w-md mx-auto text-left mb-6">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-1">
                  <span>下一项动作预告</span>
                  <span className="font-mono text-zinc-500">
                    {exerciseIndex + 2} / {totalExercises}
                  </span>
                </div>
                <div className="text-lg font-black text-white">
                  {CORE_EXERCISES[exerciseIndex + 1].name}
                </div>
                <div className="text-xs text-zinc-300 font-medium mt-0.5">
                  🎯 {CORE_EXERCISES[exerciseIndex + 1].target}
                </div>
                <p className="text-xs text-zinc-400 mt-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 leading-relaxed">
                  💡 {CORE_EXERCISES[exerciseIndex + 1].keyRule}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-w-md mx-auto text-center mb-6">
                <p className="text-xs text-zinc-300 font-medium">
                  🎉 这是最后一组核心动作！休息结束后将自动进入 5–7分钟黄金拉伸放松环节。
                </p>
              </div>
            )}

            {/* Quick Actions: Skip Rest immediately or adjust rest duration */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                id="skip-transition-rest-btn"
                onClick={() => {
                  cancelSpeech();
                  soundEffects.playTone('go', 0.5);
                  const nextIdx = exerciseIndex + 1;
                  if (nextIdx < totalExercises) {
                    startSetCountdown(nextIdx, 1);
                  } else {
                    if (settings.enableCooldownStretch) {
                      startCooldownStretching(0);
                    } else {
                      setPhase('completed');
                    }
                  }
                }}
                className="w-full sm:w-auto flex-1 py-3.5 px-6 bg-zinc-100 hover:bg-white text-zinc-950 font-black rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg"
              >
                <span>提前结束休息，立即开始下一项</span>
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                id="pause-transition-rest-btn"
                onClick={() => {
                  const next = !isPaused;
                  setIsPaused(next);
                  if (next) cancelSpeech();
                }}
                className="w-full sm:w-auto py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold rounded-2xl border border-zinc-700 transition"
              >
                {isPaused ? '恢复倒计时' : '暂停休息'}
              </button>
            </div>
          </div>
        ) : phase === 'manual_next_wait' ? (
          /* MANUAL NEXT EXERCISE TRANSITION CARD */
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-100 flex items-center justify-center mx-auto mb-4 border border-zinc-700">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <div className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 text-xs font-bold font-mono border border-zinc-700">
                {currentConfig.sets} / {currentConfig.sets} 组全部完成
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold font-mono">
                <Flame className="w-3.5 h-3.5 fill-current text-zinc-300" />
                <span>累计消耗 {totalCaloriesBurned.toFixed(1)} kcal</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {currentExercise.name} {currentConfig.sets}组全部完成
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
              请深呼吸，稍作调整。准备好后，点击下方按钮开启下一个核心动作！
            </p>

            {/* Next exercise preview card */}
            {exerciseIndex + 1 < totalExercises && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-w-md mx-auto text-left mb-6">
                <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
                  下一项动作预告
                </div>
                <div className="text-lg font-black text-white">
                  {exerciseIndex + 2}. {CORE_EXERCISES[exerciseIndex + 1].name}
                </div>
                <div className="text-xs text-zinc-300 font-medium mt-0.5">
                  🎯 {CORE_EXERCISES[exerciseIndex + 1].target}
                </div>
                <p className="text-xs text-zinc-400 mt-2 italic bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                  💡 {CORE_EXERCISES[exerciseIndex + 1].keyRule}
                </p>
              </div>
            )}

            {/* Manual Proceed Button */}
            <button
              id="proceed-to-next-exercise-btn"
              onClick={handleProceedToNextExercise}
              className="w-full max-w-md py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl text-lg transition shadow-xl flex items-center justify-center gap-3 mx-auto transform hover:scale-[1.01] active:scale-[0.98]"
            >
              <span>开始下一组训练：{exerciseIndex + 1 < totalExercises ? CORE_EXERCISES[exerciseIndex + 1].name : '完成结课'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* ACTIVE SUPERVISOR INTERACTION PANEL */
          <div className="space-y-4">
            {/* Top Exercise Details Header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                    动作 {exerciseIndex + 1} / {totalExercises}
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                    第 {currentSet} / {currentConfig.sets} 组
                  </span>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="text-[11px] text-zinc-400 hover:text-white hover:underline flex items-center gap-1 font-medium ml-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>调节参数</span>
                  </button>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentExercise.name}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {currentExercise.target}
                </p>
              </div>

              {/* Pause / Resume & Status */}
              <div className="flex items-center gap-2">
                <button
                  id="pause-resume-btn"
                  onClick={() => {
                    const next = !isPaused;
                    setIsPaused(next);
                    if (next) {
                      cancelSpeech();
                      soundEffects.playTone('tick', 0.5);
                    } else {
                      soundEffects.playTone('go', 0.5);
                      announce('继续训练');
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition border ${
                    isPaused
                      ? 'bg-white border-white text-zinc-950 shadow-md'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                  }`}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? '恢复训练' : '暂停'}</span>
                </button>
              </div>
            </div>

            {/* Middle Active Stage */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch w-full min-w-0">
              
              {/* LEFT / TOP: 动作监督与计数 (Action Supervision & Counting HUD) */}
              <div className="md:col-span-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden order-1 min-w-0">
                {/* Background Ambient Subtle Glow */}
                <div 
                  className="absolute inset-0 opacity-5 pointer-events-none bg-white"
                />

                {/* Status Badge & Header */}
                <div className="flex items-center justify-between text-xs z-10 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span className="font-bold text-white tracking-wide">
                      {phase === 'prep_countdown' && '⏳ 准备就位倒计时'}
                      {phase === 'switch_side_prep' && '🔄 换边倒计时'}
                      {phase === 'resting' && '💆 组间呼吸与恢复'}
                      {phase === 'exercising' && '🔥 动作标准执行中'}
                    </span>
                  </div>
                  {isPaused ? (
                    <span className="bg-zinc-800 text-zinc-200 border border-zinc-600 px-2.5 py-0.5 rounded text-[11px] font-bold animate-pulse">
                      已暂停
                    </span>
                  ) : (
                    <span className="font-mono text-zinc-400 text-[11px]">
                      节拍: {currentConfig.repPaceSeconds}s
                    </span>
                  )}
                </div>

                {/* Big Metric Display & Counter */}
                <div className="my-5 text-center z-10">
                  {phase === 'prep_countdown' ? (
                    <div>
                      <div className="text-6xl sm:text-7xl font-black font-mono text-white animate-bounce">
                        {timeRemaining}
                      </div>
                      <p className="text-sm font-medium text-zinc-400 mt-2">
                        准备起始姿势 · 3秒后开始
                      </p>
                    </div>
                  ) : phase === 'switch_side_prep' ? (
                    <div>
                      <div className="text-4xl sm:text-5xl font-black text-white mb-1">
                        换边！
                      </div>
                      <div className="text-5xl sm:text-6xl font-black font-mono text-zinc-300">
                        {timeRemaining}s
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        调整为另一侧进行 {currentConfig.repsPerSide} 次
                      </p>
                    </div>
                  ) : phase === 'resting' ? (
                    <div>
                      {/* Set Calorie Feedback Badge */}
                      {lastSetCalories !== null && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold mb-2 animate-in fade-in zoom-in duration-300">
                          <Flame className="w-3.5 h-3.5 text-zinc-300 fill-current" />
                          <span>本组消耗约 <strong className="font-mono text-white">+{lastSetCalories.toFixed(1)}</strong> kcal</span>
                          <span className="text-zinc-400 text-[11px] font-mono">· 累计 {totalCaloriesBurned.toFixed(1)} kcal</span>
                        </div>
                      )}

                      <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        组间休息倒计时 (REST)
                      </div>
                      <div className="text-6xl sm:text-7xl font-black font-mono text-white tracking-tight">
                        {timeRemaining}
                        <span className="text-2xl text-zinc-400 ml-1">秒</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">
                        深长吸气，自然呼气，放松核心
                      </p>
                      <button
                        id="skip-rest-btn"
                        onClick={handleSkipRest}
                        className="mt-3 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-full text-xs font-bold transition inline-flex items-center gap-1.5"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-zinc-300" />
                        <span>提前结束休息，开始第 {currentSet} 组</span>
                      </button>
                    </div>
                  ) : currentExercise.type === 'timed-hold' || currentExercise.type === 'timed-unilateral' ? (
                    /* Timed hold count */
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        {currentExercise.type === 'timed-unilateral' ? (currentSide === 'A' ? '第一侧支撑' : '第二侧支撑') : '等长核心支撑'}
                      </div>
                      <div className="text-7xl sm:text-8xl font-black font-mono text-white tracking-tight">
                        {timeRemaining}
                        <span className="text-3xl text-zinc-500 ml-1">s</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 font-medium">
                        目标：{currentConfig.holdSeconds}秒 · {currentExercise.keyRule}
                      </p>
                    </div>
                  ) : (
                    /* Reps count (Dead Bug, Bird Dog, Glute Bridge) */
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        {currentExercise.type === 'reps-unilateral' 
                          ? `${currentSide === 'A' ? '侧A (右手+左腿)' : '侧B (左手+右腿)'}` 
                          : '对称臀部收缩'}
                      </div>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-7xl sm:text-8xl font-black font-mono text-white tracking-tight">
                          {currentRep}
                        </span>
                        <span className="text-2xl sm:text-3xl font-mono text-zinc-500 font-bold">
                          / {currentExercise.type === 'reps-unilateral' ? currentConfig.repsPerSide : currentConfig.repsTotal} 次
                        </span>
                      </div>

                      {/* Manual Rep Click Trigger option */}
                      <button
                        id="manual-rep-click-btn"
                        onClick={handleManualRep}
                        className="mt-3 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-xl text-zinc-200 border border-zinc-700 transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Vibrate className="w-3.5 h-3.5 text-zinc-300" />
                        <span>手动完成一次 (震动+计数)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Supervision Controls: Skip Current Set button */}
                <div className="space-y-3 z-10 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      id="skip-current-set-btn"
                      onClick={handleSkipCurrentSet}
                      className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold rounded-xl border border-zinc-700 transition flex items-center justify-center gap-2 shadow-sm"
                      title="跳过当前这一组训练"
                    >
                      <FastForward className="w-4 h-4 text-zinc-300" />
                      <span>跳过当前第 {currentSet} 组</span>
                    </button>

                    <button
                      id="view-guide-shortcut-btn"
                      onClick={() => setShowGuidanceModal(true)}
                      className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-800 transition flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span>查看指南</span>
                    </button>
                  </div>

                  {/* Coaching cue tip */}
                  <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 text-xs text-zinc-300">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-200 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                      <span>动作监控要点</span>
                    </div>
                    <p className="text-zinc-400 leading-snug">
                      {currentExercise.keyRule}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT / BOTTOM: 动作指导与体态演示 (Action Guidance & Demonstration 3D Model or Minimal Guidance) */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-3 order-2 min-w-0">
                <div className="flex-1 flex flex-col">
                  {settings.hideModelGuide ? (
                    <div className="flex-1 flex flex-col justify-between bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-zinc-950 text-zinc-300 border border-zinc-800 flex items-center justify-center shrink-0">
                            <EyeOff className="w-4 h-4 text-zinc-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                              <span>动作规范与体态指导</span>
                              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-zinc-700">
                                人物模型已隐藏
                              </span>
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              极简省电模式 · 专注计时节拍与动作质量
                            </p>
                          </div>
                        </div>
                        <button
                          id="unhide-model-active-btn"
                          onClick={() => setSettings(s => ({ ...s, hideModelGuide: false }))}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
                          title="恢复显示 3D 人物模型指导"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-300" />
                          <span>开启3D模型</span>
                        </button>
                      </div>

                      {/* Focused Posture & Coaching Breakdown */}
                      <div className="space-y-3 flex-1 flex flex-col justify-around">
                        <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
                          <div className="text-zinc-200 font-bold mb-1.5 flex items-center gap-1.5 text-xs">
                            <Target className="w-4 h-4 text-zinc-400" />
                            <span>核心发力与训练目标</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold text-xs">
                              {currentExercise.target}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs">
                              {currentExercise.enName}
                            </span>
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                          <div className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                            <Activity className="w-4 h-4 text-zinc-400" />
                            <span>起始规范姿态</span>
                          </div>
                          <ul className="space-y-1 text-zinc-400 leading-relaxed list-disc list-inside text-xs">
                            {currentExercise.startingPose.map((pose, i) => (
                              <li key={i}>{pose}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
                          <div className="text-zinc-200 font-bold flex items-center gap-1.5 text-xs">
                            <ShieldAlert className="w-4 h-4 text-zinc-400" />
                            <span>核心质量铁律</span>
                          </div>
                          <p className="text-zinc-400 text-xs leading-relaxed">
                            {currentExercise.keyRule}
                          </p>
                        </div>

                        <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
                          <div className="text-zinc-200 font-bold mb-1 flex items-center gap-1.5 text-xs">
                            <Volume2 className="w-4 h-4 text-zinc-400" />
                            <span>呼吸节律技巧</span>
                          </div>
                          <p className="text-zinc-400 text-xs leading-relaxed">
                            {currentExercise.breathingTip}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Human3DExerciseModel
                      exercise={currentExercise}
                      phase={phase}
                      currentSide={currentSide}
                      currentRep={currentRep}
                      totalRepsCurrentSide={currentConfig.repsPerSide || 8}
                      repSubPhase={repSubPhase}
                      timeRemaining={timeRemaining}
                    />
                  )}
                </div>

                {/* Action guidance quick reference card right under the animation */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span>动作指导精要</span>
                    </span>
                    <button
                      onClick={() => setShowGuidanceModal(true)}
                      className="text-[11px] text-zinc-400 hover:text-white hover:underline"
                    >
                      查看完整体态图解 →
                    </button>
                  </div>
                  <div className="space-y-1 text-zinc-400">
                    <p className="leading-relaxed">
                      <strong className="text-zinc-300">起始姿势：</strong>
                      {currentExercise.startingPose[0]}，{currentExercise.startingPose[1]}
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-zinc-300">呼吸技巧：</strong>
                      {currentExercise.breathingTip}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Principle & Shaking Coping Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-zinc-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-zinc-400" />
                  <span>核心训练原则与发抖应对</span>
                </span>
                <button
                  id="view-full-exercise-guide-btn"
                  onClick={() => setShowGuidanceModal(true)}
                  className="text-xs text-zinc-300 hover:text-white hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>查看完整动作详解</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                {currentExercise.breathingTip} {currentExercise.shakingTip || '核心训练不是越累越好。把动作质量放在第一位，若出现代偿疼痛可缩短幅度或休息。'}
              </p>
            </div>
          </div>
        )}
        </>
      )}
      </main>

      {/* Modals */}
      <ExerciseGuidanceModal
        currentExerciseId={currentExercise.id}
        isOpen={showGuidanceModal}
        onClose={() => setShowGuidanceModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <CalorieDetailModal
        isOpen={showCalorieModal}
        onClose={() => setShowCalorieModal(false)}
        totalCalories={totalCaloriesBurned}
        lastSetCalories={lastSetCalories}
        completedSetRecords={completedSetRecords}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Training Calendar Modal (User request: 并且在右上角设置日历，点击后可以查看已经训练完成的天) */}
      <TrainingCalendarModal
        isOpen={showCalendarModal}
        calendarData={calendarData}
        onClose={() => setShowCalendarModal(false)}
        onStartTrack={(track) => {
          setSelectedTrack(track);
          setShowCalendarModal(false);
          if (track === 'core' && phase === 'idle') {
            handleStartWorkout();
          }
        }}
      />

      {phase === 'completed' && (
        <WorkoutCompleteModal
          totalSeconds={totalWorkoutSeconds}
          completedSets={completedSetsCount}
          totalSets={totalSetsOverall}
          totalCalories={totalCaloriesBurned}
          cooldownCompleted={settings.enableCooldownStretch}
          track={completedTrackForModal}
          onOpenCalendar={() => setShowCalendarModal(true)}
          onRedoCooldown={() => {
            startCooldownStretching(0);
          }}
          onRestart={() => {
            setPhase('idle');
            setExerciseIndex(0);
            setCurrentSet(1);
            setCompletedSetsCount(0);
            setTotalWorkoutSeconds(0);
            totalWorkoutSecondsRef.current = 0;
            setCompletedSetRecords([]);
            setLastSetCalories(null);
            setSelectedTrack(null);
          }}
        />
      )}
    </div>
  );
}
