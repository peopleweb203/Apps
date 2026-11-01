import { RenderTask, SceneItem } from '../types';
import {
  buildDirectorsCutBatchExportSidecar,
  resolveShotDirectorsCutMetadata,
} from './directors-cut-engine';

export type RenderResolutionOption =
  | '5K Anamorphic (5120x2160)'
  | '5K UHD Studio (5120x2880)'
  | '4K DCI (4096x1716)'
  | '4K UHD (3840x2160)'
  | '2K QHD (2560x1440)'
  | '1080p FHD (1920x1080)';

export type RenderFormatOption =
  | 'MOV (ProRes 422 HQ)'
  | 'MP4 (H.265 / HEVC 10-Bit)'
  | 'MKV (AV1 Master)'
  | 'WEBM (VP9 Studio)';

export interface RenderExportPreset {
  id: string;
  name: string;
  resolution: RenderResolutionOption;
  bitrateMbps: number;
  format: RenderFormatOption;
  aspectRatio: '2.39:1' | '16:9' | '1.85:1' | '9:16';
  fps: 24 | 30 | 60;
  isBuiltIn?: boolean;
}

export const BUILT_IN_RENDER_PRESETS: RenderExportPreset[] = [
  {
    id: 'preset-4k-dci-master',
    name: '4K DCI Theatrical Master',
    resolution: '4K DCI (4096x1716)',
    bitrateMbps: 85,
    format: 'MOV (ProRes 422 HQ)',
    aspectRatio: '2.39:1',
    fps: 24,
    isBuiltIn: true,
  },
  {
    id: 'preset-5k-anamorphic-raw',
    name: '5K Anamorphic Master (12-Bit RAW)',
    resolution: '5K Anamorphic (5120x2160)',
    bitrateMbps: 135,
    format: 'MOV (ProRes 422 HQ)',
    aspectRatio: '2.39:1',
    fps: 24,
    isBuiltIn: true,
  },
  {
    id: 'preset-4k-uhd-streaming',
    name: '4K UHD Streaming (HEVC)',
    resolution: '4K UHD (3840x2160)',
    bitrateMbps: 65,
    format: 'MP4 (H.265 / HEVC 10-Bit)',
    aspectRatio: '16:9',
    fps: 24,
    isBuiltIn: true,
  },
  {
    id: 'preset-5k-uhd-studio',
    name: '5K UHD Studio Archive',
    resolution: '5K UHD Studio (5120x2880)',
    bitrateMbps: 150,
    format: 'MKV (AV1 Master)',
    aspectRatio: '16:9',
    fps: 24,
    isBuiltIn: true,
  },
];

export interface BatchQueueSummary {
  totalTasks: number;
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  overallProgressPercent: number;
  isBatchComplete: boolean;
  uniqueSceneCount: number;
}

/**
 * Creates a validated custom RenderExportPreset for saving into user preset library
 */
export function createCustomRenderPreset(
  name: string,
  config: {
    resolution: RenderResolutionOption;
    bitrateMbps: number;
    format: RenderFormatOption;
    aspectRatio?: '2.39:1' | '16:9' | '1.85:1' | '9:16';
    fps?: 24 | 30 | 60;
  }
): RenderExportPreset {
  const sanitizedName = name.trim() || 'Custom Studio Preset';
  const clampedBitrate = Math.max(8, Math.min(250, Math.round(config.bitrateMbps)));

  return {
    id: `preset-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: sanitizedName,
    resolution: config.resolution,
    bitrateMbps: clampedBitrate,
    format: config.format,
    aspectRatio: config.aspectRatio || '2.39:1',
    fps: config.fps || 24,
    isBuiltIn: false,
  };
}

/**
 * Applies a selected RenderExportPreset to all QUEUED tasks in the render queue
 */
export function applyPresetToQueuedTasks(
  tasks: RenderTask[],
  preset: RenderExportPreset
): RenderTask[] {
  return tasks.map((task) => {
    if (task.status !== 'QUEUED') return task;
    const shotsCount = task.shotCount || 1;
    const updatedTitle =
      task.sceneNumber !== undefined && task.sceneTitle
        ? `Scene #${task.sceneNumber}: ${task.sceneTitle} (${shotsCount} Shots • ${preset.aspectRatio})`
        : task.title;

    return {
      ...task,
      title: updatedTitle,
      presetName: preset.name,
      resolution: preset.resolution,
      bitrateMbps: preset.bitrateMbps,
      exportFormat: preset.format,
    };
  });
}

