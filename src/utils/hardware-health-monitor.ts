import { QualityPreset } from './cinematic-video-pipeline';
import { RenderTask } from '../types';

export interface HardwareTelemetrySample {
  timestamp: number;
  /** GPU core compute load percentage (0 - 100) */
  gpuUtilizationPct: number;
  /** Dedicated VRAM used in GB (out of totalVramGb, e.g., 24 GB) */
  vramUsedGb: number;
  /** Total VRAM capacity in GB */
  totalVramGb: number;
  /** Rendering memory (frame buffers, 4K LUTs, latent tensors) in MB */
  renderMemoryMb: number;
  /** Max allocated render heap in MB */
  maxRenderMemoryMb: number;
  /** Background worker thread throughput in ops/sec */
  threadThroughputOps: number;
  /** Active worker threads count */
  activeThreads: number;
  /** Total worker thread pool capacity */
  maxThreads: number;
  /** Estimated 4K frame render latency in ms */
  frameTimeMs: number;
}

export interface HardwareOptimizationState {
  vramTileSplitting: boolean;
  tensorFp16Quantization: boolean;
  lastCachePurgeTimestamp: number | null;
}

export interface HardwareHealthEvaluation {
  status: 'OPTIMAL' | 'ELEVATED' | 'BOTTLENECK';
  headline: string;
  recommendation: string;
  estimated4KFps: number;
  vramUtilizationPct: number;
  renderMemoryPct: number;
  threadUtilizationPct: number;
}

export interface TelemetryInputContext {
  qualityPreset: QualityPreset;
  isBatchProcessing: boolean;
  renderTasks: RenderTask[];
  isPlaying: boolean;
  bitrateMbps?: number;
  optimization?: HardwareOptimizationState;
  jitterSeed?: number;
}

export const DEFAULT_HARDWARE_OPTIMIZATION: HardwareOptimizationState = {
  vramTileSplitting: false,
  tensorFp16Quantization: true,
  lastCachePurgeTimestamp: null,
};

/**
 * Generates a realistic, context-sensitive hardware telemetry sample based on active
 * 4K/5K rendering workload, queued/processing tasks, and hardware optimization switches.
 */
export function sampleHardwareTelemetry(
  ctx: TelemetryInputContext,
  timestamp: number = Date.now()
): HardwareTelemetrySample {
  const totalVramGb = 24;
  const maxRenderMemoryMb = 16384; // 16 GB Dedicated Render Heap
  const maxThreads = 16;

  const processingCount = ctx.renderTasks.filter((t) => t.status === 'PROCESSING').length;
  const queuedCount = ctx.renderTasks.filter((t) => t.status === 'QUEUED').length;

  // Baseline load by quality preset
  const presetMultipliers: Record<
    QualityPreset,
    { gpuBase: number; vramBase: number; memBase: number; opsBase: number; frameMs: number }
  > = {
    'draft-720p': { gpuBase: 24, vramBase: 5.2, memBase: 2800, opsBase: 420, frameMs: 14 },
    'hd-1080p': { gpuBase: 42, vramBase: 8.8, memBase: 5100, opsBase: 680, frameMs: 24 },
    'master-4k': { gpuBase: 68, vramBase: 15.4, memBase: 9800, opsBase: 1120, frameMs: 42 },
    'ultra-5k': { gpuBase: 82, vramBase: 19.6, memBase: 12900, opsBase: 1450, frameMs: 58 },
  };

  const base = presetMultipliers[ctx.qualityPreset] || presetMultipliers['master-4k'];

  // Deterministic micro-oscillation based on timestamp or jitterSeed
  const seed = ctx.jitterSeed !== undefined ? ctx.jitterSeed : (timestamp % 10000) / 1000;
  const waveA = Math.sin(seed * 1.7) * 3.2;
  const waveB = Math.cos(seed * 2.3) * 2.1;

  // Workload boosts
  const batchBoostGpu = ctx.isBatchProcessing ? 18 : 0;
  const taskBoostGpu = processingCount * 7 + Math.min(queuedCount, 4) * 1.5;
  const playbackBoostGpu = ctx.isPlaying ? 6 : 0;

  // Optimization reliefs
  const opt = ctx.optimization || DEFAULT_HARDWARE_OPTIMIZATION;
  const tileVramSavingsGb = opt.vramTileSplitting ? 3.1 : 0;
  const fp16GpuSavings = opt.tensorFp16Quantization ? 5 : -6;
  const recentlyPurged =
    opt.lastCachePurgeTimestamp !== null && timestamp - opt.lastCachePurgeTimestamp < 60000;
  const purgeMemorySavingsMb = recentlyPurged ? 2100 : 0;

  const rawGpu =
    base.gpuBase + batchBoostGpu + taskBoostGpu + playbackBoostGpu - fp16GpuSavings + waveA;
  const gpuUtilizationPct = Math.round(Math.max(8, Math.min(99, rawGpu)) * 10) / 10;

  const rawVram =
    base.vramBase +
    (ctx.isBatchProcessing ? 2.8 : 0) +
    processingCount * 1.1 -
    tileVramSavingsGb +
    waveB * 0.18;
  const vramUsedGb = Math.round(Math.max(2.4, Math.min(totalVramGb - 0.3, rawVram)) * 100) / 100;

  const rawMem =
    base.memBase +
    (ctx.isBatchProcessing ? 2400 : 0) +
    processingCount * 650 +
    queuedCount * 180 -
    purgeMemorySavingsMb +
    waveA * 45;
  const renderMemoryMb = Math.round(Math.max(1200, Math.min(maxRenderMemoryMb - 256, rawMem)));

  const activeThreads = Math.min(
    maxThreads,
    Math.max(
      2,
      (ctx.qualityPreset === 'ultra-5k' ? 10 : ctx.qualityPreset === 'master-4k' ? 8 : 4) +
        (ctx.isBatchProcessing ? 6 : 0) +
        processingCount * 2
    )
  );

  const rawThroughput =
    base.opsBase +
    (ctx.isBatchProcessing ? 540 : 0) +
    processingCount * 210 +
    (opt.tensorFp16Quantization ? 130 : 0) +
    waveB * 28;
  const threadThroughputOps = Math.round(Math.max(120, rawThroughput));

  const rawFrameMs =
    base.frameMs +
    (ctx.isBatchProcessing ? 11 : 0) -
    (opt.vramTileSplitting ? 5 : 0) -
    (opt.tensorFp16Quantization ? 4 : 0) -
    (recentlyPurged ? 3 : 0);
  const frameTimeMs = Math.max(8, Math.round(rawFrameMs));

  return {
    timestamp,
    gpuUtilizationPct,
    vramUsedGb,
    totalVramGb,
    renderMemoryMb,
    maxRenderMemoryMb,
    threadThroughputOps,
    activeThreads,
    maxThreads,
    frameTimeMs,
  };
}

