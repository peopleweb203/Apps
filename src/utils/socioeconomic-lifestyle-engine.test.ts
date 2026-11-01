import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VEHICLE_REPOSITORY,
  WARDROBE_BRANDS,
  JEWELRY_REPOSITORY,
  TIMEPIECE_REPOSITORY,
  DEPORTMENT_PROFILES,
  getStratumVehicles,
  getStratumWardrobeBrands,
  getStratumJewelry,
  getStratumTimepieces,
  getDefaultLifestyleProfile,
  compileLifestylePayload,
  injectSocioeconomicTokens,
} from './socioeconomic-lifestyle-engine';

describe('Socioeconomic Stratum & Lifestyle Engine', () => {
  it('correctly categorizes luxury assets into the Ultra-Luxury tier', () => {
    const luxuryVehicles = getStratumVehicles('ultra-luxury');
    assert.ok(luxuryVehicles.length >= 3, 'Must have at least 3 ultra-luxury vehicles');
    const maybach = luxuryVehicles.find((v) => v.id === 'veh-maybach-s680');
    assert.ok(maybach, 'Maybach S680 must be present');
    assert.equal(maybach?.finishType, 'high-gloss');
    assert.match(maybach?.promptToken || '', /Mercedes-Maybach/);

    const luxuryBrands = getStratumWardrobeBrands('ultra-luxury');
    assert.ok(luxuryBrands.some((b) => b.name === 'Gucci'));
    assert.ok(luxuryBrands.some((b) => b.name === 'Louis Vuitton'));
    assert.ok(luxuryBrands.some((b) => b.name === 'Savile Row Bespoke'));

    const luxuryJewelry = getStratumJewelry('ultra-luxury');
    assert.ok(luxuryJewelry.some((j) => j.id === 'jwl-diamond-tennis'));

    const luxuryWatches = getStratumTimepieces('ultra-luxury');
    assert.ok(luxuryWatches.some((w) => w.id === 'watch-rolex-daytona'));
    assert.ok(luxuryWatches.some((w) => w.id === 'watch-patek-nautilus'));
  });

  it('correctly categorizes Working Class and Street Impoverished strata', () => {
    const workingVehicles = getStratumVehicles('working-class');
    assert.ok(workingVehicles.some((v) => v.name.includes('Civic') || v.name.includes('Corolla')));

    const workingBrands = getStratumWardrobeBrands('working-class');
    assert.ok(workingBrands.some((b) => b.name.includes('Carhartt')));

    const streetVehicles = getStratumVehicles('street-impoverished');
    assert.ok(streetVehicles.some((v) => v.id === 'veh-beater-sedan'));

    const streetJewelry = getStratumJewelry('street-impoverished');
    assert.ok(streetJewelry.some((j) => j.id === 'jwl-none'));
  });

  it('compiles an ultra-luxury profile with high coherence score and negative exclusions', () => {
    const defaultLuxury = getDefaultLifestyleProfile('char-chen', 'ultra-luxury');
    const compiled = compileLifestylePayload(defaultLuxury);

    assert.equal(compiled.stratum, 'ultra-luxury');
    assert.ok(compiled.coherenceScore >= 90, 'Default profile must have high coherence');
    assert.equal(compiled.coherenceWarnings.length, 0);
    assert.match(compiled.positivePromptInjection, /SOCIOECONOMIC_TIER: ULTRA-LUXURY/);
    assert.match(compiled.positivePromptInjection, /Mercedes-Maybach/);
    assert.ok(compiled.negativeExclusions.includes('cheap off-the-rack polyester clothing'));
    assert.ok(compiled.materialFinishes.length >= 3);
  });

  it('detects stratum mismatch warnings and penalizes coherence score for conflicting assignments', () => {
    const mismatchedProfile = {
      characterId: 'char-test',
      stratum: 'street-impoverished' as const,
      netWorthTier: '<$15K',
      selectedVehicleId: 'veh-maybach-s680', // Incongruent!
      selectedWardrobeBrandIds: ['brand-gucci'], // Incongruent!
      selectedJewelryId: 'jwl-diamond-tennis', // Incongruent!
      selectedTimepieceId: 'watch-rolex-daytona', // Incongruent!
    };

    const compiled = compileLifestylePayload(mismatchedProfile);
    assert.ok(compiled.coherenceScore < 50, 'Mismatched tier must drastically lower coherence score');
    assert.ok(compiled.coherenceWarnings.length >= 3, 'Must register warnings for vehicle, wardrobe, jewelry, and watch');
  });

  it('injects socioeconomic tokens into existing prompt cleanly', () => {
    const profile = getDefaultLifestyleProfile('char-elena', 'working-class');
    const basePrompt = 'Elena walks through an industrial warehouse district';
    const enriched = injectSocioeconomicTokens(basePrompt, profile);

    assert.match(enriched, /Elena walks through an industrial warehouse district\./);
    assert.match(enriched, /SOCIOECONOMIC_TIER: WORKING-CLASS/);
    assert.match(enriched, /Carhartt-style/);
    assert.match(enriched, /Material accents:/);
  });
});
