import React, { useState } from 'react';
import { DailyTrainingRecord, TrainingCalendarData } from '../types';
import { formatChineseDate, getTodayDateString } from '../utils/dailyTracker';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  Languages, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Clock, 
  X,
  Sparkles,
  Award
} from 'lucide-react';

interface TrainingCalendarModalProps {
  isOpen?: boolean;
  calendarData: TrainingCalendarData;
  onClose: () => void;
  onStartTrack?: (track: 'core' | 'korean') => void;
}

export const TrainingCalendarModal: React.FC<TrainingCalendarModalProps> = ({
  isOpen = true,
  calendarData,
  onClose,
  onStartTrack,
}) => {
  const todayStr = getTodayDateString();
  const todayParts = todayStr.split('-').map(Number);
  
  // Current viewed month
  const [viewYear, setViewYear] = useState<number>(todayParts[0]);
  const [viewMonth, setViewMonth] = useState<number>(todayParts[1]); // 1-12
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  if (isOpen === false) return null;

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(y => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(y => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Generate calendar days for viewYear & viewMonth
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Selected date details
  const selectedRecord: DailyTrainingRecord | undefined = calendarData.records[selectedDate];
  const { fullDate: selectedFullDate } = formatChineseDate(selectedDate);

  // Overall Stats
  const completedDateKeys = Object.keys(calendarData.records).filter(k => {
    const r = calendarData.records[k];
    return r && (r.completedCore || r.completedKorean);
  });
  const totalCompletedDays = completedDateKeys.length;

  // Month specific completed days
  const currentMonthKeyPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const monthCompletedDays = completedDateKeys.filter(k => k.startsWith(currentMonthKeyPrefix)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-calendar-title"
      >
        {/* Close Button */}
        <button
          id="close-calendar-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition z-10"
          title="关闭日历"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center shadow-inner">
            <CalendarIcon className="w-5 h-5 text-zinc-200" />
          </div>
          <div>
            <h2 id="training-calendar-title" className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>训练完成日历</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
                双轨交替打卡
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              一天做核心训练 · 一天练韩语20分钟 · 标记每一个达标之日
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-zinc-950 border border-zinc-800 p-2.5 sm:p-3 rounded-2xl text-center">
            <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[10px] text-zinc-400 mb-0.5">累计达标天数</div>
            <div className="text-lg sm:text-xl font-black font-mono text-white">
              {totalCompletedDays} <span className="text-xs text-zinc-500 font-sans">天</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-2.5 sm:p-3 rounded-2xl text-center">
            <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[10px] text-zinc-400 mb-0.5">{viewMonth}月达标天数</div>
            <div className="text-lg sm:text-xl font-black font-mono text-white">
              {monthCompletedDays} <span className="text-xs text-zinc-500 font-sans">天</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-2.5 sm:p-3 rounded-2xl text-center">
            <Sparkles className="w-4 h-4 text-zinc-300 mx-auto mb-1" />
            <div className="text-[10px] text-zinc-400 mb-0.5">今日状态</div>
            <div className="text-xs sm:text-sm font-bold text-zinc-200 mt-1">
              {calendarData.records[todayStr]?.completedCore || calendarData.records[todayStr]?.completedKorean ? (
                <span className="text-emerald-400">今日已达标 ✓</span>
              ) : (
                <span className="text-zinc-400">今日待打卡</span>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Navigation & Month Picker */}
        <div className="flex items-center justify-between px-2 mb-3">
          <div className="text-base font-black text-white font-mono flex items-center gap-2">
            <span>{viewYear} 年 {viewMonth} 月</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="calendar-prev-month-btn"
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="calendar-today-btn"
              onClick={() => {
                setViewYear(todayParts[0]);
                setViewMonth(todayParts[1]);
                setSelectedDate(todayStr);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              今天
            </button>
            <button
              id="calendar-next-month-btn"
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 font-bold mb-1">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4 overflow-y-auto max-h-56 p-1 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
          {calendarCells.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
            }

            const cellDateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const record = calendarData.records[cellDateStr];
            const hasCore = Boolean(record?.completedCore);
            const hasKorean = Boolean(record?.completedKorean);
            const isCompleted = hasCore || hasKorean;
            const isToday = cellDateStr === todayStr;
            const isSelected = cellDateStr === selectedDate;

            return (
              <button
                key={cellDateStr}
                onClick={() => setSelectedDate(cellDateStr)}
                className={`h-10 sm:h-12 rounded-xl transition flex flex-col items-center justify-between p-1 relative text-xs font-mono ${
                  isSelected
                    ? 'bg-zinc-800 ring-2 ring-white text-white'
                    : isToday
                      ? 'bg-zinc-900 border border-zinc-600 text-white font-bold'
                      : 'hover:bg-zinc-800/60 text-zinc-300'
                }`}
              >
                {/* Date Number */}
                <span className={`text-xs ${isToday ? 'font-black text-white underline underline-offset-2' : ''}`}>
                  {dayNum}
                </span>

                {/* Training Completion Badge Indicator */}
                {isCompleted ? (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {hasCore && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" title="完成核心训练" />
                    )}
                    {hasKorean && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" title="完成韩语训练" />
                    )}
                  </div>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Detail Card */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3.5 mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono">{selectedFullDate}</span>
              {selectedDate === todayStr && (
                <span className="px-1.5 py-0.5 bg-zinc-800 text-[10px] text-zinc-300 rounded font-sans">
                  今日
                </span>
              )}
            </div>
            {selectedRecord && (selectedRecord.completedCore || selectedRecord.completedKorean) ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>已达标</span>
              </span>
            ) : (
              <span className="text-xs text-zinc-500">无打卡记录</span>
            )}
          </div>

          {selectedRecord && (selectedRecord.completedCore || selectedRecord.completedKorean) ? (
            <div className="space-y-1.5 text-xs">
              {selectedRecord.completedCore && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    <span>核心强化训练</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                    {selectedRecord.coreSeconds ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{Math.round(selectedRecord.coreSeconds / 60)} 分钟</span>
                      </span>
                    ) : null}
                    {selectedRecord.coreCalories ? (
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Flame className="w-3 h-3 text-amber-500 fill-current" />
                        <span>{selectedRecord.coreCalories.toFixed(1)} kcal</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {selectedRecord.completedKorean && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                    <span>韩语自主学习 (20分钟)</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{selectedRecord.koreanSeconds ? Math.round(selectedRecord.koreanSeconds / 60) : 20} 分钟</span>
                    </span>
                    <span className="text-blue-300 font-sans">自主学习已达标</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-400 py-1">
              该日期未完成训练。保持自律，交替前行！
              {selectedDate === todayStr && onStartTrack && (
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onStartTrack('core');
                    }}
                    className="flex-1 py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    <span>做核心训练</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onStartTrack('korean');
                    }}
                    className="flex-1 py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                    <span>练韩语20分钟</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>核心动作已达标</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>韩语20分已达标</span>
          </span>
        </div>
      </div>
    </div>
  );
};