/**
 * Appends a new sample to a rolling sparkline history buffer of fixed maximum length.
 */
export function appendTelemetrySample(
  history: HardwareTelemetrySample[],
  nextSample: HardwareTelemetrySample,
  maxSamples: number = 24
): HardwareTelemetrySample[] {
  const combined = [...history, nextSample];
  if (combined.length <= maxSamples) return combined;
  return combined.slice(combined.length - maxSamples);
}

/**
 * Evaluates current hardware health & provides actionable 4K/5K rendering optimization guidance.
 */
export function evaluateHardwareHealth(
  sample: HardwareTelemetrySample,
  optimization: HardwareOptimizationState = DEFAULT_HARDWARE_OPTIMIZATION
): HardwareHealthEvaluation {
  const vramUtilizationPct = Math.round((sample.vramUsedGb / sample.totalVramGb) * 100);
  const renderMemoryPct = Math.round((sample.renderMemoryMb / sample.maxRenderMemoryMb) * 100);
  const threadUtilizationPct = Math.round((sample.activeThreads / sample.maxThreads) * 100);
  const estimated4KFps = Math.max(12, Math.min(120, Math.round(1000 / sample.frameTimeMs)));

  if (sample.gpuUtilizationPct >= 90 || vramUtilizationPct >= 88 || renderMemoryPct >= 85) {
    const rec = !optimization.vramTileSplitting
      ? 'Enable 4K VRAM Tile-Splitting or purge the render frame cache to prevent tensor spill.'
      : 'Purge stale 4K keyframe buffers to reclaim immediate VRAM headroom.';
    return {
      status: 'BOTTLENECK',
      headline: 'High 4K/5K VRAM Pressure Detected',
      recommendation: rec,
      estimated4KFps,
      vramUtilizationPct,
      renderMemoryPct,
      threadUtilizationPct,
    };
  }

  if (sample.gpuUtilizationPct >= 75 || vramUtilizationPct >= 70 || renderMemoryPct >= 68) {
    return {
      status: 'ELEVATED',
      headline: 'Active 4K Mastering Load (Nominal Headroom)',
      recommendation: !optimization.vramTileSplitting
        ? 'Toggle VRAM Tile-Splitting for +15% faster 4K anamorphic batch exports.'
        : 'Hardware pipeline balanced for continuous 4K ProRes / H.265 mastering.',
      estimated4KFps,
      vramUtilizationPct,
      renderMemoryPct,
      threadUtilizationPct,
    };
  }

  return {
    status: 'OPTIMAL',
    headline: 'Optimal 4K/5K Render Headroom',
    recommendation: 'GPU & worker threads have ample capacity for parallel 4K scene extrusion.',
    estimated4KFps,
    vramUtilizationPct,
    renderMemoryPct,
    threadUtilizationPct,
  };
}

/**
 * Builds SVG polyline points and closed area path strings for a real-time sparkline.
 */
export function buildSparklineSvgPaths(
  values: number[],
  width: number = 140,
  height: number = 32,
  minDomain: number = 0,
  maxDomain: number = 100
): { linePath: string; areaPath: string; lastPoint: { x: number; y: number } } {
  if (values.length === 0) {
    return {
      linePath: `M 0 ${height} L ${width} ${height}`,
      areaPath: `M 0 ${height} L ${width} ${height} Z`,
      lastPoint: { x: width, y: height },
    };
  }

  const safeSpan = Math.max(1e-5, maxDomain - minDomain);
  const count = values.length;
  const stepX = count > 1 ? width / (count - 1) : width;

  const coords = values.map((val, idx) => {
    const clamped = Math.max(minDomain, Math.min(maxDomain, val));
    const norm = (clamped - minDomain) / safeSpan;
    const x = Math.round((count > 1 ? idx * stepX : width) * 10) / 10;
    const y = Math.round((height - norm * (height - 4) - 2) * 10) / 10;
    return { x, y };
  });

  if (coords.length === 1) {
    const y = coords[0].y;
    return {
      linePath: `M 0 ${y} L ${width} ${y}`,
      areaPath: `M 0 ${height} L 0 ${y} L ${width} ${y} L ${width} ${height} Z`,
      lastPoint: { x: width, y },
    };
  }

  const linePath = coords
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  return {
    linePath,
    areaPath,
    lastPoint: coords[coords.length - 1],
  };
}
