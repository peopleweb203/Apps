import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sampleHardwareTelemetry,
  appendTelemetrySample,
  evaluateHardwareHealth,
  buildSparklineSvgPaths,
  DEFAULT_HARDWARE_OPTIMIZATION,
} from './hardware-health-monitor';
import { RenderTask } from '../types';

describe('Hardware Health Monitor & 4K Render Optimization Engine', () => {
  const sampleTasks: RenderTask[] = [
    {
      id: 'task-1',
      type: 'SCENE_BATCH_RENDER',
      title: 'Scene 1: 4K Master',
      progress: 45,
      status: 'PROCESSING',
      startedAt: 'Now',
      shotCount: 3,
    },
    {
      id: 'task-2',
      type: 'SCENE_BATCH_RENDER',
      title: 'Scene 2: 4K Master',
      progress: 0,
      status: 'QUEUED',
      startedAt: 'Queued',
      shotCount: 2,
    },
  ];

  it('samples higher GPU, VRAM, and thread throughput under 4K/5K batch processing than 720p idle', () => {
    const idle720p = sampleHardwareTelemetry(
      {
        qualityPreset: 'draft-720p',
        isBatchProcessing: false,
        renderTasks: [],
        isPlaying: false,
        jitterSeed: 1,
      },
      1000
    );

    const active4k = sampleHardwareTelemetry(
      {
        qualityPreset: 'master-4k',
        isBatchProcessing: true,
        renderTasks: sampleTasks,
        isPlaying: true,
        jitterSeed: 1,
      },
      1000
    );

    assert.ok(active4k.gpuUtilizationPct > idle720p.gpuUtilizationPct);
    assert.ok(active4k.vramUsedGb > idle720p.vramUsedGb);
    assert.ok(active4k.renderMemoryMb > idle720p.renderMemoryMb);
    assert.ok(active4k.threadThroughputOps > idle720p.threadThroughputOps);
  });

  it('reduces VRAM and render memory footprint when VRAM Tile-Splitting and Cache Purge are applied', () => {
    const now = 50000;
    const unoptimized = sampleHardwareTelemetry(
      {
        qualityPreset: 'master-4k',
        isBatchProcessing: true,
        renderTasks: sampleTasks,
        isPlaying: false,
        optimization: {
          vramTileSplitting: false,
          tensorFp16Quantization: false,
          lastCachePurgeTimestamp: null,
        },
        jitterSeed: 2,
      },
      now
    );

    const optimized = sampleHardwareTelemetry(
      {
        qualityPreset: 'master-4k',
        isBatchProcessing: true,
        renderTasks: sampleTasks,
        isPlaying: false,
        optimization: {
          vramTileSplitting: true,
          tensorFp16Quantization: true,
          lastCachePurgeTimestamp: now - 1000,
        },
        jitterSeed: 2,
      },
      now
    );

    assert.ok(optimized.vramUsedGb < unoptimized.vramUsedGb);
    assert.ok(optimized.renderMemoryMb < unoptimized.renderMemoryMb);
    assert.ok(optimized.frameTimeMs < unoptimized.frameTimeMs);
  });

  it('maintains bounded rolling window in appendTelemetrySample and evaluates bottleneck status', () => {
    let history = [];
    for (let i = 0; i < 30; i++) {
      const sample = sampleHardwareTelemetry(
        {
          qualityPreset: 'ultra-5k',
          isBatchProcessing: true,
          renderTasks: sampleTasks,
          isPlaying: true,
          jitterSeed: i,
        },
        1000 + i * 1000
      );
      history = appendTelemetrySample(history, sample, 24);
    }

    assert.equal(history.length, 24);
    const evaluation = evaluateHardwareHealth(history[history.length - 1], DEFAULT_HARDWARE_OPTIMIZATION);
    assert.ok(['OPTIMAL', 'ELEVATED', 'BOTTLENECK'].includes(evaluation.status));
    assert.ok(evaluation.vramUtilizationPct > 0);
    assert.ok(evaluation.estimated4KFps >= 12);
  });

  it('builds valid SVG line and closed area paths for sparkline rendering', () => {
    const values = [35, 48, 62, 74, 68, 82];
    const svg = buildSparklineSvgPaths(values, 120, 28, 0, 100);

    assert.ok(svg.linePath.startsWith('M 0 '));
    assert.ok(svg.areaPath.endsWith('Z'));
    assert.equal(svg.lastPoint.x, 120);
  });
});
