/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Automated Lip-Sync & Non-Human Jaw Deformation Engine
 * Universal Viseme-to-Morphology Mapper supporting Humanoid, Elongated Snout,
 * Rigid Inanimate (Stone/Bronze/Armor), Rigid Beak, and Multi-Part Alien Mandibles.
 */

export type JawMorphologyType =
  | 'humanoid_elastic'
  | 'elongated_snout'
  | 'rigid_stone_statue'
  | 'rigid_beak_carapace'
  | 'alien_multipart_mandible';

export interface VisemePhonemePoint {
  phoneme: string;
  visemeSymbol: 'silence' | 'PP' | 'FF' | 'TH' | 'DD' | 'kk' | 'CH' | 'SS' | 'nn' | 'RR' | 'aa' | 'E' | 'I' | 'O' | 'U';
  timeStartMs: number;
  timeEndMs: number;
  jawOpenDegree: number; // 0.0 to 1.0
  horizontalSpread: number; // -1.0 to 1.0
  lipCurlFactor: number; // 0.0 to 1.0
  tongueElevation: number; // 0.0 to 1.0
}

export interface MorphologyConfig {
  architecture: JawMorphologyType;
  elasticityMultiplier: number; // 0.1 (rigid stone) to 2.5 (squash & stretch cartoon)
  jawOpeningLimitPercent: number; // 20% to 150%
  lipTightnessPercent: number; // 0% to 100%
  snoutWrinkleDisplacement: boolean;
  dustParticleSuppression: boolean; // For stone/bronze statues
  mandibleSplitVectorDegrees: number; // 0 to 45 degrees
  elevenLabsVoiceId: string;
}

export interface MorphologyArchitectureProfile {
  id: JawMorphologyType;
  name: string;
  category: 'Humanoid' | 'Beast/Creature' | 'Inanimate/Mechanical' | 'Avian' | 'Extraterrestrial';
  description: string;
  kinematicHinge: string;
  visemeDeformationStrategy: string;
  defaultElasticity: number;
  recommendedVoiceStyle: string;
}

export const MORPHOLOGY_PROFILES: Record<JawMorphologyType, MorphologyArchitectureProfile> = {
  humanoid_elastic: {
    id: 'humanoid_elastic',
    name: 'Standard Humanoid (Fleshy Elasticity)',
    category: 'Humanoid',
    description: 'Realistic biological articulation with full lip press, labiodental teeth exposure, round O-shapes, and tongue positioning.',
    kinematicHinge: 'Temporomandibular Joint (Rotational + Translating Condyle)',
    visemeDeformationStrategy: 'Organic muscle deformation with orbicularis oris compression',
    defaultElasticity: 1.0,
    recommendedVoiceStyle: 'Natural spoken dialogue (ElevenLabs Turbo v2.5)',
  },
  elongated_snout: {
    id: 'elongated_snout',
    name: 'Elongated Muzzle/Snout (Canine/Feline/Dragon)',
    category: 'Beast/Creature',
    description: 'Forward-projected jaw hinge dynamics with pronounced upper lip curl on sibilants and secondary snout skin wrinkling.',
    kinematicHinge: 'Forward-Projected Caudal Hinge with 65° Max Arc',
    visemeDeformationStrategy: 'Rhinal bridge skin wrinkling with flehmen-like canine tooth exposure',
    defaultElasticity: 1.25,
    recommendedVoiceStyle: 'Guttural / Resonant Bass (Gravel Timbre)',
  },
  rigid_stone_statue: {
    id: 'rigid_stone_statue',
    name: 'Rigid Stone / Bronze Golem / Armored Helmet',
    category: 'Inanimate/Mechanical',
    description: 'Zero fleshy deformation. Pure mechanical hinged jaw kinematics with micro-fracture dust suppression or acoustic vibration ripples.',
    kinematicHinge: 'Chiseled Planar Pivot with Zero Flesh Creasing',
    visemeDeformationStrategy: 'Acoustic surface resonance ripples & stone-joint micro-fracture suppression',
    defaultElasticity: 0.15,
    recommendedVoiceStyle: 'Deep Cavernous Reverb / Metallic Resonator',
  },
  rigid_beak_carapace: {
    id: 'rigid_beak_carapace',
    name: 'Rigid Beak & Keratin Carapace (Avian/Chitinous)',
    category: 'Avian',
    description: 'Rigid upper and lower occlusal snap with zero fleshy stretching. Rapid percussive phoneme clatter with gular pouch flutter.',
    kinematicHinge: 'Kinetic Craniofacial Hinge with Scissor Occlusion',
    visemeDeformationStrategy: 'Rigid keratin plates snapping without lateral distortion; gular pouch expansion',
    defaultElasticity: 0.3,
    recommendedVoiceStyle: 'Sharp Staccato / High-Frequency Piercing',
  },
  alien_multipart_mandible: {
    id: 'alien_multipart_mandible',
    name: 'Multi-Part Mandibles (Insectoid / Quad-Split Alien)',
    category: 'Extraterrestrial',
    description: 'Split dual horizontal and vertical articulation vectors with lateral splay on open vowels and chittering closure.',
    kinematicHinge: 'Quad-Axis Lateral Ginglymus Joint with Dual Chelicerae',
    visemeDeformationStrategy: '4-quadrant outward splay on vowels; high-speed interlocking pincers on labials',
    defaultElasticity: 0.8,
    recommendedVoiceStyle: 'Sub-Harmonic Click / Dual-Phonetic Chirp',
  },
};

