import React, { useState } from 'react';
import {
  CombatEngineConfig,
  DEFAULT_COMBAT_CONFIG,
  COMBAT_MOVES_LIBRARY,
  CombatMoveId,
  MartialArtsDiscipline,
  compileCombatActionPrompt,
} from '../../utils/action-combat-engine';
import {
  Zap,
  Activity,
  RotateCw,
  Sparkles,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Layers,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface ActionCombatPanelProps {
  basePrompt?: string;
}

export const ActionCombatPanel: React.FC<ActionCombatPanelProps> = ({
  basePrompt = 'Elena confronts cybernetic enforcer on rain-slick elevated skybridge',
}) => {
  const [config, setConfig] = useState<CombatEngineConfig>(DEFAULT_COMBAT_CONFIG);
  const [copied, setCopied] = useState<boolean>(false);

  const compilation = compileCombatActionPrompt(basePrompt, config);
  const selectedMove = COMBAT_MOVES_LIBRARY[config.selectedMove];

  const handleToggleMatrixShutter = () => {
    setConfig((prev) => ({
      ...prev,
      enforceMatrixShutter: !prev.enforceMatrixShutter,
      speedRampingActive: !prev.enforceMatrixShutter ? true : prev.speedRampingActive,
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(compilation.combatPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Cinematic Combat & Matrix Action Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                BULLET-TIME 360°
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Procedural combat choreography, 90° crisp action shutter, Wire-Fu anti-gravity, and 120fps speed ramping
            </p>
          </div>
        </div>

        {/* Matrix Shutter & Ramp Toggle */}
        <button
          onClick={handleToggleMatrixShutter}
          data-testid="matrix-shutter-toggle"
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer shadow-lg ${
            config.enforceMatrixShutter
              ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-neutral-950 border-rose-400 shadow-rose-500/25 ring-2 ring-rose-400/40'
              : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>MATRIX SHUTTER & RAMP</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
              config.enforceMatrixShutter ? 'bg-neutral-950 text-rose-400' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {config.enforceMatrixShutter ? '90° SHUTTER' : '180° STD'}
          </span>
        </button>
      </div>

      {/* Control Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Martial Arts Move Selector */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Choreography Move Library</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">{selectedMove.discipline}</span>
          </div>

          <div className="space-y-2">
            {(Object.keys(COMBAT_MOVES_LIBRARY) as CombatMoveId[]).map((moveId) => {
              const move = COMBAT_MOVES_LIBRARY[moveId];
              const isSelected = config.selectedMove === moveId;

              return (
                <button
                  key={moveId}
                  onClick={() => setConfig({ ...config, selectedMove: moveId, discipline: move.discipline })}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500/80 text-rose-300 font-bold shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="truncate">{move.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-1">
                    <span>{move.discipline}</span>
                    <span>Apex: {move.hangTimeSeconds}s</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Matrix Bullet-Time Rig */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-cyan-400" />
              <span>Matrix Bullet-Time 360° Rig</span>
            </span>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                config.bulletTime.active
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {config.bulletTime.active ? 'ORBIT ENGAGED' : 'OFF'}
            </span>
          </div>

          <div className="space-y-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-neutral-400">Orbit Radius:</span>
                <span className="text-cyan-400 font-bold">{config.bulletTime.orbitRadiusMeters.toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.1"
                value={config.bulletTime.orbitRadiusMeters}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bulletTime: { ...config.bulletTime, orbitRadiusMeters: parseFloat(e.target.value) },
                  })
                }
                aria-label="Bullet-Time Orbit Radius"
                className="w-full accent-cyan-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-neutral-400">Sweep Sweep Time:</span>
                <span className="text-cyan-400 font-bold">{config.bulletTime.sweepDurationSec.toFixed(1)}s (360°)</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={config.bulletTime.sweepDurationSec}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    bulletTime: { ...config.bulletTime, sweepDurationSec: parseFloat(e.target.value) },
                  })
                }
                aria-label="Bullet-Time Sweep Duration"
                className="w-full accent-cyan-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="pt-1 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
              <span>Freeze Vector Intensity:</span>
              <span className="text-emerald-400 font-bold">100% Frozen Apex</span>
            </div>
          </div>
        </div>

        {/* Column 3: Speed Ramping & Shutter Physics */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Speed Ramping & Physics</span>
            </span>
          </div>

          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3 text-xs font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="text-neutral-400">Speed Ramp Curve:</span>
              <span className="text-amber-400 font-bold">24fps → 120fps → 36fps</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="text-neutral-400">Action Shutter Angle:</span>
              <span className="text-rose-400 font-bold">{config.enforceMatrixShutter ? '90° High-Impact' : '180° Std'}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="text-neutral-400">Wire-Fu Aerial Hang-Time:</span>
              <span className="text-cyan-400 font-bold">{selectedMove.wireFuAntiGravity ? `${selectedMove.hangTimeSeconds}s Active` : 'Standard Gravity'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Impact Shake:</span>
              <span className="text-neutral-200">{config.microImpactShakeDecibels} dB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compiled Action Choreography Prompt Preview */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-rose-500/40 space-y-3 shadow-lg shadow-rose-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Compiled Combat Choreography & Shutter Prompt
            </h4>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED CHOREOGRAPHY' : 'COPY ACTION PROMPT'}</span>
          </button>
        </div>

        <p className="text-xs text-rose-200/90 font-mono leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-rose-500/30">
          {compilation.combatPrompt}
        </p>
      </div>
    </div>
  );
};
