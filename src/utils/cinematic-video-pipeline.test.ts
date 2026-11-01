import test from 'node:test';
import assert from 'node:assert/strict';
import {
  optimizeCinematicPrompt,
  buildVideoGenerationPayload,
  QUALITY_PRESETS,
  COLOR_SCIENCE_MAP,
  CAMERA_RIG_MAP,
  DEFAULT_CINEMATIC_CONFIG,
} from './cinematic-video-pipeline';

test('optimizeCinematicPrompt injects optics, lighting, color science, and motion parameters', () => {
  const rawPrompt = 'Elena walks through the rain-slick alleyway holding a neural drive';
  const optimized = optimizeCinematicPrompt(rawPrompt, {
    ...DEFAULT_CINEMATIC_CONFIG,
    colorScience: 'kodak-500t',
    focalLengthMm: 35,
    cameraRig: 'slow-dolly',
  });

  assert.ok(optimized.masterPrompt.startsWith(rawPrompt));
  assert.ok(optimized.masterPrompt.includes('Arri Alexa 65') || optimized.masterPrompt.includes('Panavision'));
  assert.ok(optimized.masterPrompt.includes('Kodak Vision3 500T'));
  assert.ok(optimized.masterPrompt.includes('volumetric'));
  assert.ok(optimized.masterPrompt.includes('dolly push-in'));
  assert.ok(optimized.injectedTags.optics.length > 0);
  assert.ok(optimized.injectedTags.lighting.length > 0);
  assert.ok(optimized.injectedTags.colorScience.length > 0);
  assert.ok(optimized.injectedTags.motion.length > 0);
});

test('QUALITY_PRESETS exposes standard, 2k, 4k, and 5k configurations', () => {
  assert.equal(QUALITY_PRESETS['draft-1080p'].fps, 24);
  assert.equal(QUALITY_PRESETS['draft-1080p'].width, 1920);

  assert.equal(QUALITY_PRESETS['pro-2k'].fps, 24);
  assert.equal(QUALITY_PRESETS['pro-2k'].hdrEnabled, true);

  assert.equal(QUALITY_PRESETS['master-4k'].width, 3840);
  assert.equal(QUALITY_PRESETS['master-4k'].inferenceSteps, 55);
  assert.equal(QUALITY_PRESETS['master-4k'].colorDepth, '12-bit RAW');

  assert.equal(QUALITY_PRESETS['ultra-5k'].width, 5120);
  assert.equal(QUALITY_PRESETS['ultra-5k'].height, 2160);
  assert.equal(QUALITY_PRESETS['ultra-5k'].colorDepth, '12-bit RAW');
});

test('COLOR_SCIENCE_MAP contains all requested filmic LUT emulations', () => {
  assert.ok(COLOR_SCIENCE_MAP['kodak-500t'].name.includes('Kodak Vision3'));
  assert.ok(COLOR_SCIENCE_MAP['bleach-bypass'].name.includes('Bleach Bypass'));
  assert.ok(COLOR_SCIENCE_MAP['technicolor-3strip'].name.includes('Technicolor'));
  assert.ok(COLOR_SCIENCE_MAP['teal-orange'].name.includes('Teal'));
  assert.ok(COLOR_SCIENCE_MAP['noir-monochrome'].name.includes('Noir'));
});

test('buildVideoGenerationPayload constructs complete API payload with high-res specs', () => {
  const raw = 'Close-up of cybernetic eye reflecting neon sign';
  const payload = buildVideoGenerationPayload(raw, {
    qualityPreset: 'master-4k',
    aspectRatio: '2.39:1',
    colorScience: 'teal-orange',
    focalLengthMm: 85,
    aperture: 'f/1.8',
    cameraRig: 'steadicam-orbit',
    maximizeCinematicQuality: true,
    volumetricHaze: true,
    chromaticAberration: true,
    filmGrainIso: 500,
  });

  assert.ok(payload.prompt.includes(raw));
  assert.ok(payload.prompt.includes('85mm portrait telephoto'));
  assert.equal(payload.modelParameters.fps, 24);
  assert.equal(payload.modelParameters.width, 3840);
  assert.equal(payload.modelParameters.steps, 55);
  assert.equal(payload.modelParameters.lutProfile, 'BLOCKBUSTER_TEAL_AMBER');
  assert.equal(payload.modelParameters.cameraStabilization, 'Steadicam 3-Axis Gimbal');
  assert.equal(payload.modelParameters.motionSmoothing, true);
});
