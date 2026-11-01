/**
 * Automated Hollywood Blockbuster Screenplay & Engine-Orchestrator Bot
 * Generates industry-standard dramatic screenplays following 3-Act / 15-beat narrative arcs,
 * parses screenplay elements, and orchestrates cross-engine directives across all CineForge AI modules:
 * Aesthetics, Lifestyle, Setpieces, Multi-Cam, Spatial Audio, Orchestral Leitmotifs, DMX Lighting & 4K Mastering.
 */

import { CharacterProfile, SetLockerPlate, ShotItem, LensType } from '../types';
import { WealthStratum, getDefaultLifestyleProfile, compileLifestylePayload } from './socioeconomic-lifestyle-engine';
import { SetpieceArchetype, CameraStuntPreset, compileHollywoodSetpiece } from './hollywood-setpiece-engine';
import { OrchestralGenre } from './orchestral-score-engine';
import { FlickerPattern } from './dmx-lighting-protocol';

export type ScreenplayScope = 'LOGLINE' | 'BEAT_TREATMENT' | 'SCENE_BREAKDOWN' | 'FULL_SCREENPLAY';

export type ScreenplayGenre =
  | 'BLOCKBUSTER_ACTION'
  | 'SCIFI_CYBER_EPIC'
  | 'HIGH_END_THRILLER'
  | 'FANTASY_ADVENTURE'
  | 'SUPERHERO_SPECTACLE';

export interface ScreenplayGeneratorConfig {
  title: string;
  genre: ScreenplayGenre;
  scope: ScreenplayScope;
  logline?: string;
  leadCharacterId: string;
  antagonistCharacterId: string;
  supportingCharacterId?: string;
  selectedSetIds: string[];
  setpieceArchetype?: SetpieceArchetype;
  orchestralGenre?: OrchestralGenre;
}

export type NarrativeBeatType =
  | 'OPENING_IMAGE'
  | 'THEME_STATED'
  | 'SET_UP'
  | 'CATALYST'
  | 'DEBATE'
  | 'BREAK_INTO_TWO'
  | 'B_STORY'
  | 'FUN_AND_GAMES'
  | 'MIDPOINT'
  | 'BAD_GUYS_CLOSE_IN'
  | 'ALL_IS_LOST'
  | 'DARK_NIGHT_OF_SOUL'
  | 'BREAK_INTO_THREE'
  | 'FINALE_CLIMAX'
  | 'FINAL_IMAGE';

export interface ScreenplayElement {
  type: 'SCENE_HEADING' | 'ACTION_LINE' | 'CHARACTER_CUE' | 'PARENTHETICAL' | 'DIALOGUE' | 'TRANSITION' | 'ENGINE_DIRECTIVE';
  text: string;
  characterId?: string;
  engineData?: Record<string, any>;
}

export interface ExtractedEngineParameters {
  camera: {
    rig: 'A-CAM_MASTER_24mm' | 'B-CAM_MEDIUM_50mm' | 'C-CAM_CLOSEUP_85mm' | 'DUTCH_TILT';
    focalLength: LensType;
    shutterAngle: number; // 90 or 180
    movement: string;
  };
  lighting: {
    kelvin: number;
    dimmerPercent: number;
    flickerPattern: FlickerPattern;
    atmosphere: string;
  };
  wardrobeLifestyle: {
    characterName: string;
    stratum: WealthStratum;
    brandLabel: string;
    vehicleToken?: string;
    jewelryToken?: string;
  };
  vfxStunt: {
    setpieceType?: SetpieceArchetype;
    kineticMassKg?: number;
    projectile?: string;
    explosionBloom?: string;
  };
  audioAcoustics: {
    reverbRoom: string;
    foleySurface: string;
    leitmotifTrigger?: string;
    tensionScore: number;
  };
}

export interface ScreenplayScene {
  id: string;
  sceneNumber: number;
  beatType: NarrativeBeatType;
  heading: string;
  timeOfDay: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN';
  locationName: string;
  locationId?: string;
  summary: string;
  elements: ScreenplayElement[];
  engineParameters: ExtractedEngineParameters;
}

export interface GeneratedScreenplay {
  id: string;
  title: string;
  genre: ScreenplayGenre;
  scope: ScreenplayScope;
  logline: string;
  dramaticArcSummary: string;
  scenes: ScreenplayScene[];
  totalRuntimeEstMinutes: number;
  totalShotCount: number;
  createdAt: string;
}

