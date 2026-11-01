/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: 4K Color Mastering & Film Stock Pipeline
 * Rec.709 / DCI-P3 wide color gamut mapping, Arri LogC transfer curves,
 * Kodak Vision3 500T emulation, and soft highlight roll-off.
 */

export type ColorGamutSpace = 'Rec.709 Standard' | 'DCI-P3 Theatrical' | 'ACEScc Wide Gamut';
export type FilmStockEmulation =
  | 'kodak-vision3-500t'
  | 'arri-logc-clean'
  | 'panavision-anamorphic'
  | 'fuji-eterna-soft'
  | 'bleach-bypass-silver';

export interface ColorGradeConfig {
  gamut: ColorGamutSpace;
  filmStock: FilmStockEmulation;
  bitDepth: '10-bit ProRes 422HQ' | '12-bit ProRes 4444XQ' | '16-bit OpenEXR';
  aspectRatio: '2.39:1' | '16:9' | '1.85:1';
  fps: 24;
  highlightRollOffPercent: number; // 0 to 100% (e.g. 85% soft cinematic shoulder)
  shadowDensityToe: number; // e.g. 0.12 deep blacks without digital crushing
  filmGrainAmountPercent: number; // 0 to 30% (e.g. 15% fine 35mm optical grain)
  colorTemperatureKelvin: number; // 3200 to 6500K
  contrastCurve: 'Arri LogC Soft' | 'Linear Master' | 'High Dynamic Range PQ ST.2084';
}

export interface FilmStockPresetData {
  id: FilmStockEmulation;
  name: string;
  description: string;
  halationWarmth: string;
  shadowHue: string;
  highlightCurve: string;
  recommendedGrain: number;
}

export const FILM_STOCK_PRESETS: Record<FilmStockEmulation, FilmStockPresetData> = {
  'kodak-vision3-500t': {
    id: 'kodak-vision3-500t',
    name: 'Kodak Vision3 500T 5219',
    description: 'Gold-standard Hollywood 35mm negative. Deep shadow retention, creamy golden skin tones, and rich organic amber halation.',
    halationWarmth: '+14% Red-Orange Edge Halation',
    shadowHue: 'Cyan-Teal Cool Tones with zero digital noise',
    highlightCurve: 'Soft Roll-Off Shoulder (preserve neon detail)',
    recommendedGrain: 15,
  },
  'arri-logc-clean': {
    id: 'arri-logc-clean',
    name: 'Arri LogC3 Cinema Master',
    description: 'Pristine large-format Alexa 65 curve. 14+ stops of usable dynamic range with ultra-flat baseline for bespoke post-production grading.',
    halationWarmth: 'Neutral Balanced Luminance',
    shadowHue: 'Mathematically Neutral Neutral Gray Base',
    highlightCurve: '14.5 Stop Dynamic Range Linear Curve',
    recommendedGrain: 8,
  },
  'panavision-anamorphic': {
    id: 'panavision-anamorphic',
    name: 'Panavision Primo Anamorphic',
    description: 'Iconic wide-format cylindrical flare response, subtle optical barrel vignette, and soft pastel highlights.',
    halationWarmth: 'Horizontal Blue Streak Specular Flare',
    shadowHue: 'Rich Indigo Black Floor',
    highlightCurve: 'Organic Anamorphic Highlight Bloom',
    recommendedGrain: 18,
  },
  'fuji-eterna-soft': {
    id: 'fuji-eterna-soft',
    name: 'Fujifilm Eterna 250D',
    description: 'Subtle pastel palette with muted saturation, luminous pearlescent highlights, and gentle contrast transition.',
    halationWarmth: 'Cool Mint-Green & Opal Halation',
    shadowHue: 'Subtle Mauve Tint in Deep Shadows',
    highlightCurve: 'Gentle Low-Contrast Dreamy Roll-Off',
    recommendedGrain: 12,
  },
  'bleach-bypass-silver': {
    id: 'bleach-bypass-silver',
    name: 'ENR Silver Retention Bleach Bypass',
    description: 'High-contrast grit from retained metallic silver emulsion. Gritty desaturated tones with piercing specular reflections.',
    halationWarmth: 'Cold White Specular Flash',
    shadowHue: 'Onyx Black Deep Contrast Floor',
    highlightCurve: 'Hard Punchy Industrial Chiaroscuro',
    recommendedGrain: 25,
  },
};

export const DEFAULT_COLOR_GRADE: ColorGradeConfig = {
  gamut: 'DCI-P3 Theatrical',
  filmStock: 'kodak-vision3-500t',
  bitDepth: '10-bit ProRes 422HQ',
  aspectRatio: '2.39:1',
  fps: 24,
  highlightRollOffPercent: 85,
  shadowDensityToe: 0.12,
  filmGrainAmountPercent: 15,
  colorTemperatureKelvin: 4200,
  contrastCurve: 'Arri LogC Soft',
};

/**
 * Calculates simulated color mastering metadata and returns formatted LUT injection tokens
 */
export function buildMasteringPayload(config: ColorGradeConfig = DEFAULT_COLOR_GRADE) {
  const stock = FILM_STOCK_PRESETS[config.filmStock] || FILM_STOCK_PRESETS['kodak-vision3-500t'];

  const masteringPromptTag = `Color Science: Mastered in ${config.gamut} wide color space, ${config.bitDepth}, ${stock.name} emulation, ${stock.halationWarmth}, ${stock.shadowHue}, ${config.highlightRollOffPercent}% soft highlight roll-off shoulder, ${config.filmGrainAmountPercent}% organic 35mm optical grain, 24fps cadence.`;

  return {
    gamut: config.gamut,
    stockName: stock.name,
    lutProfile: `LUT_${config.filmStock.toUpperCase().replace(/-/g, '_')}_${config.gamut.replace(/[^A-Z0-9]/gi, '_')}`,
    contrastTransferCurve: config.contrastCurve,
    bitDepth: config.bitDepth,
    masteringPromptTag,
    technicalSpecs: {
      colorMatrix: config.gamut === 'DCI-P3 Theatrical' ? 'SMPTE RP 431-2' : 'ITU-R BT.709',
      gammaCurve: 'Gamma 2.4 / Arri LogC',
      dynamicRangeStops: 14.5,
      aspectRatio: config.aspectRatio,
      exportContainer: '4K DCI QuickTime MP4 / ProRes',
    },
  };
}
