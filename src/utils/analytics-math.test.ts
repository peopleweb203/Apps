import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScriptMetrics,
  calculateCharacterUsage,
  calculateProductionCompute,
  calculateLensDistribution,
} from './analytics-math';
import { SceneItem, CharacterProfile, ShotItem, RenderTask } from '../types';

test('calculateScriptMetrics correctly counts words and dialogue ratio', () => {
  const screenplay = 'INT. LAB - NIGHT\nElena holds the quantum drive.\nELENA\nWe only have two minutes.';
  const scenes: SceneItem[] = [
    {
      id: 's1',
      sceneNumber: 1,
      title: 'Scene 1',
      locationId: 'loc1',
      timeOfDay: 'NIGHT',
      lightingKelvin: 4000,
      atmosphere: 'Moody',
      screenplayNotes: '',
      shots: [
        {
          id: 'sh1',
          sceneId: 's1',
          shotNumber: 1,
          shotType: 'WIDE ESTABLISHING',
          focalLength: '35mm',
          cameraAction: '',
          durationSec: 5,
          dialogue: 'We only have two minutes.',
          speakerId: 'char-1',
          stillPrompt: '',
          ipAdapterWeight: 0.85,
          keyframeStatus: 'APPROVED',
          motionStatus: 'READY',
          motionEngine: 'Wan 2.1 (Cinematic I2V)',
          motionVector: { direction: 'DOLLY_IN', intensity: 3 },
          lipSyncStatus: 'ALIGNED',
        },
      ],
    },
  ];

  const metrics = calculateScriptMetrics(screenplay, scenes);
  assert.ok(metrics.totalWords > 0);
  assert.equal(metrics.dialogueWords, 5); // "We only have two minutes."
  assert.ok(metrics.dialogueRatio > 0 && metrics.dialogueRatio <= 100);
  assert.ok(metrics.estimatedReadingTimeSec > 0);
});

test('calculateCharacterUsage aggregates spoken words and lines correctly', () => {
  const characters: CharacterProfile[] = [
    {
      id: 'char-1',
      name: 'Elena Cross',
      gender: 'Female',
      age: 28,
      role: 'Protagonist',
      signatureWardrobe: '',
      voiceId: 'v1',
      voiceName: 'V1',
      voiceSampleText: '',
      faceReferences: { front: '', threeQuarterLeft: '', threeQuarterRight: '', profile: '', highAngle: '' },
    },
    {
      id: 'char-2',
      name: 'Director Chen',
      gender: 'Male',
      age: 54,
      role: 'Antagonist',
      signatureWardrobe: '',
      voiceId: 'v2',
      voiceName: 'V2',
      voiceSampleText: '',
      faceReferences: { front: '', threeQuarterLeft: '', threeQuarterRight: '', profile: '', highAngle: '' },
    },
  ];

  const scenes: SceneItem[] = [
    {
      id: 's1',
      sceneNumber: 1,
      title: 'Scene 1',
      locationId: 'loc1',
      timeOfDay: 'NIGHT',
      lightingKelvin: 4000,
      atmosphere: '',
      screenplayNotes: '',
      shots: [
        {
          id: 'sh1',
          sceneId: 's1',
          shotNumber: 1,
          shotType: 'MEDIUM OVER-SHOULDER',
          focalLength: '50mm',
          characterAId: 'char-1',
          characterBId: 'char-2',
          cameraAction: '',
          durationSec: 4,
          dialogue: 'You lied to us.',
          speakerId: 'char-1',
          stillPrompt: '',
          ipAdapterWeight: 0.9,
          keyframeStatus: 'APPROVED',
          motionStatus: 'READY',
          motionEngine: 'Wan 2.1 (Cinematic I2V)',
          motionVector: { direction: 'DOLLY_IN', intensity: 2 },
          lipSyncStatus: 'ALIGNED',
        },
      ],
    },
  ];

  const usage = calculateCharacterUsage(scenes, characters);
  const elena = usage.find((u) => u.characterId === 'char-1');
  const chen = usage.find((u) => u.characterId === 'char-2');

  assert.ok(elena);
  assert.equal(elena.linesCount, 1);
  assert.equal(elena.spokenWords, 4); // "You lied to us."
  assert.equal(elena.dialoguePercentage, 100);

  assert.ok(chen);
  assert.equal(chen.linesCount, 0);
  assert.equal(chen.spokenWords, 0);
});

test('calculateProductionCompute estimates runtime and cost savings', () => {
  const shots: ShotItem[] = [
    {
      id: 'sh1',
      sceneId: 's1',
      shotNumber: 1,
      shotType: 'WIDE ESTABLISHING',
      focalLength: '35mm',
      cameraAction: '',
      durationSec: 6,
      stillPrompt: '',
      ipAdapterWeight: 0.9,
      keyframeStatus: 'APPROVED',
      motionStatus: 'READY',
      motionEngine: 'Wan 2.1 (Cinematic I2V)',
      motionVector: { direction: 'DOLLY_IN', intensity: 2 },
      lipSyncStatus: 'ALIGNED',
    },
  ];

  const tasks: RenderTask[] = [
    { id: 't1', type: 'KEYFRAME_STAGING', title: 'Task 1', progress: 100, status: 'COMPLETED', startedAt: '' },
  ];

  const compute = calculateProductionCompute(shots, tasks);
  assert.equal(compute.totalRuntimeSec, 6);
  assert.equal(compute.completedTasksCount, 1);
  assert.ok(compute.totalGpuComputeTimeSec > 0);
  assert.ok(compute.twoStageCostSavingsUsd > 0);
});

test('calculateLensDistribution groups focal lengths accurately', () => {
  const shots: ShotItem[] = [
    { id: '1', sceneId: '', shotNumber: 1, shotType: 'WIDE ESTABLISHING', focalLength: '35mm', cameraAction: '', durationSec: 4, stillPrompt: '', ipAdapterWeight: 0.8, keyframeStatus: 'APPROVED', motionStatus: 'READY', motionEngine: 'Wan 2.1 (Cinematic I2V)', motionVector: { direction: 'DOLLY_IN', intensity: 2 }, lipSyncStatus: 'BYPASS' },
    { id: '2', sceneId: '', shotNumber: 2, shotType: 'CLOSE-UP PROFILE', focalLength: '85mm', cameraAction: '', durationSec: 4, stillPrompt: '', ipAdapterWeight: 0.8, keyframeStatus: 'APPROVED', motionStatus: 'READY', motionEngine: 'Wan 2.1 (Cinematic I2V)', motionVector: { direction: 'DOLLY_IN', intensity: 2 }, lipSyncStatus: 'BYPASS' },
    { id: '3', sceneId: '', shotNumber: 3, shotType: 'MEDIUM OVER-SHOULDER', focalLength: '35mm', cameraAction: '', durationSec: 4, stillPrompt: '', ipAdapterWeight: 0.8, keyframeStatus: 'APPROVED', motionStatus: 'READY', motionEngine: 'Wan 2.1 (Cinematic I2V)', motionVector: { direction: 'DOLLY_IN', intensity: 2 }, lipSyncStatus: 'BYPASS' },
  ];

  const dist = calculateLensDistribution(shots);
  const lens35 = dist.find((d) => d.lens === '35mm');
  const lens85 = dist.find((d) => d.lens === '85mm');

  assert.ok(lens35);
  assert.equal(lens35.count, 2);
  assert.equal(lens35.percentage, 67);

  assert.ok(lens85);
  assert.equal(lens85.count, 1);
  assert.equal(lens85.percentage, 33);
});