export const DEFAULT_MORPHOLOGY_CONFIG: MorphologyConfig = {
  architecture: 'humanoid_elastic',
  elasticityMultiplier: 1.0,
  jawOpeningLimitPercent: 100,
  lipTightnessPercent: 50,
  snoutWrinkleDisplacement: true,
  dustParticleSuppression: true,
  mandibleSplitVectorDegrees: 25,
  elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Elena default voice ID
};

/**
 * Sample ElevenLabs-synchronized timestamped visemes for testing & visual scrubbers
 */
export const SAMPLE_VISEME_TIMELINE: VisemePhonemePoint[] = [
  { phoneme: 'SIL', visemeSymbol: 'silence', timeStartMs: 0, timeEndMs: 120, jawOpenDegree: 0.0, horizontalSpread: 0.0, lipCurlFactor: 0.0, tongueElevation: 0.0 },
  { phoneme: 'T', visemeSymbol: 'DD', timeStartMs: 120, timeEndMs: 220, jawOpenDegree: 0.15, horizontalSpread: 0.3, lipCurlFactor: 0.1, tongueElevation: 0.8 },
  { phoneme: 'EH', visemeSymbol: 'E', timeStartMs: 220, timeEndMs: 380, jawOpenDegree: 0.45, horizontalSpread: 0.5, lipCurlFactor: 0.2, tongueElevation: 0.4 },
  { phoneme: 'R', visemeSymbol: 'RR', timeStartMs: 380, timeEndMs: 500, jawOpenDegree: 0.3, horizontalSpread: -0.2, lipCurlFactor: 0.15, tongueElevation: 0.7 },
  { phoneme: 'M', visemeSymbol: 'PP', timeStartMs: 500, timeEndMs: 640, jawOpenDegree: 0.0, horizontalSpread: 0.1, lipCurlFactor: 0.3, tongueElevation: 0.0 },
  { phoneme: 'IH', visemeSymbol: 'I', timeStartMs: 640, timeEndMs: 780, jawOpenDegree: 0.35, horizontalSpread: 0.4, lipCurlFactor: 0.1, tongueElevation: 0.6 },
  { phoneme: 'N', visemeSymbol: 'nn', timeStartMs: 780, timeEndMs: 910, jawOpenDegree: 0.2, horizontalSpread: 0.2, lipCurlFactor: 0.0, tongueElevation: 0.85 },
  { phoneme: 'AH', visemeSymbol: 'aa', timeStartMs: 910, timeEndMs: 1100, jawOpenDegree: 0.85, horizontalSpread: 0.2, lipCurlFactor: 0.4, tongueElevation: 0.2 },
  { phoneme: 'L', visemeSymbol: 'DD', timeStartMs: 1100, timeEndMs: 1250, jawOpenDegree: 0.25, horizontalSpread: 0.1, lipCurlFactor: 0.1, tongueElevation: 0.9 },
  { phoneme: 'SIL', visemeSymbol: 'silence', timeStartMs: 1250, timeEndMs: 1500, jawOpenDegree: 0.0, horizontalSpread: 0.0, lipCurlFactor: 0.0, tongueElevation: 0.0 },
];

/**
 * Computes deformation vectors based on morphology architecture & visemes
 */
