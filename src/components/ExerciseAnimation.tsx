import React from 'react';
import { motion } from 'motion/react';
import { ExerciseGuide, WorkoutPhase } from '../types';

interface ExerciseAnimationProps {
  exercise: ExerciseGuide;
  phase: WorkoutPhase;
  currentSide: 'A' | 'B'; // A = first side, B = second side
  currentRep: number;
  totalRepsCurrentSide: number;
  repSubPhase: 'extend' | 'hold' | 'return' | 'ready'; // for rep pacing
  timeRemaining: number;
}

export const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exercise,
  phase,
  currentSide,
  currentRep,
  totalRepsCurrentSide,
  repSubPhase,
  timeRemaining,
}) => {
  const isDeadBug = exercise.id === 'dead-bug';
  const isBirdDog = exercise.id === 'bird-dog';
  const isPlank = exercise.id === 'plank';
  const isSidePlank = exercise.id === 'side-plank';
  const isGluteBridge = exercise.id === 'glute-bridge';

  // Sub-phase label text
  const getSubPhaseLabel = () => {
    if (phase === 'prep_countdown') return '准备姿态中...';
    if (phase === 'switch_side_prep') return '🔄 换边调整，准备开始另一侧';
    if (phase === 'resting') return '💆 组间休息，深长呼吸';
    if (phase === 'manual_next_wait') return '🎉 本动作3组全部完成！';

    if (isPlank) return '🔥 腹部收紧抗推，保持一条直线';
    if (isSidePlank) return currentSide === 'A' ? '🔥 支撑侧腹发力抬高髋部（侧A）' : '🔥 支撑侧腹发力抬高髋部（侧B）';

    switch (repSubPhase) {
      case 'extend':
        return '缓慢伸展（呼气）';
      case 'hold':
        return '顶峰稳定 1-2秒';
      case 'return':
        return '平稳收回（吸气）';
      default:
        return '准备发力';
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm relative overflow-hidden">
      {/* Background glow based on phase */}
      <div 
        className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          phase === 'resting' 
            ? 'bg-blue-500/15' 
            : phase === 'exercising' 
              ? 'bg-emerald-500/20' 
              : 'bg-amber-500/15'
        }`} 
      />

      {/* Side and Rep Tag */}
      <div className="w-full flex items-center justify-between text-xs font-mono mb-2 z-10 px-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
          {exercise.type === 'reps-unilateral' && (
            <>
              <span className={`w-2 h-2 rounded-full ${currentSide === 'A' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
              {currentSide === 'A' 
                ? (isDeadBug ? '侧A：右手 + 左腿' : '侧A：右手 + 左腿') 
                : (isDeadBug ? '侧B：左手 + 右腿' : '侧B：左手 + 右腿')}
            </>
          )}
          {exercise.type === 'timed-unilateral' && (
            <>
              <span className={`w-2 h-2 rounded-full ${currentSide === 'A' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
              {currentSide === 'A' ? '第一侧（例如右前臂）' : '第二侧（例如左前臂）'}
            </>
          )}
          {exercise.type === 'timed-hold' && '全核心等长对抗'}
          {exercise.type === 'reps' && '双侧对称发力'}
        </span>

        <span className="text-slate-400 font-medium tracking-wide">
          {phase === 'exercising' && (
            exercise.type === 'reps-unilateral' 
              ? `第 ${currentRep} / ${totalRepsCurrentSide} 次` 
              : exercise.type === 'reps'
                ? `第 ${currentRep} / ${exercise.repsTotal} 次`
                : `倒计时 ${timeRemaining}s`
          )}
        </span>
      </div>

      {/* SVG Canvas for Figure */}
      <div className="relative w-full max-w-[320px] h-[170px] flex items-center justify-center">
        {/* DEAD BUG ANIMATION */}
        {isDeadBug && (
          <svg viewBox="0 0 300 160" className="w-full h-full">
            {/* Ground mat */}
            <line x1="20" y1="125" x2="280" y2="125" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            <text x="30" y="145" fill="#64748b" fontSize="10">瑜伽垫地面 (腰部微贴勿死压)</text>

            {/* Torso/Head */}
            {/* Torso lying flat */}
            <rect x="110" y="110" width="70" height="14" rx="7" fill="#475569" />
            {/* Head */}
            <circle cx="95" cy="116" r="10" fill="#cbd5e1" />

            {/* Fixed limb representation vs active limbs */}
            {/* Arms */}
            <motion.line
              x1="125"
              y1="112"
              x2={phase === 'exercising' && repSubPhase === 'extend' ? "75" : "125"}
              y2={phase === 'exercising' && repSubPhase === 'extend' ? "116" : "55"}
              stroke="#38bdf8"
              strokeWidth="5"
              strokeLinecap="round"
              animate={
                phase === 'exercising'
                  ? repSubPhase === 'extend'
                    ? { x2: 70, y2: 114 }
                    : repSubPhase === 'hold'
                    ? { x2: 70, y2: 114 }
                    : { x2: 125, y2: 55 }
                  : { x2: 125, y2: 55 }
              }
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            {/* Static hand */}
            <line x1="125" y1="112" x2="125" y2="55" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 3" opacity="0.6" />

            {/* Legs */}
            {/* Active Leg */}
            <motion.path
              d="M 175 115 L 175 65 L 225 65"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={
                phase === 'exercising'
                  ? repSubPhase === 'extend' || repSubPhase === 'hold'
                    ? { d: "M 175 115 L 235 112 L 265 112" }
                    : { d: "M 175 115 L 175 65 L 225 65" }
                  : { d: "M 175 115 L 175 65 L 225 65" }
              }
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            {/* Static 90 deg leg */}
            <path d="M 175 115 L 175 65 L 225 65" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" opacity="0.4" strokeDasharray="3 3" />

            {/* Core focus beacon */}
            <circle cx="145" cy="116" r="8" fill="#10b981" opacity="0.8">
              <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        )}

        {/* BIRD DOG ANIMATION */}
        {isBirdDog && (
          <svg viewBox="0 0 300 160" className="w-full h-full">
            <line x1="20" y1="130" x2="280" y2="130" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            
            {/* Torso horizontal bar */}
            <line x1="100" y1="85" x2="190" y2="85" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
            {/* Head facing down */}
            <circle cx="85" cy="85" r="10" fill="#cbd5e1" />

            {/* Ground support limbs */}
            {/* Support Arm */}
            <line x1="105" y1="88" x2="105" y2="130" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            {/* Support Knee */}
            <line x1="180" y1="88" x2="180" y2="130" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />

            {/* Active Moving Arm */}
            <motion.line
              x1="105"
              y1="88"
              x2="105"
              y2="130"
              stroke="#38bdf8"
              strokeWidth="5"
              strokeLinecap="round"
              animate={
                phase === 'exercising' && (repSubPhase === 'extend' || repSubPhase === 'hold')
                  ? { x2: 30, y2: 85 }
                  : { x2: 105, y2: 130 }
              }
              transition={{ duration: 0.9, ease: "easeInOut" }}
            />

            {/* Active Moving Leg */}
            <motion.line
              x1="180"
              y1="88"
              x2="180"
              y2="130"
              stroke="#fbbf24"
              strokeWidth="5"
              strokeLinecap="round"
              animate={
                phase === 'exercising' && (repSubPhase === 'extend' || repSubPhase === 'hold')
                  ? { x2: 265, y2: 85 }
                  : { x2: 180, y2: 130 }
              }
              transition={{ duration: 0.9, ease: "easeInOut" }}
            />

            {/* Alignment horizontal level indicator */}
            <line x1="30" y1="85" x2="265" y2="85" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          </svg>
        )}

        {/* PLANK ANIMATION */}
        {isPlank && (
          <svg viewBox="0 0 300 160" className="w-full h-full">
            <line x1="20" y1="130" x2="280" y2="130" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

            {/* Forearm on ground */}
            <line x1="65" y1="130" x2="100" y2="130" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            <line x1="100" y1="130" x2="100" y2="90" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />

            {/* Straight body line from head to heels */}
            <line x1="80" y1="82" x2="240" y2="125" stroke="#38bdf8" strokeWidth="10" strokeLinecap="round" />
            <circle cx="70" cy="78" r="9" fill="#cbd5e1" />
            {/* Feet at 240, 125 */}
            <circle cx="240" cy="128" r="4" fill="#fbbf24" />

            {/* Tension pulse arrows around core */}
            <g transform="translate(145, 98)">
              <circle cx="0" cy="0" r="14" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>
        )}

        {/* SIDE PLANK ANIMATION */}
        {isSidePlank && (
          <svg viewBox="0 0 300 160" className="w-full h-full">
            <line x1="20" y1="130" x2="280" y2="130" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

            {/* Forearm base */}
            <line x1="80" y1="130" x2="110" y2="130" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            <line x1="110" y1="130" x2="110" y2="95" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />

            {/* Diagonal torso & legs line */}
            <line x1="90" y1="85" x2="235" y2="128" stroke="#38bdf8" strokeWidth="9" strokeLinecap="round" />
            <circle cx="80" cy="80" r="9" fill="#cbd5e1" />

            {/* Raised top arm */}
            <line x1="110" y1="90" x2="110" y2="45" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />

            {/* Lateral support highlight */}
            <path d="M 140 100 Q 150 85 160 105" stroke="#10b981" strokeWidth="3" fill="none" />
          </svg>
        )}

        {/* GLUTE BRIDGE ANIMATION */}
        {isGluteBridge && (
          <svg viewBox="0 0 300 160" className="w-full h-full">
            <line x1="20" y1="130" x2="280" y2="130" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

            {/* Upper back & Head on ground */}
            <circle cx="70" cy="120" r="9" fill="#cbd5e1" />
            <line x1="75" y1="125" x2="105" y2="125" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />

            {/* Feet planted flat */}
            <line x1="205" y1="128" x2="225" y2="128" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />

            {/* Lower legs vertical / angled */}
            <line x1="215" y1="128" x2="200" y2="78" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />

            {/* Pelvis/Torso bridge motion */}
            <motion.line
              x1="105"
              y1="125"
              x2="200"
              y2="78"
              stroke="#38bdf8"
              strokeWidth="9"
              strokeLinecap="round"
              animate={
                phase === 'exercising' && (repSubPhase === 'hold' || repSubPhase === 'extend')
                  ? { y1: 120, x2: 200, y2: 78 }
                  : { y1: 125, x2: 200, y2: 120 }
              }
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />

            {/* Glute squeeze focal point */}
            <circle cx="160" cy="98" r="8" fill="#f43f5e" opacity="0.85">
              <animate attributeName="r" values="5;9;5" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        )}
      </div>

      {/* Real-time Cue Sub-text */}
      <div className="w-full text-center mt-1 z-10">
        <span className="inline-block px-3 py-1 rounded-lg bg-slate-800/90 text-emerald-400 font-semibold text-xs tracking-wider border border-emerald-500/20 shadow-sm">
          {getSubPhaseLabel()}
        </span>
      </div>
    </div>
  );
};
