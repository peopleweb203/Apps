import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  Youtube,
  Download,
  Copy,
  CheckCircle2,
  Sparkles,
  Tag,
  Plus,
  X,
  FileJson,
  ShieldCheck,
} from 'lucide-react';

export const YouTubePublisherView: React.FC = () => {
  const {
    thumbnails,
    selectedThumbnailId,
    setSelectedThumbnailId,
    automatedYouTubeMetadata,
    customYouTubeTags,
    addCustomYouTubeTag,
    removeCustomYouTubeTag,
    queueSelectedTimelineShotsForExport,
    activeRenderPreset,
  } = useStudio();

  const [hasCopied, setHasCopied] = useState(false);
  const [hasCopiedManifest, setHasCopiedManifest] = useState(false);
  const [resolution, setResolution] = useState<'5K' | '4K' | '1080P'>('4K');
  const [fps, setFps] = useState<'24' | '60'>('24');
  const [codec, setCodec] = useState<'H265' | 'PRORES'>('H265');
  const [isRendering, setIsRendering] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleCopyMetadata = () => {
    const textToCopy = `${automatedYouTubeMetadata.seoTitle}\n\n${automatedYouTubeMetadata.description}`;
    navigator.clipboard.writeText(textToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleCopyManifestJson = () => {
    navigator.clipboard.writeText(automatedYouTubeMetadata.uploadManifestJson);
    setHasCopiedManifest(true);
    setTimeout(() => setHasCopiedManifest(false), 2500);
  };

  const handleAddTag = () => {
    if (!customTagInput.trim()) return;
    addCustomYouTubeTag(customTagInput);
    setCustomTagInput('');
  };

  const handleRenderMaster = () => {
    setIsRendering(true);
    queueSelectedTimelineShotsForExport({
      openQueueDrawer: true,
      navigateToYouTubePublisher: false,
    });
    setTimeout(() => {
      setIsRendering(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950/40">
      {/* Left Column: 3 High-CTR Thumbnail Variants & Export Settings */}
      <div className="w-1/2 border-r border-neutral-800 p-6 flex flex-col justify-between overflow-y-auto bg-neutral-950/60">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100 font-mono">
                YouTube 4K / 5K Packaging & Thumbnails
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
              {automatedYouTubeMetadata.selectedShotCount} TIMELINE SHOTS SYNCED
            </span>
          </div>

          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 leading-relaxed flex items-center justify-between gap-3">
            <p>
              High-CTR thumbnails and automated YouTube metadata synchronized from your selected TimelineView shots ({automatedYouTubeMetadata.selectedShotCount} shots • {automatedYouTubeMetadata.totalDurationSec}s runtime).
            </p>
            <span className="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AI Disclosure Ready</span>
            </span>
          </div>

          {/* 3 High-CTR Thumbnail Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-neutral-200">
                AI Reaction Keyframe Thumbnails (Select Active):
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                CTR Model Tested
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {thumbnails.map((thumb) => {
                const isSelected = thumb.id === selectedThumbnailId;

                return (
                  <div
                    key={thumb.id}
                    onClick={() => setSelectedThumbnailId(thumb.id)}
                    className={`rounded-xl border overflow-hidden transition-all cursor-pointer group flex flex-col ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-500 shadow-xl ring-2 ring-amber-500/50'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Visual Thumbnail Frame */}
                    <div className="relative aspect-video overflow-hidden bg-black">
                      <img
                        src={thumb.keyframeUrl}
                        alt="Thumbnail Variant"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* YouTube Title Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 text-center">
                        <span className="font-black text-xs uppercase tracking-tight text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-tight">
                          {thumb.overlayText}
                        </span>
                        <span className="text-[8px] font-mono font-bold text-white/90 drop-shadow-sm">
                          {thumb.subText}
                        </span>
                      </div>

                      <div className="absolute top-1.5 left-1.5 bg-red-600 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase font-mono">
                        {thumb.badge}
                      </div>
                    </div>

                    <div className="p-2 flex items-center justify-between text-[10px] font-mono bg-neutral-950/80">
                      <span className="text-neutral-400">CTR Prediction:</span>
                      <span className="text-emerald-400 font-bold">{thumb.ctrScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4K / 5K Render Presets */}
          <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-200">
                Master Render & Codec Specifications
              </span>
              <span className="text-[10px] font-mono text-amber-300">
                Active Preset: {activeRenderPreset.name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  Resolution:
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  aria-label="Master Render Resolution"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="5K">5K Anamorphic (5120×2160)</option>
                  <option value="4K">4K UHD (3840×2160)</option>
                  <option value="1080P">1080P Full HD</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  Framerate:
                </label>
                <select
                  value={fps}
                  onChange={(e) => setFps(e.target.value as any)}
                  aria-label="Master Render Framerate"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="24">24.00 FPS (Cinematic)</option>
                  <option value="60">60.00 FPS (Smooth)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  Master Codec:
                </label>
                <select
                  value={codec}
                  onChange={(e) => setCodec(e.target.value as any)}
                  aria-label="Master Render Codec"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="H265">H.265 / HEVC 10-Bit</option>
                  <option value="PRORES">Apple ProRes 422 HQ</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px] font-mono text-neutral-400">
              <span>Estimated Batch Package Size ({automatedYouTubeMetadata.selectedShotCount} Shots):</span>
              <span className="text-amber-400 font-bold">
                ~{automatedYouTubeMetadata.estimatedFileSizeMb} MB
              </span>
            </div>
          </div>
        </div>

        {/* Master Render Button */}
        <div className="pt-4 border-t border-neutral-800 mt-6 flex justify-end">
          <button
            onClick={handleRenderMaster}
            disabled={isRendering}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-red-900/40 transition-all cursor-pointer font-mono"
          >
            <Download className="w-4 h-4" />
            <span>QUEUE & EXPORT 4K/5K MASTER PACKAGE ({automatedYouTubeMetadata.selectedShotCount} SHOTS)</span>
          </button>
        </div>
      </div>

      {/* Right Column: Automated YouTube SEO Metadata, Tags & Shot Timestamps */}
      <div className="w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-neutral-950/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100 font-mono">
                Automated YouTube SEO Metadata & Shot Chapters
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyManifestJson}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                  hasCopiedManifest
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border-neutral-700'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>{hasCopiedManifest ? 'JSON Copied!' : 'Export JSON Manifest'}</span>
              </button>

              <button
                onClick={handleCopyMetadata}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  hasCopied
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
              >
                {hasCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopied ? 'COPIED TO CLIPBOARD!' : 'Copy YouTube Metadata'}</span>
              </button>
            </div>
          </div>

          {/* YouTube Video Title */}
          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
              Optimized YouTube Video Title:
            </span>
            <div className="text-sm font-bold text-neutral-100 font-mono select-all">
              {automatedYouTubeMetadata.seoTitle}
            </div>
          </div>

          {/* Automated YouTube Search Tags */}
          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Automated YouTube Search Tags ({automatedYouTubeMetadata.youtubeTags.length})</span>
              </span>
              <span className="text-[10px] font-mono text-amber-300">
                Auto-Tagged from Cast, Lenses & Engines
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {automatedYouTubeMetadata.youtubeTags.map((tag) => {
                const isCustom = customYouTubeTags.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                      isCustom
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                    }`}
                  >
                    <span>#{tag}</span>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => removeCustomYouTubeTag(tag)}
                        className="hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add custom YouTube upload tag..."
                className="flex-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>
          </div>

          {/* YouTube Timestamps Box */}
          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                Shot-Accurate Chapter Timestamps (00:00 Compliant):
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {automatedYouTubeMetadata.chapterMarkers.length} Chapters Auto-Indexed
              </span>
            </div>
            <pre className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs font-mono text-amber-300 leading-relaxed select-all max-h-28 overflow-y-auto">
              {automatedYouTubeMetadata.timestampsText}
            </pre>
          </div>

          {/* Full YouTube Description */}
          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
              Full Video Description, Cast Locks & Attribution Tags:
            </span>
            <textarea
              readOnly
              value={automatedYouTubeMetadata.description}
              aria-label="Full Video Description and Attribution Tags"
              className="w-full h-36 bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300 resize-none leading-relaxed focus:outline-none select-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
