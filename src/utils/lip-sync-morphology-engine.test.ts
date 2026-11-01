import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  computeMorphologyDeformation,
  buildLipSyncMorphologyPayload,
  DEFAULT_MORPHOLOGY_CONFIG,
  MORPHOLOGY_PROFILES,
  SAMPLE_VISEME_TIMELINE,
  MorphologyConfig,
} from './lip-sync-morphology-engine';

describe('Lip-Sync & Non-Human Jaw Deformation Engine', () => {
  test('computes humanoid elastic deformation with organic lip spread and jaw opening', () => {
    const vowelAh = SAMPLE_VISEME_TIMELINE[7]; // 'AH' open vowel
    const deform = computeMorphologyDeformation(vowelAh, DEFAULT_MORPHOLOGY_CONFIG);

    assert.ok(deform.jawDeltaY > 0.5, 'Humanoid jaw should open substantially for AH');
    assert.ok(deform.secondaryDeformationTag.includes('Organic facial muscle elasticity'));
    assert.strictEqual(deform.diffusionMaskWeights.upperMouth, 0.8);
  });

  test('enforces rigid stone deformation with zero lip spread and dust suppression', () => {
    const vowelAh = SAMPLE_VISEME_TIMELINE[7];
    const stoneConfig: MorphologyConfig = {
      ...DEFAULT_MORPHOLOGY_CONFIG,
      architecture: 'rigid_stone_statue',
      elasticityMultiplier: 0.15,
    };
    const deform = computeMorphologyDeformation(vowelAh, stoneConfig);

    assert.strictEqual(deform.lipSpreadX, 0, 'Stone cannot have horizontal elastic stretch');
    assert.ok(deform.jawDeltaY <= 0.4, 'Rigid stone jaw opening must be constrained');
    assert.ok(deform.secondaryDeformationTag.includes('dust containment suppression'));
  });

  test('computes snout deformation with rhinal bridge wrinkling and canine tooth exposure', () => {
    const vowelAh = SAMPLE_VISEME_TIMELINE[7];
    const snoutConfig: MorphologyConfig = {
      ...DEFAULT_MORPHOLOGY_CONFIG,
      architecture: 'elongated_snout',
      snoutWrinkleDisplacement: true,
    };
    const deform = computeMorphologyDeformation(vowelAh, snoutConfig);

    assert.ok(deform.secondaryDeformationTag.includes('Rhinal bridge skin wrinkling'));
    assert.strictEqual(deform.diffusionMaskWeights.rhinalBridge, 0.75);
  });

  test('computes alien multi-part mandible splay', () => {
    const vowelAh = SAMPLE_VISEME_TIMELINE[7];
    const alienConfig: MorphologyConfig = {
      ...DEFAULT_MORPHOLOGY_CONFIG,
      architecture: 'alien_multipart_mandible',
      mandibleSplitVectorDegrees: 35,
    };
    const deform = computeMorphologyDeformation(vowelAh, alienConfig);

    assert.ok(deform.secondaryDeformationTag.includes('Quad-mandible lateral outward splay'));
    assert.strictEqual(deform.diffusionMaskWeights.lateralMandibles, 1.0);
  });

  test('builds comprehensive lip-sync morphology prompt payload', () => {
    const payload = buildLipSyncMorphologyPayload('Vance speaks to the assembled guild', DEFAULT_MORPHOLOGY_CONFIG);

    assert.ok(payload.finalPrompt.includes('MORPHOLOGY_PIPELINE'));
    assert.ok(payload.finalPrompt.includes('Temporomandibular Joint'));
    assert.ok(payload.finalPrompt.includes('ElevenLabs Voice Bound'));
    assert.strictEqual(payload.visemeTimeline.length, 10);
  });
});
