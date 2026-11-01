import { CharacterProfile } from '../types/studio';

export type ContinuityIssueCategory =
  | 'character-name-drift'
  | 'character-attribute-drift'
  | 'timeline-jump'
  | 'spatial-continuity';

export type ContinuityIssueSeverity = 'critical' | 'warning' | 'info';

export type ResolvedTimeSlot = 'NIGHT' | 'DAY' | 'DAWN' | 'DUSK' | 'UNKNOWN';

export interface SpeakerMention {
  rawCue: string;
  rawName: string;
  normalizedName: string;
  isOffScreen: boolean;
  lineNumber: number;
}

export interface CharacterIntroMention {
  rawMatch: string;
  rawName: string;
  normalizedName: string;
  statedAge?: number;
  lineNumber: number;
}

export interface ParsedSceneSegment {
  segmentIndex: number;
  slugline: string;
  settingType: 'INT' | 'EXT' | 'INT/EXT';
  location: string;
  timeModifier: string;
  resolvedTimeSlot: ResolvedTimeSlot;
  explicitTimeSlot: ResolvedTimeSlot;
  isImmediateTransition: boolean;
  isFlashbackOrTimeJump: boolean;
  startLine: number;
  endLine: number;
  speakers: SpeakerMention[];
  characterMentions: CharacterIntroMention[];
  rawText: string;
}

export interface ScriptContinuityIssue {
  id: string;
  category: ContinuityIssueCategory;
  severity: ContinuityIssueSeverity;
  title: string;
  description: string;
  segmentIndex: number;
  relatedSegmentIndex?: number;
  lineNumber: number;
  detectedValue: string;
  expectedValue: string;
  autoFixLabel: string;
  targetSubstring: string;
  replacementSubstring: string;
}

export interface TrackedCharacterContinuity {
  canonicalName: string;
  aliasesSeen: string[];
  statedAges: number[];
  sceneAppearances: number[];
}

export interface ScriptContinuityReport {
  continuityScore: number;
  status: 'nominal' | 'caution' | 'critical';
  segments: ParsedSceneSegment[];
  issues: ScriptContinuityIssue[];
  trackedCharacters: TrackedCharacterContinuity[];
  analyzedAtMs: number;
}

const SLUGLINE_REGEX = /^\s*(INT\.\/EXT\.|INT\/EXT\.|I\/E\.|INT\.|EXT\.)\s+(.+)$/i;

const IMMEDIATE_TRANSITION_KEYWORDS = [
  'MOMENTS LATER',
  'CONTINUOUS',
  'SECONDS LATER',
  'IMMEDIATELY',
  'SAME TIME',
  'SIMULTANEOUS',
];

const EXPLICIT_TIME_JUMP_KEYWORDS = [
  'FLASHBACK',
  'FLASH FORWARD',
  'HOURS LATER',
  'NEXT DAY',
  'NEXT MORNING',
  'NEXT NIGHT',
  'YEARS EARLIER',
  'YEARS LATER',
  'DAYS LATER',
  'DREAM SEQUENCE',
];

const STOPWORD_CUES = new Set([
  'CUT TO',
  'CUT TO:',
  'FADE IN:',
  'FADE OUT.',
  'FADE OUT:',
  'DISSOLVE TO:',
  'SMASH CUT TO:',
  'MATCH CUT TO:',
  'THE END',
  'CONTINUED',
  'CONTINUOUS',
  'MOMENTS LATER',
]);

/**
 * Computes standard Levenshtein edit distance between two uppercase strings.
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  const s = a.trim().toUpperCase();
  const t = b.trim().toUpperCase();
  if (s === t) return 0;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;

  const matrix: number[][] = Array.from({ length: s.length + 1 }, () =>
    new Array<number>(t.length + 1).fill(0)
  );

  for (let i = 0; i <= s.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= t.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[s.length][t.length];
}

export function normalizeCharacterName(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, '')
    .replace(/[^A-Za-z0-9\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export function detectExplicitTimeSlot(modifier: string): ResolvedTimeSlot {
  const upper = modifier.toUpperCase();
  if (/\b(NIGHT|MIDNIGHT|EVENING|LATE NIGHT)\b/.test(upper)) {
    return 'NIGHT';
  }
  if (/\b(DAY|MORNING|NOON|AFTERNOON|MIDDAY|DAYLIGHT)\b/.test(upper)) {
    return 'DAY';
  }
  if (/\b(DAWN|SUNRISE|DAYBREAK)\b/.test(upper)) {
    return 'DAWN';
  }
  if (/\b(DUSK|SUNSET|TWILIGHT|MAGIC HOUR)\b/.test(upper)) {
    return 'DUSK';
  }
  return 'UNKNOWN';
}

/**
 * Parses a multi-scene screenplay into structured scene segments with line numbers,
 * speaker cues, character age introductions, and temporal metadata.
 */
