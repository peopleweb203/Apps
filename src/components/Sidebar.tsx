import React from 'react';
import { useStudio } from '../context/StudioContext';
import { StudioTab } from '../types';
import {
  FileText,
  Users,
  Image,
  Video,
  Clock,
  Youtube,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  BarChart3,
  Camera,
  Globe,
  Flame,
  Mic,
  Volume2,
  Music,
  Crown,
  Lightbulb,
  Activity,
} from 'lucide-react';

interface NavItem {
  id: StudioTab;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  stageNumber?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'writers-room',
    label: "Writers' Room",
    subLabel: 'Script to Shot List',
    icon: FileText,
  },
  {
    id: 'casting-sets',
    label: 'Casting & Sets',
    subLabel: '180° Spatial Stage & Bay',
    icon: Users,
  },
  {
    id: 'crowd-world',
    label: 'Crowd & World Engine',
    subLabel: '100+ Agents & Depth LOD',
    icon: Globe,
    stageNumber: 'WORLD',
  },
  {
    id: 'continuity',
    label: 'Continuity & Cast Lock',
    subLabel: 'Anti-Drift & World Plates',
    icon: ShieldCheck,
    stageNumber: 'VAULT',
  },
  {
    id: 'multicam',
    label: 'Multi-Cam Director',
    subLabel: '3-Camera Coverage Rig',
    icon: Camera,
    stageNumber: 'RIG',
  },
  {
    id: 'combat',
    label: 'Matrix Combat Rig',
    subLabel: '90° Shutter & Speed Ramp',
    icon: Flame,
    stageNumber: 'ACTION',
  },
  {
    id: 'morphology',
    label: 'Jaw Morphology',
    subLabel: 'Non-Human Lip-Sync',
    icon: Mic,
    stageNumber: 'VISEME',
  },
  {
    id: 'spatial-audio',
    label: 'Spatial Audio & Foley',
    subLabel: '3D Binaural IR Mixer',
    icon: Volume2,
    stageNumber: 'AUDIO',
  },
  {
    id: 'orchestral-score',
    label: 'Orchestral Score',
    subLabel: 'Leitmotifs & Tension',
    icon: Music,
    stageNumber: 'SCORE',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Stratum',
    subLabel: 'Vehicles, Brands & Jewelry',
    icon: Crown,
    stageNumber: 'STYLE',
  },
  {
    id: 'hollywood-setpiece',
    label: 'Hollywood Setpieces',
    subLabel: 'Extreme Physics & VFX',
    icon: Flame,
    stageNumber: 'STUNT',
  },
  {
    id: 'dmx-lighting',
    label: 'DMX Studio Lighting',
    subLabel: 'Physical Rig & Timecode Sync',
    icon: Lightbulb,
    stageNumber: 'DMX512',
  },
  {
    id: 'keyframe-staging',
    label: 'Keyframe Staging',
    subLabel: 'Flux.1 Stills Approval',
    icon: Image,
    stageNumber: 'STAGE 1',
  },
  {
    id: 'motion-performance',
    label: 'Motion & Performance',
    subLabel: 'Wan 2.1 I2V + Lip-Sync',
    icon: Video,
    stageNumber: 'STAGE 2',
  },
  {
    id: 'cinematography',
    label: 'Cinematography & 4K',
    subLabel: 'Optics, LUTs & Prompt AI',
    icon: Camera,
    stageNumber: 'OPTICS',
  },
  {
    id: 'timeline',
    label: 'Studio Timeline',
    subLabel: 'Multi-Track & Ducking',
    icon: Clock,
  },
  {
    id: 'youtube-publisher',
    label: 'YouTube Publisher',
    subLabel: '4K MP4 & High-CTR Thumbs',
    icon: Youtube,
  },
  {
    id: 'analytics',
    label: 'Production Analytics',
    subLabel: 'Render, Script & Actors',
    icon: BarChart3,
  },
  {
    id: 'self-healing',
    label: 'Watchdog & Healer',
    subLabel: 'Autonomous Diagnostics',
    icon: Activity,
    stageNumber: 'SENTINEL',
  },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useStudio();

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950/70 flex flex-col justify-between p-3 select-none">
      {/* Nav List */}
      <div className="space-y-1.5">
        <div className="px-3 py-1.5 mb-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold flex items-center justify-between">
          <span>Production Pipeline</span>
          <span className="text-[9px] text-amber-500/80 font-mono">DETERMINISTIC</span>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                isActive
                  ? 'bg-neutral-900 border border-neutral-700 shadow-md text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-neutral-900 text-neutral-400 group-hover:text-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isActive ? 'text-neutral-100' : 'text-neutral-300'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-neutral-500 line-clamp-1">{item.subLabel}</div>
                </div>
              </div>

              {item.stageNumber && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {item.stageNumber}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Studio Integrity & Pipeline Badges */}
      <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-300">Vault Security</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">AES-256-GCM</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-300">Staging Mode</span>
          </div>
          <span className="text-[10px] font-mono text-amber-400">T2I Still-First</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-neutral-300">Soundstage</span>
          </div>
          <span className="text-[10px] font-mono text-orange-400">-12dB Ducking</span>
        </div>
      </div>
    </aside>
  );
};
