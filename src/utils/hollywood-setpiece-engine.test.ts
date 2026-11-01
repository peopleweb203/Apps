import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SETPIECE_CATALOG,
  compileHollywoodSetpiece,
  validateSetpiecePhysics,
  injectHollywoodSetpiecePrompt,
} from './hollywood-setpiece-engine';

describe('Hollywood Setpiece & Extreme Physics Engine', () => {
  it('provides comprehensive blockbuster action archetypes in catalog', () => {
    assert.ok(SETPIECE_CATALOG.length >= 3);
    const massThrow = SETPIECE_CATALOG.find((s) => s.archetype === 'superhuman-mass-throw');
    assert.ok(massThrow, 'Superhuman mass throw must be present');
    assert.ok(massThrow?.defaultEvents.length >= 4, 'Must have multi-vector timeline events');

    const rooftop = SETPIECE_CATALOG.find((s) => s.archetype === 'skyscraper-rooftop-vertigo');
    assert.ok(rooftop, 'Skyscraper rooftop vertigo must be present');
    assert.equal(rooftop?.defaultCamera, 'vertigo-pitch-down-precipice');
  });

  it('compiles a blockbuster setpiece with heavy mass physics and camera optics', () => {
    const plan = compileHollywoodSetpiece('superhuman-mass-throw', 'Elena Cross', 'extreme-low-angle-ground-slam', true);

    assert.equal(plan.archetype, 'superhuman-mass-throw');
    assert.ok(plan.timelineEvents.length >= 4);
    assert.match(plan.promptTokens.visualActionPrompt, /Elena Cross/);
    assert.match(plan.promptTokens.cameraOpticsPrompt, /Panavision/);
    assert.match(plan.promptTokens.vfxDebrisPrompt, /volumetric pyroclastic fireball/);
    assert.ok(plan.promptTokens.negativeExclusions.includes('floaty physics'));
    assert.ok(plan.physicsParameters.kineticEnergyMegajoules > 0);
  });

  it('validates realistic physics and detects floaty CGI errors', () => {
    const plan = compileHollywoodSetpiece('superhuman-mass-throw', 'Elena Cross');
    const report = validateSetpiecePhysics(plan);

    assert.ok(report.isPhysicsPlausible, 'Valid plan must be plausible');
    assert.equal(report.floatyCgiDetected, false);
    assert.ok(report.gravityScore >= 80);

    // Test artificial floaty modification
    const floatyPlan = {
      ...plan,
      physicsParameters: {
        ...plan.physicsParameters,
        kineticEnergyMegajoules: 1.0, // Insufficient for a 3800kg vehicle at 45 m/s!
      },
    };
    const floatyReport = validateSetpiecePhysics(floatyPlan);
    assert.equal(floatyReport.floatyCgiDetected, true);
    assert.ok(floatyReport.gravityScore < 80);
    assert.ok(floatyReport.recommendations.some((r) => r.includes('floaty visual weight')));
  });

  it('injects blockbuster action and physics into prompt cleanly', () => {
    const plan = compileHollywoodSetpiece('skyscraper-rooftop-vertigo', 'Elena Cross');
    const basePrompt = 'Elena confronts cyber mercs during rain storm';
    const injected = injectHollywoodSetpiecePrompt(basePrompt, plan);

    assert.match(injected, /Elena confronts cyber mercs during rain storm\./);
    assert.match(injected, /BLOCKBUSTER_ACTION: SKYSCRAPER-ROOFTOP-VERTIGO/);
    assert.match(injected, /Camera Optics: Arri Alexa 65/);
    assert.match(injected, /Physics & VFX:/);
  });
});
