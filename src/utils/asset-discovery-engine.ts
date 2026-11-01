import { FoleyTrack, SceneItem, SetLockerPlate } from '../types';

export type ProductionAssetType = 'TEXTURE' | 'MODEL_3D' | 'AUDIO_CLIP';

export interface ProductionAsset {
  id: string;
  name: string;
  fileName: string;
  type: ProductionAssetType;
  description: string;
  previewImageUrl?: string;
  technicalSpecs: {
    resolutionOrRate: string; // e.g., '8K PBR (8192x8192)' | '145K Tris • Rigged USDZ' | '96kHz / 24-bit WAV'
    format: string; // e.g., 'EXR / PBR', 'GLB / USDZ', 'WAV / BINAURAL'
    fileSizeMb: number;
    lightingKelvin?: number;
    durationSec?: number;
    polyCount?: string;
  };
  autoTags: {
    environment: string[];
    materialOrAcoustics: string[];
    mood: string[];
    pipelineStage: string[];
  };
  allTags: string[];
  semanticTokens: string[];
  assembledSceneIds: string[];
  catalogedAt: string;
}

export interface SemanticAssetSearchResult {
  asset: ProductionAsset;
  relevanceScore: number; // 0 to 100
  matchedConcepts: string[];
  matchedTags: string[];
  sceneCompatibilityNote?: string;
}

export interface AssetCatalogSummary {
  totalAssets: number;
  textureCount: number;
  model3dCount: number;
  audioClipCount: number;
  uniqueTagCount: number;
}

/**
 * Domain-specific semantic concept & synonym graph for film production assets.
 * Maps natural language concepts to related production tokens.
 */
const SEMANTIC_CONCEPT_GRAPH: Record<string, string[]> = {
  rain: ['rain', 'downpour', 'wet', 'puddle', 'storm', 'rainwater', 'asphalt', 'slick', 'weather', 'water', 'glass'],
  wet: ['wet', 'rain', 'slick', 'puddle', 'reflection', 'specular', 'glossy', 'asphalt', 'moisture'],
  neon: ['neon', 'cyberpunk', 'hologram', 'emissive', 'glow', 'amber', 'cyan', 'signage', 'alleyway', 'noir'],
  cyberpunk: ['cyberpunk', 'neon', 'neural', 'cybernetic', 'dystopian', 'sector', 'synth', 'holographic', 'implant'],
  alley: ['alley', 'alleyway', 'street', 'exterior', 'urban', 'asphalt', 'noodle', 'sector', 'rain'],
  server: ['server', 'mainframe', 'dispatch', 'core', 'biometric', 'terminal', 'vault', 'rack', 'data', 'telemetry', 'hum'],
  vault: ['vault', 'airlock', 'bulkhead', 'lockdown', 'security', 'breach', 'industrial', 'dispatch', 'door', 'server'],
  weapon: ['weapon', 'rifle', 'kinetic', 'firearm', 'gun', 'tactical', 'combat', 'guard', 'ammo'],
  prop: ['prop', 'case', 'transport', 'rifle', 'shard', 'neural', 'model', '3d', 'hero-prop'],
  case: ['case', 'briefcase', 'transport', 'silver', 'container', 'shard', 'payload', 'neural'],
  audio: ['audio', 'sound', 'foley', 'stem', 'binaural', 'ambience', 'loop', 'sfx', 'hum', 'drone', 'acoustics'],
  sound: ['audio', 'sound', 'foley', 'stem', 'binaural', 'ambience', 'hum', 'drone', 'rain', 'siren'],
  texture: ['texture', 'pbr', 'material', 'shader', 'surface', 'normal', 'roughness', 'albedo', 'displacement', '8k', '4k'],
  material: ['texture', 'pbr', 'material', 'shader', 'surface', 'metallic', 'asphalt', 'steel', 'concrete'],
  model: ['model', '3d', 'mesh', 'geometry', 'usdz', 'glb', 'rigged', 'prop', 'architecture'],
  mesh: ['model', '3d', 'mesh', 'geometry', 'usdz', 'glb', 'poly', 'prop'],
  dark: ['night', 'noir', 'shadow', 'dystopian', 'low-key', 'tense', 'ominous', 'dark'],
  night: ['night', 'noir', 'neon', 'dark', '4200k', '3200k', 'alleyway', 'rain'],
  industrial: ['industrial', 'warehouse', 'dispatch', 'steel', 'airlock', 'server', 'concrete', '5600k', 'machinery'],
  tense: ['tense', 'urgent', 'alarm', 'lockdown', 'siren', 'pulse', 'thriller', 'confrontation', 'decaying'],
};

