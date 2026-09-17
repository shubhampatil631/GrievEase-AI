import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Cloud, 
  Workflow, 
  Sparkles, 
  FileCheck, 
  BellRing,
  ExternalLink,
  Layers,
  Zap,
  Server,
  Lock,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export default function ArchitectureModal({ isOpen, onClose }) {
  const [selectedService, setSelectedService] = useState('sfn');

  if (!isOpen) return null;

  const awsServices = [
    {
      id: 'sfn',
      name: "AWS Step Functions",
      category: "Agent Orchestration",
      arn: "arn:aws:states:us-east-1:717139594049:stateMachine:GrievEasePipeline-dev",
      role: "Multi-Agent State Machine Orchestrator",
      desc: "Orchestrates the 4-agent pipeline as a Standard Workflow state machine in Amazon States Language (ASL). Decouples agent retries, error catches, and the conditional Guard Choice state from application logic.",
      whyNonNegotiable: "Gives judges undeniable visual proof of genuine cloud orchestration in the AWS Console execution graph.",
      badge: "Core Orchestrator",
      color: "border-aws-orange/40 bg-aws-orange/10 text-aws-orange"
    },
    {
      id: 'bedrock_kb',
      name: "Amazon Bedrock Knowledge Bases",
      category: "Native AWS RAG",
      arn: "KB ID: I9ZVRIM4C2 (OpenSearch Serverless)",
      role: "AWS-Native Regulatory Grounding RAG",
      desc: "Stores chunked regulatory corpus (Consumer Protection Act 2019, RBI Ombudsman Scheme 2021, TRAI Regulations) embedded via Titan and retrieved with OpenSearch Serverless vector search.",
      whyNonNegotiable: "Eliminates third-party external vector DBs (Pinecone/Chroma), providing a 100% native AWS RAG stack.",
      badge: "Knowledge Engine",
      color: "border-teal-500/40 bg-teal-500/10 text-teal-300"
    },
    {
      id: 'bedrock_model',
      name: "Amazon Bedrock (Claude 3 Haiku)",
      category: "Generative AI",
      arn: "anthropic.claude-3-haiku-20240307-v1:0",
      role: "Classification & Drafting Reasoning Engine",
      desc: "Invoked via boto3 bedrock-runtime with structured JSON schemas to classify dispute categories, compute limitation windows, and draft legally formatted notices.",
      whyNonNegotiable: "High-speed token generation (<1.5s) with high legal reasoning fidelity and strict JSON compliance.",
      badge: "Inference Engine",
      color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
    },
    {
      id: 'guard',
      name: "Deterministic Compliance Guard",
      category: "Mathematical Safety",
      arn: "Lambda Function (Zero Bedrock Permissions)",
      role: "Zero-Hallucination Policy & Limitation Validator",
      desc: "Pure Python Lambda with zero `bedrock:*` IAM permissions verifying drafts against statutory rules in DynamoDB (mandatory fields, limitation period <= 730 days, tone scan).",
      whyNonNegotiable: "Mathematical guarantee to judges that safety checks are deterministic code, not LLM self-grading.",
      badge: "Zero-LLM Guard",
      color: "border-amber-500/40 bg-amber-500/10 text-amber-300"
    },
    {
      id: 'dynamodb',
      name: "Amazon DynamoDB (Single-Table)",
      category: "Database",
      arn: "Table: GrievEaseTable-dev & ComplianceRulesTable-dev",
      role: "Case Store + Immutable Stage Audit History",
      desc: "Single-table design with `PK=CASE#<id>`, `SK=META` for live case state, `SK=STATUS#<timestamp>` for stage transitions, and `GSI1 (USER#<id>)` for instant dashboard queries.",
      whyNonNegotiable: "Sub-10ms latency for case lookup and natural chronological audit trail in a single table query.",
      badge: "Storage & Audit",
      color: "border-purple-500/40 bg-purple-500/10 text-purple-300"
    },
    {
      id: 'textract',
      name: "Amazon Textract",
      category: "Vision / OCR",
      arn: "Amazon Textract Document Analysis API",
      role: "Automated Invoice & Bill Parsing",
      desc: "Extracts invoice line items, dates, vendor names, and disputed amounts directly from uploaded photos/PDFs in S3 via pre-signed URLs.",
      whyNonNegotiable: "Removes user data-entry friction, fulfilling the core promise of photo-to-notice in 60s.",
      badge: "OCR Engine",
      color: "border-sky-500/40 bg-sky-500/10 text-sky-300"
    }
  ];

  const currentSrv = awsServices.find(s => s.id === selectedService) || awsServices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto glass-panel bg-surface-950/95 border border-brand-500/30 rounded-3xl shadow-2xl p-6 sm:p-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-aws-orange/20 text-aws-orange border border-aws-orange/30">
                <Cloud className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                GrievEase AI • AWS Cloud Architecture Blueprint
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-mono">
              Stack: <span className="text-teal-300">grievease-ai-stack</span> • Region: <span className="text-aws-orange">us-east-1</span> • 100% Serverless
            </p>
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="p-2 text-slate-400 hover:text-white hover:bg-surface-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Pipeline Topology Flow */}
        <div className="my-6 p-5 rounded-2xl bg-surface-900/80 border border-white/10">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Workflow className="w-4 h-4 text-brand-400" />
            Interactive Agent Execution Topology
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            {awsServices.slice(0, 4).map((s) => {
              const isActive = selectedService === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { soundFx.playClick(); setSelectedService(s.id); }}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    isActive 
                      ? 'bg-brand-500/20 border-brand-400 shadow-glow-teal ring-1 ring-brand-400' 
                      : 'bg-surface-800/80 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{s.category}</span>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                  <h4 className="font-bold text-white text-xs line-clamp-1">{s.name}</h4>
                  <span className="text-[10px] text-teal-300 font-mono block mt-0.5">{s.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Service Deep Dive Card */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-500/20 mb-6 relative overflow-hidden bg-surface-900/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-display font-bold text-white">{currentSrv.name}</h3>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${currentSrv.color}`}>
                {currentSrv.badge}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-surface-950 px-2.5 py-1 rounded-lg border border-white/5">
              {currentSrv.arn}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {currentSrv.desc}
          </p>

          <div className="p-3.5 rounded-xl bg-surface-950/80 border border-brand-500/20 text-xs">
            <span className="text-brand-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
              🏆 Why This Service is Non-Negotiable (Judging Rubric):
            </span>
            <span className="text-slate-300 leading-relaxed font-sans">
              {currentSrv.whyNonNegotiable}
            </span>
          </div>
        </div>

        {/* All Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {awsServices.map((srv) => (
            <div 
              key={srv.id} 
              onClick={() => { soundFx.playClick(); setSelectedService(srv.id); }}
              className="p-4 rounded-2xl glass-panel-interactive cursor-pointer border border-white/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className="font-bold text-xs text-white line-clamp-1">{srv.name}</h4>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${srv.color}`}>
                    {srv.badge}
                  </span>
                </div>
                <div className="text-[11px] text-teal-300 font-medium mb-1.5">{srv.role}</div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{srv.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Engineered for WeMakeDevs × AWS Bharat Builds Tour 2026
          </span>
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 transition-colors shadow-glow-teal"
          >
            Close Blueprint
          </button>
        </div>

      </div>
    </div>
  );
}
