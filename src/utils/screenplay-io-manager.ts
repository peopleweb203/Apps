/**
 * Universal Script I/O Manager & Ingestion Engine
 * Provides bidirectional parsing and export for industry-standard Fountain (.fountain),
 * Final Draft XML (.fdx), and CineForge Master Production JSON Bundles.
 * Features an Auto-Tagging Ingest Pass to extract downstream 4K rendering engine parameters.
 */

import { GeneratedScreenplay, ScreenplayScene, ScreenplayElement, NarrativeBeatType } from './hollywood-screenplay-orchestrator';
import { LensType } from '../types';

export interface IngestTaggingReport {
  detectedAesthetics: string[];
  detectedVehicles: string[];
  detectedWardrobeBrands: string[];
  detectedStunts: string[];
  detectedAcousticEnvironments: string[];
  confidenceScore: number; // 0 to 100
}

export interface IngestedScriptResult {
  title: string;
  scenes: ScreenplayScene[];
  rawText: string;
  taggingReport: IngestTaggingReport;
  formatDetected: 'FOUNTAIN' | 'FINAL_DRAFT_FDX' | 'PRODUCTION_JSON' | 'PLAINTEXT';
}

// -------------------------------------------------------------
// FOUNTAIN PARSER & EXPORTER
// -------------------------------------------------------------

/**
 * Parses plain-text Fountain format into CineForge Screenplay scenes.
 */
