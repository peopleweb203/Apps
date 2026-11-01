import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculateDynamicStemLevels,
  buildOrchestralScorePayload,
  GENRE_PRESETS_MAP,
  INITIAL_LEITMOTIFS,
  INITIAL_TENSION_CUES,
} from './orchestral-score-engine';

describe('Orchestral Score & Dynamic Leitmotif Engine', () => {
  test('scales stems dynamically with tension and applies dialogue ducking', () => {
    const lowTension = calculateDynamicStemLevels(20, false);
    const highTension = calculateDynamicStemLevels(95, true);

    assert.ok(highTension.brassWoodwindsPercent > lowTension.brassWoodwindsPercent, 'Brass should swell with high tension');
    assert.ok(highTension.percussionTaikoPercent > lowTension.percussionTaikoPercent, 'Taiko percussion should swell with tension');
    assert.strictEqual(highTension.dialogueDuckingReductionDb, -4.5, 'Must apply -4.5dB dialogue ducking');
  });

  test('builds complete orchestral score payload with character leitmotifs', () => {
    const payload = buildOrchestralScorePayload('scifi_noir_vangelis', INITIAL_TENSION_CUES, INITIAL_LEITMOTIFS);

    assert.ok(payload.scorePromptTag.includes('SCIFI_NOIR_VANGELIS'));
    assert.ok(payload.scorePromptTag.includes('Vangelis CS-80 Analog Brass Lead'));
    assert.ok(payload.scorePromptTag.includes('Elena Rostova'));
    assert.strictEqual(payload.activeLeitmotifs.length, 2);
    assert.strictEqual(payload.maxTensionScore, 95);
  });
});
