/**
 * Universal Hollywood Blockbuster Setpiece, Extreme Physics & VFX Stunt Engine
 * Simulates superhuman kinetic mass, high-altitude flight dynamics, ballistic mid-air intercepts,
 * extreme rooftop verticality, and cinematic physics sentinels for enterprise film production.
 */

export type SetpieceArchetype =
  | 'superhuman-mass-throw'
  | 'supersonic-flight-entry'
  | 'ballistic-midair-intercept'
  | 'skyscraper-rooftop-vertigo'
  | 'urban-armored-destruction'
  | 'aerial-dogfight-canyon';

export type CameraStuntPreset =
  | 'extreme-low-angle-ground-slam'
  | 'vertigo-pitch-down-precipice'
  | 'orbit-360-bullet-stunt'
  | 'high-speed-missile-chase'
  | 'superhero-three-point-landing-push';

export interface StuntKeyframeEvent {
  id: string;
  timestampSec: number;
  durationSec: number;
  actorAction: string;
  heavyObjectPhysics: {
    objectName: string;
    massKg: number;
    initialVelocityMs: number;
    trajectoryArc: 'parabolic-toss' | 'horizontal-bullet' | 'terminal-freefall' | 'stationary-impact';
    impactDamage: string;
  };
  incomingProjectile?: {
    type: 'RPG-7 Rocket' | 'AIM-9X Sidewinder' | 'Kinetic Depleted Uranium Slug' | 'Energy Plasma Bolt';
    velocityMach: number;
    interceptTarget: string;
  };
  explosionVFX?: {
    bloomType: 'two-stage-fuel-fireball' | 'shockwave-air-distortion' | 'concussive-dust-ejecta' | 'electrical-arc-burst';
    radiusMeters: number;
    shrapnelDensity: 'extreme' | 'high' | 'moderate';
    smokeVolumetrics: string;
  };
  cameraMovement: string;
}

export interface BlockbusterSetpiecePlan {
  id: string;
  name: string;
  archetype: SetpieceArchetype;
  description: string;
  cameraPreset: CameraStuntPreset;
  heroCharacterId: string;
  totalDurationSec: number;
  spectacleMasterActive: boolean;
  timelineEvents: StuntKeyframeEvent[];
  physicsParameters: {
    gravityMs2: number; // default 9.81
    kineticEnergyMegajoules: number;
    dragCoefficient: number;
    groundImpactDepthCm: number;
    vaporConePresent: boolean;
  };
  promptTokens: {
    visualActionPrompt: string;
    cameraOpticsPrompt: string;
    vfxDebrisPrompt: string;
    lightingAtmospherePrompt: string;
    negativeExclusions: string[];
  };
}

export interface PhysicsValidationReport {
  isPhysicsPlausible: boolean;
  floatyCgiDetected: boolean;
  gravityScore: number; // 0-100
  momentumConservationValid: boolean;
  recommendations: string[];
}

// -------------------------------------------------------------
// ARCHETYPE PRESETS & CATALOG
// -------------------------------------------------------------

