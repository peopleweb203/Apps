/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Wardrobe & Prop Persistence Vault
 * Prevents mid-scene morphing of hero accessories, weapons, tech wearables, and vehicle plates
 * using attention mask segmentation and negative anti-drift prompts.
 */

export type PropCategory = 'hero_weapon' | 'cyber_wearable' | 'tactical_gear' | 'vehicle_chassis' | 'relic_hardware';

export interface HeroPropAsset {
  id: string;
  name: string;
  category: PropCategory;
  assignedCharacterId: string;
  referenceImageUrl: string;
  attentionMaskArea: 'right_hand_grip' | 'left_hand_grip' | 'chest_harness' | 'cranial_optic' | 'holster_waist' | 'ground_adjacent';
  materialFinish: string;
  negativeAntiMorphPrompt: string;
  isLocked: boolean;
  lockHash: string;
}

export interface CostumeLayer {
  layerId: string;
  characterId: string;
  name: string;
  slot: 'outerwear' | 'base_suit' | 'footwear' | 'neural_collar' | 'gloves';
  materialTexture: string;
  hexPalette: string[];
  referenceImageUrl: string;
  isWeatherDamaged: boolean;
  damageWearPercent: number; // 0 to 100%
  isLocked: boolean;
}

export const INITIAL_HERO_PROPS: HeroPropAsset[] = [
  {
    id: 'prop-neural-deck',
    name: 'Exo-Dec Pulse Courier Terminal',
    category: 'relic_hardware',
    assignedCharacterId: 'char-elena',
    referenceImageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    attentionMaskArea: 'right_hand_grip',
    materialFinish: 'Brushed Titanium with Orange OLED display array',
    negativeAntiMorphPrompt: 'no rounded smartphone, no plastic case, no missing antennas, no changing wire colors',
    isLocked: true,
    lockHash: 'PROP_HASH_9824_TITANIUM',
  },
  {
    id: 'prop-stunt-knife',
    name: 'Ceramic Tactical Shiv with Neon Edge',
    category: 'hero_weapon',
    assignedCharacterId: 'char-elena',
    referenceImageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=600&q=80',
    attentionMaskArea: 'holster_waist',
    materialFinish: 'Matte Black Zirconia Ceramic with cyan edge glow',
    negativeAntiMorphPrompt: 'no silver kitchen knife, no wooden handle, no shape change',
    isLocked: true,
    lockHash: 'PROP_HASH_1423_CERAMIC',
  },
  {
    id: 'prop-cyber-ocular',
    name: 'Vance Monocular Targeting HUD',
    category: 'cranial_optic' as any,
    assignedCharacterId: 'char-vance',
    referenceImageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    attentionMaskArea: 'cranial_optic',
    materialFinish: 'Brass and Carbon-Fiber optical gimbal assembly',
    negativeAntiMorphPrompt: 'no normal eyeglasses, no missing red diode, no altered ocular lens shape',
    isLocked: true,
    lockHash: 'PROP_HASH_7719_OCULAR',
  },
];

export const INITIAL_COSTUME_LAYERS: CostumeLayer[] = [
  {
    layerId: 'layer-elena-jacket',
    characterId: 'char-elena',
    name: 'High-Collar Carbon Weather Jacket',
    slot: 'outerwear',
    materialTexture: 'Water-Repellent Kevlar Weave with luminescent orange trims',
    hexPalette: ['#f97316', '#171717', '#404040'],
    referenceImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    isWeatherDamaged: true,
    damageWearPercent: 28,
    isLocked: true,
  },
  {
    layerId: 'layer-vance-trench',
    characterId: 'char-vance',
    name: 'Heavy Industrial Ballistic Trench',
    slot: 'outerwear',
    materialTexture: 'Oil-Stained Canvas with reinforced shoulder plates',
    hexPalette: ['#1c1917', '#292524', '#78716c'],
    referenceImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    isWeatherDamaged: false,
    damageWearPercent: 12,
    isLocked: true,
  },
];

/**
 * Builds attention mask conditioning string for a given character and prop
 */
export function buildPropAttentionMaskPrompt(props: HeroPropAsset[], characterId: string): string {
  const charProps = props.filter((p) => p.assignedCharacterId === characterId && p.isLocked);
  if (charProps.length === 0) return '';

  const tags = charProps.map(
    (p) => `[ATTENTION_MASK: ${p.attentionMaskArea.toUpperCase()}] ${p.name} (${p.materialFinish}). Lock Hash: #${p.lockHash}`
  );

  return tags.join(' ');
}
