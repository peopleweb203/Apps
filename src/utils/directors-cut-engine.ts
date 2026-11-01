import { DirectorsCutMetadata, SceneItem, ShotItem } from '../types';
import { AxisAnalysis, LensType } from './stage-math';

export const DIRECTORS_CUT_ISO_OPTIONS = [160, 400, 800, 1280, 1600, 3200, 6400] as const;

export const DIRECTORS_CUT_FOCAL_LENGTH_OPTIONS: LensType[] = [
  '24mm',
  '35mm',
  '50mm',
  '85mm',
  '100mm',
];

export const DIRECTORS_CUT_COLOR_GRADE_PROFILES = [
  'Kodak 2383 Print LUT (D60)',
  'Kodak Portra 400 Warm Halation',
  'Silver Halide Monochrome Contrast',
  'Teal & Amber Cyber-Noir (ACEScct)',
  'ARRI LogC4 Reveal 709',
  'Fujifilm Eterna 500T Bleach Bypass',
  'Panavision Anamorphic Halation 16-Bit',
] as const;

export type DirectorsCutColorGradeProfile =
  | (typeof DIRECTORS_CUT_COLOR_GRADE_PROFILES)[number]
  | string;

export const DEFAULT_DIRECTORS_CUT_METADATA: DirectorsCutMetadata = {
  directorName: 'Elena Vance',
  shootingDate: '2026-10-31',
  iso: 800,
  focalLength: '35mm',
  colorGradeProfile: 'Kodak 2383 Print LUT (D60)',
};

export interface DirectorsCutExportPreset {
  id: string;
  name: string;
  styleTag: string;
  description: string;
  isBuiltIn: boolean;
  metadata: DirectorsCutMetadata;
}

export const BUILT_IN_DIRECTORS_CUT_PRESETS: DirectorsCutExportPreset[] = [
  {
    id: 'dc-preset-film-noir',
    name: 'Film Noir',
    styleTag: 'MONOCHROME NOIR',
    description:
      'High-contrast silver halide chiaroscuro shadows, 35mm street prime, pushed ISO 3200 grain.',
    isBuiltIn: true,
    metadata: {
      directorName: 'Orson Welles / Noir Unit',
      shootingDate: '2026-10-31',
      iso: 3200,
      focalLength: '35mm',
      colorGradeProfile: 'Silver Halide Monochrome Contrast',
    },
  },
  {
    id: 'dc-preset-kodak-portra',
    name: 'Kodak Portra',
    styleTag: 'ANALOG WARMTH',
    description:
      'Golden-hour skin tones & warm halation, native ISO 400 fine grain, 50mm portrait prime.',
    isBuiltIn: true,
    metadata: {
      directorName: 'Sofia Coppola / Unit A',
      shootingDate: '2026-10-31',
      iso: 400,
      focalLength: '50mm',
      colorGradeProfile: 'Kodak Portra 400 Warm Halation',
    },
  },
  {
    id: 'dc-preset-cyber-noir',
    name: 'Cyber-Noir Anamorphic',
    styleTag: 'NEON ACEScct',
    description:
      'Split-toned teal & amber neon reflections, 24mm wide anamorphic prime at ISO 1600.',
    isBuiltIn: true,
    metadata: {
      directorName: 'Denis Villeneuve',
      shootingDate: '2026-10-31',
      iso: 1600,
      focalLength: '24mm',
      colorGradeProfile: 'Teal & Amber Cyber-Noir (ACEScct)',
    },
  },
  {
    id: 'dc-preset-kodak-2383',
    name: 'Kodak 2383 Print Master',
    styleTag: 'THEATRICAL D60',
    description:
      'Archival theatrical print stock with deep D60 blacks, native ISO 800, 35mm cinema prime.',
    isBuiltIn: true,
    metadata: {
      directorName: 'Elena Vance',
      shootingDate: '2026-10-31',
      iso: 800,
      focalLength: '35mm',
      colorGradeProfile: 'Kodak 2383 Print LUT (D60)',
    },
  },
];

export interface DirectorsCutShotExportEntry {
  shotId: string;
  shotNumber: number;
  sceneNumber?: number;
  sceneTitle?: string;
  durationSec: number;
  shotType?: string;
  cameraAction?: string;
  directorsCut: DirectorsCutMetadata;
}

