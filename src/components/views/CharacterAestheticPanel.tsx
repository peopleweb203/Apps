import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  AestheticEngineConfig,
  DEFAULT_AESTHETIC_CONFIG,
  GenderAesthetic,
  compileAestheticPhysiquePrompt,
  validateAnatomicalIntegrity,
} from '../../utils/character-aesthetic-engine';
import {
  Sparkles,
  Users,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Crown,
  Eye,
  Activity,
  Layers,
} from 'lucide-react';

export const CharacterAestheticPanel: React.FC = () => {
  const { characters } = useStudio();
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || 'char-elena');
  const [config, setConfig] = useState<AestheticEngineConfig>(DEFAULT_AESTHETIC_CONFIG);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];
  const validation = validateAnatomicalIntegrity(config);
  const compilation = compileAestheticPhysiquePrompt(selectedChar.name, config);

  const handleGenderChange = (gender: GenderAesthetic) => {
    setConfig({ ...config, gender });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(compilation.compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Character Aesthetics & Anatomical Silhouette Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                GOLDEN RATIO PROPORTIONS
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Hollywood Star Tier calibration: 0.70 Waist-to-Hip ratio, 1.618 V-taper, and natural tissue dynamics
            </p>
          </div>
        </div>

        {/* Attractiveness Tier Scoreboard Badge */}
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
          <div className="text-right font-mono">
            <span className="text-[10px] text-neutral-500 block">Attractiveness Tier:</span>
            <span className="text-xs font-bold text-amber-300">{validation.tierLabel}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
            {config.attractivenessTierScore.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Character & Gender Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
        {/* Character Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-neutral-300">Selected Cast Member:</span>
          <div className="flex gap-2">
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCharId(c.id);
                  handleGenderChange(c.gender === 'Male' ? 'Male' : 'Female');
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                  c.id === selectedCharId
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                <img
                  src={c.faceReferences.front}
                  alt={c.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gender Toggle */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          {(['Female', 'Male'] as GenderAesthetic[]).map((g) => (
            <button
              key={g}
              onClick={() => handleGenderChange(g)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                config.gender === g
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {g === 'Female' ? 'Female (Hourglass Lead)' : 'Male (Heroic V-Taper)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Silhouette Calibration Matrix */}
      {config.gender === 'Female' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Hourglass Proportions */}
          <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Hourglass & Curve Calibration</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {config.female.waistToHipRatio.toFixed(2)} WHR
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-neutral-400">
                <span>Waist-to-Hip Ratio (Golden 0.70):</span>
                <span className="text-amber-300 font-bold">{config.female.waistToHipRatio}</span>
              </div>
              <input
                type="range"
                min="0.65"
                max="0.78"
                step="0.01"
                value={config.female.waistToHipRatio}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    female: { ...config.female, waistToHipRatio: parseFloat(e.target.value) },
                  })
                }
                aria-label="Waist-to-Hip Ratio"
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>0.65 (Pronounced)</span>
                <span>0.70 (Golden Hollywood)</span>
                <span>0.78 (Natural Athletic)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-neutral-400">
                <span>Curve Definition & Tissue Volume:</span>
                <span className="text-amber-300 font-bold">{config.female.curveDefinitionPercent}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                step="2"
                value={config.female.curveDefinitionPercent}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    female: { ...config.female, curveDefinitionPercent: parseInt(e.target.value, 10) },
                  })
                }
                aria-label="Curve Definition"
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Card 2: Core Firmness & Posture */}
          <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider block">
              Core Posture & Physical Draping
            </span>

            <div>
              <span className="text-neutral-400 block text-[10px] mb-1 font-mono">Posture Elegance:</span>
              <select
                value={config.female.postureEleganceGrade}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    female: { ...config.female, postureEleganceGrade: e.target.value as any },
                  })
                }
                aria-label="Posture Elegance"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 font-mono"
              >
                <option value="Regal Heroic Standing">Regal Heroic Standing</option>
                <option value="Dynamic Ready Stance">Dynamic Ready Stance</option>
                <option value="Graceful Poise">Graceful Poise</option>
              </select>
            </div>

            <div>
              <span className="text-neutral-400 block text-[10px] mb-1 font-mono">Skin Luminescence:</span>
              <select
                value={config.female.skinLuminescenceGrade}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    female: { ...config.female, skinLuminescenceGrade: e.target.value as any },
                  })
                }
                aria-label="Skin Luminescence"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 font-mono"
              >
                <option value="Radiant Dewy">Radiant Dewy (Specular Skin Highlights)</option>
                <option value="Velvet Matte">Velvet Matte (Natural Soft Roll-Off)</option>
                <option value="Sun-Kissed Golden">Sun-Kissed Golden Warmth</option>
              </select>
            </div>
          </div>

          {/* Card 3: Attractiveness Score Slider */}
          <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider block">
              Hollywood Star Attractiveness Score
            </span>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-neutral-400">
                <span>Star Tier (8.0 to 9.9):</span>
                <span className="text-amber-400 font-bold">{config.attractivenessTierScore.toFixed(1)} / 10.0</span>
              </div>
              <input
                type="range"
                min="8.0"
                max="9.8"
                step="0.1"
                value={config.attractivenessTierScore}
                onChange={(e) =>
                  setConfig({ ...config, attractivenessTierScore: parseFloat(e.target.value) })
                }
                aria-label="Attractiveness Score"
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono space-y-1">
              <span className="text-neutral-500 block text-[10px]">Anatomical Integrity Status:</span>
              <span className="text-emerald-400 font-bold">100% BALANCED PHYSICAL DRAPING</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Male V-Taper Card */}
          <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-cyan-400" />
                <span>Heroic V-Taper & Clavicle Width</span>
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {config.male.shoulderToWaistRatio.toFixed(3)} SWR
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-neutral-400">
                <span>Shoulder-to-Waist Ratio (Golden 1.618):</span>
                <span className="text-cyan-300 font-bold">{config.male.shoulderToWaistRatio}</span>
              </div>
              <input
                type="range"
                min="1.45"
                max="1.72"
                step="0.01"
                value={config.male.shoulderToWaistRatio}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    male: { ...config.male, shoulderToWaistRatio: parseFloat(e.target.value) },
                  })
                }
                aria-label="Shoulder-to-Waist Ratio"
                className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>1.45 (Athletic)</span>
                <span>1.618 (Golden Heroic V-Taper)</span>
                <span>1.72 (Titan)</span>
              </div>
            </div>
          </div>

          {/* Muscular Definition */}
          <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider block">
              Muscular Definition & Jawline
            </span>

            <div>
              <span className="text-neutral-400 block text-[10px] mb-1 font-mono">Hypertrophy Grade:</span>
              <select
                value={config.male.hypertrophyGrade}
                onChange={(e) =>
                  setConfig({ ...config, male: { ...config.male, hypertrophyGrade: e.target.value as any } })
                }
                aria-label="Hypertrophy Grade"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 font-mono"
              >
                <option value="Lean Athletic Operative">Lean Athletic Operative</option>
                <option value="Chiseled Leading Man">Chiseled Leading Man</option>
                <option value="Heavyweight Superhero">Heavyweight Superhero</option>
              </select>
            </div>

            <div>
              <span className="text-neutral-400 block text-[10px] mb-1 font-mono">Jawline Architecture:</span>
              <select
                value={config.male.jawlineDefinitionGrade}
                onChange={(e) =>
                  setConfig({ ...config, male: { ...config.male, jawlineDefinitionGrade: e.target.value as any } })
                }
                aria-label="Jawline Architecture"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 font-mono"
              >
                <option value="Chiseled Mandibular Square">Chiseled Mandibular Square</option>
                <option value="Angular Diamond">Angular Diamond</option>
                <option value="Strong Defined Rugged">Strong Defined Rugged</option>
              </select>
            </div>
          </div>

          {/* Attractiveness Tier */}
          <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider block">
              Leading Man Attractiveness
            </span>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-neutral-400">
                <span>Star Tier (8.0 to 9.9):</span>
                <span className="text-cyan-400 font-bold">{config.attractivenessTierScore.toFixed(1)} / 10.0</span>
              </div>
              <input
                type="range"
                min="8.0"
                max="9.8"
                step="0.1"
                value={config.attractivenessTierScore}
                onChange={(e) =>
                  setConfig({ ...config, attractivenessTierScore: parseFloat(e.target.value) })
                }
                aria-label="Male Attractiveness Score"
                className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Compiled Prompt & Negative Sentinel Tokens Card */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-amber-500/40 space-y-3 shadow-lg shadow-amber-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Compiled Anatomical Silhouette & Physique Conditioning Prompt
            </h4>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED TOKENS' : 'COPY PHYSIQUE PROMPT'}</span>
          </button>
        </div>

        <p className="text-xs text-amber-200/90 font-mono leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-amber-500/30">
          {compilation.compiledPrompt}
        </p>

        <div className="text-[10px] font-mono text-rose-300/80 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30">
          <span className="font-bold">Anatomical Integrity Negative Filter:</span> {compilation.negativePrompt}
        </div>
      </div>
    </div>
  );
};
