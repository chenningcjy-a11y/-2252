import React, { useState } from 'react';
import { WorkoutSettings, ExerciseConfig } from '../types';
import { CORE_EXERCISES, DEFAULT_WORKOUT_SETTINGS } from '../data/exercises';
import { COACH_VOICES, VoicePersona } from '../data/voices';
import { triggerVibration, speakText, soundEffects, previewVoicePersona } from '../utils/audioVibration';
import { saveWorkoutSettings, loadSavedWorkoutSettings, clearSavedWorkoutSettings } from '../utils/storage';
import { 
  Settings, 
  Volume2, 
  Vibrate, 
  Clock, 
  RotateCcw, 
  X, 
  Check, 
  Sliders, 
  Plus, 
  Minus,
  Sparkles,
  Info,
  Flame,
  Mic,
  Play,
  UserCheck,
  Eye,
  EyeOff,
  Save,
  Database,
  CheckCircle2,
  Timer,
  HeartHandshake
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkoutSettings;
  onUpdateSettings: (newSettings: WorkoutSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dead-bug');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const testVoice = () => {
    soundEffects.playTone('go', 0.5);
    speakText('测试语音播报：换边，第一组完成，休息四十秒！', { 
      enabled: true, 
      interrupt: true, 
      voiceId: settings.selectedVoiceId,
      volume: settings.audioVolume 
    });
  };

  const testVibe = () => {
    triggerVibration([120, 60, 120], true, true);
  };

  // Explicitly save current custom action settings to localStorage
  const handleSaveNow = () => {
    const res = saveWorkoutSettings(settings);
    onUpdateSettings({ ...settings, lastSavedTimestamp: res.timestamp });
    setSaveFeedback('✅ 自定义动作与所有配置已成功保存！');
    soundEffects.playTone('go', 0.5);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Reload the last saved settings from localStorage
  const handleReloadSaved = () => {
    const { settings: savedSettings, isSaved } = loadSavedWorkoutSettings();
    if (isSaved) {
      onUpdateSettings(savedSettings);
      setSaveFeedback('✅ 已重新加载上次保存的自定义动作数据！');
      soundEffects.playTone('rep', 0.45);
    } else {
      setSaveFeedback('ℹ️ 暂无已保存的自定义数据，当前为默认数据');
    }
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Reset to default recommended settings
  const handleResetToDefault = () => {
    if (confirm('确定要恢复出厂默认推荐配置吗？此操作将重置所有自定义动作参数。')) {
      clearSavedWorkoutSettings();
      onUpdateSettings(DEFAULT_WORKOUT_SETTINGS);
      setSaveFeedback('🔄 已恢复系统默认动作参数');
      soundEffects.playTone('tick', 0.4);
      setTimeout(() => setSaveFeedback(null), 3500);
    }
  };

  // Helper to update a specific exercise's config
  const updateExerciseConfig = (
    exId: keyof WorkoutSettings['exercises'],
    updates: Partial<ExerciseConfig>
  ) => {
    const nextSettings = {
      ...settings,
      exercises: {
        ...settings.exercises,
        [exId]: {
          ...settings.exercises[exId],
          ...updates,
        },
      },
    };
    onUpdateSettings(nextSettings);
    // Auto-save on every parameter change
    saveWorkoutSettings(nextSettings);
  };

  // Calculate estimated total workout minutes
  const calculateTotalMinutes = (): number => {
    let totalSec = 0;
    const exIds = Object.keys(settings.exercises) as Array<keyof WorkoutSettings['exercises']>;
    
    for (const id of exIds) {
      const cfg = settings.exercises[id];
      const sets = cfg.sets;
      
      let setTime = 0;
      if (id === 'dead-bug' || id === 'bird-dog') {
        const reps = cfg.repsPerSide || 8;
        const pace = cfg.repPaceSeconds;
        setTime = (reps * 2 * pace) + 3; // 3s for switch side
      } else if (id === 'plank') {
        setTime = cfg.holdSeconds || 20;
      } else if (id === 'side-plank') {
        const hold = cfg.holdSeconds || 15;
        setTime = (hold * 2) + 3; // 3s switch side
      } else if (id === 'glute-bridge') {
        const reps = cfg.repsTotal || 15;
        setTime = reps * cfg.repPaceSeconds;
      }
      
      // Each set has 3s countdown + setTime + rest (except after last set)
      const exTotal = sets * (3 + setTime) + (sets - 1) * cfg.restSeconds;
      totalSec += exTotal;
    }
    
    // Add rest between exercises (4 transitions for 5 exercises)
    if (settings.autoTransitionAfterExercise) {
      totalSec += 4 * (settings.betweenExerciseRestSeconds || 40);
    }

    // Add 5-7 mins post-workout cooldown stretching if enabled (~370s)
    if (settings.enableCooldownStretch) {
      totalSec += 370;
    }

    return Math.round(totalSec / 60);
  };

  const estimatedMinutes = calculateTotalMinutes();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="settings-dialog"
        className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-zinc-100 flex items-center justify-center border border-zinc-800">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">监督器训练参数设置</h3>
              <p className="text-xs text-zinc-400">
                可分别调整各动作的次数、单次耗时与组间休息间隔
              </p>
            </div>
          </div>
          <button 
            id="close-settings-btn"
            onClick={onClose} 
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-850 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Real-time Save & Action Feedback Alert */}
          {saveFeedback && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-100 shrink-0" />
                <span>{saveFeedback}</span>
              </div>
              <button 
                onClick={() => setSaveFeedback(null)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. Custom Action Data Persistence (自定义动作数据保存与加载) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-white">自定义动作数据持久化保存</h4>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[10px] font-bold">
                      本地持久存储
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    修改后的动作次数、组数、耗时与间隔会自动保存。每次打开网页时，都会自动载入上次保存的自定义数据。
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  id="manual-save-settings-btn"
                  onClick={handleSaveNow}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  title="立即将当前设置存入本地"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存当前数据</span>
                </button>

                <button
                  id="reload-saved-settings-btn"
                  onClick={handleReloadSaved}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
                  title="重新从本地存储加载上次保存的数据"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-300" />
                  <span>载入上次保存</span>
                </button>
              </div>
            </div>

            {/* Sync status info footer */}
            <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                <span>
                  {settings.lastSavedTimestamp 
                    ? `上次保存时间：${new Date(settings.lastSavedTimestamp).toLocaleString('zh-CN', { hour12: false })}` 
                    : '已与本地自动同步（每次参数变动均实时更新）'}
                </span>
              </span>
              <button
                id="reset-to-default-btn"
                onClick={handleResetToDefault}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 hover:underline flex items-center gap-1 transition"
              >
                <span>恢复出厂默认推荐</span>
              </button>
            </div>
          </div>

          {/* 2. 3D Model Guidance Display Toggle (在设置中隐藏/显示人物模型指导) */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                settings.hideModelGuide
                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  : 'bg-zinc-800 text-zinc-100 border border-zinc-600'
              }`}>
                {settings.hideModelGuide ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs sm:text-sm text-white">隐藏人物模型指导</p>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    settings.hideModelGuide 
                      ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' 
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                  }`}>
                    {settings.hideModelGuide ? '当前已隐藏人物模型' : '当前显示 3D 模型'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {settings.hideModelGuide 
                    ? '开启此选项后，主界面将隐藏 3D 生物力学人物动作模型，转为极简文字与语音节拍监督，降低硬件发热与耗电' 
                    : '展示 3D 生物力学真人动作模型，实时演示动作轨迹与发力肌群（可在此随时隐藏）'}
                </p>
              </div>
            </div>

            <button
              id="toggle-hide-model-guide-btn"
              onClick={() => {
                const next = !settings.hideModelGuide;
                const nextSettings = { ...settings, hideModelGuide: next };
                onUpdateSettings(nextSettings);
                saveWorkoutSettings(nextSettings);
                setSaveFeedback(next ? '已开启隐藏人物模型指导（极简模式）' : '已恢复显示 3D 人物模型指导');
                setTimeout(() => setSaveFeedback(null), 3000);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                settings.hideModelGuide ? 'bg-zinc-600' : 'bg-zinc-800 border border-zinc-700'
              }`}
              title={settings.hideModelGuide ? '点击恢复 3D 人物模型指导显示' : '点击隐藏 3D 人物模型指导'}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.hideModelGuide ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* 3. Auto Transition After Exercise & Rest Interval (动作做完自动休息40秒，免手动点击确认) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs sm:text-sm text-white">动作完成后自动休息过渡</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
                      {settings.autoTransitionAfterExercise ? '已开启免确认' : '需手动点击'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    一个动作（如3组死虫式）做完后，直接进入休息倒计时（默认40秒），倒计时结束自动开始下一个动作，不用中途爬起来手动点击屏幕确认。
                  </p>
                </div>
              </div>

              <button
                id="toggle-auto-transition-btn"
                onClick={() => {
                  const next = !settings.autoTransitionAfterExercise;
                  const nextSettings = { ...settings, autoTransitionAfterExercise: next };
                  onUpdateSettings(nextSettings);
                  saveWorkoutSettings(nextSettings);
                  setSaveFeedback(next ? '已开启自动休息40秒过渡（无需手动确认）' : '已关闭自动过渡（动作完成后等待手动点击）');
                  setTimeout(() => setSaveFeedback(null), 3000);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  settings.autoTransitionAfterExercise ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-700'
                }`}
                title="开启/关闭动作间自动休息过渡"
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.autoTransitionAfterExercise ? 'bg-zinc-950 left-7' : 'bg-zinc-400 left-1'
                }`} />
              </button>
            </div>

            {settings.autoTransitionAfterExercise && (
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-zinc-300">
                  <span className="font-semibold text-white">跨动作间休息时间：</span>
                  <span className="font-mono text-zinc-200 ml-1 font-bold">{settings.betweenExerciseRestSeconds || 40} 秒</span>
                  <span className="text-[11px] text-zinc-400 block sm:inline sm:ml-2">（深长呼吸、平复心率后自动进入下一项）</span>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {[30, 40, 50, 60].map(sec => (
                    <button
                      key={sec}
                      onClick={() => {
                        const nextSettings = { ...settings, betweenExerciseRestSeconds: sec };
                        onUpdateSettings(nextSettings);
                        saveWorkoutSettings(nextSettings);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                        (settings.betweenExerciseRestSeconds || 40) === sec
                          ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {sec}秒
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Post-Workout Cooldown Stretching (训练后 5–7分钟放松拉伸) */}
          <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs sm:text-sm text-white">训练后 5–7分钟放松拉伸</p>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
                    {settings.enableCooldownStretch ? '核心做完自动开启' : '已关闭'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  做完5大核心动作后不马上结束，自动进入猫牛式、眼镜蛇式、儿童式、臀肌、腿后侧、髋屈肌与肩背等7组黄金拉伸，放松神经与肌肉。
                </p>
              </div>
            </div>

            <button
              id="toggle-cooldown-stretch-btn"
              onClick={() => {
                const next = !settings.enableCooldownStretch;
                const nextSettings = { ...settings, enableCooldownStretch: next };
                onUpdateSettings(nextSettings);
                saveWorkoutSettings(nextSettings);
                setSaveFeedback(next ? '已开启训练后拉伸放松（做完核心自动开始拉伸）' : '已关闭训练后拉伸（核心做完直接结课）');
                setTimeout(() => setSaveFeedback(null), 3000);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                settings.enableCooldownStretch ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-700'
              }`}
              title="开启/关闭训练后拉伸放松环节"
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                settings.enableCooldownStretch ? 'bg-zinc-950 left-7' : 'bg-zinc-400 left-1'
              }`} />
            </button>
          </div>

          {/* Estimated Workout Duration Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-zinc-300 shrink-0" />
              <div>
                <span className="text-xs text-zinc-300">根据当前自定义参数预计总时长：</span>
                <span className="ml-1 text-sm font-bold text-white font-mono">约 {estimatedMinutes} 分钟</span>
              </div>
            </div>
            <button
              id="reset-settings-btn"
              onClick={handleResetToDefault}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
              title="恢复所有动作与时间为默认推荐参数"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>恢复默认推荐</span>
            </button>
          </div>

          {/* Voice & Vibration Global Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">语音实时播报</p>
                  <p className="text-[11px] text-zinc-400">计数、换边、休息提醒</p>
                </div>
              </div>
              <button
                id="toggle-voice-btn"
                onClick={() => onUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.voiceEnabled ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-700'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full ${settings.voiceEnabled ? 'bg-zinc-950' : 'bg-zinc-400'} transition-transform ${settings.voiceEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
                  <Vibrate className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">触感震动节拍</p>
                  <p className="text-[11px] text-zinc-400">每个动次与节点振动</p>
                </div>
              </div>
              <button
                id="toggle-vibration-btn"
                onClick={() => onUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.vibrationEnabled ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-700'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full ${settings.vibrationEnabled ? 'bg-zinc-950' : 'bg-zinc-400'} transition-transform ${settings.vibrationEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Test Tones */}
          <div className="flex gap-2">
            <button
              onClick={testVoice}
              className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium rounded-xl text-zinc-200 border border-zinc-700 transition flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>试听当前设定语音</span>
            </button>
            <button
              onClick={testVibe}
              className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium rounded-xl text-zinc-200 border border-zinc-700 transition flex items-center justify-center gap-1.5"
            >
              <Vibrate className="w-3.5 h-3.5 text-zinc-400" />
              <span>测试触感震动</span>
            </button>
          </div>

          {/* Coach Voice Selection (13 款音色，满足多样化训练陪伴) */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>教练语音声音切换</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                      13 款音色可选
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    自由选择男声、女声、硬核教官、康复专家或禅意导师，点击卡片切换
                  </p>
                </div>
              </div>
            </div>

            {/* Voice Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {COACH_VOICES.map((persona) => {
                const isSelected = (settings.selectedVoiceId || 'coach-sunny') === persona.id;
                return (
                  <div
                    key={persona.id}
                    onClick={() => onUpdateSettings({ ...settings, selectedVoiceId: persona.id })}
                    className={`relative p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-zinc-800 border-zinc-400 ring-1 ring-zinc-400 shadow-md'
                        : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {persona.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                            isSelected ? 'bg-zinc-700 text-zinc-100 border-zinc-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                          }`}>
                            {persona.toneTag}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {persona.title}
                        </p>
                      </div>

                      {/* Selection Checkmark */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                        isSelected 
                          ? 'bg-white text-zinc-950 font-bold' 
                          : 'border border-zinc-700 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-300 leading-relaxed line-clamp-2">
                      {persona.description}
                    </p>

                    {/* Preview Voice Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800 mt-0.5">
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {persona.gender === 'male' ? '♂ 男性声线' : persona.gender === 'female' ? '♀ 女性声线' : '✦ 特效音色'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewVoicePersona(persona, settings.audioVolume);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[10px] font-medium transition"
                        title="点击试听此教练的声音与语调"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>试听声音</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calorie & Weight Options */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-current text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">卡路里计数与消耗设置</h4>
                  <p className="text-[10px] text-zinc-400">完成每组动作时实时测算并在右上角显示</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Weight Adjustment */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-zinc-300">
                  <span>用户体重 (用于代谢当量测算)</span>
                  <span className="font-mono font-bold text-zinc-100">{settings.userWeightKg || 65} kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, userWeightKg: Math.max(35, (settings.userWeightKg || 65) - 2) })}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 text-center font-mono font-bold text-xs text-white bg-zinc-900 py-1 rounded border border-zinc-800">
                    {settings.userWeightKg || 65} 公斤
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, userWeightKg: Math.min(150, (settings.userWeightKg || 65) + 2) })}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Voice Announce Calorie Toggle */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">组间播报卡路里</div>
                  <div className="text-[10px] text-zinc-400">例：“第1组完成！消耗约3.8千卡”</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, announceCalories: !settings.announceCalories })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    settings.announceCalories ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-700'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 w-4 h-4 rounded-full ${settings.announceCalories ? 'bg-zinc-950' : 'bg-zinc-400'} transition-transform ${
                      settings.announceCalories ? 'left-5' : 'left-0.5'
                    }`} 
                  />
                </button>
              </div>
            </div>

            {/* Display Mode Selection */}
            <div className="flex items-center justify-between text-xs bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              <span className="text-zinc-300">右上角计数选项显示内容：</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onUpdateSettings({ ...settings, calorieDisplayMode: 'total' })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    settings.calorieDisplayMode === 'total'
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  累计总消耗
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, calorieDisplayMode: 'last_set' })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    settings.calorieDisplayMode === 'last_set'
                      ? 'bg-zinc-100 text-zinc-950 font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  单组消耗 (+X kcal)
                </button>
              </div>
            </div>
          </div>

          {/* Per-Exercise Customization Tabs */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-zinc-200" />
                <span>各动作详细时间与次数自定义</span>
              </h4>
              <span className="text-[11px] text-zinc-400">点击切换动作单独调整</span>
            </div>

            {/* Exercise Selection Pills */}
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
              {CORE_EXERCISES.map((ex, idx) => {
                const isActive = activeTab === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setActiveTab(ex.id)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                      isActive 
                        ? 'bg-zinc-100 text-zinc-950 shadow-md font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">#{idx + 1}</span>
                    <span className="truncate max-w-[90%]">{ex.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Exercise Configuration Panel */}
            {(() => {
              const currentEx = CORE_EXERCISES.find(e => e.id === activeTab) || CORE_EXERCISES[0];
              const exId = currentEx.id as keyof WorkoutSettings['exercises'];
              const config = settings.exercises[exId] || DEFAULT_WORKOUT_SETTINGS.exercises[exId];

              return (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-base font-bold text-white">{currentEx.name}</h5>
                        <span className="text-xs text-zinc-400 font-mono">({currentEx.enName})</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 font-medium">
                          {currentEx.target}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        核心原则：{currentEx.keyRule}
                      </p>
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Parameter 1: Reps or Hold Duration */}
                    {currentEx.type === 'reps-unilateral' && (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-zinc-300">
                            每组单侧次数
                          </label>
                          <span className="text-xs font-mono font-bold text-zinc-100">
                            {config.repsPerSide} 侧 × 2 (每组共 {(config.repsPerSide || 8) * 2} 次)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const next = Math.max(4, (config.repsPerSide || 8) - 2);
                              updateExerciseConfig(exId, { repsPerSide: next });
                            }}
                            className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="flex-1 text-center font-mono font-bold text-lg text-white bg-zinc-900 py-1.5 rounded-lg border border-zinc-800">
                            {config.repsPerSide} 次/侧
                          </div>
                          <button
                            onClick={() => {
                              const next = Math.min(20, (config.repsPerSide || 8) + 2);
                              updateExerciseConfig(exId, { repsPerSide: next });
                            }}
                            className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {[6, 8, 10, 12].map(r => (
                            <button
                              key={r}
                              onClick={() => updateExerciseConfig(exId, { repsPerSide: r })}
                              className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold transition ${
                                config.repsPerSide === r 
                                  ? 'bg-zinc-100 text-zinc-950 font-bold' 
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {r}侧
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentEx.type === 'reps' && (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-zinc-300">
                            每组总次数
                          </label>
                          <span className="text-xs font-mono font-bold text-zinc-100">
                            每组 {config.repsTotal} 次
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const next = Math.max(8, (config.repsTotal || 15) - 2);
                              updateExerciseConfig(exId, { repsTotal: next });
                            }}
                            className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="flex-1 text-center font-mono font-bold text-lg text-white bg-zinc-900 py-1.5 rounded-lg border border-zinc-800">
                            {config.repsTotal} 次
                          </div>
                          <button
                            onClick={() => {
                              const next = Math.min(30, (config.repsTotal || 15) + 2);
                              updateExerciseConfig(exId, { repsTotal: next });
                            }}
                            className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {[10, 12, 15, 20].map(r => (
                            <button
                              key={r}
                              onClick={() => updateExerciseConfig(exId, { repsTotal: r })}
                              className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold transition ${
                                config.repsTotal === r 
                                  ? 'bg-zinc-100 text-zinc-950 font-bold' 
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {r}次
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(currentEx.type === 'timed-hold' || currentEx.type === 'timed-unilateral') && (
                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-zinc-300">
                            {currentEx.type === 'timed-unilateral' ? '每侧坚持时间' : '坚持时间'}
                          </label>
                          <span className="text-xs font-mono font-bold text-zinc-100">
                            {config.holdSeconds} 秒
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const next = Math.max(10, (config.holdSeconds || 20) - 5);
                              updateExerciseConfig(exId, { holdSeconds: next });
                            }}
                            className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="flex-1 text-center font-mono font-bold text-lg text-white bg-zinc-900 py-1.5 rounded-lg border border-zinc-800">
                            {config.holdSeconds} 秒
                          </div>
                          <button
                            onClick={() => {
                              const next = Math.min(90, (config.holdSeconds || 20) + 5);
                              updateExerciseConfig(exId, { holdSeconds: next });
                            }}
                            className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {[15, 20, 25, 30, 45].map(s => (
                            <button
                              key={s}
                              onClick={() => updateExerciseConfig(exId, { holdSeconds: s })}
                              className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold transition ${
                                config.holdSeconds === s 
                                  ? 'bg-zinc-100 text-zinc-950 font-bold' 
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {s}s
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parameter 2: Rep Pace or Single action duration */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-zinc-300">
                          {currentEx.type.startsWith('timed') ? '动作计时步长' : '每次动作耗时 (节拍)'}
                        </label>
                        <span className="text-xs font-mono font-bold text-zinc-100">
                          {config.repPaceSeconds} 秒/次
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = Math.max(1.5, Number((config.repPaceSeconds - 0.5).toFixed(1)));
                            updateExerciseConfig(exId, { repPaceSeconds: next });
                          }}
                          className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-center font-mono font-bold text-lg text-white bg-zinc-900 py-1.5 rounded-lg border border-zinc-800">
                          {config.repPaceSeconds} 秒
                        </div>
                        <button
                          onClick={() => {
                            const next = Math.min(6.0, Number((config.repPaceSeconds + 0.5).toFixed(1)));
                            updateExerciseConfig(exId, { repPaceSeconds: next });
                          }}
                          className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {[2.5, 3.0, 3.5, 4.0, 5.0].map(p => (
                          <button
                            key={p}
                            onClick={() => updateExerciseConfig(exId, { repPaceSeconds: p })}
                            className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold transition ${
                              config.repPaceSeconds === p 
                                ? 'bg-zinc-100 text-zinc-950 font-bold' 
                                : 'bg-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {p}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Parameter 3: Rest Interval */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-zinc-300">
                          组间休息间隔
                        </label>
                        <span className="text-xs font-mono font-bold text-zinc-100">
                          {config.restSeconds} 秒
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = Math.max(15, config.restSeconds - 5);
                            updateExerciseConfig(exId, { restSeconds: next });
                          }}
                          className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-center font-mono font-bold text-lg text-white bg-zinc-900 py-1.5 rounded-lg border border-zinc-800">
                          {config.restSeconds} 秒
                        </div>
                        <button
                          onClick={() => {
                            const next = Math.min(90, config.restSeconds + 5);
                            updateExerciseConfig(exId, { restSeconds: next });
                          }}
                          className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {[25, 30, 40, 50, 60].map(s => (
                          <button
                            key={s}
                            onClick={() => updateExerciseConfig(exId, { restSeconds: s })}
                            className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold transition ${
                              config.restSeconds === s 
                                ? 'bg-zinc-100 text-zinc-950 font-bold' 
                                : 'bg-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {s}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Parameter 4: Sets count */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-zinc-300">
                          动作总组数
                        </label>
                        <span className="text-xs font-mono font-bold text-zinc-100">
                          {config.sets} 组 (标准3组)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const next = Math.max(1, config.sets - 1);
                            updateExerciseConfig(exId, { sets: next });
                          }}
                          className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-center font-mono font-bold text-lg text-white bg-zinc-900 py-1.5 rounded-lg border border-zinc-800">
                          {config.sets} 组
                        </div>
                        <button
                          onClick={() => {
                            const next = Math.min(5, config.sets + 1);
                            updateExerciseConfig(exId, { sets: next });
                          }}
                          className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {[1, 2, 3, 4, 5].map(st => (
                          <button
                            key={st}
                            onClick={() => updateExerciseConfig(exId, { sets: st })}
                            className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold transition ${
                              config.sets === st 
                                ? 'bg-zinc-100 text-zinc-950 font-bold' 
                                : 'bg-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {st}组
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>设置将实时生效，随时可在训练中调整</span>
          </div>
          <button
            id="confirm-settings-btn"
            onClick={() => {
              saveWorkoutSettings(settings);
              onClose();
            }}
            className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>保存并返回训练</span>
          </button>
        </div>
      </div>
    </div>
  );
};
