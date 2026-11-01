import React, { useState, useEffect, useMemo } from 'react';
import { useStudio } from '../context/StudioContext';
import {
  HardwareTelemetrySample,
  HardwareOptimizationState,
  DEFAULT_HARDWARE_OPTIMIZATION,
  sampleHardwareTelemetry,
  appendTelemetrySample,
  evaluateHardwareHealth,
  buildSparklineSvgPaths,
} from '../utils/hardware-health-monitor';
import {
  Cpu,
  HardDrive,
  Activity,
  Zap,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Gauge,
  Sliders,
} from 'lucide-react';

export const HardwareHealthMonitor: React.FC = () => {
  const {
    cinematicConfig,
    updateCinematicConfig,
    isBatchProcessing,
    renderTasks,
    isPlaying,
    activeRenderPreset,
    setIsRenderQueueOpen,
  } = useStudio();

  const [optimization, setOptimization] = useState<HardwareOptimizationState>(
    DEFAULT_HARDWARE_OPTIMIZATION
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Initialize with 24 baseline samples so sparklines render full curves immediately
  const [history, setHistory] = useState<HardwareTelemetrySample[]>(() => {
    const initial: HardwareTelemetrySample[] = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      initial.push(
        sampleHardwareTelemetry(
          {
            qualityPreset: cinematicConfig.qualityPreset,
            isBatchProcessing: false,
            renderTasks: [],
            isPlaying: false,
            bitrateMbps: activeRenderPreset.bitrateMbps,
            optimization: DEFAULT_HARDWARE_OPTIMIZATION,
            jitterSeed: i * 0.65,
          },
          now - i * 1000
        )
      );
    }
    return initial;
  });

  // Real-time 1.2s telemetry sampling loop
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setHistory((prev) => {
        const nextSample = sampleHardwareTelemetry(
          {
            qualityPreset: cinematicConfig.qualityPreset,
            isBatchProcessing,
            renderTasks,
            isPlaying,
            bitrateMbps: activeRenderPreset.bitrateMbps,
            optimization,
          },
          now
        );
        return appendTelemetrySample(prev, nextSample, 24);
      });
    };

    tick();
    const intervalId = window.setInterval(tick, 1200);
    return () => window.clearInterval(intervalId);
  }, [
    cinematicConfig.qualityPreset,
    isBatchProcessing,
    renderTasks,
    isPlaying,
    activeRenderPreset.bitrateMbps,
    optimization,
  ]);

  const latest = history[history.length - 1];

  const evaluation = useMemo(
    () => evaluateHardwareHealth(latest, optimization),
    [latest, optimization]
  );

  // Build SVG Sparklines for the 3 core hardware telemetry streams
  const gpuSparkline = useMemo(
    () =>
      buildSparklineSvgPaths(
        history.map((s) => s.gpuUtilizationPct),
        136,
        26,
        0,
        100
      ),
    [history]
  );

  const memSparkline = useMemo(
    () =>
      buildSparklineSvgPaths(
        history.map((s) => (s.renderMemoryMb / s.maxRenderMemoryMb) * 100),
        136,
        26,
        0,
        100
      ),
    [history]
  );

  const threadSparkline = useMemo(
    () =>
      buildSparklineSvgPaths(
        history.map((s) => s.threadThroughputOps),
        136,
        26,
        100,
        2400
      ),
    [history]
  );

  const handlePurgeCache = () => {
    setOptimization((prev) => ({
      ...prev,
      lastCachePurgeTimestamp: Date.now(),
    }));
  };

  const handleToggleTileSplitting = () => {
    setOptimization((prev) => ({
      ...prev,
      vramTileSplitting: !prev.vramTileSplitting,
    }));
  };

  const handleToggleFp16 = () => {
    setOptimization((prev) => ({
      ...prev,
      tensorFp16Quantization: !prev.tensorFp16Quantization,
    }));
  };

  const statusColor =
    evaluation.status === 'OPTIMAL'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : evaluation.status === 'ELEVATED'
      ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
      : 'text-rose-300 border-rose-500/40 bg-rose-500/15';

  return (
    <section
      aria-label="Hardware Health Monitor"
      className="mx-3 mb-2 rounded-xl border border-neutral-800/90 bg-neutral-950/95 shadow-lg overflow-hidden transition-all"
    >
      {/* Expanded Hardware Health Optimization Drawer */}
      {isExpanded && (
        <div className="p-3.5 border-b border-neutral-800/90 bg-neutral-900/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-100">
                Hardware Health Monitor & 4K/5K Render Optimization Matrix
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${statusColor}`}
              >
                {evaluation.status} • {evaluation.estimated4KFps} FPS EST. ({latest.frameTimeMs}ms/frame)
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
              <span>{evaluation.recommendation}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: GPU & VRAM Detailed Telemetry */}
            <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GPU / VRAM Allocation</span>
                </span>
                <span className="text-xs font-mono font-bold text-neutral-100">
                  {latest.gpuUtilizationPct.toFixed(0)}% Core • {latest.vramUsedGb.toFixed(1)} / {latest.totalVramGb} GB
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${evaluation.vramUtilizationPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>Anamorphic Tensor Pool: {(latest.vramUsedGb * 0.62).toFixed(1)} GB</span>
                <span>LUT & Optical Cache: {(latest.vramUsedGb * 0.38).toFixed(1)} GB</span>
              </div>
            </div>

            {/* Card 2: Rendering Memory Heap Detailed Telemetry */}
            <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-purple-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Rendering Memory Usage</span>
                </span>
                <span className="text-xs font-mono font-bold text-neutral-100">
                  {(latest.renderMemoryMb / 1024).toFixed(1)} / {(latest.maxRenderMemoryMb / 1024).toFixed(0)} GB ({evaluation.renderMemoryPct}%)
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-400 h-full transition-all duration-300"
                  style={{ width: `${evaluation.renderMemoryPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>4K Frame Ringbuffer: {Math.round(latest.renderMemoryMb * 0.55)} MB</span>
                <span>Audio/Foley Stems: {Math.round(latest.renderMemoryMb * 0.15)} MB</span>
              </div>
            </div>

            {/* Card 3: Background Thread Throughput Detailed Telemetry */}
            <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Background Thread Throughput</span>
                </span>
                <span className="text-xs font-mono font-bold text-neutral-100">
                  {latest.threadThroughputOps} ops/s • {latest.activeThreads}/{latest.maxThreads} Threads
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{ width: `${evaluation.threadUtilizationPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>Worker Queue Latency: {Math.max(4, Math.round(latest.frameTimeMs * 0.35))}ms</span>
                <span>Parallel Muxing: ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Always-Visible Compact Bottom Studio Sparkline Bar */}
      <div className="px-3.5 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left Title & Health Status Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-200">
              Hardware Health Monitor
            </span>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${statusColor}`}
          >
            {evaluation.status === 'OPTIMAL' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            <span>{evaluation.headline}</span>
          </span>
        </div>

        {/* Center: 3 Real-Time Sparklines (GPU/VRAM, Rendering Memory, Background Thread Throughput) */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Sparkline 1: GPU / VRAM Utilization */}
          <div
            className="flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2.5 py-1"
            title="Real-time GPU Core & Dedicated VRAM Utilization Sparkline"
          >
            <div className="min-w-[108px]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>GPU / VRAM</span>
              </div>
              <div className="text-xs font-mono font-bold text-cyan-300">
                {latest.gpuUtilizationPct.toFixed(0)}%{' '}
                <span className="text-[10px] text-neutral-400 font-normal">
                  ({latest.vramUsedGb.toFixed(1)}/{latest.totalVramGb}GB)
                </span>
              </div>
            </div>

            <svg
              width="136"
              height="26"
              viewBox="0 0 136 26"
              className="overflow-visible shrink-0"
              aria-label="GPU VRAM Utilization Sparkline"
            >
              <path d={gpuSparkline.areaPath} fill="rgba(34, 211, 238, 0.14)" />
              <path
                d={gpuSparkline.linePath}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={gpuSparkline.lastPoint.x}
                cy={gpuSparkline.lastPoint.y}
                r="2.5"
                fill="#22d3ee"
              />
            </svg>
          </div>

          {/* Sparkline 2: Rendering Memory Usage */}
          <div
            className="flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2.5 py-1"
            title="Real-time 4K Rendering Memory Heap & Frame Buffer Sparkline"
          >
            <div className="min-w-[114px]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                <HardDrive className="w-3 h-3 text-purple-400" />
                <span>Render Memory</span>
              </div>
              <div className="text-xs font-mono font-bold text-purple-300">
                {(latest.renderMemoryMb / 1024).toFixed(1)} GB{' '}
                <span className="text-[10px] text-neutral-400 font-normal">
                  ({evaluation.renderMemoryPct}%)
                </span>
              </div>
            </div>

            <svg
              width="136"
              height="26"
              viewBox="0 0 136 26"
              className="overflow-visible shrink-0"
              aria-label="Rendering Memory Usage Sparkline"
            >
              <path d={memSparkline.areaPath} fill="rgba(192, 132, 252, 0.14)" />
              <path
                d={memSparkline.linePath}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={memSparkline.lastPoint.x}
                cy={memSparkline.lastPoint.y}
                r="2.5"
                fill="#c084fc"
              />
            </svg>
          </div>

          {/* Sparkline 3: Background Thread Throughput */}
          <div
            className="flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-800 rounded-lg px-2.5 py-1"
            title="Real-time Background Worker Thread Pool Throughput Sparkline"
          >
            <div className="min-w-[118px]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>Thread Throughput</span>
              </div>
              <div className="text-xs font-mono font-bold text-amber-300">
                {latest.threadThroughputOps} ops/s{' '}
                <span className="text-[10px] text-neutral-400 font-normal">
                  ({latest.activeThreads}T)
                </span>
              </div>
            </div>

            <svg
              width="136"
              height="26"
              viewBox="0 0 136 26"
              className="overflow-visible shrink-0"
              aria-label="Background Thread Throughput Sparkline"
            >
              <path d={threadSparkline.areaPath} fill="rgba(251, 191, 36, 0.14)" />
              <path
                d={threadSparkline.linePath}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={threadSparkline.lastPoint.x}
                cy={threadSparkline.lastPoint.y}
                r="2.5"
                fill="#fbbf24"
              />
            </svg>
          </div>
        </div>

        {/* Right: 4K Performance Optimization Quick Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleTileSplitting}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              optimization.vramTileSplitting
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Split 4K/5K frames into tiled tensor batches to reduce peak VRAM usage by ~3.1 GB"
          >
            <Layers className="w-3 h-3" />
            <span>4K Tile-Split {optimization.vramTileSplitting ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleToggleFp16}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              optimization.tensorFp16Quantization
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title="Enable FP16 half-precision tensor acceleration for faster 4K frame times"
          >
            <Zap className="w-3 h-3" />
            <span>FP16 Fast {optimization.tensorFp16Quantization ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handlePurgeCache}
            className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Purge stale 4K frame buffers and reclaim rendering memory"
          >
            <Trash2 className="w-3 h-3" />
            <span>Purge 4K Cache</span>
          </button>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[10px] font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Toggle Detailed Hardware Telemetry Matrix"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>{isExpanded ? 'Collapse' : 'Details'}</span>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
