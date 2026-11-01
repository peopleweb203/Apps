/**
 * Interactive Director Co-Pilot & Dynamic Plot Twist Injector
 * Enables human-in-the-loop beat-by-beat story steering, non-autonomous approval gates,
 * dynamic narrative re-alignment, and automated cross-engine directive mapping.
 */

import { NarrativeBeatType, ScreenplayScene, ScreenplayElement } from './hollywood-screenplay-orchestrator';
import { SetpieceArchetype } from './hollywood-setpiece-engine';
import { WealthStratum } from './socioeconomic-lifestyle-engine';

export type BeatStatus = 'PENDING' | 'DRAFTED' | 'DIRECTOR_APPROVED' | 'LOCKED';

export type PlotTwistPreset =
  | 'TRUSTED_ALLY_BETRAYAL'
  | 'SECRET_LINEAGE'
  | 'FALSE_VICTORY_AMBUSH'
  | 'ARTIFACT_IS_TRAP'
  | 'REALITY_SIMULATION_GLITCH'
  | 'RELUCTANT_ENEMY_SWITCH';

export interface DirectorIntervention {
  id: string;
  targetBeat: NarrativeBeatType;
  twistPreset?: PlotTwistPreset;
  customDirective: string;
  tensionLevel: number; // 0 to 100
  spectacleDensity: number; // 0 to 100
  toneShift?: 'DARK_GRITTY' | 'KINETIC_THRILL' | 'TRAGIC_LOW_POINT' | 'HEROIC_TRIUMPH';
  escalationTrigger?: 'INCREASE_THREAT' | 'FORCE_DILEMMA' | 'CALL_AIR_SUPPORT' | 'EMP_BLACKOUT';
  appliedAt: string;
}

export interface SteerableBeatState {
  beat: NarrativeBeatType;
  beatIndex: number; // 1 to 15
  act: 'Act I' | 'Act II-A' | 'Act II-B' | 'Act III';
  title: string;
  status: BeatStatus;
  currentDraft?: ScreenplayScene;
  interventions: DirectorIntervention[];
  downstreamImpacts: string[];
}

export interface CrossEngineTriggers {
  combatRigActive: boolean;
  shutterAngle: 90 | 180;
  bulletTimeOrbit: boolean;
  vehicleAction?: string;
  wardrobeDamage?: string;
  scoreTension: number;
  scoreSuddenSilence: boolean;
  dmxFlickerPattern: string;
  dmxColorShift: string;
}

// -------------------------------------------------------------
// PLOT TWIST CATALOG
// -------------------------------------------------------------

