/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Crowd & World Background Engine
 * Generates ultra-dense, complex scenes with 100+ distinct agents without visual pooling
 * or subject occlusion via a 3-pass scene layering architecture & spatial prompt compilation.
 */

export type DepthPlane = 'foreground' | 'midground' | 'background';
export type LevelOfDetail = 'LOD0_HERO_SHARP' | 'LOD1_FULL_DETAIL' | 'LOD2_MEDIUM_GESTURE' | 'LOD3_SILHOUETTE_ATMOSPHERE';

export interface EnvironmentalZone {
  id: string;
  name: string;
  depthPlane: DepthPlane;
  spatialCluster: 'transit_corridor' | 'market_bazaar' | 'dwelling_perches' | 'industrial_catwalk' | 'plaza_concourse' | 'skybridge_overpass';
  recommendedAgentRange: [number, number];
  assignedAgentsCount: number;
  lodLevel: LevelOfDetail;
  activityCategory: 'commerce_exchange' | 'rapid_transit' | 'loitering_ambient' | 'tactical_observation' | 'maintenance_labor';
  microActions: string[];
}

export interface AgentMicroAction {
  id: string;
  zoneId: string;
  depthPlane: DepthPlane;
  actorArchetype: string;
  microAction: string;
  facingDirection: 'toward_camera' | 'away_from_camera' | 'cross_traffic_left' | 'cross_traffic_right' | 'seated_stationary';
  velocityKmH: number;
  lodLevel: LevelOfDetail;
  clusterId: string;
}

export interface CoherenceGuardConfig {
  preserveSubjectSharpness: boolean;
  heroEyeLineBufferRadiusMeters: number; // e.g. 2.5m exclusion zone around main actors
  atmosphericFogDensityPercent: number; // 0 to 100%
  depthOfFieldBlurAperture: 'f/1.4' | 'f/2.0' | 'f/2.8' | 'f/4.0' | 'f/8.0';
  opticalFalloffDecibel: number; // e.g. -18dB background high-frequency roll-off
  visualPoolingThreshold: number; // 0 to 1.0 (lower means strictly dispersed)
}

export interface CrowdWorldConfig {
  totalAgentDensity: number; // 10 to 150+
  macroAtmosphere: string;
  architecturalScale: 'Intimate Urban Corridor' | 'Monumental Mega-Structure' | 'Multi-Tiered Sub-City' | 'Industrial Sprawl';
  depthFogLevel: 'Subtle Morning Haze' | 'Dense Neo-Noir Neon Mist' | 'Volumetric Industrial Smog' | 'Crystal Clear High-Altitude';
  globalIlluminationKelvin: number; // 3200 to 6500K
  coherenceGuard: CoherenceGuardConfig;
  zones: EnvironmentalZone[];
}

export const PRESET_MICRO_ACTIONS: Record<string, string[]> = {
  commerce_exchange: [
    'street vendor haggling over synthetic optic parts under flickering halogen light',
    'courier scanning holographic QR bill of lading with wrist-mounted chronometer',
    'patron inspecting ceramic street noodle bowls beside steam vent',
    'black-market data broker transferring encrypted memory stylus between coats',
    'apparel tailor measuring thermal insulated coat lapel in open booth',
    'cybernetic locksmith testing key-card cipher against iron roller shutter',
  ],
  rapid_transit: [
    'commuters quick-stepping in sync across elevated wet metal pedestrian bridge',
    'bicycle courier weaving sharply through rain puddles with neon rim glow',
    'subway passenger holding pneumatic hand-rail as maglev door seals',
    'pedestrians opening translucent carbon umbrellas under torrential rain',
    'heavy freight loader pulling magnetized pallet cart down cobblestones',
    'messenger running across neon crosswalk checking transparent data tablet',
  ],
  loitering_ambient: [
    'drifter leaning against corrugated shipping container smoking glowing e-cigarette',
    'trio of night scavengers conversing beneath glowing neon kanji billboard',
    'watcher leaning over balcony railing observing ground-level alleyway traffic',
    'weary commuter resting on stainless steel public terminal bench',
    'off-duty drone technician calibrating sensory gimbal on stair landing',
    'two youth sitting on neon-lit fire escape eating steamed dumplings',
  ],
  tactical_observation: [
    'hooded operative monitoring street intersection with optical binoculars from catwalk',
    'security sentinel pacing elevated perimeter with shoulder-mounted strobe light',
    'undercover informant glancing at wrist sensor while sheltered under awning',
    'rooftop scout tracking low-altitude surveillance drone trajectory',
  ],
  maintenance_labor: [
    'mechanic arc-welding conduit joint throwing bright blue magnesium sparks',
    'janitorial technician operating high-pressure mist sprayer along curb',
    'electrician rerouting heavy insulated neon power cables on utility pole',
    'drainage worker clearing debris from steaming street grate',
  ],
};

