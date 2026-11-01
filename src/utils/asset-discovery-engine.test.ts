import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assembleAssetIntoScene,
  buildInitialProductionAssetCatalog,
  catalogProductionAsset,
  searchProductionAssets,
  summarizeAssetCatalog,
} from './asset-discovery-engine';
import { INITIAL_SCENES, INITIAL_SETS, INITIAL_FOLEY_TRACKS } from '../mock/studio-data';

test('catalogProductionAsset automatically classifies asset types and assigns multi-dimensional tags', () => {
  const textureAsset = catalogProductionAsset({
    name: 'Oxidized Cybernetic Conduit 8K Surface',
    fileName: 'cyber_conduit_rust_8k_pbr.exr',
    description: 'High-detail wet metallic normal and roughness map for neon alley conduits.',
  });

  assert.equal(textureAsset.type, 'TEXTURE');
  assert.ok(textureAsset.autoTags.environment.includes('cyberpunk-urban'));
  assert.ok(textureAsset.autoTags.materialOrAcoustics.includes('pbr-8k-surface'));
  assert.ok(textureAsset.allTags.length >= 4);

  const modelAsset = catalogProductionAsset({
    name: 'Autonomous Recon Hover Drone',
    fileName: 'recon_hover_drone_rigged.usdz',
    description: 'Rigged 3D mesh with articulated thrusters for night alley patrol.',
  });
  assert.equal(modelAsset.type, 'MODEL_3D');

  const audioAsset = catalogProductionAsset({
    name: 'Sub-Grid Transformer Arcing Loop',
    fileName: 'subgrid_transformer_hum_96k.wav',
    description: 'Binaural spatial audio loop with deep sub-bass drone for industrial dispatch vault.',
  });
  assert.equal(audioAsset.type, 'AUDIO_CLIP');
  assert.ok(audioAsset.autoTags.materialOrAcoustics.includes('binaural-spatial-audio'));
});

test('buildInitialProductionAssetCatalog populates textures, 3D models, and audio clips', () => {
  const catalog = buildInitialProductionAssetCatalog(INITIAL_SETS, INITIAL_FOLEY_TRACKS);
  const summary = summarizeAssetCatalog(catalog);

  assert.ok(summary.textureCount >= 4, 'Should catalog at least 4 textures');
  assert.ok(summary.model3dCount >= 4, 'Should catalog at least 4 3D models');
  assert.ok(summary.audioClipCount >= 4, 'Should catalog at least 4 audio clips');
  assert.equal(
    summary.totalAssets,
    summary.textureCount + summary.model3dCount + summary.audioClipCount
  );
});

test('searchProductionAssets performs semantic concept expansion across natural language queries', () => {
  const catalog = buildInitialProductionAssetCatalog(INITIAL_SETS, INITIAL_FOLEY_TRACKS);

  // Searching "wet street downpour" should semantically retrieve wet asphalt texture and rain binaural audio
  const rainResults = searchProductionAssets(catalog, {
    query: 'wet street downpour',
  });
  assert.ok(rainResults.length >= 2);
  assert.ok(
    rainResults.some((r) => r.asset.id === 'tex-wet-asphalt-8k'),
    'Should match Sector 4 Rain-Slick Asphalt texture via semantic expansion'
  );
  assert.ok(
    rainResults.some((r) => r.asset.id === 'aud-torrential-rain-binaural'),
    'Should match Torrential Downpour audio clip via semantic expansion'
  );

  // Filtering by MODEL_3D + searching "briefcase payload" should retrieve the Silver Neural Shard Transport Case
  const propResults = searchProductionAssets(catalog, {
    query: 'briefcase payload',
    typeFilter: 'MODEL_3D',
  });
  assert.ok(propResults.length >= 1);
  assert.equal(propResults[0].asset.id, 'mod-neural-transport-case');
});

test('assembleAssetIntoScene enriches target scene screenplay notes and shot prompts with asset conditioning', () => {
  const catalog = buildInitialProductionAssetCatalog(INITIAL_SETS, INITIAL_FOLEY_TRACKS);
  const targetAsset = catalog.find((a) => a.id === 'mod-biometric-server-rack')!;
  const targetSceneId = INITIAL_SCENES[1].id;

  const updatedScenes = assembleAssetIntoScene(INITIAL_SCENES, targetSceneId, targetAsset);
  const updatedScene = updatedScenes.find((s) => s.id === targetSceneId)!;

  assert.ok(
    updatedScene.screenplayNotes.includes(targetAsset.name),
    'Scene notes should record assembled asset'
  );
  assert.ok(
    updatedScene.shots.every((shot) => shot.stillPrompt.includes(targetAsset.fileName)),
    'Every shot in the scene should receive 3D asset conditioning'
  );
});
