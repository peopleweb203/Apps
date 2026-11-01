import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  StudioTab,
  CharacterProfile,
  SetLockerPlate,
  SceneItem,
  ShotItem,
  FoleyTrack,
  RenderTask,
  ThumbnailVariant,
  DirectorsCutMetadata,
} from '../types';
import {
  INITIAL_CHARACTERS,
  INITIAL_SETS,
  INITIAL_SCENES,
  INITIAL_FOLEY_TRACKS,
  INITIAL_SUBTITLE_CUES,
  INITIAL_THUMBNAILS,
} from '../mock/studio-data';
import { Point2D, LensType, AxisAnalysis, analyze180DegreeAxis } from '../utils/stage-math';
import {
  calculateDuckingGain,
  getActiveSubtitle,
  SubtitleCue,
  SubtitleStyle,
} from '../utils/timeline-engine';
import {
  CinematicPipelineConfig,
  DEFAULT_CINEMATIC_CONFIG,
  buildVideoGenerationPayload,
  optimizeCinematicPrompt,
} from '../utils/cinematic-video-pipeline';
import {
  compileScenesToBatchTasks,
  advanceTaskProgressStep,
  BUILT_IN_RENDER_PRESETS,
  RenderExportPreset,
  createCustomRenderPreset,
  applyPresetToQueuedTasks,
} from '../utils/batch-render-queue';
import {
  StudioWorkspaceSnapshot,
  StudioHistoryStack,
  createInitialHistoryStack,
  pushWorkspaceHistoryState,
  performWorkspaceUndo,
  performWorkspaceRedo,
} from '../utils/studio-history-engine';
import {
  TimelineBatchExportMode,
  AutomatedYouTubeMetadataPackage,
  compileTimelineShotsToBatchTasks,
  generateAutomatedYouTubeMetadata,
} from '../utils/timeline-batch-export-manager';
import {
  attachDirectorsCutToShotInScenes,
  attachDirectorsCutToBatchShotsInScenes,
  buildDirectorsCutBatchExportSidecar,
  resolveShotDirectorsCutMetadata,
} from '../utils/directors-cut-engine';

export interface VaultKeyItem {
  provider: 'gemini' | 'elevenlabs' | 'replicate' | 'kling' | 'synclabs';
  isConfigured: boolean;
  badge: string;
  maskedKey: string;
  updatedAt?: string;
}

interface StudioContextValue {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  aspectRatio: '16:9' | '9:16';
  setAspectRatio: (ar: '16:9' | '9:16') => void;
  
  characters: CharacterProfile[];
  sets: SetLockerPlate[];
  scenes: SceneItem[];
  updateScenes: (newScenes: SceneItem[]) => void;
  selectedShotId: string;
  setSelectedShotId: (id: string) => void;
  selectedShot: ShotItem | undefined;

  // Spatial stage layout & 180° rule
  stageSetup: {
    actorA: Point2D;
    actorB: Point2D;
    camera: Point2D;
    referenceSide: number;
    lens: LensType;
  };
  axisAnalysis: AxisAnalysis;
  updateStagePosition: (token: 'actorA' | 'actorB' | 'camera', pos: Point2D) => void;
  setStageLens: (lens: LensType) => void;
  setReferenceSide: (side: number) => void;

  // Transport and Timeline
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  isLooping: boolean;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setIsLooping: (loop: boolean) => void;
  duckingState: { gainLinear: number; gainDb: number; isDuckingActive: boolean };

  // Subtitles
  subtitleCues: SubtitleCue[];
  activeSubtitle: ReturnType<typeof getActiveSubtitle>;
  subtitleStyle: SubtitleStyle;
  setSubtitleStyle: (style: SubtitleStyle) => void;
  showSubtitles: boolean;
  setShowSubtitles: (show: boolean) => void;

  // Foley
  foleyTracks: FoleyTrack[];
  toggleFoleyTrack: (id: string) => void;
  updateFoleyVolume: (id: string, vol: number) => void;
  updateFoleyReverb: (id: string, preset: FoleyTrack['reverbPreset']) => void;

  // Production pipeline actions
  approveKeyframe: (shotId: string) => void;
  regenerateKeyframe: (shotId: string) => Promise<void>;
  extrudeMotion: (shotId: string, direction: any, engine: string) => Promise<void>;
  alignLipSync: (shotId: string) => Promise<void>;
  addCharacter: (char: CharacterProfile) => void;
  updateCharacter: (charId: string, patch: Partial<CharacterProfile>, actionLabel?: string) => void;
  addSetPlate: (setPlate: SetLockerPlate) => void;

  // Cinematography & 4K / 5K Mastering Engine
  cinematicConfig: CinematicPipelineConfig;
  setCinematicConfig: React.Dispatch<React.SetStateAction<CinematicPipelineConfig>>;
  updateCinematicConfig: (partial: Partial<CinematicPipelineConfig>) => void;

