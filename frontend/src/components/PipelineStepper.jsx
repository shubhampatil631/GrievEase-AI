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
  Server
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export default function PipelineStepper({ caseData, onComplete }) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [stageTimes, setStageTimes] = useState({});
  const [liveTokens, setLiveTokens] = useState(0);
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
      }, 80);
      return () => clearInterval(interval);
    }
  }, [currentStageIndex]);

  useEffect(() => {
    let timeoutId;
    const startTime = Date.now();

    const runStage = (index) => {
      if (index >= stages.length) {
        soundFx.playSuccess();
        setTimeout(() => {
          onComplete({
            ...caseData,
            status: caseData?.isGuardDemo ? "REJECTED" : "READY"
          });
        }, 500);
        return;
      }

      const stage = stages[index];
      setCurrentStageIndex(index);
      soundFx.playClick();
      
      const newLog = `${new Date().toISOString().substring(11, 19)} [AWS::StepFunctions] State: ${stage.id} -> Invoking Lambda (${stage.service})`;
      setLogs((prev) => [...prev, newLog]);

      timeoutId = setTimeout(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const stageLatency = (stage.duration + Math.floor(Math.random() * 80)).toFixed(0);
        setStageTimes((prev) => ({ ...prev, [stage.id]: `${stageLatency}ms` }));
        
        let doneLog = `${new Date().toISOString().substring(11, 19)} ${stage.logPrefix} Executed in ${stageLatency}ms. Status: SUCCEEDED`;
        if (stage.id === "COMPLIANCE_GUARD" && caseData?.isGuardDemo) {
          doneLog = `${new Date().toISOString().substring(11, 19)} ${stage.logPrefix} ⚠️ GUARD REJECTION: Violation of Section 69 limitation period. Audit log committed to DynamoDB.`;
          soundFx.playAlert();
        }
        setLogs((prev) => [...prev, doneLog]);

        runStage(index + 1);
      }, stage.duration);
    };

    runStage(0);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      
      {/* Top Pipeline Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
          <Activity className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
          <span>AWS Step Functions Standard Workflow • State Machine Execution</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
          Orchestrating Autonomous Legal Agents
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">
          ARN: arn:aws:states:us-east-1:717139594049:stateMachine:GrievEasePipeline-dev
        </p>
      </div>

      {/* 4-Agent Step Functions Flow Graph */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = currentStageIndex === idx;
          const isDone = currentStageIndex > idx;
          const isPending = currentStageIndex < idx;
          const isGuardRejection = stage.id === "COMPLIANCE_GUARD" && isDone && caseData?.isGuardDemo;

          return (
            <div
              key={stage.id}
              className={`p-5 rounded-2xl transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrent 
                  ? 'glass-card-glow border-brand-400/80 shadow-glow-teal ring-1 ring-brand-400/50' 
                  : isDone 
                    ? isGuardRejection
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-md'
                      : 'bg-surface-850/90 border-teal-500/30 shadow-md' 
                    : 'glass-panel opacity-50 border-white/5'
              }`}
            >
              {/* Active Pulse Header */}
              {isCurrent && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-teal-300 animate-pulse" />
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    isCurrent 
                      ? 'bg-brand-500 text-surface-950 shadow-sm' 
                      : isDone 
                        ? isGuardRejection ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-300' 
                        : 'bg-surface-800 text-slate-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    {isDone ? (
                      isGuardRejection ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          REJECTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          PASSED
                        </span>
                      )
                    ) : isCurrent ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-brand-400" /> RUNNING
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">QUEUED</span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">
                  {stage.name}
                </h3>
                <span className="text-[11px] font-mono text-aws-orange block mt-0.5">
                  {stage.service}
                </span>

                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              {/* Node Telemetry Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>MEM: {stage.memory}</span>
                <span>{stageTimes[stage.id] || (isCurrent ? 'processing...' : '0ms')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CloudWatch Telemetry Live Console Drawer */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live CloudWatch Telemetry Stream
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            {liveTokens > 0 && (
              <span className="text-teal-400 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-teal-400" /> ~{liveTokens} tokens streamed
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Streaming
            </span>
          </div>
        </div>

        {/* Console Log Window */}
        <div className="h-40 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 text-slate-300 bg-surface-950/80 p-3.5 rounded-xl border border-white/5">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-500 select-none">&gt;</span>
              <span className={log.includes("REJECTION") ? "text-rose-400 font-bold" : log.includes("SUCCEEDED") ? "text-teal-300" : "text-slate-300"}>
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
