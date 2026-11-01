import { Point2D, LensType, AxisAnalysis } from '../utils/stage-math';
import { SubtitleCue, SubtitleStyle, TimelineClip } from '../utils/timeline-engine';

export type StudioTab =
  | 'writers-room'
  | 'casting-sets'
  | 'crowd-world'
  | 'continuity'
  | 'multicam'
  | 'combat'
  | 'morphology'
  | 'spatial-audio'
  | 'orchestral-score'
  | 'lifestyle'
  | 'hollywood-setpiece'
  | 'dmx-lighting'
  | 'keyframe-staging'
  | 'motion-performance'
  | 'cinematography'
  | 'timeline'
  | 'youtube-publisher'
  | 'analytics'
  | 'self-healing';

export interface CharacterProfile {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Non-Binary';
  age: number;
  role: string;
  signatureWardrobe: string;
  voiceId: string;
  voiceName: string;
  voiceSampleUrl?: string;
  voiceSampleText: string;
  faceReferences: {
    front: string;
    threeQuarterLeft: string;
    threeQuarterRight: string;
    profile: string;
    highAngle: string;
  };
  customTags?: string[];
  moodOverride?: string;
  outfitStyleOverride?: string;
  roleCategoryOverride?: string;
}

export interface SetLockerPlate {
  id: string;
  name: string;
  description: string;
  plateImageUrl: string;
  lightingKelvin: number;
  atmosphere: string;
  recommendedLens: LensType;
  spatialTags: string[];
}

export interface DirectorsCutMetadata {
  directorName: string;
  shootingDate: string;
  iso: number;
  focalLength: string;
  colorGradeProfile: string;
}

export interface ShotItem {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotType: 'WIDE ESTABLISHING' | 'MEDIUM OVER-SHOULDER' | 'CLOSE-UP PROFILE' | 'DUTCH ANGLE' | 'POV';
  focalLength: LensType;
  characterAId?: string;
  characterBId?: string;
  cameraAction: string;
  durationSec: number;
  dialogue?: string;
  speakerId?: string;
  stillPrompt: string;
  ipAdapterWeight: number; // 0.0 to 1.0 (Face consistency lock)
  approvedKeyframeUrl?: string;
  keyframeStatus: 'PENDING' | 'STAGED' | 'APPROVED' | 'REJECTED';
  motionStatus: 'UNPROCESSED' | 'EXTRUDING' | 'READY';
  motionEngine: 'Wan 2.1 (Cinematic I2V)' | 'Kling 1.5 Pro' | 'Runway Gen-3';
  motionVector: {
    direction: 'DOLLY_IN' | 'DOLLY_OUT' | 'ORBIT_LEFT' | 'ORBIT_RIGHT' | 'CRANE_UP' | 'PAN_RIGHT';
    intensity: number; // 1 to 10
  };
  lipSyncStatus: 'BYPASS' | 'PROCESSING' | 'ALIGNED';
  videoClipUrl?: string;
  directorsCut?: DirectorsCutMetadata;
}

export interface SceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  locationId: string;
  timeOfDay: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'INTERIOR_STUDIO';
  lightingKelvin: number;
  atmosphere: string;
  screenplayNotes: string;
  shots: ShotItem[];
}

export interface FoleyTrack {
  id: string;
  name: string;
  category: 'RAIN_GLASS' | 'SERVER_HUM' | 'CYBER_TRAFFIC' | 'SCI_FI_DRONE' | 'ANALOG_PROJECTOR';
  volume: number; // 0 to 1
  reverbPreset: 'WAREHOUSE' | 'OFFICE' | 'IN_VEHICLE' | 'CATHEDRAL' | 'STUDIO';
  isActive: boolean;
}

export interface RenderTask {
  id: string;
  type: 'KEYFRAME_STAGING' | 'MOTION_EXTRUSION' | 'LIP_SYNC' | '4K_EXPORT';
  title: string;
  progress: number; // 0 to 100
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  sceneId?: string;
  sceneNumber?: number;
  sceneTitle?: string;
  shotCount?: number;
  stageLabel?: string;
  thumbnailUrl?: string;
  shotThumbnails?: string[];
  presetName?: string;
  resolution?: string;
  bitrateMbps?: number;
  exportFormat?: string;
  directorsCutMetadata?: DirectorsCutMetadata[];
  directorsCutSidecarFilename?: string;
  directorsCutSidecarJson?: string;
}

export interface ThumbnailVariant {
  id: string;
  keyframeUrl: string;
  overlayText: string;
  subText: string;
  badge: string;
  ctrScore: number; // e.g. 9.4%
  colorStyle: 'AMBER_PUNCH' | 'NEON_CYAN' | 'EMERGENCY_RED';
}
