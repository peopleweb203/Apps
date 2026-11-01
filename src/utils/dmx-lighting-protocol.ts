/**
 * Automated DMX Lighting Protocol & Physical Studio Sync Utility
 * Synchronizes virtual key/fill/rim/practical lighting intensities, CCT color temperatures,
 * and procedural flicker patterns with the production timeline.
 * Exports industry-standard DMX512 sequences for GrandMA, ETC Eos, QLC+, and Art-Net/sACN controllers.
 */

export type FlickerPattern =
  | 'STEADY'
  | 'FIRE_CANDLE'
  | 'TV_SCREEN'
  | 'FAULTY_NEON'
  | 'LIGHTNING_STROBE'
  | 'POLICE_BEACON'
  | 'MUZZLE_FLASH'
  | 'EXPLOSION_BOOM';

export type FixtureRole = 'KEY_LIGHT' | 'FILL_LIGHT' | 'RIM_LIGHT' | 'PRACTICAL_AMBIENT' | 'VFX_STROBE';

export interface FixtureProfile {
  id: string;
  name: string;
  model: string;
  manufacturer: 'ARRI' | 'Aputure' | 'Astera' | 'Litepanels' | 'Creamsource' | 'Generic';
  role: FixtureRole;
  universe: number; // 1 to 4
  startChannel: number; // 1 to 512
  channelFootprint: number; // e.g. 8 channels
  cctRange: [number, number]; // e.g. [2800, 10000]
  isActive: boolean;
  channelMap: {
    dimmer: number; // offset 0-based
    cct: number;
    tint: number;
    red: number;
    green: number;
    blue: number;
    white?: number;
    strobe?: number;
  };
}

export interface FixtureLightingState {
  intensityPercent: number; // 0 to 100%
  colorTempKelvin: number; // e.g. 3200 to 6500
  greenMagentaTint: number; // -100 to +100
  flickerPattern: FlickerPattern;
  flickerDepthPercent: number; // 0 to 100%
  flickerSpeedHz: number; // e.g. 0.5 to 20Hz
  rgbColor?: [number, number, number]; // 0-255 optional manual RGB
}

export interface DmxLightingCue {
  id: string;
  sceneId?: string;
  shotId?: string;
  name: string;
  timeSec: number;
  durationSec: number;
  transitionDurationSec: number;
  lightingStates: Record<string, FixtureLightingState>; // fixtureId -> state
  notes?: string;
}

export interface DmxExportOptions {
  format: 'CSV_TIMECODE' | 'ARTNET_JSON' | 'QLC_PLUS_XML' | 'GRAND_MA_XML';
  fps: 24 | 25 | 30 | 60;
  universe: number;
  includeHeader: boolean;
  fixtureFilter?: string[]; // IDs
}

// -------------------------------------------------------------
// STANDARD STUDIO FIXTURE PROFILES (Physical Rig Defaults)
// -------------------------------------------------------------