export function parseScreenplaySegments(screenplayText: string): ParsedSceneSegment[] {
  const lines = screenplayText.split(/\r?\n/);
  const segments: ParsedSceneSegment[] = [];

  interface RawBlock {
    slugline: string;
    settingType: 'INT' | 'EXT' | 'INT/EXT';
    location: string;
    timeModifier: string;
    startLine: number;
    endLine: number;
    lines: Array<{ text: string; lineNumber: number }>;
  }

  const rawBlocks: RawBlock[] = [];
  let currentBlock: RawBlock | null = null;

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNumber = idx + 1;
    const line = lines[idx];
    const slugMatch = line.match(SLUGLINE_REGEX);

    if (slugMatch) {
      if (currentBlock) {
        currentBlock.endLine = lineNumber - 1;
        rawBlocks.push(currentBlock);
      }

      const rawPrefix = slugMatch[1].toUpperCase();
      const settingType: 'INT' | 'EXT' | 'INT/EXT' =
        rawPrefix.includes('INT') && rawPrefix.includes('EXT')
          ? 'INT/EXT'
          : rawPrefix.startsWith('INT')
          ? 'INT'
          : 'EXT';

      const remainder = slugMatch[2].trim();
      const dashParts = remainder.split(/\s+-\s+|\s+--\s+/);
      const location = (dashParts[0] || remainder).trim().toUpperCase();
      const timeModifier =
        dashParts.length > 1 ? dashParts.slice(1).join(' - ').trim().toUpperCase() : 'UNKNOWN';

      currentBlock = {
        slugline: line.trim(),
        settingType,
        location,
        timeModifier,
        startLine: lineNumber,
        endLine: lines.length,
        lines: [{ text: line, lineNumber }],
      };
    } else {
      if (!currentBlock && line.trim().length > 0) {
        currentBlock = {
          slugline: 'INT. UNSPECIFIED LOCATION - UNKNOWN',
          settingType: 'INT',
          location: 'UNSPECIFIED LOCATION',
          timeModifier: 'UNKNOWN',
          startLine: lineNumber,
          endLine: lines.length,
          lines: [],
        };
      }
      if (currentBlock) {
        currentBlock.lines.push({ text: line, lineNumber });
      }
    }
  }

  if (currentBlock) {
    currentBlock.endLine = lines.length;
    rawBlocks.push(currentBlock);
  }

  let previousTimeSlot: ResolvedTimeSlot = 'UNKNOWN';

  rawBlocks.forEach((block, index) => {
    const explicitTimeSlot = detectExplicitTimeSlot(block.timeModifier);
    const upperModifier = block.timeModifier.toUpperCase();

    const isImmediateTransition = IMMEDIATE_TRANSITION_KEYWORDS.some((kw) =>
      upperModifier.includes(kw)
    );
    const isFlashbackOrTimeJump = EXPLICIT_TIME_JUMP_KEYWORDS.some((kw) =>
      upperModifier.includes(kw)
    );

    const resolvedTimeSlot: ResolvedTimeSlot =
      explicitTimeSlot !== 'UNKNOWN'
        ? explicitTimeSlot
        : isImmediateTransition && previousTimeSlot !== 'UNKNOWN'
        ? previousTimeSlot
        : 'UNKNOWN';

    if (resolvedTimeSlot !== 'UNKNOWN') {
      previousTimeSlot = resolvedTimeSlot;
    }

    const speakers: SpeakerMention[] = [];
    const characterMentions: CharacterIntroMention[] = [];

    for (let i = 0; i < block.lines.length; i++) {
      const { text, lineNumber } = block.lines[i];
      const trimmed = text.trim();

      // Skip slugline itself
      if (i === 0 && SLUGLINE_REGEX.test(trimmed)) {
        continue;
      }

      if (!trimmed) continue;

      // 1. Detect CHARACTER NAME (AGE) in action descriptions, e.g. ELENA CROSS (28)
      const introRegex = /\b([A-Z][A-Z]+(?:\s+[A-Z][A-Z]+){0,2})\s*\((\d{1,3})\)/g;
      let introMatch: RegExpExecArray | null;
      while ((introMatch = introRegex.exec(trimmed)) !== null) {
        const rawName = introMatch[1].trim();
        const normalizedName = normalizeCharacterName(rawName);
        const statedAge = parseInt(introMatch[2], 10);
        if (normalizedName.length >= 3 && !STOPWORD_CUES.has(normalizedName)) {
          characterMentions.push({
            rawMatch: introMatch[0],
            rawName,
            normalizedName,
            statedAge,
            lineNumber,
          });
        }
      }

      // 2. Detect Dialogue Speaker Cues:
      // Uppercase line (may include (V.O.), (O.S.), (CONT'D)) that is followed by dialogue or parenthetical
      const isAllCapsLine =
        /^[A-Z][A-Z0-9\s.'-]+(\s*\((?:V\.O\.|O\.S\.|CONT'D|INTO\s+[^)]+|ON\s+[^)]+)\))?$/.test(
          trimmed
        ) &&
        trimmed.length <= 42 &&
        !SLUGLINE_REGEX.test(trimmed) &&
        !STOPWORD_CUES.has(trimmed.replace(/:$/, ''));

      if (isAllCapsLine) {
        const nextLine = block.lines[i + 1]?.text.trim() ?? '';
        if (nextLine.length > 0 && !SLUGLINE_REGEX.test(nextLine)) {
          const isOffScreen = /\((?:V\.O\.|O\.S\.|OVER COMMS|RADIO)\)/i.test(trimmed);
          const normalizedName = normalizeCharacterName(trimmed);
          const rawName = trimmed.replace(/\s*\([^)]*\)\s*$/g, '').trim();
          if (normalizedName.length >= 2) {
            speakers.push({
              rawCue: trimmed,
              rawName,
              normalizedName,
              isOffScreen,
              lineNumber,
            });
          }
        }
      }
    }

    segments.push({
      segmentIndex: index + 1,
      slugline: block.slugline,
      settingType: block.settingType,
      location: block.location,
      timeModifier: block.timeModifier,
      resolvedTimeSlot,
      explicitTimeSlot,
      isImmediateTransition,
      isFlashbackOrTimeJump,
      startLine: block.startLine,
      endLine: block.endLine,
      speakers,
      characterMentions,
      rawText: block.lines.map((l) => l.text).join('\n'),
    });
  });

  return segments;
}

