import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateBiometricSeed,
  calculateBiometricSimilarity,
  buildDecoupledRegionalPrompt,
  computeLastFrameChaining,
  DemographicBiometrics,
} from './production-continuity-engine';

describe('Production Continuity Engine', () => {
  test('generates deterministic biometric seeds from character name and role', () => {
    const seed1 = generateBiometricSeed('Elena Rostova', 'Protagonist / Courier');
    const seed2 = generateBiometricSeed('Elena Rostova', 'Protagonist / Courier');
    const seedOther = generateBiometricSeed('Marcus Vance', 'Corrupt Dispatcher');

    assert.strictEqual(typeof seed1, 'number');
    assert.strictEqual(seed1, seed2, 'Identical character inputs must produce identical seeds');
    assert.notStrictEqual(seed1, seedOther, 'Different characters must produce distinct seeds');
  });

  test('calculates biometric similarity and verifies uniqueness (<15% threshold)', () => {
    const bioElena: DemographicBiometrics = {
      facialBoneStructure: 'High Angular Cheekbones',
      eyeGeometry: 'Deep-Set Monolid',
      skinUndertoneHex: '#e0ac69',
      skinTexture: 'Warm Golden Olive',
      ageBracket: '26-29',
      signatureFeature: 'Carbon-mesh neural collar and titanium jawline seam',
      biometricSeed: 8492041,
      negativePromptExclusions: ['broad rounded jaw', 'fair pale skin'],
    };

    const bioVance: DemographicBiometrics = {
      facialBoneStructure: 'Broad Jawline',
      eyeGeometry: 'Round Expressive',
      skinUndertoneHex: '#c68642',
      skinTexture: 'Weathered Rugged',
      ageBracket: '42-45',
      signatureFeature: 'Heavy cybernetic ocular implant over right eye',
      biometricSeed: 3918472,
      negativePromptExclusions: ['narrow delicate face'],
    };

    const result = calculateBiometricSimilarity(bioElena, bioVance);
    assert.strictEqual(result.similarityScorePercent, 0, 'Elena and Vance should have zero structural overlap');
    assert.strictEqual(result.isUnique, true, 'Result must be under 15% similarity');
    assert.ok(result.divergenceFactors.length >= 3, 'Must identify multiple divergence factors');
  });

  test('detects identical clone when biometrics and seeds match 100%', () => {
    const bioElena: DemographicBiometrics = {
      facialBoneStructure: 'High Angular Cheekbones',
      eyeGeometry: 'Deep-Set Monolid',
      skinUndertoneHex: '#e0ac69',
      skinTexture: 'Warm Golden Olive',
      ageBracket: '26-29',
      signatureFeature: 'Neural collar',
      biometricSeed: 8492041,
      negativePromptExclusions: [],
    };

    const cloneResult = calculateBiometricSimilarity(bioElena, { ...bioElena });
    assert.strictEqual(cloneResult.similarityScorePercent, 100);
    assert.strictEqual(cloneResult.isUnique, false);
  });

  test('builds multi-character decoupled regional prompts preventing attribute leakage', () => {
    const chars = [
      {
        characterId: 'char-elena',
        name: 'Elena',
        role: 'Protagonist',
        biometrics: {
          facialBoneStructure: 'High Angular Cheekbones' as const,
          eyeGeometry: 'Deep-Set Monolid' as const,
          skinUndertoneHex: '#e0ac69',
          skinTexture: 'Warm Golden Olive' as const,
          ageBracket: '28',
          signatureFeature: 'Neon orange courier jacket',
          biometricSeed: 101,
          negativePromptExclusions: [],
        },
        referenceSheet: {
          characterId: 'char-elena',
          frontPortraitUrl: '',
          threeQuarterLeftUrl: '',
          threeQuarterRightUrl: '',
          profileSilhouetteUrl: '',
          fullBodyCostumeUrl: '',
          anchorsCompiledAt: '',
          ipAdapterAnchorWeight: 0.88,
        },
        isBiometricsLocked: true,
        assignedColorTheme: '#f59e0b',
      },
      {
        characterId: 'char-vance',
        name: 'Vance',
        role: 'Antagonist',
        biometrics: {
          facialBoneStructure: 'Broad Jawline' as const,
          eyeGeometry: 'Narrow Recessed' as const,
          skinUndertoneHex: '#8d5524',
          skinTexture: 'Weathered Rugged' as const,
          ageBracket: '45',
          signatureFeature: 'Heavy cybernetic eye',
          biometricSeed: 202,
          negativePromptExclusions: [],
        },
        referenceSheet: {
          characterId: 'char-vance',
          frontPortraitUrl: '',
          threeQuarterLeftUrl: '',
          threeQuarterRightUrl: '',
          profileSilhouetteUrl: '',
          fullBodyCostumeUrl: '',
          anchorsCompiledAt: '',
          ipAdapterAnchorWeight: 0.88,
        },
        isBiometricsLocked: true,
        assignedColorTheme: '#06b6d4',
      },
    ];

    const decoupled = buildDecoupledRegionalPrompt('Elena confronts Vance on rain-slick catwalk', chars);
    assert.ok(decoupled.unifiedPrompt.includes('Elena'));
    assert.ok(decoupled.unifiedPrompt.includes('Vance'));
    assert.strictEqual(decoupled.regionalAttentionMasks.length, 2);
    assert.ok(decoupled.regionalAttentionMasks[0].negativeFilter.includes('Heavy cybernetic eye'));
    assert.ok(decoupled.regionalAttentionMasks[1].negativeFilter.includes('Neon orange courier jacket'));
  });

  test('computes last-frame chaining for sequential takes', () => {
    const chainShot1 = computeLastFrameChaining(1);
    assert.strictEqual(chainShot1.active, false, 'Shot 1 cannot chain from a previous shot');

    const chainShot2 = computeLastFrameChaining(2, 'https://images.unsplash.com/shot-1.jpg');
    assert.strictEqual(chainShot2.active, true, 'Shot 2 must chain from Shot 1');
    assert.strictEqual(chainShot2.previousShotId, 'shot-1');
    assert.ok(chainShot2.extractedLastFrameUrl.includes('tail_cut_frozen'));
  });
});
