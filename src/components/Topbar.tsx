import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { formatTimecode } from '../utils/timeline-engine';
import {
  Lock,
  Layers,
  Sparkles,
  Play,
  Pause,
  Monitor,
  Smartphone,
  Clapperboard,
  Undo2,
  Redo2,
  History,
  Check,
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    projectTitle,
    setProjectTitle,
    currentTime,
    totalDuration,
    isPlaying,
    togglePlay,
    aspectRatio,
    setAspectRatio,
    vaultKeys,
    setIsVaultOpen,
    renderTasks,
    setIsRenderQueueOpen,
    setActiveTab,
    canUndo,
    canRedo,
    undo,
    redo,
    undoCount,
    redoCount,
    lastActionLabel,
    nextRedoLabel,
    historyStack,
  } = useStudio();

  const [isHistoryPopoverOpen, setIsHistoryPopoverOpen] = useState(false);

  const configuredCount = vaultKeys.filter((k) => k.isConfigured).length;
  const activeTasksCount = renderTasks.filter((t) => t.status === 'PROCESSING').length;
  const queuedTasksCount = renderTasks.filter((t) => t.status === 'QUEUED').length;

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none relative">
      {/* Brand, Project Name & Global Undo/Redo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg shadow-sm">
          <Clapperboard className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold tracking-wider text-xs uppercase bg-gradient-to-r from-amber-300 via-amber-200 to-orange-400 bg-clip-text text-transparent font-mono">
            CineForge AI
          </span>
          <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono font-semibold">
            PRO
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-800" />

        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          aria-label="Project Title"
          className="bg-transparent hover:bg-neutral-900 focus:bg-neutral-900 border border-transparent hover:border-neutral-800 focus:border-amber-500/50 rounded px-2 py-0.5 text-xs text-neutral-200 font-medium transition-all w-56 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
          title="Click to rename project"
        />

        <div className="h-4 w-px bg-neutral-800" />

        {/* Global Workspace Undo / Redo Bar */}
        <div
          data-testid="global-undo-redo-bar"
          className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 gap-0.5 relative"
        >
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo workspace change"
            title={
              canUndo
                ? `Undo: ${lastActionLabel} (Ctrl+Z)`
                : 'Nothing to undo (Ctrl+Z)'
            }
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-semibold text-neutral-300 hover:text-amber-300 hover:bg-neutral-800 disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
            {undoCount > 0 && (
              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                {undoCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo workspace change"
            title={
              canRedo
                ? `Redo: ${nextRedoLabel} (Ctrl+Y)`
                : 'Nothing to redo (Ctrl+Y)'
            }
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-semibold text-neutral-300 hover:text-amber-300 hover:bg-neutral-800 disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>Redo</span>
            {redoCount > 0 && (
              <span className="px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold">
                {redoCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsHistoryPopoverOpen((prev) => !prev)}
            aria-label="Toggle workspace history log"
            title="Inspect Studio Workspace Undo/Redo History"
            className={`p-1 rounded transition-colors cursor-pointer ${
              isHistoryPopoverOpen
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {/* Workspace History Log Popover */}
          {isHistoryPopoverOpen && (
            <div
              data-testid="workspace-history-popover"
              className="absolute left-0 top-10 w-80 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 space-y-2"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-amber-300">
                  <History className="w-3.5 h-3.5" />
                  <span>Workspace State History</span>
                </div>
                <span className="text-[9px] font-mono text-neutral-500">
                  {undoCount} Undo • {redoCount} Redo
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                {historyStack.future.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-2 py-1 rounded bg-neutral-900/40 text-neutral-500 border border-dashed border-neutral-800"
                  >
                    <span className="truncate">Redo: {entry.actionLabel}</span>
                    <span className="text-[9px] shrink-0 ml-2">{entry.timestamp}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between px-2 py-1.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  <div className="flex items-center gap-1.5 truncate">
                    <Check className="w-3 h-3 shrink-0 text-amber-400" />
                    <span className="truncate">{historyStack.present.actionLabel}</span>
                  </div>
                  <span className="text-[9px] shrink-0 ml-2 text-amber-400/80">ACTIVE</span>
                </div>

                {[...historyStack.past].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-2 py-1 rounded bg-neutral-900 text-neutral-400 border border-neutral-800/80"
                  >
                    <span className="truncate">{entry.actionLabel}</span>
                    <span className="text-[9px] shrink-0 ml-2 text-neutral-500">
                      {entry.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Transport & Runtime Counter */}
      <div className="flex items-center gap-4">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="16:9 Cinema Landscape (YouTube / Features)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9 Cinema</span>
          </button>
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="9:16 Vertical Video (YouTube Shorts / TikTok)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Shorts</span>
          </button>
        </div>

        {/* Runtime Counter */}
        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900/90 border border-neutral-800 rounded-lg">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <div className="font-mono text-xs text-neutral-300 tracking-wider">
            <span className="text-amber-400 font-bold">{formatTimecode(currentTime)}</span>
            <span className="text-neutral-600 mx-1">/</span>
            <span className="text-neutral-500">{formatTimecode(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Render Queue, API Vault, YouTube 4K Export */}
      <div className="flex items-center gap-2.5">
        {/* Render Queue Button */}
        <button
          onClick={() => setIsRenderQueueOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-all cursor-pointer"
          title="Open Render Queue"
        >
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px]">Render Queue</span>
          {activeTasksCount > 0 ? (
            <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-amber-500/30 border border-amber-500 text-[10px] text-amber-300 font-mono font-bold animate-pulse">
              {activeTasksCount} active
            </span>
          ) : queuedTasksCount > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono font-bold">
              {queuedTasksCount} queued
            </span>
          ) : (
            <span className="text-[10px] px-1 bg-neutral-800 text-neutral-400 rounded font-mono">
              idle
            </span>
          )}
        </button>

        {/* API Vault Button with Green Locked Badge */}
        <button
          onClick={() => setIsVaultOpen(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            configuredCount > 0
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
          }`}
          title="Encrypted API Vault (AES-256-GCM zero key reset)"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono font-semibold">API VAULT</span>
          {configuredCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono uppercase font-bold tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-0.5" />
              LOCKED IN ({configuredCount}/5)
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-mono">SETUP</span>
          )}
        </button>

        {/* YouTube 4K Package Button */}
        <button
          onClick={() => setActiveTab('youtube-publisher')}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium text-xs rounded-lg shadow-sm shadow-red-900/40 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>4K YouTube Suite</span>
        </button>
      </div>
    </header>
  );
};

