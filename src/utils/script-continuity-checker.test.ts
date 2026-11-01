import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeScriptContinuity,
  applyAllContinuityAutoFixes,
  applyContinuityAutoFix,
  computeLevenshteinDistance,
  parseScreenplaySegments,
} from './script-continuity-checker';
import { CharacterProfile } from '../types/studio';

const INITIAL_CHARACTERS: CharacterProfile[] = [
  {
    id: 'char-elena',
    name: 'Elena Cross',
    role: 'Protagonist / Neural Courier',
    wardrobe: 'Weather-sealed matte black tactical duster',
    voiceProfile: 'Calm, sharp alto',
    referenceImageUrl: '',
    consistencyScore: 98,
    lockedSeed: 409128,
  },
  {
    id: 'char-chen',
    name: 'Director Chen',
    role: 'Primary Antagonist / Syndicate Executive',
    wardrobe: 'Bespoke graphite cybernetic overcoat',
    voiceProfile: 'Measured baritone',
    referenceImageUrl: '',
    consistencyScore: 96,
    lockedSeed: 882104,
  },
  {
    id: 'char-kael',
    name: 'Kaelen Vance',
    role: 'Sub-Grid Netrunner & Tactical Overwatch',
    wardrobe: 'Distressed insulated flight jacket',
    voiceProfile: 'Rapid-fire tenor',
    referenceImageUrl: '',
    consistencyScore: 94,
    lockedSeed: 119302,
  },
];

const CLEAN_SCREENPLAY = `EXT. SECTOR 4 NEON ALLEYWAY - NIGHT

Torrential downpour. Heavy rain slams against wet asphalt.

ELENA CROSS (28), clad in a weather-sealed matte duster, clutches a silver neural transport case.

Standing under the amber flicker of a broken noodle bar sign is DIRECTOR CHEN (54), hands clasped behind his coat.

DIRECTOR CHEN
You were never supposed to open that transport case, Elena.

ELENA CROSS
Then you shouldn't have hired someone with a conscience.

INT. INDUSTRIAL DISPATCH STATION - MOMENTS LATER

Elena crashes through the airlock doors into the cavernous server core.

ELENA CROSS
(into collar comms)
Kael, bypass the biometric lockdown! Now!

KAELEN VANCE (V.O.)
Firewall is decaying! Three seconds, Elena!`;

test('parseScreenplaySegments splits screenplay into structured scene segments with resolved times', () => {
  const segments = parseScreenplaySegments(CLEAN_SCREENPLAY);
  assert.equal(segments.length, 2);

  assert.equal(segments[0].settingType, 'EXT');
  assert.equal(segments[0].location, 'SECTOR 4 NEON ALLEYWAY');
  assert.equal(segments[0].resolvedTimeSlot, 'NIGHT');
  assert.equal(segments[0].speakers.length, 2);

  assert.equal(segments[1].settingType, 'INT');
  assert.equal(segments[1].location, 'INDUSTRIAL DISPATCH STATION');
  assert.equal(segments[1].isImmediateTransition, true);
  assert.equal(segments[1].resolvedTimeSlot, 'NIGHT');
});

test('analyzeScriptContinuity returns 100% nominal score for consistent screenplay', () => {
  const report = analyzeScriptContinuity(CLEAN_SCREENPLAY, INITIAL_CHARACTERS);
  assert.equal(report.issues.length, 0);
  assert.equal(report.continuityScore, 100);
  assert.equal(report.status, 'nominal');
  assert.equal(report.trackedCharacters.length, 3);
});

