import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  OrchestralGenre,
  GENRE_PRESETS_MAP,
  INITIAL_LEITMOTIFS,
  INITIAL_TENSION_CUES,
  TensionKeyframeCue,
  CharacterLeitmotif,
  calculateDynamicStemLevels,
  buildOrchestralScorePayload,
} from '../../utils/orchestral-score-engine';
import {
  Music,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  Play,
  RotateCcw,
  Volume2,
  Users,
  Radio,
} from 'lucide-react';

export const OrchestralScorePanel: React.FC = () => {
  const { characters, selectedShot } = useStudio();

  const [genre, setGenre] = useState<OrchestralGenre>('scifi_noir_vangelis');
  const [tensionCues, setTensionCues] = useState<TensionKeyframeCue[]>(INITIAL_TENSION_CUES);
  const [leitmotifs, setLeitmotifs] = useState<CharacterLeitmotif[]>(INITIAL_LEITMOTIFS);
  const [isDialoguePlaying, setIsDialoguePlaying] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedPreset = GENRE_PRESETS_MAP[genre];
  const maxTension = Math.max(...tensionCues.map((c) => c.tensionScore));
  const stems = calculateDynamicStemLevels(maxTension, isDialoguePlaying, genre);
  const payload = buildOrchestralScorePayload(genre, tensionCues, leitmotifs);

  const handleToggleLeitmotif = (charId: string) => {
    setLeitmotifs((prev) =>
      prev.map((m) => (m.characterId === charId ? { ...m, activeInScene: !m.activeInScene } : m))
    );
  };

  const handleUpdateTension = (index: number, newScore: number) => {
    setTensionCues((prev) =>
      prev.map((cue, i) => (i === index ? { ...cue, tensionScore: newScore } : cue))
    );
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(payload.scorePromptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Automated Multi-Genre Orchestral Score & Leitmotif Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                DYNAMIC ADAPTIVE STEMS
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Narrative tension curve mapping, character leitmotif injection, and stem-separated auto-ducking
            </p>
          </div>
        </div>

        {/* Dialogue Ducking Toggle */}
        <button
          onClick={() => setIsDialoguePlaying(!isDialoguePlaying)}
          data-testid="score-ducking-toggle"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer shadow ${
            isDialoguePlaying
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-500/20'
              : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-neutral-200'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>DIALOGUE AUTO-DUCKING</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${isDialoguePlaying ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
            {isDialoguePlaying ? '-4.5 dB APPLIED' : 'BYPASSED'}
          </span>
        </button>
      </div>

      {/* Orchestral Genre Archetypes */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
          Select Genre Orchestration Archetype:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(Object.keys(GENRE_PRESETS_MAP) as OrchestralGenre[]).map((gKey) => {
            const p = GENRE_PRESETS_MAP[gKey];
            const isSelected = genre === gKey;

            return (
              <button
                key={gKey}
                onClick={() => setGenre(gKey)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-200 shadow-lg ring-1 ring-amber-500/40'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="truncate">{p.name.split('(')[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 block mt-0.5">
                    {p.signatureComposerVibe}
                  </span>
                </div>
                <div className="text-[10px] font-sans text-neutral-300 line-clamp-2">
                  {p.primaryInstrumentation}
                </div>
                <div className="text-[9px] font-mono text-amber-400 pt-1 border-t border-neutral-800">
                  BPM: {p.tempoBpmRange[0]}-{p.tempoBpmRange[1]} • Sub-Bass {p.subBassWeightPercent}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tension Curve Visualizer & Stem Mixer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tension Curve Editor */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Scene Narrative Tension Curve</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">PEAK: {maxTension}/100</span>
          </div>

          {/* Visual Tension Curve Graph */}
          <div className="h-32 bg-neutral-950 rounded-xl border border-neutral-800 p-3 relative flex items-end justify-between gap-3">
            {tensionCues.map((cue, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] font-mono text-neutral-400 mb-1 group-hover:text-amber-300">
                  {cue.tensionScore}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-300"
                  style={{ height: `${cue.tensionScore}%` }}
                />
                <span className="text-[8px] font-mono text-neutral-500 mt-1 truncate max-w-full">
                  {cue.timeSec}s
                </span>
              </div>
            ))}
          </div>

          {/* Sliders for Each Cue */}
          <div className="space-y-2">
            {tensionCues.map((cue, i) => (
              <div key={i} className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 text-xs font-mono">
                <span className="text-amber-400 font-bold shrink-0">@{cue.timeSec}s</span>
                <span className="text-neutral-300 truncate text-[11px] font-sans flex-1">{cue.description}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={cue.tensionScore}
                    onChange={(e) => handleUpdateTension(i, parseInt(e.target.value, 10))}
                    aria-label={`Tension at ${cue.timeSec}s`}
                    className="w-20 accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <span className="w-6 text-right font-bold text-neutral-200">{cue.tensionScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stem Mixer Controls */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Orchestral Stems Dynamic Output</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">4 STEM CHANNELS</span>
          </div>

          <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs font-mono">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-400">Symphonic Strings:</span>
                <span className="text-amber-400 font-bold">{stems.stringsLevelPercent}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${stems.stringsLevelPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-400">Brass & Woodwinds:</span>
                <span className="text-amber-400 font-bold">{stems.brassWoodwindsPercent}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400" style={{ width: `${stems.brassWoodwindsPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-400">Percussion & Taiko:</span>
                <span className="text-rose-400 font-bold">{stems.percussionTaikoPercent}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400" style={{ width: `${stems.percussionTaikoPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-400">Synthesizers & Sub-Bass:</span>
                <span className="text-cyan-400 font-bold">{stems.synthsSubBassPercent}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${stems.synthsSubBassPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Character Leitmotif Vault Matrix */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider block">
              Character Leitmotif Vault Binding:
            </span>
            <div className="space-y-2">
              {leitmotifs.map((motif) => (
                <div
                  key={motif.characterId}
                  onClick={() => handleToggleLeitmotif(motif.characterId)}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                    motif.activeInScene
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{motif.characterName}</span>
                      <span className="text-[10px] text-neutral-400">"{motif.themeTitle}"</span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 block mt-0.5">
                      {motif.leadInstrument} • {motif.keySignature}
                    </span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${motif.activeInScene ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-500'}`}>
                    {motif.activeInScene ? 'ACTIVE' : 'MUTED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compiled Score Payload Card */}
      <div className="bg-neutral-900/60 p-5 rounded-2xl border border-amber-500/40 space-y-3 shadow-lg shadow-amber-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider">
              Compiled Multi-Genre Orchestral Score & Leitmotif Tag
            </h4>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED SCORE TAG' : 'COPY SCORE TAG'}</span>
          </button>
        </div>

        <p className="text-xs text-amber-200/90 font-mono leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-amber-500/30">
          {payload.scorePromptTag}
        </p>
      </div>
    </div>
  );
};
