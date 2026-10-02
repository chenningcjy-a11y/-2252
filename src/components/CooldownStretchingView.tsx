import React, { useEffect, useRef } from 'react';
import { StretchAction, COOLDOWN_STRETCHES } from '../data/cooldownStretches';
import { 
  HeartHandshake, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Wind, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface CooldownStretchingViewProps {
  stretchIndex: number;
  currentSide: 'A' | 'B';
  timeRemaining: number;
  isPaused: boolean;
  totalElapsedSeconds: number;
  onTogglePause: () => void;
  onSkipCurrentStretch: () => void;
  onPreviousStretch: () => void;
  onFinishCooldown: () => void;
  onSelectStretch: (index: number) => void;
}

export const CooldownStretchingView: React.FC<CooldownStretchingViewProps> = ({
  stretchIndex,
  currentSide,
  timeRemaining,
  isPaused,
  totalElapsedSeconds,
  onTogglePause,
  onSkipCurrentStretch,
  onPreviousStretch,
  onFinishCooldown,
  onSelectStretch,
}) => {
  const currentStretch: StretchAction = COOLDOWN_STRETCHES[stretchIndex] || COOLDOWN_STRETCHES[0];
  const totalStretches = COOLDOWN_STRETCHES.length;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalCooldownDurationSeconds = COOLDOWN_STRETCHES.reduce(
    (acc, s) => acc + (s.isUnilateral ? s.durationPerSide * 2 : s.durationPerSide), 
    0
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Canvas gentle breathing wave animation to guide relaxed inhalation and exhalation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      // Draw subtle calming wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2.5;

      for (let x = 0; x < w; x++) {
        const angle = (x / w) * Math.PI * 4 + step;
        const y = centerY + Math.sin(angle) * 18 * Math.sin(step * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Soft pulsating circle in center
      const breathPhase = (Math.sin(step) + 1) / 2; // 0 to 1
      const radius = 22 + breathPhase * 16;
      ctx.beginPath();
      ctx.arc(w / 2, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + breathPhase * 0.08})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + breathPhase * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (!isPaused) {
        step += 0.025;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPaused]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0 shadow-sm">
            <HeartHandshake className="w-5 h-5 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                训练后黄金拉伸放松 (5–7分钟)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold border border-zinc-700">
                第 {stretchIndex + 1} / {totalStretches} 项
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              核心训练后卸压恢复 · 重点针对腹部、髋部、臀部、腿后侧与肩背
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            id="finish-cooldown-early-btn"
            onClick={onFinishCooldown}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5"
            title="跳过剩余拉伸，直接进入结课报告"
          >
            <span>跳过拉伸</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stretch Progress Nav Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
        {COOLDOWN_STRETCHES.map((s, idx) => {
          const isCurrent = idx === stretchIndex;
          const isPassed = idx < stretchIndex;
          return (
            <button
              key={s.id}
              onClick={() => onSelectStretch(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border shrink-0 flex items-center gap-1.5 ${
                isCurrent 
                  ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow-sm' 
                  : isPassed
                    ? 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-400'
              }`}
            >
              <span className="font-mono text-[10px]">#{idx + 1}</span>
              <span>{s.name}</span>
              {isPassed && <CheckCircle2 className="w-3 h-3 text-zinc-400" />}
            </button>
          );
        })}
      </div>

      {/* Main Stretch Visual and Timer Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: Timer & Breathing Wave Visual */}
        <div className="md:col-span-6 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Top side tag if unilateral */}
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-zinc-400">
              {currentStretch.focusArea}
            </span>
            {currentStretch.isUnilateral && (
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono font-bold">
                {currentSide === 'A' ? '左侧 / 侧A' : '右侧 / 侧B'}
              </span>
            )}
          </div>

          {/* Large Calming Breath Wave and Timer */}
          <div className="relative w-full h-44 flex flex-col items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={320} 
              height={160} 
              className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
            />
            <div className="relative z-10">
              <div className="text-7xl sm:text-8xl font-black font-mono text-white tracking-tight drop-shadow-sm">
                {timeRemaining}
                <span className="text-2xl text-zinc-500 ml-1">秒</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-300 mt-1 font-medium">
                <Wind className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                <span>跟随节律平稳呼吸 · 舒适牵拉</span>
              </div>
            </div>
          </div>

          {/* Controls: Pause / Skip / Prev */}
          <div className="w-full flex items-center justify-center gap-3 pt-3 border-t border-zinc-800/80">
            <button
              onClick={onPreviousStretch}
              disabled={stretchIndex === 0 && currentSide === 'A'}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 border border-zinc-800 transition"
              title="上一个拉伸"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePause}
              className="px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm transition flex items-center gap-2 shadow-md"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              <span>{isPaused ? '继续拉伸' : '暂停计时'}</span>
            </button>

            <button
              onClick={onSkipCurrentStretch}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center gap-1.5 text-xs font-semibold"
              title="跳过当前拉伸进入下一个"
            >
              <span>{currentStretch.isUnilateral && currentSide === 'A' ? '换边' : '下一动作'}</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Detailed Posture Instruction & Coach Rules */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">
                  {currentStretch.name}
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  {currentStretch.enName}
                </span>
              </div>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 text-xs border border-zinc-800 font-medium">
                🎯 目标：{currentStretch.target}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                <span>动作做法</span>
              </div>
              <p className="text-zinc-300 leading-relaxed bg-zinc-900/70 p-3 rounded-xl border border-zinc-800/80">
                {currentStretch.instruction}
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                <span>牵拉感觉与核心原则</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                {currentStretch.keyRule}
              </p>
            </div>

            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
              <Wind className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">呼吸配合：</strong>
                <span className="text-zinc-400 ml-1">{currentStretch.breathingTip}</span>
              </div>
            </div>
          </div>

          {/* Gentle reminder banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
            💡 <strong className="text-zinc-300">教练叮嘱：</strong> 拉伸时以舒服温和的牵拉感为准，<strong>不需要拉到疼痛</strong>。刚做完高强度核心训练，肌肉处于疲劳状态，此时追求的是<strong>神经放松与血液循环恢复</strong>，切勿猛烈弹震。
          </div>
        </div>
      </div>
    </div>
  );
};