export interface DirectorsCutBatchExportSidecar {
  sidecarFilename: string;
  sidecarJson: string;
  metadataList: DirectorsCutMetadata[];
  summaryLabel: string;
}

export interface FramingStateInput {
  shot?: ShotItem;
  scene?: Pick<SceneItem, 'id' | 'sceneNumber' | 'title' | 'timeOfDay' | 'lightingKelvin' | 'atmosphere'>;
  stageLens?: LensType;
  focalLengthMm?: number;
  aperture?: string;
  colorScience?: string;
  filmGrainIso?: number;
  volumetricHaze?: boolean;
  aspectRatio?: '16:9' | '9:16';
  timecode?: string;
  axisAnalysis?: Pick<AxisAnalysis, 'status' | 'cameraAngleDeg' | 'fovDeg' | 'distanceToAxis'>;
  directorNameOverride?: string;
  shootingDateOverride?: string;
}

export interface RealTimeShotLogEntry {
  logId: string;
  shotId: string;
  shotNumber: number;
  shotType: string;
  sceneNumber: number;
  sceneTitle: string;
  capturedAtTimecode: string;
  aspectRatio: '16:9' | '9:16';
  lightingKelvin: number;
  aperture: string;
  fovDeg: number;
  cameraAngleDeg: number;
  axisStatus: 'OPTIMAL' | 'WARNING_ON_LINE' | 'VIOLATION_CROSSED';
  directorsCut: DirectorsCutMetadata;
}

const VALID_LENS_SET = new Set<string>(DIRECTORS_CUT_FOCAL_LENGTH_OPTIONS);

/**
 * Snaps a raw numeric ISO value to the closest cinema native ISO stop in DIRECTORS_CUT_ISO_OPTIONS.
 */
export function snapToNearestCinemaIso(rawIso: number): number {
  if (!Number.isFinite(rawIso) || rawIso <= 0) {
    return DEFAULT_DIRECTORS_CUT_METADATA.iso;
  }
  let closest: number = DIRECTORS_CUT_ISO_OPTIONS[0];
  let smallestDiff = Math.abs(rawIso - closest);
  for (const candidate of DIRECTORS_CUT_ISO_OPTIONS) {
    const diff = Math.abs(rawIso - candidate);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = candidate;
    }
  }
  return closest;
}

/**
 * Deterministically derives the optimal cinema sensor ISO from the current framing lighting,
 * aperture, time-of-day, and volumetric haze state.
 */
export function deriveIsoFromFramingState(params: {
  timeOfDay?: SceneItem['timeOfDay'];
  lightingKelvin?: number;
  aperture?: string;
  filmGrainIso?: number;
  volumetricHaze?: boolean;
}): number {
  const { timeOfDay, lightingKelvin = 4500, aperture = 'f/1.8', filmGrainIso, volumetricHaze } = params;

  let baseIso = filmGrainIso && filmGrainIso > 0 ? filmGrainIso : 800;

  if (timeOfDay === 'NIGHT') {
    baseIso = Math.max(baseIso, 1600);
  } else if (timeOfDay === 'DUSK' || timeOfDay === 'DAWN') {
    baseIso = Math.max(baseIso, 1280);
  } else if (timeOfDay === 'DAY') {
    baseIso = Math.min(baseIso, 400);
  } else if (timeOfDay === 'INTERIOR_STUDIO') {
    baseIso = 800;
  }

  // Adjust for low color temperature / dim sodium-vapor or deep-blue moonlight
  if (lightingKelvin <= 3200) {
    baseIso *= 1.35;
  } else if (lightingKelvin >= 6000) {
    baseIso *= 0.85;
  }

  // Parse f-stop aperture (e.g. 'f/1.4', 'f/2.8', 'f/4.0')
  const fMatch = aperture.match(/(\d+(?:\.\d+)?)/);
  if (fMatch) {
    const fStop = parseFloat(fMatch[1]);
    if (fStop >= 4.0) {
      baseIso *= 2.0;
    } else if (fStop >= 2.8) {
      baseIso *= 1.4;
    } else if (fStop <= 1.4) {
      baseIso *= 0.75;
    }
  }

  if (volumetricHaze) {
    baseIso *= 1.2;
  }

  return snapToNearestCinemaIso(baseIso);
}

