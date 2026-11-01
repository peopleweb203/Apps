import { CharacterProfile } from '../types';

export type CharacterMoodTag =
  | 'Gritty & Defiant'
  | 'Calculating & Cold'
  | 'Urgent & Kinetic'
  | 'Stoic & Vigilant'
  | 'Enigmatic & Noir';

export type CharacterOutfitStyleTag =
  | 'Tactical Ballistic'
  | 'Bespoke Executive'
  | 'Cyber-Tech Streetwear'
  | 'Utilitarian Workwear'
  | 'High-Fashion Luxury';

export type CharacterRoleCategoryTag =
  | 'Lead Protagonist'
  | 'Primary Antagonist'
  | 'Tech Specialist / Ally'
  | 'Supporting Operative'
  | 'Ensemble / World';

export const MOOD_TAG_OPTIONS: CharacterMoodTag[] = [
  'Gritty & Defiant',
  'Calculating & Cold',
  'Urgent & Kinetic',
  'Stoic & Vigilant',
  'Enigmatic & Noir',
];

export const OUTFIT_STYLE_TAG_OPTIONS: CharacterOutfitStyleTag[] = [
  'Tactical Ballistic',
  'Bespoke Executive',
  'Cyber-Tech Streetwear',
  'Utilitarian Workwear',
  'High-Fashion Luxury',
];

export const ROLE_CATEGORY_TAG_OPTIONS: CharacterRoleCategoryTag[] = [
  'Lead Protagonist',
  'Primary Antagonist',
  'Tech Specialist / Ally',
  'Supporting Operative',
  'Ensemble / World',
];

export interface CharacterAssetTags {
  mood: CharacterMoodTag;
  outfitStyle: CharacterOutfitStyleTag;
  roleCategory: CharacterRoleCategoryTag;
  keywords: string[];
  confidenceScore: number;
}

export interface CharacterTagFilterCriteria {
  searchQuery?: string;
  mood?: CharacterMoodTag | 'ALL';
  outfitStyle?: CharacterOutfitStyleTag | 'ALL';
  roleCategory?: CharacterRoleCategoryTag | 'ALL';
  keyword?: string | null;
}

/**
 * Automatically categorizes a character asset by Mood, Outfit Style, and Role
 * from their role description, signature wardrobe, and voice profile metadata.
 */
