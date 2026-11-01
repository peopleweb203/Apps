import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculateBinauralPositioning,
  generateProceduralFoleyTrack,
  calculateSidechainDucking,
  buildSpatialAudioMixerPayload,
  ACOUSTIC_PRESETS_MAP,
  SpatialEntityPosition,
} from './spatial-audio-mixer';

describe('Spatial Audio Mixer & Procedural Foley Engine', () => {
  test('calculates binaural panning and inverse-square decibel attenuation accurately', () => {
    const actorLeft: SpatialEntityPosition = {
      entityId: 'actor-1',
      name: 'Elena',
      x: -4.0,
      y: 0,
      zDepthMeters: 4.0,
      velocityMetersPerSec: 0,
    };

    const binaural = calculateBinauralPositioning(actorLeft);
    assert.ok(binaural.panStereo < 0, 'Negative X position should yield left stereo pan');
    assert.strictEqual(binaural.panStereo, -0.71);
    assert.ok(binaural.distanceAttenuationDb < 0, 'Distance attenuation must be negative dB');
    assert.strictEqual(binaural.distanceAttenuationDb, -12.0);
    assert.ok(binaural.airAbsorptionCutoffHz < 20000, 'Air absorption should roll off high frequencies with distance');
  });

  test('generates procedural foley footstep events and secondary wardrobe rustle', () => {
    const foley = generateProceduralFoleyTrack(3.0, 'metallic_grating', 'heavy_plate_armor', 1.0);

    assert.ok(foley.length >= 5, 'Should generate at least 5 foley events for 3 seconds');
    assert.ok(foley.some((e) => e.triggerType === 'footstep'));
    assert.ok(foley.some((e) => e.triggerType === 'wardrobe_creak'));
    assert.ok(foley[0].foleyDescription.includes('metallic grating'));
  });

  test('applies automated sidechain dialogue ducking dropping stems by -3dB to -6dB', () => {
    const quietStems = calculateSidechainDucking(false);
    const dialogueStems = calculateSidechainDucking(true, -5.0);

    assert.strictEqual(quietStems.duckingReductionDb, 0.0);
    assert.strictEqual(dialogueStems.duckingReductionDb, -5.0);
    assert.strictEqual(dialogueStems.foleyDb, -17.0);
    assert.strictEqual(dialogueStems.ambientScoreDb, -21.0);
  });

  test('builds complete spatial acoustics payload with room convolution tags', () => {
    const hero: SpatialEntityPosition = {
      entityId: 'hero',
      name: 'Vance',
      x: 2.0,
      y: 0,
      zDepthMeters: 3.5,
      velocityMetersPerSec: 1.2,
    };

    const payload = buildSpatialAudioMixerPayload('deep_cavern', hero, 'rain_slick_concrete');
    assert.ok(payload.audioPromptTag.includes('SPATIAL_ACOUSTICS: DEEP CAVERN'));
    assert.ok(payload.audioPromptTag.includes('4.8s trailing decay'));
    assert.strictEqual(payload.roomProfile.id, 'deep_cavern');
    assert.ok(payload.foleyCount > 0);
  });
});
