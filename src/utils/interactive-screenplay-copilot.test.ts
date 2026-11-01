import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeSteerableBeats,
  mapInterventionToEngineTriggers,
  reindexDownstreamBeats,
  PLOT_TWIST_CATALOG,
  DirectorIntervention,
} from './interactive-screenplay-copilot';

describe('Interactive Screenplay Director Co-Pilot Engine', () => {
  it('initializes 15 steerable narrative beats with proper act assignments', () => {
    const beats = initializeSteerableBeats();
    assert.equal(beats.length, 15);
    assert.equal(beats[0].beat, 'OPENING_IMAGE');
    assert.equal(beats[0].act, 'Act I');
    assert.equal(beats[13].beat, 'FINALE_CLIMAX');
    assert.equal(beats[13].act, 'Act III');
  });

  it('maps plot twist presets to active cross-engine triggers', () => {
    const betrayalIntervention: DirectorIntervention = {
      id: 'int-1',
      targetBeat: 'ALL_IS_LOST',
      twistPreset: 'TRUSTED_ALLY_BETRAYAL',
      customDirective: 'Kaelen shuts down the firewall and sells out Elena.',
      tensionLevel: 95,
      spectacleDensity: 80,
      appliedAt: new Date().toISOString(),
    };

    const triggers = mapInterventionToEngineTriggers(betrayalIntervention);
    assert.equal(triggers.combatRigActive, true);
    assert.equal(triggers.shutterAngle, 90);
    assert.equal(triggers.scoreSuddenSilence, true);
    assert.ok(triggers.scoreTension >= 90);
  });

  it('re-indexes downstream beats and updates impact dependencies', () => {
    const beats = initializeSteerableBeats();
    const intervention: DirectorIntervention = {
      id: 'int-emp',
      targetBeat: 'MIDPOINT',
      twistPreset: 'ARTIFACT_IS_TRAP',
      customDirective: 'The artifact detonates an EMP stalling the Mercedes-Maybach.',
      tensionLevel: 90,
      spectacleDensity: 70,
      appliedAt: new Date().toISOString(),
    };

    const reindexed = reindexDownstreamBeats(beats, 9, intervention);
    const midpointBeat = reindexed.find((b) => b.beatIndex === 9);
    assert.ok(midpointBeat?.downstreamImpacts.length);
    assert.equal(midpointBeat?.status, 'DRAFTED');

    // Downstream beat (e.g. Beat 10) must reflect the EMP consequence
    const downstreamBeat = reindexed.find((b) => b.beatIndex === 10);
    assert.ok(downstreamBeat?.downstreamImpacts.some((imp) => imp.includes('Beat #9')));
  });
});
