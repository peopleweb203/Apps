import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  validateAnatomicalIntegrity,
  compileAestheticPhysiquePrompt,
  DEFAULT_AESTHETIC_CONFIG,
  ANATOMICAL_NEGATIVE_PROMPT,
} from './character-aesthetic-engine';

describe('Character Aesthetics & Anatomical Silhouette Engine', () => {
  test('validates female hourglass ratios within natural aesthetic range (0.68-0.74)', () => {
    const validConfig = { ...DEFAULT_AESTHETIC_CONFIG };
    const validation = validateAnatomicalIntegrity(validConfig);

    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.tierLabel, 'HOLLYWOOD LEAD TIER (9.0-9.4)');
  });

  test('validates male golden ratio V-taper (1.618)', () => {
    const maleConfig = {
      ...DEFAULT_AESTHETIC_CONFIG,
      gender: 'Male' as const,
      attractivenessTierScore: 9.6,
    };
    const validation = validateAnatomicalIntegrity(maleConfig);

    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.tierLabel, 'A-LIST CINEMATIC ICON (9.5+)');
    assert.strictEqual(validation.renderPriorityBonus, 1.5);
  });

  test('compiles prompt with anatomical tokens and negative exclusions', () => {
    const result = compileAestheticPhysiquePrompt('Elena Rostova', DEFAULT_AESTHETIC_CONFIG);

    assert.ok(result.compiledPrompt.includes('sculpted cinematic hourglass silhouette'));
    assert.ok(result.compiledPrompt.includes('0.7 waist-to-hip ratio'));
    assert.ok(result.negativePrompt.includes('distorted torso'));
    assert.ok(result.negativePrompt.includes('exaggerated caricature proportions'));
    assert.strictEqual(result.isAnatomicallySound, true);
  });
});
