import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  Video,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  RotateCw,
  RotateCcw,
  Sliders,
  Sparkles,
  CheckCircle2,
  Volume2,
  Mic,
  Activity,
  Layers,
  ArrowRight,
  Play,
  Film,
} from 'lucide-react';

export const MotionPerformanceView: React.FC = () => {
  const {
    selectedShot,
    extrudeMotion,
    alignLipSync,
    setActiveTab,
    characters,
  } = useStudio();

  const [motionEngine, setMotionEngine] = useState<'Wan 2.1 (Cinematic I2V)' | 'Kling 1.5 Pro' | 'Runway Gen-3'>(
    selectedShot?.motionEngine || 'Wan 2.1 (Cinematic I2V)'
  );

  const [direction, setDirection] = useState<'DOLLY_IN' | 'DOLLY_OUT' | 'ORBIT_LEFT' | 'ORBIT_RIGHT' | 'CRANE_UP' | 'PAN_RIGHT'>(
    selectedShot?.motionVector.direction || 'DOLLY_IN'
  );

  const [intensity, setIntensity] = useState<number>(selectedShot?.motionVector.intensity || 4);
  const [jawArticulation, setJawArticulation] = useState<number>(85);
  const [blinkRate, setBlinkRate] = useState<number>(12); // blinks per min

  const [isExtruding, setIsExtruding] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const speaker = characters.find((c) => c.id === selectedShot?.speakerId);

  const handleExtrude = async () => {
    if (!selectedShot) return;
    setIsExtruding(true);
    await extrudeMotion(selectedShot.id, direction, motionEngine);
    setIsExtruding(false);
  };

  const handleLipSync = async () => {
    if (!selectedShot) return;
    setIsSyncing(true);
    await alignLipSync(selectedShot.id);
    setIsSyncing(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950/40">
      {/* Left Stage 2: Motion Extrusion Controls */}
      <div className="w-1/2 border-r border-neutral-800 p-6 flex flex-col justify-between bg-neutral-950/60 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase">
                STAGE 2 PRODUCTION
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                I2V Motion Vector Extrusion
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-neutral-400">ENGINE:</span>
              <select
                value={motionEngine}
                onChange={(e) => setMotionEngine(e.target.value as any)}
                aria-label="Motion Engine"
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono focus:outline-none"
              >
                <option value="Wan 2.1 (Cinematic I2V)">Wan 2.1 (Cinematic I2V)</option>
                <option value="Kling 1.5 Pro">Kling 1.5 Pro</option>
                <option value="Runway Gen-3">Runway Gen-3 Alpha</option>
              </select>
            </div>
          </div>

          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 leading-relaxed">
            <p>
              💡 <strong>Motion Vectors Prevent AI Reversals:</strong> By fixing camera trajectories and object velocities with explicit vector constraints, Wan 2.1 never generates actors walking backwards or morphing through doors.
            </p>
          </div>

          {/* Master Approved Still Preview Feeding into I2V */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-black">
            <img
              src={selectedShot?.approvedKeyframeUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80'}
              alt="Source Keyframe"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
              <div className="font-mono text-xs text-neutral-300 flex items-center justify-between w-full">
                <span>LOCKED SOURCE STILL: SHOT #{selectedShot?.shotNumber}</span>
                <span className="text-amber-400">VECTOR: {direction} (INTENSITY {intensity})</span>
              </div>
            </div>
          </div>

          {/* Directional Motion Vector Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-neutral-300 mb-2.5">
              Select Directional Motion Vector:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'DOLLY_IN', label: 'Push-In (Dolly In)', icon: MoveDown },
                { id: 'DOLLY_OUT', label: 'Pull-Back (Dolly Out)', icon: MoveUp },
                { id: 'ORBIT_LEFT', label: 'Orbit Pan Left', icon: RotateCcw },
                { id: 'ORBIT_RIGHT', label: 'Orbit Pan Right', icon: RotateCw },
                { id: 'CRANE_UP', label: 'Crane Jib Up', icon: MoveUp },
                { id: 'PAN_RIGHT', label: 'Tracking Pan Right', icon: MoveRight },
              ].map((vec) => {
                const Icon = vec.icon;
                const isSelected = direction === vec.id;

                return (
                  <button
                    key={vec.id}
                    onClick={() => setDirection(vec.id as any)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="text-[11px] font-medium leading-tight">{vec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motion Intensity Slider */}
          <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-200">
                Camera Motion Intensity & Dynamic Velocity
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {intensity} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
              aria-label="Motion Intensity"
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>1 (Subtle Organic Drift)</span>
              <span>5 (Standard Cinematic Move)</span>
              <span>10 (High Velocity Tracking)</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800 mt-6 flex justify-between items-center">
          <span className="text-[11px] font-mono text-neutral-500">
            Status: {selectedShot?.motionStatus === 'READY' ? 'Video Extruded' : 'Pending Extrusion'}
          </span>

          <button
            onClick={handleExtrude}
            disabled={isExtruding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer font-mono"
          >
            <Video className="w-4 h-4" />
            <span>{isExtruding ? 'EXTRUDING I2V IN WAN 2.1...' : 'EXTRUDE MOTION (STAGE 2)'}</span>
          </button>
        </div>
      </div>

      {/* Right Stage 3: Latent Lip-Sync & Performance Articulation */}
      <div className="w-1/2 p-6 flex flex-col justify-between bg-neutral-950/20 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 uppercase">
                STAGE 3 PRODUCTION
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Latent Lip-Sync & Phonemes
              </h2>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LivePortrait / LatentSync
            </span>
          </div>

          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 leading-relaxed">
            <p>
              Passes the ElevenLabs neural dialogue audio track and the extruded motion video through a phoneme-level latent alignment layer to articulate lips, teeth, and natural eyelid blinking without face warping.
            </p>
          </div>

          {/* Dialogue Cue & Audio Waveform Preview */}
          {selectedShot?.dialogue ? (
            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    Character Dialogue Track
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  Speaker: {speaker?.name || 'Actor'}
                </span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs italic text-neutral-200">
                "{selectedShot.dialogue}"
              </div>

              {/* Simulated Audio Waveform & Phonemes */}
              <div className="bg-black/60 p-3 rounded-lg border border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>PHONEME ALIGNMENT</span>
                  <span className="text-emerald-400">SYNC CONFIDENCE: 98.4%</span>
                </div>

                <div className="h-10 flex items-center gap-1 justify-center px-2">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const h = [20, 60, 45, 90, 75, 30, 85, 100, 40, 65, 80, 25, 55, 95, 30][idx % 15];
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-cyan-500 to-amber-400 rounded-full"
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-neutral-900/40 rounded-xl border border-neutral-800 text-xs text-neutral-500">
              No dialogue line attached to this shot (pure action/establishing shot).
            </div>
          )}

          {/* Latent Performance Sliders */}
          <div className="space-y-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-neutral-200">
                  Jaw & Lip Articulation Scale
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {jawArticulation}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                value={jawArticulation}
                onChange={(e) => setJawArticulation(parseInt(e.target.value, 10))}
                aria-label="Jaw and Lip Articulation Scale"
                className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-neutral-200">
                  Organic Eyelid Micro-Blink Frequency
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {blinkRate} / min
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="24"
                value={blinkRate}
                onChange={(e) => setBlinkRate(parseInt(e.target.value, 10))}
                aria-label="Organic Eyelid Micro-Blink Frequency"
                className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-neutral-800 mt-6 flex justify-between items-center">
          <button
            onClick={handleLipSync}
            disabled={isSyncing || !selectedShot?.dialogue}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-900/40 transition-all cursor-pointer font-mono"
          >
            <Activity className="w-4 h-4" />
            <span>{isSyncing ? 'SYNCHRONIZING PHONEMES...' : 'SYNTHESIZE LATENT LIP-SYNC'}</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer font-mono"
          >
            <span>ASSEMBLE IN TIMELINE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
