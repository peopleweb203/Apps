import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndNormalizeDirectorsCutMetadata,
  resolveShotDirectorsCutMetadata,
  attachDirectorsCutToShotInScenes,
  attachDirectorsCutToBatchShotsInScenes,
  buildDirectorsCutBatchExportSidecar,
  formatDirectorsCutSlateBadge,
  deriveIsoFromFramingState,
  deriveColorGradeProfileFromFramingState,
  captureDirectorsCutFromFramingState,
  autoPopulateAllScenesDirectorsCutFromFraming,
  BUILT_IN_DIRECTORS_CUT_PRESETS,
  createDirectorsCutExportPreset,
  saveDirectorsCutPresetToList,
  deleteDirectorsCutPresetFromList,
  applyDirectorsCutPresetToShot,
  applyDirectorsCutPresetToBatchShots,
} from './directors-cut-engine';
import { INITIAL_SCENES } from '../mock/studio-data';

describe("Director's Cut Cinematic Metadata Utility Engine", () => {
  it('validates and normalizes custom Director Cut metadata fields', () => {
    const meta = validateAndNormalizeDirectorsCutMetadata({
      directorName: '  Denis Villeneuve  ',
      shootingDate: '2026-11-15',
      iso: 1600,
      focalLength: '50',
      colorGradeProfile: 'Teal & Amber Cyber-Noir (ACEScct)',
    });

    assert.equal(meta.directorName, 'Denis Villeneuve');
    assert.equal(meta.shootingDate, '2026-11-15');
    assert.equal(meta.iso, 1600);
    assert.equal(meta.focalLength, '50mm');
    assert.equal(meta.colorGradeProfile, 'Teal & Amber Cyber-Noir (ACEScct)');
  });

  it('resolves default metadata from shot focalLength when no custom metadata is attached yet', () => {
    const shot = INITIAL_SCENES[0].shots[1]; // 50mm shot
    const resolved = resolveShotDirectorsCutMetadata(shot);

    assert.equal(resolved.focalLength, shot.focalLength);
    assert.ok(resolved.directorName.length > 0);
    assert.ok(resolved.iso >= 100);
    assert.ok(resolved.colorGradeProfile.length > 0);
  });

  it('attaches custom Director Cut metadata to an individual timeline shot and syncs optical lens', () => {
    const targetShotId = INITIAL_SCENES[0].shots[0].id;
    const updatedScenes = attachDirectorsCutToShotInScenes(INITIAL_SCENES, targetShotId, {
      directorName: 'Ridley Scott',
      shootingDate: '2026-12-01',
      iso: 3200,
      focalLength: '85mm',
      colorGradeProfile: 'Fujifilm Eterna 500T Bleach Bypass',
    });

    const modifiedShot = updatedScenes[0].shots[0];
    assert.ok(modifiedShot.directorsCut);
    assert.equal(modifiedShot.directorsCut?.directorName, 'Ridley Scott');
    assert.equal(modifiedShot.directorsCut?.shootingDate, '2026-12-01');
    assert.equal(modifiedShot.directorsCut?.iso, 3200);
    assert.equal(modifiedShot.directorsCut?.focalLength, '85mm');
    assert.equal(
      modifiedShot.directorsCut?.colorGradeProfile,
      'Fujifilm Eterna 500T Bleach Bypass'
    );
    assert.equal(modifiedShot.focalLength, '85mm');

    // Other shots remain untouched
    assert.equal(updatedScenes[0].shots[1].directorsCut, undefined);
  });

  it('batch-stamps Director Cut metadata across multiple selected timeline shots', () => {
    const targetIds = ['shot-1', 'shot-4'];
    const updatedScenes = attachDirectorsCutToBatchShotsInScenes(INITIAL_SCENES, targetIds, {
      directorName: 'Chloe Zhao',
      shootingDate: '2026-10-24',
      iso: 1280,
      colorGradeProfile: 'ARRI LogC4 Reveal 709',
    });

    const shot1 = updatedScenes[0].shots[0];
    const shot4 = updatedScenes[1].shots[0];
    assert.equal(shot1.directorsCut?.directorName, 'Chloe Zhao');
    assert.equal(shot1.directorsCut?.iso, 1280);
    assert.equal(shot4.directorsCut?.directorName, 'Chloe Zhao');
    assert.equal(shot4.directorsCut?.colorGradeProfile, 'ARRI LogC4 Reveal 709');
  });

  it('generates a batch export sidecar JSON manifest alongside the video file', () => {
    const sidecar = buildDirectorsCutBatchExportSidecar({
      taskTitle: 'Scene #1 • Shot #1: WIDE ESTABLISHING',
      videoFilename: 'scene_1_shot_1_master',
      resolution: '4K DCI (4096x1716)',
      exportFormat: 'MOV (ProRes 422 HQ)',
      bitrateMbps: 85,
      shots: [
        {
          shotId: 'shot-1',
          shotNumber: 1,
          sceneNumber: 1,
          sceneTitle: 'The Rain-Slick Alleyway Confrontation',
          durationSec: 5,
          shotType: 'WIDE ESTABLISHING',
          cameraAction: 'Slow Dolly-In',
          directorsCut: {
            directorName: 'Roger Deakins / Unit A',
            shootingDate: '2026-10-31',
            iso: 800,
            focalLength: '35mm',
            colorGradeProfile: 'Kodak 2383 Print LUT (D60)',
          },
        },
      ],
    });

    assert.equal(sidecar.sidecarFilename, 'scene_1_shot_1_master.directors-cut.json');
    assert.equal(sidecar.metadataList.length, 1);
    assert.ok(sidecar.summaryLabel.includes('Roger Deakins / Unit A'));
    assert.ok(sidecar.summaryLabel.includes('ISO 800'));

    const parsed = JSON.parse(sidecar.sidecarJson);
    assert.equal(parsed.exportedAlongsideVideoFile, 'scene_1_shot_1_master.mov');
    assert.equal(parsed.shotSlates[0].directorsCutMetadata.directorName, 'Roger Deakins / Unit A');
    assert.equal(parsed.shotSlates[0].directorsCutMetadata.shootingDate, '2026-10-31');
    assert.equal(parsed.shotSlates[0].directorsCutMetadata.iso, 800);
    assert.equal(parsed.shotSlates[0].directorsCutMetadata.focalLength, '35mm');
    assert.equal(
      parsed.shotSlates[0].directorsCutMetadata.colorGradeProfile,
      'Kodak 2383 Print LUT (D60)'
    );
  });

  it('formats a readable slate badge', () => {
    const badge = formatDirectorsCutSlateBadge({
      directorName: 'K. Bigelow',
      shootingDate: '2026-10-31',
      iso: 1600,
      focalLength: '24mm',
      colorGradeProfile: 'Kodak 2383 Print LUT (D60)',
    });
    assert.ok(badge.includes('Dir. K. Bigelow'));
    assert.ok(badge.includes('2026-10-31'));
    assert.ok(badge.includes('ISO 1600'));
    assert.ok(badge.includes('24mm'));
  });

  it('derives ISO and Color Grade Profile directly from live framing state', () => {
    const nightIso = deriveIsoFromFramingState({
      timeOfDay: 'NIGHT',
      lightingKelvin: 3000,
      aperture: 'f/2.8',
      filmGrainIso: 800,
      volumetricHaze: true,
    });
    const dayIso = deriveIsoFromFramingState({
      timeOfDay: 'DAY',
      lightingKelvin: 5600,
      aperture: 'f/1.4',
      filmGrainIso: 400,
      volumetricHaze: false,
    });
    assert.ok(nightIso > dayIso);
    assert.equal(nightIso, 3200);
    assert.equal(dayIso, 400);

    const bleachGrade = deriveColorGradeProfileFromFramingState({
      colorScience: 'bleach-bypass',
      timeOfDay: 'NIGHT',
    });
    assert.equal(bleachGrade, 'Fujifilm Eterna 500T Bleach Bypass');
  });

  it('captures and auto-populates Director Cut metadata and telemetry entry from PlayerCanvas framing state', () => {
    const scene = INITIAL_SCENES[0];
    const shot = scene.shots[0];
    const result = captureDirectorsCutFromFramingState({
      shot,
      scene,
      stageLens: '50mm',
      aperture: 'f/1.8',
      colorScience: 'teal-orange',
      filmGrainIso: 800,
      volumetricHaze: true,
      aspectRatio: '16:9',
      timecode: '00:04',
      axisAnalysis: {
        status: 'OPTIMAL',
        cameraAngleDeg: 32,
        fovDeg: 40,
        distanceToAxis: 18,
      },
      directorNameOverride: 'Christopher Nolan',
      shootingDateOverride: '2026-10-31',
    });

    assert.equal(result.metadata.directorName, 'Christopher Nolan');
    assert.equal(result.metadata.focalLength, shot.focalLength);
    assert.equal(result.metadata.colorGradeProfile, 'Teal & Amber Cyber-Noir (ACEScct)');
    assert.ok(result.metadata.iso >= 800);
    assert.equal(result.logEntry.shotId, shot.id);
    assert.equal(result.logEntry.capturedAtTimecode, '00:04');
    assert.equal(result.logEntry.axisStatus, 'OPTIMAL');
  });

  it('one-click auto-populates all timeline scenes and shots from framing state', () => {
    const { updatedScenes, entries } = autoPopulateAllScenesDirectorsCutFromFraming(
      INITIAL_SCENES,
      {
        stageLens: '35mm',
        aperture: 'f/1.8',
        colorScience: 'kodak-500t',
        filmGrainIso: 800,
        volumetricHaze: true,
        aspectRatio: '16:9',
        timecode: '00:02',
        directorNameOverride: 'Elena Vance',
        shootingDateOverride: '2026-10-31',
      }
    );

    const totalShots = INITIAL_SCENES.reduce((acc, s) => acc + s.shots.length, 0);
    assert.equal(entries.length, totalShots);
    for (const scene of updatedScenes) {
      for (const shot of scene.shots) {
        assert.ok(shot.directorsCut);
        assert.equal(shot.directorsCut?.directorName, 'Elena Vance');
        assert.equal(shot.directorsCut?.focalLength, shot.focalLength);
      }
    }
  });

  it("includes built-in Director's Cut Export Presets for 'Film Noir' and 'Kodak Portra'", () => {
    const filmNoir = BUILT_IN_DIRECTORS_CUT_PRESETS.find((p) => p.name === 'Film Noir');
    const kodakPortra = BUILT_IN_DIRECTORS_CUT_PRESETS.find((p) => p.name === 'Kodak Portra');

    assert.ok(filmNoir, 'Film Noir preset should exist');
    assert.equal(filmNoir?.isBuiltIn, true);
    assert.equal(filmNoir?.metadata.iso, 3200);
    assert.equal(filmNoir?.metadata.focalLength, '35mm');
    assert.equal(filmNoir?.metadata.colorGradeProfile, 'Silver Halide Monochrome Contrast');

    assert.ok(kodakPortra, 'Kodak Portra preset should exist');
    assert.equal(kodakPortra?.isBuiltIn, true);
    assert.equal(kodakPortra?.metadata.iso, 400);
    assert.equal(kodakPortra?.metadata.focalLength, '50mm');
    assert.equal(kodakPortra?.metadata.colorGradeProfile, 'Kodak Portra 400 Warm Halation');
  });

  it('creates, saves, and deletes custom Director Cut Export Presets while protecting built-ins', () => {
    const customPreset = createDirectorsCutExportPreset({
      name: 'Bleach Bypass Desert',
      styleTag: 'BLEACH 85MM',
      metadata: {
        directorName: 'George Miller',
        shootingDate: '2026-11-20',
        iso: 1280,
        focalLength: '85mm',
        colorGradeProfile: 'Fujifilm Eterna 500T Bleach Bypass',
      },
    });

    assert.equal(customPreset.name, 'Bleach Bypass Desert');
    assert.equal(customPreset.isBuiltIn, false);
    assert.equal(customPreset.metadata.directorName, 'George Miller');
    assert.equal(customPreset.metadata.iso, 1280);
    assert.equal(customPreset.metadata.focalLength, '85mm');

    const withSaved = saveDirectorsCutPresetToList(BUILT_IN_DIRECTORS_CUT_PRESETS, customPreset);
    assert.equal(withSaved.length, BUILT_IN_DIRECTORS_CUT_PRESETS.length + 1);

    // Attempting to delete a built-in preset keeps it intact
    const afterBuiltinDeleteAttempt = deleteDirectorsCutPresetFromList(
      withSaved,
      'dc-preset-film-noir'
    );
    assert.equal(afterBuiltinDeleteAttempt.length, withSaved.length);

    // Deleting the custom preset removes it
    const afterCustomDelete = deleteDirectorsCutPresetFromList(withSaved, customPreset.id);
    assert.equal(afterCustomDelete.length, BUILT_IN_DIRECTORS_CUT_PRESETS.length);
  });

  it("applies 'Film Noir' and 'Kodak Portra' presets to individual and batch timeline shots", () => {
    const filmNoir = BUILT_IN_DIRECTORS_CUT_PRESETS.find((p) => p.name === 'Film Noir')!;
    const kodakPortra = BUILT_IN_DIRECTORS_CUT_PRESETS.find((p) => p.name === 'Kodak Portra')!;

    const afterSingleShot = applyDirectorsCutPresetToShot(INITIAL_SCENES, 'shot-1', filmNoir);
    const shot1 = afterSingleShot[0].shots[0];
    assert.equal(shot1.directorsCut?.iso, 3200);
    assert.equal(shot1.directorsCut?.focalLength, '35mm');
    assert.equal(shot1.directorsCut?.colorGradeProfile, 'Silver Halide Monochrome Contrast');

    const afterBatch = applyDirectorsCutPresetToBatchShots(
      afterSingleShot,
      ['shot-2', 'shot-3'],
      kodakPortra
    );
    const shot2 = afterBatch[0].shots[1];
    const shot3 = afterBatch[0].shots[2];
    assert.equal(shot2.directorsCut?.iso, 400);
    assert.equal(shot2.directorsCut?.focalLength, '50mm');
    assert.equal(shot2.directorsCut?.colorGradeProfile, 'Kodak Portra 400 Warm Halation');
    assert.equal(shot3.directorsCut?.colorGradeProfile, 'Kodak Portra 400 Warm Halation');
  });
});