/**
 * Finds the best canonical match for a character name against known canonical characters.
 */
function findCanonicalCharacterMatch(
  candidateName: string,
  canonicalNames: string[]
): {
  canonicalName: string;
  matchType: 'exact' | 'typo-drift' | 'partial-alias' | 'none';
  distance: number;
} {
  const normalized = normalizeCharacterName(candidateName);
  if (!normalized) {
    return { canonicalName: candidateName, matchType: 'none', distance: 99 };
  }

  for (const canon of canonicalNames) {
    if (normalized === canon) {
      return { canonicalName: canon, matchType: 'exact', distance: 0 };
    }
  }

  let bestCanon = '';
  let bestDistance = 99;

  for (const canon of canonicalNames) {
    const dist = computeLevenshteinDistance(normalized, canon);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestCanon = canon;
    }

    // Check token-level similarity: e.g. "ELINA CROSS" vs "ELENA CROSS", "DIRECTOR CHENG" vs "DIRECTOR CHEN", "KAEL" vs "KAELEN VANCE"
    const candTokens = normalized.split(' ');
    const canonTokens = canon.split(' ');

    // Single-token nickname or partial name match against a multi-token canonical name (e.g. "KAEL" or "ELENA" or "CHEN")
    if (candTokens.length === 1 && canonTokens.length >= 2) {
      const token = candTokens[0];
      for (const ct of canonTokens) {
        if (
          token === ct ||
          (token.length >= 4 && ct.startsWith(token)) ||
          (token.length >= 4 && computeLevenshteinDistance(token, ct) === 1)
        ) {
          return {
            canonicalName: canon,
            matchType: 'partial-alias',
            distance: Math.abs(canon.length - normalized.length),
          };
        }
      }
    }

    // Multi-token where one token matches and the other has a small edit distance (<= 2)
    if (candTokens.length === canonTokens.length && candTokens.length >= 2) {
      const tokenDistances = candTokens.map((t, i) =>
        computeLevenshteinDistance(t, canonTokens[i])
      );
      const totalTokenDist = tokenDistances.reduce((a, b) => a + b, 0);
      if (totalTokenDist > 0 && totalTokenDist <= 3) {
        return {
          canonicalName: canon,
          matchType: 'typo-drift',
          distance: totalTokenDist,
        };
      }
    }
  }

  // Whole-string Levenshtein threshold (1 to 3 edits for names >= 5 chars)
  if (normalized.length >= 5 && bestDistance >= 1 && bestDistance <= 3) {
    return {
      canonicalName: bestCanon,
      matchType: 'typo-drift',
      distance: bestDistance,
    };
  }

  return { canonicalName: candidateName, matchType: 'none', distance: bestDistance };
}

