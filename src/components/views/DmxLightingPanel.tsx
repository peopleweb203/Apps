import React, { useState, useEffect, useMemo } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  FixtureProfile,
  DmxLightingCue,
  FlickerPattern,
  DEFAULT_STUDIO_FIXTURES,
  INITIAL_DMX_LIGHTING_CUES,
  resolveLightingAtTime,
  buildDmxUniverseFrame,
  exportToDmxCsv,
  exportToArtNetJson,
  exportToQlcPlusXml,
  exportToGrandMaXml,
  rgbToHex,
} from '../../utils/dmx-lighting-protocol';
import {
  Lightbulb,
  Sliders,
  Flame,
  Radio,
  Download,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  Check,
  Copy,
  Clock,
  Eye,
  Settings,
  RefreshCw,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';

export const DmxLightingPanel: React.FC = () => {
  const { currentTime, totalDuration, isPlaying, togglePlay, seek } = useStudio();

  const [fixtures, setFixtures] = useState<FixtureProfile[]>(DEFAULT_STUDIO_FIXTURES);
  const [cues, setCues] = useState<DmxLightingCue[]>(INITIAL_DMX_LIGHTING_CUES);
  const [blackoutOverride, setBlackoutOverride] = useState<boolean>(false);
  const [fullWhiteOverride, setFullWhiteOverride] = useState<boolean>(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(DEFAULT_STUDIO_FIXTURES[0].id);

  // Export drawer state
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'CSV_TIMECODE' | 'ARTNET_JSON' | 'QLC_PLUS_XML' | 'GRAND_MA_XML'>('CSV_TIMECODE');
  const [exportFps, setExportFps] = useState<24 | 25 | 30 | 60>(24);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Compute live fixture states at current timeline second
  const liveStates = useMemo(() => {
    if (blackoutOverride) {
      return fixtures.map((f) => ({
        fixture: f,
        finalIntensityPercent: 0,
        finalKelvin: 4500,
        finalRgb: [0, 0, 0] as [number, number, number],
        hexColor: '#000000',
        dmxChannels: new Array(f.channelFootprint).fill(0),
      }));
    }
    if (fullWhiteOverride) {
      return fixtures.map((f) => ({
        fixture: f,
        finalIntensityPercent: 100,
        finalKelvin: 5600,
        finalRgb: [255, 255, 255] as [number, number, number],
        hexColor: '#ffffff',
        dmxChannels: new Array(f.channelFootprint).fill(255),
      }));
    }
    return resolveLightingAtTime(currentTime, cues, fixtures);
  }, [currentTime, cues, fixtures, blackoutOverride, fullWhiteOverride]);

  // Active DMX Universe byte array for visualizer
  const universeFrame = useMemo(() => {
    return buildDmxUniverseFrame(currentTime, 1, cues, fixtures);
  }, [currentTime, cues, fixtures]);

  // Current active cue on timeline
  const activeCue = useMemo(() => {
    return cues.find((c) => currentTime >= c.timeSec && currentTime <= c.timeSec + c.durationSec) || cues[0];
  }, [currentTime, cues]);

  const selectedFixtureState = liveStates.find((s) => s.fixture.id === selectedFixtureId) || liveStates[0];

  // Helper to format SMPTE Timecode
  const smpte = useMemo(() => {
    const hrs = Math.floor(currentTime / 3600);
    const mins = Math.floor((currentTime % 3600) / 60);
    const secs = Math.floor(currentTime % 60);
    const frames = Math.floor((currentTime % 1) * 24);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }, [currentTime]);

  // Update a fixture parameter on the active cue
  const updateActiveCueFixture = (fixtureId: string, partial: Partial<{
    intensityPercent: number;
    colorTempKelvin: number;
    flickerPattern: FlickerPattern;
    flickerDepthPercent: number;
    flickerSpeedHz: number;
  }>) => {
    if (!activeCue) return;
    setCues((prev) =>
      prev.map((c) => {
        if (c.id !== activeCue.id) return c;
        const currentSt = c.lightingStates[fixtureId] || {
          intensityPercent: 50,
          colorTempKelvin: 4500,
          greenMagentaTint: 0,
          flickerPattern: 'STEADY',
          flickerDepthPercent: 0,
          flickerSpeedHz: 1.0,
        };
        return {
          ...c,
          lightingStates: {
            ...c.lightingStates,
            [fixtureId]: {
              ...currentSt,
              ...partial,
            },
          },
        };
      })
    );
  };

  // Trigger file download
  const handleExportDownload = () => {
    let fileContent = '';
    let fileName = '';
    let mimeType = 'text/plain';

    if (exportFormat === 'CSV_TIMECODE') {
      fileContent = exportToDmxCsv(cues, fixtures, exportFps, totalDuration || 21.0);
      fileName = `CineForge_DMX_Timeline_${exportFps}fps.csv`;
      mimeType = 'text/csv';
    } else if (exportFormat === 'ARTNET_JSON') {
      fileContent = exportToArtNetJson(cues, fixtures, exportFps, totalDuration || 21.0);
      fileName = `CineForge_ArtNet_sACN_Rig.json`;
      mimeType = 'application/json';
    } else if (exportFormat === 'QLC_PLUS_XML') {
      fileContent = exportToQlcPlusXml(cues, fixtures);
      fileName = `CineForge_Studio_Rig.qxw`;
      mimeType = 'application/xml';
    } else if (exportFormat === 'GRAND_MA_XML') {
      fileContent = exportToGrandMaXml(cues, fixtures);
      fileName = `CineForge_GrandMA_Cues.xml`;
      mimeType = 'application/xml';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950/60 p-5 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono tracking-tight text-neutral-100 flex items-center gap-2">
              Automated DMX Lighting Protocol & Physical Rig Sync
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                UNIVERSE 1 ONLINE
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Syncs virtual key/fill/rim CCT color temperatures and procedural flicker waveforms directly to timeline timecode.
            </p>
          </div>
        </div>

        {/* Master Controls & Overrides */}
        <div className="flex items-center gap-2">
          {/* Blackout override */}
          <button
            onClick={() => {
              setBlackoutOverride(!blackoutOverride);
              if (fullWhiteOverride) setFullWhiteOverride(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              blackoutOverride
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Blackout</span>
          </button>

          {/* Full White override */}
          <button
            onClick={() => {
              setFullWhiteOverride(!fullWhiteOverride);
              if (blackoutOverride) setBlackoutOverride(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              fullWhiteOverride
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>All 5600K Full</span>
          </button>

          {/* Export DMX Rig File */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer shadow-lg shadow-amber-950/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export DMX Control File</span>
          </button>
        </div>
      </div>

      {/* Timeline Sync Status Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => seek(0)}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-neutral-500">SMPTE Timecode (24 FPS)</div>
            <div className="text-xl font-bold font-mono text-amber-300">{smpte}</div>
          </div>

          <div className="h-8 w-px bg-neutral-800" />

          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Active Lighting Cue</div>
            <div className="text-xs font-bold font-mono text-neutral-200">{activeCue.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-neutral-400 block">DMX512 Refresh Cadence</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">44.0 Hz Frame Sync</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Visual Lighting Cue Track on Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Timeline Lighting Cues ({cues.length} Keyframe Cues)
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Click Cue to Scrub Timeline Playhead
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {cues.map((cue, idx) => {
            const isActive = activeCue.id === cue.id;
            return (
              <button
                key={cue.id}
                onClick={() => seek(cue.timeSec)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-950/30'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-neutral-400">
                      T+{cue.timeSec.toFixed(1)}s - {(cue.timeSec + cue.durationSec).toFixed(1)}s
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                      Cue {idx + 1}
                    </span>
                  </div>
                  <div className={`text-xs font-bold font-mono mt-1 ${isActive ? 'text-amber-300' : 'text-neutral-200'}`}>
                    {cue.name}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px] font-mono text-neutral-400">
                  <span>Fade: {cue.transitionDurationSec}s</span>
                  <span className="text-amber-400 font-semibold">{cue.durationSec}s Hold</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Deck: Patched Physical Fixtures */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Physical Studio Fixture Patch Deck (Universe 1)
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            {fixtures.length} Fixtures Patched • 40 Channels Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {liveStates.map((st) => {
            const isSelected = selectedFixtureId === st.fixture.id;
            return (
              <div
                key={st.fixture.id}
                onClick={() => setSelectedFixtureId(st.fixture.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-neutral-900 border-amber-500/60 shadow-lg shadow-amber-950/20'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Fixture Top Info */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                      Ch {st.fixture.startChannel}-{st.fixture.startChannel + st.fixture.channelFootprint - 1}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      {st.finalIntensityPercent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="font-mono font-bold text-xs text-neutral-100 mt-2 truncate">
                    {st.fixture.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">{st.fixture.model}</div>
                </div>

                {/* Color Swatch & Kelvin */}
                <div className="flex items-center gap-2.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div
                    className="w-7 h-7 rounded-lg border border-white/20 shadow-inner shrink-0"
                    style={{ backgroundColor: st.hexColor }}
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="text-xs font-mono font-bold text-neutral-200">
                      {st.finalKelvin}K
                    </div>
                    <div className="text-[9px] font-mono text-neutral-400 truncate">
                      RGB: {st.finalRgb.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Active Procedural Pattern Badge */}
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-800">
                  <span className="text-neutral-500">Pattern:</span>
                  <span className="text-amber-400 font-semibold truncate">
                    {activeCue.lightingStates[st.fixture.id]?.flickerPattern || 'STEADY'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Fixture Calibration Deck */}
      {selectedFixtureState && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
                Active Calibration: {selectedFixtureState.fixture.name} ({selectedFixtureState.fixture.model})
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              DMX Base Address: Ch {selectedFixtureState.fixture.startChannel} • Footprint: {selectedFixtureState.fixture.channelFootprint} Channels
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Dimmer / Intensity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">Master Dimmer Intensity</span>
                <span className="text-amber-400 font-bold">
                  {activeCue.lightingStates[selectedFixtureState.fixture.id]?.intensityPercent ?? 50}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={activeCue.lightingStates[selectedFixtureState.fixture.id]?.intensityPercent ?? 50}
                onChange={(e) =>
                  updateActiveCueFixture(selectedFixtureState.fixture.id, {
                    intensityPercent: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>0% (Off)</span>
                <span>50%</span>
                <span>100% (Full)</span>
              </div>
            </div>

            {/* 2. CCT Color Temperature Kelvin Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">Color Temperature (CCT)</span>
                <span className="text-amber-400 font-bold">
                  {activeCue.lightingStates[selectedFixtureState.fixture.id]?.colorTempKelvin ?? 4500}K
                </span>
              </div>
              <input
                type="range"
                min={selectedFixtureState.fixture.cctRange[0]}
                max={selectedFixtureState.fixture.cctRange[1]}
                step="50"
                value={activeCue.lightingStates[selectedFixtureState.fixture.id]?.colorTempKelvin ?? 4500}
                onChange={(e) =>
                  updateActiveCueFixture(selectedFixtureState.fixture.id, {
                    colorTempKelvin: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>{selectedFixtureState.fixture.cctRange[0]}K (Warm Tungsten)</span>
                <span>5600K (Daylight)</span>
                <span>{selectedFixtureState.fixture.cctRange[1]}K (Cool Sky)</span>
              </div>
            </div>

            {/* 3. Procedural Flicker Pattern */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">Procedural Flicker Waveform</span>
                <span className="text-amber-400 font-bold">
                  {activeCue.lightingStates[selectedFixtureState.fixture.id]?.flickerPattern || 'STEADY'}
                </span>
              </div>

              <select
                value={activeCue.lightingStates[selectedFixtureState.fixture.id]?.flickerPattern || 'STEADY'}
                onChange={(e) =>
                  updateActiveCueFixture(selectedFixtureState.fixture.id, {
                    flickerPattern: e.target.value as FlickerPattern,
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="STEADY">STEADY (Constant Output)</option>
                <option value="FIRE_CANDLE">FIRE / CANDLE (Brownian Warm Flicker)</option>
                <option value="TV_SCREEN">TV SCREEN (Cool Cut Shifts & Ambience)</option>
                <option value="FAULTY_NEON">FAULTY NEON (Micro-Stutters & Hum)</option>
                <option value="LIGHTNING_STROBE">LIGHTNING STROBE (High-Speed Burst)</option>
                <option value="POLICE_BEACON">POLICE BEACON (Red / Blue Sweep)</option>
                <option value="MUZZLE_FLASH">MUZZLE FLASH (Instant Peak & Exponential Decay)</option>
                <option value="EXPLOSION_BOOM">EXPLOSION BOOM (Two-Stage Blast & Amber Falloff)</option>
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[9px] font-mono text-neutral-400 block">Depth %</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeCue.lightingStates[selectedFixtureState.fixture.id]?.flickerDepthPercent ?? 50}
                    onChange={(e) =>
                      updateActiveCueFixture(selectedFixtureState.fixture.id, {
                        flickerDepthPercent: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-neutral-400 block">Speed (Hz)</span>
                  <input
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={activeCue.lightingStates[selectedFixtureState.fixture.id]?.flickerSpeedHz ?? 2.0}
                    onChange={(e) =>
                      updateActiveCueFixture(selectedFixtureState.fixture.id, {
                        flickerSpeedHz: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live 512-Channel DMX Universe Heat-Grid Visualizer */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-neutral-200 uppercase">
              Live DMX512 Universe 1 Channel Output Monitor
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Real-Time 8-Bit Channel Values (0-255)
          </span>
        </div>

        {/* 64-Cell Sub-sampled Heat Grid Visualizer */}
        <div className="grid grid-cols-8 sm:grid-cols-16 lg:grid-cols-32 gap-1 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
          {Array.from({ length: 64 }).map((_, idx) => {
            const val = universeFrame[idx] || 0;
            const pct = (val / 255) * 100;
            return (
              <div
                key={idx}
                className="group relative aspect-square rounded flex flex-col items-center justify-center border border-neutral-800 text-[8px] font-mono transition-colors"
                style={{
                  backgroundColor: val > 0 ? `rgba(245, 158, 11, ${Math.max(0.15, val / 255)})` : '#171717',
                  color: val > 128 ? '#000' : '#888',
                }}
              >
                <span>{idx + 1}</span>
                {val > 0 && <span className="font-bold">{val}</span>}

                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-neutral-950 border border-neutral-700 p-1 rounded text-[9px] font-mono text-neutral-200 whitespace-nowrap shadow-xl">
                  Ch {idx + 1}: {val} / 255
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Physical Rig DMX Export Modal / Drawer */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-bold font-mono text-neutral-100">
                  Export Physical Studio DMX Control Rig
                </h4>
              </div>
              <button
                onClick={() => setIsExportOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Generates physical console automation files ready to load into GrandMA2/3, ETC Eos, QLC+, Aputure Sidus Link, or Art-Net/sACN virtual production servers.
            </p>

            {/* Export Format Selector */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-semibold text-neutral-300 block">
                Target DMX Rig File Format:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'CSV_TIMECODE',
                    name: 'GrandMA / Sidus Link CSV',
                    sub: 'Timecode-indexed CSV frame sequence (.csv)',
                  },
                  {
                    id: 'ARTNET_JSON',
                    name: 'Art-Net 4 / sACN Stream',
                    sub: 'Virtual Production 512-hex frame dump (.json)',
                  },
                  {
                    id: 'QLC_PLUS_XML',
                    name: 'QLC+ Studio Workspace',
                    sub: 'Q Light Controller Plus Cue list (.qxw)',
                  },
                  {
                    id: 'GRAND_MA_XML',
                    name: 'GrandMA2/3 Sequence XML',
                    sub: 'SMPTE timecode cue structure (.xml)',
                  },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id as any)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      exportFormat === fmt.id
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold font-mono text-neutral-200">{fmt.name}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{fmt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Rate Selector */}
            <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs font-mono">
              <span className="text-neutral-300">Timecode Frame Rate:</span>
              <div className="flex items-center gap-1.5">
                {[24, 25, 30, 60].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => setExportFps(fps as any)}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                      exportFps === fps
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <span className="text-[10px] font-mono text-neutral-500">
                Duration: {totalDuration || 21.0}s • Universe 1 (Ch 1-40)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExportOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportDownload}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors cursor-pointer shadow-lg shadow-amber-950/30"
                >
                  {downloadSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Download className="w-4 h-4" />}
                  <span>{downloadSuccess ? 'File Downloaded!' : 'Download DMX File'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
