import React, { useMemo, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  FileText,
  Sparkles,
  Clapperboard,
  Camera,
  ArrowRight,
  Thermometer,
  CloudRain,
  MessageSquare,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Clock,
  UserCheck,
  MapPin,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';
import { ScreenplayWriterPanel } from './ScreenplayWriterPanel';
import {
  analyzeScriptContinuity,
  applyAllContinuityAutoFixes,
  applyContinuityAutoFix,
  ContinuityIssueCategory,
  ScriptContinuityIssue,
} from '../../utils/script-continuity-checker';

const DEFAULT_SCREENPLAY_TEXT = `EXT. SECTOR 4 NEON ALLEYWAY - NIGHT

Torrential downpour. Heavy rain slams against wet asphalt, reflecting gargantuan neon advertisements overhead.

ELENA CROSS (28), clad in a weather-sealed matte duster, clutches a silver neural transport case against her chest. Her left ocular implant pulses amber.

She stops. Standing under the amber flicker of a broken noodle bar sign is DIRECTOR CHEN (54), hands clasped behind his graphite coat.

DIRECTOR CHEN
You were never supposed to open that transport case, Elena.

Elena steps forward, rainwater cascading from her cowl.

ELENA CROSS
Then you shouldn't have hired someone with a conscience.

DIRECTOR CHEN
Conscience is a luxury you cannot afford in Sector 4.

Chen's bodyguards cock heavy kinetic rifles from the shadows.

INT. INDUSTRIAL DISPATCH STATION - MOMENTS LATER

Elena crashes through the airlock doors into the cavernous server core. Amber telemetry lights strobe frantically.

ELENA CROSS
(into collar comms)
Kael, bypass the biometric lockdown! Now!

KAELEN VANCE (V.O.)
Firewall is decaying! Three seconds, Elena! Jack out before your cortex gets fried!`;

const DRIFT_SAMPLE_SCREENPLAY_TEXT = `EXT. SECTOR 4 NEON ALLEYWAY - NIGHT

Torrential downpour. Heavy rain slams against wet asphalt, reflecting gargantuan neon advertisements overhead.

ELENA CROSS (28), clad in a weather-sealed matte duster, clutches a silver neural transport case against her chest. Her left ocular implant pulses amber.

She stops. Standing under the amber flicker of a broken noodle bar sign is DIRECTOR CHEN (54), hands clasped behind his graphite coat.

DIRECTOR CHEN
You were never supposed to open that transport case, Elena.

Elena steps forward, rainwater cascading from her cowl.

ELENA CROSS
Then you shouldn't have hired someone with a conscience.

INT. INDUSTRIAL DISPATCH STATION - MOMENTS LATER - DAY

Moments later, ELENA CROSS (34) crashes through the airlock doors into the cavernous server core. Amber telemetry lights strobe frantically.

ELINA CROSS
(into collar comms)
Kael, bypass the biometric lockdown! Now!

KAEL (V.O.)
Firewall is decaying! Three seconds, Elena! Jack out before your cortex gets fried!`;

export const WritersRoomView: React.FC = () => {
  const {
    scenes,
    characters,
    selectedShotId,
    setSelectedShotId,
    setActiveTab,
    runScriptBreakdown,
    isBreakingDownScript,
  } = useStudio();

  const [screenplayText, setScreenplayText] = useState<string>(DEFAULT_SCREENPLAY_TEXT);
  const [genre, setGenre] = useState<string>('Cyberpunk Sci-Fi Neo-Noir');
  const [viewMode, setViewMode] = useState<'hollywood-orchestrator' | 'shot-breakdown'>('shot-breakdown');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | ContinuityIssueCategory>('all');
  const [showContinuityDrawer, setShowContinuityDrawer] = useState<boolean>(true);

  // Real-time Script Continuity evaluation as the user types
  const continuityReport = useMemo(
    () => analyzeScriptContinuity(screenplayText, characters),
    [screenplayText, characters]
  );

  const filteredIssues = useMemo(() => {
    if (selectedCategoryFilter === 'all') return continuityReport.issues;
    return continuityReport.issues.filter((issue) => issue.category === selectedCategoryFilter);
  }, [continuityReport.issues, selectedCategoryFilter]);

  const handleBreakdown = async () => {
    await runScriptBreakdown(screenplayText, genre);
  };

  const handleApplySingleFix = (issue: ScriptContinuityIssue) => {
    setScreenplayText((prev) => applyContinuityAutoFix(prev, issue));
  };

  const handleApplyAllFixes = () => {
    if (continuityReport.issues.length === 0) return;
    setScreenplayText((prev) => applyAllContinuityAutoFixes(prev, continuityReport.issues));
  };

  const handleSimulateContinuityAnomalies = () => {
    setViewMode('shot-breakdown');
    setShowContinuityDrawer(true);
    setScreenplayText(DRIFT_SAMPLE_SCREENPLAY_TEXT);
  };

  const getCategoryMeta = (category: ContinuityIssueCategory) => {
    switch (category) {
      case 'character-name-drift':
        return {
          label: 'NAME DRIFT',
          icon: UserCheck,
          badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'character-attribute-drift':
        return {
          label: 'AGE / ATTRIBUTE',
          icon: UserCheck,
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'timeline-jump':
        return {
          label: 'TIMELINE JUMP',
          icon: Clock,
          badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      case 'spatial-continuity':
        return {
          label: 'SPATIAL CONTINUITY',
          icon: MapPin,
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950/60">
      {/* Top Engine Navigation Switcher */}
      <div className="h-11 border-b border-neutral-800 px-5 flex items-center justify-between bg-neutral-950/90 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('shot-breakdown')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === 'shot-breakdown'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5 text-orange-400" />
            <span>LIVE SCRIPT &amp; CONTINUITY BREAKDOWN</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-normal">
              REAL-TIME GUARD
            </span>
          </button>

          <button
            onClick={() => setViewMode('hollywood-orchestrator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              viewMode === 'hollywood-orchestrator'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>HOLLYWOOD SCREENPLAY &amp; CO-PILOT ORCHESTRATOR</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
              15-BEAT NATIVE
            </span>
          </button>
        </div>

        {/* Real-Time Continuity Header Status Pill & Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateContinuityAnomalies}
            title="Inject sample character name drift and timeline jump to test real-time continuity detection"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono transition-colors cursor-pointer"
          >
            <FlaskConical className="w-3 h-3 text-amber-400" />
            <span>SIMULATE CONTINUITY DRIFT</span>
          </button>

          <button
            onClick={() => {
              setViewMode('shot-breakdown');
              setShowContinuityDrawer((prev) => !prev);
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono font-bold border transition-all cursor-pointer ${
              continuityReport.issues.length === 0
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : continuityReport.status === 'critical'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
            }`}
          >
            {continuityReport.issues.length === 0 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>
              SCRIPT CONTINUITY: {continuityReport.continuityScore}%
            </span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-950/70 text-[10px]">
              {continuityReport.issues.length === 0
                ? '0 ISSUES'
                : `${continuityReport.issues.length} FLAGGED`}
            </span>
          </button>
        </div>
      </div>

      {viewMode === 'hollywood-orchestrator' ? (
        <ScreenplayWriterPanel />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Screenplay Editor + Real-Time Script Continuity Checker */}
          <div className="w-7/12 border-r border-neutral-800 p-5 flex flex-col justify-between bg-neutral-950/40 overflow-y-auto">
            <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                    Screenplay &amp; Scene Script
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {continuityReport.segments.length} SCENE SEGMENTS
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400 font-medium">Genre:</span>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    aria-label="Screenplay Genre"
                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cyberpunk Sci-Fi Neo-Noir">Cyberpunk Sci-Fi Neo-Noir</option>
                    <option value="Psychological Thriller">Psychological Thriller</option>
                    <option value="High-Octane Cinematic Action">High-Octane Cinematic Action</option>
                    <option value="Dark Fantasy Epic">Dark Fantasy Epic</option>
                  </select>
                </div>
              </div>

              {/* Scene Segment Continuity Chain Bar */}
              <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800/90 shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 shrink-0">
                  Scene Flow:
                </span>
                {continuityReport.segments.map((seg, idx) => {
                  const segmentIssues = continuityReport.issues.filter(
                    (i) => i.segmentIndex === seg.segmentIndex
                  );
                  const hasCritical = segmentIssues.some((i) => i.severity === 'critical');
                  return (
                    <React.Fragment key={seg.segmentIndex}>
                      {idx > 0 && (
                        <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
                      )}
                      <div
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono shrink-0 ${
                          segmentIssues.length === 0
                            ? 'bg-neutral-950/90 border-neutral-800 text-neutral-300'
                            : hasCritical
                            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        }`}
                      >
                        <span className="font-bold text-amber-400">S{seg.segmentIndex}</span>
                        <span className="truncate max-w-[140px]">{seg.location}</span>
                        <span className="px-1 rounded bg-neutral-900 text-cyan-300">
                          {seg.resolvedTimeSlot}
                        </span>
                        {segmentIssues.length > 0 && (
                          <span className="px-1 rounded bg-rose-500/20 text-rose-300 font-bold">
                            !{segmentIssues.length}
                          </span>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              <textarea
                value={screenplayText}
                onChange={(e) => setScreenplayText(e.target.value)}
                aria-label="Screenplay Text"
                className="flex-1 min-h-[210px] w-full bg-neutral-900/80 border border-neutral-800 focus:border-amber-500/60 rounded-xl p-4 font-mono text-xs text-neutral-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                placeholder="INT. / EXT. SCENE DESCRIPTION..."
              />

              {/* Real-Time Script Continuity Checker Panel */}
              {showContinuityDrawer && (
                <div
                  data-testid="script-continuity-checker"
                  className="rounded-xl border border-neutral-800 bg-neutral-900/75 overflow-hidden shrink-0"
                >
                  <div className="px-3.5 py-2.5 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {continuityReport.issues.length === 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-100">
                        Real-Time Script Continuity Guard
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                          continuityReport.issues.length === 0
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {continuityReport.issues.length === 0
                          ? 'ALL SEGMENTS NOMINAL (100%)'
                          : `${continuityReport.issues.length} INCONSISTENC${
                              continuityReport.issues.length === 1 ? 'Y' : 'IES'
                            } DETECTED (${continuityReport.continuityScore}%)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(['all', 'character-name-drift', 'timeline-jump', 'character-attribute-drift'] as const).map(
                        (cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                              selectedCategoryFilter === cat
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                            }`}
                          >
                            {cat === 'all'
                              ? 'ALL'
                              : cat === 'character-name-drift'
                              ? 'NAME DRIFT'
                              : cat === 'timeline-jump'
                              ? 'TIMELINE'
                              : 'ATTRIBUTES'}
                          </button>
                        )
                      )}

                      {continuityReport.issues.length > 0 && (
                        <button
                          onClick={handleApplyAllFixes}
                          className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>AUTO-FIX ALL ({continuityReport.issues.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Continuity Body */}
                  <div className="p-3 max-h-48 overflow-y-auto space-y-2">
                    {filteredIssues.length === 0 ? (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-300">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            No character name changes, attribute drift, or timeline jumps detected across{' '}
                            <strong>{continuityReport.segments.length}</strong> scene segments.
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Tracked Cast:{' '}
                          {continuityReport.trackedCharacters
                            .map((c) => c.canonicalName)
                            .join(' • ')}
                        </span>
                      </div>
                    ) : (
                      filteredIssues.map((issue) => {
                        const meta = getCategoryMeta(issue.category);
                        const IconComponent = meta.icon;
                        return (
                          <div
                            key={issue.id}
                            className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold ${meta.badgeClass}`}
                                >
                                  <IconComponent className="w-2.5 h-2.5" />
                                  <span>{meta.label}</span>
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                                  Scene #{issue.segmentIndex} • Line {issue.lineNumber}
                                </span>
                                <span className="text-xs font-semibold text-neutral-100">
                                  {issue.title}
                                </span>
                              </div>

                              <p className="text-[11px] text-neutral-400 leading-snug">
                                {issue.description}
                              </p>

                              <div className="flex items-center gap-2 text-[10px] font-mono pt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 line-through">
                                  {issue.detectedValue}
                                </span>
                                <ArrowRight className="w-3 h-3 text-neutral-500" />
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                                  {issue.expectedValue}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleApplySingleFix(issue)}
                              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>{issue.autoFixLabel}</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-neutral-800 mt-3 shrink-0">
              <div className="text-[11px] text-neutral-500 font-mono">
                Live Continuity Guard • Character Drift • Temporal Paradox Check
              </div>

              <button
                onClick={handleBreakdown}
                disabled={isBreakingDownScript}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer font-mono"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isBreakingDownScript
                    ? 'ANALYZING WITH GEMINI 2.5...'
                    : 'BREAKDOWN SCRIPT TO SHOT LIST'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Structured Shot List */}
          <div className="w-5/12 p-5 flex flex-col overflow-y-auto bg-neutral-950/20 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                  Structured Shot Breakdown ({scenes.flatMap((s) => s.shots).length} Shots)
                </h2>
              </div>

              <button
                onClick={() => setActiveTab('keyframe-staging')}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
              >
                <span>Proceed to Keyframe Staging</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scene Cards */}
            <div className="space-y-6">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden shadow-lg"
                >
                  {/* Scene Header */}
                  <div className="bg-neutral-950/80 px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                          SCENE #{scene.sceneNumber}
                        </span>
                        <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-wide">
                          {scene.title}
                        </h3>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {scene.screenplayNotes}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                        <Thermometer className="w-3 h-3 text-orange-400" />
                        <span>{scene.lightingKelvin}K</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                        <CloudRain className="w-3 h-3 text-cyan-400" />
                        <span>{scene.timeOfDay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shots List */}
                  <div className="divide-y divide-neutral-800/60 p-2 space-y-2">
                    {scene.shots.map((shot) => {
                      const isSelected = selectedShotId === shot.id;

                      return (
                        <div
                          key={shot.id}
                          onClick={() => setSelectedShotId(shot.id)}
                          className={`p-3 rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-800/90 border border-amber-500/50 shadow-md'
                              : 'bg-neutral-950/40 hover:bg-neutral-800/40 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-400">
                                #{shot.shotNumber}
                              </span>
                              <span className="text-xs font-semibold text-neutral-200">
                                {shot.shotType}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                {shot.focalLength}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-neutral-400">
                              {shot.durationSec}s Runtime
                            </span>
                          </div>

                          <div className="flex items-start gap-2 text-xs text-neutral-300 mb-2">
                            <Camera className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                            <span className="text-neutral-400">{shot.cameraAction}</span>
                          </div>

                          {shot.dialogue && (
                            <div className="flex items-start gap-2 bg-neutral-900/80 p-2 rounded border border-neutral-800 text-xs text-neutral-300">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <div className="line-clamp-2 italic font-sans text-neutral-300">
                                "{shot.dialogue}"
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
