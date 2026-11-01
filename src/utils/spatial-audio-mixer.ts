/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Automated Spatial Foley & Acoustic Dialogue Mixer
 * Impulse Response Convolution, Air Absorption & Distance Falloff,
 * Dynamic 3D Binaural Panning, Procedural Foley, and Dialogue Sidechain Ducking.
 */

export type AcousticRoomPreset =
  | 'deep_cavern'
  | 'submerged_underwater'
  | 'armor_helmet_interior'
  | 'grand_cathedral'
  | 'small_wood_room'
  | 'open_void_exterior'
  | 'industrial_hangar';

export type SurfaceContactMaterial = 'wet_mud' | 'hollow_wood' | 'metallic_grating' | 'loose_gravel' | 'deep_water_splash' | 'rain_slick_concrete';
export type WardrobeMaterialFoley = 'heavy_plate_armor' | 'leather_creak' | 'kevlar_rustle' | 'chitin_click' | 'tail_drag';

export interface AcousticEnvironmentProfile {
  id: AcousticRoomPreset;
  name: string;
  reverbDecaySeconds: number; // 0.2s to 6.5s
  earlyReflectionRatio: number; // 0.0 to 1.0
  lowPassCutoffHz: number; // e.g. 800Hz for submerged, 20000Hz for open
  predelayMs: number;
  acousticColorationTag: string;
  roomResonanceGainDb: number;
}

export interface SpatialEntityPosition {
  entityId: string;
  name: string;
  x: number; // -10.0m (left) to +10.0m (right)
  y: number; // -5.0m (down) to +5.0m (up)
  zDepthMeters: number; // 0.5m (close-up) to 30.0m (distant background)
  velocityMetersPerSec: number;
}

export interface BinauralCalculationResult {
  panStereo: number; // -1.0 (hard left) to +1.0 (hard right)
  distanceAttenuationDb: number; // e.g. -12.4 dB based on 1/r^2 law
  airAbsorptionCutoffHz: number; // HF roll-off with distance
  dopplerShiftRatio: number; // frequency scale e.g. 1.04 or 0.96
  reverbSendLevelDb: number;
}

export interface ProceduralFoleyEvent {
  id: string;
  timestampSec: number;
  triggerType: 'footstep' | 'landing' | 'equipment_rattle' | 'wardrobe_creak' | 'breath';
  surfaceMaterial: SurfaceContactMaterial;
  wardrobeMaterial?: WardrobeMaterialFoley;
  gainDb: number;
  panning: number;
  foleyDescription: string;
}

export interface AudioStemLevels {
  dialogueDb: number; // -12 to 0 dB
  foleyDb: number;
  sfxHitsDb: number;
  ambientScoreDb: number;
  duckingReductionDb: number; // e.g. -4.5 dB sidechain when dialogue active
}

