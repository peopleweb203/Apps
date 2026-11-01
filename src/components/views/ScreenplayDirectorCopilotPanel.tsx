import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  SteerableBeatState,
  DirectorIntervention,
  PlotTwistPreset,
  PLOT_TWIST_CATALOG,
  initializeSteerableBeats,
  mapInterventionToEngineTriggers,
  reindexDownstreamBeats,
} from '../../utils/interactive-screenplay-copilot';
import {
  ScreenplayScene,
  generateHollywoodScreenplay,
} from '../../utils/hollywood-screenplay-orchestrator';
import {
  Compass,
  Zap,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Sliders,
  Send,
  MessageSquare,
  Layers,
  Camera,
  Volume2,
  Car,
  Shirt,
  Play,
  Edit3,
} from 'lucide-react';

interface Props {
  onAcceptBeat?: (scene: ScreenplayScene) => void;
  onConvertAllToProduction?: () => void;
}

export const ScreenplayDirectorCopilotPanel: React.FC<Props> = ({
  onAcceptBeat,
  onConvertAllToProduction,
}) => {
  const { characters, sets } = useStudio();

  // Initialize the 15-beat timeline
  const [beats, setBeats] = useState<SteerableBeatState[]>(() => {
    const initial = initializeSteerableBeats();
    // Auto-generate scene 1 draft
    const fullScript = generateHollywoodScreenplay(
      {
        title: 'PROTOCOL OMEGA',
        genre: 'SCIFI_CYBER_EPIC',
        scope: 'FULL_SCREENPLAY',
        leadCharacterId: characters[0]?.id || 'char-elena',
        antagonistCharacterId: characters[1]?.id || 'char-chen',
        selectedSetIds: sets.map((s) => s.id),
      },
      characters,
      sets
    );

    return initial.map((b, idx) => ({
      ...b,
      currentDraft: fullScript.scenes[idx],
    }));
  });

  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(1);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [selectedTwist, setSelectedTwist] = useState<PlotTwistPreset | ''>('');
  const [tensionSlider, setTensionSlider] = useState<number>(75);
  const [spectacleSlider, setSpectacleSlider] = useState<number>(65);
  const [isEditingDraft, setIsEditingDraft] = useState<boolean>(false);
  const [editedActionText, setEditedActionText] = useState<string>('');
  const [statusFeedback, setStatusFeedback] = useState<string>('');

  const currentBeat = beats.find((b) => b.beatIndex === activeBeatIndex) || beats[0];
  const activeScene = currentBeat.currentDraft;

  // Handle Injecting Plot Twist / Freeform Directive
  const handleApplyIntervention = (overridePrompt?: string) => {
    const directive = overridePrompt || customPrompt;
    if (!directive && !selectedTwist) return;

    const intervention: DirectorIntervention = {
      id: `int-${Date.now()}`,
      targetBeat: currentBeat.beat,
      twistPreset: selectedTwist ? (selectedTwist as PlotTwistPreset) : undefined,
      customDirective: directive,
      tensionLevel: tensionSlider,
      spectacleDensity: spectacleSlider,
      appliedAt: new Date().toISOString(),
    };

    // Re-index downstream beats
    const updatedBeats = reindexDownstreamBeats(beats, activeBeatIndex, intervention);

    // If an active scene exists, update its action and triggers
    if (activeScene) {
      const triggers = mapInterventionToEngineTriggers(intervention);
      const updatedElements = [...activeScene.elements];

      // Inject action line for twist
      const twistDesc = selectedTwist
        ? PLOT_TWIST_CATALOG.find((t) => t.id === selectedTwist)?.description
        : directive;

      updatedElements.splice(2, 0, {
        type: 'ACTION_LINE',
        text: `PLOT TWIST INTERVENTION: ${twistDesc}`,
      });

      if (triggers.combatRigActive) {
        updatedElements.push({
          type: 'ENGINE_DIRECTIVE',
          text: `[STUNT_TRIGGER: Matrix 90° Shutter Combat Rig Activated • Tension ${triggers.scoreTension}]`,
        });
      }

      updatedBeats[activeBeatIndex - 1].currentDraft = {
        ...activeScene,
        elements: updatedElements,
        engineParameters: {
          ...activeScene.engineParameters,
          audioAcoustics: {
            ...activeScene.engineParameters.audioAcoustics,
            tensionScore: triggers.scoreTension,
          },
          camera: {
            ...activeScene.engineParameters.camera,
            shutterAngle: triggers.shutterAngle,
          },
        },
      };
    }

    setBeats(updatedBeats);
    setCustomPrompt('');
    setSelectedTwist('');
    setStatusFeedback(`Applied plot intervention to Beat #${activeBeatIndex}! Downstream beats re-aligned.`);
    setTimeout(() => setStatusFeedback(''), 3000);
  };

  // Handle Approving and Advancing Beat
  const handleApproveBeat = () => {
    const nextIndex = activeBeatIndex + 1;
    const updated = beats.map((b) => {
      if (b.beatIndex === activeBeatIndex) {
        return { ...b, status: 'DIRECTOR_APPROVED' as const };
      }
      if (b.beatIndex === nextIndex) {
        return { ...b, status: 'DRAFTED' as const };
      }
      return b;
    });

    setBeats(updated);

    if (activeScene && onAcceptBeat) {
      onAcceptBeat(activeScene);
    }

    if (nextIndex <= 15) {
      setActiveBeatIndex(nextIndex);
      setStatusFeedback(`Beat #${activeBeatIndex} Approved. Moved to Beat #${nextIndex}.`);
    } else {
      setStatusFeedback('All 15 narrative beats approved by Director!');
    }

    setTimeout(() => setStatusFeedback(''), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950/60 p-5 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono tracking-tight text-neutral-100 flex items-center gap-2">
              Interactive Director Co-Pilot & Dynamic Plot Twist Injector
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                HUMAN-IN-THE-LOOP
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Steer narrative generation beat-by-beat, inject custom plot twists, and dynamically re-index downstream platform engines.
            </p>
          </div>
        </div>

        {statusFeedback && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusFeedback}</span>
          </div>
        )}
      </div>

      {/* Visual 15-Beat Interactive Narrative Timeline */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Blake Snyder 15-Beat Structural Narrative Arc
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Current: Beat #{activeBeatIndex} ({currentBeat.act}) • {beats.filter((b) => b.status === 'DIRECTOR_APPROVED').length}/15 Approved
          </span>
        </div>

        {/* 15 Beat Grid Chips */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-15 gap-1.5">
          {beats.map((b) => {
            const isCurrent = b.beatIndex === activeBeatIndex;
            return (
              <button
                key={b.beat}
                onClick={() => setActiveBeatIndex(b.beatIndex)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between h-20 ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-950/30 text-amber-200'
                    : b.status === 'DIRECTOR_APPROVED'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : b.status === 'DRAFTED'
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-300'
                    : 'bg-neutral-950 border-neutral-800/80 text-neutral-500'
                }`}
              >
                <div className="text-[9px] font-mono font-bold flex items-center justify-between">
                  <span>#{b.beatIndex}</span>
                  {b.status === 'DIRECTOR_APPROVED' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : b.interventions.length > 0 ? (
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  ) : null}
                </div>
                <div className="text-[10px] font-semibold font-mono leading-tight line-clamp-2 mt-1">
                  {b.title.split('/')[0]}
                </div>
                <div className="text-[8px] font-mono uppercase text-neutral-400 truncate mt-auto">
                  {b.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Left Script Draft vs Right Director's Chair Intervention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Active Scene Reader & Engine Telemetry (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  BEAT #{activeBeatIndex} ({currentBeat.act})
                </span>
                <span className="text-xs font-mono font-bold text-neutral-200">
                  {currentBeat.title}
                </span>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  currentBeat.status === 'DIRECTOR_APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {currentBeat.status}
              </span>
            </div>

            {/* Downstream Impacts Notice */}
            {currentBeat.downstreamImpacts.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-300 space-y-1 mt-3">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Director Intervention Downstream Ripple:</span>
                </div>
                {currentBeat.downstreamImpacts.map((imp, idx) => (
                  <div key={idx} className="pl-5 text-neutral-300">
                    • {imp}
                  </div>
                ))}
              </div>
            )}

            {/* Formatted Script Element View */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3 font-mono text-xs text-neutral-200 mt-3 max-h-[380px] overflow-y-auto leading-relaxed">
              {activeScene ? (
                activeScene.elements.map((el, idx) => {
                  if (el.type === 'SCENE_HEADING') {
                    return (
                      <div key={idx} className="text-amber-400 font-bold text-sm pt-2">
                        {el.text}
                      </div>
                    );
                  }
                  if (el.type === 'ACTION_LINE') {
                    return (
                      <div key={idx} className="text-neutral-300 pl-2 border-l border-neutral-800">
                        {el.text}
                      </div>
                    );
                  }
                  if (el.type === 'ENGINE_DIRECTIVE') {
                    return (
                      <div key={idx} className="p-2 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-cyan-300 font-semibold">
                        {el.text}
                      </div>
                    );
                  }
                  if (el.type === 'CHARACTER_CUE') {
                    return (
                      <div key={idx} className="text-amber-300 font-bold pl-12 pt-1 uppercase">
                        {el.text}
                      </div>
                    );
                  }
                  if (el.type === 'PARENTHETICAL') {
                    return (
                      <div key={idx} className="text-neutral-500 italic pl-10">
                        {el.text}
                      </div>
                    );
                  }
                  if (el.type === 'DIALOGUE') {
                    return (
                      <div key={idx} className="text-neutral-100 pl-8 pr-4">
                        {el.text}
                      </div>
                    );
                  }
                  if (el.type === 'TRANSITION') {
                    return (
                      <div key={idx} className="text-right text-neutral-500 text-[11px] font-bold">
                        {el.text}
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <div className="text-neutral-500 italic p-6 text-center">
                  Beat #{activeBeatIndex} pending generation. Direct and inject below.
                </div>
              )}
            </div>

            {/* Extracted Platform Telemetry Badges */}
            {activeScene && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[10px] font-mono">
                <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block">Camera Rig:</span>
                  <span className="text-amber-300 font-bold">{activeScene.engineParameters.camera.focalLength} Anamorphic</span>
                </div>
                <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block">DMX Lighting:</span>
                  <span className="text-amber-300 font-bold">{activeScene.engineParameters.lighting.kelvin}K ({activeScene.engineParameters.lighting.flickerPattern})</span>
                </div>
                <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block">Wardrobe / Brand:</span>
                  <span className="text-emerald-300 font-bold">{activeScene.engineParameters.wardrobeLifestyle.brandLabel}</span>
                </div>
                <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block">Audio Tension:</span>
                  <span className="text-rose-400 font-bold">{activeScene.engineParameters.audioAcoustics.tensionScore} / 100</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Approval Gate Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <span className="text-[11px] font-mono text-neutral-400">
              Steerable Gate: Verify scene parameters before committing to render
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApproveBeat}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Beat & Proceed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: "Director's Chair" Intervention Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
                Director's Chair: Plot Twist & Steering
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">Target: Beat #{activeBeatIndex}</span>
          </div>

          {/* Quick-Inject Plot Twist Presets */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-300 font-semibold block">
              Blockbuster Plot Twist Catalog:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLOT_TWIST_CATALOG.map((twist) => {
                const isSelected = selectedTwist === twist.id;
                return (
                  <button
                    key={twist.id}
                    onClick={() => setSelectedTwist(isSelected ? '' : twist.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-mono font-bold text-neutral-200 line-clamp-1">{twist.title}</div>
                    <div className="text-[10px] text-neutral-400 mt-1 line-clamp-2 leading-tight">
                      {twist.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Freeform Director Directive */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-300 font-semibold block">
              Custom Director Directive (Freeform Prompt):
            </span>
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., 'The villain hijacks the Mercedes with an EMP,' or 'Elena discovers the courier chip contains her own genetic sequence.'"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Pacing & Tension Sliders */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Scene Tension</span>
                <span className="text-amber-400 font-bold">{tensionSlider}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={tensionSlider}
                onChange={(e) => setTensionSlider(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Action Density</span>
                <span className="text-rose-400 font-bold">{spectacleSlider}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={spectacleSlider}
                onChange={(e) => setSpectacleSlider(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Tone Shift Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-neutral-500 block w-full">Quick Escalation Triggers:</span>
            {[
              { label: 'EMP Blackout', prompt: 'EMP blast detonates, plunging scene into pitch black and disabling cyber optics' },
              { label: 'Air Support Inbound', prompt: 'Two tactical gunships burst through clouds, strafing high-caliber rounds' },
              { label: 'Force Impossible Dilemma', prompt: 'Elena must choose between securing the biometric drive or saving her partner' },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyIntervention(btn.prompt)}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 text-[10px] font-mono text-neutral-300 transition-colors cursor-pointer"
              >
                + {btn.label}
              </button>
            ))}
          </div>

          {/* Apply Button */}
          <button
            onClick={() => handleApplyIntervention()}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Inject Twist & Re-Align Beat #{activeBeatIndex}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
