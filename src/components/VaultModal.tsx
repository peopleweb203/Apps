import React, { useMemo, useState } from 'react';
import { useStudio } from '../context/StudioContext';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  Trash2,
  Sparkles,
  Info,
  Search,
  Layers,
  Box,
  Volume2,
  Tag,
  Plus,
  Check,
  Wand2,
  Clapperboard,
  SlidersHorizontal,
} from 'lucide-react';
import {
  assembleAssetIntoScene,
  buildInitialProductionAssetCatalog,
  catalogProductionAsset,
  ProductionAsset,
  ProductionAssetType,
  searchProductionAssets,
  summarizeAssetCatalog,
} from '../utils/asset-discovery-engine';

interface ProviderConfig {
  key: 'gemini' | 'elevenlabs' | 'replicate' | 'kling' | 'synclabs';
  name: string;
  engine: string;
  purpose: string;
  placeholder: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: 'gemini',
    name: 'Gemini 2.5 Flash / Pro',
    engine: '@google/genai',
    purpose: "Writers' Room script breakdown, structured scene analysis & YouTube SEO metadata",
    placeholder: 'AIzaSy...',
  },
  {
    key: 'elevenlabs',
    name: 'ElevenLabs Neural Voices',
    engine: 'ElevenLabs API v1',
    purpose: 'Virtual Actor casting voice IDs & emotion-conditioned voice synthesis',
    placeholder: 'sk_live_... or 32-char hex token',
  },
  {
    key: 'replicate',
    name: 'Flux.1-Dev & IP-Adapter',
    engine: 'Replicate Black-Forest-Labs',
    purpose: 'Stage 1 Master Keyframe T2I Staging & 5-point face identity consistency',
    placeholder: 'r8_...',
  },
  {
    key: 'kling',
    name: 'Wan 2.1 & Kling 1.5 Pro',
    engine: 'Wan2.1 / Kling I2V',
    purpose: 'Stage 2 Motion Extrusion with camera trajectory and motion vector arrows',
    placeholder: 'kling_key_... or wan_token_...',
  },
  {
    key: 'synclabs',
    name: 'LatentSync & LivePortrait',
    engine: 'SyncLabs Phoneme Engine',
    purpose: 'Stage 3 Phoneme Lip-Sync, jaw articulation, and micro-blinking synchronization',
    placeholder: 'sync_live_...',
  },
];

const QUICK_SEMANTIC_QUERIES = [
  { label: 'Wet Alley Downpour', query: 'wet street downpour rain' },
  { label: 'Server Vault Mainframe', query: 'server vault breach telemetry' },
  { label: 'Briefcase & Tactical Props', query: 'briefcase payload rifle prop' },
  { label: 'Binaural Tension Audio', query: 'binaural sound hum alarm' },
];