/**
 * Estimates total batch output size in MB based on queued/total shots and bitrateMbps
 */
export function estimateBatchOutputSizeMb(
  tasks: RenderTask[],
  preset: RenderExportPreset,
  avgShotDurationSec: number = 4.5
): number {
  const activeOrQueued = tasks.filter((t) => t.status === 'QUEUED' || t.status === 'PROCESSING');
  const targetList = activeOrQueued.length > 0 ? activeOrQueued : tasks;
  const totalShots = targetList.reduce((acc, t) => acc + (t.shotCount || 1), 0);
  const totalDurationSec = totalShots * avgShotDurationSec;
  // Megabits per second / 8 = Megabytes per second
  const megabytes = (preset.bitrateMbps / 8) * totalDurationSec;
  return Math.round(megabytes * 10) / 10;
}

/**
 * Resolves the human-readable pipeline stage label from progress percentage (0-100)
 */
export function resolveStageLabelForProgress(progress: number, type: RenderTask['type']): string {
  const clamped = Math.max(0, Math.min(100, progress));
  if (clamped === 0) return 'Queued in Batch Buffer';
  if (clamped >= 100) return '4K DCI Master Verified';

  if (type === 'KEYFRAME_STAGING') {
    if (clamped < 45) return 'Stage 1A: Biometric Seed & IP-Adapter Lock';
    return 'Stage 1B: Flux.1 Anamorphic Still Synthesis';
  }
  if (type === 'MOTION_EXTRUSION') {
    if (clamped < 40) return 'Stage 2A: First-Last Frame Optical Conditioning';
    if (clamped < 80) return 'Stage 2B: Wan 2.1 / Kling Temporal Extrusion';
    return 'Stage 2C: 24fps Shutter & Motion Cadence Pass';
  }
  if (type === 'LIP_SYNC') {
    if (clamped < 50) return 'Stage 3A: Viseme & Jaw Morphology Alignment';
    return 'Stage 3B: Binaural Acoustic & Sidechain Ducking';
  }

  // 4K_EXPORT or full scene pipeline
  if (clamped < 35) return 'Stage 1: Flux.1 Keyframe Staging';
  if (clamped < 75) return 'Stage 2: Wan 2.1 Motion Extrusion';
  return 'Stage 3: LatentSync & 4K Kodak 500T Master';
}

/**
 * Deterministically advances a RenderTask by a progress increment (0-100)
 */
export function advanceTaskProgressStep(task: RenderTask, increment: number): RenderTask {
  const nextProgress = Math.max(0, Math.min(100, Math.round(task.progress + increment)));
  const isCompleted = nextProgress >= 100;

  return {
    ...task,
    progress: nextProgress,
    status: isCompleted ? 'COMPLETED' : 'PROCESSING',
    startedAt: task.status === 'QUEUED' ? 'Just now' : task.startedAt,
    stageLabel: resolveStageLabelForProgress(nextProgress, task.type),
  };
}

export const DEFAULT_SCENE_THUMBNAIL =
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';

/**
 * Extracts primary thumbnail preview and shot strip thumbnails for a scene
 */
export function resolveSceneThumbnails(scene: SceneItem): {
  thumbnailUrl: string;
  shotThumbnails: string[];
} {
  const shotUrls = (scene.shots || [])
    .map((shot) => shot.approvedKeyframeUrl)
    .filter((url): url is string => Boolean(url && url.trim().length > 0));

  const thumbnailUrl = shotUrls[0] || DEFAULT_SCENE_THUMBNAIL;
  const shotThumbnails = shotUrls.length > 0 ? shotUrls.slice(0, 4) : [thumbnailUrl];

  return { thumbnailUrl, shotThumbnails };
}

