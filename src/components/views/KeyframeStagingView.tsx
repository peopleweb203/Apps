import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  Image,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Camera,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const KeyframeStagingView: React.FC = () => {
  const {
    scenes,
    selectedShot,
    selectedShotId,
    setSelectedShotId,
    approveKeyframe,
    regenerateKeyframe,
    setActiveTab,
    characters,
  } = useStudio();

  const [ipAdapterWeight, setIpAdapterWeight] = useState<number>(
    selectedShot?.ipAdapterWeight || 0.88
  );
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  const characterA = characters.find((c) => c.id === selectedShot?.characterAId);
  const characterB = characters.find((c) => c.id === selectedShot?.characterBId);

  const handleRegenerate = async () => {
    if (!selectedShot) return;
    setIsRegenerating(true);
    await regenerateKeyframe(selectedShot.id);
    setIsRegenerating(false);
  };

  const handleApprove = () => {
    if (!selectedShot) return;
    approveKeyframe(selectedShot.id);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950/40">
      {/* Left Keyframe Inspector & Staging Controls */}
      <div className="w-1/2 border-r border-neutral-800 p-6 flex flex-col justify-between bg-neutral-950/60 overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase">
                STAGE 1 PRODUCTION
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Flux.1 Master Keyframe Staging
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500 font-mono">Shot Status:</span>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedShot?.keyframeStatus === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedShot?.keyframeStatus}
              </span>
            </div>
          </div>

          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 leading-relaxed">
            <p>
              💡 <strong>Deterministic Quality Gate:</strong> Never spend compute on video until the still frame composition, lighting, and actor identity are verified. Approving here feeds the frozen latent into Wan 2.1 / Kling for Stage 2 Motion Extrusion.
            </p>
          </div>

          {/* Master Still Preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-black group">
            <img
              src={selectedShot?.approvedKeyframeUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'}
              alt="Keyframe Preview"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-amber-300 border border-neutral-700">
                SHOT #{selectedShot?.shotNumber} • {selectedShot?.shotType}
              </span>
              <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-neutral-300 border border-neutral-700">
                {selectedShot?.focalLength}
              </span>
            </div>

            <div className="absolute bottom-3 right-3">
              <span className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>FLUX.1-DEV [RAW RES 3840×2160]</span>
              </span>
            </div>
          </div>

          {/* IP-Adapter Character Consistency Weight */}
          <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-neutral-200">
                  IP-Adapter Face & Wardrobe Lock Weight
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {ipAdapterWeight.toFixed(2)} / 1.00
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.01"
              value={ipAdapterWeight}
              onChange={(e) => setIpAdapterWeight(parseFloat(e.target.value))}
              aria-label="IP-Adapter Face Lock Weight"
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>0.50 (Loose Staging)</span>
              <span>0.88 (Optimal Cinema Match)</span>
              <span>1.00 (Strict Facial Replica)</span>
            </div>

            {characterA && (
              <div className="text-[11px] text-neutral-300 flex items-center gap-2 pt-1">
                <span className="text-neutral-500">Locked Actor:</span>
                <span className="font-semibold text-neutral-100">{characterA.name}</span>
                <span className="text-[10px] font-mono text-amber-400">({characterA.role})</span>
              </div>
            )}
          </div>

          {/* Flux.1 Conditioning Prompt */}
          <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-300">
                Master Staging Conditioning Prompt
              </span>
              <span className="text-[10px] font-mono text-neutral-500">BFL Flux.1 Format</span>
            </div>
            <p className="text-xs font-mono text-neutral-300 bg-neutral-950 p-3 rounded-lg border border-neutral-800 leading-relaxed">
              {selectedShot?.stillPrompt}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-neutral-800 mt-6 flex items-center justify-between">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'RE-STAGING IN 3S...' : 'Regenerate Still (3s)'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>APPROVE STILL</span>
            </button>

            <button
              onClick={() => setActiveTab('motion-performance')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer font-mono"
            >
              <span>ADVANCE TO MOTION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Stills Approval Gallery */}
      <div className="w-1/2 p-6 flex flex-col overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
              Keyframe Approval Gallery
            </h3>
            <p className="text-xs text-neutral-400">
              All scene master stills in this project. Click any card to inspect and approve.
            </p>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
            {scenes.flatMap((s) => s.shots).length} FRAMES TOTAL
          </span>
        </div>

        <div className="space-y-6">
          {scenes.map((scene) => (
            <div key={scene.id} className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                <span className="text-xs font-mono font-bold text-neutral-300">
                  Scene #{scene.sceneNumber}: {scene.title}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {scene.shots.length} Shots
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {scene.shots.map((shot) => {
                  const isSelected = selectedShotId === shot.id;
                  const isApproved = shot.keyframeStatus === 'APPROVED';

                  return (
                    <div
                      key={shot.id}
                      onClick={() => setSelectedShotId(shot.id)}
                      className={`rounded-xl border overflow-hidden p-2 space-y-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-800/90 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                        <img
                          src={shot.approvedKeyframeUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
                          alt={`Shot ${shot.shotNumber}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-300">
                          #{shot.shotNumber} • {shot.focalLength}
                        </div>
                        <div className="absolute bottom-1.5 right-1.5">
                          {isApproved ? (
                            <span className="bg-emerald-600/90 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              APPROVED
                            </span>
                          ) : (
                            <span className="bg-amber-600/90 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-neutral-950">
                              PENDING
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-1">
                        <div className="text-[11px] font-semibold text-neutral-200 truncate">
                          {shot.shotType}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {shot.cameraAction}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