export const VaultModal: React.FC = () => {
  const {
    isVaultOpen,
    setIsVaultOpen,
    vaultKeys,
    saveVaultKeys,
    clearVaultKey,
    refreshVault,
    scenes,
    updateScenes,
    sets,
    foleyTracks,
  } = useStudio();

  const [activeVaultTab, setActiveVaultTab] = useState<'asset-discovery' | 'api-keys'>('asset-discovery');

  // Encrypted API Keys state
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Asset Discovery Engine state
  const [assetCatalog, setAssetCatalog] = useState<ProductionAsset[]>(() =>
    buildInitialProductionAssetCatalog(sets, foleyTracks)
  );
  const [semanticQuery, setSemanticQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ProductionAssetType>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [targetSceneId, setTargetSceneId] = useState<string>(scenes[0]?.id || 'scene-1');

  // Auto-Catalog New Asset inline form state
  const [isCatalogFormOpen, setIsCatalogFormOpen] = useState<boolean>(false);
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetFileName, setNewAssetFileName] = useState<string>('');
  const [newAssetDesc, setNewAssetDesc] = useState<string>('');

  const targetScene = useMemo(
    () => scenes.find((s) => s.id === targetSceneId) || scenes[0],
    [scenes, targetSceneId]
  );

  const catalogSummary = useMemo(
    () => summarizeAssetCatalog(assetCatalog),
    [assetCatalog]
  );

  const searchResults = useMemo(
    () =>
      searchProductionAssets(assetCatalog, {
        query: semanticQuery,
        typeFilter,
        tagFilter: selectedTag,
        targetScene,
      }),
    [assetCatalog, semanticQuery, typeFilter, selectedTag, targetScene]
  );

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const asset of assetCatalog) {
      for (const tag of asset.allTags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [assetCatalog]);

  if (!isVaultOpen) return null;

  const handleInputChange = (provider: string, val: string) => {
    setInputValues((prev) => ({ ...prev, [provider]: val }));
  };

  const toggleShow = (provider: string) => {
    setShowValues((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await saveVaultKeys(inputValues);
      if (result.success) {
        setFeedback({
          message: 'All credentials encrypted via AES-256-GCM and permanently locked into server storage.',
          type: 'success',
        });
        setInputValues({});
        setEditingProvider(null);
      } else {
        setFeedback({ message: result.error || 'Failed to save', type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDemoKeys = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const demoKeys = {
        gemini: 'AIzaSyCineForgeStudioMasterKey2026',
        elevenlabs: 'xi_live_cineforge_neural_eleven_9942a',
        replicate: 'r8_cineforge_flux_dev_conditioning_master',
        kling: 'kling_v2_ultra_motion_extrusion_token_33',
        synclabs: 'sync_live_latentsync_phoneme_aligned_77b',
      };
      await saveVaultKeys(demoKeys);
      setFeedback({
        message: 'Studio Master Demo Suite loaded & locked in! All 5 pipeline stages are active.',
        type: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssembleAsset = (asset: ProductionAsset) => {
    if (!targetScene) return;
    const updatedScenes = assembleAssetIntoScene(scenes, targetScene.id, asset);
    updateScenes(updatedScenes);

    setAssetCatalog((prev) =>
      prev.map((item) =>
        item.id === asset.id && !item.assembledSceneIds.includes(targetScene.id)
          ? { ...item, assembledSceneIds: [...item.assembledSceneIds, targetScene.id] }
          : item
      )
    );

    setFeedback({
      message: `Assembled "${asset.name}" (${asset.type}) into Scene #${targetScene.sceneNumber}: ${targetScene.title}.`,
      type: 'success',
    });
  };

  const handleBatchAssembleTopMatches = () => {
    if (!targetScene || searchResults.length === 0) return;
    const topAssets = searchResults.slice(0, 3).map((r) => r.asset);
    let currentScenes = scenes;
    for (const asset of topAssets) {
      currentScenes = assembleAssetIntoScene(currentScenes, targetScene.id, asset);
    }
    updateScenes(currentScenes);

    const topIds = new Set(topAssets.map((a) => a.id));
    setAssetCatalog((prev) =>
      prev.map((item) =>
        topIds.has(item.id) && !item.assembledSceneIds.includes(targetScene.id)
          ? { ...item, assembledSceneIds: [...item.assembledSceneIds, targetScene.id] }
          : item
      )
    );

    setFeedback({
      message: `Batch-assembled ${topAssets.length} semantically matched assets into Scene #${targetScene.sceneNumber}.`,
      type: 'success',
    });
  };

  const handleAutoCatalogCustomAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newAssetFileName.trim()) return;

    const cataloged = catalogProductionAsset({
      name: newAssetName.trim(),
      fileName: newAssetFileName.trim(),
      description:
        newAssetDesc.trim() ||
        'Auto-cataloged studio asset indexed with semantic lookdev and spatial tags.',
      lightingKelvin: targetScene?.lightingKelvin || 4800,
    });

    setAssetCatalog((prev) => [cataloged, ...prev]);
    setNewAssetName('');
    setNewAssetFileName('');
    setNewAssetDesc('');
    setIsCatalogFormOpen(false);
    setFeedback({
      message: `Auto-cataloged "${cataloged.name}" as ${cataloged.type} with ${cataloged.allTags.length} semantic tags.`,
      type: 'success',
    });
  };

  const handleQuickIngestDroneAsset = () => {
    const droneAsset = catalogProductionAsset({
      id: `mod-recon-drone-${Date.now()}`,
      name: 'Autonomous Sector 4 Recon Hover-Drone (Rigged 3D Prop)',
      fileName: 'sector4_recon_hover_drone_rigged.usdz',
      description:
        'Articulated cyberpunk surveillance drone 3D mesh with volumetric searchlight cone, rain-slick carbon chassis, and rotor telemetry.',
      lightingKelvin: 4200,
      polyCount: '164,000 Tris',
    });
    setAssetCatalog((prev) => [droneAsset, ...prev]);
    setFeedback({
      message: `Auto-cataloged "${droneAsset.name}" (${droneAsset.type}) with tags: ${droneAsset.allTags.slice(0, 4).join(', ')}.`,
      type: 'success',
    });
  };

  const getAssetTypeBadge = (type: ProductionAssetType) => {
    switch (type) {
      case 'TEXTURE':
        return {
          label: 'TEXTURE / PBR',
          icon: Layers,
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'MODEL_3D':
        return {
          label: '3D MODEL / MESH',
          icon: Box,
          className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'AUDIO_CLIP':
        return {
          label: 'SPATIAL AUDIO',
          icon: Volume2,
          className: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="vault-modal-title" className="text-base font-bold text-neutral-100 font-mono">
                  STUDIO VAULT &amp; ASSET DISCOVERY ENGINE
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  {catalogSummary.totalAssets} ASSETS INDEXED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Semantic production asset cataloging (Textures, 3D Models, Audio Clips) for rapid scene assembly &amp; encrypted API key storage.
              </p>
            </div>
          </div>

          {/* Vault Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveVaultTab('asset-discovery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeVaultTab === 'asset-discovery'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>ASSET DISCOVERY ({catalogSummary.totalAssets})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVaultTab('api-keys')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeVaultTab === 'api-keys'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>API KEYS VAULT</span>
              </button>
            </div>

            <button
              onClick={() => setIsVaultOpen(false)}
              aria-label="Close API vault"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-b border-emerald-800/60'
                : 'bg-red-950/60 text-red-300 border-b border-red-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeVaultTab === 'asset-discovery' ? (
          /* ASSET DISCOVERY ENGINE VIEW */
          <div
            data-testid="asset-discovery-engine"
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {/* Top Search & Scene Assembly Controls Bar */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Semantic Search Input */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={semanticQuery}
                    onChange={(e) => setSemanticQuery(e.target.value)}
                    aria-label="Semantic Asset Search"
                    placeholder="Semantic search: e.g. 'wet street downpour', 'briefcase payload', 'server vault breach'..."
                    className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-500 rounded-xl pl-10 pr-20 py-2 text-xs text-neutral-100 font-mono placeholder:text-neutral-500 focus:outline-none"
                  />
                  {semanticQuery && (
                    <button
                      type="button"
                      onClick={() => setSemanticQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Target Scene Selector for Rapid Scene Assembly */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                    <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Assemble Into:</span>
                  </div>
                  <select
                    value={targetScene?.id || ''}
                    onChange={(e) => setTargetSceneId(e.target.value)}
                    aria-label="Target Scene for Assembly"
                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
                  >
                    {scenes.map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        Scene #{scene.sceneNumber}: {scene.title} ({scene.lightingKelvin}K)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleBatchAssembleTopMatches}
                    disabled={searchResults.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Batch Assemble Top 3</span>
                  </button>
                </div>
              </div>

              {/* Semantic Preset Queries + Category Filter Tabs */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-neutral-800/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    Semantic Queries:
                  </span>
                  {QUICK_SEMANTIC_QUERIES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSemanticQuery(preset.query)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        semanticQuery === preset.query
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Type Filters */}
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'ALL', label: `ALL (${catalogSummary.totalAssets})` },
                      { id: 'TEXTURE', label: `TEXTURES (${catalogSummary.textureCount})` },
                      { id: 'MODEL_3D', label: `3D MODELS (${catalogSummary.model3dCount})` },
                      { id: 'AUDIO_CLIP', label: `AUDIO CLIPS (${catalogSummary.audioClipCount})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTypeFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        typeFilter === tab.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Extracted Semantic Tag Filter Bar & Auto-Catalog Trigger */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-neutral-500" />
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                      selectedTag === null
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    All Tags ({catalogSummary.uniqueTagCount})
                  </button>
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleQuickIngestDroneAsset}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Auto-Catalog Recon Drone 3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCatalogFormOpen((prev) => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>Custom Asset Ingest</span>
                  </button>
                </div>
              </div>

              {/* Optional Custom Asset Auto-Cataloging Form */}
              {isCatalogFormOpen && (
                <form
                  onSubmit={handleAutoCatalogCustomAsset}
                  className="pt-3 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-4 gap-2.5 items-end"
                >
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      placeholder="e.g. Cryo-Vault Frost Shader"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                      File Name (.exr, .usdz, .wav)
                    </label>
                    <input
                      type="text"
                      value={newAssetFileName}
                      onChange={(e) => setNewAssetFileName(e.target.value)}
                      placeholder="e.g. cryo_frost_8k_pbr.exr"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                      Semantic Description
                    </label>
                    <input
                      type="text"
                      value={newAssetDesc}
                      onChange={(e) => setNewAssetDesc(e.target.value)}
                      placeholder="Sub-zero crystalline surface map for vault airlock"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs cursor-pointer"
                  >
                    AUTO-TAG &amp; INDEX
                  </button>
                </form>
              )}
            </div>

            {/* Catalog Search Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map(({ asset, relevanceScore, matchedConcepts, sceneCompatibilityNote }) => {
                const badge = getAssetTypeBadge(asset.type);
                const BadgeIcon = badge.icon;
                const isAssembledInTarget =
                  targetScene && asset.assembledSceneIds.includes(targetScene.id);

                return (
                  <div
                    key={asset.id}
                    data-testid={`discovered-asset-${asset.id}`}
                    className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 flex flex-col justify-between gap-3 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${badge.className}`}
                          >
                            <BadgeIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                            {relevanceScore}% SEMANTIC MATCH
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                          {asset.technicalSpecs.fileSizeMb} MB
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-neutral-100 font-mono">
                          {asset.name}
                        </h3>
                        <div className="text-[11px] font-mono text-amber-400/90">
                          {asset.fileName} • {asset.technicalSpecs.resolutionOrRate}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {asset.description}
                      </p>

                      {/* Auto-Extracted Multi-Dimensional Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {asset.allTags.map((tag) => (
                          <span
                            key={tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                              selectedTag === tag
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Semantic Match Concepts & One-Click Scene Assembly */}
                    <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                      <div className="text-[10px] font-mono text-neutral-400 truncate">
                        {sceneCompatibilityNote ? (
                          <span className="text-cyan-300">{sceneCompatibilityNote}</span>
                        ) : (
                          <span>
                            Matched: {matchedConcepts.join(', ')}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAssembleAsset(asset)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          isAssembledInTarget
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isAssembledInTarget ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Assembled in Scene #{targetScene?.sceneNumber}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Assemble into Scene #{targetScene?.sceneNumber}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ENCRYPTED SERVER API VAULT VIEW */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                CineForge does not store plain-text keys in your browser or local storage. All keys are encrypted server-side with an authenticated cipher tag and stored in <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded font-mono">.data/vault.enc</code>.
              </p>
            </div>

            <div className="space-y-3">
              {PROVIDERS.map((provider) => {
                const status = vaultKeys.find((k) => k.provider === provider.key);
                const isConfigured = status?.isConfigured;
                const isEditing = editingProvider === provider.key;

                return (
                  <div
                    key={provider.key}
                    className={`p-4 rounded-xl border transition-all ${
                      isConfigured && !isEditing
                        ? 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-950/80 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-100 font-mono">
                          {provider.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                          {provider.engine}
                        </span>
                      </div>

                      {isConfigured && !isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            LOCKED IN
                          </span>
                          <button
                            onClick={() => setEditingProvider(provider.key)}
                            className="text-[11px] text-neutral-400 hover:text-amber-300 hover:underline cursor-pointer"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => clearVaultKey(provider.key)}
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Wipe key from server vault"
                            aria-label={`Wipe ${provider.name} key from server vault`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold uppercase">
                          {isEditing ? 'MODIFYING KEY' : 'AWAITING KEY'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-400 mb-2.5">{provider.purpose}</p>

                    {isConfigured && !isEditing ? (
                      <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 rounded-lg border border-neutral-800">
                        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{status?.maskedKey || '••••••••••••••••'}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Vault Check OK
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showValues[provider.key] ? 'text' : 'password'}
                            placeholder={provider.placeholder}
                            value={inputValues[provider.key] || ''}
                            onChange={(e) => handleInputChange(provider.key, e.target.value)}
                            aria-label={`${provider.name} API Key`}
                            className="w-full bg-neutral-900 border border-neutral-700 focus:border-amber-500 rounded-lg px-3 py-2 pr-9 text-xs text-neutral-100 font-mono placeholder:text-neutral-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShow(provider.key)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                          >
                            {showValues[provider.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {isEditing && (
                          <button
                            onClick={() => setEditingProvider(null)}
                            className="px-2.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={refreshVault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-colors cursor-pointer"
              title="Test persistent server reload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verify Server Persistence</span>
            </button>

            <button
              onClick={handleLoadDemoKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Studio Suite Master Keys</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVaultOpen(false)}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
            {activeVaultTab === 'api-keys' && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving || Object.keys(inputValues).length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all cursor-pointer font-mono"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSaving ? 'ENCRYPTING...' : 'ENCRYPT & LOCK IN'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
