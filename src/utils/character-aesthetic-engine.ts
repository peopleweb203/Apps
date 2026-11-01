/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Character Aesthetics Engine
 * Anatomical Silhouette, Proportional Physics & Hero Physique Matrix
 * Calibrates Hollywood-grade Golden Ratio silhouettes (WHR 0.70 / SWR 1.618),
 * natural tissue dynamics, and strict anatomical integrity sentinels.
 */

export type GenderAesthetic = 'Female' | 'Male';

export type FemaleSilhouettePreset =
  | 'cinematic_hourglass'
  | 'voluptuous_lead'
  | 'athletic_action_heroine'
  | 'svelte_runway';

export type MaleSilhouettePreset =
  | 'heroic_v_taper'
  | 'sculpted_leading_man'
  | 'lean_athletic_operative'
  | 'heavyweight_powerhouse';

export interface FemalePhysiqueConfig {
  waistToHipRatio: number; // 0.68 to 0.74 (optimal 0.70)
  curveDefinitionPercent: number; // 50% to 100%
  bustToWaistRatio: number; // 1.25 to 1.45
  coreFirmnessPercent: number; // 60% to 100%
  skinLuminescenceGrade: 'Radiant Dewy' | 'Velvet Matte' | 'Sun-Kissed Golden';
  postureEleganceGrade: 'Regal Heroic Standing' | 'Dynamic Ready Stance' | 'Graceful Poise';
  preset: FemaleSilhouettePreset;
}

export interface MalePhysiqueConfig {
  shoulderToWaistRatio: number; // 1.50 to 1.68 (optimal 1.618 Golden Ratio)
  pectoralDefinitionPercent: number; // 60% to 100%
  hypertrophyGrade: 'Lean Athletic Operative' | 'Chiseled Leading Man' | 'Heavyweight Superhero';
  vascularityGrade: 'Subtle Athletic' | 'Crisp Vascular Deltoids' | 'Natural Clean';
  jawlineDefinitionGrade: 'Chiseled Mandibular Square' | 'Angular Diamond' | 'Strong Defined Rugged';
  preset: MaleSilhouettePreset;
}

export interface AestheticEngineConfig {
  gender: GenderAesthetic;
  female: FemalePhysiqueConfig;
  male: MalePhysiqueConfig;
  attractivenessTierScore: number; // 8.0 to 9.8 Hollywood Star Tier
  enforceAnatomicalSentinel: boolean;
}

export const DEFAULT_FEMALE_PHYSIQUE: FemalePhysiqueConfig = {
  waistToHipRatio: 0.70, // Hollywood standard hourglass
  curveDefinitionPercent: 88,
  bustToWaistRatio: 1.35,
  coreFirmnessPercent: 92,
  skinLuminescenceGrade: 'Radiant Dewy',
  postureEleganceGrade: 'Regal Heroic Standing',
  preset: 'cinematic_hourglass',
};

export const DEFAULT_MALE_PHYSIQUE: MalePhysiqueConfig = {
  shoulderToWaistRatio: 1.618, // Golden Ratio V-Taper
  pectoralDefinitionPercent: 90,
  hypertrophyGrade: 'Chiseled Leading Man',
  vascularityGrade: 'Crisp Vascular Deltoids',
  jawlineDefinitionGrade: 'Chiseled Mandibular Square',
  preset: 'heroic_v_taper',
};

export const DEFAULT_AESTHETIC_CONFIG: AestheticEngineConfig = {
  gender: 'Female',
  female: DEFAULT_FEMALE_PHYSIQUE,
  male: DEFAULT_MALE_PHYSIQUE,
  attractivenessTierScore: 9.4,
  enforceAnatomicalSentinel: true,
};

export const ANATOMICAL_NEGATIVE_PROMPT = [
  'distorted torso',
  'deformed ribcage',
  'exaggerated caricature proportions',
  'uneven limbs',
  'melted anatomy',
  'flat musculature',
  'low muscle tone',
  'rubbery skin',
  'ballooning geometry',
  'clipping garments',
  'uncanny valley mutations',
  'poor posture',
  'slouching asymmetry',
].join(', ');

/**
 * Validates anatomical integrity to guarantee no uncanny caricature distortion
 */
export function validateAnatomicalIntegrity(config: AestheticEngineConfig): {
  isValid: boolean;
  tierLabel: string;
  renderPriorityBonus: number;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (config.gender === 'Female') {
    if (config.female.waistToHipRatio < 0.65 || config.female.waistToHipRatio > 0.80) {
      warnings.push(`Waist-to-hip ratio (${config.female.waistToHipRatio}) deviates outside natural aesthetic range (0.68-0.74).`);
    }
  } else {
    if (config.male.shoulderToWaistRatio < 1.40 || config.male.shoulderToWaistRatio > 1.80) {
      warnings.push(`Shoulder-to-waist ratio (${config.male.shoulderToWaistRatio}) deviates outside golden V-taper range (1.50-1.68).`);
    }
  }

  const score = Math.max(8.0, Math.min(9.9, config.attractivenessTierScore));
  const tierLabel =
    score >= 9.5
      ? 'A-LIST CINEMATIC ICON (9.5+)'
      : score >= 9.0
      ? 'HOLLYWOOD LEAD TIER (9.0-9.4)'
      : 'ELEVATED SCREEN PRESENCE (8.0-8.9)';

  const renderPriorityBonus = score >= 9.0 ? 1.5 : 1.0;

  return {
    isValid: warnings.length === 0,
    tierLabel,
    renderPriorityBonus,
    warnings,
  };
}

/**
 * Compiles high-tier aesthetic physique prompt tokens
 */
export function compileAestheticPhysiquePrompt(
  characterName: string,
  config: AestheticEngineConfig = DEFAULT_AESTHETIC_CONFIG
) {
  const validation = validateAnatomicalIntegrity(config);

  let silhouetteTokens = '';

  if (config.gender === 'Female') {
    const f = config.female;
    silhouetteTokens = `sculpted cinematic hourglass silhouette, ${f.waistToHipRatio} waist-to-hip ratio, balanced natural curve distribution, firm athletic core, ${f.skinLuminescenceGrade} skin luminescence with fine pore texture, sculpted high cheekbones and full defined lips, ${f.postureEleganceGrade}, realistic physical fabric draping, flawless anatomy`;
  } else {
    const m = config.male;
    silhouetteTokens = `heroic classical V-taper physique, ${m.shoulderToWaistRatio} golden ratio shoulder-to-waist proportion, broad clavicles with narrow athletic waist, chiseled pectoral separation and defined abs, ${m.vascularityGrade}, ${m.jawlineDefinitionGrade} jawline architecture, confident commanding posture, flawless anatomy`;
  }

  const compiledPrompt = `[CHARACTER_AESTHETICS: ${characterName.toUpperCase()}] Attractiveness Tier: ${config.attractivenessTierScore}/10.0 (${validation.tierLabel}). ${silhouetteTokens}. Strict anatomical integrity enforced.`;

  return {
    compiledPrompt,
    negativePrompt: ANATOMICAL_NEGATIVE_PROMPT,
    tierLabel: validation.tierLabel,
    renderPriority: validation.renderPriorityBonus,
    isAnatomicallySound: validation.isValid,
  };
}
