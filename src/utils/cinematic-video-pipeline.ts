export type CinematicQualityPreset = 'draft-1080p' | 'pro-2k' | 'master-4k' | 'ultra-5k';
export type CinematicAspectRatio = '2.39:1' | '16:9' | '1.85:1' | '9:16';
export type ColorSciencePreset =
  | 'kodak-500t'
  | 'bleach-bypass'
  | 'technicolor-3strip'
  | 'teal-orange'
  | 'noir-monochrome';
export type CameraRigMotion =
  | 'slow-dolly'
  | 'steadicam-orbit'
  | 'low-angle-track'
  | 'static-locked'
  | 'crane-jib';

export interface QualityPresetConfig {
  id: CinematicQualityPreset;
  name: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  inferenceSteps: number;
  cfgScale: number;
  targetBitrateMbps: number;
  hdrEnabled: boolean;
  colorDepth: '8-bit' | '10-bit ProRes 422HQ' | '12-bit RAW';
}

export interface CinematicPipelineConfig {
  qualityPreset: CinematicQualityPreset;
  aspectRatio: CinematicAspectRatio;
  colorScience: ColorSciencePreset;
  focalLengthMm: number; // 24 to 85mm
  aperture: string; // e.g. 'f/1.8'
  cameraRig: CameraRigMotion;
  maximizeCinematicQuality: boolean;
  volumetricHaze: boolean;
  chromaticAberration: boolean;
  filmGrainIso: number; // 200, 500, 800
}

export const QUALITY_PRESETS: Record<CinematicQualityPreset, QualityPresetConfig> = {
  'draft-1080p': {
    id: 'draft-1080p',
    name: 'Standard Draft (1080p)',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    fps: 24,
    inferenceSteps: 28,
    cfgScale: 6.5,
    targetBitrateMbps: 20,
    hdrEnabled: false,
    colorDepth: '8-bit',
  },
  'pro-2k': {
    id: 'pro-2k',
    name: 'Cinematic Pro (2K Widescreen 2.39:1)',
    resolution: '2560x1071',
    width: 2560,
    height: 1071,
    fps: 24,
    inferenceSteps: 40,
    cfgScale: 7.5,
    targetBitrateMbps: 45,
    hdrEnabled: true,
    colorDepth: '10-bit ProRes 422HQ',
  },
  'master-4k': {
    id: 'master-4k',
    name: 'Master 4K (4K UHD HDR High-Bitrate)',
    resolution: '3840x1606', // 2.39:1 Cinema 4K
    width: 3840,
    height: 1606,
    fps: 24,
    inferenceSteps: 55,
    cfgScale: 8.5,
    targetBitrateMbps: 85,
    hdrEnabled: true,
    colorDepth: '12-bit RAW',
  },
  'ultra-5k': {
    id: 'ultra-5k',
    name: 'Ultra 5K (5K Anamorphic 12-Bit RAW)',
    resolution: '5120x2160', // 2.39:1 Cinema 5K
    width: 5120,
    height: 2160,
    fps: 24,
    inferenceSteps: 65,
    cfgScale: 9.0,
    targetBitrateMbps: 135,
    hdrEnabled: true,
    colorDepth: '12-bit RAW',
  },
};

export const COLOR_SCIENCE_MAP: Record<ColorSciencePreset, { name: string; promptTag: string; lutProfile: string }> = {
  'kodak-500t': {
    name: 'Kodak Vision3 500T',
    promptTag: 'Kodak Vision3 500T 5219 film stock emulation, authentic warm organic halation, soft highlight roll-off, balanced skin-tone luminance',
    lutProfile: 'KODAK_5219_D55',
  },
  'bleach-bypass': {
    name: 'Silver Retention Bleach Bypass',
    promptTag: 'Bleach bypass chemical film bath, high silver contrast, desaturated cold shadows, pronounced gritty grain texture',
    lutProfile: 'BLEACH_BYPASS_SILVER',
  },
  'technicolor-3strip': {
    name: 'Technicolor 3-Strip Vintage',
    promptTag: 'Vintage 1950s Technicolor dye-transfer 3-strip color process, hyper-saturated primary hues, velvet blacks, golden hour warmth',
    lutProfile: 'TECHNICOLOR_IB',
  },
  'teal-orange': {
    name: 'Modern Teal & Amber Contrast',
    promptTag: 'Cinematic blockbuster split-toning, deep teal shadow hues with radiant amber-gold skin specular highlights',
    lutProfile: 'BLOCKBUSTER_TEAL_AMBER',
  },
  'noir-monochrome': {
    name: 'High-Contrast Noir Chiaroscuro',
    promptTag: '35mm Panatomic-X monochrome film, rich silver gelatin shadows, dramatic Venetian blind shadow slashes, crisp specular highlights',
    lutProfile: 'NOIR_MONOCHROME_X',
  },
};

