import React, { useState } from 'react';
import {
  CrowdWorldConfig,
  DEFAULT_CROWD_WORLD_CONFIG,
  generateAgentDensityMatrix,
  compileSpatialWorldPrompt,
  EnvironmentalZone,
  DepthPlane,
  PRESET_MICRO_ACTIONS,
} from '../../utils/crowd-world-engine';
import {
  Globe,
  Users,
  ShieldCheck,
  Sparkles,
  Sliders,
  Layers,
  Activity,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface BackgroundWorldEngineProps {
  initialConfig?: CrowdWorldConfig;
  onConfigChange?: (config: CrowdWorldConfig) => void;
  basePrompt?: string;
}

export const BackgroundWorldEngine: React.FC<BackgroundWorldEngineProps> = ({
  initialConfig = DEFAULT_CROWD_WORLD_CONFIG,
  onConfigChange,
  basePrompt = 'Elena traverses rain-slick cyber-district toward dispatch terminal',
}) => {
  const [config, setConfig] = useState<CrowdWorldConfig>(initialConfig);
  const [selectedDepthFilter, setSelectedDepthFilter] = useState<DepthPlane | 'all'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  const matrix = generateAgentDensityMatrix(config);
  const compilation = compileSpatialWorldPrompt(basePrompt, config);

  const handleUpdate = (updated: CrowdWorldConfig) => {
    setConfig(updated);
    if (onConfigChange) onConfigChange(updated);
  };

  const handleDensityChange = (density: number) => {
    handleUpdate({
      ...config,
      totalAgentDensity: density,
    });
  };

  const handleCoherenceToggle = () => {
    handleUpdate({
      ...config,
      coherenceGuard: {
        ...config.coherenceGuard,
        preserveSubjectSharpness: !config.coherenceGuard.preserveSubjectSharpness,
      },
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(compilation.compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredAgents =
    selectedDepthFilter === 'all'
      ? matrix.agents
      : matrix.agents.filter((a) => a.depthPlane === selectedDepthFilter);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Crowd & World Background Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                100+ AGENTS LOD
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Deterministic 3-pass scene layering: Base Plate • Environmental Zones • Anti-Pooling Agent Matrix
            </p>
          </div>
        </div>

        {/* Coherence Guard One-Click Toggle */}
        <button
          onClick={handleCoherenceToggle}
          data-testid="coherence-guard-toggle"
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer shadow-lg ${
            config.coherenceGuard.preserveSubjectSharpness
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-neutral-950 border-cyan-400 shadow-cyan-500/25 ring-2 ring-cyan-400/40'
              : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>HERO COHERENCE GUARD</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
              config.coherenceGuard.preserveSubjectSharpness
                ? 'bg-neutral-950 text-cyan-300'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {config.coherenceGuard.preserveSubjectSharpness ? 'ENFORCED (2.5m SAFE)' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Crowd Density & LOD Scaling */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Crowd Agent Density</span>
            </span>
            <span className="text-sm font-bold font-mono text-cyan-400">
              {config.totalAgentDensity} Agents
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="10"
              max="160"
              step="5"
              value={config.totalAgentDensity}
              onChange={(e) => handleDensityChange(parseInt(e.target.value, 10))}
              aria-label="Crowd Agent Density Slider"
              className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>10 (Intimate)</span>
              <span>80 (Dense Market)</span>
              <span>160+ (Cyber-Metropolis)</span>
            </div>
          </div>

          {/* Automatic Level of Detail (LOD) Breakdown */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
            <span className="text-[11px] font-mono font-bold text-neutral-300 block">
              Automatic LOD (Level of Detail) Allocator:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <span className="text-neutral-400 block">LOD0 Hero Razor:</span>
                <span className="text-cyan-400 font-bold">{matrix.lodDistribution.LOD0_HERO_SHARP} actors (Safe)</span>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <span className="text-neutral-400 block">LOD1 Mid Detail:</span>
                <span className="text-emerald-400 font-bold">{matrix.lodDistribution.LOD1_FULL_DETAIL} actors</span>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <span className="text-neutral-400 block">LOD2 Kinetic Move:</span>
                <span className="text-amber-400 font-bold">{matrix.lodDistribution.LOD2_MEDIUM_GESTURE} actors</span>
              </div>
              <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
                <span className="text-neutral-400 block">LOD3 Silhouette:</span>
                <span className="text-purple-400 font-bold">{matrix.lodDistribution.LOD3_SILHOUETTE_ATMOSPHERE} actors</span>
              </div>
            </div>
          </div>

          {/* Anti-Pooling Dispersion Metric */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-neutral-400 block text-[10px]">Visual Pooling Index:</span>
              <span className="text-emerald-400 font-bold">
                {matrix.visualPoolingScore} (Uniform Dispersion)
              </span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ZERO CLUMPING
            </span>
          </div>
        </div>

        {/* Center Column: Zone Behavior Matrix by Depth Plane */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Zone Behavior by Depth Plane</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">3-Plane Zoning</span>
          </div>

          <div className="space-y-3">
            {/* Foreground Hero Zone */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-cyan-500/40 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-300 font-bold">[FOREGROUND HERO PLANE]</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">2.5m CLEARANCE</span>
              </div>
              <p className="text-[11px] text-neutral-300">
                Hero Focus: Main character dialogue and physical eye-line. Strict peripheral exclusion ensures crowd never obstructs key emotion.
              </p>
            </div>

            {/* Midground Market / Transit */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-300 font-bold">[MIDGROUND BAZAAR & TRANSIT]</span>
                <span className="text-[9px] text-neutral-400 font-mono">42% Density Allocation</span>
              </div>
              <p className="text-[11px] text-neutral-300">
                Dynamic Commerce & Commuters: Non-repeating trade negotiations, food stalls, elevated bridge foot-traffic, and rain slick crossings.
              </p>
            </div>

            {/* Deep Background Dwelling Catwalks */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-purple-300 font-bold">[DEEP BACKGROUND DWELLINGS]</span>
                <span className="text-[9px] text-neutral-400 font-mono">54% Atmospheric Allocation</span>
              </div>
              <p className="text-[11px] text-neutral-300">
                Atmospheric Silhouettes: Distant vertical tenements, maintenance crews on suspended catwalks, and aerial transit vehicle trails.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Coherence Guard & Macro Atmosphere */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Atmosphere & Coherence Guard</span>
            </span>
          </div>

          <div className="space-y-3 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs font-mono">
            <div>
              <span className="text-neutral-400 block text-[10px] mb-1">Architectural Scale:</span>
              <select
                value={config.architecturalScale}
                onChange={(e) =>
                  handleUpdate({ ...config, architecturalScale: e.target.value as any })
                }
                aria-label="Architectural Scale"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-200"
              >
                <option value="Intimate Urban Corridor">Intimate Urban Corridor</option>
                <option value="Multi-Tiered Sub-City">Multi-Tiered Sub-City (Recommended)</option>
                <option value="Monumental Mega-Structure">Monumental Mega-Structure</option>
                <option value="Industrial Sprawl">Industrial Sprawl</option>
              </select>
            </div>

            <div>
              <span className="text-neutral-400 block text-[10px] mb-1">Depth Fog & Optical Roll-Off:</span>
              <select
                value={config.depthFogLevel}
                onChange={(e) =>
                  handleUpdate({ ...config, depthFogLevel: e.target.value as any })
                }
                aria-label="Depth Fog Level"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-200"
              >
                <option value="Dense Neo-Noir Neon Mist">Dense Neo-Noir Neon Mist (68% Roll-Off)</option>
                <option value="Volumetric Industrial Smog">Volumetric Industrial Smog</option>
                <option value="Subtle Morning Haze">Subtle Morning Haze</option>
                <option value="Crystal Clear High-Altitude">Crystal Clear High-Altitude</option>
              </select>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Eye-Line Safe Radius:</span>
              <span className="text-cyan-400 font-bold">{config.coherenceGuard.heroEyeLineBufferRadiusMeters} meters</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Optical Aperture DOF:</span>
              <span className="text-amber-400 font-bold">{config.coherenceGuard.depthOfFieldBlurAperture}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Procedural Micro-Action Matrix Feed */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Procedurally Generated Micro-Action Agents ({filteredAgents.length} showing)
            </h4>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5">
            {(['all', 'foreground', 'midground', 'background'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedDepthFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer uppercase ${
                  selectedDepthFilter === filter
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Micro-actions Scroll Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {filteredAgents.slice(0, 18).map((agent) => (
            <div
              key={agent.id}
              className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80 flex flex-col justify-between text-[10px] font-mono space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-300 truncate">{agent.actorArchetype}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                    agent.depthPlane === 'foreground'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : agent.depthPlane === 'midground'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  {agent.depthPlane.toUpperCase()}
                </span>
              </div>
              <p className="text-neutral-400 line-clamp-2 leading-relaxed font-sans text-[11px]">
                {agent.microAction}
              </p>
              <div className="flex items-center justify-between text-neutral-500 text-[9px] pt-1 border-t border-neutral-900">
                <span>{agent.lodLevel.split('_')[0]}</span>
                <span>{agent.velocityKmH.toFixed(1)} km/h</span>
                <span>{agent.clusterId}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compiled Spatial Prompt Preview Card */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-cyan-500/30 space-y-3 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Compiled Depth-Conditioned World Prompt
            </h4>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED SPATIAL TOKENS' : 'COPY SPATIAL TOKENS'}</span>
          </button>
        </div>

        <p className="text-xs text-cyan-200/90 font-mono leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-cyan-500/30">
          {compilation.compiledPrompt}
        </p>

        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-neutral-400">
          <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
            <span className="text-cyan-400 font-bold block mb-0.5">Base Plate Pass:</span>
            <span className="truncate block">{compilation.passes.basePlatePass.slice(0, 60)}...</span>
          </div>
          <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
            <span className="text-amber-400 font-bold block mb-0.5">Zoning Pass:</span>
            <span className="truncate block">{compilation.passes.environmentalZonesPass.slice(0, 60)}...</span>
          </div>
          <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
            <span className="text-purple-400 font-bold block mb-0.5">Density Pass:</span>
            <span className="truncate block">{compilation.passes.agentDensityPass.slice(0, 60)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
