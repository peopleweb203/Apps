import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  SetpieceArchetype,
  CameraStuntPreset,
  BlockbusterSetpiecePlan,
  SETPIECE_CATALOG,
  compileHollywoodSetpiece,
  validateSetpiecePhysics,
  injectHollywoodSetpiecePrompt,
} from '../../utils/hollywood-setpiece-engine';
import {
  Flame,
  Zap,
  Camera,
  Layers,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  Copy,
  Check,
  Clock,
  Compass,
  Bomb,
  Activity,
  Sliders,
  ChevronRight,
} from 'lucide-react';

interface Props {
  initialArchetype?: SetpieceArchetype;
  onApplyPrompt?: (injectedPrompt: string) => void;
}

export const HollywoodSetpiecePanel: React.FC<Props> = ({
  initialArchetype = 'superhuman-mass-throw',
  onApplyPrompt,
}) => {
  const { characters, selectedShot } = useStudio();
  const [selectedArchetype, setSelectedArchetype] = useState<SetpieceArchetype>(initialArchetype);
  const [selectedCamera, setSelectedCamera] = useState<CameraStuntPreset>('extreme-low-angle-ground-slam');
  const [heroName, setHeroName] = useState<string>(characters[0]?.name || 'Elena Cross');
  const [spectacleMaster, setSpectacleMaster] = useState<boolean>(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('evt-1');
  const [copied, setCopied] = useState<boolean>(false);

  // Compile plan
  const plan = compileHollywoodSetpiece(
    selectedArchetype,
    heroName,
    selectedCamera,
    spectacleMaster
  );

  const physicsReport = validateSetpiecePhysics(plan);

  const activeEvent = plan.timelineEvents.find((e) => e.id === selectedEventId) || plan.timelineEvents[0];

  const handleCopyPrompt = () => {
    const prompt = injectHollywoodSetpiecePrompt(selectedShot?.stillPrompt || 'Elena in urban street', plan);
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleArchetypeSelect = (arch: SetpieceArchetype) => {
    setSelectedArchetype(arch);
    const cat = SETPIECE_CATALOG.find((c) => c.archetype === arch);
    if (cat) {
      setSelectedCamera(cat.defaultCamera);
      setSelectedEventId(cat.defaultEvents[0]?.id || 'evt-1');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950/60 p-5 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono tracking-tight text-neutral-100 flex items-center gap-2">
              Universal Hollywood Blockbuster Setpiece & Extreme Physics Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                VFX 4K MASTER
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Choreograph superhuman feats, multi-vector missile intercepts, rooftop vertigo, and realistic heavy debris gravity.
            </p>
          </div>
        </div>

        {/* Master Spectacle Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-mono text-neutral-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Spectacle Master
            </span>
            <button
              onClick={() => setSpectacleMaster(!spectacleMaster)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                spectacleMaster ? 'bg-amber-500' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-neutral-950 absolute top-0.5 transition-transform ${
                  spectacleMaster ? 'left-5.5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Setpiece Archetype Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            Blockbuster Setpiece Catalog ({SETPIECE_CATALOG.length} Archetypes)
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            Duration: {plan.totalDurationSec.toFixed(1)}s Continuous Take
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SETPIECE_CATALOG.map((cat) => {
            const isSelected = selectedArchetype === cat.archetype;
            return (
              <button
                key={cat.archetype}
                onClick={() => handleArchetypeSelect(cat.archetype)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-950/20'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-rose-300' : 'text-neutral-200'}`}>
                      {cat.title}
                    </span>
                    {isSelected && <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug line-clamp-2">
                    {cat.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-800/60">
                  <span>{cat.defaultEvents.length} Event Keys</span>
                  <span className="text-rose-400 font-semibold">{cat.defaultDuration}s Stunt</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kinetic Event Multi-Track Timeline */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
              Multi-Vector Kinetic Stunt Timeline
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Click Event Keyframe to Inspect Vector Physics
          </span>
        </div>

        {/* Visual Track Bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {plan.timelineEvents.map((evt, idx) => {
            const isSelected = activeEvent?.id === evt.id;
            return (
              <button
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-md shadow-amber-950/20'
                    : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold">
                    T+{evt.timestampSec.toFixed(1)}s - {(evt.timestampSec + evt.durationSec).toFixed(1)}s
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px]">
                    Step {idx + 1}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-neutral-200 line-clamp-2 leading-tight">
                  {evt.actorAction}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-400 truncate">
                  {evt.explosionVFX && <Bomb className="w-3 h-3 text-rose-400 shrink-0" />}
                  {evt.incomingProjectile && <Zap className="w-3 h-3 text-cyan-400 shrink-0" />}
                  <span>{evt.heavyObjectPhysics.objectName}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Keyframe Detail Inspector */}
        {activeEvent && (
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                Heavy Object Mass & Kinetics
              </span>
              <div className="text-xs text-neutral-200 font-medium">
                {activeEvent.heavyObjectPhysics.objectName}
              </div>
              <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
                <div>Mass: {activeEvent.heavyObjectPhysics.massKg} kg</div>
                <div>Velocity: {activeEvent.heavyObjectPhysics.initialVelocityMs} m/s</div>
                <div>Arc: {activeEvent.heavyObjectPhysics.trajectoryArc}</div>
                <div className="text-neutral-300">Damage: {activeEvent.heavyObjectPhysics.impactDamage}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                Incoming Projectile & Explosion
              </span>
              {activeEvent.incomingProjectile ? (
                <div className="text-[11px] font-mono text-neutral-300 space-y-0.5">
                  <div className="font-bold text-cyan-300">{activeEvent.incomingProjectile.type}</div>
                  <div>Velocity: Mach {activeEvent.incomingProjectile.velocityMach}</div>
                  <div>Target: {activeEvent.incomingProjectile.interceptTarget}</div>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 italic">No incoming ballistic projectile</div>
              )}

              {activeEvent.explosionVFX ? (
                <div className="text-[10px] font-mono text-rose-300 pt-1 border-t border-neutral-800 space-y-0.5">
                  <div>Detonation: {activeEvent.explosionVFX.bloomType}</div>
                  <div>Blast Radius: {activeEvent.explosionVFX.radiusMeters}m</div>
                  <div>Shrapnel: {activeEvent.explosionVFX.shrapnelDensity} density</div>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold">
                Choreographed Camera Track
              </span>
              <div className="text-xs text-neutral-300 leading-relaxed">
                {activeEvent.cameraMovement}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Rig & Physics Sentinel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dynamic Camera Presets */}
        <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              Dynamic Stunt Camera Coordination
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Cinematic Optics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                id: 'extreme-low-angle-ground-slam',
                label: 'Extreme Low-Angle Worm-Eye',
                desc: '17mm Panavision anamorphic looking up at massive airborne collision with dirt kick',
              },
              {
                id: 'vertigo-pitch-down-precipice',
                label: 'Vertigo 90° Pitch-Down',
                desc: '24mm Arri Alexa rolling axis peering directly down 500m skyscraper drop',
              },
              {
                id: 'orbit-360-bullet-stunt',
                label: '360° Bullet-Time Orbit',
                desc: 'Rotational 120fps camera sweep orbiting mid-air hero at height of leap',
              },
              {
                id: 'high-speed-missile-chase',
                label: 'Dynamic Follow-Cam Chase',
                desc: '85mm telephoto tracking supersonic projectile with shockwave heat shimmer',
              },
            ].map((cam) => {
              const isSelected = selectedCamera === cam.id;
              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam.id as CameraStuntPreset)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-mono font-bold text-neutral-200">{cam.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-1 leading-snug">{cam.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Physics Plausibility Sentinel */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Physics Plausibility Sentinel
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                physicsReport.isPhysicsPlausible
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {physicsReport.isPhysicsPlausible ? 'PLAUSIBLE' : 'FLOATY CGI'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">Kinetic Energy:</span>
              <span className="text-amber-300 font-bold">
                {plan.physicsParameters.kineticEnergyMegajoules.toFixed(1)} Megajoules
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">Gravity Drag:</span>
              <span className="text-neutral-200">{plan.physicsParameters.gravityMs2} m/s² Realistic</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">Crater Depth:</span>
              <span className="text-neutral-200">{plan.physicsParameters.groundImpactDepthCm} cm displacement</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300">
            {physicsReport.recommendations.length > 0 ? (
              <span className="text-amber-400">{physicsReport.recommendations[0]}</span>
            ) : (
              <span className="text-emerald-400">
                Physics Sentinel: Heavy inertia and realistic gravity verified. Zero floaty ragdoll artifacts.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compiled Conditioning & Injection Preview */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
              Compiled Blockbuster Setpiece Generation Payload
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Copied Setpiece Payload' : 'Copy Payload'}</span>
            </button>

            {onApplyPrompt && (
              <button
                onClick={() =>
                  onApplyPrompt(
                    injectHollywoodSetpiecePrompt(
                      selectedShot?.stillPrompt || 'Elena in urban street',
                      plan
                    )
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer"
              >
                <span>Inject into Scene Conditioning</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 leading-relaxed break-words">
          {injectHollywoodSetpiecePrompt(
            selectedShot?.stillPrompt || 'Elena in urban street',
            plan
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase">
            Anti-Floaty Exclusions:
          </span>
          {plan.promptTokens.negativeExclusions.map((rule, idx) => (
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