export const CAMERA_RIG_MAP: Record<CameraRigMotion, { name: string; promptTag: string; stabilization: string }> = {
  'slow-dolly': {
    name: 'Slow Push-In Dolly',
    promptTag: 'Slow measured Chapman-Leonard dolly push-in tracking smoothly along optical axis, cinematic 24fps motion blur',
    stabilization: 'Hydraulic Dolly Track',
  },
  'steadicam-orbit': {
    name: 'Steadicam 360° Orbit',
    promptTag: 'Fluid mechanical Steadicam M-2 orbital arc shot maintaining subject eye-line center, organic human micro-momentum',
    stabilization: 'Steadicam 3-Axis Gimbal',
  },
  'low-angle-track': {
    name: 'Low-Angle Tracking Jib',
    promptTag: 'Low-angle Technocrane ground sweep tracking forward, dramatic upward perspective, volumetric reflections',
    stabilization: 'Low-Mode Ronin 2 Jib',
  },
  'static-locked': {
    name: 'Static O\'Connor Locked-Off',
    promptTag: 'Locked-off heavyweight O\'Connor 2575 tripod head, zero jitter, deliberate compositional geometry, master still staging',
    stabilization: 'Heavyweight Studio Tripod',
  },
  'crane-jib': {
    name: 'Sweeping Crane Jib Reveal',
    promptTag: 'Dramatic high-to-low vertical crane descent revealing environment scale, seamless deceleration',
    stabilization: 'SuperTechno 50 Telescopic Crane',
  },
};

export const DEFAULT_CINEMATIC_CONFIG: CinematicPipelineConfig = {
  qualityPreset: 'master-4k',
  aspectRatio: '2.39:1',
  colorScience: 'kodak-500t',
  focalLengthMm: 35,
  aperture: 'f/1.8',
  cameraRig: 'slow-dolly',
  maximizeCinematicQuality: true,
  volumetricHaze: true,
  chromaticAberration: true,
  filmGrainIso: 500,
};

/**
 * Programmatically intercepts any raw prompt and injects elite cinematographic parameters:
 * Camera Optics, Lighting & Atmosphere, Color Science, and Motion Cadence.
 */
export function optimizeCinematicPrompt(
  rawPrompt: string,
  config: CinematicPipelineConfig = DEFAULT_CINEMATIC_CONFIG
): {
  masterPrompt: string;
  injectedTags: {
    optics: string;
    lighting: string;
    colorScience: string;
    motion: string;
    resolution: string;
  };
} {
  const cleanBase = rawPrompt.trim();

  // 1. Camera Optics Parameters
  const lensDescriptor =
    config.focalLengthMm <= 28
      ? `${config.focalLengthMm}mm Panavision Ultra Panatar anamorphic ultra-wide angle lens`
      : config.focalLengthMm <= 40
      ? `${config.focalLengthMm}mm anamorphic prime lens, Arri Alexa 65 large-format sensor`
      : config.focalLengthMm <= 65
      ? `${config.focalLengthMm}mm Cooke Anamorphic/i prime lens`
      : `${config.focalLengthMm}mm portrait telephoto anamorphic, compressed background perspective`;

  const opticsTag = `${lensDescriptor}, ${config.aperture} shallow depth of field, natural anamorphic horizontal streak flares, soft optical bokeh${
    config.chromaticAberration ? ', subtle optical edge chromatic aberration' : ''
  }`;

  // 2. Lighting & Atmosphere Parameters
  const lightingTag = `volumetric rim lighting, motivated practical light sources, atmospheric haze with floating dust particles, high dynamic range chiaroscuro shadow depth, 4200K Kelvin cinematic temperature balance`;

  // 3. Color Science Parameters
  const colorSpec = COLOR_SCIENCE_MAP[config.colorScience] || COLOR_SCIENCE_MAP['kodak-500t'];
  const colorScienceTag = `${colorSpec.promptTag}, master filmic LUT grade, ISO ${config.filmGrainIso} organic chemical film grain`;

  // 4. Motion Cadence Parameters
  const rigSpec = CAMERA_RIG_MAP[config.cameraRig] || CAMERA_RIG_MAP['slow-dolly'];
  const motionTag = `${rigSpec.promptTag}, natural 180-degree shutter angle, 24.00 fps cadence`;

  // 5. Resolution & Mastering Parameters
  const preset = QUALITY_PRESETS[config.qualityPreset] || QUALITY_PRESETS['master-4k'];
  const tierLabel = config.qualityPreset === 'ultra-5k' ? 'Ultra 5K (5120x2160)' : 'Master 4K DCI';
  const resolutionTag = config.maximizeCinematicQuality
    ? `${tierLabel} ${config.aspectRatio} anamorphic widescreen, 4K/5K uncompressed master render, photorealistic cinematic masterpiece`
    : `${preset.resolution} resolution, ${config.aspectRatio} format`;

  // Combine into unified Master Prompt
  const masterPrompt = `${cleanBase}, shot on ${opticsTag}. ${lightingTag}. ${colorScienceTag}. ${motionTag}. ${resolutionTag}.`;

  return {
    masterPrompt,
    injectedTags: {
      optics: opticsTag,
      lighting: lightingTag,
      colorScience: colorScienceTag,
      motion: motionTag,
      resolution: resolutionTag,
    },
  };
}

