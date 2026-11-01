import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { formatTimecode, SubtitleStyle } from '../../utils/timeline-engine';
import {
  DIRECTORS_CUT_ISO_OPTIONS,
  DIRECTORS_CUT_FOCAL_LENGTH_OPTIONS,
  DIRECTORS_CUT_COLOR_GRADE_PROFILES,
  BUILT_IN_DIRECTORS_CUT_PRESETS,
  DirectorsCutExportPreset,
  createDirectorsCutExportPreset,
  saveDirectorsCutPresetToList,
  deleteDirectorsCutPresetFromList,
  resolveShotDirectorsCutMetadata,
  buildDirectorsCutBatchExportSidecar,
} from '../../utils/directors-cut-engine';
import {
  Clock,
  Volume2,
  Video,
  Mic,
  Music,
  Activity,
  Sparkles,
  Subtitles,
  ArrowRight,
  Layers,
  Tag,
  Plus,
  X,
  CheckSquare,
  Square,
  Youtube,
  Copy,
  Clapperboard,
  Check,
  Film,
  Bookmark,
  Trash2,
} from 'lucide-react';

const DC_PRESETS_STORAGE_KEY = 'studio_directors_cut_presets_v1';

export const TimelineView: React.FC = () => {
  const {
    scenes,
    selectedShotId,
    setSelectedShotId,
    selectedShot,
    currentTime,
    totalDuration,
    seek,
    duckingState,
    foleyTracks,
    toggleFoleyTrack,
    updateFoleyVolume,
    updateFoleyReverb,
    subtitleStyle,
    setSubtitleStyle,
    showSubtitles,
    setShowSubtitles,
    activeRenderPreset,
    selectedTimelineShotIds,
    toggleTimelineShotSelection,
    selectAllTimelineShots,
    clearTimelineShotSelection,
    timelineExportMode,
    setTimelineExportMode,
    customYouTubeTags,
    addCustomYouTubeTag,
    removeCustomYouTubeTag,
    automatedYouTubeMetadata,
    queueSelectedTimelineShotsForExport,
    attachDirectorsCutMetadata,
    applyDirectorsCutToSelectedShots,
  } = useStudio();

  const [newTagInput, setNewTagInput] = useState('');
  const [copiedManifest, setCopiedManifest] = useState(false);

  const allShots = scenes.flatMap((s) => s.shots);
  const selectedCount = selectedTimelineShotIds.length;
  const activeShot = selectedShot || allShots[0];
  const resolvedActiveSlate = activeShot
    ? resolveShotDirectorsCutMetadata(activeShot)
    : resolveShotDirectorsCutMetadata({ focalLength: '35mm' });

  const [directorNameInput, setDirectorNameInput] = useState(resolvedActiveSlate.directorName);
  const [shootingDateInput, setShootingDateInput] = useState(resolvedActiveSlate.shootingDate);
  const [isoInput, setIsoInput] = useState<number>(resolvedActiveSlate.iso);
  const [focalLengthInput, setFocalLengthInput] = useState<string>(
    resolvedActiveSlate.focalLength
  );
  const [colorGradeInput, setColorGradeInput] = useState<string>(
    resolvedActiveSlate.colorGradeProfile
  );
  const [slateSavedFeedback, setSlateSavedFeedback] = useState<string | null>(null);
  const [copiedSidecar, setCopiedSidecar] = useState(false);

  // Director's Cut Export Presets State
  const [dcExportPresets, setDcExportPresets] = useState<DirectorsCutExportPreset[]>(() => {
    try {
      const raw = localStorage.getItem(DC_PRESETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const customOnly = parsed.filter((p) => p && !p.isBuiltIn && p.id && p.name && p.metadata);
          return [...BUILT_IN_DIRECTORS_CUT_PRESETS, ...customOnly];
        }
      }
    } catch {
      // Ignore storage read errors
    }
    return BUILT_IN_DIRECTORS_CUT_PRESETS;
  });
  const [selectedDcPresetId, setSelectedDcPresetId] = useState<string>(
    BUILT_IN_DIRECTORS_CUT_PRESETS[0].id
  );
  const [newDcPresetName, setNewDcPresetName] = useState('');
  const [dcPresetFeedback, setDcPresetFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const customOnly = dcExportPresets.filter((p) => !p.isBuiltIn);
      localStorage.setItem(DC_PRESETS_STORAGE_KEY, JSON.stringify(customOnly));
    } catch {
      // Ignore storage write errors
    }
  }, [dcExportPresets]);

  useEffect(() => {
    if (!activeShot) return;
    const slate = resolveShotDirectorsCutMetadata(activeShot);
    setDirectorNameInput(slate.directorName);
    setShootingDateInput(slate.shootingDate);
    setIsoInput(slate.iso);
    setFocalLengthInput(slate.focalLength);
    setColorGradeInput(slate.colorGradeProfile);
  }, [activeShot?.id, activeShot?.focalLength, activeShot?.directorsCut]);

  const handleAttachToActiveShot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShot) return;
    attachDirectorsCutMetadata(activeShot.id, {
      directorName: directorNameInput,
      shootingDate: shootingDateInput,
      iso: Number(isoInput),
      focalLength: focalLengthInput,
      colorGradeProfile: colorGradeInput,
    });
    setSlateSavedFeedback(`Attached to Shot #${activeShot.shotNumber}`);
    setTimeout(() => setSlateSavedFeedback(null), 2200);
  };

  const handleStampAcrossSelectedBatch = () => {
    applyDirectorsCutToSelectedShots({
      directorName: directorNameInput,
      shootingDate: shootingDateInput,
      iso: Number(isoInput),
      focalLength: focalLengthInput,
      colorGradeProfile: colorGradeInput,
    });
    setSlateSavedFeedback(`Stamped ${selectedCount || allShots.length} Shots`);
    setTimeout(() => setSlateSavedFeedback(null), 2200);
  };

  const handleApplyPresetToActiveShot = (preset: DirectorsCutExportPreset) => {
    setSelectedDcPresetId(preset.id);
    setDirectorNameInput(preset.metadata.directorName);
    setShootingDateInput(preset.metadata.shootingDate);
    setIsoInput(preset.metadata.iso);
    setFocalLengthInput(preset.metadata.focalLength);
    setColorGradeInput(preset.metadata.colorGradeProfile);

    if (activeShot) {
      attachDirectorsCutMetadata(activeShot.id, preset.metadata);
      setDcPresetFeedback(`Applied '${preset.name}' to Shot #${activeShot.shotNumber}`);
      setSlateSavedFeedback(`Preset: ${preset.name}`);
      setTimeout(() => {
        setDcPresetFeedback(null);
        setSlateSavedFeedback(null);
      }, 2400);
    }
  };

  const handleApplyPresetToBatchShots = (preset: DirectorsCutExportPreset) => {
    setSelectedDcPresetId(preset.id);
    setDirectorNameInput(preset.metadata.directorName);
    setShootingDateInput(preset.metadata.shootingDate);
    setIsoInput(preset.metadata.iso);
    setFocalLengthInput(preset.metadata.focalLength);
    setColorGradeInput(preset.metadata.colorGradeProfile);

    applyDirectorsCutToSelectedShots(preset.metadata);
    setDcPresetFeedback(
      `Stamped '${preset.name}' across ${selectedCount || allShots.length} shots`
    );
    setTimeout(() => setDcPresetFeedback(null), 2400);
  };

  const handleSaveCurrentMetadataAsPreset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newDcPresetName.trim();
    if (!trimmedName) return;

    const newPreset = createDirectorsCutExportPreset({
      name: trimmedName,
      metadata: {
        directorName: directorNameInput,
        shootingDate: shootingDateInput,
        iso: Number(isoInput),
        focalLength: focalLengthInput,
        colorGradeProfile: colorGradeInput,
      },
    });

    setDcExportPresets((prev) => saveDirectorsCutPresetToList(prev, newPreset));
    setSelectedDcPresetId(newPreset.id);
    setNewDcPresetName('');
    setDcPresetFeedback(`Saved preset '${newPreset.name}'`);
    setTimeout(() => setDcPresetFeedback(null), 2400);
  };

  const handleDeleteCustomDcPreset = (presetId: string, presetName: string) => {
    setDcExportPresets((prev) => deleteDirectorsCutPresetFromList(prev, presetId));
    if (selectedDcPresetId === presetId) {
      setSelectedDcPresetId(BUILT_IN_DIRECTORS_CUT_PRESETS[0].id);
    }
    setDcPresetFeedback(`Removed preset '${presetName}'`);
    setTimeout(() => setDcPresetFeedback(null), 2000);
  };

  const activeShotSidecarPreview = activeShot
    ? buildDirectorsCutBatchExportSidecar({
        taskTitle: `Shot #${activeShot.shotNumber}: ${activeShot.shotType}`,
        videoFilename: `shot_${activeShot.shotNumber}_master`,
        resolution: activeRenderPreset.resolution,
        exportFormat: activeRenderPreset.format,
        bitrateMbps: activeRenderPreset.bitrateMbps,
        shots: [
          {
            shotId: activeShot.id,
            shotNumber: activeShot.shotNumber,
            durationSec: activeShot.durationSec || 4,
            shotType: activeShot.shotType,
            cameraAction: activeShot.cameraAction,
            directorsCut: {
              directorName: directorNameInput,
              shootingDate: shootingDateInput,
              iso: Number(isoInput),
              focalLength: focalLengthInput,
              colorGradeProfile: colorGradeInput,
            },
          },
        ],
      })
    : null;

  const handleCopySidecarPreview = () => {
    if (!activeShotSidecarPreview) return;
    navigator.clipboard.writeText(activeShotSidecarPreview.sidecarJson);
    setCopiedSidecar(true);
    setTimeout(() => setCopiedSidecar(false), 2000);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    addCustomYouTubeTag(newTagInput);
    setNewTagInput('');
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(automatedYouTubeMetadata.uploadManifestJson);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  // Subtitle style choices
  const STYLES: { id: SubtitleStyle; title: string; desc: string; preview: string }[] = [
    {
      id: 'MR_BEAST',
      title: 'Viral Hormozi / MrBeast',
      desc: 'High-energy uppercase font, bright yellow active word pop, high CTR engagement.',
      preview: 'THE PERIMETER IS COMPROMISED!',
    },
    {
      id: 'NETFLIX_CINEMA',
      title: 'Netflix Cinematic Bar',
      desc: 'Lower-third dark translucent pill with amber underline highlight for studio prestige.',
      preview: 'You were never supposed to open that transport case.',
    },
    {
      id: 'MINIMAL_SERIF',
      title: 'Minimalist A24 Serif',
      desc: 'Understated italicized serif typography tailored for arthouse & dramatic pacing.',
      preview: 'Conscience is a luxury in Sector 4.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-h-0 bg-neutral-950/40">
      {/* Top Half: Non-Linear Multi-Track Sequencer with Multi-Shot Batch Selection */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-950/80 p-3.5 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 font-mono">
              Non-Linear Multi-Track Sequencer & Batch Shot Selector
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
              {selectedCount}/{allShots.length} Shots Selected • {automatedYouTubeMetadata.totalDurationSec}s
            </span>
            <button
              onClick={
                selectedCount === allShots.length
                  ? clearTimelineShotSelection
                  : selectAllTimelineShots
              }
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 cursor-pointer transition-all"
            >
              {selectedCount === allShots.length ? 'Deselect All' : 'Select All Shots'}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="font-mono text-xs text-amber-400 font-bold">
              PLAYHEAD: {formatTimecode(currentTime)}
            </div>

            <button
              onClick={() =>
                queueSelectedTimelineShotsForExport({
                  openQueueDrawer: true,
                  navigateToYouTubePublisher: false,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-mono font-bold text-xs rounded-lg transition-colors cursor-pointer"
              title="Queue selected timeline shots into the Batch Render Queue"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Queue Batch ({selectedCount || allShots.length} Shots)</span>
            </button>

            <button
              onClick={() =>
                queueSelectedTimelineShotsForExport({
                  openQueueDrawer: false,
                  navigateToYouTubePublisher: true,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <span>Auto-Tag & Export YouTube 4K</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Tracks Area */}
        <div className="flex-1 bg-neutral-900/60 rounded-xl border border-neutral-800/80 p-2 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Playhead Needle indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 pointer-events-none transition-all duration-75"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 -translate-x-1/2 bg-amber-400 rotate-45" />
          </div>

          {/* TRACK 1: VIDEO TRACK with Multi-Shot Batch Checkboxes */}
          <div className="flex items-center gap-2 h-11">
            <div className="w-20 font-mono text-[10px] text-neutral-400 flex items-center gap-1 shrink-0">
              <Video className="w-3 h-3 text-amber-400" />
              <span>VIDEO (V1)</span>
            </div>
            <div className="flex-1 flex gap-1.5 h-full">
              {allShots.map((shot, idx) => {
                const isSelected = selectedShotId === shot.id;
                const isBatchChecked = selectedTimelineShotIds.includes(shot.id);
                const shotSlate = resolveShotDirectorsCutMetadata(shot);
                const hasCustomDirectorsCut = Boolean(shot.directorsCut);
                return (
                  <div
                    key={shot.id}
                    data-testid={`timeline-shot-card-${shot.id}`}
                    onClick={() => {
                      setSelectedShotId(shot.id);
                      seek(idx * 4.2);
                    }}
                    className={`flex-1 rounded-lg border p-1 flex items-center gap-2 overflow-hidden transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : isBatchChecked
                        ? 'bg-neutral-800/90 border-purple-500/50 text-neutral-200 hover:bg-neutral-700/60'
                        : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:bg-neutral-800/60'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label={`Toggle Shot #${shot.shotNumber} for Batch Export`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTimelineShotSelection(shot.id);
                      }}
                      className="text-amber-400 hover:text-amber-300 shrink-0 cursor-pointer"
                      title="Include/Exclude shot in Batch Render & YouTube Chapter Metadata"
                    >
                      {isBatchChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </button>
                    <img
                      src={
                        shot.approvedKeyframeUrl ||
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={shot.shotType}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold font-mono truncate">
                          S#{shot.shotNumber} • {shotSlate.focalLength}
                        </span>
                        {hasCustomDirectorsCut && (
                          <span
                            data-testid={`shot-dc-pill-${shot.id}`}
                            className="px-1 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[7px] font-mono font-bold shrink-0"
                            title={`Director's Cut: ${shotSlate.directorName} • ISO ${shotSlate.iso} • ${shotSlate.colorGradeProfile}`}
                          >
                            DC•ISO{shotSlate.iso}
                          </span>
                        )}
                      </div>
                      <div className="text-[8px] text-neutral-400 truncate font-mono">
                        {hasCustomDirectorsCut
                          ? `Dir. ${shotSlate.directorName}`
                          : shot.shotType}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRACK 2: DIALOGUE TRACK (With Voice Cues) */}
          <div className="flex items-center gap-2 h-9">
            <div className="w-20 font-mono text-[10px] text-neutral-400 flex items-center gap-1 shrink-0">
              <Mic className="w-3 h-3 text-cyan-400" />
              <span>VOICE (A1)</span>
            </div>
            <div className="flex-1 flex gap-2 h-full">
              {allShots.map((shot, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-md px-2 flex items-center justify-between text-[9px] font-mono border overflow-hidden ${
                    shot.dialogue
                      ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                      : 'bg-neutral-900/40 border-neutral-800 text-neutral-600'
                  }`}
                >
                  <span className="truncate">
                    {shot.dialogue ? `"${shot.dialogue}"` : '[AMBIENT ACTION]'}
                  </span>
                  {shot.dialogue && <span className="text-[8px] text-cyan-400 shrink-0">ElevenLabs</span>}
                </div>
              ))}
            </div>
          </div>

          {/* TRACK 3: SFX & PROCEDURAL FOLEY TRACK */}
          <div className="flex items-center gap-2 h-8">
            <div className="w-20 font-mono text-[10px] text-neutral-400 flex items-center gap-1 shrink-0">
              <Volume2 className="w-3 h-3 text-orange-400" />
              <span>SFX (A2)</span>
            </div>
            <div className="flex-1 bg-orange-950/30 border border-orange-500/30 rounded-md px-3 flex items-center justify-between text-[9px] font-mono text-orange-300">
              <span>PROCEDURAL FOLEY BED: Rain on Glass & Distant Mag-Lev Traffic</span>
              <span className="text-[8px] bg-orange-500/20 px-1.5 py-0.2 rounded text-orange-400">
                AUTO-DUCKING ENABLED
              </span>
            </div>
          </div>

          {/* TRACK 4: MUSIC & SYNTH SCORE TRACK */}
          <div className="flex items-center gap-2 h-8">
            <div className="w-20 font-mono text-[10px] text-neutral-400 flex items-center gap-1 shrink-0">
              <Music className="w-3 h-3 text-purple-400" />
              <span>SCORE (A3)</span>
            </div>
            <div className="flex-1 bg-purple-950/30 border border-purple-500/30 rounded-md px-3 flex items-center justify-between text-[9px] font-mono text-purple-300">
              <span>CYBER-NOIR SYNTHWAVE SCORE (B-FLAT MINOR, 72 BPM)</span>
              <span className="text-[8px] text-purple-400">STEMS SYNCED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Half: 3-Column Studio Layout (Batch Render Export & Auto YouTube Metadata | Soundstage Foley | Burn-In Subtitles) */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Column 1: Batch Render Export Manager & Automated YouTube Metadata Tagging */}
        <div className="border-r border-neutral-800 p-5 flex flex-col justify-between bg-neutral-950/60 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100 font-mono">
                  Batch Render Export & Auto-YouTube Tagging
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {automatedYouTubeMetadata.resolutionBadge}
              </span>
            </div>

            {/* Batch Mode Toggle & Active Preset Summary */}
            <div className="bg-neutral-900/70 p-3 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Active Preset:</span>
                <span className="text-amber-300 font-bold">
                  {activeRenderPreset.name} ({activeRenderPreset.bitrateMbps} Mbps)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTimelineExportMode('INDIVIDUAL_SHOTS')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    timelineExportMode === 'INDIVIDUAL_SHOTS'
                      ? 'bg-purple-500/20 text-purple-200 border-purple-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  Queue Individual Shots ({automatedYouTubeMetadata.selectedShotCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineExportMode('UNIFIED_SEQUENCE')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    timelineExportMode === 'UNIFIED_SEQUENCE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  Unified Sequence Master
                </button>
              </div>
            </div>

            {/* Director's Cut Export Presets Panel */}
            <div
              data-testid="directors-cut-export-presets-panel"
              className="bg-neutral-900/90 p-3.5 rounded-xl border border-amber-500/30 space-y-2.5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    Director&apos;s Cut Export Presets
                  </h4>
                </div>
                <span
                  data-testid="dc-presets-count-badge"
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                >
                  {dcExportPresets.length} STYLES READY
                </span>
              </div>

              <p className="text-[10px] text-neutral-400 leading-snug">
                Save or apply curated cinematic metadata combinations (e.g.{' '}
                <strong className="text-neutral-200">Film Noir</strong> or{' '}
                <strong className="text-neutral-200">Kodak Portra</strong>) to individual or future timeline shots.
              </p>

              {dcPresetFeedback && (
                <div
                  data-testid="dc-preset-feedback-banner"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{dcPresetFeedback}</span>
                </div>
              )}

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 gap-2">
                {dcExportPresets.map((preset) => {
                  const isSelected = selectedDcPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      data-testid={`dc-export-preset-card-${preset.id}`}
                      onClick={() => handleApplyPresetToActiveShot(preset)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] font-mono font-bold text-neutral-100 truncate">
                            {preset.name}
                          </span>
                          <span
                            className={`text-[8px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                              preset.isBuiltIn
                                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {preset.isBuiltIn ? preset.styleTag : 'CUSTOM LOOK'}
                          </span>
                        </div>

                        {!preset.isBuiltIn && (
                          <button
                            type="button"
                            data-testid={`delete-dc-preset-${preset.id}`}
                            aria-label={`Delete preset ${preset.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomDcPreset(preset.id, preset.name);
                            }}
                            className="text-neutral-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                            title="Delete custom preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="text-[9px] font-mono text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-amber-300 font-semibold">
                          ISO {preset.metadata.iso}
                        </span>
                        <span>•</span>
                        <span className="text-cyan-300 font-semibold">
                          {preset.metadata.focalLength}
                        </span>
                        <span>•</span>
                        <span className="text-neutral-300 truncate">
                          {preset.metadata.colorGradeProfile}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <span className="text-[9px] font-mono text-neutral-500 truncate">
                          Dir. {preset.metadata.directorName}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            data-testid={`apply-dc-preset-shot-${preset.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyPresetToActiveShot(preset);
                            }}
                            className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[9px] font-mono font-bold transition-colors cursor-pointer"
                          >
                            Apply Shot #{activeShot?.shotNumber ?? 1}
                          </button>
                          <button
                            type="button"
                            data-testid={`apply-dc-preset-batch-${preset.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyPresetToBatchShots(preset);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[9px] font-mono font-bold transition-colors cursor-pointer"
                            title="Apply this preset metadata combination to all selected/future shots"
                          >
                            Stamp All ({selectedCount || allShots.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Current Metadata Combination as Custom Preset */}
              <div className="pt-1.5 border-t border-neutral-800 space-y-1.5">
                <span className="text-[9px] font-mono uppercase text-neutral-400 block">
                  Save Active Slate Combination ({focalLengthInput} • ISO {isoInput} •{' '}
                  {colorGradeInput.split(' ')[0]})
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    aria-label="New Director's Cut Preset Name"
                    data-testid="dc-preset-name-input"
                    value={newDcPresetName}
                    onChange={(e) => setNewDcPresetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCurrentMetadataAsPreset();
                      }
                    }}
                    placeholder="e.g. Kodak Portra Dusk or Neo-Noir 85mm..."
                    className="flex-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    type="button"
                    data-testid="save-dc-preset-btn"
                    onClick={() => handleSaveCurrentMetadataAsPreset()}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Save Preset</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Director's Cut Utility: Per-Shot Cinematic Metadata Inspector & Batch Sidecar Exporter */}
            {activeShot && (
              <form
                onSubmit={handleAttachToActiveShot}
                data-testid="directors-cut-utility-panel"
                className="bg-neutral-900/90 p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                      Director&apos;s Cut Utility • Shot #{activeShot.shotNumber}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {activeShot.directorsCut ? 'CUSTOM SLATE LOCKED' : 'DEFAULT SLATE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 block">
                    <span className="text-[9px] font-mono uppercase text-neutral-400">
                      Director Name
                    </span>
                    <input
                      type="text"
                      aria-label="Director Name"
                      data-testid="directors-cut-director-input"
                      value={directorNameInput}
                      onChange={(e) => setDirectorNameInput(e.target.value)}
                      placeholder="e.g. Denis Villeneuve"
                      className="w-full px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-100 focus:outline-none focus:border-cyan-500/50"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[9px] font-mono uppercase text-neutral-400">
                      Shooting Date
                    </span>
                    <input
                      type="date"
                      aria-label="Shooting Date"
                      data-testid="directors-cut-date-input"
                      value={shootingDateInput}
                      onChange={(e) => setShootingDateInput(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-100 focus:outline-none focus:border-cyan-500/50"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 block">
                    <span className="text-[9px] font-mono uppercase text-neutral-400">
                      Exposure Index (ISO)
                    </span>
                    <select
                      aria-label="Exposure Index ISO"
                      data-testid="directors-cut-iso-select"
                      value={isoInput}
                      onChange={(e) => setIsoInput(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-100 focus:outline-none focus:border-cyan-500/50"
                    >
                      {DIRECTORS_CUT_ISO_OPTIONS.map((isoVal) => (
                        <option key={isoVal} value={isoVal}>
                          ISO {isoVal} EI
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[9px] font-mono uppercase text-neutral-400">
                      Focal Length
                    </span>
                    <select
                      aria-label="Director Cut Focal Length"
                      data-testid="directors-cut-focal-select"
                      value={focalLengthInput}
                      onChange={(e) => setFocalLengthInput(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-100 focus:outline-none focus:border-cyan-500/50"
                    >
                      {DIRECTORS_CUT_FOCAL_LENGTH_OPTIONS.map((lens) => (
                        <option key={lens} value={lens}>
                          {lens} Anamorphic Prime
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="space-y-1 block">
                  <span className="text-[9px] font-mono uppercase text-neutral-400">
                    Color Grade Profile (3D LUT / CDL)
                  </span>
                  <select
                    aria-label="Color Grade Profile"
                    data-testid="directors-cut-grade-select"
                    value={colorGradeInput}
                    onChange={(e) => setColorGradeInput(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    {DIRECTORS_CUT_COLOR_GRADE_PROFILES.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center justify-between px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-[9px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1 truncate">
                    <Film className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      Sidecar: {activeShotSidecarPreview?.sidecarFilename}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySidecarPreview}
                    className="text-cyan-300 hover:text-cyan-200 font-bold shrink-0 ml-2 cursor-pointer"
                  >
                    {copiedSidecar ? 'Copied Sidecar!' : 'Copy Sidecar JSON'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="submit"
                    data-testid="attach-directors-cut-shot-btn"
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    {slateSavedFeedback ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">{slateSavedFeedback}</span>
                      </>
                    ) : (
                      <>
                        <Clapperboard className="w-3 h-3 text-cyan-400" />
                        <span>Attach to Shot #{activeShot.shotNumber}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="stamp-directors-cut-batch-btn"
                    onClick={handleStampAcrossSelectedBatch}
                    className="py-1.5 px-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono font-semibold transition-all cursor-pointer"
                    title="Stamp these Director's Cut settings across all selected timeline shots"
                  >
                    Stamp Batch ({selectedCount || allShots.length})
                  </button>
                </div>
              </form>
            )}

            {/* Auto-Generated YouTube SEO Title & Chapters Preview */}
            <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                  Auto-Generated YouTube Title & Chapters:
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  00:00 Verified • ~{automatedYouTubeMetadata.estimatedFileSizeMb} MB
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-neutral-100 bg-neutral-950 p-2 rounded border border-neutral-800">
                {automatedYouTubeMetadata.seoTitle}
              </div>
              <pre className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-[10px] font-mono text-amber-300 max-h-24 overflow-y-auto leading-relaxed">
                {automatedYouTubeMetadata.timestampsText}
              </pre>
            </div>

            {/* Automated YouTube SEO Tags & Custom Tag Editor */}
            <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-400" />
                  <span>Auto-Extracted YouTube SEO Tags ({automatedYouTubeMetadata.youtubeTags.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyManifest}
                  className="text-[10px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedManifest ? 'Manifest Copied!' : 'Copy JSON Manifest'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {automatedYouTubeMetadata.youtubeTags.map((tag) => {
                  const isCustom = customYouTubeTags.includes(tag);
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                        isCustom
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                      }`}
                    >
                      <span>#{tag}</span>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => removeCustomYouTubeTag(tag)}
                          className="hover:text-rose-400 cursor-pointer"
                          title="Remove custom tag"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add custom YouTube #tag..."
                  className="flex-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Tag</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() =>
                queueSelectedTimelineShotsForExport({
                  openQueueDrawer: true,
                  navigateToYouTubePublisher: false,
                })
              }
              className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Queue Selected Shots to Batch</span>
            </button>
            <button
              type="button"
              onClick={() =>
                queueSelectedTimelineShotsForExport({
                  openQueueDrawer: false,
                  navigateToYouTubePublisher: true,
                })
              }
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Suite</span>
            </button>
          </div>
        </div>

        {/* Column 2: Soundstage, Foley, and Automatic -12dB Ducking */}
        <div className="border-r border-neutral-800 p-5 flex flex-col justify-between overflow-y-auto bg-neutral-950/40">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100 font-mono">
                  Soundstage Foley & Auto-Ducking
                </h3>
              </div>

              {/* Automatic Ducking Status Visualizer */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all ${
                  duckingState.isDuckingActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                }`}
              >
                <Activity className="w-3 h-3 text-amber-400" />
                <span>
                  {duckingState.isDuckingActive
                    ? `AUTO DUCKING: -12.0 dB`
                    : 'DUCKING: IDLE (0 dB)'}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              Background music and ambient noise beds automatically drop by <strong>-12 dB</strong> whenever dialogue is spoken.
            </p>

            {/* Foley Beds List */}
            <div className="space-y-3">
              {foleyTracks.map((foley) => (
                <div
                  key={foley.id}
                  className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={foley.isActive}
                        onChange={() => toggleFoleyTrack(foley.id)}
                        className="rounded accent-amber-500 cursor-pointer"
                        id={`check-${foley.id}`}
                      />
                      <label
                        htmlFor={`check-${foley.id}`}
                        className="text-xs font-semibold text-neutral-200 cursor-pointer"
                      >
                        {foley.name}
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400">REVERB:</span>
                      <select
                        value={foley.reverbPreset}
                        onChange={(e) => updateFoleyReverb(foley.id, e.target.value as any)}
                        aria-label={`${foley.name} Reverb Preset`}
                        className="bg-neutral-950 border border-neutral-700 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-300 focus:outline-none"
                      >
                        <option value="WAREHOUSE">Warehouse</option>
                        <option value="OFFICE">Office</option>
                        <option value="IN_VEHICLE">In-Vehicle</option>
                        <option value="CATHEDRAL">Cathedral</option>
                        <option value="STUDIO">Studio Booth</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-neutral-500 w-12">
                      Vol: {Math.round(foley.volume * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={foley.volume}
                      onChange={(e) => updateFoleyVolume(foley.id, parseFloat(e.target.value))}
                      aria-label={`${foley.name} Volume`}
                      className="flex-1 accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Dynamic Word-by-Word Subtitle Styler */}
        <div className="p-5 flex flex-col justify-between overflow-y-auto bg-neutral-950/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100 font-mono">
                  Burn-In Subtitle Styler
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSubtitles}
                  onChange={(e) => setShowSubtitles(e.target.checked)}
                  id="sub-toggle"
                  className="rounded accent-amber-500"
                />
                <label htmlFor="sub-toggle" className="text-xs text-neutral-300 cursor-pointer">
                  Burn-In Active
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {STYLES.map((style) => {
                const isSelected = subtitleStyle === style.id;

                return (
                  <div
                    key={style.id}
                    onClick={() => setSubtitleStyle(style.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                        <span>{style.title}</span>
                        {style.id === 'MR_BEAST' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            TOP CTR
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-400' : 'border-neutral-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 mb-2.5">{style.desc}</p>

                    {/* Live Style Preview Card */}
                    <div className="bg-black/80 p-2.5 rounded-lg border border-neutral-800 text-center flex items-center justify-center min-h-[40px]">
                      {style.id === 'MR_BEAST' && (
                        <div className="font-black text-xs uppercase text-white flex gap-1.5 justify-center items-center">
                          <span>THE</span>
                          <span className="text-yellow-300 scale-110 bg-yellow-400/20 px-1 rounded shadow-sm">
                            PERIMETER
                          </span>
                          <span>IS</span>
                          <span>COMPROMISED!</span>
                        </div>
                      )}

                      {style.id === 'NETFLIX_CINEMA' && (
                        <div className="bg-neutral-950/90 px-3 py-1 rounded text-[11px] text-neutral-200">
                          You were never{' '}
                          <span className="text-amber-300 font-bold underline decoration-amber-400">
                            supposed
                          </span>{' '}
                          to open that case.
                        </div>
                      )}

                      {style.id === 'MINIMAL_SERIF' && (
                        <div className="font-serif italic text-xs text-neutral-300">
                          Conscience is a <span className="text-amber-200 not-italic font-bold">luxury</span> in Sector 4.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
