import React from 'react';
import { Trophy, Flame, Clock, RefreshCw, Award, HeartHandshake, Calendar, CheckCircle2, Languages, Dumbbell, BookOpen } from 'lucide-react';
import { TrainingTrack } from '../types';

interface WorkoutCompleteModalProps {
  totalSeconds: number;
  completedSets?: number;
  totalSets?: number;
  totalCalories?: number;
  cooldownCompleted?: boolean;
  track?: TrainingTrack;
  onRestart: () => void;
  onRedoCooldown?: () => void;
  onOpenCalendar?: () => void;
}

export const WorkoutCompleteModal: React.FC<WorkoutCompleteModalProps> = ({
  totalSeconds,
  completedSets = 5,
  totalSets = 5,
  totalCalories = 0,
  cooldownCompleted,
  track = 'core',
  onRestart,
  onRedoCooldown,
  onOpenCalendar,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}分${s < 10 ? '0' : ''}${s}秒`;
  };

  const isKorean = track === 'korean';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        id="workout-completed-dialog"
        className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center text-zinc-100 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-zinc-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 p-0.5 mx-auto mb-3 shadow-sm flex items-center justify-center">
          <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-zinc-100">
            {isKorean ? <Languages className="w-8 h-8 text-blue-400" /> : <Trophy className="w-8 h-8 text-amber-400" />}
          </div>
        </div>

        {/* User requested: "训练完成后，提示训练已达标，请明天再来训练" */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold font-mono mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>今日训练已达标 · 打卡成功</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
          太棒了，今日训练已达标！
        </h2>
        <p className="text-sm font-semibold text-emerald-400 mb-5">
          今日任务圆满达成，请明天再来训练！
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
            <Clock className="w-4 h-4 text-zinc-300 mx-auto mb-1" />
            <div className="text-[11px] text-zinc-400 mb-0.5">练习耗时</div>
            <div className="text-sm sm:text-base font-bold font-mono text-white">
              {formatTime(totalSeconds)}
            </div>
          </div>

          {!isKorean ? (
            <>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <Award className="w-4 h-4 text-zinc-300 mx-auto mb-1" />
                <div className="text-[11px] text-zinc-400 mb-0.5">完成组数</div>
                <div className="text-sm sm:text-base font-bold font-mono text-white">
                  {completedSets} / {totalSets}
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <Flame className="w-4 h-4 text-zinc-300 fill-current mx-auto mb-1" />
                <div className="text-[11px] text-zinc-400 mb-0.5 font-semibold">消耗热量</div>
                <div className="text-sm sm:text-base font-black font-mono text-white">
                  {totalCalories.toFixed(1)} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <Trophy className="w-4 h-4 text-zinc-300 mx-auto mb-1" />
                <div className="text-[11px] text-zinc-400 mb-0.5">放松拉伸</div>
                <div className="text-sm sm:text-base font-bold text-zinc-100">
                  {cooldownCompleted !== false ? '充分放松' : '已完成'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-[11px] text-zinc-400 mb-0.5">专注时长</div>
                <div className="text-sm sm:text-base font-bold font-mono text-white">
                  20 分钟
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <BookOpen className="w-4 h-4 text-zinc-300 mx-auto mb-1" />
                <div className="text-[11px] text-zinc-400 mb-0.5">学习方式</div>
                <div className="text-sm sm:text-base font-bold text-white">
                  自行学习
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-[11px] text-zinc-400 mb-0.5">今日状态</div>
                <div className="text-sm sm:text-base font-bold text-emerald-400">
                  学习已达标
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tomorrow Alternation Schedule Notice */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-left text-xs sm:text-sm text-zinc-300 mb-5 space-y-2">
          <div className="font-bold flex items-center justify-between text-zinc-200">
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-zinc-300" />
              <span>明日双轨轮换预告</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">一天核心 · 一天韩语</span>
          </div>
          <p className="leading-relaxed text-zinc-300">
            {isKorean ? (
              <>
                今天完成了 20 分钟韩语自主学习，明天将轮换为 <strong className="text-white">【核心强化训练】</strong>，给大脑放松，激活腹横肌与躯干稳定性！
              </>
            ) : (
              <>
                今天完成了五大核心动作与黄金拉伸，明天将轮换为 <strong className="text-white">【韩语自主学习 (20分钟)】</strong>，给身体肌肉充足超量恢复时间！
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onOpenCalendar && (
            <button
              id="view-calendar-from-completed-btn"
              onClick={onOpenCalendar}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl text-sm border border-zinc-700 transition flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-zinc-300" />
              <span>查看打卡日历</span>
            </button>
          )}

          {!isKorean && onRedoCooldown && (
            <button
              id="redo-cooldown-btn"
              onClick={onRedoCooldown}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl text-sm border border-zinc-700 transition"
            >
              重温拉伸 (5-7min)
            </button>
          )}

          <button
            id="restart-workout-btn"
            onClick={onRestart}
            className="flex-1 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-black rounded-2xl text-base transition flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            <span>返回首页</span>
          </button>
        </div>
      </div>
    </div>
  );
};