export function parseFountainScript(fountainText: string): ScreenplayScene[] {
  const lines = fountainText.split(/\r?\n/);
  const scenes: ScreenplayScene[] = [];

  let currentScene: ScreenplayScene | null = null;
  let sceneIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Check for Scene Heading: INT., EXT., INT./EXT., I/E.
    const isHeading =
      /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)/i.test(trimmed) ||
      /^[A-Z0-9\s\-\.\'\,\/]+( - )+(DAY|NIGHT|DUSK|DAWN|MORNING|EVENING)/i.test(trimmed);

    if (isHeading) {
      if (currentScene) {
        scenes.push(currentScene);
      }

      const timeMatch = trimmed.match(/(DAY|NIGHT|DUSK|DAWN|MORNING|EVENING)/i);
      const timeOfDay = (timeMatch ? timeMatch[0].toUpperCase() : 'DAY') as 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN';

      currentScene = {
        id: `scene-${sceneIndex}`,
        sceneNumber: sceneIndex,
        beatType: 'FUN_AND_GAMES',
        heading: trimmed.toUpperCase(),
        timeOfDay: timeOfDay === 'MORNING' ? 'DAWN' : timeOfDay === 'EVENING' ? 'DUSK' : timeOfDay,
        locationName: trimmed.replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*/i, '').split('-')[0].trim(),
        summary: `Parsed scene #${sceneIndex} from Fountain source`,
        elements: [
          {
            type: 'SCENE_HEADING',
            text: trimmed.toUpperCase(),
          },
        ],
        engineParameters: {
          camera: {
            rig: 'A-CAM_MASTER_24mm',
            focalLength: '35mm',
            shutterAngle: 180,
            movement: 'Standard cinematic tracking track',
          },
          lighting: {
            kelvin: timeOfDay === 'NIGHT' ? 4500 : 5600,
            dimmerPercent: 75,
            flickerPattern: 'STEADY',
            atmosphere: 'Standard atmospheric clarity',
          },
          wardrobeLifestyle: {
            characterName: 'Protagonist',
            stratum: 'upper-middle',
            brandLabel: 'Contemporary',
          },
          vfxStunt: {},
          audioAcoustics: {
            reverbRoom: 'Studio Soundstage',
            foleySurface: 'Concrete',
            tensionScore: 45,
          },
        },
      };

      sceneIndex++;
      continue;
    }

    if (!currentScene) {
      if (/^(Title:|Credit:|Author:|Authors:|Source:|Draft date:|Contact:|Copyright:|===)/i.test(trimmed)) {
        continue;
      }
      // Create first default scene if missing heading
      currentScene = {
        id: `scene-1`,
        sceneNumber: 1,
        beatType: 'OPENING_IMAGE',
        heading: 'INT. PRODUCTION STAGE - DAY',
        timeOfDay: 'DAY',
        locationName: 'Production Stage',
        summary: 'Opening Sequence',
        elements: [{ type: 'SCENE_HEADING', text: 'INT. PRODUCTION STAGE - DAY' }],
        engineParameters: {
          camera: { rig: 'A-CAM_MASTER_24mm', focalLength: '35mm', shutterAngle: 180, movement: 'Static' },
          lighting: { kelvin: 5600, dimmerPercent: 70, flickerPattern: 'STEADY', atmosphere: 'Clean' },
          wardrobeLifestyle: { characterName: 'Protagonist', stratum: 'upper-middle', brandLabel: 'Standard' },
          vfxStunt: {},
          audioAcoustics: { reverbRoom: 'Studio', foleySurface: 'Tile', tensionScore: 30 },
        },
      };
      sceneIndex++;
    }

    // Engine directive comment [[ ... ]]
    if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
      const directiveText = trimmed.slice(2, -2).trim();
      currentScene.elements.push({
        type: 'ENGINE_DIRECTIVE',
        text: directiveText,
      });
      continue;
    }

    // Transition (e.g. CUT TO:, FADE OUT.)
    if (/^(CUT TO:|SMASH CUT TO:|FADE OUT\.|MATCH CUT TO:|DISSOLVE TO:)/i.test(trimmed)) {
      currentScene.elements.push({
        type: 'TRANSITION',
        text: trimmed,
      });
      continue;
    }

    // Character Cue (Uppercase name line without period)
    const isCharCue =
      /^[A-Z0-9\s\(\)]+$/.test(trimmed) &&
      trimmed.length < 35 &&
      !trimmed.includes('.') &&
      !trimmed.includes(':') &&
      i < lines.length - 1 &&
      lines[i + 1].trim().length > 0;

    if (isCharCue) {
      currentScene.elements.push({
        type: 'CHARACTER_CUE',
        text: trimmed,
      });
      continue;
    }

    // Parenthetical (e.g. (whispering))
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      currentScene.elements.push({
        type: 'PARENTHETICAL',
        text: trimmed,
      });
      continue;
    }

    // If preceding element is Character Cue or Parenthetical, this is Dialogue
    const prevElement = currentScene.elements[currentScene.elements.length - 1];
    if (prevElement && (prevElement.type === 'CHARACTER_CUE' || prevElement.type === 'PARENTHETICAL')) {
      currentScene.elements.push({
        type: 'DIALOGUE',
        text: trimmed,
      });
      continue;
    }

    // Fallback: Action Line
    currentScene.elements.push({
      type: 'ACTION_LINE',
      text: trimmed,
    });
  }

  if (currentScene) {
    scenes.push(currentScene);
  }

  return scenes;
}

/**
 * Exports screenplay scenes to canonical Fountain format string.
 */
export function exportToFountain(screenplay: GeneratedScreenplay): string {
  const lines: string[] = [
    `Title: ${screenplay.title}`,
    `Credit: Written by CineForge AI`,
    `Author: CineForge Multi-Model Writers Room`,
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
        lines.push(el.text.toUpperCase());
      } else if (el.type === 'PARENTHETICAL') {
        lines.push(el.text);
      } else if (el.type === 'DIALOGUE') {
        lines.push(el.text);
        lines.push('');
      } else if (el.type === 'ENGINE_DIRECTIVE') {
        lines.push(`[[ ${el.text} ]]`);
        lines.push('');
      } else if (el.type === 'TRANSITION') {
        lines.push(el.text.toUpperCase());
        lines.push('');
      }
    });
  });

  return lines.join('\n');
}

