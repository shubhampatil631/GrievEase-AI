import React, { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Terminal, 
  Clock, 
  Cpu, 
  Sparkles,
  ShieldCheck, 
  FileSearch, 
  BookOpen, 
  PenTool, 
  ShieldAlert, 
  ArrowRight, 
  Activity, 
  Zap, 
  Server,
  Copy,
  Check,
  Radio,
  Sliders,
  Filter,
  Layers,
  ChevronRight
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { getCaseDetails } from '../services/api';

export default function PipelineStepper({ caseData, onComplete, onShowToast }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [stageTimes, setStageTimes] = useState({});
  const [liveTokens, setLiveTokens] = useState(0);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1 = Normal, 2 = 2x, 0 = Instant
  const [logFilter, setLogFilter] = useState('ALL'); // 'ALL' | 'LAMBDA' | 'STEP_FUNCTIONS' | 'ERRORS'
  const terminalEndRef = useRef(null);

  const stages = [
    {
      id: "INTAKE",
      name: "1. Intake Agent",
      service: "Amazon Textract + S3",
      icon: FileSearch,
      desc: "Downloading invoice from S3 and running Textract OCR extraction...",
      logPrefix: "[IntakeAgent Lambda]",
      memory: "256 MB",
      duration: 1100
    },
    {
      id: "CLASSIFICATION",
      name: "2. Classification Agent",
      service: "Bedrock KB (RAG) + Claude",
      icon: BookOpen,
      desc: "Retrieving regulatory threshold rules from Bedrock Knowledge Base (I9ZVRIM4C2)...",
      logPrefix: "[ClassificationAgent Lambda]",
      memory: "512 MB",
      duration: 1500
    },
    {
      id: "DRAFTING",
      name: "3. Drafting Agent",
      service: "Amazon Bedrock (Claude 3)",
      icon: PenTool,
      desc: "Synthesizing formal legal escalation notice with statutory claim elements...",
      logPrefix: "[DraftingAgent Lambda]",
      memory: "512 MB",
      duration: 1600
    },
    {
      id: "COMPLIANCE_GUARD",
      name: "4. Compliance Guard",
      service: "Deterministic DynamoDB Guard",
      icon: caseData?.isGuardDemo ? ShieldAlert : ShieldCheck,
      desc: "Validating against statutory limitation windows, required fields, and tone check...",
      logPrefix: "[ComplianceGuard Lambda]",
      memory: "256 MB",
      duration: 900
    }
  ];

  // Auto-scroll log terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Token ticker simulation for generative agents
  useEffect(() => {
    if (currentStageIndex === 1 || currentStageIndex === 2) {
      const interval = setInterval(() => {
        setLiveTokens((prev) => prev + Math.floor(Math.random() * 25 + 15));
      }, 70);
      return () => clearInterval(interval);
    }
  }, [currentStageIndex]);

  useEffect(() => {
    let timeoutId;
    const startTime = Date.now();

    const runStage = (index) => {
      if (index >= stages.length) {
        soundFx.playSuccess();
        setTimeout(async () => {
          let liveData = null;
          if (caseData?.caseId) {
            try {
              liveData = await getCaseDetails(caseData.caseId);
            } catch (err) {
              console.warn("Could not fetch live case details:", err);
            }
          }

          onComplete({
            ...caseData,
            ...(liveData || {}),
            status: liveData?.status || (caseData?.isGuardDemo ? "REJECTED" : "READY")
          });
        }, 600);
        return;
      }

      const stage = stages[index];
      setCurrentStageIndex(index);
      soundFx.playClick();
      
      const newLog = `${new Date().toISOString().substring(11, 19)} [AWS::StepFunctions] State: ${stage.id} -> Invoking Lambda (${stage.service})`;
      setLogs((prev) => [...prev, newLog]);

      const stageDuration = speedMultiplier === 0 ? 100 : Math.round(stage.duration / speedMultiplier);

      timeoutId = setTimeout(() => {
        const stageLatency = (stage.duration + Math.floor(Math.random() * 80)).toFixed(0);
        setStageTimes((prev) => ({ ...prev, [stage.id]: `${stageLatency}ms` }));
        
        let doneLog = `${new Date().toISOString().substring(11, 19)} ${stage.logPrefix} Executed in ${stageLatency}ms. Status: SUCCEEDED`;
        if (stage.id === "COMPLIANCE_GUARD" && caseData?.isGuardDemo) {
          doneLog = `${new Date().toISOString().substring(11, 19)} ${stage.logPrefix} ⚠️ GUARD REJECTION: Violation of Section 69 limitation period. Audit log committed to DynamoDB.`;
          soundFx.playAlert();
        }
        setLogs((prev) => [...prev, doneLog]);

        runStage(index + 1);
      }, stageDuration);
    };

    runStage(0);

    return () => clearTimeout(timeoutId);
  }, [speedMultiplier]);

  const handleCopyLogs = () => {
    soundFx.playSuccess();
    navigator.clipboard.writeText(logs.join('\n'));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
    if (onShowToast) {
      onShowToast({
        title: "Logs Copied",
        message: "CloudWatch log execution stream copied to clipboard",
        type: 'success'
      });
    }
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'ALL') return true;
    if (logFilter === 'LAMBDA') return log.includes('[') && !log.includes('[AWS::StepFunctions]');
    if (logFilter === 'STEP_FUNCTIONS') return log.includes('[AWS::StepFunctions]');
    if (logFilter === 'ERRORS') return log.includes('⚠️') || log.includes('REJECTION');
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      
      {/* Top Pipeline Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
          <Activity className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
          <span>AWS Step Functions Standard Workflow • State Machine Execution</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
          Multi-Agent Orchestration <span className="text-gradient-teal">Pipeline</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
          Case ID: <span className="text-white font-bold">{caseData?.caseId || 'c_7bb19b36'}</span> • Execution ARN: <span className="text-aws-orange">{caseData?.executionArn || 'arn:aws:states:ap-south-1:...'}</span>
        </p>
      </div>

      {/* Interactive Flow Energy Beam (Visual Agent Nodes) */}
      <div className="mb-6 hidden md:flex items-center justify-between px-8 py-4 glass-panel rounded-3xl border border-white/10 relative overflow-hidden">
        {stages.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isNext = idx > currentStageIndex;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center gap-2 z-10">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 border ${
                  isCurrent 
                    ? 'bg-brand-500 text-surface-950 border-brand-300 shadow-glow-teal scale-110' 
                    : isDone 
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
                    : 'bg-surface-900 text-slate-500 border-white/5'
                }`}>
                  {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-mono font-semibold ${isCurrent ? 'text-brand-300' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                  {stage.id}
                </span>
              </div>

              {idx < stages.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 relative">
                  <div className="w-full h-full bg-surface-800" />
                  {isDone && (
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-brand-500 shadow-[0_0_10px_#2dd4bf]" />
                  )}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-transparent animate-pulse" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bento Grid: 4 Pipeline Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = idx === currentStageIndex;
          const isDone = idx < currentStageIndex;
          const isRejectedGuard = stage.id === "COMPLIANCE_GUARD" && isDone && caseData?.isGuardDemo;

          return (
            <div
              key={stage.id}
              className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isCurrent 
                  ? 'glass-card-glow border-brand-400/80 shadow-glow-teal scale-[1.02]' 
                  : isRejectedGuard
                  ? 'glass-card-glow-rose border-rose-500/80 shadow-glow-rose'
                  : isDone 
                  ? 'glass-panel border-teal-500/30' 
                  : 'bg-surface-950/60 border-white/5 opacity-50'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/20 blur-xl pointer-events-none" />
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-2xl border ${
                    isCurrent 
                      ? 'bg-brand-500 text-surface-950 border-brand-400 shadow-glow-teal' 
                      : isRejectedGuard
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isDone 
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
                      : 'bg-surface-800 text-slate-500 border-white/5'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40 rounded-full animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> RUNNING
                      </span>
                    ) : isRejectedGuard ? (
                      <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full">
                        INTERCEPTED
                      </span>
                    ) : isDone ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> DONE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-mono text-slate-500 bg-surface-900 rounded-full">
                        QUEUED
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-0.5">{stage.name}</h3>
                <span className="text-[11px] font-mono text-teal-300 font-semibold">{stage.service}</span>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{stage.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Alloc: {stage.memory}</span>
                {stageTimes[stage.id] ? (
                  <span className="text-emerald-400 font-bold">{stageTimes[stage.id]}</span>
                ) : isCurrent ? (
                  <span className="text-brand-400 animate-pulse">Executing...</span>
                ) : (
                  <span className="text-slate-500">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Tech AWS CloudWatch Live Log Console */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 relative overflow-hidden">
        
        {/* Terminal Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2 ml-2">
              <Terminal className="w-4 h-4 text-brand-400" />
              AWS CloudWatch Live Execution Logs
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-surface-950 p-1 rounded-xl border border-white/5 text-[10px] font-mono">
              {['ALL', 'LAMBDA', 'STEP_FUNCTIONS', 'ERRORS'].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    logFilter === f ? 'bg-surface-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f === 'STEP_FUNCTIONS' ? 'StepFunctions' : f}
                </button>
              ))}
            </div>

            {liveTokens > 0 && (
              <span className="text-xs font-mono text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-brand-400" />
                <span>Tokens: {liveTokens}</span>
              </span>
            )}

            <button
              onClick={handleCopyLogs}
              className="px-3 py-1 text-xs font-semibold rounded-xl bg-surface-800 hover:bg-surface-750 text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              {copiedLogs ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Live Terminal Output Window */}
        <div className="bg-surface-950/95 rounded-2xl p-4 font-mono text-xs text-slate-300 h-56 overflow-y-auto space-y-1.5 border border-white/5">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-brand-400 select-none">❯</span>
              <span className={
                log.includes("⚠️") || log.includes("REJECTION") 
                  ? "text-rose-400 font-bold" 
                  : log.includes("SUCCEEDED") 
                  ? "text-teal-300 font-semibold" 
                  : log.includes("[AWS::StepFunctions]") 
                  ? "text-aws-orange font-medium" 
                  : "text-slate-300"
              }>
                {log}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

      </div>

    </div>
  );
}
