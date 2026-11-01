import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { formatTimecode } from '../utils/timeline-engine';
import {
  DIRECTORS_CUT_COLOR_GRADE_PROFILES,
  DIRECTORS_CUT_FOCAL_LENGTH_OPTIONS,
  DIRECTORS_CUT_ISO_OPTIONS,
  RealTimeShotLogEntry,
  autoPopulateAllScenesDirectorsCutFromFraming,
  captureDirectorsCutFromFramingState,
  formatDirectorsCutSlateBadge,
} from '../utils/directors-cut-engine';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Subtitles,
  Grid,
  Camera,
  Activity,
  Clapperboard,
  Zap,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const PlayerCanvas: React.FC = () => {
  const {
    aspectRatio,
    selectedShot,
    scenes,
    updateScenes,
    stageSetup,
    axisAnalysis,
    cinematicConfig,
    currentTime,
    totalDuration,
    isPlaying,
    togglePlay,
    seek,
    isLooping,
    setIsLooping,
    activeSubtitle,
    subtitleStyle,
    showSubtitles,
    setShowSubtitles,
    duckingState,
    attachDirectorsCutMetadata,
  } = useStudio();

  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [showShotLogger, setShowShotLogger] = useState<boolean>(true);
  const [autoSyncFraming, setAutoSyncFraming] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Locate parent scene for the active shot to read lighting Kelvin, timeOfDay, and atmosphere
  const parentScene = useMemo(() => {
    if (!selectedShot) return scenes[0];
    return (
      scenes.find((sc) => sc.id === selectedShot.sceneId || sc.shots.some((sh) => sh.id === selectedShot.id)) ||
      scenes[0]
    );
  }, [scenes, selectedShot]);

  // Live framing capture derived directly from current PlayerCanvas + Stage + Cinematography state
  const liveFramingCapture = useMemo(() => {
    return captureDirectorsCutFromFramingState({
      shot: selectedShot,
      scene: parentScene,
      stageLens: stageSetup.lens,
      focalLengthMm: cinematicConfig.focalLengthMm,
      aperture: cinematicConfig.aperture,
      colorScience: cinematicConfig.colorScience,
      filmGrainIso: cinematicConfig.filmGrainIso,
      volumetricHaze: cinematicConfig.volumetricHaze,
      aspectRatio,
      timecode: formatTimecode(currentTime),
      axisAnalysis,
    });
  }, [
    selectedShot,
    parentScene,
    stageSetup.lens,
    cinematicConfig.focalLengthMm,
    cinematicConfig.aperture,
    cinematicConfig.colorScience,
    cinematicConfig.filmGrainIso,
    cinematicConfig.volumetricHaze,
    aspectRatio,
    currentTime,
    axisAnalysis,
  ]);

  // Editable / auto-populated Director's Cut state in the Shot Logger Overlay
  const [directorName, setDirectorName] = useState<string>(
    liveFramingCapture.metadata.directorName
  );
  const [shootingDate, setShootingDate] = useState<string>(
    liveFramingCapture.metadata.shootingDate
  );
  const [iso, setIso] = useState<number>(liveFramingCapture.metadata.iso);
  const [focalLength, setFocalLength] = useState<string>(
    liveFramingCapture.metadata.focalLength
  );
  const [colorGradeProfile, setColorGradeProfile] = useState<string>(
    liveFramingCapture.metadata.colorGradeProfile
  );
  const [shotLogHistory, setShotLogHistory] = useState<RealTimeShotLogEntry[]>(() => [
    liveFramingCapture.logEntry,
  ]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Real-time auto-population whenever framing state changes and Auto-Sync is active
  useEffect(() => {
    if (!autoSyncFraming) return;
    const activeDirectorsCut = selectedShot?.directorsCut;
    setDirectorName(activeDirectorsCut?.directorName || liveFramingCapture.metadata.directorName);
    setShootingDate(activeDirectorsCut?.shootingDate || liveFramingCapture.metadata.shootingDate);
    setIso(activeDirectorsCut?.iso ?? liveFramingCapture.metadata.iso);
    setFocalLength(activeDirectorsCut?.focalLength || liveFramingCapture.metadata.focalLength);
    setColorGradeProfile(
      activeDirectorsCut?.colorGradeProfile || liveFramingCapture.metadata.colorGradeProfile
    );
  }, [
    autoSyncFraming,
    selectedShot?.id,
    selectedShot?.focalLength,
    selectedShot?.directorsCut,
    liveFramingCapture.metadata.directorName,
    liveFramingCapture.metadata.shootingDate,
    liveFramingCapture.metadata.iso,
    liveFramingCapture.metadata.focalLength,
    liveFramingCapture.metadata.colorGradeProfile,
  ]);

  const handleAutoPopulateFromFraming = () => {
    const fresh = captureDirectorsCutFromFramingState({
      shot: selectedShot,
      scene: parentScene,
      stageLens: stageSetup.lens,
      focalLengthMm: cinematicConfig.focalLengthMm,
      aperture: cinematicConfig.aperture,
      colorScience: cinematicConfig.colorScience,
      filmGrainIso: cinematicConfig.filmGrainIso,
      volumetricHaze: cinematicConfig.volumetricHaze,
      aspectRatio,
      timecode: formatTimecode(currentTime),
      axisAnalysis,
      directorNameOverride: directorName,
      shootingDateOverride: shootingDate,
    });
    setIso(fresh.metadata.iso);
    setFocalLength(fresh.metadata.focalLength);
    setColorGradeProfile(fresh.metadata.colorGradeProfile);
    setStatusMessage(
      `Synced from framing: ISO ${fresh.metadata.iso} • ${fresh.metadata.focalLength} • ${fresh.metadata.colorGradeProfile}`
    );
  };

  const handleCommitCurrentShotLog = () => {
    if (!selectedShot) return;
    const payload = {
      directorName,
      shootingDate,
      iso,
      focalLength,
      colorGradeProfile,
    };
    attachDirectorsCutMetadata(selectedShot.id, payload);

    const newEntry: RealTimeShotLogEntry = {
      ...liveFramingCapture.logEntry,
      logId: `shot-log-${selectedShot.id}-${Date.now()}`,
      capturedAtTimecode: formatTimecode(currentTime),
      directorsCut: payload,
    };
    setShotLogHistory((prev) => [newEntry, ...prev.filter((item) => item.shotId !== selectedShot.id)].slice(0, 12));
    setStatusMessage(
      `Logged Shot #${selectedShot.shotNumber} (${payload.focalLength} • ISO ${payload.iso})`
    );
  };

  // ONE-CLICK COMPLETE: Captures live framing state, auto-populates the overlay, and stamps all shots
  const handleOneClickCompleteAll = () => {
    const { updatedScenes, entries } = autoPopulateAllScenesDirectorsCutFromFraming(scenes, {
      stageLens: stageSetup.lens,
      focalLengthMm: cinematicConfig.focalLengthMm,
      aperture: cinematicConfig.aperture,
      colorScience: cinematicConfig.colorScience,
      filmGrainIso: cinematicConfig.filmGrainIso,
      volumetricHaze: cinematicConfig.volumetricHaze,
      aspectRatio,
      timecode: formatTimecode(currentTime),
      axisAnalysis,
      directorNameOverride: directorName,
      shootingDateOverride: shootingDate,
    });

    // If the user has an active shot, also ensure the current overlay values are synced and attached
    const activeEntry =
      entries.find((e) => e.shotId === selectedShot?.id) ||
      entries[0] ||
      liveFramingCapture.logEntry;

    setDirectorName(activeEntry.directorsCut.directorName);
    setShootingDate(activeEntry.directorsCut.shootingDate);
    setIso(activeEntry.directorsCut.iso);
    setFocalLength(activeEntry.directorsCut.focalLength);
    setColorGradeProfile(activeEntry.directorsCut.colorGradeProfile);

    updateScenes(updatedScenes);
    setShotLogHistory(entries);
    setShowShotLogger(true);
    setStatusMessage(
      `1-Click Complete: Auto-populated & logged ${entries.length} shots from live framing state`
    );
  };

  const videoUrl = selectedShot?.videoClipUrl;
  const stillUrl =
    selectedShot?.approvedKeyframeUrl ||
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * totalDuration);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const activeSlateSummary = formatDirectorsCutSlateBadge({
    directorName,
    shootingDate,
    iso,
    focalLength,
    colorGradeProfile,
  });

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-neutral-950/80 rounded-2xl border border-neutral-800/80 overflow-hidden relative shadow-2xl"
    >
      {/* Canvas Header / Stage Info */}
      <div className="h-10 border-b border-neutral-800/80 bg-neutral-900/60 px-4 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 font-mono shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-neutral-200 font-semibold tracking-wider uppercase">
              {isPlaying ? 'RECORDING / PREVIEW' : 'STAGED FRAME'}
            </span>
            <span className="text-neutral-500 text-[10px]">24.00 FPS</span>
          </div>

          <div className="h-3 w-px bg-neutral-800 shrink-0" />

          {selectedShot && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px] font-medium border border-neutral-700 shrink-0">
                SHOT #{selectedShot.shotNumber}
              </span>
              <span className="text-neutral-300 font-medium text-[11px] truncate max-w-xs">
                {selectedShot.shotType} • {selectedShot.focalLength}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls: One-Click Complete + Shot Logger Toggle + HUD Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {duckingState.isDuckingActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold animate-pulse">
              <Activity className="w-3 h-3 text-amber-400" />
              <span>DUCKING: {duckingState.gainDb} dB</span>
            </div>
          )}

          {/* One-Click Complete Button right in PlayerCanvas header */}
          <button
            type="button"
            data-testid="one-click-complete-shot-logger-btn"
            onClick={handleOneClickCompleteAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            title="One-Click Complete: Capture current framing state and auto-populate Director's Cut metadata across shots"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>1-Click Auto-Log Director&apos;s Cut</span>
          </button>

          {/* Toggle Real-Time Shot Logger Overlay */}
          <button
            type="button"
            data-testid="toggle-shot-logger-btn"
            onClick={() => setShowShotLogger((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider border transition-colors cursor-pointer ${
              showShotLogger
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
            title="Toggle Real-Time Shot Logger Overlay"
          >
            <Clapperboard className="w-3 h-3" />
            <span>Shot Logger</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHUD(!showHUD)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                showHUD ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Toggle Camera HUD Reticle & Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                showSubtitles ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Toggle Subtitle Burn-In"
            >
              <Subtitles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Screen Container with Aspect Ratio Enforcement */}
      <div className="flex-1 flex items-center justify-center p-4 bg-radial from-neutral-900/60 to-neutral-950/90 relative overflow-hidden">
        <div
          className={`relative overflow-hidden rounded-xl bg-black border border-neutral-800 shadow-2xl transition-all duration-300 flex items-center justify-center ${
            aspectRatio === '16:9'
              ? 'aspect-video w-full max-w-4xl max-h-[580px]'
              : 'aspect-[9/16] h-full max-h-[580px] w-auto'
          }`}
        >
          {/* Master Still Background with Cinematic Scale on Play */}
          <img
            src={stillUrl}
            alt="Master Staged Frame"
            className={`w-full h-full object-cover transition-transform duration-1000 ${
              isPlaying ? 'scale-105 duration-[6000ms]' : 'scale-100'
            }`}
          />

          {/* Video Layer if Available and Successfully Streaming */}
          {isPlaying && videoUrl && (
            <video
              src={videoUrl}
              autoPlay
              loop={isLooping}
              muted={isMuted}
              playsInline
              onPlaying={() => setVideoLoaded(true)}
              onError={() => setVideoLoaded(false)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Camera HUD Grid Overlay */}
          {showHUD && (
            <div className="absolute inset-0 pointer-events-none select-none border border-neutral-700/30">
              {/* Rule of Thirds */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
                <div className="border-r border-b border-amber-400/40" />
                <div className="border-r border-b border-amber-400/40" />
                <div className="border-b border-amber-400/40" />
                <div className="border-r border-b border-amber-400/40" />
                <div className="border-r border-b border-amber-400/40" />
                <div className="border-b border-amber-400/40" />
                <div className="border-r border-amber-400/40" />
                <div className="border-r border-amber-400/40" />
                <div />
              </div>

              {/* Center Crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-amber-400/40 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-amber-400 rounded-full" />
              </div>

              {/* Viewfinder Corners */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400/70" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400/70" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400/70" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400/70" />

              {/* HUD Text Telemetry */}
              <div
                data-testid="hud-directors-cut-telemetry"
                className="absolute top-3 left-4 flex flex-col gap-1 font-mono text-[9px] text-amber-300/90 drop-shadow-md"
              >
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3 h-3" />
                  <span>
                    {aspectRatio === '9:16'
                      ? `FLUX.1 • ${focalLength} • ISO ${iso}`
                      : `FLUX.1-IPADAPTER • ARRI 65 • ${focalLength} • ISO ${iso}`}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded bg-neutral-950/80 border border-amber-500/30 text-[9px] text-cyan-300 tracking-wide">
                  {activeSlateSummary}
                </div>
              </div>

              <div className="absolute top-3 right-4 font-mono text-[9px] text-red-400 flex items-center gap-1 drop-shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>{aspectRatio === '9:16' ? '4K SHORTS' : 'REC 4K UHD'}</span>
              </div>
            </div>
          )}

          {/* Dynamic Word-by-Word Subtitle Overlay */}
          {showSubtitles && activeSubtitle.cue && (
            <div className="absolute bottom-8 inset-x-4 flex flex-col items-center justify-center pointer-events-none select-none z-20 transition-all">
              {subtitleStyle === 'MR_BEAST' && (
                <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-yellow-400/40 shadow-2xl flex flex-wrap gap-2 justify-center items-center max-w-lg">
                  {activeSubtitle.cue.words.map((w, idx) => {
                    const isWordActive = idx === activeSubtitle.activeWordIndex;
                    return (
                      <span
                        key={idx}
                        className={`font-black uppercase tracking-tight text-base transition-all duration-150 ${
                          isWordActive
                            ? 'text-yellow-300 scale-125 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] bg-yellow-400/20 px-1.5 py-0.5 rounded'
                            : 'text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                        }`}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              )}

              {subtitleStyle === 'NETFLIX_CINEMA' && (
                <div className="bg-neutral-950/85 px-6 py-2 rounded-lg border border-neutral-700/50 shadow-2xl max-w-xl text-center">
                  <div className="text-[10px] font-mono text-amber-400/90 font-semibold mb-0.5 tracking-wider uppercase">
                    {activeSubtitle.cue.speaker}
                  </div>
                  <div className="text-sm font-medium text-neutral-100 flex flex-wrap gap-1.5 justify-center">
                    {activeSubtitle.cue.words.map((w, idx) => {
                      const isWordActive = idx === activeSubtitle.activeWordIndex;
                      return (
                        <span
                          key={idx}
                          className={
                            isWordActive
                              ? 'text-amber-300 font-bold underline decoration-amber-400 decoration-2 underline-offset-4'
                              : 'text-neutral-200'
                          }
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {subtitleStyle === 'MINIMAL_SERIF' && (
                <div className="text-center max-w-md px-4 py-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                  <div className="text-xs italic font-serif text-neutral-200 flex flex-wrap gap-1.5 justify-center tracking-wide">
                    {activeSubtitle.cue.words.map((w, idx) => {
                      const isWordActive = idx === activeSubtitle.activeWordIndex;
                      return (
                        <span
                          key={idx}
                          className={
                            isWordActive
                              ? 'text-amber-200 font-semibold not-italic'
                              : 'text-neutral-300/80'
                          }
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-Time Shot Logger Overlay on PlayerCanvas */}
        {showShotLogger && (
          <div
            data-testid="realtime-shot-logger-overlay"
            className="absolute top-3 right-3 bottom-3 w-80 bg-neutral-950/92 backdrop-blur-md border border-neutral-800/90 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden text-xs"
          >
            {/* Overlay Header */}
            <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-100">
                  Real-Time Shot Logger HUD
                </span>
              </div>
              <button
                type="button"
                data-testid="shot-logger-autosync-toggle"
                onClick={() => setAutoSyncFraming((prev) => !prev)}
                className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase border transition-colors cursor-pointer ${
                  autoSyncFraming
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
                title="Automatically sync ISO, focal length, and color grade from live framing state"
              >
                {autoSyncFraming ? 'LIVE SYNC ON' : 'MANUAL'}
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {/* Prominent One-Click Complete Action inside Overlay */}
              <button
                type="button"
                data-testid="overlay-one-click-complete-btn"
                onClick={handleOneClickCompleteAll}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-mono text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>1-Click Auto-Capture &amp; Complete All</span>
              </button>

              {statusMessage && (
                <div
                  data-testid="shot-logger-status-badge"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{statusMessage}</span>
                </div>
              )}

              {/* Live Framing Telemetry Snapshot */}
              <div className="p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                    <Sliders className="w-3 h-3" />
                    FRAMING TELEMETRY
                  </span>
                  <span className="text-amber-400">TC {formatTimecode(currentTime)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                  <div className="px-1.5 py-1 rounded bg-neutral-950 border border-neutral-800/80">
                    <div className="text-[8px] text-neutral-500 uppercase">LENS / FOV</div>
                    <div className="text-neutral-200 font-semibold">
                      {focalLength} ({axisAnalysis.fovDeg}°)
                    </div>
                  </div>
                  <div className="px-1.5 py-1 rounded bg-neutral-950 border border-neutral-800/80">
                    <div className="text-[8px] text-neutral-500 uppercase">EXPOSURE</div>
                    <div className="text-amber-300 font-semibold">
                      ISO {iso} • {cinematicConfig.aperture}
                    </div>
                  </div>
                  <div className="px-1.5 py-1 rounded bg-neutral-950 border border-neutral-800/80">
                    <div className="text-[8px] text-neutral-500 uppercase">LIGHTING</div>
                    <div className="text-cyan-300 font-semibold">
                      {parentScene?.lightingKelvin ?? 4500}K
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Populated Director's Cut Metadata Controls */}
              <div className="space-y-2 bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-300 font-semibold">
                    Director&apos;s Cut Slate
                  </span>
                  <button
                    type="button"
                    data-testid="shot-logger-autopopulate-btn"
                    onClick={handleAutoPopulateFromFraming}
                    className="flex items-center gap-1 text-[9px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer"
                    title="Re-capture ISO, focal length, and LUT from active framing state"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Capture Framing</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-0.5">
                      Director
                    </label>
                    <input
                      type="text"
                      data-testid="shot-logger-director-input"
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono text-[10px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-0.5">
                      Shoot Date
                    </label>
                    <input
                      type="date"
                      data-testid="shot-logger-date-input"
                      value={shootingDate}
                      onChange={(e) => setShootingDate(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono text-[10px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-0.5">
                      Sensor ISO (Framed)
                    </label>
                    <select
                      data-testid="shot-logger-iso-select"
                      value={iso}
                      onChange={(e) => setIso(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-amber-300 font-mono text-[10px] focus:outline-none focus:border-amber-500"
                    >
                      {DIRECTORS_CUT_ISO_OPTIONS.map((val) => (
                        <option key={val} value={val}>
                          ISO {val}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-0.5">
                      Focal Length
                    </label>
                    <select
                      data-testid="shot-logger-focal-select"
                      value={focalLength}
                      onChange={(e) => setFocalLength(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-cyan-300 font-mono text-[10px] focus:outline-none focus:border-amber-500"
                    >
                      {DIRECTORS_CUT_FOCAL_LENGTH_OPTIONS.map((lens) => (
                        <option key={lens} value={lens}>
                          {lens} Prime
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-0.5">
                    Color Grade Profile
                  </label>
                  <select
                    data-testid="shot-logger-grade-select"
                    value={colorGradeProfile}
                    onChange={(e) => setColorGradeProfile(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono text-[10px] focus:outline-none focus:border-amber-500"
                  >
                    {DIRECTORS_CUT_COLOR_GRADE_PROFILES.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  data-testid="shot-logger-commit-btn"
                  onClick={handleCommitCurrentShotLog}
                  className="w-full py-1.5 px-2.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Log Active Shot #{selectedShot?.shotNumber ?? 1}
                </button>
              </div>

              {/* Logged Shots History Feed */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-mono uppercase text-neutral-400">
                  <span>Captured Shot Log ({shotLogHistory.length})</span>
                  <span className="text-neutral-500">AUTO-SIDECAR READY</span>
                </div>
                <div
                  data-testid="shot-logger-history-list"
                  className="space-y-1 max-h-32 overflow-y-auto pr-0.5"
                >
                  {shotLogHistory.map((entry) => (
                    <div
                      key={entry.logId}
                      className="p-1.5 rounded bg-neutral-900/90 border border-neutral-800/90 font-mono text-[9px] flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between text-neutral-200 font-semibold">
                        <span>
                          SC#{entry.sceneNumber} • SHOT #{entry.shotNumber} ({entry.directorsCut.focalLength})
                        </span>
                        <span className="text-amber-400">ISO {entry.directorsCut.iso}</span>
                      </div>
                      <div className="text-neutral-400 truncate">
                        {entry.directorsCut.colorGradeProfile} • Dir. {entry.directorsCut.directorName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transport Control Bar */}
      <div className="h-14 border-t border-neutral-800/80 bg-neutral-900/80 px-4 flex items-center gap-4 select-none">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Reset to Start */}
        <button
          onClick={() => seek(0)}
          className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          title="Return to start (00:00)"
          aria-label="Return to start"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Scrubber Bar */}
        <div
          onClick={handleScrub}
          className="flex-1 h-3 bg-neutral-800 rounded-full relative cursor-pointer group flex items-center"
        >
          <div
            className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full relative group-hover:h-2 transition-all"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Timecode display */}
        <div className="font-mono text-xs text-neutral-300 min-w-20 text-right">
          <span className="text-amber-400 font-bold">{formatTimecode(currentTime)}</span>
          <span className="text-neutral-600 mx-1">/</span>
          <span className="text-neutral-500">{formatTimecode(totalDuration)}</span>
        </div>

        {/* Loop Toggle */}
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`px-2 py-1 rounded text-[10px] font-mono uppercase transition-colors ${
            isLooping ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-neutral-500 hover:text-neutral-300'
          }`}
          title="Loop playback"
        >
          LOOP
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
