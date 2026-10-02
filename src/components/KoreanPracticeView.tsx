import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Bell,
  Sparkles
} from 'lucide-react';
import { soundEffects, speakText, cancelSpeech } from '../utils/audioVibration';

interface KoreanPracticeViewProps {
  onCompletePractice: (durationSeconds: number) => void;
  onExitPractice: () => void;
  voiceVolume?: number;
}

const TOTAL_KOREAN_SECONDS = 20 * 60; // 20 minutes = 1200 seconds

export const KoreanPracticeView: React.FC<KoreanPracticeViewProps> = ({
  onCompletePractice,
  onExitPractice,
  voiceVolume = 1.0,
}) => {
  // 20-minute countdown state - starts running immediately
  const [secondsLeft, setSecondsLeft] = useState<number>(TOTAL_KOREAN_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const timerRef = useRef<number | null>(null);

  // Announce start on mount
  useEffect(() => {
    if (soundAlerts) {
      soundEffects.playTone('countdown', 0.6);
      speakText('20分钟韩语自主学习计时开始。请专注学习，时间到将自动提醒。', {
        rate: 1.0,
        volume: voiceVolume,
        interrupt: false,
        lang: 'zh-CN',
      });
    }
  }, []);

  // Timer countdown loop
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }

        // Halfway checkpoint sound/voice alert at 10:00 remaining
        if (prev === 600 && soundAlerts) {
          soundEffects.playTone('countdown', 0.5);
          speakText('韩语学习已过半，还剩10分钟，继续加油。', {
            rate: 1.0,
            volume: voiceVolume,
            lang: 'zh-CN',
          });
        }

        // 1-minute remaining alert
        if (prev === 60 && soundAlerts) {
          soundEffects.playTone('countdown', 0.6);
          speakText('还剩最后1分钟，准备收尾。', {
            rate: 1.0,
            volume: voiceVolume,
            lang: 'zh-CN',
          });
        }

        // Final 5 seconds gentle tick
        if (prev <= 5 && prev > 0 && soundAlerts) {
          soundEffects.playTone('tick', 0.4);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundAlerts, voiceVolume]);

  const handleTimeUp = () => {
    setIsRunning(false);
    cancelSpeech();
    soundEffects.playTone('complete', 0.9);
    speakText('时间到！今日韩语自主学习圆满结束，今日学习已达标，请明天再来训练！', {
      rate: 1.0,
      volume: voiceVolume,
      interrupt: true,
      lang: 'zh-CN',
    });
    onCompletePractice(TOTAL_KOREAN_SECONDS);
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      soundEffects.playTone('tick', 0.4);
    } else {
      if (secondsLeft === 0) {
        setSecondsLeft(TOTAL_KOREAN_SECONDS);
      }
      setIsRunning(true);
      soundEffects.playTone('countdown', 0.5);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(TOTAL_KOREAN_SECONDS);
    soundEffects.playTone('tick', 0.4);
  };

  // Allow manual early finish if user completed their study goals
  const handleFinishEarly = () => {
    const elapsedSeconds = TOTAL_KOREAN_SECONDS - secondsLeft;
    setIsRunning(false);
    cancelSpeech();
    soundEffects.playTone('complete', 0.8);
    speakText('今日韩语学习结束，打卡成功！请明天再来训练！', {
      rate: 1.0,
      volume: voiceVolume,
      interrupt: true,
      lang: 'zh-CN',
    });
    onCompletePractice(Math.max(elapsedSeconds, 60));
  };

  // Format mm:ss
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, ((TOTAL_KOREAN_SECONDS - secondsLeft) / TOTAL_KOREAN_SECONDS) * 100));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
        <button
          id="exit-korean-view-btn"
          onClick={onExitPractice}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-zinc-800"
          title="返回重新选择今日训练科目"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回选择科目</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-bold text-zinc-200">韩语自主学习 · 20分钟倒计时</span>
        </div>

        <button
          id="toggle-sound-alert-btn"
          onClick={() => setSoundAlerts(!soundAlerts)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition ${
            soundAlerts 
              ? 'bg-blue-950/60 border-blue-800 text-blue-300' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}
          title="中途与结束语音提示开关"
        >
          {soundAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundAlerts ? '提示音开' : '静音'}</span>
        </button>
      </div>

      {/* Main Focus Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 text-center shadow-xl relative overflow-hidden">
        {/* Ambient subtle light glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* State Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300 mb-6">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>自行专注学习韩语 · 结束后自动提醒达标</span>
        </div>

        {/* Circular Countdown Ring */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-zinc-800"
                strokeWidth="5.5"
                fill="transparent"
              />
              {/* Animated Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-blue-500 transition-all duration-1000 ease-linear"
                strokeWidth="5.5"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white mb-1">
                {formattedTime}
              </div>
              <div className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>目标：20 分钟</span>
              </div>
              <div className="text-[11px] text-zinc-500 font-mono mt-1">
                已专注 {Math.floor((TOTAL_KOREAN_SECONDS - secondsLeft) / 60)} 分钟 · {Math.round(progressPercent)}%
              </div>
            </div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            id="reset-korean-timer-btn"
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition"
            title="重置20分钟倒计时"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            id="toggle-korean-timer-btn"
            onClick={handleToggleTimer}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
              isRunning
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>暂停计时</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{secondsLeft === TOTAL_KOREAN_SECONDS ? '开始专注计时' : '继续学习'}</span>
              </>
            )}
          </button>

          <button
            id="finish-korean-early-btn"
            onClick={handleFinishEarly}
            className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-emerald-700/60 hover:text-emerald-400 text-zinc-400 transition"
            title="提前完成学习并打卡"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance */}
        <div className="mt-8 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left text-xs text-zinc-400 space-y-1.5 max-w-lg mx-auto">
          <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-blue-400" />
            <span>自主学习说明</span>
          </div>
          <p className="leading-relaxed">
            您可以自行使用课本、背单词软件、听力音频或笔记学习。倒计时达到20分钟时，监督器会自动发出提示音并语音提醒：<strong className="text-zinc-200">“今日韩语学习结束，今日训练已达标，请明天再来训练”</strong>，并记录到右上角打卡日历中！
          </p>
        </div>
      </div>
    </div>
  );
};