/**
 * Deterministically maps the live framing color science preset and scene lighting
 * to a Director's Cut color grade profile.
 */
export function deriveColorGradeProfileFromFramingState(params: {
  colorScience?: string;
  timeOfDay?: SceneItem['timeOfDay'];
  lightingKelvin?: number;
  atmosphere?: string;
}): string {
  const { colorScience, timeOfDay, lightingKelvin = 4500, atmosphere = '' } = params;
  const lowerAtmos = atmosphere.toLowerCase();

  switch (colorScience) {
    case 'teal-orange':
      return 'Teal & Amber Cyber-Noir (ACEScct)';
    case 'bleach-bypass':
      return 'Fujifilm Eterna 500T Bleach Bypass';
    case 'noir-monochrome':
      return 'Silver Halide Monochrome Contrast';
    case 'technicolor-3strip':
      return 'Panavision Anamorphic Halation 16-Bit';
    case 'kodak-500t':
      if (timeOfDay === 'NIGHT' || lowerAtmos.includes('neon') || lowerAtmos.includes('cyber')) {
        return 'Teal & Amber Cyber-Noir (ACEScct)';
      }
      if (lightingKelvin >= 5400) {
        return 'ARRI LogC4 Reveal 709';
      }
      return 'Kodak 2383 Print LUT (D60)';
    default:
      if (lowerAtmos.includes('rain') || lowerAtmos.includes('neon') || timeOfDay === 'NIGHT') {
        return 'Teal & Amber Cyber-Noir (ACEScct)';
      }
      if (lightingKelvin >= 5400) {
        return 'ARRI LogC4 Reveal 709';
      }
      return DEFAULT_DIRECTORS_CUT_METADATA.colorGradeProfile;
  }
}

/**
 * Captures and auto-populates Director's Cut metadata and a real-time shot logger telemetry entry
 * directly from the current PlayerCanvas / stage framing state.
 */
export function captureDirectorsCutFromFramingState(input: FramingStateInput): {
  metadata: DirectorsCutMetadata;
  logEntry: RealTimeShotLogEntry;
} {
  const {
    shot,
    scene,
    stageLens,
    focalLengthMm,
    aperture = 'f/1.8',
    colorScience,
    filmGrainIso,
    volumetricHaze,
    aspectRatio = '16:9',
    timecode = '00:00',
    axisAnalysis,
    directorNameOverride,
    shootingDateOverride,
  } = input;

  // Priority for focal length: active shot lens -> stage setup lens -> cinematicConfig focalLengthMm -> 35mm
  const rawFocal =
    shot?.focalLength ||
    stageLens ||
    (focalLengthMm ? `${Math.round(focalLengthMm)}mm` : DEFAULT_DIRECTORS_CUT_METADATA.focalLength);

  const derivedIso = deriveIsoFromFramingState({
    timeOfDay: scene?.timeOfDay,
    lightingKelvin: scene?.lightingKelvin,
    aperture,
    filmGrainIso,
    volumetricHaze,
  });

  const derivedGrade = deriveColorGradeProfileFromFramingState({
    colorScience,
    timeOfDay: scene?.timeOfDay,
    lightingKelvin: scene?.lightingKelvin,
    atmosphere: scene?.atmosphere,
  });

  const metadata = validateAndNormalizeDirectorsCutMetadata(
    {
      directorName:
        directorNameOverride ||
        shot?.directorsCut?.directorName ||
        DEFAULT_DIRECTORS_CUT_METADATA.directorName,
      shootingDate:
        shootingDateOverride ||
        shot?.directorsCut?.shootingDate ||
        DEFAULT_DIRECTORS_CUT_METADATA.shootingDate,
      iso: derivedIso,
      focalLength: rawFocal,
      colorGradeProfile: derivedGrade,
    },
    rawFocal
  );

  const logEntry: RealTimeShotLogEntry = {
    logId: `shot-log-${shot?.id || 'stage'}-${Date.now()}`,
    shotId: shot?.id || 'shot-1',
    shotNumber: shot?.shotNumber ?? 1,
    shotType: shot?.shotType || 'WIDE ESTABLISHING',
    sceneNumber: scene?.sceneNumber ?? 1,
    sceneTitle: scene?.title || 'Active Stage Framing',
    capturedAtTimecode: timecode,
    aspectRatio,
    lightingKelvin: scene?.lightingKelvin ?? 4500,
    aperture,
    fovDeg: axisAnalysis?.fovDeg ?? 54,
    cameraAngleDeg: Math.round(axisAnalysis?.cameraAngleDeg ?? 0),
    axisStatus: axisAnalysis?.status ?? 'OPTIMAL',
    directorsCut: metadata,
  };

  return { metadata, logEntry };
}