// -------------------------------------------------------------
// NARRATIVE TEMPLATES & BEAT MAPPING
// -------------------------------------------------------------

export const BLAKE_SNYDER_15_BEATS: Array<{ beat: NarrativeBeatType; act: 'Act I' | 'Act II-A' | 'Act II-B' | 'Act III'; defaultPacing: string }> = [
  { beat: 'OPENING_IMAGE', act: 'Act I', defaultPacing: 'Visual snapshot setting tone, world scale, and status quo.' },
  { beat: 'THEME_STATED', act: 'Act I', defaultPacing: 'Subtle philosophical proposition spoken during dialogue.' },
  { beat: 'SET_UP', act: 'Act I', defaultPacing: 'Introduction of lead protagonist, routine, flaws, and lifestyle.' },
  { beat: 'CATALYST', act: 'Act I', defaultPacing: 'Inciting incident shattering the existing equilibrium.' },
  { beat: 'DEBATE', act: 'Act I', defaultPacing: 'Hesitation, tactical weighing of survival risks and impossible odds.' },
  { beat: 'BREAK_INTO_TWO', act: 'Act I', defaultPacing: 'Hero commits, crossing the threshold into the active conflict zone.' },
  { beat: 'B_STORY', act: 'Act II-A', defaultPacing: 'Secondary emotional relationship or secret alliance enters.' },
  { beat: 'FUN_AND_GAMES', act: 'Act II-A', defaultPacing: 'Core promise of the premise: high-tech infiltrations and vehicular chases.' },
  { beat: 'MIDPOINT', act: 'Act II-A', defaultPacing: 'Stakes escalate dramatically; false victory turns into existential jeopardy.' },
  { beat: 'BAD_GUYS_CLOSE_IN', act: 'Act II-B', defaultPacing: 'Antagonist forces mount a coordinated counter-offensive from all sectors.' },
  { beat: 'ALL_IS_LOST', act: 'Act II-B', defaultPacing: 'The catastrophic low point; loss of core asset, betrayal, or physical defeat.' },
  { beat: 'DARK_NIGHT_OF_SOUL', act: 'Act II-B', defaultPacing: 'Quiet introspective moment facing the shadow before ultimate resolve.' },
  { beat: 'BREAK_INTO_THREE', act: 'Act III', defaultPacing: 'The breakthrough insight combining thematic truth with bold tactical strike.' },
  { beat: 'FINALE_CLIMAX', act: 'Act III', defaultPacing: 'Massive multi-vector Hollywood blockbuster setpiece collision.' },
  { beat: 'FINAL_IMAGE', act: 'Act III', defaultPacing: 'Echo of the opening image proving complete transformation of the world.' },
];

// -------------------------------------------------------------
// SCRIPT GENERATOR CORE
// -------------------------------------------------------------

