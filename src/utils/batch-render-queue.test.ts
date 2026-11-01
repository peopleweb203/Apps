import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileScenesToBatchTasks,
  calculateBatchQueueSummary,
  advanceTaskProgressStep,
  resolveStageLabelForProgress,
  resolveSceneThumbnails,
  BUILT_IN_RENDER_PRESETS,
  createCustomRenderPreset,
  applyPresetToQueuedTasks,
  estimateBatchOutputSizeMb,
} from './batch-render-queue';
import { INITIAL_SCENES } from '../mock/studio-data';
import { RenderTask } from '../types';

describe('Batch Render Queue Engine', () => {
  it('compiles multiple scenes into queued batch tasks with scene metadata and thumbnail previews', () => {
    const tasks = compileScenesToBatchTasks(INITIAL_SCENES, [], '2.39:1');
    assert.equal(tasks.length, INITIAL_SCENES.length);
    assert.equal(tasks[0].status, 'QUEUED');
    assert.equal(tasks[0].progress, 0);
    assert.ok(tasks[0].sceneId);
    assert.ok((tasks[0].shotCount ?? 0) > 0);
    assert.ok(tasks[0].thumbnailUrl && tasks[0].thumbnailUrl.startsWith('http'));
    assert.ok(Array.isArray(tasks[0].shotThumbnails) && tasks[0].shotThumbnails.length > 0);
    assert.equal(tasks[0].resolution, BUILT_IN_RENDER_PRESETS[0].resolution);
    assert.equal(tasks[0].bitrateMbps, BUILT_IN_RENDER_PRESETS[0].bitrateMbps);
    assert.equal(tasks[0].exportFormat, BUILT_IN_RENDER_PRESETS[0].format);
  });

  it('resolves primary and multi-shot thumbnails from scene keyframes', () => {
    const resolved = resolveSceneThumbnails(INITIAL_SCENES[0]);
    assert.equal(resolved.thumbnailUrl, INITIAL_SCENES[0].shots[0].approvedKeyframeUrl);
    assert.equal(resolved.shotThumbnails.length, INITIAL_SCENES[0].shots.length);
  });

  it('prevents duplicate queuing of scenes already in QUEUED or PROCESSING state', () => {
    const firstPass = compileScenesToBatchTasks(INITIAL_SCENES, [], '2.39:1');
    const secondPass = compileScenesToBatchTasks(INITIAL_SCENES, firstPass, '2.39:1');
    assert.equal(secondPass.length, firstPass.length);
  });

  it('advances individual task progress through processing stages to completion', () => {
    const initialTask: RenderTask = {
      id: 'task-test-1',
      type: '4K_EXPORT',
      title: 'Scene #1 Batch Render',
      progress: 0,
      status: 'QUEUED',
      startedAt: 'Queued',
      sceneId: 'scene-1',
      sceneNumber: 1,
    };

    const step1 = advanceTaskProgressStep(initialTask, 30);
    assert.equal(step1.progress, 30);
    assert.equal(step1.status, 'PROCESSING');
    assert.ok(step1.stageLabel?.includes('Stage 1'));

    const step2 = advanceTaskProgressStep(step1, 35);
    assert.equal(step2.progress, 65);
    assert.equal(step2.status, 'PROCESSING');
    assert.ok(step2.stageLabel?.includes('Stage 2'));

    const step3 = advanceTaskProgressStep(step2, 40);
    assert.equal(step3.progress, 100);
    assert.equal(step3.status, 'COMPLETED');
    assert.equal(step3.stageLabel, '4K DCI Master Verified');
  });

  it('calculates accurate batch queue summary and overall progress percentage', () => {
    const tasks: RenderTask[] = [
      {
        id: 't1',
        type: '4K_EXPORT',
        title: 'Scene 1',
        progress: 100,
        status: 'COMPLETED',
        startedAt: '1m ago',
        sceneId: 'scene-1',
      },
      {
        id: 't2',
        type: '4K_EXPORT',
        title: 'Scene 2',
        progress: 50,
        status: 'PROCESSING',
        startedAt: 'Just now',
        sceneId: 'scene-2',
      },
      {
        id: 't3',
        type: '4K_EXPORT',
        title: 'Scene 3',
        progress: 0,
        status: 'QUEUED',
        startedAt: 'Queued',
        sceneId: 'scene-3',
      },
    ];

    const summary = calculateBatchQueueSummary(tasks);
    assert.equal(summary.totalTasks, 3);
    assert.equal(summary.completedCount, 1);
    assert.equal(summary.processingCount, 1);
    assert.equal(summary.queuedCount, 1);
    assert.equal(summary.overallProgressPercent, 50);
    assert.equal(summary.isBatchComplete, false);
    assert.equal(summary.uniqueSceneCount, 3);
  });

  it('resolves stage labels appropriately across all task types', () => {
    assert.equal(resolveStageLabelForProgress(0, 'KEYFRAME_STAGING'), 'Queued in Batch Buffer');
    assert.ok(resolveStageLabelForProgress(50, 'MOTION_EXTRUSION').includes('Stage 2'));
    assert.equal(resolveStageLabelForProgress(100, 'LIP_SYNC'), '4K DCI Master Verified');
  });

  it('creates custom render presets and applies loaded preset settings to queued tasks', () => {
    const custom = createCustomRenderPreset('IMAX Archival 140M', {
      resolution: '4K DCI (4096x1716)',
      bitrateMbps: 140,
      format: 'MOV (ProRes 422 HQ)',
      aspectRatio: '2.39:1',
      fps: 24,
    });

    assert.equal(custom.name, 'IMAX Archival 140M');
    assert.equal(custom.bitrateMbps, 140);
    assert.equal(custom.isBuiltIn, false);

    const initialTasks = compileScenesToBatchTasks(INITIAL_SCENES, [], '2.39:1');
    const updatedTasks = applyPresetToQueuedTasks(initialTasks, custom);

    assert.equal(updatedTasks[0].presetName, 'IMAX Archival 140M');
    assert.equal(updatedTasks[0].bitrateMbps, 140);
    assert.equal(updatedTasks[0].resolution, '4K DCI (4096x1716)');
    assert.equal(updatedTasks[0].exportFormat, 'MOV (ProRes 422 HQ)');

    const estMb = estimateBatchOutputSizeMb(updatedTasks, custom, 4);
    assert.ok(estMb > 0);
  });
});