export const SETPIECE_CATALOG: Array<{
  archetype: SetpieceArchetype;
  title: string;
  summary: string;
  defaultDuration: number;
  defaultEvents: StuntKeyframeEvent[];
  defaultCamera: CameraStuntPreset;
}> = [
  {
    archetype: 'superhuman-mass-throw',
    title: 'Superhuman Vehicle Hurling & Mid-Air Intercept',
    summary: 'Hero heaves a 3,800kg armored vehicle overhead and hurls it across an urban intersection, colliding with an incoming aerial rocket.',
    defaultDuration: 5.0,
    defaultCamera: 'extreme-low-angle-ground-slam',
    defaultEvents: [
      {
        id: 'evt-1',
        timestampSec: 0.0,
        durationSec: 1.2,
        actorAction: 'Hero digs boots into asphalt, lifting 3,800kg armored SUV overhead with muscular tension',
        heavyObjectPhysics: {
          objectName: 'Armored Tactical SUV',
          massKg: 3800,
          initialVelocityMs: 0,
          trajectoryArc: 'parabolic-toss',
          impactDamage: 'Asphalt buckling under foot pressure, radial ground cracks',
        },
        cameraMovement: 'Extreme low-angle tilt-up, camera shaking violently as vehicle leaves the pavement',
      },
      {
        id: 'evt-2',
        timestampSec: 1.2,
        durationSec: 1.2,
        actorAction: 'Rotational hip twist unleashing vehicle into skyward parabolic arc at 45 m/s',
        heavyObjectPhysics: {
          objectName: 'Armored Tactical SUV',
          massKg: 3800,
          initialVelocityMs: 45,
          trajectoryArc: 'parabolic-toss',
          impactDamage: 'Air displacement shearing streetlamps',
        },
        incomingProjectile: {
          type: 'AIM-9X Sidewinder',
          velocityMach: 2.5,
          interceptTarget: 'Armored Tactical SUV',
        },
        cameraMovement: 'Fast pan tracking vehicle climbing into skyline, tracking incoming white missile smoke contrail',
      },
      {
        id: 'evt-3',
        timestampSec: 2.4,
        durationSec: 1.2,
        actorAction: 'Hero tracks trajectory mid-air while preparing evasive brace posture',
        heavyObjectPhysics: {
          objectName: 'Detonating Vehicle Shrapnel',
          massKg: 3800,
          initialVelocityMs: 15,
          trajectoryArc: 'terminal-freefall',
          impactDamage: 'Catastrophic mid-air frame disintegration, blazing engine block plummeting',
        },
        explosionVFX: {
          bloomType: 'two-stage-fuel-fireball',
          radiusMeters: 18,
          shrapnelDensity: 'extreme',
          smokeVolumetrics: 'Dense black petroleum fireball mushrooming with orange rim illumination and supersonic shockwave ripple in atmosphere',
        },
        cameraMovement: 'High-speed snap-zoom on fireball detonation, chromatic optical blowout on frame edges',
      },
      {
        id: 'evt-4',
        timestampSec: 3.6,
        durationSec: 1.4,
        actorAction: 'Hero absorbs descending flaming debris and drops into 3-point concrete superhero landing',
        heavyObjectPhysics: {
          objectName: 'Cratering Ground Impact',
          massKg: 85,
          initialVelocityMs: 22,
          trajectoryArc: 'terminal-freefall',
          impactDamage: 'Concrete crater with 2.5m diameter, dust shockwave ring radiating outward',
        },
        cameraMovement: 'Whip-pan down to pavement, ground-level lens catching falling cinder embers and billowing dust plume',
      },
    ],
  },
  {
    archetype: 'skyscraper-rooftop-vertigo',
    title: 'Skyscraper Parapet Vertigo Combat & Freefall',
    summary: 'High-altitude martial combat on a 60-story rooftop ledge, culminating in a backward free-fall grappling recovery.',
    defaultDuration: 4.5,
    defaultCamera: 'vertigo-pitch-down-precipice',
    defaultEvents: [
      {
        id: 'rf-1',
        timestampSec: 0.0,
        durationSec: 1.5,
        actorAction: 'Close-quarters martial arts exchange on narrow 40cm granite parapet edge overlooking dizzying neon abyss',
        heavyObjectPhysics: {
          objectName: 'Shattered Architectural Coping',
          massKg: 120,
          initialVelocityMs: 5,
          trajectoryArc: 'terminal-freefall',
          impactDamage: 'Stone chips plummeting into 500m void',
        },
        cameraMovement: 'Vertigo pitch-down directly over the edge, rolling 90-degree axis revealing infinite cityscape below',
      },
      {
        id: 'rf-2',
        timestampSec: 1.5,
        durationSec: 1.5,
        actorAction: 'Protagonist kicks adversary backward and leaps into open airspace in controlled backwards free-fall',
        heavyObjectPhysics: {
          objectName: 'Human Body Terminal Drag',
          massKg: 78,
          initialVelocityMs: 28,
          trajectoryArc: 'terminal-freefall',
          impactDamage: 'Air shear rippling clothes and hair at 100 km/h',
        },
        cameraMovement: '360-degree rotational dive camera falling alongside the hero, maintaining eye contact amidst vertigo clouds',
      },
      {
        id: 'rf-3',
        timestampSec: 3.0,
        durationSec: 1.5,
        actorAction: 'Fires high-tensile carbon grapple line into skyscraper glass mullion, pendulum swing swinging into floor 42',
        heavyObjectPhysics: {
          objectName: 'Grapple Cable & Glass Facade',
          massKg: 400,
          initialVelocityMs: 18,
          trajectoryArc: 'parabolic-toss',
          impactDamage: 'Reinforced architectural curtain-wall glass bursting into 10,000 diamond-shards',
        },
        cameraMovement: 'Push-through camera bursting through glass window frame with crystal particle refractions',
      },
    ],
  },
  {
    archetype: 'supersonic-flight-entry',
    title: 'Mach 3 Atmospheric Re-Entry & Crater Impact',
    summary: 'Sub-orbital supersonic hero descents cutting through storm clouds with condensation cone vapor and sonic boom.',
    defaultDuration: 4.0,
    defaultCamera: 'high-speed-missile-chase',
    defaultEvents: [
      {
        id: 'fl-1',
        timestampSec: 0.0,
        durationSec: 1.5,
        actorAction: 'Supersonic flight through thunderhead anvil clouds, conical vapor condensation cone enveloping silhouette',
        heavyObjectPhysics: {
          objectName: 'Supersonic Streamlined Body',
          massKg: 85,
          initialVelocityMs: 1020, // Mach 3
          trajectoryArc: 'horizontal-bullet',
          impactDamage: 'Ionized atmospheric plasma sheath, clouds parting in spiral aerodynamic vortex',
        },
        cameraMovement: 'Dynamic chase follow-cam struggling to match speed, heavy wind buffeting lens shake',
      },
      {
        id: 'fl-2',
        timestampSec: 1.5,
        durationSec: 2.5,
        actorAction: 'Vertical deceleration vector plunging into urban plaza, sonic boom shockwave shattering storefront glass',
        heavyObjectPhysics: {
          objectName: 'Kinetic Ground Slam',
          massKg: 85,
          initialVelocityMs: 250,
          trajectoryArc: 'terminal-freefall',
          impactDamage: '5-meter wide seismic impact crater, pulverized granite tiles, radial atmospheric pressure ring',
        },
        explosionVFX: {
          bloomType: 'concussive-dust-ejecta',
          radiusMeters: 25,
          shrapnelDensity: 'high',
          smokeVolumetrics: 'Supersonic shockwave clearing all smoke in radial ring, followed by dense rising pulverized limestone dust',
        },
        cameraMovement: 'Ground-level worm-eye lens, camera jarring on seismic impact before rising as hero stands amidst billowing dust',
      },
    ],
  },
];