export function autoCategorizeCharacterAssets(character: CharacterProfile): CharacterAssetTags {
  const roleText = (character.role || '').toLowerCase();
  const wardrobeText = (character.signatureWardrobe || '').toLowerCase();
  const voiceText = `${character.voiceName || ''} ${character.voiceSampleText || ''}`.toLowerCase();
  const combined = `${roleText} ${wardrobeText} ${voiceText}`;

  // 1. Determine Role Category
  let roleCategory: CharacterRoleCategoryTag = 'Supporting Operative';
  if (character.roleCategoryOverride) {
    roleCategory = character.roleCategoryOverride as CharacterRoleCategoryTag;
  } else if (
    roleText.includes('protagonist') ||
    roleText.includes('lead') ||
    roleText.includes('hero')
  ) {
    roleCategory = 'Lead Protagonist';
  } else if (
    roleText.includes('antagonist') ||
    roleText.includes('villain') ||
    roleText.includes('chief') ||
    roleText.includes('director')
  ) {
    roleCategory = 'Primary Antagonist';
  } else if (
    roleText.includes('decker') ||
    roleText.includes('cryptographer') ||
    roleText.includes('hacker') ||
    roleText.includes('tech') ||
    roleText.includes('ally')
  ) {
    roleCategory = 'Tech Specialist / Ally';
  } else if (roleText.includes('crowd') || roleText.includes('civilian')) {
    roleCategory = 'Ensemble / World';
  }

  // 2. Determine Outfit Style
  let outfitStyle: CharacterOutfitStyleTag = 'Utilitarian Workwear';
  if (character.outfitStyleOverride) {
    outfitStyle = character.outfitStyleOverride as CharacterOutfitStyleTag;
  } else if (
    wardrobeText.includes('tailored') ||
    wardrobeText.includes('double-breasted') ||
    wardrobeText.includes('suit') ||
    wardrobeText.includes('lapel')
  ) {
    outfitStyle = 'Bespoke Executive';
  } else if (
    wardrobeText.includes('ballistic') ||
    wardrobeText.includes('duster') ||
    wardrobeText.includes('armor') ||
    wardrobeText.includes('combat') ||
    wardrobeText.includes('weather-sealed')
  ) {
    outfitStyle = 'Tactical Ballistic';
  } else if (
    wardrobeText.includes('hoodie') ||
    wardrobeText.includes('visor') ||
    wardrobeText.includes('haptic') ||
    wardrobeText.includes('patchwork') ||
    wardrobeText.includes('neon')
  ) {
    outfitStyle = 'Cyber-Tech Streetwear';
  } else if (
    wardrobeText.includes('gucci') ||
    wardrobeText.includes('silk') ||
    wardrobeText.includes('diamond') ||
    wardrobeText.includes('couture')
  ) {
    outfitStyle = 'High-Fashion Luxury';
  }

  // 3. Determine Mood
  let mood: CharacterMoodTag = 'Stoic & Vigilant';
  if (character.moodOverride) {
    mood = character.moodOverride as CharacterMoodTag;
  } else if (
    voiceText.includes('gritty') ||
    voiceText.includes('ghosts') ||
    combined.includes('rogue') ||
    combined.includes('locked')
  ) {
    mood = 'Gritty & Defiant';
  } else if (
    voiceText.includes('authoritative') ||
    voiceText.includes('calm') ||
    voiceText.includes('terminated') ||
    combined.includes('bureau')
  ) {
    mood = 'Calculating & Cold';
  } else if (
    voiceText.includes('urgent') ||
    voiceText.includes('technical') ||
    voiceText.includes('decaying') ||
    voiceText.includes('fried')
  ) {
    mood = 'Urgent & Kinetic';
  } else if (combined.includes('noir') || combined.includes('shadow')) {
    mood = 'Enigmatic & Noir';
  }

  // 4. Extract semantic keywords for rapid tag retrieval
  const rawKeywords = new Set<string>();
  const tokenMap: Array<[string, string]> = [
    ['ballistic', 'ballistic-gear'],
    ['duster', 'tactical-duster'],
    ['neural', 'neural-implant'],
    ['optic', 'cyber-optics'],
    ['tailored', 'bespoke-tailoring'],
    ['double-breasted', 'executive-coat'],
    ['hoodie', 'street-tech-hoodie'],
    ['visor', 'holo-visor'],
    ['haptic', 'haptic-rig'],
    ['courier', 'data-courier'],
    ['bureau', 'corp-director'],
    ['cryptographer', 'quantum-decker'],
  ];

  for (const [needle, tag] of tokenMap) {
    if (combined.includes(needle)) {
      rawKeywords.add(tag);
    }
  }

  if (character.customTags && character.customTags.length > 0) {
    for (const custom of character.customTags) {
      const cleaned = custom.trim().replace(/^#/, '').toLowerCase();
      if (cleaned) rawKeywords.add(cleaned);
    }
  }

  if (rawKeywords.size === 0) {
    rawKeywords.add(roleCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  }

  return {
    mood,
    outfitStyle,
    roleCategory,
    keywords: Array.from(rawKeywords),
    confidenceScore: 96,
  };
}

/**
 * Filters a list of characters by Mood, Outfit Style, Role Category, Keyword, and Search Query
 */
export function filterCharactersByTags(
  characters: CharacterProfile[],
  criteria: CharacterTagFilterCriteria
): CharacterProfile[] {
  const query = (criteria.searchQuery || '').trim().toLowerCase();
  const moodFilter = criteria.mood && criteria.mood !== 'ALL' ? criteria.mood : null;
  const outfitFilter =
    criteria.outfitStyle && criteria.outfitStyle !== 'ALL' ? criteria.outfitStyle : null;
  const roleFilter =
    criteria.roleCategory && criteria.roleCategory !== 'ALL' ? criteria.roleCategory : null;
  const keywordFilter = criteria.keyword ? criteria.keyword.trim().toLowerCase() : null;

  return characters.filter((char) => {
    const tags = autoCategorizeCharacterAssets(char);

    if (moodFilter && tags.mood !== moodFilter) return false;
    if (outfitFilter && tags.outfitStyle !== outfitFilter) return false;
    if (roleFilter && tags.roleCategory !== roleFilter) return false;
    if (keywordFilter && !tags.keywords.some((k) => k.toLowerCase() === keywordFilter)) {
      return false;
    }

    if (query) {
      const searchable = [
        char.name,
        char.role,
        char.signatureWardrobe,
        tags.mood,
        tags.outfitStyle,
        tags.roleCategory,
        ...tags.keywords,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(query)) return false;
    }

    return true;
  });
}

/**
 * Computes distribution counts across Mood, Outfit Style, and Role Categories
 */
export function computeCharacterTagDistribution(characters: CharacterProfile[]): {
  byMood: Record<string, number>;
  byOutfitStyle: Record<string, number>;
  byRoleCategory: Record<string, number>;
} {
  const byMood: Record<string, number> = {};
  const byOutfitStyle: Record<string, number> = {};
  const byRoleCategory: Record<string, number> = {};

  for (const char of characters) {
    const tags = autoCategorizeCharacterAssets(char);
    byMood[tags.mood] = (byMood[tags.mood] || 0) + 1;
    byOutfitStyle[tags.outfitStyle] = (byOutfitStyle[tags.outfitStyle] || 0) + 1;
    byRoleCategory[tags.roleCategory] = (byRoleCategory[tags.roleCategory] || 0) + 1;
  }

  return { byMood, byOutfitStyle, byRoleCategory };
}
