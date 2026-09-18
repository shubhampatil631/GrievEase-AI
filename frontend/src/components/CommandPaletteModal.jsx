import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Activity, 
  Layers, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  Landmark, 
  Radio, 
  ShieldAlert, 
  CornerDownLeft, 
  X,
  Zap,
  ArrowRight
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { DEMO_PRESETS } from '../services/api';

export default function CommandPaletteModal({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onSelectPreset, 
  onOpenArchModal, 
  soundEnabled, 
  onToggleSound 
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'nav_intake',
      category: 'Navigation',
      title: 'New Escalation Case',
      subtitle: 'Upload evidence or write grievance',
      icon: Sparkles,
      iconColor: 'text-brand-400',
      action: () => { onNavigate('intake'); onClose(); }
    },
    {
      id: 'nav_dashboard',
      category: 'Navigation',
      title: 'Case Dossier Dashboard',
      subtitle: 'View active records & DynamoDB Single-Table telemetry',
      icon: Activity,
      iconColor: 'text-teal-400',
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'nav_blueprint',
      category: 'System',
      title: 'AWS Cloud Blueprint Architecture',
      subtitle: 'Inspect Step Functions, Bedrock RAG & DynamoDB schemas',
      icon: Layers,
      iconColor: 'text-aws-orange',
      action: () => { onClose(); onOpenArchModal(); }
    },
    {
      id: 'toggle_sound',
      category: 'System',
      title: soundEnabled ? 'Mute UI Sound Effects' : 'Enable UI Sound Effects',
      subtitle: 'Cyber-legal Web Audio chimes & clicks',
      icon: soundEnabled ? VolumeX : Volume2,
      iconColor: 'text-indigo-400',
      action: () => { onToggleSound(); }
    },
    ...DEMO_PRESETS.map((preset) => ({
      id: `preset_${preset.id}`,
      category: 'Quick Presets',
      title: preset.title,
      subtitle: preset.badge,
      icon: preset.category === 'ECOMMERCE' ? ShoppingBag : preset.category === 'BANKING' ? Landmark : Radio,
      iconColor: preset.isGuardRejectionDemo ? 'text-rose-400' : 'text-cyan-400',
      action: () => { onSelectPreset(preset); onClose(); }
    }))
  ];

  const filteredActions = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
      e.preventDefault();
      soundFx.playClick();
      filteredActions[selectedIndex].action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-surface-900/95 border border-white/15 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-brand-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search demo scenarios... (Esc to exit)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching actions or scenarios found.
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    soundFx.playClick();
                    action.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-r from-brand-500/20 via-surface-800 to-surface-800 text-white border border-brand-500/30' 
                      : 'text-slate-300 hover:bg-surface-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-surface-800/80 border border-white/10 ${action.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                        {action.title}
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                          {action.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{action.subtitle}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-brand-300 bg-brand-500/15 px-2 py-1 rounded-lg border border-brand-500/30">
                      <span>Select</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-surface-950 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span><strong className="text-slate-300">↑↓</strong> to navigate</span>
            <span><strong className="text-slate-300">↵</strong> to select</span>
            <span><strong className="text-slate-300">Esc</strong> to close</span>
          </div>
          <span className="text-brand-400 flex items-center gap-1">
            <Zap className="w-3 h-3" /> GrievEase AI Command Bar
          </span>
        </div>
      </div>
    </div>
  );
}
