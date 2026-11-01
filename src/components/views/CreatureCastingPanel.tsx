import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  JawMorphologyType,
  MORPHOLOGY_PROFILES,
  DEFAULT_MORPHOLOGY_CONFIG,
  MorphologyConfig,
} from '../../utils/lip-sync-morphology-engine';
import {
  Users,
  Volume2,
  Mic,
  ShieldCheck,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
} from 'lucide-react';

export interface CreatureProfile {
  id: string;
  name: string;
  species: string;
  morphology: JawMorphologyType;
  voiceId: string;
  voiceStyle: string;
  elasticity: number;
  imageUrl: string;
  anatomicalDescription: string;
  isVoiceBound: boolean;
}

export const INITIAL_CREATURES: CreatureProfile[] = [
  {
    id: 'creature-golem-01',
    name: 'Titan Golem Malakor',
    species: 'Ancient Basalt & Bronze Golem',
    morphology: 'rigid_stone_statue',
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // ElevenLabs Domi deep resonant
    voiceStyle: 'Deep Cavernous Resonant Bass',
    elasticity: 0.15,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    anatomicalDescription: 'Solid granite chiseled jaw with zero flesh creasing. Acoustic dust suppression active.',
    isVoiceBound: true,
  },
  {
    id: 'creature-snout-02',
    name: 'Cyber-Hound Unit Fenrir',
    species: 'Canine Combat Familiar',
    morphology: 'elongated_snout',
    voiceId: 'ErXwobaYiN019PkySvjV', // ElevenLabs Antoni
    voiceStyle: 'Snarl & Low Synthetic Growl',
    elasticity: 1.25,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    anatomicalDescription: 'Elongated muzzle with forward hinge condyle, rhinal bridge wrinkling on sibilant consonants.',
    isVoiceBound: true,
  },
  {
    id: 'creature-alien-03',
    name: 'Ambassador Xylar-9',
    species: 'Chitinous Quad-Mandible Mantoid',
    morphology: 'alien_multipart_mandible',
    voiceId: 'MF3mGyEYCl7XYWbV9V6O', // ElevenLabs Elli
    voiceStyle: 'Dual-Resonance Polyphonic Click',
    elasticity: 0.8,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    anatomicalDescription: '4-Quadrant lateral splay jaw with synchronized labial pincers.',
    isVoiceBound: true,
  },
];

export const CreatureCastingPanel: React.FC = () => {
  const [creatures, setCreatures] = useState<CreatureProfile[]>(INITIAL_CREATURES);
  const [selectedCreatureId, setSelectedCreatureId] = useState<string>(creatures[0].id);

  const selected = creatures.find((c) => c.id === selectedCreatureId) || creatures[0];
  const profile = MORPHOLOGY_PROFILES[selected.morphology];

  const handleUpdateMorphology = (newMorph: JawMorphologyType) => {
    setCreatures((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              morphology: newMorph,
              elasticity: MORPHOLOGY_PROFILES[newMorph].defaultElasticity,
            }
          : c
      )
    );
  };

  return (
    <div className="flex-1 flex gap-6 h-full overflow-hidden p-6 bg-neutral-950/60">
      {/* Left List of Non-Human & Creature Cast */}
      <div className="w-80 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <span className="text-xs font-mono uppercase text-neutral-400 font-bold">
            Non-Human / Creature Roster
          </span>
          <span className="text-[10px] font-mono text-purple-400 font-bold">
            {creatures.length} CREATURES
          </span>
        </div>

        {creatures.map((c) => {
          const isSelected = c.id === selectedCreatureId;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCreatureId(c.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500/70 shadow-lg ring-1 ring-purple-500/30'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <img
                src={c.imageUrl}
                alt={c.name}
                className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-100 truncate">{c.name}</h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                    {c.morphology.split('_')[0].toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-amber-400 truncate">{c.species}</p>
                <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-mono mt-0.5">
                  <Volume2 className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Bound: {c.voiceId.slice(0, 10)}...</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Creature Detailed Profile & ElevenLabs Binding */}
      <div className="flex-1 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 overflow-y-auto">
        <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-neutral-100 font-mono">{selected.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {selected.species}
              </span>
            </div>
            <p className="text-xs text-amber-400 mt-0.5 font-mono">
              Morphology Architecture: {profile.name}
            </p>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>VOICE ID & ANATOMY BOUND</span>
          </span>
        </div>

        {/* ElevenLabs Automatic Voice Binding Card */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-neutral-200">
                ElevenLabs Bound Neural Voice Target
              </span>
            </div>
            <span className="text-emerald-400 font-bold">SYNCHRONIZED (NO MANUAL ROUTING)</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 text-xs font-mono">
            <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
              <span className="text-neutral-500 block text-[10px]">Benchmarked Voice ID:</span>
              <span className="text-neutral-200 font-bold">{selected.voiceId}</span>
            </div>
            <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
              <span className="text-neutral-500 block text-[10px]">Acoustic Style:</span>
              <span className="text-amber-300 font-bold">{selected.voiceStyle}</span>
            </div>
            <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
              <span className="text-neutral-500 block text-[10px]">Elasticity Weight:</span>
              <span className="text-purple-300 font-bold">{selected.elasticity}x Realism</span>
            </div>
          </div>
        </div>

        {/* Anatomical Kinematics Description */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
          <span className="font-mono text-neutral-400 uppercase font-bold block">
            Kinematic Hinge & Deformation Dynamics
          </span>
          <p className="text-neutral-300 leading-relaxed font-sans">{selected.anatomicalDescription}</p>
          <div className="text-[11px] font-mono text-neutral-500 pt-1">
            Hinge Specification: {profile.kinematicHinge}
          </div>
        </div>

        {/* Architecture Switcher */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold text-neutral-300">
            Reassign Anatomical Mouth Morphology:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(MORPHOLOGY_PROFILES) as JawMorphologyType[]).map((mId) => (
              <button
                key={mId}
                onClick={() => handleUpdateMorphology(mId)}
                className={`p-2.5 rounded-lg border text-xs font-mono text-left transition-all cursor-pointer ${
                  selected.morphology === mId
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500 font-bold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                <div>{MORPHOLOGY_PROFILES[mId].name.split('(')[0]}</div>
                <div className="text-[9px] text-neutral-500 font-normal">
                  {MORPHOLOGY_PROFILES[mId].category}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