// -------------------------------------------------------------
// FINAL DRAFT XML (.FDX) EXPORTER & PARSER
// -------------------------------------------------------------

/**
 * Exports screenplay scenes to industry-standard Final Draft XML (.fdx).
 */
export function exportToFinalDraftFdx(screenplay: GeneratedScreenplay): string {
  const xml: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<FinalDraft DocumentType="Script" Template="No" Version="4">',
    '  <Content>',
  ];

  screenplay.scenes.forEach((scene) => {
    scene.elements.forEach((el) => {
      let pType = 'Action';
      if (el.type === 'SCENE_HEADING') pType = 'Scene Heading';
      else if (el.type === 'CHARACTER_CUE') pType = 'Character';
      else if (el.type === 'PARENTHETICAL') pType = 'Parenthetical';
      else if (el.type === 'DIALOGUE') pType = 'Dialogue';
      else if (el.type === 'TRANSITION') pType = 'Transition';
      else if (el.type === 'ENGINE_DIRECTIVE') pType = 'Action';

      const sanitizedText = (el.type === 'ENGINE_DIRECTIVE' ? `[[ ${el.text} ]]` : el.text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      xml.push(`    <Paragraph Type="${pType}">`);
      xml.push(`      <Text>${sanitizedText}</Text>`);
      xml.push(`    </Paragraph>`);
    });
  });

  xml.push('  </Content>');
  xml.push('</FinalDraft>');

  return xml.join('\n');
}

// -------------------------------------------------------------
// AUTO-TAGGING INGEST PASS
// -------------------------------------------------------------

/**
 * Scans third-party imported script text to identify downstream platform triggers:
 * aesthetics, luxury vehicles, high-octane setpieces, and room acoustics.
 */
export function runAutoTaggingIngestPass(scriptText: string): IngestTaggingReport {
  const lower = scriptText.toLowerCase();

  const detectedAesthetics: string[] = [];
  const detectedVehicles: string[] = [];
  const detectedWardrobeBrands: string[] = [];
  const detectedStunts: string[] = [];
  const detectedAcousticEnvironments: string[] = [];

  // 1. Aesthetics
  if (lower.includes('chiseled') || lower.includes('v-taper') || lower.includes('athletic')) {
    detectedAesthetics.push('Male Heroic 1.618 Golden Ratio V-Taper');
  }
  if (lower.includes('hourglass') || lower.includes('voluptuous') || lower.includes('radiant')) {
    detectedAesthetics.push('Female 0.70 WHR Silhouette & Luminescence');
  }
  if (lower.includes('statue') || lower.includes('bronze') || lower.includes('carapace')) {
    detectedAesthetics.push('Non-Human Rigid Jaw Morphology');
  }

  // 2. Vehicles
  if (lower.includes('maybach') || lower.includes('mercedes') || lower.includes('g-wagon')) {
    detectedVehicles.push('Mercedes-Maybach / G63 Ultra-Luxury Tier');
  }
  if (lower.includes('bmw') || lower.includes('audi') || lower.includes('lexus')) {
    detectedVehicles.push('Executive Upper-Middle Sedan/SUV');
  }
  if (lower.includes('civic') || lower.includes('corolla') || lower.includes('truck')) {
    detectedVehicles.push('Working-Class Utilitarian Commuter');
  }
  if (lower.includes('beater') || lower.includes('rusted') || lower.includes('dented')) {
    detectedVehicles.push('Street Distressed Weathered Sedan');
  }

  // 3. Wardrobe & Luxury Brands
  if (lower.includes('gucci') || lower.includes('louis vuitton') || lower.includes('savile row') || lower.includes('tailored suit')) {
    detectedWardrobeBrands.push('Haute Couture / Bespoke Tailoring');
  }
  if (lower.includes('carhartt') || lower.includes('canvas') || lower.includes('denim')) {
    detectedWardrobeBrands.push('Rugged Utilitarian Workwear');
  }
  if (lower.includes('diamond') || lower.includes('rolex') || lower.includes('patek')) {
    detectedWardrobeBrands.push('Flawless VVS Diamond & Swiss Horology');
  }

  // 4. Stunts & Extreme Physics
  if ((lower.includes('throw') || lower.includes('hurl') || lower.includes('lifting')) && (lower.includes('car') || lower.includes('vehicle'))) {
    detectedStunts.push('Superhuman 3,800kg Vehicle Mass Throw');
  }
  if (lower.includes('missile') || lower.includes('rocket') || lower.includes('fireball')) {
    detectedStunts.push('Mid-Air Missile Ballistic Intercept & Dual-Stage Bloom');
  }
  if (lower.includes('skyscraper') || lower.includes('rooftop') || lower.includes('vertigo')) {
    detectedStunts.push('Skyscraper Rooftop Vertigo Combat (90° Pitch-Down)');
  }
  if (lower.includes('bullet-time') || lower.includes('matrix') || lower.includes('shutter')) {
    detectedStunts.push('Matrix Combat Rig (90° Shutter & 120fps Ramp)');
  }

  // 5. Acoustic Environments
  if (lower.includes('alley') || lower.includes('cavern') || lower.includes('echo')) {
    detectedAcousticEnvironments.push('High Decay Reverb / Slapback Echo');
  }
  if (lower.includes('penthouse') || lower.includes('marble') || lower.includes('office')) {
    detectedAcousticEnvironments.push('Corporate Architectural Glass Acoustics');
  }

  const tagCount =
    detectedAesthetics.length +
    detectedVehicles.length +
    detectedWardrobeBrands.length +
    detectedStunts.length +
    detectedAcousticEnvironments.length;

  const confidenceScore = Math.min(100, Math.max(30, tagCount * 12));

  return {
    detectedAesthetics,
    detectedVehicles,
    detectedWardrobeBrands,
    detectedStunts,
    detectedAcousticEnvironments,
    confidenceScore,
  };
}

