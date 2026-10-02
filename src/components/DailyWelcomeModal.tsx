import React, { useState } from 'react';
import { TrainingTrack } from '../types';
import { formatChineseDate, getTodayDateString } from '../utils/dailyTracker';
import { 
  Calendar, 
  Dumbbell, 
  Languages, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Flame,
  X
} from 'lucide-react';

interface DailyWelcomeModalProps {
  isOpen?: boolean;
  recommendedTrack: TrainingTrack;
  recommendationReason: string;
  isTodayAlreadyCompleted: boolean;
  todayCompletedCore: boolean;
  todayCompletedKorean: boolean;
  onStartTraining: (track: TrainingTrack) => void;
  onDismiss: () => void;
  onOpenCalendar: () => void;
}

export const DailyWelcomeModal: React.FC<DailyWelcomeModalProps> = ({
  isOpen = true,
  recommendedTrack,
  recommendationReason,
  isTodayAlreadyCompleted,
  todayCompletedCore,
  todayCompletedKorean,
  onStartTraining,
  onDismiss,
  onOpenCalendar,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<TrainingTrack>(recommendedTrack);
  const todayStr = getTodayDateString();
  const { fullDate, weekday, shortDate } = formatChineseDate(todayStr);

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-welcome-title"
      >
        {/* Subtle accent corner glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-zinc-700/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close / Dismiss button */}
        <button
          id="close-daily-welcome-btn"
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          title="稍后开启"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Date Badge & Question */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-200 text-xs font-mono font-semibold mb-3">
            <Calendar className="w-3.5 h-3.5 text-zinc-300" />
            <span>{fullDate}</span>
          </div>

          <h2 id="daily-welcome-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            是否开启今天训练？
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
            双轨自律计划 · 一天核心力量，一天韩语沉浸20分钟
          </p>
        </div>

        {/* Status Notice if already completed today */}
        {isTodayAlreadyCompleted && (
          <div className="mb-4 p-3 bg-zinc-800/80 border border-zinc-700 rounded-2xl flex items-center gap-2.5 text-xs text-zinc-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">今日训练已达标！</span>
              <span className="text-zinc-400 ml-1">
                {todayCompletedCore && todayCompletedKorean 
                  ? '核心与韩语皆已打卡完成！' 
                  : todayCompletedCore 
                    ? '已完成核心训练，可继续练习韩语。' 
                    : '已完成韩语练习，可继续核心训练。'}
              </span>
            </div>
          </div>
        )}

        {/* Recommendation explanation */}
        <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3 sm:p-3.5 mb-4 text-xs text-zinc-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">轮换推荐：</span>
            <span className="text-zinc-300">{recommendationReason}</span>
          </div>
        </div>

        {/* Two Track Selection Cards */}
        <div className="space-y-2.5 mb-5">
          {/* Option 1: Core Training */}
          <button
            id="select-core-track-btn"
            type="button"
            onClick={() => setSelectedTrack('core')}
            className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition flex items-center justify-between ${
              selectedTrack === 'core'
                ? 'bg-zinc-800 border-white ring-2 ring-white/20 text-white shadow-lg'
                : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedTrack === 'core' ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-300'
              }`}>
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-white">核心强化训练</span>
                  {recommendedTrack === 'core' && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-zinc-950 text-[10px] font-black uppercase">
                      今日推荐
                    </span>
                  )}
                  {todayCompletedCore && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                      今日已达标
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>约15-20分钟</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-zinc-500" />
                    <span>5大核心 + 7项放松拉伸</span>
                  </span>
                </div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
              selectedTrack === 'core' ? 'border-white bg-white text-zinc-950' : 'border-zinc-600'
            }`}>
              {selectedTrack === 'core' && <div className="w-2 h-2 rounded-full bg-zinc-950" />}
            </div>
          </button>

          {/* Option 2: Korean Practice */}
          <button
            id="select-korean-track-btn"
            type="button"
            onClick={() => setSelectedTrack('korean')}
            className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition flex items-center justify-between ${
              selectedTrack === 'korean'
                ? 'bg-zinc-800 border-white ring-2 ring-white/20 text-white shadow-lg'
                : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedTrack === 'korean' ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-300'
              }`}>
                <Languages className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-white">韩语自主学习 (20分钟)</span>
                  {recommendedTrack === 'korean' && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-zinc-950 text-[10px] font-black uppercase">
                      今日推荐
                    </span>
                  )}
                  {todayCompletedKorean && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                      今日已达标
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>倒计时20分钟</span>
                  </span>
                  <span>自行学习 · 结束自动提醒达标</span>
                </div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
              selectedTrack === 'korean' ? 'border-white bg-white text-zinc-950' : 'border-zinc-600'
            }`}>
              {selectedTrack === 'korean' && <div className="w-2 h-2 rounded-full bg-zinc-950" />}
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            id="start-daily-training-btn"
            onClick={() => onStartTraining(selectedTrack)}
            className="flex-1 py-3.5 px-6 bg-zinc-100 hover:bg-white text-zinc-950 font-black rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg group"
          >
            <span>开启今天训练 ({selectedTrack === 'core' ? '核心动作' : '韩语20分钟'})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            id="dismiss-daily-welcome-btn"
            onClick={onDismiss}
            className="py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-2xl text-sm border border-zinc-700 transition text-center"
          >
            稍后再练
          </button>
        </div>

        {/* Footer: Calendar Link */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 text-center">
          <button
            id="welcome-open-calendar-link"
            onClick={onOpenCalendar}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>查看过往打卡日历与连续记录</span>
          </button>
        </div>
      </div>
    </div>
  );
};
