import { SceneItem, CharacterProfile, ShotItem, RenderTask } from '../types';

export interface ScriptMetrics {
  totalWords: number;
  dialogueWords: number;
  actionWords: number;
  dialogueRatio: number; // percentage
  estimatedReadingTimeSec: number;
}

export interface CharacterUsageMetric {
  characterId: string;
  name: string;
  role: string;
  linesCount: number;
  spokenWords: number;
  screenTimeSec: number;
  dialoguePercentage: number;
}

export interface ProductionComputeMetrics {
  totalRuntimeSec: number;
  completedTasksCount: number;
  activeTasksCount: number;
  totalGpuComputeTimeSec: number;
  computeCostEstimateUsd: number;
  stagedStillsApproved: number;
  stagedStillsPending: number;
  twoStageCostSavingsUsd: number; // Dollars saved by eliminating blind I2V re-runs
}

export interface LensUsageDistribution {
  lens: string;
  count: number;
  percentage: number;
}

/**
 * Calculates word counts and breakdown from screenplay and scene dialogue
 */
export function calculateScriptMetrics(screenplayText: string, scenes: SceneItem[]): ScriptMetrics {
  const cleanScreenplay = screenplayText.trim();
  const totalWords = cleanScreenplay.length > 0 ? cleanScreenplay.split(/\s+/).filter(Boolean).length : 0;

  const allDialogue = scenes
    .flatMap((s) => s.shots)
    .map((sh) => sh.dialogue || '')
    .join(' ')
    .trim();

  const dialogueWords = allDialogue.length > 0 ? allDialogue.split(/\s+/).filter(Boolean).length : 0;
  const actionWords = Math.max(0, totalWords - dialogueWords);
  const dialogueRatio = totalWords > 0 ? Math.round((dialogueWords / totalWords) * 100) : 0;
  // Standard speech/reading speed ~ 130 words per minute
  const estimatedReadingTimeSec = Math.round((totalWords / 130) * 60);

  return {
    totalWords,
    dialogueWords,
    actionWords,
    dialogueRatio,
    estimatedReadingTimeSec,
  };
}

/**
 * Calculates character usage frequency and screen time distribution
 */
export function calculateCharacterUsage(
  scenes: SceneItem[],
  characters: CharacterProfile[]
): CharacterUsageMetric[] {
  const allShots = scenes.flatMap((s) => s.shots);
  const totalDialogueShots = allShots.filter((sh) => sh.dialogue && sh.dialogue.trim().length > 0);

  return characters.map((char) => {
    // Shots where this character speaks
    const spokenShots = allShots.filter((sh) => sh.speakerId === char.id && sh.dialogue);
    const spokenWords = spokenShots.reduce((acc, sh) => {
      const words = (sh.dialogue || '').split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);

    // Screen time where character is either Character A or Character B
    const visualShots = allShots.filter(
      (sh) => sh.characterAId === char.id || sh.characterBId === char.id || sh.speakerId === char.id
    );
    const screenTimeSec = visualShots.reduce((acc, sh) => acc + (sh.durationSec || 0), 0);

    const dialoguePercentage =
      totalDialogueShots.length > 0 ? Math.round((spokenShots.length / totalDialogueShots.length) * 100) : 0;

    return {
      characterId: char.id,
      name: char.name,
      role: char.role,
      linesCount: spokenShots.length,
      spokenWords,
      screenTimeSec: Math.round(screenTimeSec * 10) / 10,
      dialoguePercentage,
    };
  });
}

/**
 * Calculates GPU render time, compute costs, and efficiency savings
 */
export function calculateProductionCompute(
  shots: ShotItem[],
  renderTasks: RenderTask[]
): ProductionComputeMetrics {
  const totalRuntimeSec = shots.reduce((acc, sh) => acc + (sh.durationSec || 0), 0);
  const completedTasksCount = renderTasks.filter((t) => t.status === 'COMPLETED').length;
  const activeTasksCount = renderTasks.filter((t) => t.status === 'PROCESSING').length;

  const stagedStillsApproved = shots.filter((s) => s.keyframeStatus === 'APPROVED').length;
  const stagedStillsPending = shots.filter((s) => s.keyframeStatus !== 'APPROVED').length;

  // Compute benchmarks:
  // Flux.1 still: ~3.2 seconds GPU per frame (~$0.003)
  // Wan 2.1 I2V 5s video: ~45 seconds GPU per clip (~$0.05)
  // LatentSync: ~12 seconds GPU (~$0.015)
  const stillComputeSec = stagedStillsApproved * 3.2;
  const motionComputeSec = shots.filter((s) => s.motionStatus === 'READY').length * 45;
  const lipSyncComputeSec = shots.filter((s) => s.lipSyncStatus === 'ALIGNED').length * 12;

  const totalGpuComputeTimeSec = Math.round(stillComputeSec + motionComputeSec + lipSyncComputeSec);
  // Cost at ~$0.0012/sec GPU
  const computeCostEstimateUsd = Math.round(totalGpuComputeTimeSec * 0.0012 * 100) / 100;

  // The 2-stage still-first pipeline prevents an estimated 3 failed video regenerations per shot
  // 3 * 45s * $0.0012 * number of shots
  const twoStageCostSavingsUsd = Math.round(shots.length * 3 * 45 * 0.0012 * 100) / 100;

  return {
    totalRuntimeSec,
    completedTasksCount,
    activeTasksCount,
    totalGpuComputeTimeSec,
    computeCostEstimateUsd,
    stagedStillsApproved,
    stagedStillsPending,
    twoStageCostSavingsUsd,
  };
}

/**
 * Calculates lens distribution across all shots
 */
export function calculateLensDistribution(shots: ShotItem[]): LensUsageDistribution[] {
  if (shots.length === 0) return [];
  const map: Record<string, number> = {};

  shots.forEach((sh) => {
    const lens = sh.focalLength || '35mm';
    map[lens] = (map[lens] || 0) + 1;
  });

  return Object.entries(map).map(([lens, count]) => ({
    lens,
    count,
    percentage: Math.round((count / shots.length) * 100),
  }));
}
