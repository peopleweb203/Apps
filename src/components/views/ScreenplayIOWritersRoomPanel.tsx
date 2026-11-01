import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  ScreenplayScene,
  GeneratedScreenplay,
} from '../../utils/hollywood-screenplay-orchestrator';
import {
  exportToFountain,
  exportToFinalDraftFdx,
  ingestScriptFile,
  IngestTaggingReport,
} from '../../utils/screenplay-io-manager';
import {
  ExternalAiModel,
  VariationPassType,
  WRITERS_ROOM_MODELS,
  generateSceneVariation,
  mergeDialogueOnly,
  ScreenplayVariationResult,
} from '../../utils/multi-model-writers-room';
import {
  FileText,
  Upload,
  Download,
  Bot,
  Sparkles,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Settings,
} from 'lucide-react';

interface Props {
  activeScreenplay: GeneratedScreenplay;
  onUpdateScreenplay?: (updated: GeneratedScreenplay) => void;
  onClose?: () => void;
}

export const ScreenplayIOWritersRoomPanel: React.FC<Props> = ({
  activeScreenplay,
  onUpdateScreenplay,
  onClose,
}) => {
  const [selectedModel, setSelectedModel] = useState<ExternalAiModel>('claude-3-5-sonnet');
  const [selectedPass, setSelectedPass] = useState<VariationPassType>('DIALOGUE_PUNCH_UP');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [activeVariation, setActiveVariation] = useState<ScreenplayVariationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [ingestReport, setIngestReport] = useState<IngestTaggingReport | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string>('');

  const currentScene = activeScreenplay.scenes[selectedSceneIndex] || activeScreenplay.scenes[0];

  // Run Multi-Model Variation Pass
  const handleGenerateVariation = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateSceneVariation(currentScene, selectedModel, selectedPass);
      setActiveVariation(result);
      setIsGenerating(false);
    }, 700);
  };

  // Accept Entire Variation
  const handleAcceptEntireVariation = () => {
    if (!activeVariation || !onUpdateScreenplay) return;
    const updatedScenes = [...activeScreenplay.scenes];
    updatedScenes[selectedSceneIndex] = activeVariation.rewrittenScene;

    onUpdateScreenplay({
      ...activeScreenplay,
      scenes: updatedScenes,
    });
    setActiveVariation(null);
  };

  // Merge Dialogue Only (Keep In-House Action & Engine Directives)
  const handleMergeDialogueOnly = () => {
    if (!activeVariation || !onUpdateScreenplay) return;
    const merged = mergeDialogueOnly(currentScene, activeVariation.rewrittenScene);
    const updatedScenes = [...activeScreenplay.scenes];
    updatedScenes[selectedSceneIndex] = merged;

    onUpdateScreenplay({
      ...activeScreenplay,
      scenes: updatedScenes,
    });
    setActiveVariation(null);
  };

  // File Ingestion Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ingested = ingestScriptFile(file.name, content);
      setIngestReport(ingested.taggingReport);

      if (onUpdateScreenplay && ingested.scenes.length > 0) {
        onUpdateScreenplay({
          ...activeScreenplay,
          title: ingested.title,
          scenes: ingested.scenes,
        });
      }
    };
    reader.readAsText(file);
  };

  // Script Exporters
  const handleExport = (format: 'FOUNTAIN' | 'FDX' | 'JSON') => {
    let content = '';
    let fileName = '';
    let mime = 'text/plain';

    if (format === 'FOUNTAIN') {
      content = exportToFountain(activeScreenplay);
      fileName = `${activeScreenplay.title.replace(/\s+/g, '_')}.fountain`;
      mime = 'text/plain';
    } else if (format === 'FDX') {
      content = exportToFinalDraftFdx(activeScreenplay);
      fileName = `${activeScreenplay.title.replace(/\s+/g, '_')}.fdx`;
      mime = 'application/xml';
    } else {
      content = JSON.stringify(activeScreenplay, null, 2);
      fileName = `${activeScreenplay.title.replace(/\s+/g, '_')}_CineForge_Bundle.json`;
      mime = 'application/json';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(format);
    setTimeout(() => setDownloadSuccess(''), 2500);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono tracking-tight text-neutral-100 flex items-center gap-2">
              Universal Script I/O & Multi-Model Writers Room Bench
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MASTER SENTINEL ACTIVE
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Import/export industry formats (.fdx, .fountain) and generate alternative AI drafts while preserving 4K engine metadata.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 text-xs font-mono p-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Top Grid: Script Import & Export Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Import Hub */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" />
              Ingest External Script
            </span>
            <span className="text-[10px] font-mono text-neutral-500">.fountain • .fdx • .json</span>
          </div>

          <label className="border-2 border-dashed border-neutral-800 hover:border-purple-500/50 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-neutral-900/30">
            <FileText className="w-6 h-6 text-neutral-400" />
            <span className="text-xs font-mono text-neutral-300 font-semibold">
              Drop script file here or click to browse
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              Auto-scans for vehicles, stunts, and acoustics
            </span>
            <input type="file" accept=".fountain,.fdx,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Ingest Report Badge */}
          {ingestReport && (
            <div className="p-3 bg-neutral-900 rounded-lg border border-purple-500/30 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between text-purple-300 font-bold">
                <span>Auto-Tag Ingest Confidence: {ingestReport.confidenceScore}%</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-neutral-400">
                Detected: {ingestReport.detectedVehicles.length} Vehicles, {ingestReport.detectedStunts.length} Stunts, {ingestReport.detectedWardrobeBrands.length} Luxury Brands
              </div>
            </div>
          )}
        </div>

        {/* Export Hub */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              Industry-Standard Script Exporters
            </span>
            <span className="text-[10px] font-mono text-neutral-500">One-Click Download</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'FOUNTAIN', name: 'Fountain (.fountain)', sub: 'Open Industry Syntax' },
              { id: 'FDX', name: 'Final Draft (.fdx)', sub: 'Studio Standard XML' },
              { id: 'JSON', name: 'Master Bundle (.json)', sub: 'Full CineForge Rig' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleExport(btn.id as any)}
                className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="text-xs font-mono font-bold text-neutral-200">
                  {downloadSuccess === btn.id ? 'Downloaded!' : btn.name}
                </div>
                <div className="text-[9px] font-mono text-neutral-500 mt-1">{btn.sub}</div>
              </button>
            ))}
          </div>

          <p className="text-[10px] font-mono text-neutral-500">
            Exports include embedded [[ ENGINE_RIG ]] comment blocks for automated camera, lighting, and audio synchronization.
          </p>
        </div>
      </div>

      {/* Multi-Model Writers Room Dispatcher */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            Writers Room Model Dispatcher (Scene #{selectedSceneIndex + 1})
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">Select Scene:</span>
            <select
              value={selectedSceneIndex}
              onChange={(e) => {
                setSelectedSceneIndex(Number(e.target.value));
                setActiveVariation(null);
              }}
              className="bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {activeScreenplay.scenes.map((s, idx) => (
                <option key={s.id} value={idx}>
                  Scene {idx + 1}: {s.heading.split('-')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Model Selection and Pass Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 block mb-1">Target Model Style:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ExternalAiModel)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {WRITERS_ROOM_MODELS.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10px] font-mono text-neutral-400 block mb-1">Variation Pass Archetype:</span>
            <select
              value={selectedPass}
              onChange={(e) => setSelectedPass(e.target.value as VariationPassType)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="DIALOGUE_PUNCH_UP">Gritty / Hard-Boiled Dialogue Punch-Up</option>
              <option value="EMOTIONAL_SUBTEXT">Subtext & Emotional Tension Polish</option>
              <option value="ACTION_ESCALATION">High-Octane Action & Stunt Escalation</option>
              <option value="COMEDIC_WIT">Comedic & Wit Timing Pass</option>
              <option value="STRUCTURAL_PACING">Structural / Plothole Analysis Pass</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateVariation}
          disabled={isGenerating}
          className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer shadow-lg shadow-purple-950/20 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? 'Generating Writers Room Pass...' : 'Dispatch Scene to Writers Room'}</span>
        </button>
      </div>

      {/* Side-by-Side Diff Inspector */}
      {activeVariation && (
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-neutral-200">
                Side-by-Side Diff: Native Master vs. {activeVariation.sourceModel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {activeVariation.extractedEngineTagsPreserved} Engine Tags Preserved
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Master Original */}
            <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 space-y-2 text-xs font-mono">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                Native In-House Master
              </span>
              <div className="text-neutral-300 space-y-2 max-h-60 overflow-y-auto">
                {currentScene.elements.map((el, idx) => (
                  <div key={idx} className={el.type === 'DIALOGUE' ? 'text-amber-200 pl-4' : 'text-neutral-400'}>
                    {el.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Alternate Model Rewrite */}
            <div className="bg-neutral-900/60 p-3 rounded-xl border border-purple-500/30 space-y-2 text-xs font-mono">
              <span className="text-[10px] font-mono text-purple-300 font-bold uppercase block">
                {activeVariation.sourceModel} ({activeVariation.passType})
              </span>
              <div className="text-neutral-200 space-y-2 max-h-60 overflow-y-auto">
                {activeVariation.rewrittenScene.elements.map((el, idx) => (
                  <div key={idx} className={el.type === 'DIALOGUE' ? 'text-purple-200 font-semibold pl-4' : 'text-neutral-400'}>
                    {el.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Merge Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-[10px] font-mono text-neutral-400">
              Shift: {activeVariation.diffSummary.sentimentShift} • {activeVariation.diffSummary.dialogueChangesCount} Dialogue Changes
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveVariation(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300 cursor-pointer"
              >
                Keep In-House Master
              </button>
              <button
                onClick={handleMergeDialogueOnly}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono cursor-pointer"
              >
                Merge Dialogue Only
              </button>
              <button
                onClick={handleAcceptEntireVariation}
                className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-neutral-950 font-bold text-xs font-mono cursor-pointer"
              >
                Accept Entire Variation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
