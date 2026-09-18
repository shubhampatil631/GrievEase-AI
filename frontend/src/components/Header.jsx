import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  Zap, 
  Activity,
  Volume2,
  VolumeX,
  Command,
  Database
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export default function Header({ 
  currentView, 
  setCurrentView, 
  onOpenArchModal, 
  onOpenCommandPalette, 
  soundEnabled, 
  onToggleSound 
}) {
  const handleNav = (view) => {
    soundFx.playClick();
    setCurrentView(view);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-surface-900/80 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Live Engine Badge */}
          <div className="flex items-center gap-3.5 cursor-pointer select-none group" onClick={() => handleNav('intake')}>
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-brand-400 to-aws-orange p-[1.5px] shadow-glow-teal transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-surface-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400 transition-transform group-hover:rotate-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                  Griev<span className="text-gradient-teal">Ease</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
                  </span>
                  AI Agents
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-normal font-medium">
                Autonomous Grievance Escalation Engine • Built on AWS
              </p>
            </div>
          </div>

          {/* AWS Live Telemetry Pills */}
          <div className="hidden xl:flex items-center gap-2.5 bg-surface-950/80 px-4 py-1.5 rounded-full border border-white/10 text-xs shadow-inner backdrop-blur-xl">
            <span className="flex items-center gap-1.5 text-aws-orange font-semibold">
              <Zap className="w-3.5 h-3.5 fill-aws-orange text-aws-orange" /> Step Functions
            </span>
            <span className="text-slate-600 font-bold">•</span>
            <span className="text-slate-300 font-medium">Bedrock RAG</span>
            <span className="text-slate-600 font-bold">•</span>
            <span className="text-teal-300 font-medium">DynamoDB Guard</span>
            <span className="text-slate-600 font-bold">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ap-south-1 LIVE
            </span>
          </div>

          {/* Navigation & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Command Palette Trigger (Cmd/Ctrl + K) */}
            <button
              onClick={() => { soundFx.playClick(); onOpenCommandPalette(); }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl text-slate-300 hover:text-white bg-surface-800/80 hover:bg-surface-750 border border-white/10 hover:border-brand-400/40 flex items-center gap-1.5 transition-all shadow-sm group"
              title="Open Command Bar (Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-surface-950/90 text-slate-400 rounded border border-white/10 ml-0.5">
                ⌘K
              </kbd>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => { soundFx.playClick(); onToggleSound(); }}
              className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                soundEnabled 
                  ? 'bg-brand-500/10 text-brand-300 border-brand-500/30 hover:bg-brand-500/20' 
                  : 'bg-surface-800 text-slate-500 border-white/5 hover:text-slate-300'
              }`}
              title={soundEnabled ? "Mute UI Sound Effects" : "Enable UI Sound Effects"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Architecture Modal Trigger */}
            <button
              onClick={() => { soundFx.playClick(); onOpenArchModal(); }}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-200 hover:text-white bg-surface-800/90 hover:bg-surface-750 border border-white/10 hover:border-aws-orange/50 flex items-center gap-1.5 transition-all shadow-sm"
              title="Inspect AWS Cloud Architecture"
            >
              <Layers className="w-4 h-4 text-aws-orange" />
              <span className="hidden md:inline font-medium">AWS Blueprint</span>
            </button>

            {/* Dashboard Navigation */}
            <button
              onClick={() => handleNav('dashboard')}
              className={`px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-surface-750 text-white border border-brand-500/40 shadow-inner'
                  : 'text-slate-300 hover:text-white bg-surface-800/80 hover:bg-surface-750 border border-white/5'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="hidden xs:inline">Dashboard</span>
            </button>

            {/* New Escalation Primary Button */}
            <button
              onClick={() => handleNav('intake')}
              className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                currentView === 'intake' || currentView === 'stepper' || currentView === 'result'
                  ? 'bg-gradient-to-r from-brand-500 via-teal-400 to-cyan-accent text-surface-950 shadow-glow-teal hover:opacity-95 active:scale-95'
                  : 'text-slate-300 hover:text-white bg-surface-800 hover:bg-surface-750 border border-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>New Case</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