/**
 * Analyzes screenplay text in real time and returns a comprehensive ScriptContinuityReport
 * flagging character name changes, attribute drift, timeline jumps, and spatial inconsistencies.
 */
export function analyzeScriptContinuity(
  screenplayText: string,
  castCharacters: CharacterProfile[] = []
): ScriptContinuityReport {
  const segments = parseScreenplaySegments(screenplayText);
  const issues: ScriptContinuityIssue[] = [];

  // Build canonical character list from Studio Cast + first-seen formal character introductions
  const canonicalNames: string[] = [];
  const canonicalAgeMap = new Map<string, { age: number; segmentIndex: number; lineNumber: number }>();
  const characterStatsMap = new Map<string, TrackedCharacterContinuity>();

  const registerCanonical = (name: string) => {
    const norm = normalizeCharacterName(name);
    if (!norm || STOPWORD_CUES.has(norm)) return;
    if (!canonicalNames.includes(norm)) {
      canonicalNames.push(norm);
    }
    if (!characterStatsMap.has(norm)) {
      characterStatsMap.set(norm, {
        canonicalName: norm,
        aliasesSeen: [norm],
        statedAges: [],
        sceneAppearances: [],
      });
    }
  };

  for (const char of castCharacters) {
    registerCanonical(char.name);
  }

  // First pass: register characters introduced with (AGE) or first-scene full names
  for (const segment of segments) {
    for (const mention of segment.characterMentions) {
      const existing = findCanonicalCharacterMatch(mention.normalizedName, canonicalNames);
      if (existing.matchType === 'none') {
        registerCanonical(mention.normalizedName);
      }
    }
    for (const speaker of segment.speakers) {
      const existing = findCanonicalCharacterMatch(speaker.normalizedName, canonicalNames);
      if (existing.matchType === 'none') {
        registerCanonical(speaker.normalizedName);
      }
    }
  }

  // Second pass: inspect each segment for character name drift & attribute drift
  for (const segment of segments) {
    // Check character age/attribute introductions
    for (const mention of segment.characterMentions) {
      const match = findCanonicalCharacterMatch(mention.normalizedName, canonicalNames);
      const canon = match.matchType !== 'none' ? match.canonicalName : mention.normalizedName;
      const stats = characterStatsMap.get(canon);
      if (stats) {
        if (!stats.sceneAppearances.includes(segment.segmentIndex)) {
          stats.sceneAppearances.push(segment.segmentIndex);
        }
        if (!stats.aliasesSeen.includes(mention.normalizedName)) {
          stats.aliasesSeen.push(mention.normalizedName);
        }
      }

      if (match.matchType === 'typo-drift' || match.matchType === 'partial-alias') {
        const ageSuffix = mention.statedAge !== undefined ? ` (${mention.statedAge})` : '';
        issues.push({
          id: `char-intro-drift-s${segment.segmentIndex}-l${mention.lineNumber}`,
          category: 'character-name-drift',
          severity: 'critical',
          title: `Character Name Drift in Scene #${segment.segmentIndex}`,
          description: `"${mention.rawName}" in Scene #${segment.segmentIndex} (Line ${mention.lineNumber}) deviates from canonical character "${canon}".`,
          segmentIndex: segment.segmentIndex,
          lineNumber: mention.lineNumber,
          detectedValue: mention.rawMatch,
          expectedValue: `${canon}${ageSuffix}`,
          autoFixLabel: `Rename to ${canon}`,
          targetSubstring: mention.rawMatch,
          replacementSubstring: `${canon}${ageSuffix}`,
        });
      }

      if (mention.statedAge !== undefined) {
        if (stats && !stats.statedAges.includes(mention.statedAge)) {
          stats.statedAges.push(mention.statedAge);
        }
        const prevAgeEntry = canonicalAgeMap.get(canon);
        if (!prevAgeEntry) {
          canonicalAgeMap.set(canon, {
            age: mention.statedAge,
            segmentIndex: segment.segmentIndex,
            lineNumber: mention.lineNumber,
          });
        } else if (
          prevAgeEntry.age !== mention.statedAge &&
          !segment.isFlashbackOrTimeJump
        ) {
          issues.push({
            id: `char-age-drift-s${segment.segmentIndex}-l${mention.lineNumber}`,
            category: 'character-attribute-drift',
            severity: 'warning',
            title: `Character Age Inconsistency for ${canon}`,
            description: `${canon} is listed as age (${mention.statedAge}) in Scene #${segment.segmentIndex}, contradicting age (${prevAgeEntry.age}) established in Scene #${prevAgeEntry.segmentIndex} without a flashback/time-jump slugline.`,
            segmentIndex: segment.segmentIndex,
            relatedSegmentIndex: prevAgeEntry.segmentIndex,
            lineNumber: mention.lineNumber,
            detectedValue: `${mention.rawName} (${mention.statedAge})`,
            expectedValue: `${canon} (${prevAgeEntry.age})`,
            autoFixLabel: `Sync Age to (${prevAgeEntry.age})`,
            targetSubstring: mention.rawMatch,
            replacementSubstring: `${canon} (${prevAgeEntry.age})`,
          });
        }
      }
    }

    // Check dialogue speaker cues for name drift
    for (const speaker of segment.speakers) {
      const match = findCanonicalCharacterMatch(speaker.normalizedName, canonicalNames);
      const canon = match.matchType !== 'none' ? match.canonicalName : speaker.normalizedName;
      const stats = characterStatsMap.get(canon);
      if (stats) {
        if (!stats.sceneAppearances.includes(segment.segmentIndex)) {
          stats.sceneAppearances.push(segment.segmentIndex);
        }
        if (!stats.aliasesSeen.includes(speaker.normalizedName)) {
          stats.aliasesSeen.push(speaker.normalizedName);
        }
      }

      if (match.matchType === 'typo-drift' || match.matchType === 'partial-alias') {
        const parenMatch = speaker.rawCue.match(/\s*(\([^)]*\))\s*$/);
        const parenSuffix = parenMatch ? ` ${parenMatch[1]}` : '';
        const replacementCue = `${canon}${parenSuffix}`;

        issues.push({
          id: `speaker-drift-s${segment.segmentIndex}-l${speaker.lineNumber}`,
          category: 'character-name-drift',
          severity: match.matchType === 'typo-drift' ? 'critical' : 'warning',
          title:
            match.matchType === 'typo-drift'
              ? `Character Speaker Name Drift: "${speaker.rawName}"`
              : `Inconsistent Speaker Cue Alias: "${speaker.rawName}"`,
          description:
            match.matchType === 'typo-drift'
              ? `Dialogue cue "${speaker.rawName}" in Scene #${segment.segmentIndex} (Line ${speaker.lineNumber}) appears to be a misspelling of canonical cast member "${canon}".`
              : `Dialogue cue "${speaker.rawName}" in Scene #${segment.segmentIndex} (Line ${speaker.lineNumber}) uses a shortened alias instead of full canonical cue "${canon}".`,
          segmentIndex: segment.segmentIndex,
          lineNumber: speaker.lineNumber,
          detectedValue: speaker.rawCue,
          expectedValue: replacementCue,
          autoFixLabel: `Fix Cue to "${replacementCue}"`,
          targetSubstring: speaker.rawCue,
          replacementSubstring: replacementCue,
        });
      }
    }
  }

  // Third pass: Timeline & Spatial Continuity across consecutive scene segments
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];

    // Check 1: Immediate transition (MOMENTS LATER / CONTINUOUS) with conflicting explicit time of day (e.g. NIGHT -> MOMENTS LATER - DAY)
    if (
      curr.isImmediateTransition &&
      prev.resolvedTimeSlot !== 'UNKNOWN' &&
      curr.explicitTimeSlot !== 'UNKNOWN' &&
      prev.resolvedTimeSlot !== curr.explicitTimeSlot
    ) {
      const fixedSlugline = `${curr.settingType}. ${curr.location} - MOMENTS LATER (${prev.resolvedTimeSlot})`;
      issues.push({
        id: `timeline-paradox-s${curr.segmentIndex}-l${curr.startLine}`,
        category: 'timeline-jump',
        severity: 'critical',
        title: `Temporal Paradox: ${prev.resolvedTimeSlot} → ${curr.timeModifier}`,
        description: `Scene #${curr.segmentIndex} is marked as an immediate continuation ("${curr.timeModifier}") of Scene #${prev.segmentIndex} (${prev.resolvedTimeSlot}), but shifts time of day to ${curr.explicitTimeSlot}.`,
        segmentIndex: curr.segmentIndex,
        relatedSegmentIndex: prev.segmentIndex,
        lineNumber: curr.startLine,
        detectedValue: curr.slugline,
        expectedValue: fixedSlugline,
        autoFixLabel: `Align Slugline to ${prev.resolvedTimeSlot}`,
        targetSubstring: curr.slugline,
        replacementSubstring: fixedSlugline,
      });
      continue;
    }

    // Check 2: Abrupt Day/Night jump without temporal transition or flashback indicator
    const isDayNightFlip =
      (prev.resolvedTimeSlot === 'NIGHT' && curr.resolvedTimeSlot === 'DAY') ||
      (prev.resolvedTimeSlot === 'DAY' && curr.resolvedTimeSlot === 'NIGHT');

    if (isDayNightFlip && !curr.isFlashbackOrTimeJump) {
      // Check if the scene body implies immediate continuation ("Moments later", "Seconds later", "Still running", etc.) or if it's an unbridged jump
      const impliesImmediateAction =
        /\b(moments later|seconds later|continuous|still running|crashes through|bursts through|immediately)\b/i.test(
          curr.rawText
        ) || curr.location === prev.location;

      const fixedSlugline = impliesImmediateAction
        ? `${curr.settingType}. ${curr.location} - MOMENTS LATER`
        : `${curr.settingType}. ${curr.location} - NEXT ${curr.resolvedTimeSlot}`;

      issues.push({
        id: `timeline-jump-s${curr.segmentIndex}-l${curr.startLine}`,
        category: 'timeline-jump',
        severity: impliesImmediateAction ? 'critical' : 'warning',
        title: `Abrupt Timeline Jump: ${prev.resolvedTimeSlot} → ${curr.resolvedTimeSlot}`,
        description: impliesImmediateAction
          ? `Scene #${curr.segmentIndex} continues immediate action from Scene #${prev.segmentIndex} (${prev.resolvedTimeSlot}) but jumps to ${curr.resolvedTimeSlot} without a transition.`
          : `Scene #${curr.segmentIndex} jumps directly from ${prev.resolvedTimeSlot} (Scene #${prev.segmentIndex}) to ${curr.resolvedTimeSlot} without an explicit temporal bridge (e.g., NEXT ${curr.resolvedTimeSlot}, HOURS LATER, or MOMENTS LATER).`,
        segmentIndex: curr.segmentIndex,
        relatedSegmentIndex: prev.segmentIndex,
        lineNumber: curr.startLine,
        detectedValue: curr.slugline,
        expectedValue: fixedSlugline,
        autoFixLabel: impliesImmediateAction
          ? `Set to MOMENTS LATER`
          : `Add Temporal Bridge`,
        targetSubstring: curr.slugline,
        replacementSubstring: fixedSlugline,
      });
    }

    // Check 3: Spatial continuity — character speaking on-screen in a new location without entering or being marked (V.O.)/(O.S.)
    if (curr.location !== prev.location) {
      const prevOnScreenSpeakers = new Set(
        prev.speakers.filter((s) => !s.isOffScreen).map((s) => {
          const m = findCanonicalCharacterMatch(s.normalizedName, canonicalNames);
          return m.matchType !== 'none' ? m.canonicalName : s.normalizedName;
        })
      );

      for (const speaker of curr.speakers) {
        if (speaker.isOffScreen) continue;
        const m = findCanonicalCharacterMatch(speaker.normalizedName, canonicalNames);
        const canon = m.matchType !== 'none' ? m.canonicalName : speaker.normalizedName;

        // Check if this character is mentioned in the non-dialogue action lines of the current scene before they speak
        const canonTokens = canon.split(' ');
        const actionLinesText = curr.rawText
          .split(/\r?\n/)
          .filter((line) => {
            const t = line.trim();
            return t !== speaker.rawCue && !SLUGLINE_REGEX.test(t);
          })
          .join(' ')
          .toUpperCase();

        const mentionedInSceneAction = canonTokens.some(
          (tok) => tok.length >= 3 && actionLinesText.includes(tok)
        );

        if (!mentionedInSceneAction && prevOnScreenSpeakers.has(canon)) {
          const voCue = `${canon} (V.O.)`;
          issues.push({
            id: `spatial-unannounced-s${curr.segmentIndex}-l${speaker.lineNumber}`,
            category: 'spatial-continuity',
            severity: 'warning',
            title: `Unannounced Spatial Presence: ${canon}`,
            description: `${canon} was last positioned in "${prev.location}" (Scene #${prev.segmentIndex}) and speaks on-screen in "${curr.location}" (Scene #${curr.segmentIndex}) without an entry description or (V.O.)/(O.S.) comms tag.`,
            segmentIndex: curr.segmentIndex,
            relatedSegmentIndex: prev.segmentIndex,
            lineNumber: speaker.lineNumber,
            detectedValue: speaker.rawCue,
            expectedValue: voCue,
            autoFixLabel: `Mark as ${voCue}`,
            targetSubstring: speaker.rawCue,
            replacementSubstring: voCue,
          });
        }
      }
    }
  }

  // Compute overall continuity score
  let deduction = 0;
  for (const issue of issues) {
    if (issue.severity === 'critical') deduction += 22;
    else if (issue.severity === 'warning') deduction += 12;
    else deduction += 5;
  }

  const continuityScore = Math.max(0, Math.min(100, 100 - deduction));
  const status: 'nominal' | 'caution' | 'critical' =
    issues.some((i) => i.severity === 'critical') || continuityScore < 65
      ? 'critical'
      : issues.length > 0
      ? 'caution'
      : 'nominal';

  return {
    continuityScore,
    status,
    segments,
    issues,
    trackedCharacters: Array.from(characterStatsMap.values()).filter(
      (c) => c.sceneAppearances.length > 0
    ),
    analyzedAtMs: Date.now(),
  };
}

