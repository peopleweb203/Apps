import React, { useState, useRef, useMemo } from 'react';
import { useStudio } from '../../context/StudioContext';
import { CharacterProfile, SetLockerPlate } from '../../types';
import { LensType } from '../../utils/stage-math';
import {
  autoCategorizeCharacterAssets,
  filterCharactersByTags,
  computeCharacterTagDistribution,
  MOOD_TAG_OPTIONS,
  OUTFIT_STYLE_TAG_OPTIONS,
  ROLE_CATEGORY_TAG_OPTIONS,
  CharacterMoodTag,
  CharacterOutfitStyleTag,
  CharacterRoleCategoryTag,
} from '../../utils/character-tag-engine';
import { VoiceBenchmarkTool } from './VoiceBenchmarkTool';
import { MultiCamDirectorPanel } from './MultiCamDirectorPanel';
import { ActionCombatPanel } from './ActionCombatPanel';
import { CreatureCastingPanel } from './CreatureCastingPanel';
import { SpatialAudioMixerPanel } from './SpatialAudioMixerPanel';
import { OrchestralScorePanel } from './OrchestralScorePanel';
import { SocioeconomicLifestylePanel } from './SocioeconomicLifestylePanel';
import { HollywoodSetpiecePanel } from './HollywoodSetpiecePanel';
import { CharacterAestheticPanel } from './CharacterAestheticPanel';
import {
  Users,
  Film,
  Compass,
  Volume2,
  Sparkles,
  Camera,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Play,
  RotateCcw,
  Zap,
  Lock,
  Layers,
  Flame,
  Radio,
  Music,
  Crown,
  Car,
  Video,
  FileText,
  Tag,
  Search,
  Filter,
  X,
} from 'lucide-react';

