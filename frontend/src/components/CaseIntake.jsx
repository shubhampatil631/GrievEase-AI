import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Zap,
  ShoppingBag,
  Landmark,
  Radio,
  AlertTriangle,
  Mic,
  MicOff,
  Image as ImageIcon,
  Scan,
  RefreshCw,
  Trophy,
  Award
} from 'lucide-react';
import { DEMO_PRESETS } from '../services/api';
import { soundFx } from '../utils/audio';

export default function CaseIntake({ onStartPipeline }) {
  const [complaintText, setComplaintText] = useState(DEMO_PRESETS[0].complaintText);
  const [category, setCategory] = useState(DEMO_PRESETS[0].category);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isGuardDemo, setIsGuardDemo] = useState(false);
  const [activePresetId, setActivePresetId] = useState(DEMO_PRESETS[0].id);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  const handleSelectPreset = (preset) => {
    soundFx.playClick();
    setActivePresetId(preset.id);
    setComplaintText(preset.complaintText);
    setCategory(preset.category);
    setIsGuardDemo(!!preset.isGuardRejectionDemo);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileChange = (e) => {
    soundFx.playClick();
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleVoiceInput = () => {
    soundFx.playClick();
    if (!speechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setComplaintText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        soundFx.playSuccess();
      };

      recognition.onerror = () => {
        setIsListening(false);
        soundFx.playAlert();
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!complaintText.trim() && !selectedFile) return;
    soundFx.playClick();
    
    const preset = DEMO_PRESETS.find(p => p.id === activePresetId);
    onStartPipeline({
      complaintText,
      category,
      file: selectedFile,
      presetData: preset,
      isGuardDemo
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      
      {/* Judge Hackathon Evaluation Ribbon */}
      <div className="mb-8 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-surface-900 via-surface-850 to-surface-900 border border-brand-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-full bg-brand-500/5 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <Trophy className="w-5 h-5 text-aws-orange animate-bounce" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                First Commit Hackathon • Bharat Builds Tour
                <span className="px-2 py-0.5 text-[10px] font-mono bg-aws-orange/20 text-aws-orange border border-aws-orange/30 rounded-full">
                  Target Tracks
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                1️⃣ <strong>Ship It</strong> (100% AWS Serverless) • 2️⃣ <strong>Best UI</strong> (Cyber-Legal Telemetry) • 3️⃣ <strong>Amazon Fast-Track</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-surface-800 text-teal-300 border border-white/10">
              ⚡ 4-Agent Pipeline in &lt;60s
            </span>
          </div>
        </div>
      </div>

      {/* Hero Title Section */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5 text-brand-400" />
          <span>AWS-Native Autonomous Multi-Agent Grievance Escalation Engine</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Turn an ignored grievance into a <span className="text-gradient-teal">courtroom-ready notice</span> in 60s
        </h1>
        
        <p className="text-xs sm:text-base text-slate-400 mt-3 max-w-2xl mx-auto">
          Upload a bill or describe your issue. AWS Step Functions orchestrates Textract OCR extraction, Bedrock Knowledge Base RAG legal grounding, and a deterministic DynamoDB compliance safety guard.
        </p>
      </div>

      {/* 1-Click Interactive Demo Presets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            1-Click Demo Scenarios (Judge Walkthrough)
          </label>
          <span className="text-[11px] text-slate-400 font-mono">Select a scenario to autofill</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {DEMO_PRESETS.map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden group ${
                  isSelected 
                    ? p.isGuardRejectionDemo
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-lg ring-1 ring-rose-500/40'
                      : 'bg-brand-950/40 border-brand-500/60 shadow-glow-teal ring-1 ring-brand-500/40'
                    : 'glass-panel-interactive hover:border-white/20'
                }`}
              >
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isSelected 
                    ? p.isGuardRejectionDemo ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-400 to-teal-400' 
                    : 'bg-transparent'
                }`} />

                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    p.isGuardRejectionDemo 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                      : 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                  }`}>
                    {p.badge}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className={`w-4 h-4 ${p.isGuardRejectionDemo ? 'text-rose-400' : 'text-brand-400'}`} />
                  )}
                </div>

                <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                  {p.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {p.complaintText}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Intake Card */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative">
        
        {/* Category Pill Switcher */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
            Dispute Domain / Regulatory Scope
          </label>
          <div className="flex flex-wrap gap-2.5">
            {[
              { id: 'ECOMMERCE', label: 'E-Commerce / Consumer', icon: ShoppingBag, desc: 'Consumer Protection Act 2019' },
              { id: 'BANKING', label: 'Banking & UPI Fraud', icon: Landmark, desc: 'RBI Ombudsman Scheme 2021' },
              { id: 'TELECOM', label: 'Telecom & ISP Blackout', icon: Radio, desc: 'TRAI Regulations' }
            ].map((cat) => {
              const Icon = cat.icon;
              const isCatActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { soundFx.playClick(); setCategory(cat.id); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    isCatActive
                      ? 'bg-brand-500 text-surface-950 border-brand-400 shadow-glow-teal'
                      : 'bg-surface-800/80 text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Complaint Text & Voice Dictation Area */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              Grievance Narrative & Dispute Details
            </label>
            
            {/* Voice Dictation (Web Speech API) */}
            {speechSupported && (
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all border ${
                  isListening 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                    : 'bg-surface-800 text-slate-300 hover:text-white border-white/10 hover:border-brand-500/30'
                }`}
                title="Dictate in Hindi or English"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-brand-400" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="State what happened: Order reference, date of incident, monetary amount, and seller's failure to respond..."
              className="w-full bg-surface-900/90 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-all font-sans leading-relaxed"
            />
            
            {/* OCR Extracted Badge if present */}
            {activePresetId && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 bg-surface-900/60 p-2.5 rounded-xl border border-white/5 font-mono">
                <Scan className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="truncate">Sample invoice text pre-loaded for Textract OCR simulation</span>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Upload Dropzone with Laser Scan Preview */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Supporting Evidence (Invoice / Bill / Screenshot)
          </label>
          
          <div className="relative border-2 border-dashed border-white/15 hover:border-brand-500/40 rounded-2xl p-4 sm:p-6 text-center transition-all bg-surface-900/40 overflow-hidden group">
            
            {filePreview ? (
              <div className="relative max-h-48 flex items-center justify-center overflow-hidden rounded-xl">
                <img src={filePreview} alt="Evidence Preview" className="max-h-44 object-contain rounded-lg shadow-md" />
                {/* Animated Laser Scanning Line */}
                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#14b8a6] animate-laser" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-2xl bg-surface-800 text-brand-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Drop invoice photo or click to browse
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Direct S3 Upload via Pre-signed URL • Amazon Textract OCR extraction
                  </p>
                </div>
              </div>
            )}

            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Deliberate Compliance Guard Rejection Toggle */}
        <div className="mb-8 p-4 rounded-2xl bg-surface-900/80 border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isGuardDemo ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-surface-800 text-slate-400'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Deterministic Compliance Guard Test Case
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-surface-800 text-slate-400 rounded-full border border-white/5">
                  Non-LLM DynamoDB Guard
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Simulates an out-of-policy complaint (expired 2-year limitation) to prove deterministic rejection to judges.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              checked={isGuardDemo} 
              onChange={(e) => { soundFx.playClick(); setIsGuardDemo(e.target.checked); }}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-surface-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>

        {/* Submit Execution CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Step Functions pipeline triggers 4 agents automatically</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-teal-400 to-brand-500 text-surface-950 font-display font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 shadow-glow-teal hover:opacity-95 transition-all transform hover:scale-[1.02]"
          >
            <span>Initiate Escalation Pipeline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>

    </div>
  );
}