export const ACOUSTIC_PRESETS_MAP: Record<AcousticRoomPreset, AcousticEnvironmentProfile> = {
  deep_cavern: {
    id: 'deep_cavern',
    name: 'Deep Cavern & Wet Tunnels',
    reverbDecaySeconds: 4.8,
    earlyReflectionRatio: 0.85,
    lowPassCutoffHz: 12000,
    predelayMs: 45,
    acousticColorationTag: 'Expansive limestone cave slapback echo with 4.8s trailing decay and wet floor reflections',
    roomResonanceGainDb: +3.2,
  },
  submerged_underwater: {
    id: 'submerged_underwater',
    name: 'Submerged / Underwater Abyss',
    reverbDecaySeconds: 2.1,
    earlyReflectionRatio: 0.95,
    lowPassCutoffHz: 650, // steep low-pass muffling
    predelayMs: 10,
    acousticColorationTag: 'Acoustic fluid dampening at 650Hz low-pass cutoff, bubble wash turbulence, bone-conducted sub-bass',
    roomResonanceGainDb: -4.0,
  },
  armor_helmet_interior: {
    id: 'armor_helmet_interior',
    name: 'Enclosed Armor Helmet / Respirator Cavity',
    reverbDecaySeconds: 0.35,
    earlyReflectionRatio: 0.9,
    lowPassCutoffHz: 4500,
    predelayMs: 4,
    acousticColorationTag: 'Visor cranial resonance, claustrophobic internal reflections, mechanical air pump valves',
    roomResonanceGainDb: +2.5,
  },
  grand_cathedral: {
    id: 'grand_cathedral',
    name: 'Gothic Cathedral & Vaulted Nave',
    reverbDecaySeconds: 6.2,
    earlyReflectionRatio: 0.78,
    lowPassCutoffHz: 16000,
    predelayMs: 65,
    acousticColorationTag: 'Massive stone arch resonance with luminous harmonic overtone shimmer',
    roomResonanceGainDb: +4.0,
  },
  small_wood_room: {
    id: 'small_wood_room',
    name: 'Compact Timber Office / Cabin',
    reverbDecaySeconds: 0.65,
    earlyReflectionRatio: 0.4,
    lowPassCutoffHz: 18000,
    predelayMs: 12,
    acousticColorationTag: 'Dry cedar panel damping, warm mid-frequency absorption, intimate vocal presence',
    roomResonanceGainDb: -1.0,
  },
  open_void_exterior: {
    id: 'open_void_exterior',
    name: 'Open Void / Rooftop Horizon (Dry Exterior)',
    reverbDecaySeconds: 0.25,
    earlyReflectionRatio: 0.05,
    lowPassCutoffHz: 20000,
    predelayMs: 0,
    acousticColorationTag: 'Dry anechoic exterior, zero boundary wall reflections, natural atmospheric wind dissipation',
    roomResonanceGainDb: -6.0,
  },
  industrial_hangar: {
    id: 'industrial_hangar',
    name: 'Corrugated Metal Industrial Hangar',
    reverbDecaySeconds: 3.4,
    earlyReflectionRatio: 0.82,
    lowPassCutoffHz: 14000,
    predelayMs: 38,
    acousticColorationTag: 'Flutter echo off corrugated iron plates, sub-bass machinery hum bounce',
    roomResonanceGainDb: +2.0,
  },
};

/**
 * Calculates 3D Binaural Panning, Inverse-Square Decibel Attenuation,
 * High-Frequency Atmospheric Air Absorption, and Doppler Shift.
 */
export function calculateBinauralPositioning(
  entity: SpatialEntityPosition,
  cameraZ: number = 0
): BinauralCalculationResult {
  const relativeZ = Math.max(0.5, entity.zDepthMeters - cameraZ);

  // 1. Stereo Panning (-1.0 to +1.0)
  // Inverse tangent based on lateral displacement vs distance
  const angleRad = Math.atan2(entity.x, relativeZ);
  const panStereo = Math.max(-1.0, Math.min(1.0, Math.sin(angleRad)));

  // 2. Distance Attenuation (Inverse-square law relative to reference 1.0m)
  // 20 * log10(1 / d)
  const distanceAttenuationDb = Math.round(20 * Math.log10(1 / relativeZ) * 10) / 10;

  // 3. Air Absorption (Higher frequencies attenuate faster over distance)
  // 20kHz base, drops ~400Hz per meter beyond 2 meters
  const airAbsorptionCutoffHz = Math.max(
    2500,
    Math.min(20000, Math.round(20000 - Math.max(0, relativeZ - 2.0) * 450))
  );

  // 4. Doppler Shift for moving sound sources (speed of sound ~343 m/s)
  // Frequency shift = (343 + v_obs) / (343 + v_src)
  const speedOfSound = 343;
  const dopplerShiftRatio =
    Math.round((speedOfSound / (speedOfSound - entity.velocityMetersPerSec)) * 1000) / 1000;

  // 5. Reverb send level increases with distance (Direct-to-Reverberant ratio drops)
  const reverbSendLevelDb = Math.round(Math.min(0, -24 + relativeZ * 1.8) * 10) / 10;

  return {
    panStereo: Math.round(panStereo * 100) / 100,
    distanceAttenuationDb,
    airAbsorptionCutoffHz,
    dopplerShiftRatio,
    reverbSendLevelDb,
  };
}

/**
 * Procedural Foley Generation: builds chronological foley timeline based on locomotion
 */
