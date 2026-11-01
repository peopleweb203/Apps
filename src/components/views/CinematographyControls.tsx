import React, { useState } from 'react';
import {
  CinematicPipelineConfig,
  CinematicAspectRatio,
  CinematicQualityPreset,
  ColorSciencePreset,
  CameraRigMotion,
  DEFAULT_CINEMATIC_CONFIG,
  QUALITY_PRESETS,
  COLOR_SCIENCE_MAP,
  CAMERA_RIG_MAP,
  optimizeCinematicPrompt,
  buildVideoGenerationPayload,
} from '../../utils/cinematic-video-pipeline';
import {
  Camera,
  Film,
  Sparkles,
  Sliders,
  CheckCircle2,
  Copy,
  Layers,
  Sun,
  Eye,
  Zap,
  Check,
  Cpu,
  MonitorPlay,
  RotateCw,
} from 'lucide-react';

interface CinematographyControlsProps {
  config: CinematicPipelineConfig;
  onChange: (config: CinematicPipelineConfig) => void;
  rawPrompt?: string;
  onApplyPrompt?: (optimizedPrompt: string) => void;
}

export const CinematographyControls: React.FC<CinematographyControlsProps> = ({
  config = DEFAULT_CINEMATIC_CONFIG,
  onChange,
  rawPrompt = 'Elena walks down rain-slick neo-noir alleyway toward neon sign',
  onApplyPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeInspectorTag, setActiveInspectorTag] = useState<
    'all' | 'optics' | 'lighting' | 'colorScience' | 'motion' | 'resolution'
  >('all');

  const { masterPrompt, injectedTags } = optimizeCinematicPrompt(rawPrompt, config);
  const payload = buildVideoGenerationPayload(rawPrompt, config);

  const handleToggleMaximize = () => {
    const nextMaximized = !config.maximizeCinematicQuality;
    onChange({
      ...config,
      maximizeCinematicQuality: nextMaximized,
      qualityPreset: nextMaximized ? 'master-4k' : config.qualityPreset,
      volumetricHaze: nextMaximized ? true : config.volumetricHaze,
      chromaticAberration: nextMaximized ? true : config.chromaticAberration,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(masterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header with Title and "Maximize Cinematic Quality" Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Cinematography &amp; 4K / 5K Mastering Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                4K &amp; 5K RAW OPTICS
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Arri Alexa 65 4K/5K anamorphic optics, Kodak Vision3 500T color science, and 24fps motion blur
            </p>
          </div>
        </div>

        {/* Maximize Cinematic Quality One-Click Toggle */}
        <button
          onClick={handleToggleMaximize}
          data-testid="maximize-cinematic-quality-toggle"
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer shadow-lg ${
            config.maximizeCinematicQuality
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/40'
              : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles
            className={`w-4 h-4 ${config.maximizeCinematicQuality ? 'animate-spin' : ''}`}
          />
          <span>MAXIMIZE CINEMATIC QUALITY (4K / 5K HDR)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-black ${
              config.maximizeCinematicQuality
                ? 'bg-neutral-950 text-amber-400'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {config.maximizeCinematicQuality ? 'ENFORCED' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Control Matrix: 4-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Aspect Ratio Selector */}
        <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
          <label className="block text-xs font-mono font-bold text-neutral-300">
            Aspect Ratio (Cinema Framing):
          </label>
          <div className="space-y-1.5">
            {[
              { id: '2.39:1', label: '2.39:1 Anamorphic Widescreen', sub: 'Standard Cinema Scope' },
              { id: '16:9', label: '16:9 Modern Widescreen', sub: 'Broadcast / 4K YouTube' },
              { id: '1.85:1', label: '1.85:1 Academy Flat', sub: 'Theatrical Feature' },
            ].map((ar) => (
              <button
                key={ar.id}
                onClick={() => onChange({ ...config, aspectRatio: ar.id as CinematicAspectRatio })}
                className={`w-full text-left p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                  config.aspectRatio === ar.id
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div>
                  <div>{ar.id}</div>
                  <div className="text-[10px] text-neutral-500 font-normal">{ar.sub}</div>
                </div>
                {config.aspectRatio === ar.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Quality Preset */}
        <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
          <label className="block text-xs font-mono font-bold text-neutral-300">
            Quality Preset & Bitrate:
          </label>
          <div className="space-y-1.5">
            {(Object.keys(QUALITY_PRESETS) as CinematicQualityPreset[]).map((key) => {
              const preset = QUALITY_PRESETS[key];
              const isSelected = config.qualityPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => onChange({ ...config, qualityPreset: key })}
                  className={`w-full text-left p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div>
                    <div className="truncate">{preset.name.split(' ')[0]} {preset.name.split(' ')[1]}</div>
                    <div className="text-[10px] text-neutral-500 font-normal">
                      {preset.inferenceSteps} steps • {preset.targetBitrateMbps}Mbps
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 3: Color Science & Filmic LUTs */}
        <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
          <label className="block text-xs font-mono font-bold text-neutral-300">
            Color Science & LUT:
          </label>
          <select
            value={config.colorScience}
            onChange={(e) =>
              onChange({ ...config, colorScience: e.target.value as ColorSciencePreset })
            }
            aria-label="Color Science & LUT Presets"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-amber-300 font-mono focus:outline-none"
          >
            {(Object.keys(COLOR_SCIENCE_MAP) as ColorSciencePreset[]).map((key) => (
              <option key={key} value={key}>
                {COLOR_SCIENCE_MAP[key].name}
              </option>
            ))}
          </select>

          <div className="pt-1 text-[11px] text-neutral-400 leading-relaxed font-sans">
            Profile: <span className="font-mono text-amber-400">{COLOR_SCIENCE_MAP[config.colorScience].lutProfile}</span>
          </div>

          <div className="pt-1 space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>Film Grain ISO:</span>
              <span className="text-amber-400">ISO {config.filmGrainIso}</span>
            </div>
            <div className="flex gap-1.5">
              {[200, 500, 800].map((iso) => (
                <button
                  key={iso}
                  onClick={() => onChange({ ...config, filmGrainIso: iso })}
                  className={`flex-1 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                    config.filmGrainIso === iso
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                  }`}
                >
                  {iso}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 4: Lens & Camera Rig Controls */}
        <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-neutral-300">
              Lens Focal Length:
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">
              {config.focalLengthMm}mm
            </span>
          </div>

          <input
            type="range"
            min="24"
            max="85"
            step="1"
            value={config.focalLengthMm}
            onChange={(e) => onChange({ ...config, focalLengthMm: parseInt(e.target.value, 10) })}
            aria-label="Focal Length Slider"
            className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-neutral-500">
            <span>24mm (Wide)</span>
            <span>50mm (Normal)</span>
            <span>85mm (Tele)</span>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Camera Rig / Shot Motion:
            </label>
            <select
              value={config.cameraRig}
              onChange={(e) =>
                onChange({ ...config, cameraRig: e.target.value as CameraRigMotion })
              }
              aria-label="Camera Rig Shot Motion"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-200 font-mono focus:outline-none"
            >
              {(Object.keys(CAMERA_RIG_MAP) as CameraRigMotion[]).map((key) => (
                <option key={key} value={key}>
                  {CAMERA_RIG_MAP[key].name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Side-by-Side: Raw Prompt vs. Cinematic Master Prompt */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Live Prompt Synthesis & Tag Injection Preview
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED MASTER' : 'COPY MASTER PROMPT'}</span>
            </button>

            {onApplyPrompt && (
              <button
                onClick={() => onApplyPrompt(masterPrompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>APPLY TO SCENE</span>
              </button>
            )}
          </div>
        </div>

        {/* Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Box: Raw Creator Input */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-800/80">
                <span className="text-[11px] font-mono text-neutral-400 font-bold uppercase">
                  Raw Scene Description (Input)
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {rawPrompt.length} chars
                </span>
              </div>
              <p className="text-xs text-neutral-300 font-mono leading-relaxed bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                "{rawPrompt}"
              </p>
            </div>
            <div className="text-[10px] font-mono text-neutral-500 pt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-600"></span>
              <span>Clean narrative action prior to cinematic layer injection</span>
            </div>
          </div>

          {/* Right Box: Cinematic Master Prompt */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-amber-500/40 shadow-lg shadow-amber-950/20 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">
                    Cinematic Master Prompt (Engine Target)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    PRO OPTICS INJECTED
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  {masterPrompt.length} chars
                </span>
              </div>
              <p
                data-testid="master-prompt-preview"
                className="text-xs text-amber-200/90 font-mono leading-relaxed bg-neutral-900/90 p-3 rounded-lg border border-amber-500/30 max-h-36 overflow-y-auto"
              >
                {masterPrompt}
              </p>
            </div>

            {/* Model Target Parameters */}
            <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] font-mono">
              <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800 text-center">
                <span className="text-neutral-500 block">Resolution</span>
                <span className="text-neutral-200 font-bold">{payload.modelParameters.width}x{payload.modelParameters.height}</span>
              </div>
              <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800 text-center">
                <span className="text-neutral-500 block">Steps</span>
                <span className="text-amber-400 font-bold">{payload.modelParameters.steps}</span>
              </div>
              <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800 text-center">
                <span className="text-neutral-500 block">CFG Scale</span>
                <span className="text-cyan-400 font-bold">{payload.modelParameters.cfgScale}</span>
              </div>
              <div className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800 text-center">
                <span className="text-neutral-500 block">Bitrate</span>
                <span className="text-emerald-400 font-bold">{payload.modelParameters.bitrateMbps} Mbps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Injected Tags Breakdown */}
        <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-400 font-bold">Parameter Synthesis Breakdown:</span>
            <div className="flex gap-2">
              <span className="text-amber-400 font-semibold">• Optics: Panavision Anamorphic</span>
              <span className="text-cyan-400 font-semibold">• Lighting: Volumetric Rim</span>
              <span className="text-purple-400 font-semibold">• LUT: {COLOR_SCIENCE_MAP[config.colorScience].name}</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80 leading-relaxed">
            <span className="text-amber-300 font-bold">[Optics]:</span> {injectedTags.optics} |{' '}
            <span className="text-cyan-300 font-bold">[Atmosphere]:</span> {injectedTags.lighting} |{' '}
            <span className="text-purple-300 font-bold">[LUT]:</span> {injectedTags.colorScience} |{' '}
            <span className="text-emerald-300 font-bold">[Cadence]:</span> {injectedTags.motion}
          </div>
        </div>
      </div>
    </div>
  );
};
