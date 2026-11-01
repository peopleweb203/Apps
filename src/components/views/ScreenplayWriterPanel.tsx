import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  ScreenplayScope,
  ScreenplayGenre,
  GeneratedScreenplay,
  ScreenplayScene,
  generateHollywoodScreenplay,
  compileScreenplayToProductionShots,
  formatToFountainScript,
} from '../../utils/hollywood-screenplay-orchestrator';
import { ScreenplayDirectorCopilotPanel } from './ScreenplayDirectorCopilotPanel';
import { ScreenplayIOWritersRoomPanel } from './ScreenplayIOWritersRoomPanel';
import {
  FileText,
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Settings,
  Bot,
  Upload,
  Download,
  Code,
  CheckCircle2,
  Sliders,
  Send,
  Eye,
  Camera,
  Flame,
  Volume2,
  Crown,
} from 'lucide-react';

export const ScreenplayWriterPanel: React.FC = () => {
  const { characters, sets, updateScenes } = useStudio();

  const [scope, setScope] = useState<ScreenplayScope>('FULL_SCREENPLAY');
  const [genre, setGenre] = useState<ScreenplayGenre>('SCIFI_CYBER_EPIC');
  const [leadCharId, setLeadCharId] = useState<string>(characters[0]?.id || 'char-elena');
  const [antagCharId, setAntagCharId] = useState<string>(characters[1]?.id || 'char-chen');
  const [title, setTitle] = useState<string>('PROTOCOL OMEGA: THE ROGUE ENCLAVE');

  // Active Screenplay State
  const [screenplay, setScreenplay] = useState<GeneratedScreenplay>(() =>
    generateHollywoodScreenplay(
      {
        title: 'PROTOCOL OMEGA: THE ROGUE ENCLAVE',
        genre: 'SCIFI_CYBER_EPIC',
        scope: 'FULL_SCREENPLAY',
        leadCharacterId: characters[0]?.id || 'char-elena',
        antagonistCharacterId: characters[1]?.id || 'char-chen',
        selectedSetIds: sets.map((s) => s.id),
      },
      characters,
      sets
    )
  );

  const [activeTab, setActiveTab] = useState<'copilot' | 'dual-reader' | 'writers-room'>('copilot');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [convertedNotice, setConvertedNotice] = useState<boolean>(false);

  const activeScene = screenplay.scenes[selectedSceneIndex] || screenplay.scenes[0];

  // Re-generate Screenplay from scratch
  const handleRegenerate = () => {
    const generated = generateHollywoodScreenplay(
      {
        title,
        genre,
        scope,
        leadCharacterId: leadCharId,
        antagonistCharacterId: antagCharId,
        selectedSetIds: sets.map((s) => s.id),
      },
      characters,
      sets
    );
    setScreenplay(generated);
  };

  // Convert Script directly into CineForge Production Pipeline
  const handleConvertScriptToProduction = () => {
    const compiledShots = compileScreenplayToProductionShots(screenplay);

    // Group compiled shots by scene
    const newScenes = screenplay.scenes.map((scene, idx) => ({
      id: scene.id,
      sceneNumber: idx + 1,
      title: scene.heading,
      locationId: scene.locationId || sets[0]?.id || 'set-alley',
      timeOfDay: scene.timeOfDay === 'NIGHT' ? ('NIGHT' as const) : ('DAY' as const),
      lightingKelvin: scene.engineParameters.lighting.kelvin,
      atmosphere: scene.engineParameters.lighting.atmosphere,
      screenplayNotes: scene.summary,
      shots: compiledShots.filter((s) => s.sceneId === scene.id),
    }));

    if (updateScenes) {
      updateScenes(newScenes);
    }

    setConvertedNotice(true);
    setTimeout(() => setConvertedNotice(false), 3500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950/60 p-5 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono tracking-tight text-neutral-100 flex items-center gap-2">
              Automated Hollywood Blockbuster Screenplay & Engine-Orchestrator
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                3-ACT / 15-BEATS
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Generates production-ready Hollywood scripts with automated multi-cam, stunt physics, spatial audio, and DMX lighting directives.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Writers Room & I/O Switcher */}
          <button
            onClick={() => setActiveTab(activeTab === 'writers-room' ? 'copilot' : 'writers-room')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'writers-room'
                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>Consult Writers Room / I/O</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'copilot'
                  ? 'bg-amber-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Director Co-Pilot
            </button>
            <button
              onClick={() => setActiveTab('dual-reader')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'dual-reader'
                  ? 'bg-amber-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Dual-View Inspector
            </button>
          </div>

          {/* Master Convert to Production Action */}
          <button
            onClick={handleConvertScriptToProduction}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer shadow-lg shadow-amber-950/20"
          >
            {convertedNotice ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{convertedNotice ? 'Pipelined into Shot List!' : 'Convert Script to Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Generation Setup Configuration Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Title & Logline */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block font-semibold">
            Project Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Genre Engine */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block font-semibold">
            Genre Engine
          </span>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as ScreenplayGenre)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="SCIFI_CYBER_EPIC">Sci-Fi Cyber Epic</option>
            <option value="BLOCKBUSTER_ACTION">Blockbuster Action Spectacle</option>
            <option value="HIGH_END_THRILLER">High-End Corporate Thriller</option>
            <option value="SUPERHERO_SPECTACLE">Superhero God-Tier Feats</option>
            <option value="FANTASY_ADVENTURE">Fantasy / Theatrical Adventure</option>
          </select>
        </div>

        {/* Scope / Length */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block font-semibold">
            Script Scope
          </span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as ScreenplayScope)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="FULL_SCREENPLAY">Full 15-Beat Screenplay</option>
            <option value="SCENE_BREAKDOWN">5-Scene Major Anchor Breakdown</option>
            <option value="BEAT_TREATMENT">5-Beat Act I Treatment</option>
            <option value="LOGLINE">Logline & Opening Hook</option>
          </select>
        </div>

        {/* Cast Assignment & Trigger */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block font-semibold">
              Lead Hero
            </span>
            <select
              value={leadCharId}
              onChange={(e) => setLeadCharId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRegenerate}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-xs border border-neutral-700 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TAB 1: DEFAULT WORKFLOW - INTERACTIVE DIRECTOR CO-PILOT */}
      {activeTab === 'copilot' && (
        <ScreenplayDirectorCopilotPanel
          onConvertAllToProduction={handleConvertScriptToProduction}
        />
      )}

      {/* TAB 2: DUAL-VIEW FORMATTED SCRIPT + REAL-TIME JSON ENGINE PAYLOAD INSPECTOR */}
      {activeTab === 'dual-reader' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
          {/* Left: Formatted Script Reader (7 cols) */}
          <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
                  Formatted Screenplay View ({screenplay.scenes.length} Scenes)
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  Est. Runtime: {screenplay.totalRuntimeEstMinutes} Mins
                </span>
              </div>

              {/* Scene Navigator Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {screenplay.scenes.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSceneIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                      selectedSceneIndex === idx
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    Scene {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Scene Script Content */}
              {activeScene && (
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3 font-mono text-xs text-neutral-300 max-h-[460px] overflow-y-auto leading-relaxed">
                  {activeScene.elements.map((el, idx) => {
                    if (el.type === 'SCENE_HEADING') {
                      return (
                        <div key={idx} className="text-amber-400 font-bold text-sm pt-2">
                          {el.text}
                        </div>
                      );
                    }
                    if (el.type === 'ACTION_LINE') {
                      return <div key={idx} className="text-neutral-300 pl-2">{el.text}</div>;
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
                        <div key={idx} className="text-amber-300 font-bold pl-12 pt-2 uppercase">
                          {el.text}
                        </div>
                      );
                    }
                    if (el.type === 'PARENTHETICAL') {
                      return <div key={idx} className="text-neutral-500 italic pl-10">{el.text}</div>;
                    }
                    if (el.type === 'DIALOGUE') {
                      return <div key={idx} className="text-neutral-100 pl-8 pr-4">{el.text}</div>;
                    }
                    if (el.type === 'TRANSITION') {
                      return <div key={idx} className="text-right text-neutral-500 text-[11px] font-bold">{el.text}</div>;
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Real-Time JSON Engine Payload Inspector (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
                  Engine Parameters Payload Inspector
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">Scene #{selectedSceneIndex + 1}</span>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 space-y-3 max-h-[460px] overflow-y-auto">
              <div>
                <span className="text-neutral-500 block uppercase text-[10px]">Camera Rig & Optics:</span>
                <pre className="text-amber-300 text-[10px] mt-0.5">
                  {JSON.stringify(activeScene?.engineParameters.camera, null, 2)}
                </pre>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <span className="text-neutral-500 block uppercase text-[10px]">DMX Lighting & Atmosphere:</span>
                <pre className="text-amber-300 text-[10px] mt-0.5">
                  {JSON.stringify(activeScene?.engineParameters.lighting, null, 2)}
                </pre>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <span className="text-neutral-500 block uppercase text-[10px]">Wardrobe & Wealth Stratum:</span>
                <pre className="text-emerald-300 text-[10px] mt-0.5">
                  {JSON.stringify(activeScene?.engineParameters.wardrobeLifestyle, null, 2)}
                </pre>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <span className="text-neutral-500 block uppercase text-[10px]">VFX Stunt & Physics:</span>
                <pre className="text-rose-300 text-[10px] mt-0.5">
                  {JSON.stringify(activeScene?.engineParameters.vfxStunt, null, 2)}
                </pre>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <span className="text-neutral-500 block uppercase text-[10px]">Spatial Audio & Score:</span>
                <pre className="text-cyan-300 text-[10px] mt-0.5">
                  {JSON.stringify(activeScene?.engineParameters.audioAcoustics, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WRITERS ROOM & SCRIPT I/O */}
      {activeTab === 'writers-room' && (
        <ScreenplayIOWritersRoomPanel
          activeScreenplay={screenplay}
          onUpdateScreenplay={(up) => setScreenplay(up)}
          onClose={() => setActiveTab('copilot')}
        />
      )}
    </div>
  );
};
