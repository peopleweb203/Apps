/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Cinematic Combat & Matrix Action Engine
 * High-impact choreography, bullet-time 360° orbits, speed ramping (120fps to 24fps),
 * 90-degree action shutter, and Wire-Fu anti-gravity physics.
 */

export type MartialArtsDiscipline = 'Wire-Fu Cinematic' | 'Wushu Aerial Staff' | 'Gracie Jiu-Jitsu CQC' | 'Cybernetic Boxing' | 'Krav Maga Disarm';

export type CombatMoveId =
  | 'superman_punch'
  | 'aerial_360_sweep'
  | 'wall_run_rebound'
  | 'projectile_bullet_evasion'
  | 'disarm_joint_lock'
  | 'wire_fu_flying_kick';

export interface CombatChoreographyMove {
  id: CombatMoveId;
  name: string;
  discipline: MartialArtsDiscipline;
  impactPhysics: 'shockwave_condensation' | 'concrete_shatter_debris' | 'rain_droplet_implosion' | 'kinetic_sparks';
  hangTimeSeconds: number; // e.g. 1.8s
  strikeTrajectory: string;
  speedRampCadence: {
    windUpFps: 24;
    strikeApexFps: 120; // slow-motion impact freeze
    recoveryFps: 36;
  };
  wireFuAntiGravity: boolean;
  shutterAngleDegrees: 90 | 180 | 45;
}

export interface BulletTimeOrbitConfig {
  active: boolean;
  orbitRadiusMeters: number; // 1.5 to 6.0m
  rotationDegrees: number; // 360°
  sweepDurationSec: number; // 0.8 to 3.0s
  cameraElevation: number; // 1.2m
  freezeVectorIntensity: number; // 0.0 (frozen) to 1.0 (moving)
}

export interface CombatEngineConfig {
  discipline: MartialArtsDiscipline;
  selectedMove: CombatMoveId;
  bulletTime: BulletTimeOrbitConfig;
  enforceMatrixShutter: boolean; // 90° shutter speed
  speedRampingActive: boolean;
  microImpactShakeDecibels: number; // -12 to 0 dB
  debrisPhysicsEnabled: boolean;
}

export const COMBAT_MOVES_LIBRARY: Record<CombatMoveId, CombatChoreographyMove> = {
  superman_punch: {
    id: 'superman_punch',
    name: 'Horizontal Propulsion Superman Strike',
    discipline: 'Cybernetic Boxing',
    impactPhysics: 'kinetic_sparks',
    hangTimeSeconds: 0.9,
    strikeTrajectory: 'Linear horizontal thrust off rear wall with right titanium fist lead',
    speedRampCadence: { windUpFps: 24, strikeApexFps: 120, recoveryFps: 36 },
    wireFuAntiGravity: false,
    shutterAngleDegrees: 90,
  },
  aerial_360_sweep: {
    id: 'aerial_360_sweep',
    name: '360° Horizontal Aerial Crescent Kick',
    discipline: 'Wushu Aerial Staff',
    impactPhysics: 'rain_droplet_implosion',
    hangTimeSeconds: 1.6,
    strikeTrajectory: 'Helicopter torque spin 1.8m above wet pavement catching secondary opponent',
    speedRampCadence: { windUpFps: 24, strikeApexFps: 120, recoveryFps: 36 },
    wireFuAntiGravity: true,
    shutterAngleDegrees: 90,
  },
  wall_run_rebound: {
    id: 'wall_run_rebound',
    name: 'Three-Step Vertical Wall Run & Inverted Drop',
    discipline: 'Wire-Fu Cinematic',
    impactPhysics: 'concrete_shatter_debris',
    hangTimeSeconds: 2.1,
    strikeTrajectory: 'Three vertical footsteps up brick wall, backflip release landing behind attacker',
    speedRampCadence: { windUpFps: 24, strikeApexFps: 120, recoveryFps: 36 },
    wireFuAntiGravity: true,
    shutterAngleDegrees: 90,
  },
  projectile_bullet_evasion: {
    id: 'projectile_bullet_evasion',
    name: 'Matrix Limbo Bullet Evasion with Circular Orbit',
    discipline: 'Wire-Fu Cinematic',
    impactPhysics: 'shockwave_condensation',
    hangTimeSeconds: 2.4,
    strikeTrajectory: 'Torso arched backward 75 degrees parallel to floor, sonic projectile vapor cone passing 2cm overhead',
    speedRampCadence: { windUpFps: 24, strikeApexFps: 120, recoveryFps: 36 },
    wireFuAntiGravity: true,
    shutterAngleDegrees: 90,
  },
  disarm_joint_lock: {
    id: 'disarm_joint_lock',
    name: 'Radial Wrist Hyper-Extension & Terminal Strip',
    discipline: 'Gracie Jiu-Jitsu CQC',
    impactPhysics: 'kinetic_sparks',
    hangTimeSeconds: 0.4,
    strikeTrajectory: 'Two-hand rotational wrist lock stripping pulse rifle onto steel catwalk',
    speedRampCadence: { windUpFps: 24, strikeApexFps: 120, recoveryFps: 36 },
    wireFuAntiGravity: false,
    shutterAngleDegrees: 90,
  },
  wire_fu_flying_kick: {
    id: 'wire_fu_flying_kick',
    name: 'Defiance Aerial Wire-Fu Flying Kick',
    discipline: 'Wire-Fu Cinematic',
    impactPhysics: 'shockwave_condensation',
    hangTimeSeconds: 2.2,
    strikeTrajectory: 'Horizontal flight across 5-meter alleyway gap with leading right combat boot',
    speedRampCadence: { windUpFps: 24, strikeApexFps: 120, recoveryFps: 36 },
    wireFuAntiGravity: true,
    shutterAngleDegrees: 90,
  },
};