const ENVIRONMENT_KEYWORDS: Record<string, string[]> = {
  'cyberpunk-urban': ['neon', 'cyberpunk', 'sector', 'alley', 'alleyway', 'noodle', 'hologram', 'city'],
  'industrial-interior': ['industrial', 'dispatch', 'server', 'vault', 'airlock', 'rack', 'bulkhead', 'core', 'station'],
  'rain-weather': ['rain', 'downpour', 'wet', 'storm', 'puddle', 'slick', 'weather'],
  'night-exterior': ['night', 'alley', 'street', 'asphalt', 'shadow', 'rooftop'],
  'sci-fi-tech': ['neural', 'biometric', 'telemetry', 'cybernetic', 'cortex', 'holographic', 'kinetic'],
};

const MATERIAL_ACOUSTIC_KEYWORDS: Record<string, string[]> = {
  'pbr-8k-surface': ['8k', 'pbr', 'exr', 'normal', 'roughness', 'displacement', 'shader'],
  'specular-wet': ['wet', 'reflection', 'puddle', 'rain', 'glossy', 'asphalt'],
  'emissive-neon': ['neon', 'emissive', 'amber', 'glow', 'strobe', 'telemetry', 'sign'],
  'metallic-hard-surface': ['silver', 'steel', 'titanium', 'graphite', 'metal', 'rifle', 'case', 'airlock', 'rack'],
  'binaural-spatial-audio': ['binaural', 'spatial', '96khz', 'wav', 'foley', 'ambience', 'reverb'],
  'sub-bass-drone': ['hum', 'drone', 'sub', 'pulse', 'low-end', 'synth'],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  'neo-noir': ['noir', 'alley', 'rain', 'shadow', 'neon', 'duster', 'confrontation'],
  'high-tension': ['tense', 'lockdown', 'alarm', 'siren', 'breach', 'rifle', 'decaying', 'frantic'],
  'atmospheric': ['ambient', 'downpour', 'hum', 'fog', 'mist', 'reverb', 'cavernous'],
  'tactical-action': ['kinetic', 'rifle', 'breach', 'crash', 'sprint', 'combat', 'guard'],
};