  // Vault & Modals
  vaultKeys: VaultKeyItem[];
  isVaultOpen: boolean;
  setIsVaultOpen: (open: boolean) => void;
  saveVaultKeys: (keys: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  clearVaultKey: (provider?: string) => Promise<void>;
  refreshVault: () => Promise<void>;

  // Render Queue & Batch Processing
  renderTasks: RenderTask[];
  isRenderQueueOpen: boolean;
  setIsRenderQueueOpen: (open: boolean) => void;
  isBatchProcessing: boolean;
  processAllQueuedTasks: () => Promise<void>;
  processSingleTask: (taskId: string) => Promise<void>;
  queueAllScenesForRender: () => void;
  clearCompletedTasks: () => void;
  renderPresets: RenderExportPreset[];
  activeRenderPreset: RenderExportPreset;
  loadRenderPreset: (presetId: string) => void;
  updateActivePresetConfig: (
    partial: Partial<Omit<RenderExportPreset, 'id' | 'isBuiltIn'>>
  ) => void;
  saveCustomRenderPreset: (name: string) => RenderExportPreset;
  deleteCustomRenderPreset: (presetId: string) => void;
  thumbnails: ThumbnailVariant[];
  selectedThumbnailId: string;
  setSelectedThumbnailId: (id: string) => void;

  // Timeline Multi-Shot Batch Export & Automated YouTube Metadata Tagging
  selectedTimelineShotIds: string[];
  toggleTimelineShotSelection: (shotId: string) => void;
  selectAllTimelineShots: () => void;
  clearTimelineShotSelection: () => void;
  timelineExportMode: TimelineBatchExportMode;
  setTimelineExportMode: (mode: TimelineBatchExportMode) => void;
  customYouTubeTags: string[];
  addCustomYouTubeTag: (tag: string) => void;
  removeCustomYouTubeTag: (tag: string) => void;
  automatedYouTubeMetadata: AutomatedYouTubeMetadataPackage;
  queueSelectedTimelineShotsForExport: (options?: {
    openQueueDrawer?: boolean;
    navigateToYouTubePublisher?: boolean;
  }) => void;
  attachDirectorsCutMetadata: (shotId: string, metadata: Partial<DirectorsCutMetadata>) => void;
  applyDirectorsCutToSelectedShots: (metadata: Partial<DirectorsCutMetadata>) => void;

  // Global Workspace Undo / Redo System
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  undoCount: number;
  redoCount: number;
  lastActionLabel: string;
  nextRedoLabel: string | null;
  historyStack: StudioHistoryStack;

  // AI Script Breakdown
  isBreakingDownScript: boolean;
  runScriptBreakdown: (screenplay: string, genre: string) => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<StudioTab>('writers-room');

  // Global Undo/Redo Workspace History Stack
  const [historyStack, setHistoryStack] = useState<StudioHistoryStack>(() =>
    createInitialHistoryStack({
      projectTitle: 'The Neon Courier - Ep. 1: Zero Protocol',
      aspectRatio: '16:9',
      cinematicConfig: DEFAULT_CINEMATIC_CONFIG,
      characters: INITIAL_CHARACTERS,
      sets: INITIAL_SETS,
      scenes: INITIAL_SCENES,
      selectedShotId: 'shot-1',
      stageSetup: {
        actorA: { x: 32, y: 46 },
        actorB: { x: 68, y: 46 },
        camera: { x: 50, y: 76 },
        referenceSide: 1,
        lens: '35mm' as LensType,
      },
      subtitleStyle: 'MR_BEAST',
      showSubtitles: true,
      foleyTracks: INITIAL_FOLEY_TRACKS,
      activeRenderPreset: BUILT_IN_RENDER_PRESETS[0],
      selectedThumbnailId: 'thumb-1',
    })
  );

  const {
    projectTitle,
    aspectRatio,
    cinematicConfig,
    characters,
    sets,
    scenes,
    selectedShotId,
    stageSetup,
    subtitleStyle,
    showSubtitles,
    foleyTracks,
    activeRenderPreset,
    selectedThumbnailId,
  } = historyStack.present.snapshot;

  const commitWorkspaceChange = (
    actionLabel: string,
    updater: (prev: StudioWorkspaceSnapshot) => Partial<StudioWorkspaceSnapshot>
  ) => {
    setHistoryStack((prevStack) => {
      const currentSnap = prevStack.present.snapshot;
      const patch = updater(currentSnap);
      const nextSnap: StudioWorkspaceSnapshot = {
        ...currentSnap,
        ...patch,
      };
      return pushWorkspaceHistoryState(prevStack, nextSnap, actionLabel);
    });
  };

  const canUndo = historyStack.past.length > 0;
  const canRedo = historyStack.future.length > 0;
  const undoCount = historyStack.past.length;
  const redoCount = historyStack.future.length;
  const lastActionLabel = historyStack.present.actionLabel;
  const nextRedoLabel =
    historyStack.future.length > 0 ? historyStack.future[0].actionLabel : null;

  const undo = () => {
    setHistoryStack((prev) => {
      if (prev.past.length === 0) return prev;
      const next = performWorkspaceUndo(prev);
      setRenderTasks((tasks) =>
        applyPresetToQueuedTasks(tasks, next.present.snapshot.activeRenderPreset)
      );
      return next;
    });
  };

  const redo = () => {
    setHistoryStack((prev) => {
      if (prev.future.length === 0) return prev;
      const next = performWorkspaceRedo(prev);
      setRenderTasks((tasks) =>
        applyPresetToQueuedTasks(tasks, next.present.snapshot.activeRenderPreset)
      );
      return next;
    });
  };

  // Global keyboard shortcuts: Ctrl/Cmd+Z for Undo, Ctrl+Y or Ctrl/Cmd+Shift+Z for Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isEditableInput) return;

      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.key.toLowerCase() === 'z' && e.shiftKey) ||
        e.key.toLowerCase() === 'y'
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setProjectTitle = (title: string) => {
    commitWorkspaceChange(`Rename Project: ${title}`, () => ({ projectTitle: title }));
  };

