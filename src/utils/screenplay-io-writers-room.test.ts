import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFountainScript,
  exportToFountain,
  exportToFinalDraftFdx,
  runAutoTaggingIngestPass,
  ingestScriptFile,
} from './screenplay-io-manager';
import {
  generateSceneVariation,
  mergeDialogueOnly,
  WRITERS_ROOM_MODELS,
} from './multi-model-writers-room';
import { generateHollywoodScreenplay } from './hollywood-screenplay-orchestrator';
import { INITIAL_CHARACTERS, INITIAL_SETS } from '../mock/studio-data';

describe('Screenplay I/O Manager & Writers Room Engine', () => {
  it('parses raw Fountain scripts into structured screenplay scenes', () => {
    const rawFountain = `
Title: THE CHROME GRID

EXT. RAIN-SLICK CYBER ALLEYWAY - NIGHT

Elena stands on the glistening wet asphalt.

ELENA
(whispering into comms)
The perimeter is breached.

[[ ENGINE_RIG: A-CAM 35mm • Kelvin 4300K ]]

SMASH CUT TO:
    `;

    const scenes = parseFountainScript(rawFountain);
    assert.equal(scenes.length, 1);
    assert.equal(scenes[0].heading, 'EXT. RAIN-SLICK CYBER ALLEYWAY - NIGHT');
    assert.equal(scenes[0].timeOfDay, 'NIGHT');
    assert.ok(scenes[0].elements.some((e) => e.type === 'CHARACTER_CUE' && e.text === 'ELENA'));
    assert.ok(scenes[0].elements.some((e) => e.type === 'DIALOGUE'));
    assert.ok(scenes[0].elements.some((e) => e.type === 'ENGINE_DIRECTIVE'));
  });

  it('runs auto-tagging ingest pass detecting vehicles, stunts, and luxury brands', () => {
    const sampleScript = `
Director Chen arrives in a chauffeured Mercedes-Maybach wearing a bespoke tailored suit and diamond ring.
Elena leaps across the skyscraper rooftop before hurling a 3,800kg vehicle into an incoming missile!
The thunderous slapback echo fills the cavernous alleyway.
    `;

    const report = runAutoTaggingIngestPass(sampleScript);
    assert.ok(report.detectedVehicles.some((v) => v.includes('Maybach')));
    assert.ok(report.detectedWardrobeBrands.some((w) => w.includes('Tailoring') || w.includes('Diamond')));
    assert.ok(report.detectedStunts.some((s) => s.includes('3,800kg') || s.includes('Missile')));
    assert.ok(report.detectedAcousticEnvironments.length > 0);
    assert.ok(report.confidenceScore >= 50);
  });

  it('exports valid Final Draft XML (.fdx) with proper paragraph tags', () => {
    const script = generateHollywoodScreenplay(
      {
        title: 'FDX TEST',
        genre: 'BLOCKBUSTER_ACTION',
        scope: 'SCENE_BREAKDOWN',
        leadCharacterId: 'char-elena',
        antagonistCharacterId: 'char-chen',
        selectedSetIds: ['set-alley'],
      },
      INITIAL_CHARACTERS,
      INITIAL_SETS
    );

    const fdx = exportToFinalDraftFdx(script);
    assert.ok(fdx.includes('<FinalDraft DocumentType="Script" Template="No" Version="4">'));
    assert.ok(fdx.includes('<Paragraph Type="Scene Heading">'));
    assert.ok(fdx.includes('<Paragraph Type="Character">'));
    assert.ok(fdx.includes('<Paragraph Type="Dialogue">'));
  });

  it('generates multi-model scene variations and enforces Master In-House Sentinel', () => {
    const script = generateHollywoodScreenplay(
      {
        title: 'VARIATION TEST',
        genre: 'SCIFI_CYBER_EPIC',
        scope: 'SCENE_BREAKDOWN',
        leadCharacterId: 'char-elena',
        antagonistCharacterId: 'char-chen',
        selectedSetIds: ['set-alley'],
      },
      INITIAL_CHARACTERS,
      INITIAL_SETS
    );

    const baseScene = script.scenes[0];
    const variation = generateSceneVariation(baseScene, 'claude-3-5-sonnet', 'DIALOGUE_PUNCH_UP');

    assert.equal(variation.sourceModel, 'claude-3-5-sonnet');
    assert.equal(variation.passType, 'DIALOGUE_PUNCH_UP');
    assert.ok(variation.extractedEngineTagsPreserved >= 1, 'Engine tags must be preserved by Master Sentinel');
    assert.ok(variation.rewrittenScene.elements.some((e) => e.type === 'ENGINE_DIRECTIVE'));

    // Test dialogue merge
    const merged = mergeDialogueOnly(baseScene, variation.rewrittenScene);
    assert.ok(merged.elements.some((e) => e.type === 'DIALOGUE'));
  });
});
