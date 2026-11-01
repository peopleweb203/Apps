import React, { useMemo } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  calculateScriptMetrics,
  calculateCharacterUsage,
  calculateProductionCompute,
  calculateLensDistribution,
} from '../../utils/analytics-math';
import { formatTimecode } from '../../utils/timeline-engine';
import {
  BarChart3,
  Cpu,
  FileText,
  Users,
  Clock,
  Sparkles,
  Zap,
  DollarSign,
  TrendingUp,
  Camera,
  Activity,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const ProductionAnalyticsView: React.FC = () => {
  const {
    scenes,
    characters,
    renderTasks,
    projectTitle,
    setActiveTab,
  } = useStudio();

  const allShots = useMemo(() => scenes.flatMap((s) => s.shots), [scenes]);

  // Aggregate screenplay script text
  const fullScriptText = useMemo(() => {
    return scenes
      .map((s) => {
        const shotDescriptions = s.shots.map((sh) => `${sh.cameraAction}. ${sh.dialogue ? `"${sh.dialogue}"` : ''}`).join(' ');
        return `${s.title}\n${s.screenplayNotes}\n${shotDescriptions}`;
      })
      .join('\n\n');
  }, [scenes]);

  const scriptMetrics = useMemo(() => {
    return calculateScriptMetrics(fullScriptText, scenes);
  }, [fullScriptText, scenes]);

  const characterUsage = useMemo(() => {
    return calculateCharacterUsage(scenes, characters);
  }, [scenes, characters]);

  const computeMetrics = useMemo(() => {
    return calculateProductionCompute(allShots, renderTasks);
  }, [allShots, renderTasks]);

  const lensDistribution = useMemo(() => {
    return calculateLensDistribution(allShots);
  }, [allShots]);

  // Total lines of dialogue across all characters
  const totalDialogueLines = characterUsage.reduce((acc, c) => acc + c.linesCount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-neutral-950/40 p-6 space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Production Analytics Dashboard
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                REAL-TIME TELEMETRY
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Live metrics across script composition, character dialogue distribution, and Stage 1 & 2 GPU compute time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('keyframe-staging')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors"
          >
            <span>Stage 1 Stills</span>
          </button>
          <button
            onClick={() => setActiveTab('motion-performance')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors"
          >
            <span>Stage 2 Motion</span>
          </button>
          <button
            onClick={() => setActiveTab('youtube-publisher')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>YouTube 4K Suite</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Hero Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Metric 1: Total Render Time */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono font-semibold uppercase">Total Render Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {formatTimecode(computeMetrics.totalGpuComputeTimeSec)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Video Runtime: {formatTimecode(computeMetrics.totalRuntimeSec)}</span>
            <span className="text-emerald-400 font-mono font-semibold">
              {computeMetrics.completedTasksCount} Tasks Done
            </span>
          </div>
        </div>

        {/* Metric 2: Script Word Count */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono font-semibold uppercase">Script Word Count</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {scriptMetrics.totalWords}{' '}
            <span className="text-xs font-normal text-neutral-500 font-sans">words</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Dialogue: {scriptMetrics.dialogueWords} words</span>
            <span className="text-cyan-400 font-mono font-semibold">
              {scriptMetrics.dialogueRatio}% Spoken
            </span>
          </div>
        </div>

        {/* Metric 3: Active Characters */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono font-semibold uppercase">Casting Roster</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {characters.length}{' '}
            <span className="text-xs font-normal text-neutral-500 font-sans">Actors</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>{totalDialogueLines} Dialogue Lines</span>
            <span className="text-purple-400 font-mono font-semibold">
              {allShots.length} Total Shots
            </span>
          </div>
        </div>

        {/* Metric 4: Two-Stage Cost Savings */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono font-semibold uppercase">2-Stage Savings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${computeMetrics.twoStageCostSavingsUsd}
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Eliminated Video Flops</span>
            <span className="text-emerald-400 font-mono font-semibold">5.2x Efficiency</span>
          </div>
        </div>
      </div>

      {/* Row 2: Character Usage Frequency & Script Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Character Usage Frequency Table & Bars */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 font-mono">
                Character Usage & Dialogue Frequency
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Voice ID Tracked
            </span>
          </div>

          <div className="space-y-3.5">
            {characterUsage.map((char) => (
              <div
                key={char.characterId}
                className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-neutral-100">{char.name}</span>
                    <span className="text-[10px] text-amber-400 ml-2 font-mono">({char.role})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-neutral-400">{char.linesCount} lines</span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-cyan-400 font-bold">{char.spokenWords} words</span>
                  </div>
                </div>

                {/* Visual Dialogue Percentage Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>Dialogue Share</span>
                    <span className="text-neutral-300">{char.dialoguePercentage}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      style={{ width: `${Math.max(4, char.dialoguePercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                  <span>Screen Presence: {char.screenTimeSec}s</span>
                  <span className="text-emerald-400">180° Axis Tagged</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Screenplay Architecture & Lens Breakdown */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 font-mono">
                Script Architecture & Pacing
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              ~{scriptMetrics.estimatedReadingTimeSec}s Read Time
            </span>
          </div>

          {/* Dialogue vs Action Ratio Bar */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">
                Spoken Dialogue: {scriptMetrics.dialogueWords} words ({scriptMetrics.dialogueRatio}%)
              </span>
              <span className="text-neutral-400">
                Action / Staging: {scriptMetrics.actionWords} words (
                {100 - scriptMetrics.dialogueRatio}%)
              </span>
            </div>

            <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${scriptMetrics.dialogueRatio}%` }}
                title="Dialogue Words"
              />
              <div
                className="h-full bg-neutral-700 transition-all"
                style={{ width: `${100 - scriptMetrics.dialogueRatio}%` }}
                title="Action & Staging Words"
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>Fast-Paced Cinematic Dialogue</span>
              <span>Visual Staging Description</span>
            </div>
          </div>

          {/* Focal Length Lens Distribution */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-neutral-200">
                  Focal Length Distribution ({allShots.length} Shots)
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                Cinematic Balance
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {lensDistribution.map((item) => (
                <div
                  key={item.lens}
                  className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-center space-y-1"
                >
                  <div className="text-xs font-bold font-mono text-amber-300">
                    {item.lens}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {item.count} shot{item.count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-[9px] font-mono text-emerald-400 font-semibold">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality & Pipeline Health */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Two-Stage Integrity Gate: ACTIVE</span>
            </div>
            <span className="text-neutral-400">
              {computeMetrics.stagedStillsApproved} Approved Stills
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