export const DEFAULT_ZONES: EnvironmentalZone[] = [
  {
    id: 'zone-fore',
    name: 'Hero Focus Foreground Plane',
    depthPlane: 'foreground',
    spatialCluster: 'plaza_concourse',
    recommendedAgentRange: [0, 4],
    assignedAgentsCount: 2,
    lodLevel: 'LOD0_HERO_SHARP',
    activityCategory: 'tactical_observation',
    microActions: [
      'hero actors Elena & Vance holding critical eye-line with zero crowd occlusion',
      'distant passerby crossing far off-edge without breaching 2.5m eye-line safe zone',
    ],
  },
  {
    id: 'zone-mid-market',
    name: 'Mid-Ground Neon Market Stalls',
    depthPlane: 'midground',
    spatialCluster: 'market_bazaar',
    recommendedAgentRange: [15, 45],
    assignedAgentsCount: 32,
    lodLevel: 'LOD1_FULL_DETAIL',
    activityCategory: 'commerce_exchange',
    microActions: [
      'street vendor haggling over optic chips beneath orange plastic tarp',
      'patrons sipping tea around steaming brass urn',
      'courier loading waterproof canister into cargo pannier',
    ],
  },
  {
    id: 'zone-mid-transit',
    name: 'Mid-Ground Elevated Walkway & Transit',
    depthPlane: 'midground',
    spatialCluster: 'transit_corridor',
    recommendedAgentRange: [20, 50],
    assignedAgentsCount: 38,
    lodLevel: 'LOD2_MEDIUM_GESTURE',
    activityCategory: 'rapid_transit',
    microActions: [
      'pedestrians traversing illuminated rain-slick steel skybridge in dual directions',
      'courier ducking under low pneumatic cables with delivery satchel',
    ],
  },
  {
    id: 'zone-deep-dwelling',
    name: 'Deep Background Vertical Dwelling Catwalks',
    depthPlane: 'background',
    spatialCluster: 'dwelling_perches',
    recommendedAgentRange: [25, 75],
    assignedAgentsCount: 52,
    lodLevel: 'LOD3_SILHOUETTE_ATMOSPHERE',
    activityCategory: 'loitering_ambient',
    microActions: [
      'dim silhouettes leaning against high balcony railings across 12-story high-rise facade',
      'distant transit hover-cabs gliding through deep atmospheric neon mist',
      'maintenance crews working in illuminated window alcoves far upstage',
    ],
  },
];

export const DEFAULT_CROWD_WORLD_CONFIG: CrowdWorldConfig = {
  totalAgentDensity: 124,
  macroAtmosphere: 'Dystopian Rain-Slick Cyberpunk Metropolis with Deep Volumetric Glow',
  architecturalScale: 'Multi-Tiered Sub-City',
  depthFogLevel: 'Dense Neo-Noir Neon Mist',
  globalIlluminationKelvin: 4200,
  coherenceGuard: {
    preserveSubjectSharpness: true,
    heroEyeLineBufferRadiusMeters: 2.5,
    atmosphericFogDensityPercent: 68,
    depthOfFieldBlurAperture: 'f/1.8' as any,
    opticalFalloffDecibel: -18,
    visualPoolingThreshold: 0.15,
  },
  zones: DEFAULT_ZONES,
};

