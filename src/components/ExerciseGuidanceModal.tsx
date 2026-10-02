import React, { useState } from 'react';
import { ExerciseGuide } from '../types';
import { CORE_EXERCISES } from '../data/exercises';
import { Human3DExerciseModel } from './Human3DExerciseModel';
import { BookOpen, AlertTriangle, Wind, Zap, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';

interface ExerciseGuidanceModalProps {
  currentExerciseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseGuidanceModal: React.FC<ExerciseGuidanceModalProps> = ({
  currentExerciseId,
  isOpen,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState(currentExerciseId);

  if (!isOpen) return null;

  const current = CORE_EXERCISES.find(e => e.id === selectedId) || CORE_EXERCISES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="exercise-guidance-dialog"
        className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">5大核心动作动作库与指导要领</h2>
              <p className="text-xs text-zinc-400">专业体能与舞蹈核心稳定控制指南</p>
            </div>
          </div>
          <button
            id="close-guidance-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise Quick Selector Pills */}
        <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto border-b border-zinc-800 bg-zinc-950/60 no-scrollbar">
          {CORE_EXERCISES.map((ex, index) => {
            const isSelected = ex.id === selectedId;
            return (
              <button
                key={ex.id}
                id={`select-guide-${ex.id}`}
                onClick={() => setSelectedId(ex.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>{index + 1}.</span>
                <span>{ex.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Title & Targets */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-bold">
                {current.enName}
              </span>
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                标准训练量：3组
              </span>
            </div>
            <h3 className="text-xl font-black text-white">{current.name}</h3>
            <p className="text-sm text-zinc-300 font-medium mt-1">
              🎯 主要练：{current.target}
            </p>
          </div>

          {/* 3D Real Human Biomechanical Model Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
                <span>3D 真人解剖学动作范式（支持360°旋转/缩放/视角预设）</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">1:1 生物力学还原本体动作</span>
            </div>
            <Human3DExerciseModel
              exercise={current}
              phase="exercising"
              currentSide="A"
              currentRep={1}
              totalRepsCurrentSide={8}
              repSubPhase="hold"
              timeRemaining={15}
            />
          </div>

          {/* Golden Rule */}
          <div className="bg-zinc-950 border-l-4 border-zinc-400 p-4 rounded-r-xl border-y border-r border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4 text-zinc-300" />
              <span>⭐ 最重要的地方 / 核心要领</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              {current.keyRule}
            </p>
          </div>

          {/* Starting Pose & Action Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Starting Pose */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                <span>起始姿势</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {current.startingPose.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-zinc-500 font-mono text-xs mt-0.5">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Steps */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-1.5">
                <ChevronRight className="w-4 h-4 text-zinc-300" />
                <span>动作细节</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {current.actionSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-zinc-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Breathing and Shaking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-zinc-400" />
                <span>呼吸节奏</span>
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {current.breathingTip}
              </p>
            </div>

            {current.shakingTip && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-zinc-400" />
                  <span>关于动作「发抖」</span>
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {current.shakingTip}
                </p>
              </div>
            )}
          </div>

          {/* Common Mistakes */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
            <h4 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-zinc-400" />
              <span>❌ 最容易犯的错误</span>
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {current.mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>

          {/* Dance Benefit */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
            <h4 className="text-sm font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
              <span>💃 对跳舞与姿态控制的价值</span>
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {current.danceBenefit}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 flex justify-end bg-zinc-900/90">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm transition"
          >
            知道了，开始练习
          </button>
        </div>
      </div>
    </div>
  );
};
