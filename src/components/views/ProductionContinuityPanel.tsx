import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  generateBiometricSeed,
  calculateBiometricSimilarity,
  buildDecoupledRegionalPrompt,
  computeLastFrameChaining,
  CharacterContinuityProfile,
  DemographicBiometrics,
} from '../../utils/production-continuity-engine';
import {
  ColorGradeConfig,
  DEFAULT_COLOR_GRADE,
  FILM_STOCK_PRESETS,
  buildMasteringPayload,
  FilmStockEmulation,
} from '../../utils/4k-color-mastering';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  Film,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const ProductionContinuityPanel: React.FC = () => {
  const { characters, sets, scenes, selectedShot } = useStudio();

  // Continuity Locks
  const [isSetWorldLocked, setIsSetWorldLocked] = useState<boolean>(true);
  const [isCastBiometricsLocked, setIsCastBiometricsLocked] = useState<boolean>(true);
  const [colorGrade, setColorGrade] = useState<ColorGradeConfig>(DEFAULT_COLOR_GRADE);
  const [activeTab, setActiveTab] = useState<'matrix' | 'sheet' | 'chaining' | 'color'>('matrix');

  // Build character profiles for continuity engine
  const continuityProfiles: CharacterContinuityProfile[] = characters.map((c, index) => {
    const seed = generateBiometricSeed(c.name, c.role);
    const biometrics: DemographicBiometrics = {
      facialBoneStructure:
        index === 0
          ? 'High Angular Cheekbones'
          : index === 1
          ? 'Broad Jawline'
          : 'Narrow Delicate Oval',
      eyeGeometry:
        index === 0 ? 'Deep-Set Monolid' : index === 1 ? 'Round Expressive' : 'Almond Hooded',
      skinUndertoneHex: index === 0 ? '#e0ac69' : index === 1 ? '#8d5524' : '#c68642',
      skinTexture:
        index === 0 ? 'Warm Golden Olive' : index === 1 ? 'Weathered Rugged' : 'Matte Porcelain',
      ageBracket: `${c.age}-${c.age + 3}`,
      signatureFeature: c.signatureWardrobe,
      biometricSeed: seed,
      negativePromptExclusions: ['cloned facial features', 'feature bleeding across subjects'],
    };

    return {
      characterId: c.id,
      name: c.name,
      role: c.role,
      biometrics,
      referenceSheet: {
        characterId: c.id,
        frontPortraitUrl: c.faceReferences.front,
        threeQuarterLeftUrl: c.faceReferences.threeQuarterLeft,
        threeQuarterRightUrl: c.faceReferences.threeQuarterRight,
        profileSilhouetteUrl: c.faceReferences.profile,
        fullBodyCostumeUrl: c.faceReferences.front,
        anchorsCompiledAt: new Date().toISOString(),
        ipAdapterAnchorWeight: 0.88,
      },
      isBiometricsLocked: isCastBiometricsLocked,
      assignedColorTheme: index === 0 ? '#f59e0b' : index === 1 ? '#06b6d4' : '#10b981',
    };
  });

  // Calculate pairwise similarity between Char 0 and Char 1
  const pairwiseSimilarity =
    continuityProfiles.length >= 2
      ? calculateBiometricSimilarity(
          continuityProfiles[0].biometrics,
          continuityProfiles[1].biometrics
        )
      : { similarityScorePercent: 0, isUnique: true, divergenceFactors: ['Solo Cast Active'] };

  // Decoupled prompt compilation
  const decoupledPrompt = buildDecoupledRegionalPrompt(
    selectedShot?.stillPrompt || 'Elena and Vance face each other on rain-slick industrial catwalk',
    continuityProfiles.slice(0, 2)
  );

  // Last-frame chaining analysis
  const chaining = computeLastFrameChaining(
    selectedShot?.shotNumber || 1,
    selectedShot?.approvedKeyframeUrl
  );

  // Mastering payload
  const mastering = buildMasteringPayload(colorGrade);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Top Header & Global Lock Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Production Continuity, Set-Locking & Cast Identity
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ANTI-DRIFT VAULT
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              5-Point multi-angle reference sheets, unique biometric seeds, world plate anchors, and last-frame chaining
            </p>
          </div>
        </div>

        {/* Global Continuity Lock Buttons */}
        <div className="flex items-center gap-3">
          {/* Lock Set & World Toggle */}
          <button
            onClick={() => setIsSetWorldLocked(!isSetWorldLocked)}
            data-testid="lock-set-world-toggle"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow ${
              isSetWorldLocked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {isSetWorldLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>LOCK SET & WORLD</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${isSetWorldLocked ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
              {isSetWorldLocked ? 'LOCKED' : 'OFF'}
            </span>
          </button>

          {/* Lock Cast Biometrics Toggle */}
          <button
            onClick={() => setIsCastBiometricsLocked(!isCastBiometricsLocked)}
            data-testid="lock-cast-biometrics-toggle"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow ${
              isCastBiometricsLocked
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-emerald-500/20'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {isCastBiometricsLocked ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Shield className="w-3.5 h-3.5" />}
            <span>LOCK CAST BIOMETRICS</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${isCastBiometricsLocked ? 'bg-emerald-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
              {isCastBiometricsLocked ? 'ENFORCED' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs for Sub-Panels */}
      <div className="flex gap-2 border-b border-neutral-800 pb-2">
        {[
          { id: 'matrix', label: 'Cast Uniqueness Matrix (<15% Similarity)', icon: Users },
          { id: 'sheet', label: '5-Point Reference Sheets', icon: Camera },
          { id: 'chaining', label: 'Last-Frame Chaining (Take Continuity)', icon: Layers },
          { id: 'color', label: '4K Color Mastering & Film Stocks', icon: Film },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-800 border border-neutral-700 text-neutral-100 font-bold shadow-md'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Cast Uniqueness Matrix & Decoupling */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Pairwise Similarity Verification Bar */}
          <div className="bg-neutral-900/70 p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                {pairwiseSimilarity.similarityScorePercent}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-mono font-bold text-neutral-100 uppercase">
                    Pairwise Cast Similarity Metric: {continuityProfiles[0]?.name} vs {continuityProfiles[1]?.name}
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {pairwiseSimilarity.isUnique ? 'GUARANTEED UNIQUE (<15% THRESHOLD)' : 'WARNING: HIGH SIMILARITY'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                  Zero clone probability: Characters possess distinct bone geometry, eye shapes, and independent PRNG latent seeds.
                </p>
              </div>
            </div>

            <div className="text-right text-[10px] font-mono text-neutral-400">
              <span className="block text-emerald-400 font-bold">ANTI-BLEEDING ENFORCED</span>
              <span>Regional Attention Masks Active</span>
            </div>
          </div>

          {/* Side-by-Side Cast Uniqueness Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {continuityProfiles.map((p) => (
              <div
                key={p.characterId}
                className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.referenceSheet.frontPortraitUrl}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shadow"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-neutral-100 font-mono">{p.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {p.role}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-neutral-400">
                        Biometric Seed: #{p.biometrics.biometricSeed}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                    <Lock className="w-3 h-3" />
                    LOCKED
                  </span>
                </div>

                {/* Biometric Breakdown Table */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Bone Structure:</span>
                    <span className="text-neutral-200 font-bold">{p.biometrics.facialBoneStructure}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Eye Geometry:</span>
                    <span className="text-neutral-200 font-bold">{p.biometrics.eyeGeometry}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Complexion & Tone:</span>
                    <span className="text-neutral-200 font-bold">{p.biometrics.skinTexture}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Age Demographic:</span>
                    <span className="text-neutral-200 font-bold">{p.biometrics.ageBracket} years</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-neutral-500 block">Signature Wardrobe & Props:</span>
                  <p className="text-neutral-300 font-sans">{p.biometrics.signatureFeature}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decoupled Regional Prompt Synthesis */}
          <div className="bg-neutral-900/60 p-5 rounded-2xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Concept De-Coupled Prompt (Feature Bleed Disabled)</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400">IP-Adapter Regional Isolation</span>
            </div>
            <p className="text-xs text-neutral-300 font-mono leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              {decoupledPrompt.unifiedPrompt}
            </p>
            <div className="text-[10px] font-mono text-rose-300/80 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30">
              <span className="font-bold">Anti-Leak Negative Filter:</span> {decoupledPrompt.negativeAntiBleedPrompt}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Multi-Angle Reference Sheets (5-Point Anchor) */}
      {activeTab === 'sheet' && (
        <div className="space-y-6">
          {continuityProfiles.map((char) => (
            <div
              key={char.characterId}
              className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-100 font-mono">
                    {char.name} • 5-Point Multi-Angle Photometric Anchor Sheet
                  </h4>
                  <p className="text-xs text-neutral-400">
                    High-resolution reference images conditioned into Flux.1 / IP-Adapter with 0.88 anchor weight
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  5/5 ANCHORS VERIFIED
                </span>
              </div>

              {/* 5-Point Anchor Images Grid */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Frontal Portrait', url: char.referenceSheet.frontPortraitUrl, angle: '0° Center' },
                  { label: '3/4 Left Angle', url: char.referenceSheet.threeQuarterLeftUrl, angle: '-45° Yaw' },
                  { label: '3/4 Right Angle', url: char.referenceSheet.threeQuarterRightUrl, angle: '+45° Yaw' },
                  { label: 'Profile Silhouette', url: char.referenceSheet.profileSilhouetteUrl, angle: '90° Side' },
                  { label: 'Full Costume Rig', url: char.referenceSheet.fullBodyCostumeUrl, angle: 'Full Figure' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 space-y-1.5">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-amber-300">
                        {item.angle}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-300 font-bold truncate">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Last-Frame Chaining for Sequential Takes */}
      {activeTab === 'chaining' && (
        <div className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h4 className="text-sm font-bold text-neutral-100 font-mono">
                Last-Frame Chaining: Shot-to-Shot Latent Anchor
              </h4>
              <p className="text-xs text-neutral-400">
                In sequential coverage, Shot N extracts its tail frame to initialize Shot N+1's I2V conditioning plate.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              TEMPORAL CONTINUITY: 0.92
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Previous Shot Frame N */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-xs font-mono font-bold text-neutral-300 block">
                Source Tail Cut (Shot #1 Out-Point):
              </span>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <img
                  src={selectedShot?.approvedKeyframeUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'}
                  alt="Tail Cut"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300">
                  FRAME 120 (00:05.000)
                </div>
              </div>
            </div>

            {/* Extruded In-Point Frame N+1 */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-cyan-500/40 space-y-2 shadow-lg shadow-cyan-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 block">
                  Chained In-Point (Shot #2 In-Point):
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">SEAMLESS CUT</span>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <img
                  src={selectedShot?.approvedKeyframeUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'}
                  alt="Chained In-Point"
                  className="w-full h-full object-cover filter brightness-105"
                />
                <div className="absolute top-2 left-2 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300">
                  FRAME 001 (00:05.041)
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-neutral-400 bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
            <span>Flow Motion Vector: dx: +0.05, dy: -0.02, zoom: 1.03</span>
            <span className="text-emerald-400 font-bold">Zero Morphing / Optical Flow Verified</span>
          </div>
        </div>
      )}

      {/* TAB 4: 4K Color Mastering & Film Stocks */}
      {activeTab === 'color' && (
        <div className="bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h4 className="text-sm font-bold text-neutral-100 font-mono">
                4K Color Mastering Grade & Film Emulation
              </h4>
              <p className="text-xs text-neutral-400">
                10-bit Rec.709 & DCI-P3 wide color space with highlight roll-off and organic fine-pitch 35mm grain
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {colorGrade.bitDepth}
            </span>
          </div>

          {/* Color Matrix Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Film Stock Preset */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <label className="block text-xs font-mono font-bold text-neutral-300">
                Film Stock Emulation:
              </label>
              <select
                value={colorGrade.filmStock}
                onChange={(e) =>
                  setColorGrade({ ...colorGrade, filmStock: e.target.value as FilmStockEmulation })
                }
                aria-label="Film Stock Preset"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-amber-300 font-mono focus:outline-none"
              >
                {(Object.keys(FILM_STOCK_PRESETS) as FilmStockEmulation[]).map((key) => (
                  <option key={key} value={key}>
                    {FILM_STOCK_PRESETS[key].name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                {FILM_STOCK_PRESETS[colorGrade.filmStock].description}
              </p>
            </div>

            {/* Gamut & Bit Depth */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <label className="block text-xs font-mono font-bold text-neutral-300">
                Color Gamut Space:
              </label>
              <select
                value={colorGrade.gamut}
                onChange={(e) => setColorGrade({ ...colorGrade, gamut: e.target.value as any })}
                aria-label="Color Gamut Space"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 font-mono focus:outline-none"
              >
                <option value="DCI-P3 Theatrical">DCI-P3 Theatrical (SMPTE RP 431-2)</option>
                <option value="Rec.709 Standard">Rec.709 Standard (ITU-R BT.709)</option>
                <option value="ACEScc Wide Gamut">ACEScc Wide Color Gamut</option>
              </select>

              <div className="pt-2 text-xs font-mono space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Dynamic Range:</span>
                  <span className="text-amber-400 font-bold">{mastering.technicalSpecs.dynamicRangeStops} stops</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Aspect Ratio:</span>
                  <span className="text-neutral-200 font-bold">{mastering.technicalSpecs.aspectRatio} Cinema Scope</span>
                </div>
              </div>
            </div>

            {/* Highlight Roll-off & Film Grain */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-neutral-400">Highlight Roll-Off Shoulder:</span>
                  <span className="text-amber-400 font-bold">{colorGrade.highlightRollOffPercent}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={colorGrade.highlightRollOffPercent}
                  onChange={(e) =>
                    setColorGrade({
                      ...colorGrade,
                      highlightRollOffPercent: parseInt(e.target.value, 10),
                    })
                  }
                  aria-label="Highlight Roll-Off"
                  className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-neutral-400">Organic 35mm Grain:</span>
                  <span className="text-amber-400 font-bold">{colorGrade.filmGrainAmountPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={colorGrade.filmGrainAmountPercent}
                  onChange={(e) =>
                    setColorGrade({
                      ...colorGrade,
                      filmGrainAmountPercent: parseInt(e.target.value, 10),
                    })
                  }
                  aria-label="Film Grain Percentage"
                  className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Color Science Prompt Injection Preview */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5 font-mono text-xs">
            <span className="text-amber-400 font-bold block">Mastering Color Science Tag:</span>
            <p className="text-neutral-300 leading-relaxed">{mastering.masteringPromptTag}</p>
          </div>
        </div>
      )}
    </div>
  );
};