  const setAspectRatio = (ar: '16:9' | '9:16') => {
    commitWorkspaceChange(`Switch Aspect Ratio to ${ar}`, () => ({ aspectRatio: ar }));
  };

  const setCinematicConfig: React.Dispatch<React.SetStateAction<CinematicPipelineConfig>> = (
    action
  ) => {
    commitWorkspaceChange('Update Cinematography Mastering Config', (prev) => ({
      cinematicConfig:
        typeof action === 'function' ? action(prev.cinematicConfig) : action,
    }));
  };

  const updateCinematicConfig = (partial: Partial<CinematicPipelineConfig>) => {
    commitWorkspaceChange('Modify Cinematography Parameters', (prev) => ({
      cinematicConfig: { ...prev.cinematicConfig, ...partial },
    }));
  };

  const setScenes = (
    updaterOrValue: SceneItem[] | ((prev: SceneItem[]) => SceneItem[]),
    label: string = 'Update Screenplay Scenes'
  ) => {
    commitWorkspaceChange(label, (prev) => ({
      scenes:
        typeof updaterOrValue === 'function'
          ? updaterOrValue(prev.scenes)
          : updaterOrValue,
    }));
  };

  const setSelectedShotId = (id: string) => {
    commitWorkspaceChange(`Select Shot ${id}`, () => ({ selectedShotId: id }));
  };

  const axisAnalysis = useMemo(() => {
    return analyze180DegreeAxis(stageSetup);
  }, [stageSetup]);

  const updateStagePosition = (token: 'actorA' | 'actorB' | 'camera', pos: Point2D) => {
    commitWorkspaceChange(`Move Stage Token (${token})`, (prev) => ({
      stageSetup: {
        ...prev.stageSetup,
        [token]: {
          x: Math.max(5, Math.min(95, pos.x)),
          y: Math.max(5, Math.min(95, pos.y)),
        },
      },
    }));
  };

  const setStageLens = (lens: LensType) => {
    commitWorkspaceChange(`Set Stage Lens to ${lens}`, (prev) => ({
      stageSetup: { ...prev.stageSetup, lens },
    }));
  };

  const setReferenceSide = (side: number) => {
    commitWorkspaceChange('Flip 180° Reference Axis', (prev) => ({
      stageSetup: { ...prev.stageSetup, referenceSide: side },
    }));
  };