export const PLOT_TWIST_CATALOG: Array<{
  id: PlotTwistPreset;
  title: string;
  description: string;
  storyImpact: string;
  defaultTriggers: Partial<CrossEngineTriggers>;
}> = [
  {
    id: 'TRUSTED_ALLY_BETRAYAL',
    title: 'The Trusted Ally Betrayal',
    description: 'The companion or decker secretly reports to the antagonist corporation, sabotaging access codes from within.',
    storyImpact: 'Forces immediate combat, strips communication gear, spikes emotional tension to 90+.',
    defaultTriggers: {
      combatRigActive: true,
      shutterAngle: 90,
      scoreTension: 92,
      scoreSuddenSilence: true,
      dmxFlickerPattern: 'LIGHTNING_STROBE',
      wardrobeDamage: 'Torn holster strap from close-quarters scuffle',
    },
  },
  {
    id: 'SECRET_LINEAGE',
    title: 'Hidden Identity / Secret Lineage',
    description: 'The neural implant or bio-signature is revealed to be the stolen genetic master-key to the megalopolis grid.',
    storyImpact: 'Shifts character role from courier to primary sovereign heir, introducing regal deportment.',
    defaultTriggers: {
      scoreTension: 75,
      dmxColorShift: 'Royal Gold & Cyan (5600K)',
      wardrobeDamage: 'Reveals pristine metallic neural lattice under collar',
    },
  },
  {
    id: 'FALSE_VICTORY_AMBUSH',
    title: 'False Victory into Ambush',
    description: 'The vault door opens, but a heavy synth-enforcer squad is already positioned with heavy ballistics.',
    storyImpact: 'Instant tactical reversal; switches from stealth infiltration to extreme vehicular evasion.',
    defaultTriggers: {
      combatRigActive: true,
      shutterAngle: 90,
      bulletTimeOrbit: true,
      vehicleAction: 'High-speed tactical reverse through plate glass',
      scoreTension: 98,
      dmxFlickerPattern: 'MUZZLE_FLASH',
    },
  },
  {
    id: 'ARTIFACT_IS_TRAP',
    title: 'The Artifact is an EMP Trap',
    description: 'The retrieved data core detonates a non-lethal micro-EMP pulse, killing all vehicle ignition and optics.',
    storyImpact: 'Blackout conditions; electronics fail, forcing characters into manual hand-to-hand survival.',
    defaultTriggers: {
      vehicleAction: 'Sudden high-gloss vehicle engine stall with skid',
      dmxFlickerPattern: 'FAULTY_NEON',
      dmxColorShift: 'Instant Blackout into dim emergency red',
      scoreSuddenSilence: true,
      scoreTension: 88,
    },
  },
  {
    id: 'REALITY_SIMULATION_GLITCH',
    title: 'Simulation / Reality Glitch',
    description: 'Architectural geometry begins pixelating and de-rezzing, exposing the entire city as a military VR sandbox.',
    storyImpact: 'Existential dread; physics laws can now be bent by willpower, unlocking Wire-Fu feats.',
    defaultTriggers: {
      combatRigActive: true,
      bulletTimeOrbit: true,
      shutterAngle: 90,
      dmxFlickerPattern: 'TV_SCREEN',
      scoreTension: 85,
    },
  },
  {
    id: 'RELUCTANT_ENEMY_SWITCH',
    title: 'The Reluctant Enemy Switch',
    description: 'The antagonist chief of security realizes the corporation intends to sterilize the sector and joins the heroes.',
    storyImpact: 'Combines arsenal and tactical intel; sets up two-pronged simultaneous climactic assault.',
    defaultTriggers: {
      combatRigActive: true,
      vehicleAction: 'Chauffeured Maybach coordinates with Hero truck',
      scoreTension: 80,
      dmxColorShift: 'Warm Tungsten to Cool Cyan balance',
    },
  },
];

// -------------------------------------------------------------
// COPILOT RE-ALIGNMENT ENGINE
// -------------------------------------------------------------

/**
 * Initializes the 15-beat steerable state timeline.
 */
export function initializeSteerableBeats(): SteerableBeatState[] {
  const titles: Record<NarrativeBeatType, { act: 'Act I' | 'Act II-A' | 'Act II-B' | 'Act III'; title: string }> = {
    OPENING_IMAGE: { act: 'Act I', title: 'Opening Image / World Status Quo' },
    THEME_STATED: { act: 'Act I', title: 'Theme Stated & Philosophical Premise' },
    SET_UP: { act: 'Act I', title: 'Character Setup & Flaw Demonstration' },
    CATALYST: { act: 'Act I', title: 'Inciting Catalyst / Cargo Received' },
    DEBATE: { act: 'Act I', title: 'Debate & Hesitation' },
    BREAK_INTO_TWO: { act: 'Act I', title: 'Break into Two / Crossing Threshold' },
    B_STORY: { act: 'Act II-A', title: 'B-Story / Alliance Formed' },
    FUN_AND_GAMES: { act: 'Act II-A', title: 'Fun & Games / Tactical Vehicular Chase' },
    MIDPOINT: { act: 'Act II-A', title: 'Midpoint Turn / Stakes Doubled' },
    BAD_GUYS_CLOSE_IN: { act: 'Act II-B', title: 'Bad Guys Close In / Perimeter Collapse' },
    ALL_IS_LOST: { act: 'Act II-B', title: 'All Is Lost / Devastating Betrayal' },
    DARK_NIGHT_OF_SOUL: { act: 'Act II-B', title: 'Dark Night of the Soul / Quiet Resolve' },
    BREAK_INTO_THREE: { act: 'Act III', title: 'Break into Three / Counter-Strike Plan' },
    FINALE_CLIMAX: { act: 'Act III', title: 'Finale Climax / Blockbuster Setpiece' },
    FINAL_IMAGE: { act: 'Act III', title: 'Final Image / Transformed Reality' },
  };

  const beats: NarrativeBeatType[] = [
    'OPENING_IMAGE',
    'THEME_STATED',
    'SET_UP',
    'CATALYST',
    'DEBATE',
    'BREAK_INTO_TWO',
    'B_STORY',
    'FUN_AND_GAMES',
    'MIDPOINT',
    'BAD_GUYS_CLOSE_IN',
    'ALL_IS_LOST',
    'DARK_NIGHT_OF_SOUL',
    'BREAK_INTO_THREE',
    'FINALE_CLIMAX',
    'FINAL_IMAGE',
  ];

  return beats.map((b, idx) => ({
    beat: b,
    beatIndex: idx + 1,
    act: titles[b].act,
    title: titles[b].title,
    status: idx === 0 ? 'DRAFTED' : 'PENDING',
    interventions: [],
    downstreamImpacts: [],
  }));
}

