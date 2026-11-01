import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateAgentDensityMatrix,
  compileSpatialWorldPrompt,
  buildCrowdWorldPayload,
  DEFAULT_CROWD_WORLD_CONFIG,
} from './crowd-world-engine';

describe('Crowd & World Background Engine', () => {
  test('generates dense agent matrix with 100+ agents and non-repeating micro-actions', () => {
    const config = { ...DEFAULT_CROWD_WORLD_CONFIG, totalAgentDensity: 115 };
    const matrix = generateAgentDensityMatrix(config);

    assert.strictEqual(matrix.totalAgents, 115);
    assert.ok(matrix.agents.length >= 100);
    assert.ok(matrix.lodDistribution.LOD0_HERO_SHARP > 0, 'Must have foreground hero agents');
    assert.ok(matrix.lodDistribution.LOD1_FULL_DETAIL > 0, 'Must have midground detail agents');
    assert.ok(matrix.lodDistribution.LOD3_SILHOUETTE_ATMOSPHERE > 0, 'Must have background silhouettes');
    assert.ok(matrix.visualPoolingScore < 0.35, 'Visual pooling score must remain dispersed below 0.35');
  });

  test('compiles spatial prompt with foreground, midground, and background planes', () => {
    const result = compileSpatialWorldPrompt(
      'Elena walks through rain-slick night alley toward dispatch terminal',
      DEFAULT_CROWD_WORLD_CONFIG
    );

    assert.ok(result.compiledPrompt.includes('[PLANE: FOREGROUND]'));
    assert.ok(result.compiledPrompt.includes('[PLANE: MIDGROUND]'));
    assert.ok(result.compiledPrompt.includes('[PLANE: DEEP_BACKGROUND]'));
    assert.ok(result.passes.basePlatePass.includes('Macro Environment'));
    assert.ok(result.passes.agentDensityPass.includes('Ultra-Dense World Population'));
    assert.strictEqual(result.coherenceMetrics.heroEyeLineProtected, true);
  });

  test('builds complete crowd world payload for render dispatch', () => {
    const payload = buildCrowdWorldPayload(
      'Vance monitors dispatch security catwalk',
      { ...DEFAULT_CROWD_WORLD_CONFIG, totalAgentDensity: 140 }
    );

    assert.strictEqual(payload.agentMatrix.totalCount, 140);
    assert.strictEqual(payload.coherenceControl.depthConditioningMapEnabled, true);
    assert.strictEqual(payload.coherenceControl.preserveSharpness, true);
    assert.ok(payload.agentMatrix.microActionsSummary.length > 0);
  });
});
