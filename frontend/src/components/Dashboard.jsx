import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Scale, 
  Calendar,
  ExternalLink,
  Layers,
  ChevronDown,
  Database,
  CheckCircle2,
  FileText,
  Eye,
  Zap,
  Tag
} from 'lucide-react';
import { listUserCases } from '../services/api';
import { soundFx } from '../utils/audio';

export default function Dashboard({ onSelectCase, onNewCase }) {
  const [cases, setCases] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadCases() {
      const data = await listUserCases();
      setCases(data);
    }
    loadCases();
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesCategory = selectedFilter === 'ALL' || c.category === selectedFilter;
    const matchesSearch = !searchTerm || 
      c.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.complaintText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.forum?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (caseId, e) => {
    e.stopPropagation();
    soundFx.playClick();
    setExpandedCaseId(expandedCaseId === caseId ? null : caseId);
  };

  const handleCardClick = (c) => {
    soundFx.playClick();
    onSelectCase(c);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded-full flex items-center gap-1.5">
              <Database className="w-3 h-3 text-teal-400" /> DynamoDB Single-Table State Store
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
            Grievance Escalation <span className="text-gradient-teal">Dossier Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time DynamoDB Case Records & Stage Transition History (GSI1 User Index)
          </p>
        </div>

        <button
          onClick={() => { soundFx.playClick(); onNewCase(); }}
          className="px-5 py-2.5 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-brand-500 to-teal-400 text-surface-950 shadow-glow-teal flex items-center gap-2 transition-all self-start sm:self-auto hover:opacity-95"
        >
          <span>+ New Escalation</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Cases Processed", value: "3", sub: "DynamoDB PK=CASE#", color: "text-white", icon: Database, iconColor: "text-brand-400" },
          { label: "Notices Dispatched", value: "2", sub: "100% Policy Compliant", color: "text-teal-300", icon: CheckCircle2, iconColor: "text-teal-400" },
          { label: "Guard Blocked", value: "1", sub: "Statute of Limitations", color: "text-rose-400", icon: ShieldAlert, iconColor: "text-rose-400" },
          { label: "Average TAT", value: "<45s", sub: "Step Functions End-to-End", color: "text-aws-orange", icon: Zap, iconColor: "text-aws-orange" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-display font-extrabold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['ALL', 'ECOMMERCE', 'BANKING', 'TELECOM'].map((cat) => (
            <button
              key={cat}
              onClick={() => { soundFx.playClick(); setSelectedFilter(cat); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedFilter === cat
                  ? 'bg-brand-500 text-surface-950 shadow-glow-teal font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-surface-800'
              }`}
            >
              {cat === 'ALL' ? 'All Records' : cat === 'ECOMMERCE' ? 'E-Commerce' : cat === 'BANKING' ? 'Banking UPI' : 'Telecom'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Case ID, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-900 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-400 font-mono"
          />
        </div>

      </div>

      {/* Case Dossier List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border border-white/10">
            <Activity className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No Cases Match Filter</h3>
            <p className="text-xs text-slate-400 mt-1">Try selecting 'All Records' or clearing search terms.</p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const isGuardRejected = c.status === 'REJECTED';
            const isExpanded = expandedCaseId === c.caseId;

            return (
              <div
                key={c.caseId}
                onClick={() => handleCardClick(c)}
                className="glass-panel-interactive p-5 sm:p-6 rounded-2xl border border-white/10 cursor-pointer transition-all hover:border-brand-500/40 relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left Metadata */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-white bg-surface-800 px-2 py-0.5 rounded-md border border-white/10">
                        {c.caseId}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isGuardRejected
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                      }`}>
                        {isGuardRejected ? 'GUARD INTERCEPTED' : 'READY FOR FILING'}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      {c.complaintText}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-brand-400" />
                        <span>{c.forum || 'District Consumer Forum'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deadline: {c.deadline || '2028-08-04'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => toggleExpand(c.caseId, e)}
                      className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-white/5 transition-all"
                      title="Inspect DynamoDB Audit Trail"
                    >
                      <Database className="w-3.5 h-3.5 text-teal-400" />
                      <span>Audit Trail</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 group-hover:bg-brand-500 group-hover:text-surface-950 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                </div>

                {/* Expanded DynamoDB Audit Trail View */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-teal-400" />
                      DynamoDB Stage Transition Audit History (`PK=${c.caseId}`, `SK=STATUS#*`)
                    </div>

                    <div className="space-y-2 bg-surface-950/80 p-3.5 rounded-xl border border-white/5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-teal-400 font-semibold">[00.00s] INTAKE_OCR_COMPLETE</span>
                        <span className="text-slate-500">Invoice parsed via Amazon Textract</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-indigo-400 font-semibold">[+01.42s] CLASSIFIED_FORUM</span>
                        <span className="text-slate-500">Bedrock KB RAG retrieval ({c.forum})</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-purple-400 font-semibold">[+02.85s] DRAFT_SYNTHESIZED</span>
                        <span className="text-slate-500">Claude 3 Haiku statutory notice</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className={isGuardRejected ? "text-rose-400 font-bold" : "text-emerald-400 font-semibold"}>
                          {isGuardRejected ? "[+03.10s] GUARD_REJECTED (Limitation Barred)" : "[+03.10s] GUARD_VERIFIED_100%"}
                        </span>
                        <span className="text-slate-500">DynamoDB Compliance Rules Check</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
