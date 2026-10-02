import React from 'react';
import { 
  Dumbbell, 
  Languages, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Flame,
  Award
} from 'lucide-react';
import { TrainingTrack } from '../types';
import { formatChineseDate } from '../utils/dailyTracker';

interface SubjectSelectionViewProps {
  recommendedTrack: TrainingTrack;
  recommendationReason: string;
  calendarStats: {
    totalDays: number;
    completedToday: boolean;
    completedCoreToday: boolean;
    completedKoreanToday: boolean;
    currentStreak: number;
  };
  todayDateStr: string;
  onSelectTrack: (track: TrainingTrack) => void;
  onOpenCalendar: () => void;
}

export const SubjectSelectionView: React.FC<SubjectSelectionViewProps> = ({
  recommendedTrack,
  recommendationReason,
  calendarStats,
  todayDateStr,
  onSelectTrack,
  onOpenCalendar,
}) => {
  const { fullDate, weekday } = formatChineseDate(todayDateStr);

  return (
    <div className="w-full max-w-xl mx-auto py-4 sm:py-8 px-2 sm:px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-zinc-700/15 rounded-full blur-3xl pointer-events-none" />

        {/* Date & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono font-medium mb-3">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{fullDate}</span>
            <span className="text-zinc-500">·</span>
            <span>{weekday}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            请选择今日学习 / 训练科目
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
            双轨自律计划 · 每日专属科目专注执行，训练过程无干扰切换
          </p>
        </div>

        {/* Status Notice if already completed today */}
        {calendarStats.completedToday && (
          <div className="mb-5 p-3.5 bg-zinc-950 border border-emerald-900/60 rounded-2xl flex items-center gap-3 text-xs text-zinc-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">今日训练已达标！</span>
              <span className="text-zinc-400 ml-1">
                {calendarStats.completedCoreToday && calendarStats.completedKoreanToday 
                  ? '核心与韩语皆已打卡完成，坚持超棒！' 
                  : calendarStats.completedCoreToday 
                    ? '核心训练已打卡，仍可选择练习韩语。' 
                    : '韩语练习已打卡，仍可选择核心训练。'}
              </span>
            </div>
          </div>
        )}

        {/* Rotation recommendation */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3.5 mb-5 text-xs text-zinc-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">轮换推荐：</span>
            <span className="text-zinc-300">{recommendationReason}</span>
          </div>
        </div>

        {/* Subject Cards */}
        <div className="space-y-3.5 mb-6">
          {/* Card 1: Core Workout */}
          <div 
            className={`p-4 sm:p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
              recommendedTrack === 'core'
                ? 'bg-zinc-950/90 border-zinc-700 hover:border-zinc-500'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-zinc-800 text-white flex items-center justify-center shrink-0 border border-zinc-700 mt-0.5">
                  <Dumbbell className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-white">核心强化训练</h3>
                    {recommendedTrack === 'core' && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-zinc-950 text-[10px] font-black uppercase">
                        今日推荐
                      </span>
                    )}
                    {calendarStats.completedCoreToday && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                        今日已达标
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    5大核心动作（死虫式、平板支撑、鸟狗式、侧平板、臀桥）+ 7项深度拉伸放松
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>约15–20分钟</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-zinc-500" />
                      <span>节拍震动 · 动作指导</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-end">
              <button
                id="enter-core-subject-btn"
                onClick={() => onSelectTrack('core')}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm transform hover:scale-[1.01] active:scale-[0.98]"
              >
                <span>进入核心训练</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Korean Self-Study */}
          <div 
            className={`p-4 sm:p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
              recommendedTrack === 'korean'
                ? 'bg-zinc-950/90 border-zinc-700 hover:border-zinc-500'
                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-zinc-800 text-white flex items-center justify-center shrink-0 border border-zinc-700 mt-0.5">
                  <Languages className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-white">韩语自主学习 (20分钟)</h3>
                    {recommendedTrack === 'korean' && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-zinc-950 text-[10px] font-black uppercase">
                        今日推荐
                      </span>
                    )}
                    {calendarStats.completedKoreanToday && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                        今日已达标
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    进入20分钟专注倒计时，自主进行韩语单词、语法或听力学习，时间结束自动提醒达标
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>专注20分钟</span>
                    </span>
                    <span>倒计时提醒 · 无繁琐打扰</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-end">
              <button
                id="enter-korean-subject-btn"
                onClick={() => onSelectTrack('korean')}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm transform hover:scale-[1.01] active:scale-[0.98]"
              >
                <span>进入韩语学习</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Calendar & Streak */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              已累计打卡 <strong className="text-white font-mono">{calendarStats.totalDays}</strong> 天
              {calendarStats.currentStreak > 1 && (
                <span className="ml-1 text-zinc-400 font-mono">
                  (连续 <strong className="text-white">{calendarStats.currentStreak}</strong> 天)
                </span>
              )}
            </span>
          </div>

          <button
            id="view-calendar-from-selection-btn"
            onClick={onOpenCalendar}
            className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 font-semibold transition px-3 py-1.5 rounded-lg hover:bg-zinc-800 border border-zinc-800"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>查看打卡日历</span>
          </button>
        </div>
      </div>
    </div>
  );
};
