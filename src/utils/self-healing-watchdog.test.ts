import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { watchdog } from './self-healing-watchdog';
import { runSystemDiagnosticSuite } from './system-diagnostic-suite';

describe('Autonomous Runtime Diagnostics & Self-Healing Watchdog', () => {
  it('handles HTTP 429 rate limits with exponential backoff and dynamic downscaling', () => {
    const plan = watchdog.remediateApiFailure(429, 0, '4k');
    assert.equal(plan.shouldRetry, true);
    assert.ok(plan.backoffMs >= 1000);
    assert.equal(plan.downscaledResolution, '1080p');
    assert.ok(plan.remediationNotice.includes('429 Handled'));
  });

  it('handles HTTP 500 remote server failures by switching to resilient backup simulation', () => {
    const plan = watchdog.remediateApiFailure(500, 1, '4k');
    assert.equal(plan.fallbackToSimulation, true);
    assert.ok(plan.remediationNotice.includes('Switched to resilient backup'));
  });

  it('sanitizes malformed JSON payloads and repairs syntax anomalies', () => {
    const malformed = '{"title": "Action Stunt", "params": {"speed": 45'; // missing 2 closing braces
    const { sanitized, wasRepaired, repairs } = watchdog.sanitizePayload(malformed);

    assert.equal(wasRepaired, true);
    assert.ok(repairs.length > 0);
    assert.ok(sanitized.endsWith('}}'));
    assert.doesNotThrow(() => JSON.parse(sanitized));
  });

  it('detects and terminates tasks stalled > 4 minutes', () => {
    const now = Date.now();
    const tasks = [
      { id: 'task-1', startedAt: now - 300000, lastProgressAt: now - 250000, status: 'EXTRUDING' as const }, // >240s stalled!
      { id: 'task-2', startedAt: now - 10000, lastProgressAt: now - 2000, status: 'EXTRUDING' as const }, // active
    ];

    const { cleanedCount, activeTasks } = watchdog.checkAndCleanStaleTasks(tasks, 240000);
    assert.equal(cleanedCount, 1);
    assert.equal(activeTasks[0].status, 'TERMINATED');
    assert.equal(activeTasks[1].status, 'EXTRUDING');
  });

  it('isolates corrupt records and repairs state schema integrity', () => {
    const records = [
      { id: 'rec-1', name: 'Valid Record', value: 100 },
      { id: 'rec-2', name: undefined, value: null } as any, // corrupt!
    ];

    const fallback = { id: 'fallback', name: 'Safe Template', value: 0 };
    const { repairedRecords, repairsMade } = watchdog.validateAndRepairState(
      records,
      ['name', 'value'],
      fallback
    );

    assert.equal(repairsMade, 1);
    assert.equal(repairedRecords[1].name, 'Safe Template');
  });

  it('executes the 5-part headless synthetic verification harness with HEALTHY status', async () => {
    const report = await runSystemDiagnosticSuite();
    assert.ok(report.totalTests === 5);
    assert.ok(report.testsPassed >= 4);
    assert.ok(report.status === 'HEALTHY' || report.status === 'HEALED');
    assert.ok(report.results.some((r) => r.category === 'SCRIPT_ENGINE'));
    assert.ok(report.results.some((r) => r.category === 'CONTINUITY_VAULT'));
    assert.ok(report.results.some((r) => r.category === 'AUDIO_ACOUSTICS'));
    assert.ok(report.results.some((r) => r.category === 'VISUAL_PIPELINE'));
    assert.ok(report.results.some((r) => r.category === 'STORAGE_PERSISTENCE'));
  });
});
