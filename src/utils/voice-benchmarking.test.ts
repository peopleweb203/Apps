import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVoiceBenchmark, runVoiceDiagnostics } from './voice-benchmarking';

test('evaluateVoiceBenchmark produces valid latency and stability metrics', () => {
  const voiceId = '21m00Tcm4TlvDq8ikWAM';
  const result = evaluateVoiceBenchmark(voiceId, {
    stability: 0.8,
    similarityBoost: 0.85,
    styleExaggeration: 0.1,
  });

  assert.equal(result.voiceId, voiceId);
  assert.equal(result.durationSec, 5.0);
  assert.ok(result.timeToFirstByteMs >= 80 && result.timeToFirstByteMs <= 200);
  assert.ok(result.latencyJitterMs > 0 && result.latencyJitterMs < 10);
  assert.ok(result.stabilityScore >= 70 && result.stabilityScore <= 100);
  assert.ok(result.similarityAccuracy >= 70 && result.similarityAccuracy <= 100);
  assert.ok(result.meanOpinionScore >= 4.0 && result.meanOpinionScore <= 5.0);
  assert.ok(result.phonemeSyncConfidence >= 85);
  assert.equal(result.packetLossPercent, 0.0);
  assert.ok(result.recommendations.length > 0);
});

test('evaluateVoiceBenchmark warns on low stability', () => {
  const voiceId = 'ErXwobaYiN019PkySvjV';
  const lowResult = evaluateVoiceBenchmark(voiceId, {
    stability: 0.3,
    similarityBoost: 0.4,
  });

  assert.ok(lowResult.stabilityScore < 70);
  assert.equal(lowResult.readinessRating, 'NEEDS_CALIBRATION');
  assert.ok(lowResult.recommendations.some((r) => r.includes('stability')));
});

test('runVoiceDiagnostics executes all 3 test scenarios with 100% pass rate without external API credits', () => {
  const report = runVoiceDiagnostics();

  assert.ok(report);
  assert.equal(report.totalScenarios, 3);
  assert.equal(report.passedCount, 3);
  assert.equal(report.failedCount, 0);
  assert.equal(report.allPassed, true);
  assert.ok(report.timestamp.length > 0);
});

test('runVoiceDiagnostics Scenario 1 validates optimal latency < 400ms and schema', () => {
  const report = runVoiceDiagnostics();
  const latencyCheck = report.checks.find((c) => c.category === 'LATENCY_MATH');

  assert.ok(latencyCheck);
  assert.equal(latencyCheck.passed, true);
  assert.equal(latencyCheck.status, 'PASS');
  assert.ok(typeof latencyCheck.latencyMs === 'number');
  assert.ok((latencyCheck.latencyMs as number) < 400);

  const optimalRaw = report.rawScenarios.optimal;
  assert.ok(optimalRaw.timeToFirstByteMs < 400);
  assert.equal(optimalRaw.readinessRating, 'BROADCAST_READY');
  assert.ok(optimalRaw.stabilityScore >= 70);
  assert.ok(optimalRaw.meanOpinionScore >= 4.0);
});

test('runVoiceDiagnostics Scenario 2 validates high latency > 900ms and throttling recommendations', () => {
  const report = runVoiceDiagnostics();
  const streamCheck = report.checks.find((c) => c.category === 'STREAM_HANDLING');

  assert.ok(streamCheck);
  assert.equal(streamCheck.passed, true);
  assert.equal(streamCheck.status, 'PASS');
  assert.ok(typeof streamCheck.latencyMs === 'number');
  assert.ok((streamCheck.latencyMs as number) > 900);

  const highLatencyRaw = report.rawScenarios.highLatency;
  assert.ok(highLatencyRaw.timeToFirstByteMs > 900);
  assert.ok(highLatencyRaw.recommendations.length > 0);
});

test('runVoiceDiagnostics Scenario 3 validates simulated 429 quota failure and safe error recovery', () => {
  const report = runVoiceDiagnostics();
  const recoveryCheck = report.checks.find((c) => c.category === 'ERROR_RECOVERY');

  assert.ok(recoveryCheck);
  assert.equal(recoveryCheck.passed, true);
  assert.equal(recoveryCheck.status, 'PASS');

  const error429 = report.rawScenarios.networkFailure429;
  assert.equal(error429.httpStatus, 429);
  assert.equal(error429.errorCode, 'TOO_MANY_REQUESTS');
  assert.equal(error429.schemaValid, true);
  assert.equal(error429.fallbackBufferEngaged, true);
  assert.ok(error429.recoveryAction.includes('backoff'));
});

test('evaluateVoiceBenchmark handles empty or blank voice IDs gracefully', () => {
  const emptyResult = evaluateVoiceBenchmark('', { stability: 0.5 });
  assert.ok(emptyResult);
  assert.equal(emptyResult.voiceId, 'default_voice');
  assert.ok(emptyResult.timeToFirstByteMs > 0);
  assert.ok(emptyResult.stabilityScore > 0);
});
