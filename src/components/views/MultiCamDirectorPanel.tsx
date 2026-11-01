import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  DEFAULT_MULTICAM_RIG,
  SynchronizedCameraAngle,
  CameraId,
  buildMultiCamCoverage,
  MultiCamCoverageTake,
} from '../../utils/virtual-multicam-rig';
import {
  INITIAL_HERO_PROPS,
  INITIAL_COSTUME_LAYERS,
  HeroPropAsset,
  CostumeLayer,
  buildPropAttentionMaskPrompt,
} from '../../utils/wardrobe-prop-vault';
import {
  Camera,
  Video,
  Layers,
  Lock,
  Unlock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  CheckCircle2,
  Maximize2,
  Zap,
} from 'lucide-react';

export const MultiCamDirectorPanel: React.FC = () => {
  const { characters, selectedShot } = useStudio();

  // Multi-Cam state
  const [cameras, setCameras] = useState<Record<CameraId, SynchronizedCameraAngle>>(DEFAULT_MULTICAM_RIG);
  const [activeCoverageTake, setActiveCoverageTake] = useState<MultiCamCoverageTake | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedCam, setSelectedCam] = useState<CameraId>('cam_a');

  // Prop & Wardrobe state
  const [propsList, setPropsList] = useState<HeroPropAsset[]>(INITIAL_HERO_PROPS);
  const [costumes, setCostumes] = useState<CostumeLayer[]>(INITIAL_COSTUME_LAYERS);

  const handleTogglePropLock = (propId: string) => {
    setPropsList((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, isLocked: !p.isLocked } : p))
    );
  };

  const handleToggleCostumeLock = (layerId: string) => {
    setCostumes((prev) =>
      prev.map((c) => (c.layerId === layerId ? { ...c, isLocked: !c.isLocked } : c))
    );
  };

  const handleSyncCoverage = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const take = buildMultiCamCoverage(selectedShot?.sceneId || 'scene-1', selectedShot?.shotNumber || 1);
      setActiveCoverageTake(take);
      setIsSyncing(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 bg-neutral-950/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Virtual Multi-Camera Rig & Prop Persistence Vault
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                3-CAM SYNC
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Synchronized A/B/C coverage across unified spatial coordinates with hero prop attention masking
            </p>
          </div>
        </div>

        {/* Sync & Coverage Button */}
        <button
          onClick={handleSyncCoverage}
          disabled={isSyncing}
          data-testid="sync-coverage-btn"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 font-mono transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'SYNCHRONIZING 3 CAMERAS...' : 'ONE-CLICK SYNC & COVERAGE'}</span>
        </button>
      </div>

      {/* 3-Camera Setup Grid Viewports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-400" />
            <span>Synchronized Multi-Angle Viewports</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Timecode: 01:00:14:00 • 24.00 fps • 4200K Kelvin Shared Base
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(cameras) as CameraId[]).map((camId) => {
            const cam = cameras[camId];
            const isSelected = selectedCam === camId;

            return (
              <div
                key={cam.id}
                onClick={() => setSelectedCam(cam.id)}
                className={`bg-neutral-900/70 rounded-2xl border p-4 space-y-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500/80 ring-1 ring-amber-500/40 shadow-xl shadow-amber-950/20'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Viewport Header */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-neutral-100">{cam.label}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {cam.focalLengthMm}mm
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SYNCED
                  </span>
                </div>

                {/* Video Monitor Frame */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-800 group">
                  <img
                    src={cam.activeTakeUrl}
                    alt={cam.label}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[8px] font-mono text-amber-300">
                    {cam.role}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[8px] font-mono text-neutral-300">
                    {cam.aperture} • {cam.sensorFormat.split(' ')[0]}
                  </div>
                </div>

                {/* Spatial Coordinates Metadata */}
                <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono text-neutral-400 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                  <div>
                    <span className="text-neutral-500 block">Position:</span>
                    <span>X:{cam.spatialCoordinate.x} Y:{cam.spatialCoordinate.y}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Height:</span>
                    <span>{cam.spatialCoordinate.elevationMeters}m</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Pan:</span>
                    <span>{cam.spatialCoordinate.angleDegrees}°</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prop & Wardrobe Persistence Locker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Hero Prop Locker */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Hero Prop Locker (Anti-Morph)</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Attention Masking</span>
          </div>

          <div className="space-y-3">
            {propsList.map((prop) => (
              <div
                key={prop.id}
                className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={prop.referenceImageUrl}
                    alt={prop.name}
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-neutral-200">{prop.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                        {prop.attentionMaskArea.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-sans mt-0.5">{prop.materialFinish}</p>
                    <span className="text-[9px] font-mono text-neutral-500 block">
                      Anti-Morph: {prop.negativeAntiMorphPrompt.slice(0, 45)}...
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePropLock(prop.id)}
                  className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    prop.isLocked
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-700 hover:text-neutral-300'
                  }`}
                >
                  {prop.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Costume Layering Locker */}
        <div className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Costume & Layer Locker (Wear Persistence)</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">Weathering Anchored</span>
          </div>

          <div className="space-y-3">
            {costumes.map((costume) => (
              <div
                key={costume.layerId}
                className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={costume.referenceImageUrl}
                    alt={costume.name}
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-neutral-200">{costume.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        {costume.slot}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-sans mt-0.5">{costume.materialTexture}</p>
                    <div className="flex items-center gap-2 pt-0.5 text-[9px] font-mono text-neutral-500">
                      <span>Wear: {costume.damageWearPercent}%</span>
                      <div className="flex gap-1">
                        {costume.hexPalette.map((hex, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-neutral-700 inline-block"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleCostumeLock(costume.layerId)}
                  className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    costume.isLocked
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-700 hover:text-neutral-300'
                  }`}
                >
                  {costume.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
