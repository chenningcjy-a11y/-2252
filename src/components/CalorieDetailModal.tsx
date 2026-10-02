import React from 'react';
import { CompletedSetRecord, WorkoutSettings } from '../types';
import { calculateTotalEstimatedCalories } from '../utils/calorieCalculator';
import { 
  Flame, 
  X, 
  Activity, 
  TrendingUp, 
  Sliders, 
  Volume2, 
  Minus, 
  Plus, 
  Info, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface CalorieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCalories: number;
  lastSetCalories: number | null;
  completedSetRecords: CompletedSetRecord[];
  settings: WorkoutSettings;
  onUpdateSettings: (newSettings: WorkoutSettings) => void;
}

export const CalorieDetailModal: React.FC<CalorieDetailModalProps> = ({
  isOpen,
  onClose,
  totalCalories,
  lastSetCalories,
  completedSetRecords,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const estimatedTotal = calculateTotalEstimatedCalories(settings, settings.userWeightKg || 65);
  const progressPercent = Math.min(100, Math.round((totalCalories / Math.max(1, estimatedTotal)) * 100));

  const handleWeightChange = (newWeight: number) => {
    const clamped = Math.max(35, Math.min(150, newWeight));
    onUpdateSettings({
      ...settings,
      userWeightKg: clamped,
    });
  };

  const handleToggleVoiceAnnounce = () => {
    onUpdateSettings({
      ...settings,
      announceCalories: !settings.announceCalories,
    });
  };

  const handleSetDisplayMode = (mode: 'total' | 'last_set') => {
    onUpdateSettings({
      ...settings,
      calorieDisplayMode: mode,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="calorie-detail-dialog"
        className="bg-zinc-900 border border-zinc-700 w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold shadow-sm">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">卡路里消耗实时监控</h3>
              <p className="text-xs text-zinc-400">
                每组动作完成时自动测算并更新
              </p>
            </div>
          </div>
          <button 
            id="close-calorie-modal-btn"
            onClick={onClose} 
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Main Calorie Banner */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-zinc-200" />
                <span>当前训练消耗</span>
              </span>
              {lastSetCalories !== null && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                  最近一组 +{lastSetCalories.toFixed(1)} kcal
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {totalCalories.toFixed(1)}
              </span>
              <span className="text-lg sm:text-xl font-bold text-zinc-300">kcal (千卡)</span>
              <span className="text-xs text-zinc-400 ml-auto font-mono">
                预计总计 ~{estimatedTotal} kcal
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-800 mt-3">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-1.5 font-mono">
              <span>已完成当前进度 {progressPercent}%</span>
              <span>已记录 {completedSetRecords.length} 组</span>
            </div>
          </div>

          {/* Top-right Counter Display Option */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-zinc-300" />
                <span>右上角计数选项显示方式</span>
              </span>
              <span className="text-[11px] text-zinc-400">实时在导航栏常驻</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="display-mode-total-btn"
                onClick={() => handleSetDisplayMode('total')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition flex flex-col items-center gap-1 ${
                  settings.calorieDisplayMode === 'total'
                    ? 'bg-zinc-100 border-white text-zinc-950 font-bold'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>显示累计总卡路里</span>
                </div>
                <span className="text-[11px] font-mono opacity-80">例: {totalCalories.toFixed(1)} kcal</span>
              </button>

              <button
                id="display-mode-last-set-btn"
                onClick={() => handleSetDisplayMode('last_set')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition flex flex-col items-center gap-1 ${
                  settings.calorieDisplayMode === 'last_set'
                    ? 'bg-zinc-100 border-white text-zinc-950 font-bold'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>显示单组消耗卡路里</span>
                </div>
                <span className="text-[11px] font-mono opacity-80">
                  例: {lastSetCalories !== null ? `+${lastSetCalories.toFixed(1)}` : '+0.0'} kcal
                </span>
              </button>
            </div>
          </div>

          {/* User Body Weight (kg) & Voice Broadcast Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Weight Tuning */}
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">体重参数校准</span>
                <span className="text-xs font-mono font-bold text-zinc-100">
                  {settings.userWeightKg || 65} kg
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="decrease-weight-btn"
                  onClick={() => handleWeightChange((settings.userWeightKg || 65) - 2)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 text-center font-mono font-bold text-sm text-white bg-zinc-900 py-1 rounded-lg border border-zinc-800">
                  {settings.userWeightKg || 65} 公斤
                </div>
                <button
                  id="increase-weight-btn"
                  onClick={() => handleWeightChange((settings.userWeightKg || 65) + 2)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-1 pt-1">
                {[50, 60, 65, 70, 80].map(w => (
                  <button
                    key={w}
                    onClick={() => handleWeightChange(w)}
                    className={`flex-1 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                      (settings.userWeightKg || 65) === w
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {w}k
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Announcement Toggle */}
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-700">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">组间语音播报卡路里</div>
                    <div className="text-[10px] text-zinc-400">完成每组时口播消耗千卡</div>
                  </div>
                </div>
                <button
                  id="toggle-announce-calories-btn"
                  onClick={handleToggleVoiceAnnounce}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    settings.announceCalories ? 'bg-zinc-200' : 'bg-zinc-800'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                      settings.announceCalories ? 'left-5 bg-zinc-950' : 'left-0.5 bg-zinc-400'
                    }`} 
                  />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800">
                播报示例：“第1组完成！消耗约3.8千卡，休息40秒”
              </p>
            </div>
          </div>

          {/* Completed Sets Calorie History Log */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-zinc-300" />
                <span>各组完成记录与消耗明细</span>
              </h4>
              <span className="text-[11px] font-mono text-zinc-400">
                共 {completedSetRecords.length} 组完成
              </span>
            </div>

            {completedSetRecords.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800 text-center text-xs text-zinc-400 space-y-1">
                <Flame className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                <p className="font-medium text-zinc-300">尚未有完成的组数记录</p>
                <p className="text-[11px]">开始训练并完成动作后，每组消耗的卡路里将自动记录在下方</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {completedSetRecords.slice().reverse().map((record, index) => (
                  <div
                    key={record.id || index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs hover:bg-zinc-850 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-200 font-mono font-bold flex items-center justify-center text-[11px]">
                        #{completedSetRecords.length - index}
                      </div>
                      <div>
                        <span className="font-bold text-white">{record.exerciseName}</span>
                        <span className="text-zinc-400 ml-1.5 text-[11px]">第 {record.setNumber} 组</span>
                        <span className="text-zinc-500 text-[10px] ml-1.5">({record.durationSeconds}秒)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-bold text-zinc-100 text-sm">
                      <span>+{record.calories.toFixed(1)}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scientific Reference note */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              测算基于 ACSM（美国运动医学会）针对等长对抗伸展与深层稳定肌群代谢当量公式（MET 3.8~4.2）。核心训练由于高张力等长收缩与腹压维持，不仅具有动作过程消耗，还会带来显著的后燃（EPOC）热量消耗。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/95 flex items-center justify-between">
          <span className="text-xs text-zinc-400">点击右上角常驻卡路里胶囊随时查看</span>
          <button
            id="close-calorie-modal-confirm-btn"
            onClick={onClose}
            className="px-6 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>确定</span>
          </button>
        </div>
      </div>
    </div>
  );
};