export const CastingSetsView: React.FC = () => {
  const {
    characters,
    sets,
    stageSetup,
    axisAnalysis,
    updateStagePosition,
    setStageLens,
    setReferenceSide,
    addCharacter,
    updateCharacter,
    setActiveTab,
    cinematicConfig,
    updateCinematicConfig,
  } = useStudio();

  const [subTab, setSubTab] = useState<
    | 'stage'
    | 'casting'
    | 'lifestyle'
    | 'setpiece'
    | 'aesthetics'
    | 'creatures'
    | 'props-multicam'
    | 'combat'
    | 'spatial-audio'
    | 'orchestral-score'
    | 'sets'
    | 'benchmark'
  >('stage');
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || 'char-elena');
  const [isAuditioningVoice, setIsAuditioningVoice] = useState<boolean>(false);

  // Character Asset Auto-Tagging & Fast Retrieval Filters
  const [moodFilter, setMoodFilter] = useState<CharacterMoodTag | 'ALL'>('ALL');
  const [outfitStyleFilter, setOutfitStyleFilter] = useState<CharacterOutfitStyleTag | 'ALL'>('ALL');
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<CharacterRoleCategoryTag | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customTagInput, setCustomTagInput] = useState<string>('');

  const filteredCharacters = useMemo(
    () =>
      filterCharactersByTags(characters, {
        mood: moodFilter,
        outfitStyle: outfitStyleFilter,
        roleCategory: roleCategoryFilter,
        searchQuery,
      }),
    [characters, moodFilter, outfitStyleFilter, roleCategoryFilter, searchQuery]
  );

  const tagDistribution = useMemo(
    () => computeCharacterTagDistribution(characters),
    [characters]
  );

  const hasActiveTagFilters =
    moodFilter !== 'ALL' ||
    outfitStyleFilter !== 'ALL' ||
    roleCategoryFilter !== 'ALL' ||
    searchQuery.trim().length > 0;

  const resetAllTagFilters = () => {
    setMoodFilter('ALL');
    setOutfitStyleFilter('ALL');
    setRoleCategoryFilter('ALL');
    setSearchQuery('');
  };

  const selectedChar =
    filteredCharacters.find((c) => c.id === selectedCharId) ||
    characters.find((c) => c.id === selectedCharId) ||
    filteredCharacters[0] ||
    characters[0];

  const selectedCharTags = useMemo(
    () => autoCategorizeCharacterAssets(selectedChar),
    [selectedChar]
  );

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');
    if (!clean || !selectedChar) return;
    const existing = selectedChar.customTags || [];
    if (!existing.includes(clean)) {
      updateCharacter(
        selectedChar.id,
        { customTags: [...existing, clean] },
        `Add Tag #${clean} to ${selectedChar.name}`
      );
    }
    setCustomTagInput('');
  };

  const handleRemoveCustomTag = (tagToRemove: string) => {
    if (!selectedChar) return;
    const next = (selectedChar.customTags || []).filter((t) => t !== tagToRemove);
    updateCharacter(
      selectedChar.id,
      { customTags: next },
      `Remove Tag #${tagToRemove} from ${selectedChar.name}`
    );
  };

  // Stage grid dragging state
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggingToken, setDraggingToken] = useState<'actorA' | 'actorB' | 'camera' | null>(null);

  const handlePointerDown = (token: 'actorA' | 'actorB' | 'camera') => {
    setDraggingToken(token);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingToken || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateStagePosition(draggingToken, { x, y });
  };

  const handlePointerUp = () => {
    setDraggingToken(null);
  };

  const handleAuditionVoice = () => {
    setIsAuditioningVoice(true);
    setTimeout(() => {
      setIsAuditioningVoice(false);
    }, 2800);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950/40">
      {/* Subtab Header */}
      <div className="h-12 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-950/80 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSubTab('stage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'stage'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>180° Spatial Stage</span>
          </button>

          <button
            onClick={() => setSubTab('casting')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'casting'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Actor Casting Bay ({characters.length})</span>
          </button>

          <button
            onClick={() => setSubTab('lifestyle')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'lifestyle'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Lifestyle & Stratum</span>
          </button>

          <button
            onClick={() => setSubTab('setpiece')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'setpiece'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Hollywood Setpieces</span>
          </button>

          <button
            onClick={() => setSubTab('aesthetics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'aesthetics'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Hero Aesthetics</span>
          </button>

          <button
            onClick={() => setSubTab('creatures')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'creatures'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Creatures & Morphology</span>
          </button>

          <button
            onClick={() => setSubTab('props-multicam')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'props-multicam'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Props & Multi-Cam</span>
          </button>

          <button
            onClick={() => setSubTab('combat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'combat'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Matrix Combat</span>
          </button>

          <button
            onClick={() => setSubTab('spatial-audio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'spatial-audio'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spatial Audio & Foley</span>
          </button>

          <button
            onClick={() => setSubTab('orchestral-score')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'orchestral-score'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Orchestral Score</span>
          </button>

          <button
            onClick={() => setSubTab('benchmark')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'benchmark'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Voice Benchmarking</span>
          </button>

          <button
            onClick={() => setSubTab('sets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'sets'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Location Plates ({sets.length})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2 shrink-0">
          <button
            onClick={() =>
              updateCinematicConfig({
                qualityPreset:
                  cinematicConfig.qualityPreset === 'ultra-5k' ? 'master-4k' : 'ultra-5k',
              })
            }
            className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold cursor-pointer transition-all"
            title="Toggle between 4K DCI Master and Ultra 5K Anamorphic"
          >
            {cinematicConfig.qualityPreset === 'ultra-5k' ? '5K ULTRA RAW' : '4K MASTER'}
          </button>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Persistent Pre-Production Assets</span>
        </div>
      </div>

      {/* Persistent Character Asset Auto-Tagging & Fast Retrieval Bar */}
      <div className="border-b border-neutral-800/90 bg-neutral-950/90 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider mr-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Tag Asset Retrieval:</span>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (subTab !== 'casting') setSubTab('casting');
              }}
              placeholder="Search mood, outfit, role, #tag..."
              className="pl-7 pr-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 w-52"
            />
          </div>

          {/* Mood Dropdown */}
          <select
            aria-label="Filter by Mood"
            value={moodFilter}
            onChange={(e) => {
              setMoodFilter(e.target.value as CharacterMoodTag | 'ALL');
              if (subTab !== 'casting') setSubTab('casting');
            }}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="ALL">All Moods ({characters.length})</option>
            {MOOD_TAG_OPTIONS.map((mood) => (
              <option key={mood} value={mood}>
                Mood: {mood} ({tagDistribution.byMood[mood] || 0})
              </option>
            ))}
          </select>

          {/* Outfit Style Dropdown */}
          <select
            aria-label="Filter by Outfit Style"
            value={outfitStyleFilter}
            onChange={(e) => {
              setOutfitStyleFilter(e.target.value as CharacterOutfitStyleTag | 'ALL');
              if (subTab !== 'casting') setSubTab('casting');
            }}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-purple-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
          >
            <option value="ALL">All Outfit Styles ({characters.length})</option>
            {OUTFIT_STYLE_TAG_OPTIONS.map((outfit) => (
              <option key={outfit} value={outfit}>
                Outfit: {outfit} ({tagDistribution.byOutfitStyle[outfit] || 0})
              </option>
            ))}
          </select>

          {/* Role Category Dropdown */}
          <select
            aria-label="Filter by Role"
            value={roleCategoryFilter}
            onChange={(e) => {
              setRoleCategoryFilter(e.target.value as CharacterRoleCategoryTag | 'ALL');
              if (subTab !== 'casting') setSubTab('casting');
            }}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-amber-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="ALL">All Roles ({characters.length})</option>
            {ROLE_CATEGORY_TAG_OPTIONS.map((roleCat) => (
              <option key={roleCat} value={roleCat}>
                Role: {roleCat} ({tagDistribution.byRoleCategory[roleCat] || 0})
              </option>
            ))}
          </select>

          {hasActiveTagFilters && (
            <button
              onClick={resetAllTagFilters}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold cursor-pointer transition-all"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Quick Character Tag Pills */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-400">
            Showing <strong className="text-amber-300">{filteredCharacters.length}</strong> / {characters.length} Assets
          </span>
          <button
            onClick={() => setSubTab('casting')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold cursor-pointer transition-all"
          >
            Open Tagged Roster
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: SPATIAL STAGE LAYOUT (180-DEGREE RULE) */}
        {subTab === 'stage' && (
          <div className="h-full flex gap-6">
            {/* Left 2D Stage Canvas */}
            <div className="flex-1 flex flex-col bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 shadow-xl select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-200">
                    2D Top-Down Soundstage Grid
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    Scale: 1m / grid unit
                  </span>
                </div>

                {/* Real-time 180° status badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
                    axisAnalysis.status === 'OPTIMAL'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : axisAnalysis.status === 'WARNING_ON_LINE'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                      : 'bg-red-950/80 text-red-300 border-red-500/60 animate-bounce'
                  }`}
                >
                  {axisAnalysis.status === 'OPTIMAL' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span>
                    {axisAnalysis.status === 'OPTIMAL'
                      ? 'AXIS LOCKED (180° Respected)'
                      : axisAnalysis.status === 'WARNING_ON_LINE'
                      ? 'HEAD-ON OCCLUSION WARNING'
                      : '180° AXIS CROSSED (Jump Cut Error)'}
                  </span>
                </div>
              </div>

              {/* Interactive Stage Surface */}
              <div
                ref={gridRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="flex-1 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden cursor-crosshair min-h-[420px]"
                style={{
                  backgroundImage: `
                    radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px',
                }}
              >
                {/* Stage Boundaries Label */}
                <div className="absolute top-2 left-3 font-mono text-[10px] text-neutral-600 uppercase">
                  Upstage (North)
                </div>
                <div className="absolute bottom-2 left-3 font-mono text-[10px] text-neutral-600 uppercase">
                  Downstage (Audience / Camera Front)
                </div>

                {/* SVG Overlay for Axis of Action and Camera FOV Frustum */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Axis of Action Line connecting Actor A and Actor B */}
                  <line
                    x1={`${stageSetup.actorA.x}%`}
                    y1={`${stageSetup.actorA.y}%`}
                    x2={`${stageSetup.actorB.x}%`}
                    y2={`${stageSetup.actorB.y}%`}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    className="opacity-90"
                  />

                  {/* Center Line of Action Inflection point */}
                  <circle
                    cx={`${(stageSetup.actorA.x + stageSetup.actorB.x) / 2}%`}
                    cy={`${(stageSetup.actorA.y + stageSetup.actorB.y) / 2}%`}
                    r="4"
                    fill="#f59e0b"
                  />

                  {/* Camera Frustum Field of View lines from camera to scene center */}
                  <line
                    x1={`${stageSetup.camera.x}%`}
                    y1={`${stageSetup.camera.y}%`}
                    x2={`${stageSetup.actorA.x}%`}
                    y2={`${stageSetup.actorA.y}%`}
                    stroke={axisAnalysis.isCrossed ? '#ef4444' : '#38bdf8'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-60"
                  />
                  <line
                    x1={`${stageSetup.camera.x}%`}
                    y1={`${stageSetup.camera.y}%`}
                    x2={`${stageSetup.actorB.x}%`}
                    y2={`${stageSetup.actorB.y}%`}
                    stroke={axisAnalysis.isCrossed ? '#ef4444' : '#38bdf8'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-60"
                  />
                </svg>

                {/* TOKEN 1: ACTOR A */}
                <div
                  onPointerDown={() => handlePointerDown('actorA')}
                  style={{
                    left: `${stageSetup.actorA.x}%`,
                    top: `${stageSetup.actorA.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-cyan-600/90 border-2 border-cyan-300 text-white flex flex-col items-center justify-center shadow-lg shadow-cyan-900/60 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-20"
                >
                  <span className="font-mono text-[10px] font-black">A</span>
                  <span className="text-[8px] font-mono leading-none">Elena</span>
                </div>

                {/* TOKEN 2: ACTOR B */}
                <div
                  onPointerDown={() => handlePointerDown('actorB')}
                  style={{
                    left: `${stageSetup.actorB.x}%`,
                    top: `${stageSetup.actorB.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-purple-600/90 border-2 border-purple-300 text-white flex flex-col items-center justify-center shadow-lg shadow-purple-900/60 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-20"
                >
                  <span className="font-mono text-[10px] font-black">B</span>
                  <span className="text-[8px] font-mono leading-none">Chen</span>
                </div>

                {/* TOKEN 3: CAMERA */}
                <div
                  onPointerDown={() => handlePointerDown('camera')}
                  style={{
                    left: `${stageSetup.camera.x}%`,
                    top: `${stageSetup.camera.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-xl cursor-grab active:cursor-grabbing hover:scale-110 transition-all z-30 border-2 ${
                    axisAnalysis.isCrossed
                      ? 'bg-red-600 border-white text-white animate-pulse shadow-red-900/80'
                      : 'bg-amber-500 border-amber-200 text-neutral-950 shadow-amber-900/60'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[8px] font-mono font-bold leading-none mt-0.5">
                    CAM ({stageSetup.lens})
                  </span>
                </div>

                {/* Axis of Action Floating Tag */}
                <div
                  style={{
                    left: `${(stageSetup.actorA.x + stageSetup.actorB.x) / 2}%`,
                    top: `${(stageSetup.actorA.y + stageSetup.actorB.y) / 2 - 8}%`,
                  }}
                  className="absolute -translate-x-1/2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none"
                >
                  180° LINE OF ACTION
                </div>
              </div>

              {/* Instructions and Controls */}
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                <span className="text-[11px]">
                  💡 <strong>Drag tokens</strong> to reposition Camera, Actor A, or Actor B. Moving the camera behind the dashed line triggers an immediate 180° axis violation warning.
                </span>

                <button
                  onClick={() => {
                    updateStagePosition('actorA', { x: 30, y: 46 });
                    updateStagePosition('actorB', { x: 70, y: 46 });
                    updateStagePosition('camera', { x: 50, y: 76 });
                  }}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Stage to Default</span>
                </button>
              </div>
            </div>

            {/* Right Stage Telemetry & Lens Controls */}
            <div className="w-80 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h3 className="font-mono text-xs font-bold text-neutral-200 uppercase tracking-wider mb-1">
                    Spatial Math & Eye-Lines
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Mathematically calculated screen direction vectors to prevent disorienting reverse cuts.
                  </p>
                </div>

                {/* Analysis Box */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-neutral-500">Camera Angle:</span>
                    <span className="text-amber-300 font-bold">{axisAnalysis.cameraAngleDeg}°</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-neutral-500">Distance to Axis:</span>
                    <span className="text-neutral-200">{axisAnalysis.distanceToAxis}m</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-neutral-500">Actor A Eye-line:</span>
                    <span className="text-cyan-300 font-bold">
                      Looks Screen-{axisAnalysis.eyeLineActorA.screenSide}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-neutral-500">Actor B Eye-line:</span>
                    <span className="text-purple-300 font-bold">
                      Looks Screen-{axisAnalysis.eyeLineActorB.screenSide}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Lens FOV Cone:</span>
                    <span className="text-sky-300 font-bold">{axisAnalysis.fovDeg}°</span>
                  </div>
                </div>

                {/* Explanation Message */}
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    axisAnalysis.isCrossed
                      ? 'bg-red-950/60 border-red-500/50 text-red-200'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <p className="font-semibold text-[11px] mb-1">
                    {axisAnalysis.isCrossed ? '⚠️ AXIS VIOLATION DETECTED' : '✅ CONTINUITY VERIFIED'}
                  </p>
                  <p className="text-[11px]">{axisAnalysis.message}</p>
                </div>

                {/* Focal Length Selector */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2">
                    Camera Lens Focal Length:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['24mm', '35mm', '50mm', '85mm'] as LensType[]).map((lens) => (
                      <button
                        key={lens}
                        onClick={() => setStageLens(lens)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          stageSetup.lens === lens
                            ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                            : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
                        }`}
                      >
                        {lens}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Camera Placements */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2">
                    Cinematic Setup Presets:
                  </label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => updateStagePosition('camera', { x: 38, y: 68 })}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center justify-between"
                    >
                      <span>Over-The-Shoulder Left (A → B)</span>
                      <span className="text-[10px] font-mono text-amber-400">50mm Prime</span>
                    </button>
                    <button
                      onClick={() => updateStagePosition('camera', { x: 62, y: 68 })}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center justify-between"
                    >
                      <span>Over-The-Shoulder Right (B → A)</span>
                      <span className="text-[10px] font-mono text-amber-400">50mm Prime</span>
                    </button>
                    <button
                      onClick={() => updateStagePosition('camera', { x: 50, y: 85 })}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center justify-between"
                    >
                      <span>Wide Two-Shot Master</span>
                      <span className="text-[10px] font-mono text-amber-400">35mm Wide</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VIRTUAL ACTOR CASTING BAY */}
        {subTab === 'casting' && (
          <div className="flex gap-6 h-full">
            {/* Actor List with Auto-Tagging Badges */}
            <div className="w-1/3 space-y-3 overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-neutral-400 font-bold flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Tagged Virtual Roster</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {filteredCharacters.length} / {characters.length} MATCHED
                </span>
              </div>

              {/* Quick Filter Pills inside Actor Casting Bay */}
              <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                    Quick Mood & Style Retrieval
                  </span>
                  {hasActiveTagFilters && (
                    <button
                      onClick={resetAllTagFilters}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {MOOD_TAG_OPTIONS.slice(0, 3).map((mood) => {
                    const active = moodFilter === mood;
                    return (
                      <button
                        key={mood}
                        onClick={() => setMoodFilter(active ? 'ALL' : mood)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                          active
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredCharacters.length === 0 ? (
                <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800 text-center space-y-2">
                  <p className="text-xs font-mono text-neutral-400">
                    No character assets match the active mood, outfit style, or role filters.
                  </p>
                  <button
                    onClick={resetAllTagFilters}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold cursor-pointer"
                  >
                    Reset Tag Filters
                  </button>
                </div>
              ) : (
                filteredCharacters.map((char) => {
                  const isSelected = char.id === selectedChar.id;
                  const tags = autoCategorizeCharacterAssets(char);
                  return (
                    <div
                      key={char.id}
                      onClick={() => setSelectedCharId(char.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-neutral-800/90 border-amber-500/60 shadow-lg'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={char.faceReferences.front}
                          alt={char.name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-neutral-100 truncate">{char.name}</h4>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {char.age} y/o
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-400 truncate">{char.role}</p>
                          <p className="text-[10px] text-neutral-500 truncate font-mono mt-0.5">
                            Voice ID: {char.voiceId.slice(0, 10)}...
                          </p>
                        </div>
                      </div>

                      {/* Auto-Categorized Mood, Outfit Style & Role Badges */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-neutral-800/80">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoodFilter(moodFilter === tags.mood ? 'ALL' : tags.mood);
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold hover:bg-cyan-500/25"
                          title="Click to filter by Mood"
                        >
                          Mood: {tags.mood}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setOutfitStyleFilter(
                              outfitStyleFilter === tags.outfitStyle ? 'ALL' : tags.outfitStyle
                            );
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold hover:bg-purple-500/25"
                          title="Click to filter by Outfit Style"
                        >
                          Outfit: {tags.outfitStyle}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleCategoryFilter(
                              roleCategoryFilter === tags.roleCategory ? 'ALL' : tags.roleCategory
                            );
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold hover:bg-amber-500/25"
                          title="Click to filter by Role Category"
                        >
                          Role: {tags.roleCategory}
                        </span>
                      </div>

                      {/* Extracted #Keywords */}
                      <div className="flex flex-wrap gap-1">
                        {tags.keywords.slice(0, 5).map((kw) => (
                          <span
                            key={kw}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(kw);
                            }}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-amber-300"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Actor Detailed Sheet */}
            <div className="flex-1 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-neutral-100">{selectedChar.name}</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedChar.gender} • {selectedChar.age} Years Old
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      {cinematicConfig.qualityPreset === 'ultra-5k' ? '5K ULTRA READY' : '4K MASTER READY'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-400 mt-0.5">{selectedChar.role}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('writers-room')}
                    className="text-[10px] font-mono px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-950/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cast in Screenplay</span>
                  </button>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>BIOMETRICS & CONTINUITY LOCKED</span>
                  </span>
                </div>
              </div>

              {/* Auto-Categorized Asset Taxonomy & Custom Tag Inspector */}
              <div className="bg-neutral-950/90 p-4 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono uppercase text-amber-300 font-bold">
                      Auto-Categorized Character Asset Taxonomy (Mood • Outfit Style • Role)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Confidence: {selectedCharTags.confidenceScore}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Mood Override Selector */}
                  <div className="bg-neutral-900/90 p-2.5 rounded-lg border border-cyan-500/30">
                    <label className="block text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                      Mood Categorization
                    </label>
                    <select
                      value={selectedCharTags.mood}
                      onChange={(e) =>
                        updateCharacter(
                          selectedChar.id,
                          { moodOverride: e.target.value },
                          `Set ${selectedChar.name} Mood to ${e.target.value}`
                        )
                      }
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {MOOD_TAG_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Outfit Style Override Selector */}
                  <div className="bg-neutral-900/90 p-2.5 rounded-lg border border-purple-500/30">
                    <label className="block text-[10px] font-mono uppercase text-purple-400 font-bold mb-1">
                      Outfit Style Categorization
                    </label>
                    <select
                      value={selectedCharTags.outfitStyle}
                      onChange={(e) =>
                        updateCharacter(
                          selectedChar.id,
                          { outfitStyleOverride: e.target.value },
                          `Set ${selectedChar.name} Outfit Style to ${e.target.value}`
                        )
                      }
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      {OUTFIT_STYLE_TAG_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role Category Override Selector */}
                  <div className="bg-neutral-900/90 p-2.5 rounded-lg border border-amber-500/30">
                    <label className="block text-[10px] font-mono uppercase text-amber-400 font-bold mb-1">
                      Role Categorization
                    </label>
                    <select
                      value={selectedCharTags.roleCategory}
                      onChange={(e) =>
                        updateCharacter(
                          selectedChar.id,
                          { roleCategoryOverride: e.target.value },
                          `Set ${selectedChar.name} Role Category to ${e.target.value}`
                        )
                      }
                      className="w-full px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {ROLE_CATEGORY_TAG_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Semantic & Custom Retrieval Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 mr-1">
                      Retrieval Tags:
                    </span>
                    {selectedCharTags.keywords.map((kw) => {
                      const isCustom = (selectedChar.customTags || []).includes(kw);
                      return (
                        <span
                          key={kw}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isCustom
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                          }`}
                        >
                          <span>#{kw}</span>
                          {isCustom && (
                            <button
                              onClick={() => handleRemoveCustomTag(kw)}
                              className="hover:text-rose-400 cursor-pointer"
                              title="Remove custom tag"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      placeholder="Add custom #tag..."
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 w-36"
                    />
                    <button
                      onClick={handleAddCustomTag}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Tag</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Lock Badges Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block">Biometric Seed:</span>
                    <span className="text-emerald-300 font-bold">#8492041 (ANTI-CLONE)</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block">5-Point Anchors:</span>
                    <span className="text-amber-300 font-bold">0.88 IP-ADAPTER WT</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block">Hero Prop Lock:</span>
                    <span className="text-cyan-300 font-bold">Exo-Dec Pulse Terminal</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block">Wardrobe Wear:</span>
                    <span className="text-orange-300 font-bold">Carbon Jacket (28% Wear)</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block">Virtual Multi-Cam:</span>
                    <span className="text-purple-300 font-bold">A-CAM 24mm / B-CAM 50mm</span>
                  </div>
                </div>

                <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block">Combat Stunt:</span>
                    <span className="text-rose-300 font-bold">Wire-Fu Evasion (90° Shutter)</span>
                  </div>
                </div>
              </div>

              {/* Socioeconomic Stratum & Lifestyle Quick Banner */}
              <div className="bg-gradient-to-r from-amber-950/30 via-neutral-950 to-neutral-950 p-4 rounded-xl border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-200">
                        Socioeconomic Stratum:
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        {selectedChar.id === 'char-chen' ? 'ULTRA-LUXURY ($50M+)' : selectedChar.id === 'char-elena' ? 'WORKING-CLASS (PRACTICAL)' : 'STREET / PRECARIOUS'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                      {selectedChar.id === 'char-chen'
                        ? 'Mercedes-Maybach S680 • Bespoke Savile Row Wool • Rolex Platinum Daytona'
                        : selectedChar.id === 'char-elena'
                        ? '2012 Honda Civic LX • Carhartt Duck Canvas • Casio G-Shock Rugged'
                        : '1998 Beater Sedan • Distressed Thrifted Hoodie • Bare Wrist'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSubTab('lifestyle')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold transition-all cursor-pointer"
                >
                  Configure Lifestyle
                </button>
              </div>

              {/* Signature Wardrobe Conditioning Prompt */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-neutral-400 font-bold">
                  Signature Wardrobe & Conditioning Anchor
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                  {selectedChar.signatureWardrobe}
                </p>
              </div>

              {/* 5-Point Face Reference Staging */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-neutral-300 font-bold">
                    5-Point Facial Conditioning References (IP-Adapter Weights)
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    High consistency across all angles
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Front (0°)', url: selectedChar.faceReferences.front },
                    { label: '3/4 Left (45°)', url: selectedChar.faceReferences.threeQuarterLeft },
                    { label: '3/4 Right (-45°)', url: selectedChar.faceReferences.threeQuarterRight },
                    { label: 'Profile (90°)', url: selectedChar.faceReferences.profile },
                    { label: 'High Angle', url: selectedChar.faceReferences.highAngle },
                  ].map((angle, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-950 rounded-xl border border-neutral-800 p-2 space-y-1.5 text-center group hover:border-amber-500/50 transition-all"
                    >
                      <img
                        src={angle.url}
                        alt={angle.label}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <div className="text-[10px] font-mono text-neutral-400 group-hover:text-amber-300">
                        {angle.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ElevenLabs Neural Voice Profile */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-neutral-200">
                      ElevenLabs Neural Voice Profile
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    ID: {selectedChar.voiceId}
                  </span>
                </div>

                <p className="text-xs italic text-neutral-300">
                  "{selectedChar.voiceSampleText}"
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAuditionVoice}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isAuditioningVoice ? 'PLAYING AUDITION...' : 'Audition Voice Line'}</span>
                    </button>

                    <button
                      onClick={() => setSubTab('benchmark')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-xs border border-neutral-700 hover:border-amber-500/50 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Run 5s Benchmark Test</span>
                    </button>

                    {isAuditioningVoice && (
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-amber-400 animate-bounce" />
                        <span className="w-1 h-5 bg-amber-400 animate-bounce delay-75" />
                        <span className="w-1 h-2 bg-amber-400 animate-bounce delay-150" />
                        <span className="w-1 h-4 bg-amber-400 animate-bounce delay-100" />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400">
                    Voice Latency: 120ms • Neural Resynthesis OK
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SET LOCKER */}
        {subTab === 'sets' && (
          <div className="grid grid-cols-2 gap-6">
            {sets.map((setPlate) => (
              <div
                key={setPlate.id}
                className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4 hover:border-neutral-700 transition-all"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800">
                  <img
                    src={setPlate.plateImageUrl}
                    alt={setPlate.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono text-amber-300 border border-neutral-700">
                    {setPlate.lightingKelvin}K TEMPERATURE
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono text-neutral-300 border border-neutral-700">
                    LENS: {setPlate.recommendedLens}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-neutral-100 font-mono">{setPlate.name}</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {setPlate.description}
                  </p>
                </div>

                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 text-[11px] text-neutral-300">
                  <span className="text-neutral-500 font-mono">Atmosphere: </span>
                  {setPlate.atmosphere}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {setPlate.spatialTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-800/60">
                  <span className="text-[10px] font-mono text-neutral-500">Plate ID: {setPlate.id}</span>
                  <button
                    onClick={() => setActiveTab('writers-room')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold cursor-pointer transition-all"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Feature in Screenplay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: VOICE QUALITY BENCHMARKING */}
        {subTab === 'benchmark' && (
          <VoiceBenchmarkTool initialCharacterId={selectedCharId} />
        )}

        {/* TAB 5: SOCIOECONOMIC LIFESTYLE & WEALTH STRATUM */}
        {subTab === 'lifestyle' && (
          <SocioeconomicLifestylePanel initialCharacterId={selectedCharId} />
        )}

        {/* TAB 6: HOLLYWOOD SETPIECE & VFX STUNT ENGINE */}
        {subTab === 'setpiece' && (
          <HollywoodSetpiecePanel />
        )}

        {/* TAB 7: HERO PHYSIQUE & AESTHETICS */}
        {subTab === 'aesthetics' && (
          <CharacterAestheticPanel />
        )}

        {/* TAB 8: CREATURES & MORPHOLOGY */}
        {subTab === 'creatures' && (
          <CreatureCastingPanel />
        )}

        {/* TAB 9: PROPS & VIRTUAL MULTI-CAM */}
        {subTab === 'props-multicam' && (
          <MultiCamDirectorPanel />
        )}

        {/* TAB 10: MATRIX COMBAT RIG */}
        {subTab === 'combat' && (
          <ActionCombatPanel />
        )}

        {/* TAB 11: SPATIAL AUDIO & PROCEDURAL FOLEY */}
        {subTab === 'spatial-audio' && (
          <SpatialAudioMixerPanel />
        )}

        {/* TAB 12: ORCHESTRAL SCORE & DYNAMIC LEITMOTIFS */}
        {subTab === 'orchestral-score' && (
          <OrchestralScorePanel />
        )}
      </div>
    </div>
  );
};
