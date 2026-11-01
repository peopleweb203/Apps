import React from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { PlayerCanvas } from './components/PlayerCanvas';
import { VaultModal } from './components/VaultModal';
import { RenderQueueDrawer } from './components/RenderQueueDrawer';
import { HardwareHealthMonitor } from './components/HardwareHealthMonitor';
import { WritersRoomView } from './components/views/WritersRoomView';
import { CastingSetsView } from './components/views/CastingSetsView';
import { BackgroundWorldEngine } from './components/views/BackgroundWorldEngine';
import { ProductionContinuityPanel } from './components/views/ProductionContinuityPanel';
import { MultiCamDirectorPanel } from './components/views/MultiCamDirectorPanel';
import { ActionCombatPanel } from './components/views/ActionCombatPanel';
import { LipSyncMorphologyPanel } from './components/views/LipSyncMorphologyPanel';
import { SpatialAudioMixerPanel } from './components/views/SpatialAudioMixerPanel';
import { OrchestralScorePanel } from './components/views/OrchestralScorePanel';
import { SocioeconomicLifestylePanel } from './components/views/SocioeconomicLifestylePanel';
import { HollywoodSetpiecePanel } from './components/views/HollywoodSetpiecePanel';
import { DmxLightingPanel } from './components/views/DmxLightingPanel';
import { CinematographyControls } from './components/views/CinematographyControls';
import { KeyframeStagingView } from './components/views/KeyframeStagingView';
import { MotionPerformanceView } from './components/views/MotionPerformanceView';
import { TimelineView } from './components/views/TimelineView';
import { YouTubePublisherView } from './components/views/YouTubePublisherView';
import { ProductionAnalyticsView } from './components/views/ProductionAnalyticsView';
import { SelfHealingDashboard } from './components/views/SelfHealingDashboard';

const StudioMain: React.FC = () => {
  const { activeTab, setActiveTab, cinematicConfig, setCinematicConfig, selectedShot } = useStudio();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Global Topbar */}
      <Topbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Studio Sidebar */}
        <Sidebar />

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          {/* Top Stage: Live Preview Canvas (Video, Dynamic Subtitles, Camera HUD, Transport) */}
          <div className="h-[44%] p-3 pb-1.5 flex flex-col min-h-[270px]">
            <PlayerCanvas />
          </div>

          {/* Bottom Stage: Active Studio Production View */}
          <div className="flex-1 overflow-hidden px-3 pt-1.5 pb-1.5 flex flex-col">
            <div className="flex-1 bg-neutral-900/40 rounded-2xl border border-neutral-800/80 overflow-hidden flex flex-col shadow-inner">
              {activeTab === 'writers-room' && <WritersRoomView />}
              {activeTab === 'casting-sets' && <CastingSetsView />}
              {activeTab === 'crowd-world' && <BackgroundWorldEngine />}
              {activeTab === 'continuity' && <ProductionContinuityPanel />}
              {activeTab === 'multicam' && <MultiCamDirectorPanel />}
              {activeTab === 'combat' && <ActionCombatPanel />}
              {activeTab === 'morphology' && <LipSyncMorphologyPanel />}
              {activeTab === 'spatial-audio' && <SpatialAudioMixerPanel />}
              {activeTab === 'orchestral-score' && <OrchestralScorePanel />}
              {activeTab === 'lifestyle' && <SocioeconomicLifestylePanel />}
              {activeTab === 'hollywood-setpiece' && <HollywoodSetpiecePanel />}
              {activeTab === 'dmx-lighting' && <DmxLightingPanel />}
              {activeTab === 'keyframe-staging' && <KeyframeStagingView />}
              {activeTab === 'motion-performance' && <MotionPerformanceView />}
              {activeTab === 'cinematography' && (
                <div className="p-4 overflow-y-auto h-full">
                  <CinematographyControls
                    config={cinematicConfig}
                    onChange={setCinematicConfig}
                    rawPrompt={selectedShot?.stillPrompt || 'Elena in rain-slick cyber alleyway'}
                  />
                </div>
              )}
              {activeTab === 'timeline' && <TimelineView />}
              {activeTab === 'youtube-publisher' && <YouTubePublisherView />}
              {activeTab === 'analytics' && <ProductionAnalyticsView />}
              {activeTab === 'self-healing' && <SelfHealingDashboard />}
            </div>
          </div>

          {/* Bottom Studio Panel: Real-Time Hardware Health Monitor & 4K Sparklines */}
          <HardwareHealthMonitor />
        </main>
      </div>

      {/* Global Encrypted Server Vault Modal */}
      <VaultModal />

      {/* Background Render & Compute Queue Drawer */}
      <RenderQueueDrawer />
    </div>
  );
};

export default function App() {
  return (
    <StudioProvider>
      <StudioMain />
    </StudioProvider>
  );
}
