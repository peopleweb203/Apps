/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CineForge AI: Virtual Multi-Camera Rig
 * Synchronizes 3-camera coverage (A-Cam Master 24mm, B-Cam Medium 50mm, C-Cam Close-Up 85mm)
 * with unified world spatial coordinates, synchronized lighting, and matching timecode cuts.
 */

export type CameraId = 'cam_a' | 'cam_b' | 'cam_c';

export interface SynchronizedCameraAngle {
  id: CameraId;
  label: string;
  role: 'Master Establishing' | 'Medium Dialogue / Two-Shot' | 'Hero Eye-Line Close-Up';
  focalLengthMm: 24 | 50 | 85;
  aperture: string;
  sensorFormat: 'Arri Alexa 65 Large Format' | 'Panavision 35mm Anamorphic' | 'Red V-Raptor 8K';
  spatialCoordinate: { x: number; y: number; elevationMeters: number; angleDegrees: number };
  activeTakeUrl: string;
  isSynced: boolean;
  timecodeStart: string;
}

export interface MultiCamCoverageTake {
  takeId: string;
  sceneId: string;
  shotNumber: number;
  syncTimestamp: string;
  sharedWorldSeed: number;
  lightingKelvin: number;
  cameras: Record<CameraId, SynchronizedCameraAngle>;
}

export const DEFAULT_MULTICAM_RIG: Record<CameraId, SynchronizedCameraAngle> = {
  cam_a: {
    id: 'cam_a',
    label: 'A-CAM (MASTER)',
    role: 'Master Establishing',
    focalLengthMm: 24,
    aperture: 'f/2.8',
    sensorFormat: 'Arri Alexa 65 Large Format',
    spatialCoordinate: { x: 50, y: 80, elevationMeters: 1.4, angleDegrees: 0 },
    activeTakeUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    isSynced: true,
    timecodeStart: '01:00:14:00',
  },
  cam_b: {
    id: 'cam_b',
    label: 'B-CAM (MEDIUM)',
    role: 'Medium Dialogue / Two-Shot',
    focalLengthMm: 50,
    aperture: 'f/2.0',
    sensorFormat: 'Panavision 35mm Anamorphic',
    spatialCoordinate: { x: 38, y: 65, elevationMeters: 1.5, angleDegrees: 28 },
    activeTakeUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    isSynced: true,
    timecodeStart: '01:00:14:00',
  },
  cam_c: {
    id: 'cam_c',
    label: 'C-CAM (TIGHT CU)',
    role: 'Hero Eye-Line Close-Up',
    focalLengthMm: 85,
    aperture: 'f/1.8',
    sensorFormat: 'Panavision 35mm Anamorphic',
    spatialCoordinate: { x: 62, y: 55, elevationMeters: 1.6, angleDegrees: -25 },
    activeTakeUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    isSynced: true,
    timecodeStart: '01:00:14:00',
  },
};

/**
 * Builds synchronized multi-cam coverage package
 */
export function buildMultiCamCoverage(
  sceneId: string,
  shotNumber: number,
  baseWorldSeed: number = 748192
): MultiCamCoverageTake {
  return {
    takeId: `take-multicam-${Date.now()}`,
    sceneId,
    shotNumber,
    syncTimestamp: new Date().toISOString(),
    sharedWorldSeed: baseWorldSeed,
    lightingKelvin: 4200,
    cameras: { ...DEFAULT_MULTICAM_RIG },
  };
}