test('analyzeScriptContinuity flags character name drift and speaker alias inconsistencies across scenes', () => {
  const driftedScript = `EXT. SECTOR 4 NEON ALLEYWAY - NIGHT

ELENA CROSS (28) steps through the rain toward DIRECTOR CHEN (54).

DIRECTOR CHEN
Hand over the drive.

INT. INDUSTRIAL DISPATCH STATION - MOMENTS LATER

Elena vaults over the security turnstile.

ELINA CROSS
I'm inside the core!

KAEL (V.O.)
Watch out for the turret grid!`;

  const report = analyzeScriptContinuity(driftedScript, INITIAL_CHARACTERS);
  const nameDriftIssues = report.issues.filter((i) => i.category === 'character-name-drift');
  assert.equal(nameDriftIssues.length, 2);

  const elinaIssue = nameDriftIssues.find((i) => i.detectedValue === 'ELINA CROSS');
  assert.ok(elinaIssue, 'Should flag ELINA CROSS as character name drift');
  assert.equal(elinaIssue.expectedValue, 'ELENA CROSS');

  const kaelIssue = nameDriftIssues.find((i) => i.detectedValue === 'KAEL (V.O.)');
  assert.ok(kaelIssue, 'Should flag KAEL (V.O.) as partial alias drift for KAELEN VANCE');
  assert.equal(kaelIssue.expectedValue, 'KAELEN VANCE (V.O.)');
});

test('analyzeScriptContinuity flags timeline jumps when NIGHT transitions to MOMENTS LATER - DAY or unbridged DAY', () => {
  const timelineJumpScript = `EXT. SECTOR 4 NEON ALLEYWAY - NIGHT

ELENA CROSS (28) sprints down the rain-slicked alley.

ELENA CROSS
Almost at the airlock!

INT. INDUSTRIAL DISPATCH STATION - MOMENTS LATER - DAY

Elena crashes through the airlock doors into the server core.

ELENA CROSS
I made it inside!`;

  const report = analyzeScriptContinuity(timelineJumpScript, INITIAL_CHARACTERS);
  const timelineIssue = report.issues.find((i) => i.category === 'timeline-jump');
  assert.ok(timelineIssue, 'Should detect NIGHT to MOMENTS LATER - DAY temporal paradox');
  assert.equal(timelineIssue.severity, 'critical');

  const fixedText = applyContinuityAutoFix(timelineJumpScript, timelineIssue);
  const recheck = analyzeScriptContinuity(fixedText, INITIAL_CHARACTERS);
  assert.equal(
    recheck.issues.filter((i) => i.category === 'timeline-jump').length,
    0,
    'Auto-fix should resolve the timeline jump'
  );
});

test('analyzeScriptContinuity flags character age drift between scenes and supports batch auto-fix', () => {
  const ageAndNameDriftScript = `EXT. SECTOR 4 NEON ALLEYWAY - NIGHT

ELENA CROSS (28) sprints through the neon fog.

INT. INDUSTRIAL DISPATCH STATION - DAY

Moments later, ELENA CROSS (34) crashes through the doors.

DIRECTOR CHENG (V.O.)
You cannot escape Sector 4!`;

  const report = analyzeScriptContinuity(ageAndNameDriftScript, INITIAL_CHARACTERS);
  assert.ok(report.issues.some((i) => i.category === 'character-attribute-drift'));
  assert.ok(report.issues.some((i) => i.category === 'character-name-drift'));
  assert.ok(report.issues.some((i) => i.category === 'timeline-jump'));

  const fixedAll = applyAllContinuityAutoFixes(ageAndNameDriftScript, report.issues);
  const afterReport = analyzeScriptContinuity(fixedAll, INITIAL_CHARACTERS);
  assert.equal(afterReport.issues.length, 0);
  assert.equal(afterReport.continuityScore, 100);
});

test('computeLevenshteinDistance calculates accurate edit distance', () => {
  assert.equal(computeLevenshteinDistance('ELENA CROSS', 'ELENA CROSS'), 0);
  assert.equal(computeLevenshteinDistance('ELENA CROSS', 'ELINA CROSS'), 1);
  assert.equal(computeLevenshteinDistance('DIRECTOR CHEN', 'DIRECTOR CHENG'), 1);
});