export const DEFAULT_STUDIO_FIXTURES: FixtureProfile[] = [
  {
    id: 'fix-key-arri-s60',
    name: 'Key Light (Arri SkyPanel S60-C)',
    model: 'SkyPanel S60-C (Mode 6 - CCT & RGBW 8-bit)',
    manufacturer: 'ARRI',
    role: 'KEY_LIGHT',
    universe: 1,
    startChannel: 1,
    channelFootprint: 8,
    cctRange: [2800, 10000],
    isActive: true,
    channelMap: {
      dimmer: 0,
      cct: 1,
      tint: 2,
      red: 3,
      green: 4,
      blue: 5,
      white: 6,
      strobe: 7,
    },
  },
  {
    id: 'fix-fill-aputure-nova',
    name: 'Fill Light (Aputure Nova P600c)',
    model: 'Nova P600c (CCT 8-bit / Softbox)',
    manufacturer: 'Aputure',
    role: 'FILL_LIGHT',
    universe: 1,
    startChannel: 9,
    channelFootprint: 8,
    cctRange: [2000, 10000],
    isActive: true,
    channelMap: {
      dimmer: 0,
      cct: 1,
      tint: 2,
      red: 3,
      green: 4,
      blue: 5,
      white: 6,
      strobe: 7,
    },
  },
  {
    id: 'fix-rim-astera-titan',
    name: 'Rim / Hair Light (Astera Titan Tube)',
    model: 'Titan Tube FP1 (RGB CCT Mode)',
    manufacturer: 'Astera',
    role: 'RIM_LIGHT',
    universe: 1,
    startChannel: 17,
    channelFootprint: 8,
    cctRange: [3200, 9000],
    isActive: true,
    channelMap: {
      dimmer: 0,
      cct: 1,
      tint: 2,
      red: 3,
      green: 4,
      blue: 5,
      white: 6,
      strobe: 7,
    },
  },
  {
    id: 'fix-prac-ambient',
    name: 'Practical / Cyber Neon Strip',
    model: 'Creamsource Vortex8 / LED Strip Bar',
    manufacturer: 'Creamsource',
    role: 'PRACTICAL_AMBIENT',
    universe: 1,
    startChannel: 25,
    channelFootprint: 8,
    cctRange: [2200, 12000],
    isActive: true,
    channelMap: {
      dimmer: 0,
      cct: 1,
      tint: 2,
      red: 3,
      green: 4,
      blue: 5,
      white: 6,
      strobe: 7,
    },
  },
  {
    id: 'fix-vfx-strobe',
    name: 'VFX Action Strobe / Muzzle Blaster',
    model: 'Aputure LS 1200d Pro High-Speed Strobe',
    manufacturer: 'Aputure',
    role: 'VFX_STROBE',
    universe: 1,
    startChannel: 33,
    channelFootprint: 8,
    cctRange: [5600, 6500],
    isActive: true,
    channelMap: {
      dimmer: 0,
      cct: 1,
      tint: 2,
      red: 3,
      green: 4,
      blue: 5,
      white: 6,
      strobe: 7,
    },
  },
];

