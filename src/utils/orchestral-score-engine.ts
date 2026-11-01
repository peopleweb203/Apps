/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Automated Multi-Genre Orchestral Score & Dynamic Leitmotif Engine
 * Narrative Tension & Beat Mapping, Stem-Separated Arrangements,
 * Character Leitmotif Vault, and Genre Orchestration Presets.
 */

export type OrchestralGenre =
  | 'epic_blockbuster_zimmer'
  | 'fantasy_adventure_williams'
  | 'scifi_noir_vangelis'
  | 'psychological_thriller_herrmann';

export interface GenreOrchestrationPreset {
  id: OrchestralGenre;
  name: string;
  signatureComposerVibe: string;
  tempoBpmRange: [number, number];
  primaryInstrumentation: string;
  harmonicLanguage: string;
  percussionProfile: string;
  subBassWeightPercent: number;
}

export interface CharacterLeitmotif {
  characterId: string;
  characterName: string;
  themeTitle: string;
  melodicContour: 'Ascending Minor 6th (Resilience)' | 'Chromatic Descending (Menace)' | 'Lydian Fanfare (Heroic)' | 'Phrygian Ostinato (Cunning)';
  leadInstrument: 'Solo Cello (Warm & Melancholic)' | 'Muted French Horn' | 'Vangelis CS-80 Synth Lead' | 'Cor Anglais Woodwind';
  keySignature: string; // e.g. D Minor, Bb Lydian
  entryTrigger: 'hero_enter_frame' | 'climax_dialogue' | 'combat_strike';
  activeInScene: boolean;
}

export interface TensionKeyframeCue {
  timeSec: number;
  tensionScore: number; // 0 to 100
  musicalCue: 'brass_swell' | 'staccato_hit' | 'string_tremolo' | 'sub_drop' | 'legato_peace';
  description: string;
}

export interface ScoreStemsMix {
  stringsLevelPercent: number; // 0 to 100
  brassWoodwindsPercent: number;
  percussionTaikoPercent: number;
  synthsSubBassPercent: number;
  dialogueDuckingReductionDb: number;
}

export const GENRE_PRESETS_MAP: Record<OrchestralGenre, GenreOrchestrationPreset> = {
  epic_blockbuster_zimmer: {
    id: 'epic_blockbuster_zimmer',
    name: 'Epic Blockbuster (Zimmer Hybrid Braam & Taiko)',
    signatureComposerVibe: 'Hans Zimmer / Junkie XL Massive Scale',
    tempoBpmRange: [110, 138],
    primaryInstrumentation: '16 French Horns, Low Brass Braams, Spiccato Violoncellos, Moog Sub-Bass',
    harmonicLanguage: 'Power Chord Ostinatos, D Minor Root Suspensions, Rising 4ths',
    percussionProfile: '60-inch Gran Cassa, Japanese Taiko Ensemble, Anvil Metallic Hits',
    subBassWeightPercent: 88,
  },
  fantasy_adventure_williams: {
    id: 'fantasy_adventure_williams',
    name: 'Fantasy / Theatrical Adventure (Williams Legato)',
    signatureComposerVibe: 'John Williams / Michael Giacchino Thematic Splendor',
    tempoBpmRange: [92, 124],
    primaryInstrumentation: 'Concert Flutes, Solo Corno, Rich Symphonic Violins, Harp Glissandos',
    harmonicLanguage: 'Lydian Dominant, Rich Tertiary Chord Modulations, Soaring Heroic Cadences',
    percussionProfile: 'Orchestral Timpani, Piatti Crash, Tubular Bells, Snare Cadences',
    subBassWeightPercent: 35,
  },
  scifi_noir_vangelis: {
    id: 'scifi_noir_vangelis',
    name: 'Sci-Fi Cyber-Noir (Vangelis CS-80 & Reverb Horns)',
    signatureComposerVibe: 'Vangelis / Blade Runner 2049 Atmospheric Depth',
    tempoBpmRange: [64, 88],
    primaryInstrumentation: 'Vangelis CS-80 Analog Brass Lead, Lush Convolution Reverb, Muted Flugelhorn',
    harmonicLanguage: 'Dorian Minor Chords, Ethereal Pad Clusters, Shimmering Modulations',
    percussionProfile: 'Deep Gated Electronic Snares, Distant Distorted Thunder Booms',
    subBassWeightPercent: 92,
  },
  psychological_thriller_herrmann: {
    id: 'psychological_thriller_herrmann',
    name: 'Psychological Thriller (Dissonant Clusters & Stabs)',
    signatureComposerVibe: 'Bernard Herrmann / Mica Levi Visceral Unease',
    tempoBpmRange: [72, 105],
    primaryInstrumentation: 'Screeching Sul Ponticello Violins, Col Legno Battuto, Prepared Piano, Sub-Pulses',
    harmonicLanguage: 'Diminished Octatonic, Semitone Clusters, Microtonal Glissandos',
    percussionProfile: 'Bowed Waterphone, Metallic Bowed Cymbals, Irregular Heartbeat Thuds',
    subBassWeightPercent: 78,
  },
};