// -------------------------------------------------------------
// PHYSICS VALIDATOR & SENTINEL
// -------------------------------------------------------------

export function validateSetpiecePhysics(plan: BlockbusterSetpiecePlan): PhysicsValidationReport {
  const recommendations: string[] = [];
  let floatyCgiDetected = false;
  let gravityScore = 100;
  let momentumValid = true;

  // Check 1: Realistic heavy mass acceleration
  plan.timelineEvents.forEach((evt, idx) => {
    const mass = evt.heavyObjectPhysics.massKg;
    const velocity = evt.heavyObjectPhysics.initialVelocityMs;

    if (mass > 2000 && velocity >= 40 && plan.physicsParameters.kineticEnergyMegajoules < 5.0) {
      floatyCgiDetected = true;
      gravityScore -= 25;
      recommendations.push(
        `Event #${idx + 1} (${evt.heavyObjectPhysics.objectName}): A ${mass}kg vehicle thrown at ${velocity} m/s requires >5 MJ kinetic force to prevent floaty visual weight.`
      );
    }

    if (evt.heavyObjectPhysics.trajectoryArc === 'terminal-freefall' && evt.durationSec > 3.0 && !evt.heavyObjectPhysics.impactDamage) {
      gravityScore -= 15;
      recommendations.push(`Event #${idx + 1}: Freefall duration of ${evt.durationSec}s requires concrete impact or decelerator cable.`);
    }
  });

  // Check 2: Explosion bloom sync
  const explosionEvents = plan.timelineEvents.filter((e) => e.explosionVFX);
  if (explosionEvents.length > 0 && !plan.timelineEvents.some((e) => e.incomingProjectile || e.heavyObjectPhysics.massKg > 1000)) {
    recommendations.push('Explosive detonations should be motivated by physical projectile collision or heavy vehicle fuel ignition.');
  }

  // Check 3: Camera shake enforcement
  const impactEvents = plan.timelineEvents.filter(
    (e) => e.heavyObjectPhysics.trajectoryArc === 'stationary-impact' || e.heavyObjectPhysics.impactDamage.includes('crater')
  );
  if (impactEvents.some((e) => !e.cameraMovement.toLowerCase().includes('shake') && !e.cameraMovement.toLowerCase().includes('jarring'))) {
    recommendations.push('Add violent physical camera shake to impact keyframes to convey heavy ground kinetic shock.');
  }

  const isPhysicsPlausible = gravityScore >= 70 && !floatyCgiDetected;

  return {
    isPhysicsPlausible,
    floatyCgiDetected,
    gravityScore: Math.max(0, gravityScore),
    momentumConservationValid: momentumValid,
    recommendations,
  };
}

// -------------------------------------------------------------
// PROMPT COMPILER
// -------------------------------------------------------------