/**
 * Compiles an array of SceneItems into batch-queued RenderTasks for any scenes not already queued/processing
 */
export function compileScenesToBatchTasks(
  scenes: SceneItem[],
  existingTasks: RenderTask[],
  aspectRatio: string = '2.39:1',
  preset: RenderExportPreset = BUILT_IN_RENDER_PRESETS[0]
): RenderTask[] {
  const newTasks: RenderTask[] = [];
  const effectiveAspect = preset?.aspectRatio || aspectRatio;

  for (const scene of scenes) {
    const shotsCount = scene.shots?.length || 1;
    const batchId = `task-scene-batch-${scene.id}`;
    const { thumbnailUrl, shotThumbnails } = resolveSceneThumbnails(scene);

    // Check if an active or queued task for this scene already exists
    const alreadyQueued = existingTasks.some(
      (t) => t.sceneId === scene.id && (t.status === 'QUEUED' || t.status === 'PROCESSING')
    );

    if (!alreadyQueued) {
      const taskTitle = `Scene #${scene.sceneNumber}: ${scene.title} (${shotsCount} Shots • ${effectiveAspect})`;
      const sidecar = buildDirectorsCutBatchExportSidecar({
        taskTitle,
        videoFilename: `scene_${scene.sceneNumber}_master`,
        resolution: preset.resolution,
        exportFormat: preset.format,
        bitrateMbps: preset.bitrateMbps,
        shots: (scene.shots || []).map((shot) => ({
          shotId: shot.id,
          shotNumber: shot.shotNumber,
          sceneNumber: scene.sceneNumber,
          sceneTitle: scene.title,
          durationSec: shot.durationSec || 4,
          shotType: shot.shotType,
          cameraAction: shot.cameraAction,
          directorsCut: resolveShotDirectorsCutMetadata(shot),
        })),
      });

      newTasks.push({
        id: `${batchId}-${Date.now()}-${scene.sceneNumber}`,
        type: '4K_EXPORT',
        title: taskTitle,
        progress: 0,
        status: 'QUEUED',
        startedAt: 'Queued for Batch',
        sceneId: scene.id,
        sceneNumber: scene.sceneNumber,
        sceneTitle: scene.title,
        shotCount: shotsCount,
        stageLabel: 'Queued in Batch Buffer',
        thumbnailUrl,
        shotThumbnails,
        presetName: preset.name,
        resolution: preset.resolution,
        bitrateMbps: preset.bitrateMbps,
        exportFormat: preset.format,
        directorsCutMetadata: sidecar.metadataList,
        directorsCutSidecarFilename: sidecar.sidecarFilename,
        directorsCutSidecarJson: sidecar.sidecarJson,
      });
    }
  }

  return [...newTasks, ...existingTasks];
}

/**
 * Computes real-time summary metrics across the entire render queue
 */
export function calculateBatchQueueSummary(tasks: RenderTask[]): BatchQueueSummary {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      queuedCount: 0,
      processingCount: 0,
      completedCount: 0,
      failedCount: 0,
      overallProgressPercent: 0,
      isBatchComplete: false,
      uniqueSceneCount: 0,
    };
  }

  let queuedCount = 0;
  let processingCount = 0;
  let completedCount = 0;
  let failedCount = 0;
  let progressSum = 0;
  const sceneIds = new Set<string>();

  for (const task of tasks) {
    if (task.status === 'QUEUED') queuedCount++;
    else if (task.status === 'PROCESSING') processingCount++;
    else if (task.status === 'COMPLETED') completedCount++;
    else if (task.status === 'FAILED') failedCount++;

    progressSum += Math.max(0, Math.min(100, task.progress));
    if (task.sceneId) sceneIds.add(task.sceneId);
  }

  const overallProgressPercent = Math.round(progressSum / totalTasks);

  return {
    totalTasks,
    queuedCount,
    processingCount,
    completedCount,
    failedCount,
    overallProgressPercent,
    isBatchComplete: totalTasks > 0 && queuedCount === 0 && processingCount === 0 && completedCount > 0,
    uniqueSceneCount: sceneIds.size || totalTasks,
  };
}