  // Timeline & Transport
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const totalDuration = 21.0; // 5 shots * 4s avg

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= totalDuration) {
          if (isLooping) return 0;
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isLooping, totalDuration]);

  const togglePlay = () => setIsPlaying((p) => !p);
  const seek = (seconds: number) => setCurrentTime(Math.max(0, Math.min(totalDuration, seconds)));

  // Subtitles
  const [subtitleCues] = useState<SubtitleCue[]>(INITIAL_SUBTITLE_CUES);

  const setSubtitleStyle = (style: SubtitleStyle) => {
    commitWorkspaceChange(`Change Subtitle Style to ${style}`, () => ({
      subtitleStyle: style,
    }));
  };

  const setShowSubtitles = (show: boolean) => {
    commitWorkspaceChange(show ? 'Enable Subtitles' : 'Disable Subtitles', () => ({
      showSubtitles: show,
    }));
  };

  const activeSubtitle = useMemo(() => {
    return getActiveSubtitle(currentTime, subtitleCues);
  }, [currentTime, subtitleCues]);

  // Audio Dialogue Ducking
  const dialogueClips = useMemo(() => {
    return subtitleCues.map((c) => ({
      startTime: c.startTime,
      duration: c.endTime - c.startTime,
    }));
  }, [subtitleCues]);

  const duckingState = useMemo(() => {
    return calculateDuckingGain(currentTime, dialogueClips, -12);
  }, [currentTime, dialogueClips]);

  // Foley
  const toggleFoleyTrack = (id: string) => {
    commitWorkspaceChange(`Toggle Foley Stem (${id})`, (prev) => ({
      foleyTracks: prev.foleyTracks.map((t) =>
        t.id === id ? { ...t, isActive: !t.isActive } : t
      ),
    }));
  };

  const updateFoleyVolume = (id: string, vol: number) => {
    commitWorkspaceChange(`Adjust Foley Stem Volume (${id})`, (prev) => ({
      foleyTracks: prev.foleyTracks.map((t) =>
        t.id === id ? { ...t, volume: vol } : t
      ),
    }));
  };

  const updateFoleyReverb = (id: string, preset: FoleyTrack['reverbPreset']) => {
    commitWorkspaceChange(`Set Foley Reverb to ${preset}`, (prev) => ({
      foleyTracks: prev.foleyTracks.map((t) =>
        t.id === id ? { ...t, reverbPreset: preset } : t
      ),
    }));
  };

  // Find currently selected shot
  const allShots = useMemo(() => scenes.flatMap((s) => s.shots), [scenes]);
  const selectedShot = useMemo(() => {
    return allShots.find((s) => s.id === selectedShotId) || allShots[0];
  }, [allShots, selectedShotId]);

  // Render Queue & Tasks
  const [renderTasks, setRenderTasks] = useState<RenderTask[]>(() => {
    const shot1Url =
      INITIAL_SCENES[0]?.shots[0]?.approvedKeyframeUrl ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';
    const shot2Url =
      INITIAL_SCENES[0]?.shots[1]?.approvedKeyframeUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80';

    const initialCompleted: RenderTask[] = [
      {
        id: 'task-1',
        type: 'KEYFRAME_STAGING',
        title: 'Flux.1 Master Staging: Shot #1 (Elena vs Chen)',
        progress: 100,
        status: 'COMPLETED',
        startedAt: '2 min ago',
        sceneId: INITIAL_SCENES[0]?.id || 'scene-1',
        sceneNumber: 1,
        sceneTitle: INITIAL_SCENES[0]?.title || 'EXT. SECTOR 4 NEON ALLEYWAY',
        shotCount: 1,
        stageLabel: '4K DCI Master Verified',
        thumbnailUrl: shot1Url,
        shotThumbnails: [shot1Url],
      },
      {
        id: 'task-2',
        type: 'MOTION_EXTRUSION',
        title: 'Wan 2.1 Motion Extrusion: Shot #2 (Push-in 180°)',
        progress: 100,
        status: 'COMPLETED',
        startedAt: '1 min ago',
        sceneId: INITIAL_SCENES[0]?.id || 'scene-1',
        sceneNumber: 1,
        sceneTitle: INITIAL_SCENES[0]?.title || 'EXT. SECTOR 4 NEON ALLEYWAY',
        shotCount: 1,
        stageLabel: '4K DCI Master Verified',
        thumbnailUrl: shot2Url,
        shotThumbnails: [shot2Url],
      },
    ];
    return compileScenesToBatchTasks(INITIAL_SCENES, initialCompleted, DEFAULT_CINEMATIC_CONFIG.aspectRatio);
  });
  const [isRenderQueueOpen, setIsRenderQueueOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [renderPresets, setRenderPresets] = useState<RenderExportPreset[]>(() => {
    try {
      const saved = localStorage.getItem('cineforge_custom_render_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return [...BUILT_IN_RENDER_PRESETS, ...parsed];
        }
      }
    } catch {
      // ignore storage errors
    }
    return BUILT_IN_RENDER_PRESETS;
  });

  const persistCustomPresets = (allPresets: RenderExportPreset[]) => {
    try {
      const customOnly = allPresets.filter((p) => !p.isBuiltIn);
      localStorage.setItem('cineforge_custom_render_presets', JSON.stringify(customOnly));
    } catch {
      // ignore storage errors
    }
  };

  const loadRenderPreset = (presetId: string) => {
    const found = renderPresets.find((p) => p.id === presetId);
    if (!found) return;
    commitWorkspaceChange(`Load Render Preset: ${found.name}`, () => ({
      activeRenderPreset: found,
    }));
    setRenderTasks((prev) => applyPresetToQueuedTasks(prev, found));
  };

  const updateActivePresetConfig = (
    partial: Partial<Omit<RenderExportPreset, 'id' | 'isBuiltIn'>>
  ) => {
    const next: RenderExportPreset = { ...activeRenderPreset, ...partial };
    commitWorkspaceChange('Customize Render Preset Config', () => ({
      activeRenderPreset: next,
    }));
    setRenderTasks((tasks) => applyPresetToQueuedTasks(tasks, next));
  };

  const saveCustomRenderPreset = (name: string): RenderExportPreset => {
    const created = createCustomRenderPreset(name, {
      resolution: activeRenderPreset.resolution,
      bitrateMbps: activeRenderPreset.bitrateMbps,
      format: activeRenderPreset.format,
      aspectRatio: activeRenderPreset.aspectRatio,
      fps: activeRenderPreset.fps,
    });
    setRenderPresets((prev) => {
      const next = [...prev, created];
      persistCustomPresets(next);
      return next;
    });
    commitWorkspaceChange(`Save Render Preset: ${created.name}`, () => ({
      activeRenderPreset: created,
    }));
    setRenderTasks((prev) => applyPresetToQueuedTasks(prev, created));
    return created;
  };

  const deleteCustomRenderPreset = (presetId: string) => {
    setRenderPresets((prev) => {
      const target = prev.find((p) => p.id === presetId);
      if (!target || target.isBuiltIn) return prev;
      const next = prev.filter((p) => p.id !== presetId);
      persistCustomPresets(next);
      if (activeRenderPreset.id === presetId) {
        const fallback = BUILT_IN_RENDER_PRESETS[0];
        commitWorkspaceChange(`Delete Preset ${target.name}`, () => ({
          activeRenderPreset: fallback,
        }));
        setRenderTasks((tasks) => applyPresetToQueuedTasks(tasks, fallback));
      }
      return next;
    });
  };

  const queueAllScenesForRender = () => {
    setRenderTasks((prev) =>
      compileScenesToBatchTasks(
        scenes,
        prev,
        activeRenderPreset.aspectRatio || cinematicConfig.aspectRatio,
        activeRenderPreset
      )
    );
  };

  // Timeline Multi-Shot Selection & Automated YouTube Metadata State
  const [selectedTimelineShotIds, setSelectedTimelineShotIds] = useState<string[]>(() =>
    INITIAL_SCENES.flatMap((s) => s.shots.map((sh) => sh.id))
  );
  const [timelineExportMode, setTimelineExportMode] =
    useState<TimelineBatchExportMode>('INDIVIDUAL_SHOTS');
  const [customYouTubeTags, setCustomYouTubeTags] = useState<string[]>([
    'AICinema',
    'ShortFilm',
    'DirectorCut',
  ]);

  const toggleTimelineShotSelection = (shotId: string) => {
    setSelectedTimelineShotIds((prev) =>
      prev.includes(shotId) ? prev.filter((id) => id !== shotId) : [...prev, shotId]
    );
  };

  const selectAllTimelineShots = () => {
    setSelectedTimelineShotIds(scenes.flatMap((s) => s.shots.map((sh) => sh.id)));
  };

  const clearTimelineShotSelection = () => {
    setSelectedTimelineShotIds([]);
  };

  const addCustomYouTubeTag = (tag: string) => {
    const cleaned = tag.trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (!cleaned) return;
    setCustomYouTubeTags((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
  };

  const removeCustomYouTubeTag = (tag: string) => {
    setCustomYouTubeTags((prev) => prev.filter((t) => t !== tag));
  };

  const automatedYouTubeMetadata = useMemo(
    () =>
      generateAutomatedYouTubeMetadata({
        projectTitle,
        scenes,
        characters,
        selectedShotIds: selectedTimelineShotIds,
        preset: activeRenderPreset,
        customTags: customYouTubeTags,
      }),
    [
      projectTitle,
      scenes,
      characters,
      selectedTimelineShotIds,
      activeRenderPreset,
      customYouTubeTags,
    ]
  );

  const queueSelectedTimelineShotsForExport = (options?: {
    openQueueDrawer?: boolean;
    navigateToYouTubePublisher?: boolean;
  }) => {
    const effectiveIds =
      selectedTimelineShotIds.length > 0
        ? selectedTimelineShotIds
        : scenes.flatMap((s) => s.shots.map((sh) => sh.id));

    setRenderTasks((prev) =>
      compileTimelineShotsToBatchTasks(
        scenes,
        effectiveIds,
        prev,
        activeRenderPreset,
        timelineExportMode
      )
    );

    if (options?.navigateToYouTubePublisher) {
      setActiveTab('youtube-publisher');
    }
    if (options?.openQueueDrawer !== false) {
      setIsRenderQueueOpen(true);
    }
  };

  const syncRenderTasksWithUpdatedScenes = (updatedScenes: SceneItem[]) => {
    setRenderTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (!task.sceneId) return task;
        const matchingScene = updatedScenes.find((sc) => sc.id === task.sceneId);
        if (!matchingScene) return task;

        // Check if this task is for a specific timeline shot
        const specificShot = matchingScene.shots.find((sh) =>
          task.id.includes(`shot-${sh.id}`)
        );
        const targetShots = specificShot ? [specificShot] : matchingScene.shots;
        if (targetShots.length === 0) return task;

        const sidecar = buildDirectorsCutBatchExportSidecar({
          taskTitle: task.title,
          videoFilename: specificShot
            ? `scene_${matchingScene.sceneNumber}_shot_${specificShot.shotNumber}_master`
            : `scene_${matchingScene.sceneNumber}_master`,
          resolution: task.resolution || activeRenderPreset.resolution,
          exportFormat: task.exportFormat || activeRenderPreset.format,
          bitrateMbps: task.bitrateMbps || activeRenderPreset.bitrateMbps,
          shots: targetShots.map((sh) => ({
            shotId: sh.id,
            shotNumber: sh.shotNumber,
            sceneNumber: matchingScene.sceneNumber,
            sceneTitle: matchingScene.title,
            durationSec: sh.durationSec || 4,
            shotType: sh.shotType,
            cameraAction: sh.cameraAction,
            directorsCut: resolveShotDirectorsCutMetadata(sh),
          })),
        });

        return {
          ...task,
          directorsCutMetadata: sidecar.metadataList,
          directorsCutSidecarFilename: sidecar.sidecarFilename,
          directorsCutSidecarJson: sidecar.sidecarJson,
        };
      })
    );
  };

  const attachDirectorsCutMetadata = (
    shotId: string,
    metadata: Partial<DirectorsCutMetadata>
  ) => {
    const updatedScenes = attachDirectorsCutToShotInScenes(scenes, shotId, metadata, true);
    commitWorkspaceChange(`Attach Director's Cut Metadata (${shotId})`, () => ({
      scenes: updatedScenes,
    }));
    syncRenderTasksWithUpdatedScenes(updatedScenes);
  };

  const applyDirectorsCutToSelectedShots = (metadata: Partial<DirectorsCutMetadata>) => {
    const effectiveIds =
      selectedTimelineShotIds.length > 0
        ? selectedTimelineShotIds
        : scenes.flatMap((s) => s.shots.map((sh) => sh.id));
    const updatedScenes = attachDirectorsCutToBatchShotsInScenes(
      scenes,
      effectiveIds,
      metadata,
      true
    );
    commitWorkspaceChange(
      `Stamp Director's Cut Across ${effectiveIds.length} Shots`,
      () => ({
        scenes: updatedScenes,
      })
    );
    syncRenderTasksWithUpdatedScenes(updatedScenes);
  };

  const clearCompletedTasks = () => {
    setRenderTasks((prev) => prev.filter((t) => t.status !== 'COMPLETED'));
  };

  const processSingleTask = async (taskId: string) => {
    const steps = [28, 34, 24, 20];
    for (const step of steps) {
      setRenderTasks((prev) =>
        prev.map((t) => (t.id === taskId ? advanceTaskProgressStep(t, step) : t))
      );
      await new Promise((r) => setTimeout(r, 320));
    }

    const targetTask = renderTasks.find((t) => t.id === taskId);
    if (targetTask?.sceneId) {
      setScenes(
        (prev) =>
          prev.map((sc) =>
            sc.id === targetTask.sceneId
              ? {
                  ...sc,
                  shots: sc.shots.map((sh) => ({
                    ...sh,
                    keyframeStatus: 'APPROVED',
                    motionStatus: 'READY',
                    lipSyncStatus: 'ALIGNED',
                  })),
                }
              : sc
          ),
        `Complete Scene Render (${targetTask.sceneTitle || targetTask.sceneId})`
      );
    }
  };

  const processAllQueuedTasks = async () => {
    if (isBatchProcessing) return;
    const queuedIds = renderTasks
      .filter((t) => t.status === 'QUEUED' || t.status === 'FAILED')
      .map((t) => t.id);

    if (queuedIds.length === 0) return;
    setIsBatchProcessing(true);

    try {
      for (const taskId of queuedIds) {
        setRenderTasks((prev) =>
          prev.map((t) => (t.id === taskId ? advanceTaskProgressStep({ ...t, progress: 0 }, 18) : t))
        );
        await new Promise((r) => setTimeout(r, 260));

        setRenderTasks((prev) =>
          prev.map((t) => (t.id === taskId ? advanceTaskProgressStep(t, 34) : t))
        );
        await new Promise((r) => setTimeout(r, 280));

        setRenderTasks((prev) =>
          prev.map((t) => (t.id === taskId ? advanceTaskProgressStep(t, 32) : t))
        );
        await new Promise((r) => setTimeout(r, 260));

        setRenderTasks((prev) =>
          prev.map((t) => (t.id === taskId ? advanceTaskProgressStep(t, 25) : t))
        );
        await new Promise((r) => setTimeout(r, 150));
      }

      setScenes(
        (prev) =>
          prev.map((sc) => ({
            ...sc,
            shots: sc.shots.map((sh) => ({
              ...sh,
              keyframeStatus: 'APPROVED',
              motionStatus: 'READY',
              lipSyncStatus: 'ALIGNED',
            })),
          })),
        'Batch Render All Queued Scenes'
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Vault Management
  const [vaultKeys, setVaultKeys] = useState<VaultKeyItem[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const refreshVault = async () => {
    try {
      const res = await fetch('/api/vault/status');
      if (res.ok) {
        const data = await res.json();
        if (data.keys) {
          setVaultKeys(data.keys);
        }
      }
    } catch (err) {
      console.warn('Could not fetch vault status:', err);
    }
  };

  useEffect(() => {
    refreshVault();
  }, []);

  const saveVaultKeys = async (keys: Record<string, string>) => {
    try {
      const res = await fetch('/api/vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to save vault keys' };
      }
      if (data.keys) {
        setVaultKeys(data.keys);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const clearVaultKey = async (provider?: string) => {
    try {
      await fetch('/api/vault/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      await refreshVault();
    } catch (err) {
      console.error(err);
    }
  };

  // Two-Stage Production Workflow Actions
  const approveKeyframe = (shotId: string) => {
    setScenes(
      (prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) =>
            shot.id === shotId
              ? { ...shot, keyframeStatus: 'APPROVED', motionStatus: 'READY' }
              : shot
          ),
        })),
      `Approve Keyframe (${shotId})`
    );
  };

  const regenerateKeyframe = async (shotId: string) => {
    const taskId = `task-regen-${Date.now()}`;
    const targetShot = allShots.find((s) => s.id === shotId);
    const payload = buildVideoGenerationPayload(targetShot?.stillPrompt || '', cinematicConfig);
    const newTitle = `Flux.1 Pro [${payload.modelParameters.width}x${payload.modelParameters.height} • ${cinematicConfig.qualityPreset}]: Shot #${targetShot?.shotNumber || 1}`;

    setRenderTasks((prev) => [
      {
        id: taskId,
        type: 'KEYFRAME_STAGING',
        title: newTitle,
        progress: 15,
        status: 'PROCESSING',
        startedAt: 'Just now',
        shotCount: 1,
        thumbnailUrl: targetShot?.approvedKeyframeUrl,
        shotThumbnails: targetShot?.approvedKeyframeUrl ? [targetShot.approvedKeyframeUrl] : undefined,
      },
      ...prev,
    ]);

    await new Promise((r) => setTimeout(r, 1200));
    setRenderTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress: 70 } : t))
    );
    await new Promise((r) => setTimeout(r, 1000));
    setRenderTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress: 100, status: 'COMPLETED' } : t))
    );

    const alternateStills = [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    ];
    const freshStill = alternateStills[Math.floor(Math.random() * alternateStills.length)];

    setScenes(
      (prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) =>
            shot.id === shotId
              ? {
                  ...shot,
                  approvedKeyframeUrl: freshStill,
                  keyframeStatus: 'APPROVED',
                }
              : shot
          ),
        })),
      `Regenerate Keyframe (${shotId})`
    );
  };

  const extrudeMotion = async (shotId: string, direction: any, engine: string) => {
    const taskId = `task-motion-${Date.now()}`;
    const targetShot = scenes.flatMap((s) => s.shots).find((s) => s.id === shotId);
    const payload = buildVideoGenerationPayload(
      targetShot?.actionDescription || targetShot?.stillPrompt || '',
      cinematicConfig
    );
    setRenderTasks((prev) => [
      {
        id: taskId,
        type: 'MOTION_EXTRUSION',
        title: `${engine} ${cinematicConfig.qualityPreset === 'ultra-5k' ? '5K Ultra' : '4K Master'} [${cinematicConfig.aspectRatio} • ${payload.modelParameters.bitrateMbps}Mbps]: Shot #${targetShot?.shotNumber || 1}`,
        progress: 20,
        status: 'PROCESSING',
        startedAt: 'Just now',
        shotCount: 1,
        thumbnailUrl: targetShot?.approvedKeyframeUrl,
        shotThumbnails: targetShot?.approvedKeyframeUrl ? [targetShot.approvedKeyframeUrl] : undefined,
      },
      ...prev,
    ]);

    await new Promise((r) => setTimeout(r, 1400));
    setRenderTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress: 85 } : t))
    );
    await new Promise((r) => setTimeout(r, 1000));
    setRenderTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress: 100, status: 'COMPLETED' } : t))
    );

    setScenes(
      (prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) =>
            shot.id === shotId
              ? {
                  ...shot,
                  motionEngine: engine as any,
                  motionVector: { ...shot.motionVector, direction },
                  motionStatus: 'READY',
                }
              : shot
          ),
        })),
      `Extrude Motion (${engine})`
    );
  };

  const alignLipSync = async (shotId: string) => {
    const taskId = `task-lipsync-${Date.now()}`;
    const targetShot = scenes.flatMap((s) => s.shots).find((s) => s.id === shotId);
    setRenderTasks((prev) => [
      {
        id: taskId,
        type: 'LIP_SYNC',
        title: 'LatentSync: Phoneme Articulation & Blinking',
        progress: 30,
        status: 'PROCESSING',
        startedAt: 'Just now',
        shotCount: 1,
        thumbnailUrl: targetShot?.approvedKeyframeUrl,
        shotThumbnails: targetShot?.approvedKeyframeUrl ? [targetShot.approvedKeyframeUrl] : undefined,
      },
      ...prev,
    ]);

    await new Promise((r) => setTimeout(r, 1500));
    setRenderTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progress: 100, status: 'COMPLETED' } : t))
    );

    setScenes(
      (prev) =>
        prev.map((scene) => ({
          ...scene,
          shots: scene.shots.map((shot) =>
            shot.id === shotId ? { ...shot, lipSyncStatus: 'ALIGNED' } : shot
          ),
        })),
      `Align Lip Sync (${shotId})`
    );
  };

  const addCharacter = (char: CharacterProfile) => {
    commitWorkspaceChange(`Add Character: ${char.name}`, (prev) => ({
      characters: [char, ...prev.characters],
    }));
  };

  const updateCharacter = (
    charId: string,
    patch: Partial<CharacterProfile>,
    actionLabel: string = 'Update Character Asset Tags'
  ) => {
    commitWorkspaceChange(actionLabel, (prev) => ({
      characters: prev.characters.map((c) =>
        c.id === charId ? { ...c, ...patch } : c
      ),
    }));
  };

  const addSetPlate = (setPlate: SetLockerPlate) => {
    commitWorkspaceChange(`Add Set Plate: ${setPlate.name}`, (prev) => ({
      sets: [setPlate, ...prev.sets],
    }));
  };

  // YouTube Thumbnails
  const [thumbnails] = useState<ThumbnailVariant[]>(INITIAL_THUMBNAILS);
  const setSelectedThumbnailId = (id: string) => {
    commitWorkspaceChange(`Select Thumbnail Variant (${id})`, () => ({
      selectedThumbnailId: id,
    }));
  };

  // AI Script Breakdown
  const [isBreakingDownScript, setIsBreakingDownScript] = useState(false);

  const runScriptBreakdown = async (screenplay: string, genre: string) => {
    setIsBreakingDownScript(true);
    try {
      const res = await fetch('/api/ai/script-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenplay, genre }),
      });
      const json = await res.json();
      if (json.success && json.data?.scenes?.length > 0) {
        const parsedScenes: SceneItem[] = json.data.scenes.map((sc: any, scIdx: number) => ({
          id: `ai-scene-${scIdx + 1}-${Date.now()}`,
          sceneNumber: sc.sceneNumber || scIdx + 1,
          title: sc.title || `Scene ${scIdx + 1}`,
          locationId: 'set-alley',
          timeOfDay: (sc.timeOfDay || 'NIGHT') as any,
          lightingKelvin: sc.lightingKelvin || 4500,
          atmosphere: sc.atmosphere || 'Atmospheric cinematic smoke',
          screenplayNotes: 'Generated via Gemini Script Breakdown Engine',
          shots: (sc.shots || []).map((sh: any, shIdx: number) => ({
            id: `ai-shot-${scIdx}-${shIdx}-${Date.now()}`,
            sceneId: `ai-scene-${scIdx + 1}`,
            shotNumber: sh.shotNumber || shIdx + 1,
            shotType: sh.shotType || 'MEDIUM OVER-SHOULDER',
            focalLength: (sh.focalLength || '35mm') as LensType,
            characterAId: 'char-elena',
            characterBId: 'char-chen',
            cameraAction: sh.cameraAction || 'Slow Cinematic Dolly',
            durationSec: sh.durationSec || 4,
            dialogue: sh.dialogue || '',
            speakerId: 'char-chen',
            stillPrompt: sh.stillPrompt || 'Cinematic still frame with 8k resolution',
            ipAdapterWeight: 0.88,
            approvedKeyframeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
            keyframeStatus: 'APPROVED',
            motionStatus: 'READY',
            motionEngine: 'Wan 2.1 (Cinematic I2V)',
            motionVector: { direction: 'DOLLY_IN', intensity: 3 },
            lipSyncStatus: 'ALIGNED',
            videoClipUrl: 'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-rain-and-neon-lights-42999-large.mp4',
          })),
        }));
        commitWorkspaceChange('AI Script Breakdown Scene Import', () => ({
          scenes: parsedScenes,
          selectedShotId: parsedScenes[0]?.shots[0]?.id || selectedShotId,
        }));
      }
    } catch (err) {
      console.error('Breakdown error:', err);
    } finally {
      setIsBreakingDownScript(false);
    }
  };

  return (
    <StudioContext.Provider
      value={{
        activeTab,
        setActiveTab,
        projectTitle,
        setProjectTitle,
        aspectRatio,
        setAspectRatio,
        characters,
        sets,
        scenes,
        updateScenes: (newScenes: SceneItem[]) =>
          setScenes(newScenes, 'Update Screenplay Scenes'),
        selectedShotId,
        setSelectedShotId,
        selectedShot,
        stageSetup,
        axisAnalysis,
        updateStagePosition,
        setStageLens,
        setReferenceSide,
        currentTime,
        totalDuration,
        isPlaying,
        isLooping,
        togglePlay,
        seek,
        setIsLooping,
        duckingState,
        subtitleCues,
        activeSubtitle,
        subtitleStyle,
        setSubtitleStyle,
        showSubtitles,
        setShowSubtitles,
        foleyTracks,
        toggleFoleyTrack,
        updateFoleyVolume,
        updateFoleyReverb,
        approveKeyframe,
        regenerateKeyframe,
        extrudeMotion,
        alignLipSync,
        addCharacter,
        updateCharacter,
        addSetPlate,
        cinematicConfig,
        setCinematicConfig,
        updateCinematicConfig,
        vaultKeys,
        isVaultOpen,
        setIsVaultOpen,
        saveVaultKeys,
        clearVaultKey,
        refreshVault,
        renderTasks,
        isRenderQueueOpen,
        setIsRenderQueueOpen,
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
        thumbnails,
        selectedThumbnailId,
        setSelectedThumbnailId,
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
        canUndo,
        canRedo,
        undo,
        redo,
        undoCount,
        redoCount,
        lastActionLabel,
        nextRedoLabel,
        historyStack,
        isBreakingDownScript,
        runScriptBreakdown,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}