/**
 * One-click auto-population utility: captures framing-derived Director's Cut metadata
 * for every shot across all scenes in the project and returns updated scenes + log entries.
 */
export function autoPopulateAllScenesDirectorsCutFromFraming(
  scenes: SceneItem[],
  baseFraming: Omit<FramingStateInput, 'shot' | 'scene'>
): {
  updatedScenes: SceneItem[];
  entries: RealTimeShotLogEntry[];
} {
  const entries: RealTimeShotLogEntry[] = [];

  const updatedScenes = scenes.map((scene) => {
    const updatedShots = scene.shots.map((shot) => {
      const { metadata, logEntry } = captureDirectorsCutFromFramingState({
        ...baseFraming,
        shot,
        scene,
      });
      entries.push(logEntry);
      return {
        ...shot,
        directorsCut: metadata,
      };
    });
    return {
      ...scene,
      shots: updatedShots,
    };
  });

  return { updatedScenes, entries };
}

/**
 * Validates and normalizes custom Director's Cut cinematic metadata for a shot.
 */
export function validateAndNormalizeDirectorsCutMetadata(
  input: Partial<DirectorsCutMetadata>,
  fallbackFocalLength: string = DEFAULT_DIRECTORS_CUT_METADATA.focalLength
): DirectorsCutMetadata {
  const directorName =
    (input.directorName ?? '').trim() || DEFAULT_DIRECTORS_CUT_METADATA.directorName;

  const rawDate = (input.shootingDate ?? '').trim();
  const shootingDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : rawDate.length > 0
    ? rawDate
    : DEFAULT_DIRECTORS_CUT_METADATA.shootingDate;

  const parsedIso = Number(input.iso);
  const iso =
    Number.isFinite(parsedIso) && parsedIso > 0
      ? Math.max(50, Math.min(25600, Math.round(parsedIso)))
      : DEFAULT_DIRECTORS_CUT_METADATA.iso;

  const rawFocal = (input.focalLength ?? '').trim();
  const focalLength =
    rawFocal.length > 0
      ? /^\d+$/.test(rawFocal)
        ? `${rawFocal}mm`
        : rawFocal
      : fallbackFocalLength || DEFAULT_DIRECTORS_CUT_METADATA.focalLength;

  const colorGradeProfile =
    (input.colorGradeProfile ?? '').trim() ||
    DEFAULT_DIRECTORS_CUT_METADATA.colorGradeProfile;

  return {
    directorName,
    shootingDate,
    iso,
    focalLength,
    colorGradeProfile,
  };
}

/**
 * Resolves the active Director's Cut metadata for a given timeline shot,
 * falling back to sensible defaults derived from the shot's optical properties.
 */
export function resolveShotDirectorsCutMetadata(
  shot: Pick<ShotItem, 'focalLength' | 'directorsCut'>,
  fallback?: Partial<DirectorsCutMetadata>
): DirectorsCutMetadata {
  if (shot.directorsCut) {
    return validateAndNormalizeDirectorsCutMetadata(
      shot.directorsCut,
      shot.focalLength || DEFAULT_DIRECTORS_CUT_METADATA.focalLength
    );
  }

  return validateAndNormalizeDirectorsCutMetadata(
    {
      ...DEFAULT_DIRECTORS_CUT_METADATA,
      ...fallback,
      focalLength:
        fallback?.focalLength ||
        shot.focalLength ||
        DEFAULT_DIRECTORS_CUT_METADATA.focalLength,
    },
    shot.focalLength
  );
}

/**
 * Formats a concise human-readable slate badge for a shot's Director's Cut metadata.
 */
export function formatDirectorsCutSlateBadge(meta: DirectorsCutMetadata): string {
  return `Dir. ${meta.directorName} • ${meta.shootingDate} • ISO ${meta.iso} • ${meta.focalLength} • ${meta.colorGradeProfile}`;
}