export const DEFAULT_COMBAT_CONFIG: CombatEngineConfig = {
  discipline: 'Wire-Fu Cinematic',
  selectedMove: 'projectile_bullet_evasion',
  bulletTime: {
    active: true,
    orbitRadiusMeters: 2.8,
    rotationDegrees: 360,
    sweepDurationSec: 1.4,
    cameraElevation: 1.3,
    freezeVectorIntensity: 0.05,
  },
  enforceMatrixShutter: true,
  speedRampingActive: true,
  microImpactShakeDecibels: -4.5,
  debrisPhysicsEnabled: true,
};

/**
 * Compiles combat choreography prompt & render metadata
 */
export function compileCombatActionPrompt(
  basePrompt: string,
  config: CombatEngineConfig = DEFAULT_COMBAT_CONFIG
) {
  const move = COMBAT_MOVES_LIBRARY[config.selectedMove] || COMBAT_MOVES_LIBRARY.projectile_bullet_evasion;

  const shutterTag = config.enforceMatrixShutter
    ? '90-degree crisp action shutter angle, zero motion smear on impact point'
    : '180-degree natural motion cadence';

  const bulletTimeTag = config.bulletTime.active
    ? `Matrix bullet-time 360-degree orbital sweep (${config.bulletTime.sweepDurationSec}s circular arc at ${config.bulletTime.orbitRadiusMeters}m radius), character velocity frozen at apex`
    : 'forward camera tracking dolly';

  const speedRampTag = config.speedRampingActive
    ? `speed-ramp curve: 24fps wind-up exploding into 120fps ultra-slow motion impact freeze for ${move.hangTimeSeconds}s, snapping back to 36fps recovery`
    : 'standard 24fps real-time cadence';

  const physicsTag = `${move.impactPhysics.replace(/_/g, ' ')} with directional kinetic particle spray`;

  const combatPrompt = `${basePrompt.trim()}. Action Choreography: ${move.name} (${move.discipline}). ${move.strikeTrajectory}. ${bulletTimeTag}. ${speedRampTag}. ${shutterTag}. Impact physics: ${physicsTag}. High-dynamic martial arts masterpiece.`;

  return {
    combatPrompt,
    moveDetails: move,
    shutterTag,
    bulletTimeTag,
    speedRampTag,
    technicalPayload: {
      shutterAngle: config.enforceMatrixShutter ? 90 : 180,
      apexSlowMoFps: 120,
      bulletTimeActive: config.bulletTime.active,
      cameraOrbitRadius: config.bulletTime.orbitRadiusMeters,
      hangTimeSec: move.hangTimeSeconds,
      impactShakeDb: config.microImpactShakeDecibels,
    },
  };
}
