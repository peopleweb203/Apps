import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  MorphologyConfig,
  DEFAULT_MORPHOLOGY_CONFIG,
  MORPHOLOGY_PROFILES,
  JawMorphologyType,
  SAMPLE_VISEME_TIMELINE,
  buildLipSyncMorphologyPayload,
  computeMorphologyDeformation,
} from '../../utils/lip-sync-morphology-engine';
import {
  Volume2,
  Mic,
  Activity,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface LipSyncMorphologyPanelProps {
  initialConfig?: MorphologyConfig;
  onConfigChange?: (config: MorphologyConfig) => void;
  basePrompt?: string;
}

export const LipSyncMorphologyPanel: React.FC<LipSyncMorphologyPanelProps> = ({
  initialConfig = DEFAULT_MORPHOLOGY_CONFIG,
  onConfigChange,
  basePrompt = 'Elena speaks with urgent conviction into dispatch communicator',
}) => {
  const { characters } = useStudio();
  const [config, setConfig] = useState<MorphologyConfig>(initialConfig);
  const [activeVisemeIndex, setActiveVisemeIndex] = useState<number>(2); // 'EH' default
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedProfile = MORPHOLOGY_PROFILES[config.architecture];
  const activeViseme = SAMPLE_VISEME_TIMELINE[activeVisemeIndex];
  const currentDeformation = computeMorphologyDeformation(activeViseme, config);
  const payload = buildLipSyncMorphologyPayload(basePrompt, config);

  const handleUpdate = (updated: MorphologyConfig) => {
    setConfig(updated);
    if (onConfigChange) onConfigChange(updated);
  };

  const handlePlayScrubber = () => {
    setIsPlayingAudio(true);
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % SAMPLE_VISEME_TIMELINE.length;
      setActiveVisemeIndex(idx);
    }, 140);

    setTimeout(() => {
      clearInterval(interval);
      setIsPlayingAudio(false);
    }, 2800);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(payload.finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Lip-Sync & Non-Human Jaw Deformation Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                UNIVERSAL VISEME MAPPER
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Anatomical articulation across humans, animal muzzles, alien mandibles, beaks, and rigid statues
            </p>
          </div>
        </div>

        {/* ElevenLabs Voice Binding Pill */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl font-mono text-xs">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-neutral-400">Bound ElevenLabs ID:</span>
          <span className="text-amber-300 font-bold">{config.elevenLabsVoiceId}</span>
        </div>
      </div>

      {/* Morphology Architecture Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
          Select Anatomical Jaw Architecture:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(Object.keys(MORPHOLOGY_PROFILES) as JawMorphologyType[]).map((archId) => {
            const profile = MORPHOLOGY_PROFILES[archId];
            const isSelected = config.architecture === archId;

            return (
              <button
                key={archId}
                onClick={() =>
                  handleUpdate({
                    ...config,
                    architecture: archId,
                    elasticityMultiplier: profile.defaultElasticity,
                  })
                }
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500/80 text-purple-200 shadow-lg ring-1 ring-purple-500/40'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="truncate">{profile.name.split(' ')[0]} {profile.name.split(' ')[1]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 block mt-0.5">
                    {profile.category}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                  {profile.description}
                </p>
                <div className="text-[9px] font-mono text-amber-400/90 pt-1 border-t border-neutral-800">
                  Def. Elasticity: {profile.defaultElasticity}x
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Scrubber & Frame-by-Frame Viseme Keyframe Visualizer */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Audio Waveform Scrubber & Real-Time Viseme Keyframes
            </span>
          </div>

          <button
            onClick={handlePlayScrubber}
            disabled={isPlayingAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition-all cursor-pointer shadow"
          >
            <Play className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-spin' : ''}`} />
            <span>{isPlayingAudio ? 'SCRUBBING TIMELINE...' : 'PLAY AUDIO SCRUBBER'}</span>
          </button>
        </div>

        {/* Audio Waveform Track & Keyframe Indicators */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
          {/* Simulated Waveform Bars */}
          <div className="h-16 flex items-center justify-between gap-1 px-3 bg-black/60 rounded-lg border border-neutral-800/80">
            {SAMPLE_VISEME_TIMELINE.map((v, i) => {
              const isActive = i === activeVisemeIndex;
              const barHeight = Math.max(15, Math.min(100, v.jawOpenDegree * 90 + 10));

              return (
                <div
                  key={i}
                  onClick={() => setActiveVisemeIndex(i)}
                  className={`flex-1 flex flex-col items-center justify-center h-full cursor-pointer transition-all ${
                    isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className="w-full rounded-full transition-all duration-100"
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: isActive ? '#c084fc' : '#581c87',
                    }}
                  />
                  <span
                    className={`text-[9px] font-mono mt-1 font-bold ${
                      isActive ? 'text-purple-300' : 'text-neutral-500'
                    }`}
                  >
                    {v.phoneme}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Viseme Articulation Card */}
          <div className="grid grid-cols-4 gap-3 text-xs font-mono pt-2">
            <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Active Phoneme:</span>
              <span className="text-purple-300 font-bold">/{activeViseme.phoneme}/ ({activeViseme.visemeSymbol})</span>
            </div>
            <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Calculated Jaw Delta:</span>
              <span className="text-amber-400 font-bold">{currentDeformation.jawDeltaY} ΔY (Normalized)</span>
            </div>
            <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Horizontal Spread:</span>
              <span className="text-cyan-400 font-bold">{currentDeformation.lipSpreadX} ΔX</span>
            </div>
            <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block">Timecode Window:</span>
              <span className="text-neutral-300">{activeViseme.timeStartMs}ms - {activeViseme.timeEndMs}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Elasticity & Expression Calibration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Slider 1: Elasticity Multiplier */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-neutral-200">
              Elasticity & Rigidity Multiplier:
            </label>
            <span className="text-xs font-mono font-bold text-purple-400">
              {config.elasticityMultiplier.toFixed(2)}x
            </span>
          </div>

          <input
            type="range"
            min="0.1"
            max="2.5"
            step="0.05"
            value={config.elasticityMultiplier}
            onChange={(e) =>
              handleUpdate({ ...config, elasticityMultiplier: parseFloat(e.target.value) })
            }
            aria-label="Elasticity Multiplier"
            className="w-full accent-purple-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[9px] font-mono text-neutral-500">
            <span>0.1x (Stone Golem / Beak)</span>
            <span>1.0x (Humanoid)</span>
            <span>2.5x (Cartoon Squash)</span>
          </div>
        </div>

        {/* Slider 2: Jaw Opening Limit */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-neutral-200">
              Jaw Opening Limit:
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">
              {config.jawOpeningLimitPercent}%
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="150"
            step="5"
            value={config.jawOpeningLimitPercent}
            onChange={(e) =>
              handleUpdate({ ...config, jawOpeningLimitPercent: parseInt(e.target.value, 10) })
            }
            aria-label="Jaw Opening Limit"
            className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[9px] font-mono text-neutral-500">
            <span>20% (Subtle Whisper)</span>
            <span>100% (Natural Dialogue)</span>
            <span>150% (Scream/Dragon Roar)</span>
          </div>
        </div>

        {/* Slider 3: Lip Tightness */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-neutral-200">
              Lip Tightness & Labial Tension:
            </label>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {config.lipTightnessPercent}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={config.lipTightnessPercent}
            onChange={(e) =>
              handleUpdate({ ...config, lipTightnessPercent: parseInt(e.target.value, 10) })
            }
            aria-label="Lip Tightness"
            className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[9px] font-mono text-neutral-500">
            <span>0% (Relaxed/Slurred)</span>
            <span>50% (Standard)</span>
            <span>100% (Crisp Staccato)</span>
          </div>
        </div>
      </div>

      {/* Compiled Prompt & Diffusion Mask Token Card */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-purple-500/40 space-y-3 shadow-lg shadow-purple-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Compiled Lip-Sync Morphology Diffusion Prompt
            </h4>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED TOKENS' : 'COPY MORPHOLOGY PROMPT'}</span>
          </button>
        </div>

        <p className="text-xs text-purple-200/90 font-mono leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-purple-500/30">
          {payload.finalPrompt}
        </p>

        <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
          <span className="text-purple-400 font-bold block mb-0.5">Secondary Anatomical Strategy:</span>
          <span>{currentDeformation.secondaryDeformationTag}</span>
        </div>
      </div>
    </div>
  );
};
