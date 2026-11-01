import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDuckingGain,
  formatTimecode,
  getActiveSubtitle,
  generateYouTubePackage,
  SubtitleCue,
} from './timeline-engine';

test('formatTimecode formats minutes and hours properly', () => {
  assert.equal(formatTimecode(0), '00:00');
  assert.equal(formatTimecode(75), '01:15');
  assert.equal(formatTimecode(3665), '01:01:05');
});

test('calculateDuckingGain reduces gain to -12 dB during dialogue', () => {
  const dialogueClips = [
    { startTime: 10, duration: 5 }, // Active from t=10s to t=15s
  ];

  // At t=0s, no dialogue -> full volume 1.0 (0 dB)
  const idle = calculateDuckingGain(0, dialogueClips);
  assert.equal(idle.gainLinear, 1.0);
  assert.equal(idle.gainDb, 0);
  assert.equal(idle.isDuckingActive, false);

  // At t=12s, squarely inside dialogue -> ducked to ~0.25 (-12 dB)
  const active = calculateDuckingGain(12, dialogueClips);
  assert.ok(active.gainLinear < 0.26 && active.gainLinear > 0.24);
  assert.equal(active.gainDb, -12);
  assert.equal(active.isDuckingActive, true);

  // At t=25s, well past dialogue -> restored
  const restored = calculateDuckingGain(25, dialogueClips);
  assert.equal(restored.gainLinear, 1.0);
  assert.equal(restored.gainDb, 0);
  assert.equal(restored.isDuckingActive, false);
});

test('getActiveSubtitle locates active word and speaker correctly', () => {
  const cues: SubtitleCue[] = [
    {
      id: 'cue-1',
      speaker: 'Agent Vance',
      startTime: 2.0,
      endTime: 5.0,
      text: 'The perimeter is compromised.',
      words: [
        { word: 'The', start: 2.0, end: 2.5 },
        { word: 'perimeter', start: 2.6, end: 3.5 },
        { word: 'is', start: 3.6, end: 4.0 },
        { word: 'compromised.', start: 4.1, end: 4.9 },
      ],
    },
  ];

  // When playhead is at 3.0s, 'perimeter' should be highlighted
  const atThree = getActiveSubtitle(3.0, cues);
  assert.ok(atThree.cue);
  assert.equal(atThree.cue.speaker, 'Agent Vance');
  assert.equal(atThree.highlightedWord, 'perimeter');
  assert.equal(atThree.activeWordIndex, 1);

  // When playhead is at 10.0s, no subtitle
  const atTen = getActiveSubtitle(10.0, cues);
  assert.equal(atTen.cue, null);
  assert.equal(atTen.highlightedWord, null);
});

test('generateYouTubePackage builds compliant chapters and description', () => {
  const pkg = generateYouTubePackage(
    'CYBER COURIER 2088',
    'A rogue courier carries the last quantum drive through neon sector 4.',
    [
      { id: '1', sceneNumber: 1, title: 'Cold Open', startTime: 0, description: '' },
      { id: '2', sceneNumber: 2, title: 'The Drop Point', startTime: 45, description: '' },
    ]
  );

  assert.ok(pkg.seoTitle.includes('CYBER COURIER 2088'));
  assert.ok(pkg.timestampsText.includes('00:00 - Cold Open'));
  assert.ok(pkg.timestampsText.includes('00:45 - The Drop Point'));
  assert.ok(pkg.description.includes('TIMESTAMPS:'));
  assert.ok(pkg.estimatedRenderSizeMb > 0);
});
