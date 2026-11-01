import { CharacterProfile, DirectorsCutMetadata, RenderTask, SceneItem, ShotItem } from '../types';
import {
  BUILT_IN_RENDER_PRESETS,
  DEFAULT_SCENE_THUMBNAIL,
  RenderExportPreset,
} from './batch-render-queue';
import { autoCategorizeCharacterAssets } from './character-tag-engine';
import {
  buildDirectorsCutBatchExportSidecar,
  resolveShotDirectorsCutMetadata,
} from './directors-cut-engine';
import { formatTimecode } from './timeline-engine';

export type TimelineBatchExportMode = 'UNIFIED_SEQUENCE' | 'INDIVIDUAL_SHOTS';

export interface TimelineShotSelectionItem {
  shot: ShotItem;
  scene: SceneItem;
  startTimeSec: number;
  endTimeSec: number;
}

export interface YouTubeChapterMarker {
  shotId: string;
  shotNumber: number;
  sceneNumber: number;
  startTimeSec: number;
  formattedTimecode: string;
  chapterTitle: string;
  focalLength: string;
  shotType: string;
  directorsCut?: DirectorsCutMetadata;
}

export interface AutomatedYouTubeMetadataPackage {
  seoTitle: string;
  description: string;
  timestampsText: string;
  chapterMarkers: YouTubeChapterMarker[];
  youtubeTags: string[];
  hashtags: string[];
  category: 'Film & Animation';
  visibility: 'PUBLIC' | 'UNLISTED' | 'SCHEDULED';
  syntheticMediaDisclosure: boolean;
  totalDurationSec: number;
  selectedShotCount: number;
  estimatedFileSizeMb: number;
  resolutionBadge: string;
  uploadManifestJson: string;
  directorsCutSlates: DirectorsCutMetadata[];
}

/**
 * Resolves ordered TimelineShotSelectionItems from scenes and a list of selected shot IDs.
 * If selectedShotIds is empty, falls back to all shots in timeline order.
 */
export function resolveSelectedTimelineShots(
  scenes: SceneItem[],
  selectedShotIds?: string[]
): TimelineShotSelectionItem[] {
  const allOrdered: Array<{ shot: ShotItem; scene: SceneItem }> = [];
  for (const scene of scenes) {
    for (const shot of scene.shots || []) {
      allOrdered.push({ shot, scene });
    }
  }

  const filterSet =
    selectedShotIds && selectedShotIds.length > 0 ? new Set(selectedShotIds) : null;

  const filtered = filterSet
    ? allOrdered.filter((item) => filterSet.has(item.shot.id))
    : allOrdered;

  const effectiveList = filtered.length > 0 ? filtered : allOrdered;

  let cursorSec = 0;
  return effectiveList.map(({ shot, scene }) => {
    const duration = Math.max(1, shot.durationSec || 4);
    const item: TimelineShotSelectionItem = {
      shot,
      scene,
      startTimeSec: cursorSec,
      endTimeSec: cursorSec + duration,
    };
    cursorSec += duration;
    return item;
  });
}

/**
 * Compiles selected shots from TimelineView into batch RenderTasks.
 * Supports either 'INDIVIDUAL_SHOTS' (one task per shot) or 'UNIFIED_SEQUENCE' (single stitched master task).
 * Exports attached Director's Cut cinematic metadata alongside each video file task.
 */