// Initial timeline cues synced to standard scene progression
export const INITIAL_DMX_LIGHTING_CUES: DmxLightingCue[] = [
  {
    id: 'cue-scene-1-wide',
    sceneId: 'scene-1',
    shotId: 'shot-1',
    name: 'Scene 1: Rain-Slick Alley Establish (Cool Tungsten)',
    timeSec: 0.0,
    durationSec: 4.5,
    transitionDurationSec: 0.5,
    lightingStates: {
      'fix-key-arri-s60': {
        intensityPercent: 65,
        colorTempKelvin: 4300,
        greenMagentaTint: -5,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-fill-aputure-nova': {
        intensityPercent: 30,
        colorTempKelvin: 5600,
        greenMagentaTint: 0,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-rim-astera-titan': {
        intensityPercent: 75,
        colorTempKelvin: 6500,
        greenMagentaTint: 10,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-prac-ambient': {
        intensityPercent: 80,
        colorTempKelvin: 3200,
        greenMagentaTint: 0,
        flickerPattern: 'FAULTY_NEON',
        flickerDepthPercent: 35,
        flickerSpeedHz: 8.0,
        rgbColor: [240, 60, 20], // Amber-red neon
      },
      'fix-vfx-strobe': {
        intensityPercent: 0,
        colorTempKelvin: 6000,
        greenMagentaTint: 0,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
    },
    notes: 'Atmospheric moody neon rain alley, subtle faulty neon hum on background tube',
  },
  {
    id: 'cue-scene-1-gunfire',
    sceneId: 'scene-1',
    shotId: 'shot-2',
    name: 'Scene 1: Cyber Enforcers Firefight (Muzzle Strobe)',
    timeSec: 4.5,
    durationSec: 3.5,
    transitionDurationSec: 0.1,
    lightingStates: {
      'fix-key-arri-s60': {
        intensityPercent: 40,
        colorTempKelvin: 4000,
        greenMagentaTint: 0,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-fill-aputure-nova': {
        intensityPercent: 20,
        colorTempKelvin: 5200,
        greenMagentaTint: 0,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-rim-astera-titan': {
        intensityPercent: 85,
        colorTempKelvin: 7000,
        greenMagentaTint: 0,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-prac-ambient': {
        intensityPercent: 70,
        colorTempKelvin: 3200,
        greenMagentaTint: 0,
        flickerPattern: 'POLICE_BEACON',
        flickerDepthPercent: 90,
        flickerSpeedHz: 2.5,
      },
      'fix-vfx-strobe': {
        intensityPercent: 100,
        colorTempKelvin: 6500,
        greenMagentaTint: 0,
        flickerPattern: 'MUZZLE_FLASH',
        flickerDepthPercent: 100,
        flickerSpeedHz: 12.0,
        rgbColor: [255, 250, 220],
      },
    },
    notes: 'Aggressive rapid muzzle flashes coupled with alternating police cruiser sweeps',
  },
  {
    id: 'cue-scene-2-interrogation',
    sceneId: 'scene-2',
    shotId: 'shot-3',
    name: 'Scene 2: Director Chen Penthouse Office (Warm Executive)',
    timeSec: 8.0,
    durationSec: 6.0,
    transitionDurationSec: 1.2,
    lightingStates: {
      'fix-key-arri-s60': {
        intensityPercent: 85,
        colorTempKelvin: 3200,
        greenMagentaTint: 2,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-fill-aputure-nova': {
        intensityPercent: 45,
        colorTempKelvin: 3400,
        greenMagentaTint: 0,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-rim-astera-titan': {
        intensityPercent: 55,
        colorTempKelvin: 5400,
        greenMagentaTint: -4,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
      'fix-prac-ambient': {
        intensityPercent: 60,
        colorTempKelvin: 2700,
        greenMagentaTint: 0,
        flickerPattern: 'FIRE_CANDLE',
        flickerDepthPercent: 15,
        flickerSpeedHz: 2.0,
      },
      'fix-vfx-strobe': {
        intensityPercent: 0,
        colorTempKelvin: 5600,
        greenMagentaTint: 0,
        flickerPattern: 'STEADY',
        flickerDepthPercent: 0,
        flickerSpeedHz: 1.0,
      },
    },
    notes: 'Rich warm tungsten chiaroscuro with fireplace hearth ambiance',
  },
  {
    id: 'cue-scene-3-stunt-explosion',
    sceneId: 'scene-3',
    shotId: 'shot-4',
    name: 'Scene 3: Ballistic Missile Detonation (Fireball Bloom)',
    timeSec: 14.0,
    durationSec: 5.0,
    transitionDurationSec: 0.1,
    lightingStates: {
      'fix-key-arri-s60': {
        intensityPercent: 95,
        colorTempKelvin: 2800,
        greenMagentaTint: 0,
        flickerPattern: 'EXPLOSION_BOOM',
        flickerDepthPercent: 80,
        flickerSpeedHz: 1.0,
        rgbColor: [255, 120, 20],
      },
      'fix-fill-aputure-nova': {
        intensityPercent: 80,
        colorTempKelvin: 2600,
        greenMagentaTint: 0,
        flickerPattern: 'EXPLOSION_BOOM',
        flickerDepthPercent: 80,
        flickerSpeedHz: 1.0,
        rgbColor: [255, 80, 10],
      },
      'fix-rim-astera-titan': {
        intensityPercent: 100,
        colorTempKelvin: 7500,
        greenMagentaTint: 0,
        flickerPattern: 'LIGHTNING_STROBE',
        flickerDepthPercent: 95,
        flickerSpeedHz: 16.0,
      },
      'fix-prac-ambient': {
        intensityPercent: 90,
        colorTempKelvin: 2200,
        greenMagentaTint: 0,
        flickerPattern: 'FIRE_CANDLE',
        flickerDepthPercent: 60,
        flickerSpeedHz: 4.0,
      },
      'fix-vfx-strobe': {
        intensityPercent: 100,
        colorTempKelvin: 6500,
        greenMagentaTint: 0,
        flickerPattern: 'EXPLOSION_BOOM',
        flickerDepthPercent: 100,
        flickerSpeedHz: 1.0,
      },
    },
    notes: 'Volumetric two-stage blast bloom with intense fireball illumination',
  },
];

// -------------------------------------------------------------
// COLOR SCIENCE & KELVIN TO RGB / DMX MATH
// -------------------------------------------------------------

/**
 * Approximates sRGB color from Color Temperature in Kelvin (1000K to 12000K)
 * Based on Tanner Helland's empirical curve fitting on Planckian Blackbody radiator locus.
 */
export function kelvinToRgb(kelvin: number): [number, number, number] {
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let r = 0;
  let g = 0;
  let b = 0;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // Green
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  return [Math.round(r), Math.round(g), Math.round(b)];
}

export function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Maps a Kelvin temperature to standard 8-bit DMX value (0-255) for a given fixture range.
 */
export function kelvinToDmxByte(kelvin: number, cctRange: [number, number] = [2800, 10000]): number {
  const [minK, maxK] = cctRange;
  const clamped = Math.max(minK, Math.min(maxK, kelvin));
  const normalized = (clamped - minK) / (maxK - minK);
  return Math.round(normalized * 255);
}

/**
 * Maps a standard 8-bit DMX byte back to Kelvin.
 */
export function dmxByteToKelvin(byte: number, cctRange: [number, number] = [2800, 10000]): number {
  const [minK, maxK] = cctRange;
  const normalized = Math.max(0, Math.min(255, byte)) / 255;
  return Math.round(minK + normalized * (maxK - minK));
}

// -------------------------------------------------------------
// PROCEDURAL FLICKER MODULATION ENGINE
// -------------------------------------------------------------

export interface FlickerSampleResult {
  intensityMultiplier: number; // 0.0 to 1.5
  kelvinShift: number; // in Kelvin
  rgbOverride?: [number, number, number];
}

/**
 * Computes deterministic physical procedural waveform modulation at time T.
 */
export function calculateFlickerModulation(
  pattern: FlickerPattern,
  timeSec: number,
  depthPercent: number = 50,
  speedHz: number = 2.0
): FlickerSampleResult {
  const depth = Math.max(0, Math.min(100, depthPercent)) / 100;

  if (pattern === 'STEADY' || depth === 0) {
    return { intensityMultiplier: 1.0, kelvinShift: 0 };
  }

  const phase = timeSec * speedHz;

  switch (pattern) {
    case 'FIRE_CANDLE': {
      // 3-octave harmonic noise approximation
      const n1 = Math.sin(phase * 6.28);
      const n2 = Math.sin(phase * 15.7 + 1.2) * 0.5;
      const n3 = Math.sin(phase * 31.4 + 2.4) * 0.25;
      const combined = (n1 + n2 + n3) / 1.75; // -1 to 1
      const dip = (combined - 0.2) * 0.5 * depth; // dips more than spikes
      const multiplier = Math.max(0.05, 1.0 + dip);
      const kelvinShift = -1 * Math.round(multiplier < 1.0 ? (1.0 - multiplier) * 800 : 0);
      return { intensityMultiplier: multiplier, kelvinShift };
    }

    case 'TV_SCREEN': {
      // Periodic scene cuts every ~1.5s with subtle color shift
      const sceneBlock = Math.floor(timeSec * 0.65);
      const subRumble = Math.sin(phase * 4.0) * 0.15;
      const cutFlash = (timeSec * 0.65) % 1.0 < 0.08 ? 0.35 : 0;
      const multiplier = Math.max(0.1, 1.0 + (subRumble + cutFlash) * depth);
      const kelvinShift = sceneBlock % 2 === 0 ? 800 : -400; // cool vs warm cuts
      return { intensityMultiplier: multiplier, kelvinShift };
    }

    case 'FAULTY_NEON': {
      // Micro-dropout stutters
      const periodicGlitch = Math.sin(timeSec * 14.0) * Math.cos(timeSec * 5.3);
      const isDropping = periodicGlitch > 0.65;
      const multiplier = isDropping ? 1.0 - depth * 0.85 : 1.0 + Math.sin(timeSec * 100) * 0.05;
      return { intensityMultiplier: Math.max(0, multiplier), kelvinShift: isDropping ? -600 : 0 };
    }

    case 'LIGHTNING_STROBE': {
      // Sharp, hyper-intense spike bursts
      const cycle = (timeSec * 0.5) % 4.0;
      let multiplier = 0.0;
      if (cycle < 0.25) {
        // Double/triple flash within 250ms
        const subPhase = cycle / 0.25;
        multiplier = Math.sin(subPhase * Math.PI * 4) > 0.2 ? 2.0 : 0.0;
      }
      return {
        intensityMultiplier: multiplier * depth,
        kelvinShift: multiplier > 0.5 ? 2500 : 0, // icy 9000K flash
        rgbOverride: multiplier > 0.5 ? [240, 248, 255] : undefined,
      };
    }

    case 'POLICE_BEACON': {
      // Alternating 2Hz Red / Blue rotary flashes
      const beaconPhase = (timeSec * speedHz) % 1.0;
      if (beaconPhase < 0.5) {
        // Red pulse
        const int = Math.sin(beaconPhase * 2 * Math.PI) * depth;
        return {
          intensityMultiplier: Math.max(0, int),
          kelvinShift: -2000,
          rgbOverride: [255, 10, 10],
        };
      } else {
        // Blue pulse
        const int = Math.sin((beaconPhase - 0.5) * 2 * Math.PI) * depth;
        return {
          intensityMultiplier: Math.max(0, int),
          kelvinShift: 4000,
          rgbOverride: [20, 40, 255],
        };
      }
    }

    case 'MUZZLE_FLASH': {
      // Rapid 80ms decaying burst
      const burstPhase = (timeSec * speedHz) % 1.0;
      if (burstPhase < 0.15) {
        const decay = 1.0 - burstPhase / 0.15;
        return {
          intensityMultiplier: 1.0 + decay * 2.5 * depth,
          kelvinShift: Math.round(decay * 1500),
          rgbOverride: [255, 245, 210],
        };
      }
      return { intensityMultiplier: 0.05, kelvinShift: 0 };
    }

    case 'EXPLOSION_BOOM': {
      // 1.5s envelope: instantaneous 100% white peak -> rolling fireball amber fade
      const expPhase = (timeSec * 0.8) % 3.0;
      if (expPhase < 1.2) {
        const decay = 1.0 - expPhase / 1.2;
        const multiplier = decay * 2.0 * depth;
        const kelvinShift = expPhase < 0.2 ? 2000 : -1500;
        return {
          intensityMultiplier: multiplier,
          kelvinShift,
          rgbOverride: expPhase < 0.2 ? [255, 240, 200] : [255, 110, 20],
        };
      }
      return { intensityMultiplier: 0.1, kelvinShift: 0 };
    }

    default:
      return { intensityMultiplier: 1.0, kelvinShift: 0 };
  }
}

// -------------------------------------------------------------
// TIMELINE RESOLVER & DMX UNIVERSE ENGINE
// -------------------------------------------------------------

export interface ComputedFixtureState {
  fixture: FixtureProfile;
  finalIntensityPercent: number;
  finalKelvin: number;
  finalRgb: [number, number, number];
  hexColor: string;
  dmxChannels: number[]; // footprint length of 0-255 bytes
}

/**
 * Resolves the active lighting state for all patched fixtures at an exact timeline timestamp.
 */
export function resolveLightingAtTime(
  timeSec: number,
  cues: DmxLightingCue[] = INITIAL_DMX_LIGHTING_CUES,
  fixtures: FixtureProfile[] = DEFAULT_STUDIO_FIXTURES
): ComputedFixtureState[] {
  if (cues.length === 0) return [];

  // Sort cues chronologically
  const sortedCues = [...cues].sort((a, b) => a.timeSec - b.timeSec);

  // Locate active cue or interpolate between adjacent cues
  let activeCue = sortedCues[0];
  let nextCue: DmxLightingCue | undefined;
  let transitionProgress = 1.0;

  for (let i = 0; i < sortedCues.length; i++) {
    const cue = sortedCues[i];
    if (timeSec >= cue.timeSec) {
      activeCue = cue;
      nextCue = sortedCues[i + 1];
    }
  }

  // Handle smooth transition cross-fade if approaching next cue
  if (nextCue && timeSec >= nextCue.timeSec - nextCue.transitionDurationSec) {
    const fadeStart = nextCue.timeSec - nextCue.transitionDurationSec;
    const fadeDuration = nextCue.transitionDurationSec;
    if (fadeDuration > 0) {
      transitionProgress = Math.max(0, Math.min(1, (timeSec - fadeStart) / fadeDuration));
    }
  } else {
    transitionProgress = 0.0;
  }

  return fixtures.map((fixture) => {
    const baseStateA = activeCue.lightingStates[fixture.id] || {
      intensityPercent: 50,
      colorTempKelvin: 4500,
      greenMagentaTint: 0,
      flickerPattern: 'STEADY',
      flickerDepthPercent: 0,
      flickerSpeedHz: 1.0,
    };

    const baseStateB = nextCue?.lightingStates[fixture.id] || baseStateA;

    // Linear crossfade between cues
    const blendedIntensity =
      baseStateA.intensityPercent + (baseStateB.intensityPercent - baseStateA.intensityPercent) * transitionProgress;
    const blendedKelvin =
      baseStateA.colorTempKelvin + (baseStateB.colorTempKelvin - baseStateA.colorTempKelvin) * transitionProgress;
    const blendedTint =
      baseStateA.greenMagentaTint + (baseStateB.greenMagentaTint - baseStateA.greenMagentaTint) * transitionProgress;

    // Apply procedural flicker waveform
    const flicker = calculateFlickerModulation(
      baseStateA.flickerPattern,
      timeSec,
      baseStateA.flickerDepthPercent,
      baseStateA.flickerSpeedHz
    );

    const finalIntensityPercent = Math.max(0, Math.min(100, blendedIntensity * flicker.intensityMultiplier));
    const finalKelvin = Math.max(fixture.cctRange[0], Math.min(fixture.cctRange[1], blendedKelvin + flicker.kelvinShift));

    // Resolve RGB color
    let finalRgb = flicker.rgbOverride || baseStateA.rgbColor || kelvinToRgb(finalKelvin);

    // Apply tint adjustments
    if (blendedTint !== 0 && !flicker.rgbOverride && !baseStateA.rgbColor) {
      const tintFactor = blendedTint / 100;
      const g = Math.max(0, Math.min(255, finalRgb[1] + tintFactor * 30));
      finalRgb = [finalRgb[0], Math.round(g), finalRgb[2]];
    }

    // Map to DMX Channel Array
    const dmxChannels = new Array(fixture.channelFootprint).fill(0);
    const dimmerByte = Math.round((finalIntensityPercent / 100) * 255);
    const cctByte = kelvinToDmxByte(finalKelvin, fixture.cctRange);
    const tintByte = Math.round(((blendedTint + 100) / 200) * 255);

    if (fixture.channelMap.dimmer !== undefined) dmxChannels[fixture.channelMap.dimmer] = dimmerByte;
    if (fixture.channelMap.cct !== undefined) dmxChannels[fixture.channelMap.cct] = cctByte;
    if (fixture.channelMap.tint !== undefined) dmxChannels[fixture.channelMap.tint] = tintByte;
    if (fixture.channelMap.red !== undefined) dmxChannels[fixture.channelMap.red] = finalRgb[0];
    if (fixture.channelMap.green !== undefined) dmxChannels[fixture.channelMap.green] = finalRgb[1];
    if (fixture.channelMap.blue !== undefined) dmxChannels[fixture.channelMap.blue] = finalRgb[2];
    if (fixture.channelMap.white !== undefined) {
      // Calculate white component from CCT
      dmxChannels[fixture.channelMap.white] = Math.round(dimmerByte * 0.9);
    }
    if (fixture.channelMap.strobe !== undefined) {
      dmxChannels[fixture.channelMap.strobe] =
        baseStateA.flickerPattern === 'LIGHTNING_STROBE' || baseStateA.flickerPattern === 'MUZZLE_FLASH' ? 240 : 0;
    }

    return {
      fixture,
      finalIntensityPercent,
      finalKelvin,
      finalRgb,
      hexColor: rgbToHex(finalRgb),
      dmxChannels,
    };
  });
}

/**
 * Builds a complete 512-channel DMX Universe frame at time T.
 */
export function buildDmxUniverseFrame(
  timeSec: number,
  universeNum: number = 1,
  cues: DmxLightingCue[] = INITIAL_DMX_LIGHTING_CUES,
  fixtures: FixtureProfile[] = DEFAULT_STUDIO_FIXTURES
): Uint8Array {
  const universe = new Uint8Array(512);
  const states = resolveLightingAtTime(timeSec, cues, fixtures);

  states.forEach((s) => {
    if (s.fixture.universe !== universeNum || !s.fixture.isActive) return;
    const startIdx = s.fixture.startChannel - 1; // 0-based index

    s.dmxChannels.forEach((val, offset) => {
      if (startIdx + offset < 512) {
        universe[startIdx + offset] = Math.max(0, Math.min(255, val));
      }
    });
  });

  return universe;
}

// -------------------------------------------------------------
// PHYSICAL STUDIO DMX RIG EXPORTERS
// -------------------------------------------------------------

function formatSmpteTimecode(seconds: number, fps: number = 24): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

/**
 * Generates an industry-standard Timecode-indexed CSV sequence file for GrandMA/ETC/Sidus Link.
 */
export function exportToDmxCsv(
  cues: DmxLightingCue[],
  fixtures: FixtureProfile[] = DEFAULT_STUDIO_FIXTURES,
  fps: 24 | 25 | 30 | 60 = 24,
  totalDurationSec: number = 20.0
): string {
  const totalFrames = Math.ceil(totalDurationSec * fps);
  const activeFixtures = fixtures.filter((f) => f.isActive);

  // CSV Header
  const headers = ['Frame', 'Timecode_SMPTE', 'Seconds'];
  activeFixtures.forEach((f) => {
    headers.push(`${f.name.replace(/,/g, '')}_Dimmer[Ch${f.startChannel}]`);
    headers.push(`${f.name.replace(/,/g, '')}_CCT_Kelvin`);
    headers.push(`${f.name.replace(/,/g, '')}_RGB`);
  });

  const rows: string[] = [headers.join(',')];

  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / fps;
    const timecode = formatSmpteTimecode(t, fps);
    const row = [frame.toString(), timecode, t.toFixed(3)];
    const states = resolveLightingAtTime(t, cues, activeFixtures);

    states.forEach((s) => {
      row.push(s.dmxChannels[0].toString()); // Dimmer channel
      row.push(s.finalKelvin.toString()); // Kelvin
      row.push(`"${s.finalRgb.join(';')}"`); // RGB string
    });

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Generates an Art-Net / sACN JSON Stream descriptor compatible with modern virtual production stages.
 */
export function exportToArtNetJson(
  cues: DmxLightingCue[],
  fixtures: FixtureProfile[] = DEFAULT_STUDIO_FIXTURES,
  fps: 24 | 25 | 30 | 60 = 24,
  totalDurationSec: number = 20.0
): string {
  const totalFrames = Math.ceil(totalDurationSec * fps);
  const frameStream: Array<{ frame: number; timecode: string; timeSec: number; dmx512Hex: string }> = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / fps;
    const universe = buildDmxUniverseFrame(t, 1, cues, fixtures);
    // Convert 512-byte universe to compact hex string
    const hex = Array.from(universe)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    frameStream.push({
      frame,
      timecode: formatSmpteTimecode(t, fps),
      timeSec: Number(t.toFixed(3)),
      dmx512Hex: hex,
    });
  }

  const payload = {
    protocol: 'Art-Net-4 / sACN E1.31 Virtual Sync',
    generator: 'CineForge AI Automated DMX Engine',
    timestamp: new Date().toISOString(),
    configuration: {
      fps,
      totalDurationSec,
      universeCount: 1,
      channelsPerUniverse: 512,
    },
    fixturesPatch: fixtures.map((f) => ({
      id: f.id,
      name: f.name,
      manufacturer: f.manufacturer,
      universe: f.universe,
      startChannel: f.startChannel,
      footprint: f.channelFootprint,
      cctRange: f.cctRange,
    })),
    timelineCues: cues.map((c) => ({
      id: c.id,
      name: c.name,
      timeSec: c.timeSec,
      durationSec: c.durationSec,
      transitionDurationSec: c.transitionDurationSec,
    })),
    frames: frameStream,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generates QLC+ (Q Light Controller Plus) .qxw / XML Cue List format.
 */
export function exportToQlcPlusXml(
  cues: DmxLightingCue[],
  fixtures: FixtureProfile[] = DEFAULT_STUDIO_FIXTURES
): string {
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE Workspace>',
    '<Workspace xmlns="http://www.qlcplus.org/Workspace">',
    '  <Engine>',
    '    <Fixtures>',
  ];

  fixtures.forEach((f, idx) => {
    xmlLines.push(`      <Fixture>`);
    xmlLines.push(`        <ID>${idx}</ID>`);
    xmlLines.push(`        <Name>${f.name}</Name>`);
    xmlLines.push(`        <Universe>${f.universe - 1}</Universe>`);
    xmlLines.push(`        <Address>${f.startChannel - 1}</Address>`);
    xmlLines.push(`        <Channels>${f.channelFootprint}</Channels>`);
    xmlLines.push(`      </Fixture>`);
  });

  xmlLines.push('    </Fixtures>');
  xmlLines.push('    <Functions>');

  cues.forEach((cue, cIdx) => {
    xmlLines.push(`      <Function ID="${cIdx}" Type="Scene" Name="${cue.name}">`);
    xmlLines.push(`        <Speed FadeIn="${Math.round(cue.transitionDurationSec * 1000)}" FadeOut="0" Duration="${Math.round(cue.durationSec * 1000)}"/>`);

    const states = resolveLightingAtTime(cue.timeSec, cues, fixtures);
    states.forEach((s, fIdx) => {
      s.dmxChannels.forEach((val, chOffset) => {
        if (val > 0) {
          xmlLines.push(`        <FixtureVal ID="${fIdx}">${chOffset},${val}</FixtureVal>`);
        }
      });
    });

    xmlLines.push('      </Function>');
  });

  xmlLines.push('    </Functions>');
  xmlLines.push('  </Engine>');
  xmlLines.push('</Workspace>');

  return xmlLines.join('\n');
}

/**
 * Generates GrandMA2/3 XML Cue Sequence file with SMPTE timecode triggers.
 */
export function exportToGrandMaXml(
  cues: DmxLightingCue[],
  fixtures: FixtureProfile[] = DEFAULT_STUDIO_FIXTURES
): string {
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<MA xmlns="http://schemas.malighting.com/grandma2/xml/MA" major_vers="3" minor_vers="9" stream_vers="3">',
    '  <Sequence name="CineForge_Virtual_Rig" info="Automated Timeline Sync">',
  ];

  cues.forEach((cue, idx) => {
    const cueNum = (idx + 1) * 10;
    const states = resolveLightingAtTime(cue.timeSec, cues, fixtures);

    xmlLines.push(`    <Cue number="${cueNum}" name="${cue.name}">`);
    xmlLines.push(`      <TimecodeSMPTE>${formatSmpteTimecode(cue.timeSec, 24)}</TimecodeSMPTE>`);
    xmlLines.push(`      <FadeTime>${cue.transitionDurationSec.toFixed(2)}</FadeTime>`);
    xmlLines.push(`      <Note>${cue.notes || ''}</Note>`);
    xmlLines.push(`      <FixtureValues>`);

    states.forEach((s) => {
      xmlLines.push(
        `        <ChannelData fixtureId="${s.fixture.id}" startCh="${s.fixture.startChannel}" dimmer="${s.dmxChannels[0]}" kelvin="${s.finalKelvin}" hex="${s.hexColor}" />`
      );
    });

    xmlLines.push(`      </FixtureValues>`);
    xmlLines.push(`    </Cue>`);
  });

  xmlLines.push('  </Sequence>');
  xmlLines.push('</MA>');

  return xmlLines.join('\n');
}