export function generateHollywoodScreenplay(
  config: ScreenplayGeneratorConfig,
  characters: CharacterProfile[],
  sets: SetLockerPlate[]
): GeneratedScreenplay {
  const lead = characters.find((c) => c.id === config.leadCharacterId) || characters[0];
  const antag = characters.find((c) => c.id === config.antagonistCharacterId) || characters[1] || characters[0];
  const supp = characters.find((c) => c.id === config.supportingCharacterId) || characters[2] || lead;

  const leadLifestyle = compileLifestylePayload(getDefaultLifestyleProfile(lead.id, 'working-class'));
  const antagLifestyle = compileLifestylePayload(getDefaultLifestyleProfile(antag.id, 'ultra-luxury'));

  const primarySet = sets[0] || {
    id: 'set-alley',
    name: 'Rain-Slick Cyber Alleyway',
    description: 'Neon reflections on wet asphalt',
    lightingKelvin: 4300,
    atmosphere: 'Dense atmospheric drizzle with steam vents',
    recommendedLens: '35mm' as LensType,
    spatialTags: ['alley', 'rain', 'neon'],
  };

  const secondarySet = sets[1] || {
    id: 'set-penthouse',
    name: 'Synth-Corp Executive Penthouse',
    description: 'Panoramic glass overlooking megalopolis',
    lightingKelvin: 3200,
    atmosphere: 'Warm amber executive luxury with high contrast',
    recommendedLens: '50mm' as LensType,
    spatialTags: ['penthouse', 'glass', 'luxury'],
  };

  const logline =
    config.logline ||
    `When a rogue courier (${lead.name}) intercepts a quantum biometric drive, she must outmaneuver an elite corporate bureau chief (${antag.name}) across a collapsing megacity before her cerebral implants are remotely liquidated.`;

  // Determine how many scenes to build based on scope
  const beatsToGenerate =
    config.scope === 'LOGLINE'
      ? [BLAKE_SNYDER_15_BEATS[0]]
      : config.scope === 'BEAT_TREATMENT'
      ? BLAKE_SNYDER_15_BEATS.slice(0, 5)
      : config.scope === 'SCENE_BREAKDOWN'
      ? [
          BLAKE_SNYDER_15_BEATS[0], // Opening
          BLAKE_SNYDER_15_BEATS[3], // Catalyst
          BLAKE_SNYDER_15_BEATS[8], // Midpoint
          BLAKE_SNYDER_15_BEATS[10], // All is Lost
          BLAKE_SNYDER_15_BEATS[13], // Climax
        ]
      : BLAKE_SNYDER_15_BEATS; // Full 15-beat Screenplay

  const scenes: ScreenplayScene[] = beatsToGenerate.map((b, idx) => {
    const sceneNum = idx + 1;
    const isExterior = idx % 2 === 0;
    const currentSet = isExterior ? primarySet : secondarySet;
    const timeOfDay = isExterior ? 'NIGHT' : 'DAY';
    const heading = `${isExterior ? 'EXT.' : 'INT.'} ${currentSet.name.toUpperCase()} - ${timeOfDay}`;

    const isClimax = b.beat === 'FINALE_CLIMAX' || b.beat === 'MIDPOINT';
    const isLeadScene = idx % 2 === 0;
    const activeChar = isLeadScene ? lead : antag;
    const activeLifestyle = isLeadScene ? leadLifestyle : antagLifestyle;

    const elements: ScreenplayElement[] = [];

    // 1. Scene Heading
    elements.push({
      type: 'SCENE_HEADING',
      text: heading,
    });

    // 2. Action line introducing setting, atmosphere & wardrobe
    elements.push({
      type: 'ACTION_LINE',
      text: `${currentSet.atmosphere}. Rain cascades down corrugated conduits. ${activeChar.name.toUpperCase()} (${activeChar.age}, ${activeLifestyle.deportment.postureDescription.toLowerCase()}) stands anchored against the shadows, wearing a ${activeChar.signatureWardrobe}. ${activeLifestyle.brands[0]?.promptToken}.`,
    });

    // 3. Engine directive injection (Camera, Lighting, Audio)
    elements.push({
      type: 'ENGINE_DIRECTIVE',
      text: `[ENGINE_RIG: A-CAM ${currentSet.recommendedLens} Anamorphic • DMX CCT ${currentSet.lightingKelvin}K • Spatial Audio: ${isExterior ? 'Alley Slapback' : 'Penthouse Reverberation'}]`,
      engineData: {
        lens: currentSet.recommendedLens,
        kelvin: currentSet.lightingKelvin,
        audioReverb: isExterior ? 'Alley Slapback' : 'Penthouse Reverberation',
      },
    });

    // 4. Character Dialogue & Parenthetical
    if (isLeadScene) {
      elements.push({
        type: 'CHARACTER_CUE',
        text: lead.name.toUpperCase(),
        characterId: lead.id,
      });
      elements.push({
        type: 'PARENTHETICAL',
        text: '(checking neural comms relay, steady cadence)',
      });
      elements.push({
        type: 'DIALOGUE',
        text: `"${lead.voiceSampleText}"`,
      });
    } else {
      elements.push({
        type: 'CHARACTER_CUE',
        text: antag.name.toUpperCase(),
        characterId: antag.id,
      });
      elements.push({
        type: 'PARENTHETICAL',
        text: '(calm, ice-cold authoritative inflection)',
      });
      elements.push({
        type: 'DIALOGUE',
        text: `"${antag.voiceSampleText}"`,
      });
    }

    // 5. Climax / Action Stunt Beat if applicable
    if (isClimax) {
      elements.push({
        type: 'ACTION_LINE',
        text: `SUDDENLY-- A high-velocity sonic boom tears through the airspace! An armored tactical vehicle is heaved across the plaza in a parabolic arc as an incoming missile intersects mid-air, detonating into a two-stage volumetric fireball!`,
      });
      elements.push({
        type: 'ENGINE_DIRECTIVE',
        text: `[STUNT_ENGINE: SUPERHUMAN_MASS_THROW • 90° Matrix Shutter • 3,800kg Kinetic Mass • Shrapnel Density: Extreme]`,
        engineData: {
          stunt: 'superhuman-mass-throw',
          shutter: 90,
          massKg: 3800,
        },
      });
    }

    // 6. Transition
    elements.push({
      type: 'TRANSITION',
      text: idx === beatsToGenerate.length - 1 ? 'FADE OUT.' : 'SMASH CUT TO:',
    });

    // Engine parameters packet
    const engineParameters: ExtractedEngineParameters = {
      camera: {
        rig: isExterior ? 'A-CAM_MASTER_24mm' : 'B-CAM_MEDIUM_50mm',
        focalLength: currentSet.recommendedLens,
        shutterAngle: isClimax ? 90 : 180,
        movement: isClimax ? 'High-speed tracking dolly with vertical shake' : 'Slow cinematic creep on Ronin gimbal track',
      },
      lighting: {
        kelvin: currentSet.lightingKelvin,
        dimmerPercent: isExterior ? 65 : 85,
        flickerPattern: isClimax ? 'EXPLOSION_BOOM' : isExterior ? 'FAULTY_NEON' : 'STEADY',
        atmosphere: currentSet.atmosphere,
      },
      wardrobeLifestyle: {
        characterName: activeChar.name,
        stratum: activeLifestyle.stratum,
        brandLabel: activeLifestyle.brands[0]?.name || 'Tailored',
        vehicleToken: activeLifestyle.vehicle.makeModel,
        jewelryToken: activeLifestyle.jewelry.name,
      },
      vfxStunt: {
        setpieceType: isClimax ? 'superhuman-mass-throw' : undefined,
        kineticMassKg: isClimax ? 3800 : undefined,
        projectile: isClimax ? 'AIM-9X Sidewinder' : undefined,
        explosionBloom: isClimax ? 'two-stage-fuel-fireball' : undefined,
      },
      audioAcoustics: {
        reverbRoom: isExterior ? 'Deep Cavern / Wet Alley' : 'Modern Glass Penthouse',
        foleySurface: isExterior ? 'Wet Asphalt Footsteps' : 'Italian Marble Tile',
        leitmotifTrigger: isLeadScene ? `${lead.name} Theme (Minor 6th Cello)` : `${antag.name} Theme (Muted French Horn)`,
        tensionScore: isClimax ? 95 : 35 + idx * 4,
      },
    };

    return {
      id: `scene-${sceneNum}`,
      sceneNumber: sceneNum,
      beatType: b.beat,
      heading,
      timeOfDay,
      locationName: currentSet.name,
      locationId: currentSet.id,
      summary: `${b.act}: ${b.defaultPacing}`,
      elements,
      engineParameters,
    };
  });

  return {
    id: `script-${Date.now()}`,
    title: config.title,
    genre: config.genre,
    scope: config.scope,
    logline,
    dramaticArcSummary: `Classic 15-Beat 3-Act Structure adapted for ${config.genre.replace(/_/g, ' ')}. Full cross-engine parameters compiled.`,
    scenes,
    totalRuntimeEstMinutes: Math.max(1, Math.round(scenes.length * 1.4)),
    totalShotCount: scenes.length * 3,
    createdAt: new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// COMPILER TO PRODUCTION PIPELINE (SHOT LIST GENERATOR)
// -------------------------------------------------------------

/**
 * Automatically compiles written screenplay scenes into pipeline-ready production ShotItem records.
 */
export function compileScreenplayToProductionShots(screenplay: GeneratedScreenplay): ShotItem[] {
  const shots: ShotItem[] = [];
  let shotIndex = 1;

  screenplay.scenes.forEach((scene) => {
    // 1. Establishing Wide Master
    shots.push({
      id: `shot-${shotIndex}`,
      sceneId: scene.id,
      shotNumber: shotIndex,
      shotType: 'WIDE ESTABLISHING',
      focalLength: scene.engineParameters.camera.focalLength,
      cameraAction: scene.engineParameters.camera.movement,
      durationSec: 4.5,
      stillPrompt: `${scene.heading}. ${scene.summary}. Lighting: ${scene.engineParameters.lighting.kelvin}K ${scene.engineParameters.lighting.atmosphere}. Master 4K cinema plate.`,
      ipAdapterWeight: 0.85,
      keyframeStatus: 'APPROVED',
      motionStatus: 'READY',
      motionEngine: 'Wan 2.1 (Cinematic I2V)',
      motionVector: {
        direction: 'DOLLY_IN',
        intensity: 5,
      },
      lipSyncStatus: 'BYPASS',
    });
    shotIndex++;

    // 2. Character Medium / Dialogue Shot
    const charElement = scene.elements.find((e) => e.type === 'CHARACTER_CUE');
    const dialogueElement = scene.elements.find((e) => e.type === 'DIALOGUE');

    if (charElement && dialogueElement) {
      shots.push({
        id: `shot-${shotIndex}`,
        sceneId: scene.id,
        shotNumber: shotIndex,
        shotType: 'CLOSE-UP PROFILE',
        focalLength: '85mm',
        characterAId: charElement.characterId,
        speakerId: charElement.characterId,
        cameraAction: 'Medium close-up profile tracking lip-sync and ocular micro-expressions',
        durationSec: 4.0,
        dialogue: dialogueElement.text.replace(/"/g, ''),
        stillPrompt: `${charElement.text} in ${scene.heading}. Wardrobe: ${scene.engineParameters.wardrobeLifestyle.brandLabel}. Chiaroscuro key lighting at ${scene.engineParameters.lighting.kelvin}K. 85mm portrait bokeh.`,
        ipAdapterWeight: 0.92,
        keyframeStatus: 'APPROVED',
        motionStatus: 'READY',
        motionEngine: 'Wan 2.1 (Cinematic I2V)',
        motionVector: {
          direction: 'PAN_RIGHT',
          intensity: 3,
        },
        lipSyncStatus: 'ALIGNED',
      });
      shotIndex++;
    }

    // 3. Stunt or Detail Dynamic Shot
    if (scene.engineParameters.vfxStunt.setpieceType) {
      shots.push({
        id: `shot-${shotIndex}`,
        sceneId: scene.id,
        shotNumber: shotIndex,
        shotType: 'DUTCH ANGLE',
        focalLength: '24mm',
        cameraAction: '90-degree shutter dynamic camera shake tracking airborne kinetic vehicle impact',
        durationSec: 3.5,
        stillPrompt: `High-impact stunt in ${scene.heading}. ${scene.engineParameters.vfxStunt.kineticMassKg}kg vehicle collision with missile detonation. Volumetric pyroclastic smoke.`,
        ipAdapterWeight: 0.8,
        keyframeStatus: 'STAGED',
        motionStatus: 'UNPROCESSED',
        motionEngine: 'Wan 2.1 (Cinematic I2V)',
        motionVector: {
          direction: 'ORBIT_LEFT',
          intensity: 8,
        },
        lipSyncStatus: 'BYPASS',
      });
      shotIndex++;
    }
  });

  return shots;
}

// -------------------------------------------------------------
// SCRIPT FORMATTERS (FOUNTAIN / STANDARD SYNTAX)
// -------------------------------------------------------------

export function formatToFountainScript(screenplay: GeneratedScreenplay): string {
  const lines: string[] = [
    `Title: ${screenplay.title.toUpperCase()}`,
    `Credit: Written by CineForge AI Screenplay Orchestrator`,
    `Draft Date: ${new Date().toLocaleDateString()}`,
    `Logline: ${screenplay.logline}`,
    '',
    '===',
    '',
  ];

  screenplay.scenes.forEach((scene) => {
    scene.elements.forEach((el) => {
      if (el.type === 'SCENE_HEADING') {
        lines.push('');
        lines.push(el.text.toUpperCase());
        lines.push('');
      } else if (el.type === 'ACTION_LINE') {
        lines.push(el.text);
        lines.push('');
      } else if (el.type === 'CHARACTER_CUE') {
        lines.push(`                    ${el.text.toUpperCase()}`);
      } else if (el.type === 'PARENTHETICAL') {
        lines.push(`               ${el.text}`);
      } else if (el.type === 'DIALOGUE') {
        lines.push(`          ${el.text}`);
        lines.push('');
      } else if (el.type === 'ENGINE_DIRECTIVE') {
        lines.push(`[[ ${el.text} ]]`);
        lines.push('');
      } else if (el.type === 'TRANSITION') {
        lines.push(`                                                            ${el.text.toUpperCase()}`);
        lines.push('');
      }
    });
  });

  return lines.join('\n');
}