export function compileTimelineShotsToBatchTasks(
  scenes: SceneItem[],
  selectedShotIds: string[],
  existingTasks: RenderTask[],
  preset: RenderExportPreset = BUILT_IN_RENDER_PRESETS[0],
  mode: TimelineBatchExportMode = 'INDIVIDUAL_SHOTS'
): RenderTask[] {
  const selectedItems = resolveSelectedTimelineShots(scenes, selectedShotIds);
  if (selectedItems.length === 0) return existingTasks;

  const now = Date.now();
  const newTasks: RenderTask[] = [];

  if (mode === 'UNIFIED_SEQUENCE') {
    const shotThumbnails = selectedItems
      .map((item) => item.shot.approvedKeyframeUrl)
      .filter((u): u is string => Boolean(u && u.trim().length > 0));
    const primaryThumb = shotThumbnails[0] || DEFAULT_SCENE_THUMBNAIL;
    const taskTitle = `Timeline Master Sequence (${selectedItems.length} Shots • ${preset.aspectRatio} • ${preset.resolution.split(' ')[0]})`;

    const sidecar = buildDirectorsCutBatchExportSidecar({
      taskTitle,
      videoFilename: `timeline_master_sequence_${selectedItems.length}shots`,
      resolution: preset.resolution,
      exportFormat: preset.format,
      bitrateMbps: preset.bitrateMbps,
      shots: selectedItems.map(({ shot, scene }) => ({
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
      id: `task-timeline-seq-${now}`,
      type: '4K_EXPORT',
      title: taskTitle,
      progress: 0,
      status: 'QUEUED',
      startedAt: 'Queued from Timeline',
      sceneId: selectedItems[0].scene.id,
      sceneNumber: selectedItems[0].scene.sceneNumber,
      sceneTitle: `Timeline Export (${selectedItems.length} Shots)`,
      shotCount: selectedItems.length,
      stageLabel: 'Queued in Batch Buffer',
      thumbnailUrl: primaryThumb,
      shotThumbnails: shotThumbnails.slice(0, 6),
      presetName: preset.name,
      resolution: preset.resolution,
      bitrateMbps: preset.bitrateMbps,
      exportFormat: preset.format,
      directorsCutMetadata: sidecar.metadataList,
      directorsCutSidecarFilename: sidecar.sidecarFilename,
      directorsCutSidecarJson: sidecar.sidecarJson,
    });
  } else {
    const refreshedExisting = [...existingTasks];
    selectedItems.forEach((item, idx) => {
      const { shot, scene } = item;
      const thumb = shot.approvedKeyframeUrl || DEFAULT_SCENE_THUMBNAIL;
      const dcMeta = resolveShotDirectorsCutMetadata(shot);
      const taskTitle = `Shot #${shot.shotNumber} [Sc.${scene.sceneNumber}]: ${shot.shotType} (${dcMeta.focalLength} • ${preset.aspectRatio})`;
      const sidecar = buildDirectorsCutBatchExportSidecar({
        taskTitle,
        videoFilename: `scene_${scene.sceneNumber}_shot_${shot.shotNumber}_master`,
        resolution: preset.resolution,
        exportFormat: preset.format,
        bitrateMbps: preset.bitrateMbps,
        shots: [
          {
            shotId: shot.id,
            shotNumber: shot.shotNumber,
            sceneNumber: scene.sceneNumber,
            sceneTitle: scene.title,
            durationSec: shot.durationSec || 4,
            shotType: shot.shotType,
            cameraAction: shot.cameraAction,
            directorsCut: dcMeta,
          },
        ],
      });

      const existingIdx = refreshedExisting.findIndex(
        (t) =>
          t.id.includes(`shot-${shot.id}`) &&
          (t.status === 'QUEUED' || t.status === 'PROCESSING')
      );

      if (existingIdx >= 0) {
        refreshedExisting[existingIdx] = {
          ...refreshedExisting[existingIdx],
          title: taskTitle,
          directorsCutMetadata: sidecar.metadataList,
          directorsCutSidecarFilename: sidecar.sidecarFilename,
          directorsCutSidecarJson: sidecar.sidecarJson,
        };
      } else {
        newTasks.push({
          id: `task-timeline-shot-${shot.id}-${now}-${idx}`,
          type: '4K_EXPORT',
          title: taskTitle,
          progress: 0,
          status: 'QUEUED',
          startedAt: 'Queued from Timeline',
          sceneId: scene.id,
          sceneNumber: scene.sceneNumber,
          sceneTitle: `${scene.title} — Shot #${shot.shotNumber}`,
          shotCount: 1,
          stageLabel: 'Queued in Batch Buffer',
          thumbnailUrl: thumb,
          shotThumbnails: [thumb],
          presetName: preset.name,
          resolution: preset.resolution,
          bitrateMbps: preset.bitrateMbps,
          exportFormat: preset.format,
          directorsCutMetadata: sidecar.metadataList,
          directorsCutSidecarFilename: sidecar.sidecarFilename,
          directorsCutSidecarJson: sidecar.sidecarJson,
        });
      }
    });

    return [...newTasks, ...refreshedExisting];
  }

  return [...newTasks, ...existingTasks];
}

/**
 * Automatically extracts and compiles YouTube SEO metadata, shot-accurate 00:00 chapter timestamps,
 * semantic tags (character mood/outfit/role, camera lenses, motion engines, 4K/5K specs),
 * and a structured JSON upload manifest from the selected TimelineView shots.
 */
export function generateAutomatedYouTubeMetadata(params: {
  projectTitle: string;
  scenes: SceneItem[];
  characters: CharacterProfile[];
  selectedShotIds?: string[];
  preset?: RenderExportPreset;
  customTags?: string[];
  visibility?: 'PUBLIC' | 'UNLISTED' | 'SCHEDULED';
}): AutomatedYouTubeMetadataPackage {
  const {
    projectTitle,
    scenes,
    characters,
    selectedShotIds,
    preset = BUILT_IN_RENDER_PRESETS[0],
    customTags = [],
    visibility = 'PUBLIC',
  } = params;

  const selectedItems = resolveSelectedTimelineShots(scenes, selectedShotIds);
  const totalDurationSec = selectedItems.reduce(
    (sum, item) => sum + Math.max(1, item.shot.durationSec || 4),
    0
  );

  const is5K = preset.resolution.startsWith('5K');
  const resolutionBadge = is5K ? '5K Ultra HD' : '4K UHD Master';

  // 1. Build shot-by-shot YouTube Chapter Markers (00:00 guaranteed) & Director's Cut Slates
  const directorsCutSlates: DirectorsCutMetadata[] = [];
  const chapterMarkers: YouTubeChapterMarker[] = selectedItems.map((item, index) => {
    const startSec = index === 0 ? 0 : item.startTimeSec;
    const actionSnippet = (item.shot.cameraAction || item.shot.shotType || 'Cinematic Shot')
      .replace(/\.$/, '')
      .trim();
    const dcMeta = resolveShotDirectorsCutMetadata(item.shot);
    directorsCutSlates.push(dcMeta);
    return {
      shotId: item.shot.id,
      shotNumber: item.shot.shotNumber,
      sceneNumber: item.scene.sceneNumber,
      startTimeSec: startSec,
      formattedTimecode: formatTimecode(startSec),
      chapterTitle: `Shot #${item.shot.shotNumber}: ${item.scene.title} (${actionSnippet})`,
      focalLength: dcMeta.focalLength,
      shotType: item.shot.shotType,
      directorsCut: dcMeta,
    };
  });

  const timestampsText =
    chapterMarkers.length > 0
      ? chapterMarkers
          .map((m) => `${m.formattedTimecode} - ${m.chapterTitle}`)
          .join('\n')
      : '00:00 - Cold Open / Master Sequence';

  // 2. Automatically extract semantic YouTube tags from shots, lenses, engines, and cast
  const tagSet = new Set<string>([
    is5K ? '5K AI Film' : '4K AI Short Film',
    'CineForge AI',
    'Anamorphic Cinema',
    'FLUX.1 Pro',
  ]);

  const charMap = new Map<string, CharacterProfile>();
  characters.forEach((c) => charMap.set(c.id, c));

  const castNamesInBatch = new Set<string>();
  const lensesInBatch = new Set<string>();
  const enginesInBatch = new Set<string>();

  for (const { shot, scene } of selectedItems) {
    const dcMeta = resolveShotDirectorsCutMetadata(shot);
    if (dcMeta.focalLength) {
      lensesInBatch.add(`${dcMeta.focalLength} Prime Lens`);
      tagSet.add(`${dcMeta.focalLength} Cinema`);
    }
    if (shot.motionEngine) {
      enginesInBatch.add(shot.motionEngine);
      if (shot.motionEngine.toLowerCase().includes('wan')) tagSet.add('Wan 2.1 I2V');
      if (shot.motionEngine.toLowerCase().includes('kling')) tagSet.add('Kling 1.6 Pro');
    }
    if (scene.timeOfDay === 'NIGHT') {
      tagSet.add('Cyberpunk Noir');
    }

    const charIds = [shot.characterAId, shot.characterBId, shot.speakerId].filter(
      (id): id is string => Boolean(id)
    );
    for (const cid of charIds) {
      const char = charMap.get(cid);
      if (char) {
        castNamesInBatch.add(`${char.name} (${char.role})`);
        tagSet.add(char.name.replace(/\s+/g, ''));
        const assetTags = autoCategorizeCharacterAssets(char);
        tagSet.add(assetTags.mood.replace(/[^a-zA-Z0-9 ]/g, '').trim());
        tagSet.add(assetTags.outfitStyle);
      }
    }
  }

  for (const custom of customTags) {
    const cleaned = custom.trim().replace(/^#+/, '');
    if (cleaned) tagSet.add(cleaned);
  }

  const youtubeTags = Array.from(tagSet).slice(0, 20);
  const hashtags = youtubeTags
    .slice(0, 8)
    .map((t) => `#${t.replace(/[^a-zA-Z0-9]+/g, '')}`);

  const seoTitle = `${projectTitle} | ${resolutionBadge} (${selectedItems.length}-Shot Director's Cut)`;

  const estimatedFileSizeMb =
    Math.round(((preset.bitrateMbps / 8) * Math.max(4, totalDurationSec)) * 10) / 10;

  const castCredits =
    castNamesInBatch.size > 0
      ? Array.from(castNamesInBatch)
          .map((c) => `• ${c}`)
          .join('\n')
      : '• Virtual Studio Ensemble Cast';

  const primarySlate = directorsCutSlates[0];

  const description = `${seoTitle}

Batch-exported directly from the CineForge AI Non-Linear Timeline (${selectedItems.length} Master Shots • ${totalDurationSec}s Runtime • ${preset.resolution} @ ${preset.fps}fps).

CHAPTER TIMESTAMPS:
${timestampsText}

FEATURED VIRTUAL CAST & BIOMETRIC LOCKS:
${castCredits}

DIRECTOR'S CUT CINEMATIC SLATE:
• Director: ${primarySlate?.directorName || 'Elena Vance'} (Shooting Date: ${primarySlate?.shootingDate || '2026-10-31'})
• Exposure & Color Grade: ISO ${primarySlate?.iso || 800} • ${primarySlate?.colorGradeProfile || 'Kodak 2383 Print LUT (D60)'}

TECHNICAL MASTERING TELEMETRY:
• Export Preset: ${preset.name} (${preset.resolution} • ${preset.bitrateMbps} Mbps • ${preset.format})
• Optical Package: ${Array.from(lensesInBatch).join(', ') || '35mm Anamorphic Prime'}
• Motion Extrusion: ${Array.from(enginesInBatch).join(' + ') || 'Wan 2.1 Cinematic I2V'}
• Audio Mastering: -12.0 dB Automated Dialogue Ducking + Binaural Soundstage Foley

${hashtags.join(' ')}`;

  const uploadManifestJson = JSON.stringify(
    {
      schemaVersion: 'cineforge.youtube.v2',
      title: seoTitle,
      category: 'Film & Animation',
      visibility,
      syntheticMediaDisclosure: true,
      madeForKids: false,
      exportSpec: {
        presetName: preset.name,
        resolution: preset.resolution,
        aspectRatio: preset.aspectRatio,
        fps: preset.fps,
        bitrateMbps: preset.bitrateMbps,
        format: preset.format,
        estimatedFileSizeMb,
      },
      shotCount: selectedItems.length,
      totalDurationSec,
      directorsCutSlates,
      chapters: chapterMarkers,
      tags: youtubeTags,
      hashtags,
    },
    null,
    2
  );

  return {
    seoTitle,
    description,
    timestampsText,
    chapterMarkers,
    youtubeTags,
    hashtags,
    category: 'Film & Animation',
    visibility,
    syntheticMediaDisclosure: true,
    totalDurationSec,
    selectedShotCount: selectedItems.length,
    estimatedFileSizeMb,
    resolutionBadge,
    uploadManifestJson,
    directorsCutSlates,
  };
}