/**
 * Attaches or updates custom Director's Cut cinematic metadata on an individual shot inside a SceneItem[].
 * Optionally syncs the shot's optical `focalLength` when it matches a standard LensType.
 */
export function attachDirectorsCutToShotInScenes(
  scenes: SceneItem[],
  shotId: string,
  metadataPatch: Partial<DirectorsCutMetadata>,
  syncOpticalLens: boolean = true
): SceneItem[] {
  return scenes.map((scene) => {
    let sceneModified = false;
    const updatedShots = scene.shots.map((shot) => {
      if (shot.id !== shotId) return shot;
      sceneModified = true;
      const currentMeta = resolveShotDirectorsCutMetadata(shot);
      const nextMeta = validateAndNormalizeDirectorsCutMetadata(
        {
          ...currentMeta,
          ...metadataPatch,
        },
        shot.focalLength
      );

      const nextLens: LensType =
        syncOpticalLens && VALID_LENS_SET.has(nextMeta.focalLength)
          ? (nextMeta.focalLength as LensType)
          : shot.focalLength;

      return {
        ...shot,
        focalLength: nextLens,
        directorsCut: nextMeta,
      };
    });

    return sceneModified ? { ...scene, shots: updatedShots } : scene;
  });
}

/**
 * Attaches or merges custom Director's Cut metadata across a batch of selected timeline shot IDs.
 */
export function attachDirectorsCutToBatchShotsInScenes(
  scenes: SceneItem[],
  shotIds: string[],
  metadataPatch: Partial<DirectorsCutMetadata>,
  syncOpticalLens: boolean = true
): SceneItem[] {
  const targetSet = new Set(shotIds);
  if (targetSet.size === 0) return scenes;

  return scenes.map((scene) => {
    let sceneModified = false;
    const updatedShots = scene.shots.map((shot) => {
      if (!targetSet.has(shot.id)) return shot;
      sceneModified = true;
      const currentMeta = resolveShotDirectorsCutMetadata(shot);
      const nextMeta = validateAndNormalizeDirectorsCutMetadata(
        {
          ...currentMeta,
          ...metadataPatch,
        },
        shot.focalLength
      );

      const nextLens: LensType =
        syncOpticalLens && VALID_LENS_SET.has(nextMeta.focalLength)
          ? (nextMeta.focalLength as LensType)
          : shot.focalLength;

      return {
        ...shot,
        focalLength: nextLens,
        directorsCut: nextMeta,
      };
    });

    return sceneModified ? { ...scene, shots: updatedShots } : scene;
  });
}

/**
 * Generates a sidecar export package (`*.directors-cut.json`) and metadata summary
 * to be exported alongside the rendered video file during batch processing.
 */
