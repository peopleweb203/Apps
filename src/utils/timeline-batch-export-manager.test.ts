import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSelectedTimelineShots,
  compileTimelineShotsToBatchTasks,
  generateAutomatedYouTubeMetadata,
} from './timeline-batch-export-manager';
import { INITIAL_CHARACTERS, INITIAL_SCENES } from '../mock/studio-data';
import { BUILT_IN_RENDER_PRESETS } from './batch-render-queue';

describe('Timeline Batch Render Export & Automated YouTube Metadata Manager', () => {
  const allShotIds = INITIAL_SCENES.flatMap((s) => s.shots.map((sh) => sh.id));

  it('resolves selected timeline shots with cumulative start and end timecodes', () => {
    const subsetIds = allShotIds.slice(0, 3);
    const resolved = resolveSelectedTimelineShots(INITIAL_SCENES, subsetIds);

    assert.equal(resolved.length, 3);
    assert.equal(resolved[0].startTimeSec, 0);
    assert.ok(resolved[1].startTimeSec > 0);
    assert.equal(resolved[1].startTimeSec, resolved[0].endTimeSec);
  });

  it('compiles multiple selected shots into individual batch render tasks with thumbnails and preset specs', () => {
    const subsetIds = allShotIds.slice(0, 3);
    const preset = BUILT_IN_RENDER_PRESETS[0]; // 4K DCI Master
    const tasks = compileTimelineShotsToBatchTasks(
      INITIAL_SCENES,
      subsetIds,
      [],
      preset,
      'INDIVIDUAL_SHOTS'
    );

    assert.equal(tasks.length, 3);
    assert.equal(tasks[0].status, 'QUEUED');
    assert.equal(tasks[0].resolution, preset.resolution);
    assert.equal(tasks[0].bitrateMbps, preset.bitrateMbps);
    assert.ok(tasks[0].thumbnailUrl);
    assert.ok(tasks[0].title.includes('Shot #'));
  });

  it('compiles selected shots into a single unified master sequence task when UNIFIED_SEQUENCE mode is selected', () => {
    const subsetIds = allShotIds.slice(0, 4);
    const preset = BUILT_IN_RENDER_PRESETS[1]; // 5K Anamorphic Master
    const tasks = compileTimelineShotsToBatchTasks(
      INITIAL_SCENES,
      subsetIds,
      [],
      preset,
      'UNIFIED_SEQUENCE'
    );

    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].shotCount, 4);
    assert.equal(tasks[0].resolution, '5K Anamorphic (5120x2160)');
    assert.ok((tasks[0].shotThumbnails?.length || 0) >= 1);
  });

  it('automates YouTube metadata tagging, 00:00 chapters, and JSON upload manifest from queued shots', () => {
    const subsetIds = allShotIds.slice(0, 3);
    const metadata = generateAutomatedYouTubeMetadata({
      projectTitle: 'PROTOCOL ZERO: SECTOR 4',
      scenes: INITIAL_SCENES,
      characters: INITIAL_CHARACTERS,
      selectedShotIds: subsetIds,
      preset: BUILT_IN_RENDER_PRESETS[0],
      customTags: ['CyberpunkThriller', 'DirectorCut'],
    });

    assert.ok(metadata.seoTitle.includes('PROTOCOL ZERO: SECTOR 4'));
    assert.equal(metadata.selectedShotCount, 3);
    assert.ok(metadata.timestampsText.startsWith('00:00 - Shot #'));
    assert.ok(metadata.youtubeTags.includes('CyberpunkThriller'));
    assert.ok(metadata.youtubeTags.includes('DirectorCut'));
    assert.ok(metadata.hashtags.length > 0);
    assert.equal(metadata.syntheticMediaDisclosure, true);

    const parsedManifest = JSON.parse(metadata.uploadManifestJson);
    assert.equal(parsedManifest.shotCount, 3);
    assert.equal(parsedManifest.chapters.length, 3);
  });
});