/**
 * Universal file ingestion processor.
 */
export function ingestScriptFile(fileName: string, fileContent: string): IngestedScriptResult {
  let formatDetected: IngestedScriptResult['formatDetected'] = 'PLAINTEXT';
  let scenes: ScreenplayScene[] = [];
  let title = fileName.replace(/\.[^/.]+$/, '');

  if (fileName.endsWith('.fountain')) {
    formatDetected = 'FOUNTAIN';
    scenes = parseFountainScript(fileContent);
  } else if (fileName.endsWith('.fdx')) {
    formatDetected = 'FINAL_DRAFT_FDX';
    // Extract text from FDX XML paragraphs
    const matches = fileContent.match(/<Paragraph[^>]*>[\s\S]*?<Text>([\s\S]*?)<\/Text>[\s\S]*?<\/Paragraph>/g) || [];
    const reconstructedLines = matches.map((m) => {
      const textMatch = m.match(/<Text>([\s\S]*?)<\/Text>/);
      return textMatch ? textMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
    });
    scenes = parseFountainScript(reconstructedLines.join('\n'));
  } else if (fileName.endsWith('.json')) {
    formatDetected = 'PRODUCTION_JSON';
    try {
      const parsed = JSON.parse(fileContent);
      if (parsed.scenes && Array.isArray(parsed.scenes)) {
        scenes = parsed.scenes;
        if (parsed.title) title = parsed.title;
      } else {
        scenes = parseFountainScript(fileContent);
      }
    } catch {
      scenes = parseFountainScript(fileContent);
    }
  } else {
    // Default plain text parser
    scenes = parseFountainScript(fileContent);
  }

  const taggingReport = runAutoTaggingIngestPass(fileContent);

  return {
    title,
    scenes,
    rawText: fileContent,
    taggingReport,
    formatDetected,
  };
}