/**
 * Applies a single ScriptContinuityIssue auto-fix to the screenplay text.
 */
export function applyContinuityAutoFix(
  screenplayText: string,
  issue: ScriptContinuityIssue
): string {
  const lines = screenplayText.split(/\r?\n/);
  const targetLineIdx = issue.lineNumber - 1;

  if (
    targetLineIdx >= 0 &&
    targetLineIdx < lines.length &&
    lines[targetLineIdx].includes(issue.targetSubstring)
  ) {
    lines[targetLineIdx] = lines[targetLineIdx].replace(
      issue.targetSubstring,
      issue.replacementSubstring
    );
    return lines.join('\n');
  }

  // Fallback to first occurrence in text
  return screenplayText.replace(issue.targetSubstring, issue.replacementSubstring);
}

/**
 * Applies all flagged ScriptContinuityIssue auto-fixes in a single pass.
 */
export function applyAllContinuityAutoFixes(
  screenplayText: string,
  issues: ScriptContinuityIssue[]
): string {
  let updated = screenplayText;
  // Sort descending by line number so line replacements don't shift earlier indices
  const sortedIssues = [...issues].sort((a, b) => b.lineNumber - a.lineNumber);
  for (const issue of sortedIssues) {
    updated = applyContinuityAutoFix(updated, issue);
  }
  return updated;
}