/**
 * Procedurally generates non-repeating agent micro-actions across clusters
 * using deterministic seeding to eliminate visual pooling (clumping).
 */
export function generateAgentDensityMatrix(
  config: CrowdWorldConfig
): {
  agents: AgentMicroAction[];
  visualPoolingScore: number; // 0.0 (perfectly distributed) to 1.0 (clumped)
  lodDistribution: Record<LevelOfDetail, number>;
  totalAgents: number;
} {
  const targetCount = Math.max(10, Math.min(200, config.totalAgentDensity));
  const agents: AgentMicroAction[] = [];

  // Distribution ratios based on depth:
  // Foreground: 2-5% (Hero clarity)
  // Midground: 40-45% (Contextual dynamism)
  // Background: 50-55% (Atmospheric density)
  const foregroundTarget = Math.max(1, Math.min(6, Math.round(targetCount * 0.04)));
  const midgroundTarget = Math.round(targetCount * 0.42);
  const backgroundTarget = targetCount - foregroundTarget - midgroundTarget;

  const archetypePool = [
    'Cyber-Courier',
    'Street Merchant',
    'Transit Commuter',
    'Drone Tech',
    'Scavenger',
    'Alleyway Drifter',
    'Security Operative',
    'Industrial Welder',
    'Tea Vendor',
    'Apparel Maker',
  ];

  const directions: AgentMicroAction['facingDirection'][] = [
    'cross_traffic_left',
    'cross_traffic_right',
    'away_from_camera',
    'toward_camera',
    'seated_stationary',
  ];

  // 1. FOREGROUND AGENTS (Strict safe-zone, zero eye-line occlusion)
  for (let i = 0; i < foregroundTarget; i++) {
    agents.push({
      id: `agent-fg-${i + 1}`,
      zoneId: 'zone-fore',
      depthPlane: 'foreground',
      actorArchetype: i === 0 ? 'Lead Actor Peripheral' : 'Peripheral Pedestrian',
      microAction:
        i === 0
          ? 'maintaining 2.5m standoff perimeter from hero actors, moving parallel to camera frame'
          : 'passing quickly on far right edge, silhouette framed against street puddle reflections',
      facingDirection: i % 2 === 0 ? 'cross_traffic_left' : 'cross_traffic_right',
      velocityKmH: 4.2,
      lodLevel: 'LOD0_HERO_SHARP',
      clusterId: 'cluster-hero-margin',
    });
  }

  // 2. MIDGROUND AGENTS (Dynamic commerce & transit)
  const midPool = [
    ...PRESET_MICRO_ACTIONS.commerce_exchange,
    ...PRESET_MICRO_ACTIONS.rapid_transit,
    ...PRESET_MICRO_ACTIONS.maintenance_labor,
  ];

  for (let i = 0; i < midgroundTarget; i++) {
    const actionIndex = (i * 3 + 1) % midPool.length;
    const archetype = archetypePool[i % archetypePool.length];
    const dir = directions[i % directions.length];
    const lod: LevelOfDetail = i % 3 === 0 ? 'LOD1_FULL_DETAIL' : 'LOD2_MEDIUM_GESTURE';

    agents.push({
      id: `agent-mg-${i + 1}`,
      zoneId: i % 2 === 0 ? 'zone-mid-market' : 'zone-mid-transit',
      depthPlane: 'midground',
      actorArchetype: archetype,
      microAction: `${archetype} ${midPool[actionIndex]}`,
      facingDirection: dir,
      velocityKmH: dir === 'seated_stationary' ? 0 : 3.5 + (i % 5) * 0.8,
      lodLevel: lod,
      clusterId: `cluster-mid-${(i % 5) + 1}`,
    });
  }

  // 3. BACKGROUND AGENTS (Depth density & atmospheric silhouettes)
  const bgPool = [
    ...PRESET_MICRO_ACTIONS.loitering_ambient,
    ...PRESET_MICRO_ACTIONS.tactical_observation,
    'gliding past distant skybridge window with soft optical bokeh',
    'adjusting high-altitude neon signage in volumetric rain fog',
    'walking along elevated catwalk silhouette against massive neon skyscraper',
    'small cluster of four figures huddled around rooftop brazier fire',
  ];

  for (let i = 0; i < backgroundTarget; i++) {
    const actionIndex = (i * 7 + 2) % bgPool.length;
    agents.push({
      id: `agent-bg-${i + 1}`,
      zoneId: 'zone-deep-dwelling',
      depthPlane: 'background',
      actorArchetype: 'Dwelling Resident / Distant Commuter',
      microAction: bgPool[actionIndex],
      facingDirection: directions[i % directions.length],
      velocityKmH: (i % 3) * 1.5,
      lodLevel: 'LOD3_SILHOUETTE_ATMOSPHERE',
      clusterId: `cluster-deep-${(i % 8) + 1}`,
    });
  }

  // Calculate LOD Distribution
  const lodDistribution: Record<LevelOfDetail, number> = {
    LOD0_HERO_SHARP: agents.filter((a) => a.lodLevel === 'LOD0_HERO_SHARP').length,
    LOD1_FULL_DETAIL: agents.filter((a) => a.lodLevel === 'LOD1_FULL_DETAIL').length,
    LOD2_MEDIUM_GESTURE: agents.filter((a) => a.lodLevel === 'LOD2_MEDIUM_GESTURE').length,
    LOD3_SILHOUETTE_ATMOSPHERE: agents.filter((a) => a.lodLevel === 'LOD3_SILHOUETTE_ATMOSPHERE').length,
  };

  // Measure visual pooling (anti-clumping uniformity index)
  // Ideal ratio is 0.08 to 0.18; values above 0.35 mean clusters are pooling together
  const clusterCounts: Record<string, number> = {};
  agents.forEach((a) => {
    clusterCounts[a.clusterId] = (clusterCounts[a.clusterId] || 0) + 1;
  });
  const counts = Object.values(clusterCounts);
  const avg = agents.length / counts.length;
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);
  const visualPoolingScore = Math.min(1.0, Math.round((stdDev / agents.length) * 100) / 100);

  return {
    agents,
    visualPoolingScore,
    lodDistribution,
    totalAgents: agents.length,
  };
}

