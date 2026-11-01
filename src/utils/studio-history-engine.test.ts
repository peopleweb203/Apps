import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialHistoryStack,
  pushWorkspaceHistoryState,
  performWorkspaceUndo,
  performWorkspaceRedo,
  StudioWorkspaceSnapshot,
} from './studio-history-engine';
import {
  INITIAL_CHARACTERS,
  INITIAL_SETS,
  INITIAL_SCENES,
  INITIAL_FOLEY_TRACKS,
} from '../mock/studio-data';
import { DEFAULT_CINEMATIC_CONFIG } from './cinematic-video-pipeline';
import { BUILT_IN_RENDER_PRESETS } from './batch-render-queue';

function createMockSnapshot(): StudioWorkspaceSnapshot {
  return {
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
      lens: '35mm',
    },
    subtitleStyle: 'MR_BEAST',
    showSubtitles: true,
    foleyTracks: INITIAL_FOLEY_TRACKS,
    activeRenderPreset: BUILT_IN_RENDER_PRESETS[0],
    selectedThumbnailId: 'thumb-1',
  };
}

describe('Global Studio Undo/Redo History Engine', () => {
  it('initializes with empty past and future stacks and baseline snapshot', () => {
    const base = createMockSnapshot();
    const stack = createInitialHistoryStack(base);

    assert.equal(stack.past.length, 0);
    assert.equal(stack.future.length, 0);
    assert.equal(stack.present.snapshot.projectTitle, base.projectTitle);
    assert.equal(stack.present.actionLabel, 'Initial Studio Workspace');
  });

  it('records changes across panels and supports multi-step undo and redo', () => {
    const base = createMockSnapshot();
    let stack = createInitialHistoryStack(base);

    // Change 1: Aspect Ratio
    stack = pushWorkspaceHistoryState(
      stack,
      { ...stack.present.snapshot, aspectRatio: '9:16' },
      'Switch Aspect Ratio to 9:16'
    );
    assert.equal(stack.past.length, 1);
    assert.equal(stack.present.snapshot.aspectRatio, '9:16');

    // Change 2: Camera Lens in Stage Blocking
    stack = pushWorkspaceHistoryState(
      stack,
      {
        ...stack.present.snapshot,
        stageSetup: { ...stack.present.snapshot.stageSetup, lens: '85mm' },
      },
      'Set Stage Lens to 85mm'
    );
    assert.equal(stack.past.length, 2);
    assert.equal(stack.present.snapshot.stageSetup.lens, '85mm');

    // Undo Step 1 -> back to 35mm lens, still 9:16
    stack = performWorkspaceUndo(stack);
    assert.equal(stack.past.length, 1);
    assert.equal(stack.future.length, 1);
    assert.equal(stack.present.snapshot.stageSetup.lens, '35mm');
    assert.equal(stack.present.snapshot.aspectRatio, '9:16');

    // Undo Step 2 -> back to initial 16:9
    stack = performWorkspaceUndo(stack);
    assert.equal(stack.past.length, 0);
    assert.equal(stack.future.length, 2);
    assert.equal(stack.present.snapshot.aspectRatio, '16:9');

    // Redo Step 1 -> forward to 9:16
    stack = performWorkspaceRedo(stack);
    assert.equal(stack.past.length, 1);
    assert.equal(stack.future.length, 1);
    assert.equal(stack.present.snapshot.aspectRatio, '9:16');

    // Redo Step 2 -> forward to 85mm lens
    stack = performWorkspaceRedo(stack);
    assert.equal(stack.past.length, 2);
    assert.equal(stack.future.length, 0);
    assert.equal(stack.present.snapshot.stageSetup.lens, '85mm');
  });

  it('clears the redo future stack when a new edit is committed after an undo', () => {
    const base = createMockSnapshot();
    let stack = createInitialHistoryStack(base);

    stack = pushWorkspaceHistoryState(
      stack,
      { ...stack.present.snapshot, projectTitle: 'Draft 2' },
      'Rename Project'
    );
    stack = performWorkspaceUndo(stack);
    assert.equal(stack.future.length, 1);

    // Commit a new edit on a different panel
    stack = pushWorkspaceHistoryState(
      stack,
      { ...stack.present.snapshot, showSubtitles: false },
      'Toggle Subtitles Off'
    );
    assert.equal(stack.future.length, 0);
    assert.equal(stack.past.length, 1);
    assert.equal(stack.present.snapshot.showSubtitles, false);
  });

  it('ignores duplicate no-op state pushes and enforces maxHistoryDepth', () => {
    const base = createMockSnapshot();
    let stack = createInitialHistoryStack(base, 5);

    // Pushing identical snapshot should be a no-op
    const unchanged = pushWorkspaceHistoryState(stack, base, 'No-op');
    assert.equal(unchanged.past.length, 0);

    // Push 7 distinct updates into a stack with maxHistoryDepth = 5
    for (let i = 1; i <= 7; i++) {
      stack = pushWorkspaceHistoryState(
        stack,
        { ...stack.present.snapshot, projectTitle: `Edit #${i}` },
        `Rename #${i}`
      );
    }

    assert.equal(stack.past.length, 5);
    assert.equal(stack.present.snapshot.projectTitle, 'Edit #7');
  });
});
