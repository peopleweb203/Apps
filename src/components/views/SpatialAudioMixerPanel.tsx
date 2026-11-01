import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  AcousticRoomPreset,
  ACOUSTIC_PRESETS_MAP,
  SurfaceContactMaterial,
  SpatialEntityPosition,
  calculateBinauralPositioning,
  generateProceduralFoleyTrack,
  calculateSidechainDucking,
  buildSpatialAudioMixerPayload,
} from '../../utils/spatial-audio-mixer';
import {
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  Layers,
  Compass,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export const SpatialAudioMixerPanel: React.FC = () => {
  const { characters, selectedShot } = useStudio();

  // State
  const [roomPreset, setRoomPreset] = useState<AcousticRoomPreset>('deep_cavern');
  const [surface, setSurface] = useState<SurfaceContactMaterial>('rain_slick_concrete');
  const [foleyDensity, setFoleyDensity] = useState<number>(1.0);
  const [isDialogueSimulated, setIsDialogueSimulated] = useState<boolean>(true);
  const [duckingLevelDb, setDuckingLevelDb] = useState<number>(-4.5);
  const [copied, setCopied] = useState<boolean>(false);

  // Position of primary hero emitter
  const [heroPos, setHeroPos] = useState<SpatialEntityPosition>({
    entityId: 'hero-elena',
    name: 'Elena',
    x: -2.4, // left
    y: 0,
    zDepthMeters: 3.2,
    velocityMetersPerSec: 1.4,
  });

  const room = ACOUSTIC_PRESETS_MAP[roomPreset];
  const binaural = calculateBinauralPositioning(heroPos);
  const foleyEvents = generateProceduralFoleyTrack(4.0, surface, 'kevlar_rustle', foleyDensity);
  const stems = calculateSidechainDucking(isDialogueSimulated, duckingLevelDb);
  const payload = buildSpatialAudioMixerPayload(roomPreset, heroPos, surface);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(payload.audioPromptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Automated Spatial Foley & Acoustic Dialogue Mixer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                3D BINAURAL IR
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Convolution room impulse responses, inverse-square air absorption, and procedural foley sidechain
            </p>
          </div>
        </div>

        {/* Dialogue Ducking Toggle */}
        <button
          onClick={() => setIsDialogueSimulated(!isDialogueSimulated)}
          data-testid="dialogue-ducking-toggle"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer shadow ${
            isDialogueSimulated
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-500/20'
              : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-neutral-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>DIALOGUE SIDECHAIN DUCKING</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${isDialogueSimulated ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
            {isDialogueSimulated ? `${duckingLevelDb} dB ACTIVE` : 'MUTED'}
          </span>
        </button>
      </div>

      {/* Main Grid: Room Acoustics, Spatial Radar, and 4-Channel Mixer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Acoustic Room Profiles */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Environmental Room IR</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">{room.reverbDecaySeconds}s RT60</span>
          </div>

          <div className="space-y-2">
            {(Object.keys(ACOUSTIC_PRESETS_MAP) as AcousticRoomPreset[]).map((pKey) => {
              const preset = ACOUSTIC_PRESETS_MAP[pKey];
              const isSelected = roomPreset === pKey;

              return (
                <button
                  key={pKey}
                  onClick={() => setRoomPreset(pKey)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-300 font-bold shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div>
                    <div>{preset.name}</div>
                    <div className="text-[9px] text-neutral-500 font-normal">
                      Decay: {preset.reverbDecaySeconds}s • LPF: {preset.lowPassCutoffHz}Hz
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              );
            })}
          </div>

          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-[11px] font-sans text-neutral-300 leading-relaxed">
            <span className="font-mono text-cyan-400 block text-[10px] uppercase font-bold mb-0.5">Acoustic Coloration:</span>
            {room.acousticColorationTag}
          </div>
        </div>

        {/* Column 2: 2D Spatial Positioning Radar */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Spatial Positioning Radar (Overhead)</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Pan: {binaural.panStereo >= 0 ? '+' : ''}{binaural.panStereo}
            </span>
          </div>

          {/* Radar Visual Canvas */}
          <div className="relative aspect-square bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden flex items-center justify-center">
            {/* Concentric distance rings */}
            <div className="absolute w-[80%] h-[80%] rounded-full border border-neutral-800/80 pointer-events-none" />
            <div className="absolute w-[50%] h-[50%] rounded-full border border-neutral-800/80 pointer-events-none" />
            <div className="absolute w-[25%] h-[25%] rounded-full border border-neutral-800/80 pointer-events-none" />

            {/* Cross-hairs */}
            <div className="absolute w-full h-px bg-neutral-800/60" />
            <div className="absolute h-full w-px bg-neutral-800/60" />

            {/* Camera / Listener at Bottom Center */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-neutral-950 shadow flex items-center justify-center text-[8px] font-bold text-neutral-950">
                C
              </div>
              <span className="text-[8px] font-mono text-amber-400 mt-0.5">CAMERA RIG</span>
            </div>

            {/* Draggable Emitter Token */}
            <div
              className="absolute w-5 h-5 rounded-full bg-cyan-400 border-2 border-neutral-950 shadow-lg shadow-cyan-400/50 flex items-center justify-center cursor-pointer transition-transform duration-75"
              style={{
                left: `${50 + (heroPos.x / 10) * 40}%`,
                top: `${80 - (heroPos.zDepthMeters / 10) * 60}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-ping" />
            </div>

            <div className="absolute top-2 left-2 text-[9px] font-mono text-neutral-500">
              Front Soundstage (+Z)
            </div>
          </div>

          {/* Live Binaural Telemetry */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <div>
              <span className="text-neutral-500 block">Stereo Pan:</span>
              <span className="text-cyan-400 font-bold">{binaural.panStereo < 0 ? 'Left' : 'Right'} ({binaural.panStereo})</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Distance Loss:</span>
              <span className="text-amber-400 font-bold">{binaural.distanceAttenuationDb} dB</span>
            </div>
            <div>
              <span className="text-neutral-500 block">HF Roll-Off:</span>
              <span className="text-emerald-400 font-bold">{binaural.airAbsorptionCutoffHz} Hz</span>
            </div>
          </div>
        </div>

        {/* Column 3: Real-Time 4-Channel Stems Mixer */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>4-Channel Stems Meter</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">24-BIT 48KHZ</span>
          </div>

          {/* VU Stem Meters */}
          <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            {/* Stem 1: Dialogue */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-neutral-300">Dialogue Stem:</span>
                <span className="text-amber-400 font-bold">{stems.dialogueDb} dB</span>
              </div>
              <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-150"
                  style={{ width: `${Math.max(10, 100 + stems.dialogueDb * 2)}%` }}
                />
              </div>
            </div>

            {/* Stem 2: Foley */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-neutral-300">Procedural Foley:</span>
                <span className="text-cyan-400 font-bold">{stems.foleyDb.toFixed(1)} dB</span>
              </div>
              <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-150"
                  style={{ width: `${Math.max(10, 100 + stems.foleyDb * 2)}%` }}
                />
              </div>
            </div>

            {/* Stem 3: SFX / Impacts */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-neutral-300">SFX & Combat Hits:</span>
                <span className="text-rose-400 font-bold">{stems.sfxHitsDb.toFixed(1)} dB</span>
              </div>
              <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-150"
                  style={{ width: `${Math.max(10, 100 + stems.sfxHitsDb * 2)}%` }}
                />
              </div>
            </div>

            {/* Stem 4: Ambient Environmental Score */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-neutral-300">Ambient Score Bed:</span>
                <span className="text-purple-400 font-bold">{stems.ambientScoreDb.toFixed(1)} dB</span>
              </div>
              <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-150"
                  style={{ width: `${Math.max(10, 100 + stems.ambientScoreDb * 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ducking Attenuation Tag */}
          <div className="flex items-center justify-between text-xs font-mono bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-400">Sidechain Gain Reduction:</span>
            <span className="text-amber-400 font-bold">
              {isDialogueSimulated ? `${duckingLevelDb} dB (Auto-Duck)` : '0.0 dB'}
            </span>
          </div>
        </div>
      </div>

      {/* Procedural Foley Surface Selector & Density Controls */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Procedural Surface Foley Generator ({foleyEvents.length} events compiled)</span>
          </span>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-400">Foley Density:</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={foleyDensity}
              onChange={(e) => setFoleyDensity(parseFloat(e.target.value))}
              aria-label="Foley Density"
              className="accent-cyan-500 h-1 bg-neutral-800 rounded-lg cursor-pointer w-32"
            />
            <span className="text-xs font-mono font-bold text-cyan-400">{foleyDensity.toFixed(1)}x</span>
          </div>
        </div>

        {/* Surface Material Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {(
            [
              'rain_slick_concrete',
              'metallic_grating',
              'wet_mud',
              'hollow_wood',
              'loose_gravel',
              'deep_water_splash',
            ] as SurfaceContactMaterial[]
          ).map((s) => (
            <button
              key={s}
              onClick={() => setSurface(s)}
              className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer truncate ${
                surface === s
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Foley Event Timeline Feed */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 max-h-36 overflow-y-auto pr-1">
          {foleyEvents.slice(0, 8).map((evt) => (
            <div
              key={evt.id}
              className="bg-neutral-950 p-2 rounded-lg border border-neutral-800/80 text-[10px] font-mono space-y-1"
            >
              <div className="flex justify-between text-neutral-400">
                <span className="text-cyan-400 font-bold">@ {evt.timestampSec.toFixed(2)}s</span>
                <span>{evt.triggerType.toUpperCase()}</span>
              </div>
              <p className="text-neutral-300 truncate font-sans text-[11px]">{evt.foleyDescription}</p>
              <div className="flex justify-between text-[9px] text-neutral-500">
                <span>Pan: {evt.panning > 0 ? 'Right' : 'Left'}</span>
                <span>{evt.gainDb.toFixed(1)} dB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compiled Spatial Audio Tag Preview */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-cyan-500/40 space-y-3 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Compiled Spatial Audio & Foley Render Payload Tag
            </h4>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED SPATIAL TAG' : 'COPY SPATIAL AUDIO TAG'}</span>
          </button>
        </div>

        <p className="text-xs text-cyan-200/90 font-mono leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-cyan-500/30">
          {payload.audioPromptTag}
        </p>
      </div>
    </div>
  );
};
