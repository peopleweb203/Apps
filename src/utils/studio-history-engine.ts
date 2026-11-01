import {
  CharacterProfile,
  SetLockerPlate,
  SceneItem,
  FoleyTrack,
} from '../types';
import { Point2D, LensType } from './stage-math';
import { SubtitleStyle } from './timeline-engine';
import { CinematicPipelineConfig } from './cinematic-video-pipeline';
import { RenderExportPreset } from './batch-render-queue';

export interface StudioWorkspaceSnapshot {
  projectTitle: string;
  aspectRatio: '16:9' | '9:16';
  cinematicConfig: CinematicPipelineConfig;
  characters: CharacterProfile[];
  sets: SetLockerPlate[];
  scenes: SceneItem[];
  selectedShotId: string;
  stageSetup: {
    actorA: Point2D;
    actorB: Point2D;
    camera: Point2D;
    referenceSide: number;
    lens: LensType;
  };
  subtitleStyle: SubtitleStyle;
  showSubtitles: boolean;
  foleyTracks: FoleyTrack[];
  activeRenderPreset: RenderExportPreset;
  selectedThumbnailId: string;
}

export interface StudioHistoryEntry {
  id: string;
  actionLabel: string;
  timestamp: string;
  snapshot: StudioWorkspaceSnapshot;
}

export interface StudioHistoryStack {
  past: StudioHistoryEntry[];
  present: StudioHistoryEntry;
  future: StudioHistoryEntry[];
  maxHistoryDepth: number;
}

/**
 * Deep-clones a StudioWorkspaceSnapshot to guarantee immutability across undo/redo history entries
 */
export function cloneWorkspaceSnapshot(snapshot: StudioWorkspaceSnapshot): StudioWorkspaceSnapshot {
  return JSON.parse(JSON.stringify(snapshot));
}

/**
 * Initializes a new StudioHistoryStack with an initial baseline snapshot
 */
export function createInitialHistoryStack(
  initialSnapshot: StudioWorkspaceSnapshot,
  maxHistoryDepth: number = 50
): StudioHistoryStack {
  return {
    past: [],
    present: {
      id: `hist-init-${Date.now()}`,
      actionLabel: 'Initial Studio Workspace',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      snapshot: cloneWorkspaceSnapshot(initialSnapshot),
    },
    future: [],
    maxHistoryDepth: Math.max(5, maxHistoryDepth),
  };
}

/**
 * Pushes a new workspace state onto the history stack, clearing any redo future branch
 */
export function pushWorkspaceHistoryState(
  stack: StudioHistoryStack,
  nextSnapshot: StudioWorkspaceSnapshot,
  actionLabel: string = 'Workspace Update'
): StudioHistoryStack {
  const clonedNext = cloneWorkspaceSnapshot(nextSnapshot);

  // Avoid recording no-op identical snapshots
  if (JSON.stringify(stack.present.snapshot) === JSON.stringify(clonedNext)) {
    return stack;
  }

  const nextPast = [...stack.past, stack.present];
  const trimmedPast =
    nextPast.length > stack.maxHistoryDepth
      ? nextPast.slice(nextPast.length - stack.maxHistoryDepth)
      : nextPast;

  const nextPresent: StudioHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actionLabel: actionLabel.trim() || 'Workspace Update',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    snapshot: clonedNext,
  };

  return {
    ...stack,
    past: trimmedPast,
    present: nextPresent,
    future: [],
  };
}

/**
 * Reverts the workspace to the most recent past entry and moves current present into future
 */
export function performWorkspaceUndo(stack: StudioHistoryStack): StudioHistoryStack {
  if (stack.past.length === 0) {
    return stack;
  }

  const previousEntry = stack.past[stack.past.length - 1];
  const remainingPast = stack.past.slice(0, stack.past.length - 1);

  return {
    ...stack,
    past: remainingPast,
    present: {
      ...previousEntry,
      snapshot: cloneWorkspaceSnapshot(previousEntry.snapshot),
    },
    future: [
      {
        ...stack.present,
        snapshot: cloneWorkspaceSnapshot(stack.present.snapshot),
      },
      ...stack.future,
    ],
  };
}

/**
 * Advances the workspace to the next future entry after an undo
 */
export function performWorkspaceRedo(stack: StudioHistoryStack): StudioHistoryStack {
  if (stack.future.length === 0) {
    return stack;
  }

  const nextEntry = stack.future[0];
  const remainingFuture = stack.future.slice(1);

  return {
    ...stack,
    past: [
      ...stack.past,
      {
        ...stack.present,
        snapshot: cloneWorkspaceSnapshot(stack.present.snapshot),
      },
    ],
    present: {
      ...nextEntry,
      snapshot: cloneWorkspaceSnapshot(nextEntry.snapshot),
    },
    future: remainingFuture,
  };
}
