import React, { useState, useMemo } from 'react';
import { useStudio } from '../context/StudioContext';
import {
  calculateBatchQueueSummary,
  resolveStageLabelForProgress,
  DEFAULT_SCENE_THUMBNAIL,
  estimateBatchOutputSizeMb,
  RenderResolutionOption,
  RenderFormatOption,
} from '../utils/batch-render-queue';
import {
  X,
  Layers,
  CheckCircle2,
  Loader2,
  Clock,
  Film,
  Play,
  Plus,
  Trash2,
  Clapperboard,
  Zap,
  Eye,
  Sliders,
  BookmarkPlus,
  Check,
  HardDrive,
} from 'lucide-react';

const RESOLUTION_OPTIONS: RenderResolutionOption[] = [
  '5K Anamorphic (5120x2160)',
  '5K UHD Studio (5120x2880)',
  '4K DCI (4096x1716)',
  '4K UHD (3840x2160)',
  '2K QHD (2560x1440)',
  '1080p FHD (1920x1080)',
];

const FORMAT_OPTIONS: RenderFormatOption[] = [
  'MOV (ProRes 422 HQ)',
  'MP4 (H.265 / HEVC 10-Bit)',
  'MKV (AV1 Master)',
  'WEBM (VP9 Studio)',
];

export const RenderQueueDrawer: React.FC = () => {
  const {
    isRenderQueueOpen,
    setIsRenderQueueOpen,
    renderTasks,
    scenes,
    isBatchProcessing,
    processAllQueuedTasks,
    processSingleTask,
    queueAllScenesForRender,
    clearCompletedTasks,
    renderPresets,
    activeRenderPreset,
    loadRenderPreset,
    updateActivePresetConfig,
    saveCustomRenderPreset,
    deleteCustomRenderPreset,
  } = useStudio();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUEUED' | 'PROCESSING' | 'COMPLETED'>('ALL');
  const [isPresetsPanelOpen, setIsPresetsPanelOpen] = useState<boolean>(true);
  const [customPresetName, setCustomPresetName] = useState<string>('');
  const [justSavedFeedback, setJustSavedFeedback] = useState<string | null>(null);
  const [expandedSidecarTaskId, setExpandedSidecarTaskId] = useState<string | null>(null);
  const [copiedSidecarTaskId, setCopiedSidecarTaskId] = useState<string | null>(null);

  const summary = useMemo(() => calculateBatchQueueSummary(renderTasks), [renderTasks]);

  const queuedTasks = useMemo(
    () => renderTasks.filter((t) => t.status === 'QUEUED' || t.status === 'PROCESSING'),
    [renderTasks]
  );

  const estimatedSizeMb = useMemo(
    () => estimateBatchOutputSizeMb(renderTasks, activeRenderPreset),
    [renderTasks, activeRenderPreset]
  );

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'ALL') return renderTasks;
    return renderTasks.filter((t) => t.status === statusFilter);
  }, [renderTasks, statusFilter]);

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const label =
      customPresetName.trim() ||
      `${activeRenderPreset.resolution.split(' ')[0]} ${activeRenderPreset.bitrateMbps}Mbps`;
    const created = saveCustomRenderPreset(label);
    setCustomPresetName('');
    setJustSavedFeedback(created.name);
    setTimeout(() => setJustSavedFeedback(null), 2200);
  };

  if (!isRenderQueueOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/65 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-xl h-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="queue-drawer-title" className="text-sm font-bold text-neutral-100 font-mono">
                  BATCH RENDER &amp; COMPUTE QUEUE
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {summary.totalTasks} ITEMS
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Multi-Scene Batch Execution • Stage 1 Stills → Stage 2 Motion → 4K Master
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPresetsPanelOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                isPresetsPanelOpen
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-neutral-100'
              }`}
              title="Toggle Render Presets Configuration Panel"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Render Presets</span>
            </button>
            <button
              onClick={() => setIsRenderQueueOpen(false)}
              aria-label="Close render queue"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
          {/* Render Presets Configuration Panel */}
          {isPresetsPanelOpen && (
            <div
              data-testid="render-presets-panel"
              className="p-3.5 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    Render Presets Configuration
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                  <HardDrive className="w-3 h-3 text-cyan-400" />
                  <span>Est. Batch Output: ~{estimatedSizeMb} MB</span>
                </div>
              </div>

              {/* Saved & Built-in Preset Selector Pills */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-neutral-400">
                  Load Saved Preset ({renderPresets.length}):
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {renderPresets.map((preset) => {
                    const isSelected = activeRenderPreset.id === preset.id;
                    return (
                      <div key={preset.id} className="inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => loadRenderPreset(preset.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {preset.name}
                        </button>
                        {!preset.isBuiltIn && (
                          <button
                            type="button"
                            onClick={() => deleteCustomRenderPreset(preset.id)}
                            aria-label={`Delete preset ${preset.name}`}
                            className="ml-0.5 p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete custom preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution, Format & Bitrate Controls */}
              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1 block">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    Target Resolution
                  </span>
                  <select
                    aria-label="Target Resolution"
                    value={activeRenderPreset.resolution}
                    onChange={(e) =>
                      updateActivePresetConfig({
                        resolution: e.target.value as RenderResolutionOption,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500/50"
                  >
                    {RESOLUTION_OPTIONS.map((res) => (
                      <option key={res} value={res}>
                        {res}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    Container &amp; Codec Format
                  </span>
                  <select
                    aria-label="Container Format"
                    value={activeRenderPreset.format}
                    onChange={(e) =>
                      updateActivePresetConfig({
                        format: e.target.value as RenderFormatOption,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500/50"
                  >
                    {FORMAT_OPTIONS.map((fmt) => (
                      <option key={fmt} value={fmt}>
                        {fmt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Bitrate Slider + Numeric Readout */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-neutral-400 uppercase">Target Video Bitrate</span>
                  <span className="text-amber-300 font-bold">
                    {activeRenderPreset.bitrateMbps} Mbps ({activeRenderPreset.fps}fps •{' '}
                    {activeRenderPreset.aspectRatio})
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Target Video Bitrate"
                  min={10}
                  max={200}
                  step={5}
                  value={activeRenderPreset.bitrateMbps}
                  onChange={(e) =>
                    updateActivePresetConfig({
                      bitrateMbps: Number(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              {/* Save Current Settings as Custom Preset */}
              <form onSubmit={handleSavePreset} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder="Custom preset name (e.g. IMAX Archival 120M)..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold transition-all cursor-pointer shrink-0"
                >
                  {justSavedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Saved!</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save Preset</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Batch Overview & Master Progress Bar */}
          <div className="p-4 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">
                  Batch Pipeline Telemetry
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {summary.overallProgressPercent}% Overall
              </span>
            </div>

            {/* Active Export Spec Summary Pill */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono">
              <span className="text-neutral-400">Active Batch Profile:</span>
              <span className="text-cyan-300 font-semibold">
                {activeRenderPreset.resolution.split(' ')[0]} • {activeRenderPreset.bitrateMbps}Mbps •{' '}
                {activeRenderPreset.format.split(' ')[0]}
              </span>
            </div>

            {/* Master Batch Progress Bar */}
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  summary.isBatchComplete
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400'
                }`}
                style={{ width: `${summary.overallProgressPercent}%` }}
              />
            </div>

            {/* Summary Stat Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800/80">
                <div className="text-sm font-bold text-amber-300">{summary.queuedCount}</div>
                <div className="text-[9px] text-neutral-500 uppercase">Queued Scenes</div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800/80">
                <div className="text-sm font-bold text-orange-400">{summary.processingCount}</div>
                <div className="text-[9px] text-neutral-500 uppercase">Processing</div>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800/80">
                <div className="text-sm font-bold text-emerald-400">{summary.completedCount}</div>
                <div className="text-[9px] text-neutral-500 uppercase">Completed</div>
              </div>
            </div>

            {/* Visual Confirmation Strip for Queued Scenes prior to Process All */}
            {queuedTasks.length > 0 && (
              <div
                data-testid="batch-visual-confirmation-strip"
                className="p-2.5 rounded-lg bg-neutral-900/90 border border-amber-500/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 uppercase">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Visual Confirmation • Ready for Batch ({queuedTasks.length})</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400">
                    Keyframes Verified
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {queuedTasks.map((qt) => {
                    const previewSrc = qt.thumbnailUrl || DEFAULT_SCENE_THUMBNAIL;
                    return (
                      <div
                        key={`confirm-${qt.id}`}
                        className="group relative shrink-0 w-24 h-14 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950"
                        title={qt.title}
                      >
                        <img
                          src={previewSrc}
                          alt={qt.sceneTitle || qt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/75 border border-amber-500/40 text-[8px] font-mono font-bold text-amber-300">
                          {qt.sceneNumber !== undefined ? `SC #${qt.sceneNumber}` : qt.type}
                        </div>
                        {qt.shotCount !== undefined && (
                          <div className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[8px] font-mono text-neutral-200">
                            {qt.shotCount}sh
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1 right-1 truncate text-[8px] font-mono text-neutral-200">
                          {qt.sceneTitle || qt.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primary Batch Action Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={processAllQueuedTasks}
                disabled={isBatchProcessing || summary.queuedCount === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:pointer-events-none text-neutral-950 font-mono font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {isBatchProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PROCESSING BATCH ({summary.completedCount}/{summary.totalTasks})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>
                      Process All{summary.queuedCount > 0 ? ` (${summary.queuedCount} Queued)` : ''}
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={queueAllScenesForRender}
                disabled={isBatchProcessing}
                title="Queue all scenes from the active script for batch processing"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 border border-neutral-700 text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Queue All Scenes ({scenes.length})</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & Clear Completed */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="flex items-center gap-1">
              {(['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {summary.completedCount > 0 && (
              <button
                onClick={clearCompletedTasks}
                disabled={isBatchProcessing}
                className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-neutral-200 disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Completed</span>
              </button>
            )}
          </div>

          {/* Queued Scenes & Task Items List */}
          <div className="space-y-3 pb-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-neutral-800 text-neutral-500 text-xs space-y-2">
                <Clapperboard className="w-7 h-7 text-neutral-600 mx-auto" />
                <div>No render tasks match the current filter.</div>
                <button
                  onClick={queueAllScenesForRender}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold hover:bg-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enqueue Active Scenes ({scenes.length})</span>
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                const isRunning = task.status === 'PROCESSING';
                const isQueued = task.status === 'QUEUED';
                const activeStageText =
                  task.stageLabel || resolveStageLabelForProgress(task.progress, task.type);
                const previewUrl = task.thumbnailUrl || DEFAULT_SCENE_THUMBNAIL;
                const shotThumbs = task.shotThumbnails || [previewUrl];
                const taskRes = task.resolution || activeRenderPreset.resolution;
                const taskBitrate = task.bitrateMbps || activeRenderPreset.bitrateMbps;
                const taskFmt = task.exportFormat || activeRenderPreset.format;

                return (
                  <div
                    key={task.id}
                    data-testid={`render-queue-item-${task.id}`}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      isRunning
                        ? 'bg-neutral-950 border-amber-500/50 shadow-md shadow-amber-950/30'
                        : isDone
                        ? 'bg-neutral-950/70 border-neutral-800/80'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Top Metadata Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {task.sceneNumber !== undefined && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            SCENE #{task.sceneNumber}
                          </span>
                        )}
                        {task.shotCount !== undefined && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                            {task.shotCount} {task.shotCount === 1 ? 'SHOT' : 'SHOTS'}
                          </span>
                        )}
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-cyan-400 border border-neutral-800">
                          {taskRes.split(' ')[0]} • {taskBitrate}Mbps • {taskFmt.split(' ')[0]}
                        </span>
                      </div>

                      {/* Status Pill / Single Run Trigger */}
                      <div className="flex items-center gap-2">
                        {isQueued && !isBatchProcessing && (
                          <button
                            onClick={() => processSingleTask(task.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border border-neutral-700 hover:border-amber-500/40 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                            title="Process this scene item now"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Run</span>
                          </button>
                        )}

                        {isDone ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>100% READY</span>
                          </span>
                        ) : isRunning ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{task.progress}%</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>{task.progress}% QUEUED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scene Keyframe Thumbnail Preview + Title & Stage Description */}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 group">
                        <img
                          src={previewUrl}
                          alt={`Preview for ${task.title}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1 py-0.5 rounded bg-black/75 text-[8px] font-mono text-amber-300">
                          <Film className="w-2.5 h-2.5" />
                          <span>{isQueued ? 'PREVIEW' : isRunning ? 'RENDER' : 'MASTER'}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-xs font-semibold text-neutral-100 leading-snug line-clamp-2">
                          {task.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className={`truncate ${isRunning ? 'text-amber-300' : 'text-neutral-400'}`}>
                            {activeStageText}
                          </span>
                          <span className="text-neutral-500 shrink-0 ml-2">{task.startedAt}</span>
                        </div>

                        {/* Multi-Shot Keyframe Strip if Scene has multiple shots */}
                        {shotThumbs.length > 1 && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[8px] font-mono uppercase text-neutral-500">
                              Shot Strip:
                            </span>
                            <div className="flex items-center gap-1">
                              {shotThumbs.map((thumb, idx) => (
                                <div
                                  key={`${task.id}-shot-thumb-${idx}`}
                                  className="w-6 h-4 rounded-xs overflow-hidden border border-neutral-700 bg-neutral-900"
                                  title={`Shot #${idx + 1} Keyframe`}
                                >
                                  <img
                                    src={thumb}
                                    alt={`Shot ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Director's Cut Cinematic Metadata Sidecar Exported Alongside Video File */}
                    {task.directorsCutMetadata && task.directorsCutMetadata.length > 0 && (
                      <div
                        data-testid={`task-directors-cut-${task.id}`}
                        className="p-2 rounded-lg bg-neutral-900/90 border border-cyan-500/25 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[9px] font-mono">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-bold truncate">
                            <Clapperboard className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">
                              Director&apos;s Cut: Dir. {task.directorsCutMetadata[0].directorName} •{' '}
                              {task.directorsCutMetadata[0].shootingDate} • ISO{' '}
                              {task.directorsCutMetadata[0].iso} •{' '}
                              {task.directorsCutMetadata[0].focalLength} •{' '}
                              {task.directorsCutMetadata[0].colorGradeProfile}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.directorsCutSidecarJson && (
                              <>
                                <button
                                  type="button"
                                  data-testid={`toggle-sidecar-${task.id}`}
                                  onClick={() =>
                                    setExpandedSidecarTaskId((prev) =>
                                      prev === task.id ? null : task.id
                                    )
                                  }
                                  className="px-1.5 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/30 cursor-pointer"
                                >
                                  {expandedSidecarTaskId === task.id ? 'Hide Sidecar' : 'Sidecar JSON'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!task.directorsCutSidecarJson) return;
                                    navigator.clipboard.writeText(task.directorsCutSidecarJson);
                                    setCopiedSidecarTaskId(task.id);
                                    setTimeout(() => setCopiedSidecarTaskId(null), 2000);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/30 cursor-pointer"
                                >
                                  {copiedSidecarTaskId === task.id ? 'Copied!' : 'Export JSON'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400">
                          <span>
                            Sidecar File:{' '}
                            <strong className="text-neutral-300">
                              {task.directorsCutSidecarFilename || 'shot_master.directors-cut.json'}
                            </strong>
                          </span>
                          <span>
                            {task.directorsCutMetadata.length}{' '}
                            {task.directorsCutMetadata.length === 1 ? 'Shot Slate' : 'Shot Slates'}{' '}
                            Bundled
                          </span>
                        </div>

                        {expandedSidecarTaskId === task.id && task.directorsCutSidecarJson && (
                          <pre
                            data-testid={`sidecar-json-preview-${task.id}`}
                            className="mt-1 p-2 rounded bg-neutral-950 border border-neutral-800 text-[9px] font-mono text-cyan-200 max-h-36 overflow-y-auto leading-relaxed"
                          >
                            {task.directorsCutSidecarJson}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Individual Item Progress Bar with Stage Ticks */}
                    <div className="space-y-1">
                      <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDone
                              ? 'bg-emerald-500'
                              : isRunning
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-neutral-600'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500">
                        <span className={task.progress >= 35 ? 'text-amber-400/90' : ''}>
                          S1: Keyframes
                        </span>
                        <span className={task.progress >= 75 ? 'text-amber-400/90' : ''}>
                          S2: Motion I2V
                        </span>
                        <span className={task.progress >= 100 ? 'text-emerald-400 font-bold' : ''}>
                          S3: 4K Master
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-neutral-400">
            {summary.completedCount}/{summary.totalTasks} Completed •{' '}
            <span className="text-amber-400">{summary.queuedCount} Queued</span>
          </div>
          <button
            onClick={() => setIsRenderQueueOpen(false)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-semibold text-neutral-200 rounded-lg cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