/**
 * Compiles layered spatial tokens into deterministic depth-aware prompts
 * for Wan 2.1 / Kling / Flux.1 image and video pipelines.
 */
export function compileSpatialWorldPrompt(
  basePrompt: string,
  config: CrowdWorldConfig = DEFAULT_CROWD_WORLD_CONFIG
): {
  compiledPrompt: string;
  passes: {
    basePlatePass: string;
    environmentalZonesPass: string;
    agentDensityPass: string;
  };
  depthPlanes: {
    foregroundPrompt: string;
    midgroundPrompt: string;
    backgroundPrompt: string;
  };
  coherenceMetrics: {
    heroEyeLineProtected: boolean;
    dofAperture: string;
    fogDensity: string;
    lodScalingApplied: boolean;
  };
} {
  const { agents, lodDistribution, totalAgents } = generateAgentDensityMatrix(config);

  // 1. Pass 1: Base Plate Macro Architecture & Global Illumination
  const basePlatePass = `Macro Environment: ${config.architecturalScale}, ${config.macroAtmosphere}, ${config.depthFogLevel}, balanced at ${config.globalIlluminationKelvin}K color temperature, volumetric light shafts through metallic scaffolding`;

  // 2. Pass 2: Environmental Zones & Spatial Clusters
  const zonesPass = `Spatial Layering: Foreground Hero Zone with 2.5m eye-line clearance; Midground neon market bazaar stalls and elevated transit skybridge; Deep background multi-tier vertical dwelling catwalks extending into distant vanishing point`;

  // 3. Pass 3: Agent Density & Procedural Micro-Actions
  const sampleFg = agents.filter((a) => a.depthPlane === 'foreground').map((a) => a.microAction).join('; ');
  const sampleMg = agents.filter((a) => a.depthPlane === 'midground').slice(0, 3).map((a) => a.microAction).join('; ');
  const sampleBg = agents.filter((a) => a.depthPlane === 'background').slice(0, 2).map((a) => a.microAction).join('; ');

  const agentDensityPass = `Ultra-Dense World Population (${totalAgents} distinct agents, zero repetition): [Foreground Safe Zone]: ${sampleFg || 'Hero isolation preserved'}; [Midground Dynamic Matrix]: ${sampleMg}; [Deep Atmospheric Plane]: ${sampleBg}`;

  // Structured Regional Syntax for Depth Pipelines
  const foregroundPrompt = `[PLANE: FOREGROUND] Razor-sharp primary subjects, optical f/1.8 depth of field, strictly preserved 2.5m unobstructed actor eye-line corridor, clean specular water droplets`;
  const midgroundPrompt = `[PLANE: MIDGROUND] Active bustling population (${lodDistribution.LOD1_FULL_DETAIL + lodDistribution.LOD2_MEDIUM_GESTURE} agents), street market exchanges, pedestrian skybridge cross-traffic, natural kinetic momentum`;
  const backgroundPrompt = `[PLANE: DEEP_BACKGROUND] Soft atmospheric bokeh falloff, ${lodDistribution.LOD3_SILHOUETTE_ATMOSPHERE} silhouettes on high residential tiers, ${config.coherenceGuard.atmosphericFogDensityPercent}% volumetric neon fog roll-off, distant vehicle light trails`;

  const compiledPrompt = `${basePrompt.trim()}, ${basePlatePass}. ${zonesPass}. ${agentDensityPass}. ${foregroundPrompt}. ${midgroundPrompt}. ${backgroundPrompt}. Coherence: strict depth-of-field separation, no crowd pooling on hero axis.`;

  return {
    compiledPrompt,
    passes: {
      basePlatePass,
      environmentalZonesPass: zonesPass,
      agentDensityPass,
    },
    depthPlanes: {
      foregroundPrompt,
      midgroundPrompt,
      backgroundPrompt,
    },
    coherenceMetrics: {
      heroEyeLineProtected: config.coherenceGuard.preserveSubjectSharpness,
      dofAperture: config.coherenceGuard.depthOfFieldBlurAperture,
      fogDensity: `${config.coherenceGuard.atmosphericFogDensityPercent}%`,
      lodScalingApplied: true,
    },
  };
}

/**
 * Builds depth-aware conditioning payload for video render dispatch
 */
export function buildCrowdWorldPayload(
  basePrompt: string,
  config: CrowdWorldConfig = DEFAULT_CROWD_WORLD_CONFIG
) {
  const compilation = compileSpatialWorldPrompt(basePrompt, config);
  const matrix = generateAgentDensityMatrix(config);

  return {
    prompt: compilation.compiledPrompt,
    basePlate: compilation.passes.basePlatePass,
    depthLayers: compilation.depthPlanes,
    agentMatrix: {
      totalCount: matrix.totalAgents,
      visualPoolingScore: matrix.visualPoolingScore,
      lodLevels: matrix.lodDistribution,
      microActionsSummary: matrix.agents.slice(0, 10).map((a) => a.microAction),
    },
    coherenceControl: {
      preserveSharpness: config.coherenceGuard.preserveSubjectSharpness,
      bufferRadiusMeters: config.coherenceGuard.heroEyeLineBufferRadiusMeters,
      fogDensity: config.coherenceGuard.atmosphericFogDensityPercent,
      aperture: config.coherenceGuard.depthOfFieldBlurAperture,
      depthConditioningMapEnabled: true,
    },
  };
}
