import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  WealthStratum,
  CharacterLifestyleProfile,
  getDefaultLifestyleProfile,
  compileLifestylePayload,
  getStratumVehicles,
  getStratumWardrobeBrands,
  getStratumJewelry,
  getStratumTimepieces,
  DEPORTMENT_PROFILES,
  VEHICLE_REPOSITORY,
  WARDROBE_BRANDS,
  JEWELRY_REPOSITORY,
  TIMEPIECE_REPOSITORY,
} from '../../utils/socioeconomic-lifestyle-engine';
import {
  Crown,
  Car,
  Watch,
  Gem,
  Shirt,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  User,
  Copy,
  Check,
  Layers,
  ChevronRight,
  Gauge,
  Sliders,
} from 'lucide-react';

interface Props {
  initialCharacterId?: string;
  onApplyPrompt?: (injectedPrompt: string) => void;
}

export const SocioeconomicLifestylePanel: React.FC<Props> = ({
  initialCharacterId,
  onApplyPrompt,
}) => {
  const { characters } = useStudio();
  const [selectedCharId, setSelectedCharId] = useState<string>(
    initialCharacterId || characters[0]?.id || 'char-elena'
  );

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];

  // Map of character profiles by id in local state
  const [profiles, setProfiles] = useState<Record<string, CharacterLifestyleProfile>>({
    'char-elena': getDefaultLifestyleProfile('char-elena', 'working-class'),
    'char-chen': getDefaultLifestyleProfile('char-chen', 'ultra-luxury'),
    'char-kael': getDefaultLifestyleProfile('char-kael', 'street-impoverished'),
  });

  const activeProfile: CharacterLifestyleProfile =
    profiles[selectedCharId] || getDefaultLifestyleProfile(selectedCharId, 'upper-middle');

  const [copied, setCopied] = useState<boolean>(false);

  const updateActiveProfile = (partial: Partial<CharacterLifestyleProfile>) => {
    setProfiles((prev) => ({
      ...prev,
      [selectedCharId]: {
        ...activeProfile,
        ...partial,
      },
    }));
  };

  const handleStratumChange = (newStratum: WealthStratum) => {
    const updated = getDefaultLifestyleProfile(selectedCharId, newStratum);
    setProfiles((prev) => ({
      ...prev,
      [selectedCharId]: updated,
    }));
  };

  const compiled = compileLifestylePayload(activeProfile);

  // Available options
  const vehiclesForStratum = getStratumVehicles(activeProfile.stratum);
  const allVehicles = VEHICLE_REPOSITORY;
  const brandsForStratum = getStratumWardrobeBrands(activeProfile.stratum);
  const jewelryForStratum = getStratumJewelry(activeProfile.stratum);
  const timepiecesForStratum = getStratumTimepieces(activeProfile.stratum);
  const deportment = DEPORTMENT_PROFILES[activeProfile.stratum];

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(compiled.positivePromptInjection);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950/60 p-5 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono tracking-tight text-neutral-100 flex items-center gap-2">
              Socioeconomic Stratum, Luxury Brand & Modern Lifestyle Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Coordinates vehicle tiers, haute couture vs. workwear, VVS diamond optics, and status deportment to character wealth.
            </p>
          </div>
        </div>

        {/* Character Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400">Target Character:</span>
          <select
            value={selectedCharId}
            onChange={(e) => setSelectedCharId(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-xs font-mono rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role.split('/')[0].trim()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Stratum Selector & Live Coherence Score */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Stratum Preset Buttons */}
        <div className="lg:col-span-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-neutral-300">
              Wealth Stratum Archetype
            </span>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              Net Worth Bracket: {activeProfile.netWorthTier}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                id: 'ultra-luxury',
                label: 'Ultra-Luxury Elite',
                sub: '$50M+ Centimillionaire',
                badge: 'Maybach • Savile Row • Rolex',
                accent: 'amber',
              },
              {
                id: 'upper-middle',
                label: 'Affluent Professional',
                sub: '$350K - $1.2M High-Earner',
                badge: 'BMW • Theory • 18K Gold',
                accent: 'emerald',
              },
              {
                id: 'working-class',
                label: 'Working Class',
                sub: '$42K - $85K Trade/Essential',
                badge: 'Civic • Carhartt • G-Shock',
                accent: 'cyan',
              },
              {
                id: 'street-impoverished',
                label: 'Street / Impoverished',
                sub: '<$15K Underground Hustle',
                badge: 'Beater • Distressed • Bare',
                accent: 'rose',
              },
            ].map((tier) => {
              const isSelected = activeProfile.stratum === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => handleStratumChange(tier.id as WealthStratum)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-950/30'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold font-mono ${isSelected ? 'text-amber-300' : 'text-neutral-200'}`}>
                        {tier.label}
                      </span>
                      {isSelected && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{tier.sub}</div>
                  </div>
                  <div className="mt-3 text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 truncate">
                    {tier.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coherence & Authenticity Score Card */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              Stratum Coherence
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                compiled.coherenceScore >= 80
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {compiled.coherenceScore}% AUTHENTIC
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  compiled.coherenceScore >= 80
                    ? 'bg-emerald-500'
                    : compiled.coherenceScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${compiled.coherenceScore}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-neutral-400 flex justify-between">
              <span>Anti-Contamination Lock</span>
              <span className="text-neutral-200">{compiled.negativeExclusions.length} Negative Rules</span>
            </div>
          </div>

          {compiled.coherenceWarnings.length > 0 ? (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>{compiled.coherenceWarnings[0]}</span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Zero cross-stratum asset leakage detected.</span>
            </div>
          )}
        </div>
      </div>

      {/* Asset Configurator Drawers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Vehicle Assignment */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-400" />
              Vehicle Asset
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              {vehiclesForStratum.length} in Tier
            </span>
          </div>

          <select
            value={activeProfile.selectedVehicleId}
            onChange={(e) => updateActiveProfile({ selectedVehicleId: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <optgroup label="Tier-Matched Vehicles">
              {vehiclesForStratum.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="All Vehicles (Cross-Tier)">
              {allVehicles
                .filter((v) => v.stratum !== activeProfile.stratum)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.stratum})
                  </option>
                ))}
            </optgroup>
          </select>

          <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
            <div className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
              Finish: {compiled.vehicle.finishType.replace('-', ' ')}
            </div>
            <div className="text-[11px] text-neutral-300 leading-snug">
              {compiled.vehicle.finishDescription}
            </div>
          </div>
        </div>

        {/* 2. Wardrobe & Label Toggles */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-amber-400" />
              Wardrobe & Tailoring
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Labels</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {WARDROBE_BRANDS.map((brand) => {
              const isSelected = activeProfile.selectedWardrobeBrandIds.includes(brand.id);
              return (
                <button
                  key={brand.id}
                  onClick={() => {
                    const next = isSelected
                      ? activeProfile.selectedWardrobeBrandIds.filter((id) => id !== brand.id)
                      : [...activeProfile.selectedWardrobeBrandIds, brand.id];
                    updateActiveProfile({
                      selectedWardrobeBrandIds: next.length > 0 ? next : [brand.id],
                    });
                  }}
                  className={`w-full p-2 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="font-semibold">{brand.name}</span>
                  <span className="text-[9px] text-neutral-500">{brand.tier.split('/')[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-neutral-950 rounded-xl border border-neutral-800/80 text-[10px] text-neutral-400 font-mono">
            <span>Drape: </span>
            <span className="text-neutral-200">{compiled.brands[0]?.fabricFinish || 'Standard textile'}</span>
          </div>
        </div>

        {/* 3. Jewelry & Diamond Matrix */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
              <Gem className="w-4 h-4 text-amber-400" />
              Jewelry & Adornment
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Optical Refraction</span>
          </div>

          <select
            value={activeProfile.selectedJewelryId}
            onChange={(e) => updateActiveProfile({ selectedJewelryId: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {JEWELRY_REPOSITORY.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name} ({j.grade})
              </option>
            ))}
          </select>

          <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
            <div className="text-[10px] font-mono text-amber-400 font-semibold">
              {compiled.jewelry.grade}
            </div>
            <div className="text-[11px] text-neutral-300 leading-snug">
              {compiled.jewelry.materialFinish}
            </div>
          </div>
        </div>

        {/* 4. Timepieces & Horology */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
              <Watch className="w-4 h-4 text-amber-400" />
              Timepiece & Horology
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Wrist Spec</span>
          </div>

          <select
            value={activeProfile.selectedTimepieceId}
            onChange={(e) => updateActiveProfile({ selectedTimepieceId: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {TIMEPIECE_REPOSITORY.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.horologyTier})
              </option>
            ))}
          </select>

          <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1">
            <div className="text-[10px] font-mono text-amber-400 font-semibold">
              {compiled.timepiece.horologyTier}
            </div>
            <div className="text-[11px] text-neutral-300 leading-snug">
              {compiled.timepiece.caseMaterial}
            </div>
          </div>
        </div>
      </div>

      {/* Deportment, Posture & Body Language */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
              Deportment & Kinetic Posture Signature ({deportment.title})
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Biomechanics Synced</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">Spine & Carriage</div>
            <div className="text-xs text-neutral-200">{deportment.postureDescription}</div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">Kinetic Economy</div>
            <ul className="text-xs text-neutral-200 list-disc list-inside space-y-0.5">
              {deportment.kineticTraits.map((t, idx) => (
                <li key={idx} className="line-clamp-1">{t}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase">Gaze Dynamics</div>
            <div className="text-xs text-neutral-200">{deportment.gazeBehavior}</div>
          </div>
        </div>
      </div>

      {/* Compiled Prompt Injection & Live Payload */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
              Compiled Scene Conditioning Token Injection
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Copied Token' : 'Copy Token'}</span>
            </button>

            {onApplyPrompt && (
              <button
                onClick={() => onApplyPrompt(compiled.positivePromptInjection)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <span>Inject Into Shot Prompt</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 leading-relaxed break-words">
          {compiled.positivePromptInjection}
        </div>

        {/* Negative Rules */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
            Negative Sentinels:
          </span>
          {compiled.negativeExclusions.map((rule, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
            >
              no {rule}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