export function generateProceduralFoleyTrack(
  durationSec: number,
  surface: SurfaceContactMaterial = 'rain_slick_concrete',
  wardrobe: WardrobeMaterialFoley = 'kevlar_rustle',
  foleyDensityFactor: number = 1.0 // 0.5 to 2.0
): ProceduralFoleyEvent[] {
  const events: ProceduralFoleyEvent[] = [];
  const stepInterval = 0.55 / Math.max(0.2, foleyDensityFactor);
  let currentT = 0.2;

  let stepCount = 1;
  while (currentT < durationSec) {
    const isLeftFoot = stepCount % 2 === 1;
    const pan = isLeftFoot ? -0.25 : 0.25;

    // Footstep event
    events.push({
      id: `foley-step-${stepCount}`,
      timestampSec: Math.round(currentT * 100) / 100,
      triggerType: 'footstep',
      surfaceMaterial: surface,
      gainDb: -14.0 + (stepCount % 3) * 0.8,
      panning: pan,
      foleyDescription: `${isLeftFoot ? 'Left' : 'Right'} heel strike on ${surface.replace(/_/g, ' ')}`,
    });

    // Secondary wardrobe movement foley
    if (stepCount % 2 === 0) {
      events.push({
        id: `foley-wardrobe-${stepCount}`,
        timestampSec: Math.round((currentT + 0.08) * 100) / 100,
        triggerType: 'wardrobe_creak',
        surfaceMaterial: surface,
        wardrobeMaterial: wardrobe,
        gainDb: -22.5,
        panning: pan * 0.8,
        foleyDescription: `${wardrobe.replace(/_/g, ' ')} articulation rustle`,
      });
    }

    currentT += stepInterval;
    stepCount++;
  }

  return events;
}

/**
 * Calculates dynamic dialogue sidechain ducking levels (-3dB to -6dB)
 */
export function calculateSidechainDucking(
  isDialogueActive: boolean,
  duckingPresetDb: number = -4.5
): AudioStemLevels {
  const reduction = isDialogueActive ? duckingPresetDb : 0.0;

  return {
    dialogueDb: isDialogueActive ? -1.5 : -48.0,
    foleyDb: -12.0 + reduction,
    sfxHitsDb: -10.0 + reduction * 0.7,
    ambientScoreDb: -16.0 + reduction,
    duckingReductionDb: reduction,
  };
}

/**
 * Compiles spatial audio metadata tokens into render engine payloads
 */
export function buildSpatialAudioMixerPayload(
  roomPreset: AcousticRoomPreset,
  heroEntity: SpatialEntityPosition,
  surface: SurfaceContactMaterial = 'rain_slick_concrete'
) {
  const room = ACOUSTIC_PRESETS_MAP[roomPreset];
  const binaural = calculateBinauralPositioning(heroEntity);
  const foley = generateProceduralFoleyTrack(5.0, surface, 'kevlar_rustle');

  const audioPromptTag = `[SPATIAL_ACOUSTICS: ${room.name.toUpperCase()}] IR Convolution: ${room.acousticColorationTag}. Binaural Panning: ${binaural.panStereo >= 0 ? '+' : ''}${binaural.panStereo} (${binaural.panStereo < 0 ? 'Left' : 'Right'}), Distance: ${heroEntity.zDepthMeters}m (${binaural.distanceAttenuationDb}dB attenuation, ${binaural.airAbsorptionCutoffHz}Hz HF cutoff). Procedural Foley: ${surface.replace(/_/g, ' ')} with automated dialogue ducking at -4.5dB.`;

  return {
    audioPromptTag,
    roomProfile: room,
    binauralSpecs: binaural,
    foleyCount: foley.length,
    foleySample: foley.slice(0, 5),
  };
}

/**
 * Diagnostic & Convenience alias for 3D binaural spatial calculations
 */
export function calculateBinauralSpatialAudio(
  source: { x: number; y: number; z: number },
  listener: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  _environmentName: string = 'open_void_exterior'
) {
  const result = calculateBinauralPositioning(
    {
      entityId: 'diag-source',
      name: 'Diagnostic Source',
      x: source.x - listener.x,
      y: source.y - listener.y,
      zDepthMeters: Math.max(0.5, source.z - listener.z),
      velocityMetersPerSec: 0,
    },
    0
  );
  return {
    ...result,
    attenuationDb: result.distanceAttenuationDb,
  };
}

/**
 * Diagnostic & Convenience alias for surface contact foley calculations
 */
export function calculateSurfaceFoley(
  _surfaceLabel: string,
  durationSec: number = 2.0,
  _intensity: number = 70
) {
  const events = generateProceduralFoleyTrack(durationSec, 'rain_slick_concrete', 'kevlar_rustle', 1.0);
  return {
    events,
    totalEvents: events.length,
  };
}