export const INITIAL_LEITMOTIFS: CharacterLeitmotif[] = [
  {
    characterId: 'char-elena',
    characterName: 'Elena Rostova',
    themeTitle: "The Courier's Defiance",
    melodicContour: 'Ascending Minor 6th (Resilience)',
    leadInstrument: 'Solo Cello (Warm & Melancholic)',
    keySignature: 'D Minor',
    entryTrigger: 'hero_enter_frame',
    activeInScene: true,
  },
  {
    characterId: 'char-vance',
    characterName: 'Marcus Vance',
    themeTitle: 'The Chrome Inquisitor',
    melodicContour: 'Chromatic Descending (Menace)',
    leadInstrument: 'Muted French Horn',
    keySignature: 'C# Minor',
    entryTrigger: 'climax_dialogue',
    activeInScene: true,
  },
];

export const INITIAL_TENSION_CUES: TensionKeyframeCue[] = [
  { timeSec: 0.0, tensionScore: 35, musicalCue: 'legato_peace', description: 'Low ambient strings, rain-slick alley atmosphere' },
  { timeSec: 1.8, tensionScore: 60, musicalCue: 'string_tremolo', description: 'Tremolo strings crescendo as Elena reaches the door' },
  { timeSec: 3.2, tensionScore: 88, musicalCue: 'brass_swell', description: 'Vance emerges into spotlight, heavy low brass swell' },
  { timeSec: 4.5, tensionScore: 95, musicalCue: 'staccato_hit', description: 'Combat stance lock, sharp taiko and brass braam impact' },
];

/**
 * Computes dynamic stem levels based on scene tension and dialogue activity
 */
export function calculateDynamicStemLevels(
  tensionScore: number, // 0 to 100
  isDialoguePlaying: boolean,
  genre: OrchestralGenre = 'scifi_noir_vangelis'
): ScoreStemsMix {
  const normTension = Math.max(0, Math.min(100, tensionScore)) / 100;
  const ducking = isDialoguePlaying ? -4.5 : 0.0;

  // Tension drives brass and percussion intensity
  const strings = Math.round(55 + normTension * 35);
  const brass = Math.round(30 + normTension * 65);
  const percussion = Math.round(20 + normTension * 75);
  const synths = genre === 'scifi_noir_vangelis' ? 85 : Math.round(40 + normTension * 45);

  return {
    stringsLevelPercent: strings,
    brassWoodwindsPercent: brass,
    percussionTaikoPercent: percussion,
    synthsSubBassPercent: synths,
    dialogueDuckingReductionDb: ducking,
  };
}

/**
 * Compiles dynamic score & leitmotif payload for video/timeline export
 */
export function buildOrchestralScorePayload(
  genre: OrchestralGenre = 'scifi_noir_vangelis',
  tensionCues: TensionKeyframeCue[] = INITIAL_TENSION_CUES,
  leitmotifs: CharacterLeitmotif[] = INITIAL_LEITMOTIFS
) {
  const preset = GENRE_PRESETS_MAP[genre];
  const activeMotifs = leitmotifs.filter((l) => l.activeInScene);
  const maxTension = Math.max(...tensionCues.map((c) => c.tensionScore));
  const stems = calculateDynamicStemLevels(maxTension, true, genre);

  const scorePromptTag = `[ORCHESTRAL_SCORE: ${genre.toUpperCase()} - ${preset.name.toUpperCase()}] Pacing: ${preset.signatureComposerVibe}. Instrumentation: ${preset.primaryInstrumentation}. Harmony: ${preset.harmonicLanguage}. Percussion: ${preset.percussionProfile}. Sub-Bass Weight: ${preset.subBassWeightPercent}%. Leitmotifs: ${activeMotifs.map((m) => `${m.characterName} (${m.themeTitle} - ${m.leadInstrument})`).join(', ')}. Automated Dialogue Ducking: -4.5dB.`;

  return {
    scorePromptTag,
    genrePreset: preset,
    maxTensionScore: maxTension,
    activeLeitmotifs: activeMotifs,
    stemsMix: stems,
    tensionCurve: tensionCues,
  };
}