export function computeMorphologyDeformation(
  viseme: VisemePhonemePoint,
  config: MorphologyConfig = DEFAULT_MORPHOLOGY_CONFIG
): {
  jawDeltaY: number;
  lipSpreadX: number;
  secondaryDeformationTag: string;
  diffusionMaskWeights: {
    upperMouth: number;
    lowerJaw: number;
    rhinalBridge: number;
    lateralMandibles: number;
  };
} {
  const elasticity = config.elasticityMultiplier;
  const maxJaw = config.jawOpeningLimitPercent / 100;

  let jawDeltaY = viseme.jawOpenDegree * elasticity * maxJaw;
  let lipSpreadX = viseme.horizontalSpread * elasticity;
  let secondaryTag = '';

  const weights = {
    upperMouth: 0.5,
    lowerJaw: 1.0,
    rhinalBridge: 0.0,
    lateralMandibles: 0.0,
  };

  switch (config.architecture) {
    case 'rigid_stone_statue':
      // Bone-hard mechanical translation, zero elastic stretch
      jawDeltaY = Math.min(0.4, viseme.jawOpenDegree * 0.4 * maxJaw);
      lipSpreadX = 0; // Stone cannot stretch horizontally
      secondaryTag = 'Chiseled stone joint pivot, acoustic micro-vibrations, dust containment suppression';
      weights.upperMouth = 0.0;
      weights.lowerJaw = 0.8;
      break;

    case 'elongated_snout':
      // Forward projected hinge + skin wrinkling along snout bridge
      jawDeltaY = viseme.jawOpenDegree * 1.15 * maxJaw;
      secondaryTag = config.snoutWrinkleDisplacement
        ? 'Rhinal bridge skin wrinkling with upper canine exposure on sibilants'
        : 'Smooth muzzle opening';
      weights.rhinalBridge = 0.75;
      weights.upperMouth = 0.6;
      break;

    case 'rigid_beak_carapace':
      // Binary occlusal snap, zero fleshy lip curl
      jawDeltaY = (viseme.jawOpenDegree > 0.15 ? 0.65 : 0.0) * maxJaw;
      lipSpreadX = 0;
      secondaryTag = 'Percussive keratin beak clatter, gular pouch resonance';
      weights.lowerJaw = 1.0;
      weights.upperMouth = 0.0;
      break;

    case 'alien_multipart_mandible':
      // Split 4-way outward splay
      const splay = (viseme.jawOpenDegree * config.mandibleSplitVectorDegrees) / 45;
      secondaryTag = `Quad-mandible lateral outward splay at ${Math.round(splay * 35)}° angle, insectoid chittering labial closure`;
      weights.lateralMandibles = 1.0;
      weights.lowerJaw = 0.7;
      break;

    case 'humanoid_elastic':
    default:
      secondaryTag = 'Organic facial muscle elasticity, accurate tongue and teeth exposure';
      weights.upperMouth = 0.8;
      weights.lowerJaw = 1.0;
      break;
  }

  return {
    jawDeltaY: Math.round(jawDeltaY * 100) / 100,
    lipSpreadX: Math.round(lipSpreadX * 100) / 100,
    secondaryDeformationTag: secondaryTag,
    diffusionMaskWeights: weights,
  };
}

/**
 * Compiles morphology control tokens into the video diffusion prompt & LatentSync conditioning
 */
export function buildLipSyncMorphologyPayload(
  basePrompt: string,
  config: MorphologyConfig = DEFAULT_MORPHOLOGY_CONFIG
) {
  const profile = MORPHOLOGY_PROFILES[config.architecture];
  const sampleDeform = computeMorphologyDeformation(SAMPLE_VISEME_TIMELINE[7], config); // Sample 'AH' open vowel

  const morphologyTag = `[MORPHOLOGY_PIPELINE: ${profile.name.toUpperCase()}] Hinge Kinematics: ${profile.kinematicHinge}. Deformation Strategy: ${profile.visemeDeformationStrategy}. Elasticity: ${config.elasticityMultiplier}x multiplier, Max Jaw Opening: ${config.jawOpeningLimitPercent}%. ElevenLabs Voice Bound: #${config.elevenLabsVoiceId}. Secondary Articulation: ${sampleDeform.secondaryDeformationTag}.`;

  const finalPrompt = `${basePrompt.trim()}. Latent Lip-Sync Articulation: ${morphologyTag} Frame-accurate phoneme temporal masks injected.`;

  return {
    finalPrompt,
    morphologyTag,
    architecture: config.architecture,
    elasticityMultiplier: config.elasticityMultiplier,
    visemeTimeline: SAMPLE_VISEME_TIMELINE,
    diffusionWeights: sampleDeform.diffusionMaskWeights,
  };
}