export function buildDirectorsCutBatchExportSidecar(params: {
  taskTitle: string;
  videoFilename?: string;
  resolution: string;
  exportFormat: string;
  bitrateMbps: number;
  shots: DirectorsCutShotExportEntry[];
}): DirectorsCutBatchExportSidecar {
  const {
    taskTitle,
    videoFilename,
    resolution,
    exportFormat,
    bitrateMbps,
    shots,
  } = params;

  const sanitizedSlug = (videoFilename || taskTitle || 'timeline_export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);

  const containerExt = exportFormat.toLowerCase().includes('mov')
    ? 'mov'
    : exportFormat.toLowerCase().includes('mkv')
    ? 'mkv'
    : exportFormat.toLowerCase().includes('webm')
    ? 'webm'
    : 'mp4';

  const resolvedVideoFile = `${sanitizedSlug || 'shot_master'}.${containerExt}`;
  const sidecarFilename = `${sanitizedSlug || 'shot_master'}.directors-cut.json`;

  const metadataList = shots.map((entry) =>
    validateAndNormalizeDirectorsCutMetadata(entry.directorsCut)
  );

  const primaryMeta = metadataList[0] || DEFAULT_DIRECTORS_CUT_METADATA;
  const summaryLabel =
    metadataList.length <= 1
      ? formatDirectorsCutSlateBadge(primaryMeta)
      : `Dir. ${primaryMeta.directorName} • ${metadataList.length} Shot Slates • ISO ${primaryMeta.iso} • ${primaryMeta.colorGradeProfile}`;

  const payload = {
    schemaVersion: '1.0.0-directors-cut',
    exportedAlongsideVideoFile: resolvedVideoFile,
    sidecarFilename,
    batchRenderSpec: {
      taskTitle,
      resolution,
      exportFormat,
      bitrateMbps,
      shotCount: shots.length,
    },
    directorsCutSummary: {
      primaryDirector: primaryMeta.directorName,
      shootingDate: primaryMeta.shootingDate,
      primaryIso: primaryMeta.iso,
      primaryFocalLength: primaryMeta.focalLength,
      primaryColorGradeProfile: primaryMeta.colorGradeProfile,
    },
    shotSlates: shots.map((s, idx) => ({
      sequenceOrder: idx + 1,
      shotId: s.shotId,
      sceneNumber: s.sceneNumber ?? 1,
      sceneTitle: s.sceneTitle ?? 'Scene Sequence',
      shotNumber: s.shotNumber,
      durationSec: s.durationSec,
      shotType: s.shotType ?? 'CINEMATIC SHOT',
      cameraAction: s.cameraAction ?? 'Locked Camera',
      directorsCutMetadata: validateAndNormalizeDirectorsCutMetadata(s.directorsCut),
    })),
  };

  return {
    sidecarFilename,
    sidecarJson: JSON.stringify(payload, null, 2),
    metadataList,
    summaryLabel,
  };
}

/**
 * Creates a normalized custom Director's Cut Export Preset from a user-provided name and metadata combination.
 */
export function createDirectorsCutExportPreset(params: {
  name: string;
  styleTag?: string;
  description?: string;
  metadata: Partial<DirectorsCutMetadata>;
}): DirectorsCutExportPreset {
  const cleanName = (params.name || '').trim() || 'Custom Director Look';
  const normalizedMeta = validateAndNormalizeDirectorsCutMetadata(params.metadata);
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  const styleTag =
    (params.styleTag || '').trim().toUpperCase() ||
    `ISO ${normalizedMeta.iso} • ${normalizedMeta.focalLength.toUpperCase()}`;

  const description =
    (params.description || '').trim() ||
    `Dir. ${normalizedMeta.directorName} • ${normalizedMeta.focalLength} at ISO ${normalizedMeta.iso} • ${normalizedMeta.colorGradeProfile}`;

  return {
    id: `dc-preset-custom-${slug || 'look'}-${Date.now()}`,
    name: cleanName,
    styleTag,
    description,
    isBuiltIn: false,
    metadata: normalizedMeta,
  };
}

/**
 * Saves or updates a custom preset in the preset list (replacing if a custom preset has the same case-insensitive name).
 */
export function saveDirectorsCutPresetToList(
  presets: DirectorsCutExportPreset[],
  newPreset: DirectorsCutExportPreset
): DirectorsCutExportPreset[] {
  const existingCustomIdx = presets.findIndex(
    (p) => !p.isBuiltIn && p.name.toLowerCase() === newPreset.name.toLowerCase()
  );

  if (existingCustomIdx >= 0) {
    const updated = [...presets];
    updated[existingCustomIdx] = {
      ...newPreset,
      id: presets[existingCustomIdx].id,
      isBuiltIn: false,
    };
    return updated;
  }

  return [...presets, { ...newPreset, isBuiltIn: false }];
}

/**
 * Removes a user-saved custom preset by ID while protecting built-in presets (e.g. 'Film Noir', 'Kodak Portra').
 */
export function deleteDirectorsCutPresetFromList(
  presets: DirectorsCutExportPreset[],
  presetId: string
): DirectorsCutExportPreset[] {
  return presets.filter((p) => p.isBuiltIn || p.id !== presetId);
}

/**
 * Applies a Director's Cut Export Preset's metadata combination directly to an individual shot.
 */
export function applyDirectorsCutPresetToShot(
  scenes: SceneItem[],
  shotId: string,
  preset: DirectorsCutExportPreset
): SceneItem[] {
  return attachDirectorsCutToShotInScenes(scenes, shotId, preset.metadata, true);
}

/**
 * Applies a Director's Cut Export Preset's metadata combination across multiple timeline shots.
 */
export function applyDirectorsCutPresetToBatchShots(
  scenes: SceneItem[],
  shotIds: string[],
  preset: DirectorsCutExportPreset
): SceneItem[] {
  return attachDirectorsCutToBatchShotsInScenes(scenes, shotIds, preset.metadata, true);
}