/**
 * Maps a Director Intervention into cross-engine platform triggers.
 */
export function mapInterventionToEngineTriggers(intervention: DirectorIntervention): CrossEngineTriggers {
  let triggers: CrossEngineTriggers = {
    combatRigActive: false,
    shutterAngle: 180,
    bulletTimeOrbit: false,
    scoreTension: intervention.tensionLevel,
    scoreSuddenSilence: false,
    dmxFlickerPattern: 'STEADY',
    dmxColorShift: 'Standard Scene Kelvin',
  };

  if (intervention.twistPreset) {
    const preset = PLOT_TWIST_CATALOG.find((p) => p.id === intervention.twistPreset);
    if (preset?.defaultTriggers) {
      triggers = {
        ...triggers,
        ...preset.defaultTriggers,
      };
    }
  }

  // Handle freeform keywords
  const promptLower = intervention.customDirective.toLowerCase();

  if (promptLower.includes('emp') || promptLower.includes('blackout')) {
    triggers.dmxFlickerPattern = 'FAULTY_NEON';
    triggers.scoreSuddenSilence = true;
    triggers.vehicleAction = 'Engine stalls and headlights flicker off';
  }

  if (promptLower.includes('combat') || promptLower.includes('fight') || promptLower.includes('shootout')) {
    triggers.combatRigActive = true;
    triggers.shutterAngle = 90;
    triggers.bulletTimeOrbit = true;
  }

  if (promptLower.includes('missile') || promptLower.includes('explosion') || promptLower.includes('car throw')) {
    triggers.shutterAngle = 90;
    triggers.dmxFlickerPattern = 'EXPLOSION_BOOM';
    triggers.scoreTension = 95;
  }

  if (promptLower.includes('statue') || promptLower.includes('alien') || promptLower.includes('demigod')) {
    triggers.wardrobeDamage = 'Metamorphic skin transformation with rigid jaw stone kinematics';
    triggers.scoreTension = 85;
  }

  if (intervention.spectacleDensity > 75) {
    triggers.shutterAngle = 90;
    triggers.combatRigActive = true;
  }

  return triggers;
}

/**
 * Re-aligns downstream narrative beats when a twist or intervention is injected.
 */
export function reindexDownstreamBeats(
  beats: SteerableBeatState[],
  targetBeatIndex: number,
  intervention: DirectorIntervention
): SteerableBeatState[] {
  const triggers = mapInterventionToEngineTriggers(intervention);

  return beats.map((b) => {
    if (b.beatIndex < targetBeatIndex) {
      return b; // Preceding beats remain intact or receive retro-clues
    }

    if (b.beatIndex === targetBeatIndex) {
      return {
        ...b,
        status: 'DRAFTED',
        interventions: [...b.interventions, intervention],
        downstreamImpacts: [
          `Active intervention: "${intervention.customDirective || intervention.twistPreset}". Tension set to ${intervention.tensionLevel}.`,
        ],
      };
    }

    // Downstream consequences
    const impacts: string[] = [
      `Resolves fallout from Beat #${targetBeatIndex} (${intervention.twistPreset || 'Custom Directive'}).`,
    ];

    if (triggers.combatRigActive) {
      impacts.push('Carries forward high-kinetic Matrix combat choreography and 90° shutter.');
    }
    if (triggers.vehicleAction) {
      impacts.push(`Maintains consequence of vehicle action: ${triggers.vehicleAction}.`);
    }
    if (triggers.scoreSuddenSilence) {
      impacts.push('Score transitions from dead silence into rising dissonant strings.');
    }

    return {
      ...b,
      downstreamImpacts: impacts,
      // If downstream was locked, set back to DRAFTED so director reviews
      status: b.status === 'LOCKED' ? 'DRAFTED' : b.status,
    };
  });
}
