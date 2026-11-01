import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  compileCombatActionPrompt,
  DEFAULT_COMBAT_CONFIG,
  COMBAT_MOVES_LIBRARY,
} from './action-combat-engine';
import {
  buildMultiCamCoverage,
  DEFAULT_MULTICAM_RIG,
} from './virtual-multicam-rig';
import {
  buildPropAttentionMaskPrompt,
  INITIAL_HERO_PROPS,
} from './wardrobe-prop-vault';

describe('Action Combat & Multi-Cam Rig Suites', () => {
  test('compiles combat prompt with 90-degree shutter, bullet-time orbit, and 120fps speed ramping', () => {
    const result = compileCombatActionPrompt(
      'Elena battles cyber-assassin on neon suspension bridge',
      DEFAULT_COMBAT_CONFIG
    );

    assert.ok(result.combatPrompt.includes('90-degree crisp action shutter'));
    assert.ok(result.combatPrompt.includes('Matrix bullet-time 360-degree orbital sweep'));
    assert.ok(result.combatPrompt.includes('120fps ultra-slow motion'));
    assert.strictEqual(result.technicalPayload.shutterAngle, 90);
    assert.strictEqual(result.technicalPayload.bulletTimeActive, true);
  });

  test('builds synchronized multi-camera coverage with A, B, and C angles', () => {
    const coverage = buildMultiCamCoverage('scene-1', 1, 99281);
    assert.strictEqual(coverage.cameras.cam_a.focalLengthMm, 24);
    assert.strictEqual(coverage.cameras.cam_b.focalLengthMm, 50);
    assert.strictEqual(coverage.cameras.cam_c.focalLengthMm, 85);
    assert.strictEqual(coverage.cameras.cam_a.isSynced, true);
    assert.strictEqual(coverage.cameras.cam_b.isSynced, true);
    assert.strictEqual(coverage.cameras.cam_c.isSynced, true);
  });

  test('builds prop attention mask prompt isolating character accessories', () => {
    const prompt = buildPropAttentionMaskPrompt(INITIAL_HERO_PROPS, 'char-elena');
    assert.ok(prompt.includes('ATTENTION_MASK: RIGHT_HAND_GRIP'));
    assert.ok(prompt.includes('Exo-Dec Pulse Courier Terminal'));
    assert.ok(prompt.includes('PROP_HASH_9824_TITANIUM'));
  });
});
