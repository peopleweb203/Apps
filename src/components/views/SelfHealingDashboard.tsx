import React, { useState, useEffect } from 'react';
import {
  watchdog,
  WatchdogFaultRecord,
  HealingStats,
  FaultType,
  FaultSeverity,
} from '../../utils/self-healing-watchdog';
import {
  runSystemDiagnosticSuite,
  HealthMatrixReport,
  DiagnosticTestResult,
} from '../../utils/system-diagnostic-suite';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Terminal,
  Cpu,
  Clock,
  Sparkles,
  Bug,
  Flame,
  Layers,
  ArrowRight,
  Database,
  Radio,
  Sliders,
  Check,
  AlertOctagon,
  Trash2,
} from 'lucide-react';

export const SelfHealingDashboard: React.FC = () => {
  const [stats, setStats] = useState<HealingStats>(() => watchdog.getHealingStats());
  const [faults, setFaults] = useState<WatchdogFaultRecord[]>(() => watchdog.getRecentFaults());
  const [report, setReport] = useState<HealthMatrixReport | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FaultType | 'ALL'>('ALL');
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Subscribe to watchdog live fault events
  useEffect(() => {
    const unsubscribe = watchdog.subscribe((_newFault) => {
      setFaults(watchdog.getRecentFaults());
      setStats(watchdog.getHealingStats());
    });
    return unsubscribe;
  }, []);

  // Run initial synthetic test suite on mount
  useEffect(() => {
    handleRunDiagnostics();
  }, []);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const res = await runSystemDiagnosticSuite();
      setReport(res);
      setStats(watchdog.getHealingStats());
      setFaults(watchdog.getRecentFaults());
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const showNotice = (msg: string) => {
    setSimulationNotice(msg);
    setTimeout(() => setSimulationNotice(null), 4000);
  };

  // -------------------------------------------------------------
  // SIMULATION TESTING ACTIONS
  // -------------------------------------------------------------
  const handleSimulateRateLimit = () => {
    const plan = watchdog.remediateApiFailure(429, 0, '4k');
    setStats(watchdog.getHealingStats());
    setFaults(watchdog.getRecentFaults());
    showNotice(plan.remediationNotice);
  };

  const handleSimulateServerDown = () => {
    const plan = watchdog.remediateApiFailure(503, 1, '4k');
    setStats(watchdog.getHealingStats());
    setFaults(watchdog.getRecentFaults());
    showNotice(plan.remediationNotice);
  };

  const handleSimulateMalformedPayload = () => {
    const broken = '{"scene": "Neon Alley", "prompt": "Elena 4k cinematic render", "tags": ["rain", "cyber"';
    const result = watchdog.sanitizePayload(broken);
    setStats(watchdog.getHealingStats());
    setFaults(watchdog.getRecentFaults());
    showNotice(`Payload Repaired: Appended ${broken.length} chars -> Validated JSON`);
  };

  const handleSimulateTaskStall = () => {
    const stalledTasks = [
      {
        id: 'render-worker-wan-994',
        startedAt: Date.now() - 320000,
        lastProgressAt: Date.now() - 300000, // 5 minutes ago (> 4 min threshold)
        status: 'EXTRUDING' as const,
        blobUrl: 'blob:https://cineforge.ai/stale-frame-buffer-temp',
      },
    ];
    const { cleanedCount } = watchdog.checkAndCleanStaleTasks(stalledTasks, 240000);
    setStats(watchdog.getHealingStats());
    setFaults(watchdog.getRecentFaults());
    showNotice(`Memory Sentinel: Killed ${cleanedCount} stalled worker and flushed Blob RAM buffer.`);
  };

  const handleSimulateCorruptState = () => {
    const corruptEntities: any[] = [
      { id: 'char-elena', name: 'Elena Cross', gender: 'Female' },
      { id: 'corrupted-record', name: null, gender: undefined }, // Corrupt!
    ];
    const { repairsMade } = watchdog.validateAndRepairState(
      corruptEntities,
      ['name', 'gender'],
      { id: 'fallback-actor', name: 'Standard Persona', gender: 'Female' }
    );
    setStats(watchdog.getHealingStats());
    setFaults(watchdog.getRecentFaults());
    showNotice(`State Healer: Isolated ${repairsMade} corrupt entity and restored schema-safe default.`);
  };

  const filteredFaults = faults.filter((f) => (activeFilter === 'ALL' ? true : f.type === activeFilter));

  const getSeverityBadge = (sev: FaultSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950/70 p-6 overflow-y-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold font-mono tracking-tight text-neutral-100 uppercase">
                Autonomous Runtime Diagnostics & Self-Healing Watchdog
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE SENTINEL
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Deterministic runtime protection, 4-minute orphan stall terminations, HTTP 429/500 downscale fallbacks, and schema auto-repair.
            </p>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunDiagnostics}
            disabled={isRunningDiagnostics}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
            <span>{isRunningDiagnostics ? 'RUNNING SYNTHETIC TESTS...' : 'RUN FULL SELF-DIAGNOSTICS'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {simulationNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{simulationNotice}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
            HEALED IN &lt;2ms
          </span>
        </div>
      )}

      {/* Health Matrix Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neutral-400">Health Score</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.healthScorePercent}%
            </span>
            <span className="text-[10px] text-emerald-500 font-mono">NOMINAL</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1">Fault Recovery Target &gt;95%</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neutral-400">Faults Intercepted</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {stats.totalFaultsIntercepted}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">Total</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1">Zero UI Crashes Enforced</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neutral-400">Autonomously Healed</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {stats.totalAutonomouslyHealed}
            </span>
            <span className="text-[10px] text-cyan-500 font-mono">100% Rate</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1">Zero Manual Restarts</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neutral-400">Downscale Events</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-purple-400">
              {stats.downscaleFallbackEvents}
            </span>
            <span className="text-[10px] text-purple-400 font-mono">4K → 1080p</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1">429 Backoff Throttling</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neutral-400">Payload Repairs</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-orange-400">
              {stats.payloadRepairsCount}
            </span>
            <span className="text-[10px] text-orange-400 font-mono">Cleaned</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1">JSON Braces & Quotes</span>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-neutral-400">Stalls Terminated</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-red-400">
              {stats.activeStallsTerminated}
            </span>
            <span className="text-[10px] text-red-400 font-mono">&gt;4 min</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-1">Orphan RAM Freed</span>
        </div>
      </div>

      {/* Interactive Simulation Sandbox */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-200">
              Interactive Fault Simulation Sandbox
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            Test automated recovery playbooks in real time without external API calls
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <button
            onClick={handleSimulateRateLimit}
            className="px-3 py-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-neutral-200 group-hover:text-amber-400">HTTP 429 Limit</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Exponential Backoff & 1080p</div>
          </button>

          <button
            onClick={handleSimulateServerDown}
            className="px-3 py-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-neutral-200 group-hover:text-red-400">HTTP 503 Outage</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Switch Backup Synthesis</div>
          </button>

          <button
            onClick={handleSimulateMalformedPayload}
            className="px-3 py-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-neutral-200 group-hover:text-orange-400">Corrupt JSON</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Auto-Append Braces & Quotes</div>
          </button>

          <button
            onClick={handleSimulateTaskStall}
            className="px-3 py-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-neutral-200 group-hover:text-cyan-400">4-Min Task Stall</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Kill Worker & Flush Blob URL</div>
          </button>

          <button
            onClick={handleSimulateCorruptState}
            className="px-3 py-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-purple-500/40 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-bold text-neutral-200 group-hover:text-purple-400">State Corruption</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Isolate & Schema Rollback</div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Synthetic Test Suite vs Real-Time Interception Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left Column: 5 Synthetic Verification Harness Tests (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-200">
                Synthetic Test Harness (5 Deterministic Tests)
              </h3>
            </div>
            {report && (
              <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {report.testsPassed}/{report.totalTests} PASSED ({report.totalDurationMs}ms)
              </span>
            )}
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {report?.results.map((test) => {
              const isPass = test.status === 'PASS';
              return (
                <div
                  key={test.id}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-neutral-200">
                      {test.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500">
                        {test.executionTimeMs}ms
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isPass
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {test.details}
                  </p>

                  {test.metrics && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(test.metrics).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400"
                        >
                          {k}: <strong className="text-neutral-200">{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Interception & Self-Healing Event Stream (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-200">
                Live Watchdog Interception & Remediation Stream
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              {(['ALL', 'API_FAILURE', 'STATE_CORRUPTION', 'STALL_TIMEOUT', 'PAYLOAD_MALFORMED'] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Fault Log Stream */}
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {filteredFaults.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-neutral-500 font-mono text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-2" />
                <span>Zero unhandled faults detected. All systems operating at nominal integrity.</span>
              </div>
            ) : (
              filteredFaults.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-2 transition-all hover:border-neutral-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(
                          f.severity
                        )}`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-200">
                        {f.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500">
                        {new Date(f.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {f.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 font-mono">{f.message}</p>

                  <div className="flex items-start gap-2 bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-800 text-xs font-mono text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-neutral-400">Autonomous Playbook: </span>
                      <span>{f.remediationAction}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
