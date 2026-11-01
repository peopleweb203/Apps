export interface TimelineClip {
  id: string;
  track: 'video' | 'dialogue' | 'sfx' | 'music';
  name: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  volume?: number; // 0 to 1
  sourceUrl?: string;
  color?: string;
}

export interface SubtitleWord {
  word: string;
  start: number; // in seconds
  end: number; // in seconds
}

export interface SubtitleCue {
  id: string;
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
  words: SubtitleWord[];
}

export type SubtitleStyle = 'MR_BEAST' | 'NETFLIX_CINEMA' | 'MINIMAL_SERIF';

export interface SceneMarker {
  id: string;
  sceneNumber: number;
  title: string;
  startTime: number;
  description: string;
}

/**
 * Calculates dialogue ducking multiplier at any given second.
 * Standard film mixing dips background tracks by -12 dB (~0.251 linear gain)
 * during dialogue passages with 0.25s attack and 0.4s release smoothing.
 */
export function calculateDuckingGain(
  currentTime: number,
  dialogueClips: Array<{ startTime: number; duration: number }>,
  duckingDb: number = -12
): { gainLinear: number; gainDb: number; isDuckingActive: boolean } {
  const targetGain = Math.pow(10, duckingDb / 20); // ~0.251 for -12dB
  const attack = 0.25;
  const release = 0.4;

  let minGain = 1.0;
  let isDucking = false;

  for (const clip of dialogueClips) {
    const clipStart = clip.startTime;
    const clipEnd = clip.startTime + clip.duration;

    // Check if within clip or transition bounds
    if (currentTime >= clipStart - attack && currentTime <= clipEnd + release) {
      isDucking = true;

      // Attack phase (ramping down from 1.0 to targetGain)
      if (currentTime < clipStart) {
        const factor = (currentTime - (clipStart - attack)) / attack;
        const currentPhaseGain = 1.0 - factor * (1.0 - targetGain);
        minGain = Math.min(minGain, currentPhaseGain);
      }
      // Full ducking inside dialogue
      else if (currentTime >= clipStart && currentTime <= clipEnd) {
        minGain = Math.min(minGain, targetGain);
      }
      // Release phase (ramping up from targetGain to 1.0)
      else if (currentTime > clipEnd) {
        const factor = (currentTime - clipEnd) / release;
        const currentPhaseGain = targetGain + factor * (1.0 - targetGain);
        minGain = Math.min(minGain, currentPhaseGain);
      }
    }
  }

  const clampedGain = Math.max(targetGain, Math.min(1.0, minGain));
  const gainDb = Math.round(20 * Math.log10(clampedGain) * 10) / 10;

  return {
    gainLinear: clampedGain,
    gainDb,
    isDuckingActive: isDucking,
  };
}

/**
 * Formats seconds into MM:SS or HH:MM:SS format
 */
export function formatTimecode(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Finds active subtitle cue and active word at given playhead position
 */
export function getActiveSubtitle(
  currentTime: number,
  cues: SubtitleCue[]
): {
  cue: SubtitleCue | null;
  activeWordIndex: number;
  highlightedWord: string | null;
  progressInWord: number;
} {
  const cue = cues.find((c) => currentTime >= c.startTime && currentTime <= c.endTime) || null;
  if (!cue) {
    return { cue: null, activeWordIndex: -1, highlightedWord: null, progressInWord: 0 };
  }

  const wordIndex = cue.words.findIndex((w) => currentTime >= w.start && currentTime <= w.end);
  if (wordIndex !== -1) {
    const w = cue.words[wordIndex];
    const dur = Math.max(0.05, w.end - w.start);
    const progress = Math.min(1, Math.max(0, (currentTime - w.start) / dur));
    return {
      cue,
      activeWordIndex: wordIndex,
      highlightedWord: w.word,
      progressInWord: progress,
    };
  }

  // If between words within cue
  return {
    cue,
    activeWordIndex: -1,
    highlightedWord: null,
    progressInWord: 0,
  };
}

/**
 * Generates YouTube Timestamps & Video Description
 */
export function generateYouTubePackage(
  projectTitle: string,
  logline: string,
  markers: SceneMarker[],
  tags: string[] = ['AI Cinema', 'Flux1', 'Wan21', 'ShortFilm', 'CineForge']
): {
  seoTitle: string;
  description: string;
  timestampsText: string;
  estimatedRenderSizeMb: number;
} {
  // Always ensure 00:00 exists for YouTube Chaptering compliance
  const sorted = [...markers].sort((a, b) => a.startTime - b.startTime);
  const hasZero = sorted.length > 0 && Math.floor(sorted[0].startTime) === 0;

  const timestamps = (hasZero ? sorted : [{ id: 'intro', sceneNumber: 1, title: 'Cold Open / Intro', startTime: 0, description: '' }, ...sorted])
    .map((m) => `${formatTimecode(m.startTime)} - ${m.title}`)
    .join('\n');

  const seoTitle = `${projectTitle} | 4K Cinematic AI Short Film`;

  const description = `${projectTitle}

${logline}

TIMESTAMPS:
${timestamps}

PRODUCED WITH CINEFORGE AI:
- Master Keyframe Engine: FLUX.1 [dev] (IP-Adapter Character Staging)
- Motion Extrusion: Wan 2.1 & Kling I2V Engine
- Dialogue & Latent Lip-Sync: ElevenLabs Neural Audio + LatentSync
- Spatial Audio: Procedural Soundstage with -12dB Dialogue Ducking

Tags: ${tags.map((t) => `#${t.replace(/\s+/g, '')}`).join(' ')}
`;

  // Estimate 4K 60Mbps H.265: ~7.5 MB per second
  const maxTime = markers.length > 0 ? Math.max(...markers.map((m) => m.startTime + 25)) : 120;
  const estimatedRenderSizeMb = Math.round(maxTime * 7.5);

  return {
    seoTitle,
    description,
    timestampsText: timestamps,
    estimatedRenderSizeMb,
  };
}