export function compileHollywoodSetpiece(
  archetype: SetpieceArchetype,
  heroCharacterName: string = 'Elena Cross',
  customCamera?: CameraStuntPreset,
  enableSpectacleMaster: boolean = true
): BlockbusterSetpiecePlan {
  const catalogItem = SETPIECE_CATALOG.find((c) => c.archetype === archetype) || SETPIECE_CATALOG[0];

  const cameraPreset = customCamera || catalogItem.defaultCamera;

  // Build events
  const timelineEvents: StuntKeyframeEvent[] = catalogItem.defaultEvents.map((evt) => ({
    ...evt,
    actorAction: evt.actorAction.replace(/Hero|Protagonist/g, heroCharacterName),
  }));

  // Visual prompt synthesis
  const actionSummary = timelineEvents.map((e) => `[T+${e.timestampSec.toFixed(1)}s: ${e.actorAction}]`).join(' -> ');

  const cameraOptics =
    cameraPreset === 'extreme-low-angle-ground-slam'
      ? 'Panavision 17mm ultra-wide anamorphic lens, ground-skimming low-angle tilt, visceral camera shake with dirt particles hitting front optical element'
      : cameraPreset === 'vertigo-pitch-down-precipice'
      ? 'Arri Alexa 65 24mm anamorphic, dizzying 90-degree pitch-down over skyscraper edge with rolling 3D axis and vertigo depth blur'
      : cameraPreset === 'orbit-360-bullet-stunt'
      ? '360-degree seamless orbital camera track sweeping around airborne subjects at 120fps high-speed capture'
      : cameraPreset === 'high-speed-missile-chase'
      ? 'Telephoto 85mm follow-cam tracking supersonic projectile with aerodynamic heat shimmer and transonic vapor cone'
      : 'Panavision 35mm smooth crane descending into 3-point hero landing';

  const vfxDebris = enableSpectacleMaster
    ? 'Photorealistic volumetric pyroclastic fireball, dual-stage fuel ignition bloom, supersonic shockwave air distortion ripple, thousands of high-velocity concrete chunks and flying glass shards with ray-traced reflections, heavy realistic downward debris gravity'
    : 'Cinematic explosion plume with dust shockwave and concrete fragment scatter';

  const lightingAtmosphere =
    'Chiaroscuro rim lighting from rolling fireballs, atmospheric ember sparks, volumetric smoke plumes slicing through sunlight or neon skyline, Kodak Vision3 500T film color grading with deep shadow roll-off';

  const negativeExclusions = [
    'floaty physics',
    'weightless CGI cartoon bodies',
    'flat 2D stock explosions',
    'plastic untextured vehicles',
    'rubber ragdoll animation',
    'smooth clean pavement without cracks',
    'teleporting camera jumps',
  ];

  return {
    id: `setpiece-${Date.now()}`,
    name: catalogItem.title,
    archetype,
    description: catalogItem.summary,
    cameraPreset,
    heroCharacterId: heroCharacterName,
    totalDurationSec: catalogItem.defaultDuration,
    spectacleMasterActive: enableSpectacleMaster,
    timelineEvents,
    physicsParameters: {
      gravityMs2: 9.81,
      kineticEnergyMegajoules: archetype === 'superhuman-mass-throw' ? 8.4 : 14.2,
      dragCoefficient: 0.38,
      groundImpactDepthCm: 18.5,
      vaporConePresent: archetype === 'supersonic-flight-entry',
    },
    promptTokens: {
      visualActionPrompt: actionSummary,
      cameraOpticsPrompt: cameraOptics,
      vfxDebrisPrompt: vfxDebris,
      lightingAtmospherePrompt: lightingAtmosphere,
      negativeExclusions,
    },
  };
}

/**
 * Merges the Hollywood setpiece tokens into an active video generation prompt.
 */
export function injectHollywoodSetpiecePrompt(basePrompt: string, plan: BlockbusterSetpiecePlan): string {
  const cleanBase = basePrompt.trim().replace(/\.$/, '');
  const spectacleTokens = [
    `[BLOCKBUSTER_ACTION: ${plan.archetype.toUpperCase()}]`,
    plan.promptTokens.visualActionPrompt,
    `Camera Optics: ${plan.promptTokens.cameraOpticsPrompt}`,
    `Physics & VFX: ${plan.promptTokens.vfxDebrisPrompt}`,
    `Atmosphere: ${plan.promptTokens.lightingAtmospherePrompt}`,
  ].join('. ');

  return `${cleanBase}. ${spectacleTokens}.`;
}