function tokenizeText(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/**
 * Automatically classifies, tags, and indexes a production asset from its raw metadata.
 */
export function catalogProductionAsset(input: {
  id?: string;
  name: string;
  fileName: string;
  type?: ProductionAssetType;
  description: string;
  previewImageUrl?: string;
  resolutionOrRate?: string;
  format?: string;
  fileSizeMb?: number;
  lightingKelvin?: number;
  durationSec?: number;
  polyCount?: string;
  assembledSceneIds?: string[];
}): ProductionAsset {
  const combinedText = `${input.name} ${input.fileName} ${input.description} ${
    input.resolutionOrRate || ''
  } ${input.format || ''}`.toLowerCase();

  // 1. Infer Asset Type if not explicitly provided
  let inferredType: ProductionAssetType = input.type || 'TEXTURE';
  if (!input.type) {
    if (/\.(glb|gltf|usdz|fbx|obj|blend)\b/i.test(input.fileName)) {
      inferredType = 'MODEL_3D';
    } else if (/\.(wav|mp3|ogg|flac|aiff)\b/i.test(input.fileName)) {
      inferredType = 'AUDIO_CLIP';
    } else if (/\.(exr|hdr|png|jpg|tga|tif|sbsar)\b/i.test(input.fileName)) {
      inferredType = 'TEXTURE';
    } else if (
      /\b(3d|mesh|model|rigged|tris|poly|geometry)\b/i.test(combinedText)
    ) {
      inferredType = 'MODEL_3D';
    } else if (
      /\b(audio|foley|sound|binaural|khz|hum|siren|sfx|stem)\b/i.test(combinedText)
    ) {
      inferredType = 'AUDIO_CLIP';
    } else {
      inferredType = 'TEXTURE';
    }
  }

  // 2. Extract multi-dimensional tags automatically
  const environment: string[] = [];
  for (const [tag, keywords] of Object.entries(ENVIRONMENT_KEYWORDS)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      environment.push(tag);
    }
  }
  if (environment.length === 0) {
    environment.push('studio-general');
  }

  const materialOrAcoustics: string[] = [];
  for (const [tag, keywords] of Object.entries(MATERIAL_ACOUSTIC_KEYWORDS)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      materialOrAcoustics.push(tag);
    }
  }
  if (materialOrAcoustics.length === 0) {
    materialOrAcoustics.push(
      inferredType === 'AUDIO_CLIP'
        ? 'broadcast-stem'
        : inferredType === 'MODEL_3D'
        ? 'manifold-mesh'
        : 'pbr-material'
    );
  }

  const mood: string[] = [];
  for (const [tag, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      mood.push(tag);
    }
  }
  if (mood.length === 0) {
    mood.push('cinematic');
  }

  const pipelineStage: string[] =
    inferredType === 'TEXTURE'
      ? ['stage-1-keyframe', 'surface-lookdev']
      : inferredType === 'MODEL_3D'
      ? ['stage-1-keyframe', 'stage-2-motion', 'spatial-blocking']
      : ['stage-3-soundstage', 'spatial-foley'];

  const allTags = Array.from(
    new Set([...environment, ...materialOrAcoustics, ...mood, ...pipelineStage])
  );

  // 3. Build expanded semantic token index for fast natural-language search
  const rawTokens = tokenizeText(`${combinedText} ${allTags.join(' ')}`);
  const expandedTokens = new Set<string>(rawTokens);

  for (const token of rawTokens) {
    for (const [conceptKey, synonyms] of Object.entries(SEMANTIC_CONCEPT_GRAPH)) {
      if (token === conceptKey || synonyms.includes(token)) {
        expandedTokens.add(conceptKey);
        synonyms.forEach((s) => expandedTokens.add(s));
      }
    }
  }

  const defaultFormat =
    inferredType === 'TEXTURE'
      ? 'EXR / 8K PBR'
      : inferredType === 'MODEL_3D'
      ? 'USDZ / GLB'
      : '96kHz / 24-bit WAV';

  const defaultRes =
    inferredType === 'TEXTURE'
      ? '8192×8192 (32-bit Float)'
      : inferredType === 'MODEL_3D'
      ? input.polyCount || '128K Tris • PBR Rigged'
      : input.durationSec
      ? `${input.durationSec}s Loop • 96kHz Binaural`
      : '96kHz / 24-bit Spatial Stem';

  return {
    id: input.id || `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name,
    fileName: input.fileName,
    type: inferredType,
    description: input.description,
    previewImageUrl: input.previewImageUrl,
    technicalSpecs: {
      resolutionOrRate: input.resolutionOrRate || defaultRes,
      format: input.format || defaultFormat,
      fileSizeMb:
        input.fileSizeMb ??
        (inferredType === 'TEXTURE' ? 184 : inferredType === 'MODEL_3D' ? 96 : 42),
      lightingKelvin: input.lightingKelvin,
      durationSec: input.durationSec,
      polyCount: input.polyCount,
    },
    autoTags: {
      environment,
      materialOrAcoustics,
      mood,
      pipelineStage,
    },
    allTags,
    semanticTokens: Array.from(expandedTokens),
    assembledSceneIds: input.assembledSceneIds || [],
    catalogedAt: new Date().toISOString(),
  };
}

/**
 * Generates the initial catalog of production assets (Textures, 3D Models, Audio Clips)
 * synchronized with the studio's SetLockerPlates, FoleyTracks, and Scene props.
 */
export function buildInitialProductionAssetCatalog(
  sets: SetLockerPlate[] = [],
  foleyTracks: FoleyTrack[] = []
): ProductionAsset[] {
  const catalog: ProductionAsset[] = [
    // TEXTURES
    catalogProductionAsset({
      id: 'tex-wet-asphalt-8k',
      name: 'Sector 4 Rain-Slick Asphalt & Neon Puddle Shader',
      fileName: 'sector4_wet_asphalt_puddles_8k_pbr.exr',
      type: 'TEXTURE',
      description:
        'Anisotropic wet asphalt surface map with dynamic rain ripple normals, oil-slick iridescence, and high-specular neon reflection channels.',
      previewImageUrl:
        sets[0]?.plateImageUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '8192×8192 • 8K PBR Multi-Channel',
      format: 'EXR / ORM + Normal',
      fileSizeMb: 248,
      lightingKelvin: 4200,
      assembledSceneIds: ['scene-1'],
    }),
    catalogProductionAsset({
      id: 'tex-matte-duster-fabric',
      name: 'Weather-Sealed Tactical Matte Duster Micro-Weave',
      fileName: 'elena_tactical_duster_hydrophobic_4k.exr',
      type: 'TEXTURE',
      description:
        'Hydrophobic ballistic nylon weave with procedural water droplet beading and worn seam roughness maps for hero character wardrobe.',
      previewImageUrl:
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '4096×4096 • 4K Cloth PBR',
      format: 'EXR / Subsurface + Micro-Normal',
      fileSizeMb: 112,
      lightingKelvin: 4500,
      assembledSceneIds: ['scene-1'],
    }),
    catalogProductionAsset({
      id: 'tex-amber-telemetry-decal',
      name: 'Industrial Server Core Amber Telemetry & Hologram Atlas',
      fileName: 'dispatch_amber_telemetry_emissive_8k.exr',
      type: 'TEXTURE',
      description:
        'Emissive holographic HUD decal sheet and pulsing amber biometric lockdown warning light maps for cavernous server room terminals.',
      previewImageUrl:
        sets[1]?.plateImageUrl ||
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '8192×8192 • HDR Emissive Atlas',
      format: 'EXR / 32-bit Emissive',
      fileSizeMb: 196,
      lightingKelvin: 5600,
      assembledSceneIds: ['scene-2'],
    }),
    catalogProductionAsset({
      id: 'tex-brushed-airlock-steel',
      name: 'Vault Bulkhead Brushed Titanium & Carbon Scoring',
      fileName: 'industrial_airlock_bulkhead_steel_8k.exr',
      type: 'TEXTURE',
      description:
        'Heavy industrial brushed titanium plating with hydraulic grease stains, laser scoring, and condensation roughness maps.',
      previewImageUrl:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '8192×8192 • 8K Metallic PBR',
      format: 'EXR / Albedo + Metalness',
      fileSizeMb: 215,
      lightingKelvin: 5600,
      assembledSceneIds: ['scene-2'],
    }),

    // 3D MODELS
    catalogProductionAsset({
      id: 'mod-neural-transport-case',
      name: 'Silver Neural Shard Transport Case (Hero Prop)',
      fileName: 'neural_transport_case_rigged_v4.usdz',
      type: 'MODEL_3D',
      description:
        'Articulated hard-surface hero prop with biometric thumbprint clasp, internal cryo-vial rack, and amber status LED rig.',
      previewImageUrl:
        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '142K Tris • Sub-D Hero Mesh',
      format: 'USDZ / GLB Rigged',
      fileSizeMb: 88,
      polyCount: '142,400 Tris',
      lightingKelvin: 4200,
      assembledSceneIds: ['scene-1'],
    }),
    catalogProductionAsset({
      id: 'mod-biometric-server-rack',
      name: 'Cavernous Dispatch Biometric Server Tower & Terminal',
      fileName: 'dispatch_server_core_tower_modular.usdz',
      type: 'MODEL_3D',
      description:
        'Modular 6-meter cyberpunk mainframe server rack with animated fiber-optic conduits, neural jack-in port, and blast-shielded airlock frame.',
      previewImageUrl:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '310K Tris • Modular Environment Kit',
      format: 'USDZ / Nanite Ready',
      fileSizeMb: 174,
      polyCount: '310,000 Tris',
      lightingKelvin: 5600,
      assembledSceneIds: ['scene-2'],
    }),
    catalogProductionAsset({
      id: 'mod-kinetic-pulse-rifle',
      name: 'Syndicate Heavy Kinetic Rifle (Bodyguard Variant)',
      fileName: 'syndicate_kinetic_rifle_mk9.glb',
      type: 'MODEL_3D',
      description:
        'Fully rigged tactical firearm mesh with reciprocating bolt, holographic sight reticle, and rain-shielded matte graphite barrel.',
      previewImageUrl:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '95K Tris • Skeletal Rigged',
      format: 'GLB / FBX',
      fileSizeMb: 64,
      polyCount: '95,200 Tris',
      lightingKelvin: 4200,
      assembledSceneIds: ['scene-1'],
    }),
    catalogProductionAsset({
      id: 'mod-neon-noodle-sign',
      name: 'Broken Sector 4 Kanji Noodle Bar Neon Overhang',
      fileName: 'sector4_broken_noodle_sign_mesh.usdz',
      type: 'MODEL_3D',
      description:
        'Weathered street overhang mesh with flickering transformer box, exposed high-voltage cabling, and broken glass neon tubes.',
      previewImageUrl:
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
      resolutionOrRate: '118K Tris • Destructible',
      format: 'USDZ / GLB',
      fileSizeMb: 79,
      polyCount: '118,000 Tris',
      lightingKelvin: 4200,
      assembledSceneIds: ['scene-1'],
    }),

    // AUDIO CLIPS
    catalogProductionAsset({
      id: 'aud-torrential-rain-binaural',
      name: 'Torrential Cyber-Alley Downpour & Asphalt Splash (3D Binaural)',
      fileName: 'sector4_torrential_rain_asphalt_96k.wav',
      type: 'AUDIO_CLIP',
      description:
        'Spatial 3D binaural recording of heavy rain slamming against wet asphalt, metal storm drains, and tactical duster fabric.',
      resolutionOrRate: '32s Seamless Loop • 96kHz / 24-bit',
      format: 'WAV / Dolby Atmos Bed',
      fileSizeMb: 48,
      durationSec: 32,
      assembledSceneIds: ['scene-1'],
    }),
    catalogProductionAsset({
      id: 'aud-server-core-hum',
      name: 'Cavernous Server Core Sub-Bass Hum & Cooling Turbines',
      fileName: 'dispatch_server_core_sub_hum_96k.wav',
      type: 'AUDIO_CLIP',
      description:
        'Deep 45Hz industrial mainframe transformer hum layered with warehouse convolution reverb and high-frequency telemetry relays.',
      resolutionOrRate: '28s Seamless Loop • 96kHz / 24-bit',
      format: 'WAV / Spatial Stem',
      fileSizeMb: 39,
      durationSec: 28,
      assembledSceneIds: ['scene-2'],
    }),
    catalogProductionAsset({
      id: 'aud-biometric-lockdown-siren',
      name: 'Biometric Firewall Decay & Amber Strobe Klaxon Stinger',
      fileName: 'firewall_decay_lockdown_alarm_stinger.wav',
      type: 'AUDIO_CLIP',
      description:
        'High-tension rhythmic neural alarm pulse and glitching biometric terminal alert designed for vault breach sequences.',
      resolutionOrRate: '14s Stinger • 96kHz / 24-bit',
      format: 'WAV / Transient Stem',
      fileSizeMb: 24,
      durationSec: 14,
      assembledSceneIds: ['scene-2'],
    }),
    catalogProductionAsset({
      id: 'aud-kinetic-rifle-foley',
      name: 'Heavy Kinetic Rifle Cocking & Tactical Footsteps on Wet Pavement',
      fileName: 'syndicate_rifle_cock_wet_footsteps.wav',
      type: 'AUDIO_CLIP',
      description:
        'Crisp close-mic mechanical firearm bolt action paired with splashing combat boot footsteps in a reverberant alleyway.',
      resolutionOrRate: '9s One-Shot • 96kHz / 24-bit',
      format: 'WAV / Mono Point-Source',
      fileSizeMb: 18,
      durationSec: 9,
      assembledSceneIds: ['scene-1'],
    }),
  ];

  // Also ensure any custom FoleyTracks not yet represented are discoverable
  for (const track of foleyTracks) {
    const alreadyExists = catalog.some((a) =>
      a.name.toLowerCase().includes(track.name.toLowerCase().slice(0, 10))
    );
    if (!alreadyExists) {
      catalog.push(
        catalogProductionAsset({
          id: `aud-foley-${track.id}`,
          name: `${track.name} (${track.reverbPreset} Convolution Stem)`,
          fileName: `${track.category.toLowerCase()}_${track.reverbPreset.toLowerCase()}.wav`,
          type: 'AUDIO_CLIP',
          description: `Studio foley track categorized under ${track.category} with ${track.reverbPreset} acoustic convolution preset.`,
          durationSec: 20,
        })
      );
    }
  }

  return catalog;
}

/**
 * Performs semantic search across the production asset catalog using natural-language
 * concept expansion, tag filtering, and optional target Scene compatibility scoring.
 */
export function searchProductionAssets(
  catalog: ProductionAsset[],
  options: {
    query?: string;
    typeFilter?: 'ALL' | ProductionAssetType;
    tagFilter?: string | null;
    targetScene?: SceneItem;
  } = {}
): SemanticAssetSearchResult[] {
  const { query = '', typeFilter = 'ALL', tagFilter = null, targetScene } = options;
  const trimmedQuery = query.trim().toLowerCase();
  const queryTokens = tokenizeText(trimmedQuery);

  // Expand query tokens through the semantic concept graph
  const expandedQueryMap = new Map<string, string>(); // expandedToken -> sourceQueryToken
  for (const qToken of queryTokens) {
    expandedQueryMap.set(qToken, qToken);
    for (const [concept, synonyms] of Object.entries(SEMANTIC_CONCEPT_GRAPH)) {
      if (
        qToken === concept ||
        concept.startsWith(qToken) ||
        synonyms.some((s) => s === qToken || s.startsWith(qToken))
      ) {
        expandedQueryMap.set(concept, qToken);
        for (const syn of synonyms) {
          if (!expandedQueryMap.has(syn)) {
            expandedQueryMap.set(syn, qToken);
          }
        }
      }
    }
  }

  const results: SemanticAssetSearchResult[] = [];

  for (const asset of catalog) {
    if (typeFilter !== 'ALL' && asset.type !== typeFilter) {
      continue;
    }

    if (tagFilter && !asset.allTags.includes(tagFilter)) {
      continue;
    }

    let score = 0;
    const matchedConcepts = new Set<string>();
    const matchedTags = new Set<string>();
    let sceneCompatibilityNote: string | undefined;

    // Scene context compatibility scoring
    if (targetScene) {
      const sceneText = `${targetScene.title} ${targetScene.atmosphere} ${targetScene.screenplayNotes} ${targetScene.timeOfDay}`.toLowerCase();
      const sceneTokens = tokenizeText(sceneText);
      let sceneOverlap = 0;
      for (const st of sceneTokens) {
        if (st.length >= 4 && asset.semanticTokens.includes(st)) {
          sceneOverlap++;
        }
      }
      if (sceneOverlap > 0) {
        score += Math.min(20, sceneOverlap * 5);
        sceneCompatibilityNote = `Matches Scene #${targetScene.sceneNumber} atmosphere & staging`;
      }
      if (
        asset.technicalSpecs.lightingKelvin &&
        Math.abs(asset.technicalSpecs.lightingKelvin - targetScene.lightingKelvin) <= 600
      ) {
        score += 10;
        sceneCompatibilityNote = `Kelvin-matched (${asset.technicalSpecs.lightingKelvin}K) for Scene #${targetScene.sceneNumber}`;
      }
    }

    if (!trimmedQuery) {
      // When query is empty, rank by scene relevance + baseline 85–98% score
      const baseScore = Math.min(99, 82 + score);
      results.push({
        asset,
        relevanceScore: baseScore,
        matchedConcepts: asset.autoTags.environment.slice(0, 2),
        matchedTags: asset.allTags.slice(0, 4),
        sceneCompatibilityNote,
      });
      continue;
    }

    const haystackName = asset.name.toLowerCase();
    const haystackDesc = asset.description.toLowerCase();
    const haystackFile = asset.fileName.toLowerCase();

    // Exact phrase match bonus
    if (haystackName.includes(trimmedQuery) || haystackDesc.includes(trimmedQuery)) {
      score += 45;
      matchedConcepts.add(trimmedQuery);
    }

    // Direct query token hits
    for (const qToken of queryTokens) {
      if (haystackName.includes(qToken)) {
        score += 28;
        matchedConcepts.add(qToken);
      } else if (haystackDesc.includes(qToken) || haystackFile.includes(qToken)) {
        score += 20;
        matchedConcepts.add(qToken);
      }

      for (const tag of asset.allTags) {
        if (tag.includes(qToken)) {
          score += 18;
          matchedTags.add(tag);
          matchedConcepts.add(qToken);
        }
      }
    }

    // Semantic expansion hits (synonyms & concept graph)
    for (const [expandedToken, sourceToken] of expandedQueryMap.entries()) {
      if (asset.semanticTokens.includes(expandedToken)) {
        score += expandedToken === sourceToken ? 16 : 11;
        matchedConcepts.add(
          expandedToken === sourceToken ? sourceToken : `${sourceToken} → ${expandedToken}`
        );
      }
      for (const tag of asset.allTags) {
        if (tag.includes(expandedToken)) {
          matchedTags.add(tag);
        }
      }
    }

    if (score > 0) {
      const normalizedScore = Math.max(15, Math.min(99, score));
      results.push({
        asset,
        relevanceScore: normalizedScore,
        matchedConcepts: Array.from(matchedConcepts).slice(0, 4),
        matchedTags: Array.from(matchedTags).slice(0, 4),
        sceneCompatibilityNote,
      });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Computes summary counts across the production asset catalog.
 */
export function summarizeAssetCatalog(catalog: ProductionAsset[]): AssetCatalogSummary {
  const uniqueTags = new Set<string>();
  let textureCount = 0;
  let model3dCount = 0;
  let audioClipCount = 0;

  for (const asset of catalog) {
    if (asset.type === 'TEXTURE') textureCount++;
    else if (asset.type === 'MODEL_3D') model3dCount++;
    else if (asset.type === 'AUDIO_CLIP') audioClipCount++;

    asset.allTags.forEach((t) => uniqueTags.add(t));
  }

  return {
    totalAssets: catalog.length,
    textureCount,
    model3dCount,
    audioClipCount,
    uniqueTagCount: uniqueTags.size,
  };
}

/**
 * Assembles a discovered production asset directly into a target SceneItem,
 * injecting lookdev/mesh/audio conditioning into the scene's notes and shot prompts.
 */
export function assembleAssetIntoScene(
  scenes: SceneItem[],
  targetSceneId: string,
  asset: ProductionAsset
): SceneItem[] {
  return scenes.map((scene) => {
    if (scene.id !== targetSceneId) return scene;

    const tagMarker = `[${asset.type}: ${asset.name}]`;
    const updatedNotes = scene.screenplayNotes.includes(asset.name)
      ? scene.screenplayNotes
      : `${scene.screenplayNotes} • ${tagMarker}`;

    const updatedShots = scene.shots.map((shot) => {
      if (shot.stillPrompt.includes(asset.fileName)) {
        return shot;
      }
      const conditioningSuffix =
        asset.type === 'TEXTURE'
          ? ` | Surface PBR: ${asset.name} (${asset.fileName})`
          : asset.type === 'MODEL_3D'
          ? ` | 3D Asset Prop: ${asset.name} (${asset.fileName})`
          : ` | Spatial Audio Cue: ${asset.name}`;

      return {
        ...shot,
        stillPrompt: `${shot.stillPrompt}${conditioningSuffix}`,
      };
    });

    return {
      ...scene,
      screenplayNotes: updatedNotes,
      shots: updatedShots,
    };
  });
}