/**
 * Builds full generation payload for Wan 2.1 / Kling / Flux.1
 */
export function buildVideoGenerationPayload(
  rawPrompt: string,
  configInput: Partial<CinematicPipelineConfig> & Record<string, any> = DEFAULT_CINEMATIC_CONFIG,
  _lensOverride?: string
) {
  const config: CinematicPipelineConfig = {
    ...DEFAULT_CINEMATIC_CONFIG,
    ...configInput,
    qualityPreset:
      configInput?.qualityPreset && QUALITY_PRESETS[configInput.qualityPreset as CinematicQualityPreset]
        ? (configInput.qualityPreset as CinematicQualityPreset)
        : DEFAULT_CINEMATIC_CONFIG.qualityPreset,
    colorScience:
      configInput?.colorScience && COLOR_SCIENCE_MAP[configInput.colorScience as ColorSciencePreset]
        ? (configInput.colorScience as ColorSciencePreset)
        : DEFAULT_CINEMATIC_CONFIG.colorScience,
    cameraRig:
      configInput?.cameraRig && CAMERA_RIG_MAP[configInput.cameraRig as CameraRigMotion]
        ? (configInput.cameraRig as CameraRigMotion)
        : DEFAULT_CINEMATIC_CONFIG.cameraRig,
  };
  const preset = QUALITY_PRESETS[config.qualityPreset] || QUALITY_PRESETS['master-4k'];
  const { masterPrompt, injectedTags } = optimizeCinematicPrompt(rawPrompt, config);

  // Dynamic aspect ratio calculation
  let width = preset.width;
  let height = preset.height;

  if (config.aspectRatio === '16:9') {
    width =
      config.qualityPreset === 'ultra-5k'
        ? 5120
        : config.qualityPreset === 'master-4k'
        ? 3840
        : config.qualityPreset === 'pro-2k'
        ? 2560
        : 1920;
    height =
      config.qualityPreset === 'ultra-5k'
        ? 2880
        : config.qualityPreset === 'master-4k'
        ? 2160
        : config.qualityPreset === 'pro-2k'
        ? 1440
        : 1080;
  } else if (config.aspectRatio === '9:16') {
    width = config.qualityPreset === 'ultra-5k' ? 2880 : config.qualityPreset === 'master-4k' ? 2160 : 1080;
    height = config.qualityPreset === 'ultra-5k' ? 5120 : config.qualityPreset === 'master-4k' ? 3840 : 1920;
  } else if (config.aspectRatio === '1.85:1') {
    width =
      config.qualityPreset === 'ultra-5k'
        ? 5328
        : config.qualityPreset === 'master-4k'
        ? 3996
        : 1998;
    height =
      config.qualityPreset === 'ultra-5k'
        ? 2880
        : config.qualityPreset === 'master-4k'
        ? 2160
        : 1080;
  }

  return {
    prompt: masterPrompt,
    rawPrompt,
    aspectRatio: config.aspectRatio,
    resolution: `${width}x${height}`,
    injectedTags,
    modelParameters: {
      steps: preset.inferenceSteps,
      cfgScale: preset.cfgScale,
      width,
      height,
      fps: preset.fps,
      bitrateMbps: preset.targetBitrateMbps,
      colorDepth: preset.colorDepth,
      motionSmoothing: true,
      lutProfile: COLOR_SCIENCE_MAP[config.colorScience].lutProfile,
      cameraStabilization: CAMERA_RIG_MAP[config.cameraRig].stabilization,
    },
  };
}
