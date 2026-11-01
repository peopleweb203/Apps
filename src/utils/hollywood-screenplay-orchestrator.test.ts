import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateHollywoodScreenplay,
  compileScreenplayToProductionShots,
  formatToFountainScript,
  BLAKE_SNYDER_15_BEATS,
} from './hollywood-screenplay-orchestrator';
import { INITIAL_CHARACTERS, INITIAL_SETS } from '../mock/studio-data';

describe('Hollywood Screenplay Orchestrator Engine', () => {
  it('generates a complete 15-beat screenplay with cross-engine directives', () => {
    const script = generateHollywoodScreenplay(
      {
        title: 'PROTOCOL OMEGA',
        genre: 'SCIFI_CYBER_EPIC',
        scope: 'FULL_SCREENPLAY',
        leadCharacterId: 'char-elena',
        antagonistCharacterId: 'char-chen',
        selectedSetIds: ['set-alley', 'set-penthouse'],
      },
      INITIAL_CHARACTERS,
      INITIAL_SETS
    );

    assert.equal(script.title, 'PROTOCOL OMEGA');
    assert.equal(script.scenes.length, 15, 'Full screenplay must generate all 15 structural beats');
    assert.ok(script.logline.includes('Elena Cross'));
    assert.ok(script.totalShotCount >= 45);

    // Verify first scene has valid structure
    const scene1 = script.scenes[0];
    assert.equal(scene1.beatType, 'OPENING_IMAGE');
    assert.ok(scene1.elements.some((e) => e.type === 'SCENE_HEADING'));
    assert.ok(scene1.elements.some((e) => e.type === 'ENGINE_DIRECTIVE'));
    assert.ok(scene1.elements.some((e) => e.type === 'DIALOGUE'));
    assert.ok(scene1.engineParameters.lighting.kelvin > 0);
    assert.ok(scene1.engineParameters.camera.focalLength);
  });

  it('compiles written scenes into pipeline-ready production shot list', () => {
    const script = generateHollywoodScreenplay(
      {
        title: 'STRIKE VECTOR',
        genre: 'BLOCKBUSTER_ACTION',
        scope: 'SCENE_BREAKDOWN',
        leadCharacterId: 'char-elena',
        antagonistCharacterId: 'char-chen',
        selectedSetIds: ['set-alley'],
      },
      INITIAL_CHARACTERS,
      INITIAL_SETS
    );

    const shots = compileScreenplayToProductionShots(script);
    assert.ok(shots.length >= 10, 'Must compile multiple shots per scene');
    const wideShot = shots.find((s) => s.shotType === 'WIDE ESTABLISHING');
    assert.ok(wideShot, 'Wide establishing shot must be present');
    assert.equal(wideShot?.motionEngine, 'Wan 2.1 (Cinematic I2V)');
    assert.ok(wideShot?.stillPrompt.includes('Lighting:'));
  });

  it('formats screenplay into canonical Fountain script layout', () => {
    const script = generateHollywoodScreenplay(
      {
        title: 'THE RUNNER',
        genre: 'HIGH_END_THRILLER',
        scope: 'BEAT_TREATMENT',
        leadCharacterId: 'char-elena',
        antagonistCharacterId: 'char-chen',
        selectedSetIds: ['set-alley'],
      },
      INITIAL_CHARACTERS,
      INITIAL_SETS
    );

    const fountain = formatToFountainScript(script);
    assert.ok(fountain.includes('Title: THE RUNNER'));
    assert.ok(fountain.includes('EXT.') && fountain.includes('NEON ALLEY'));
    assert.ok(fountain.includes('[[ [ENGINE_RIG:'));
  });
});
