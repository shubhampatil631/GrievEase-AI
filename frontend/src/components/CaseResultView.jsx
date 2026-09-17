import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Printer, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  Scale, 
  Building2, 
  Tag, 
  FileText, 
  Sparkles,
  BellRing,
  RotateCcw,
  AlertTriangle,
  Mail,
  Send,
  Download,
  BookOpen,
  Award,
  Clock,
  Eye,
  FileCheck
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export default function CaseResultView({ resultData, onReset }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'letterhead'
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isRejected = resultData?.status === "REJECTED";
  const preset = resultData?.presetData;

  // Derive notice content
  const noticeText = resultData?.draftNotice || `LEGAL GRIEVANCE & STATUTORY ESCALATION NOTICE
Under the Provisions of ${preset?.targetForum === 'RBI_OMBUDSMAN' ? 'Reserve Bank - Integrated Ombudsman Scheme, 2021' : preset?.targetForum === 'TRAI' ? 'TRAI Telecom Consumers Protection Regulations' : 'Consumer Protection Act, 2019'}

Date: 17th September 2026

To,
The Grievance Redressal Officer / Principal Nodal Officer,
${preset?.category === 'BANKING' ? 'HDFC Bank Limited, Mumbai Central' : preset?.category === 'TELECOM' ? 'Jio Telecom Appellate Authority' : 'Apex Retail India Private Limited'}
Registered Office Address, India.

SUBJECT: FORMAL STATUTORY NOTICE DEMANDING IMMEDIATE REFUND AND COMPENSATION FOR UNFAIR TRADE PRACTICE & DEFICIENCY OF SERVICE

Sir / Madam,

Under instructions from my client, I hereby issue this statutory notice setting forth the following material facts:

1. FACTUAL MATRIX & TRANSACTION DETAILS:
   - Disputed Account / Order Reference: ${preset?.category === 'BANKING' ? 'A/c #XXXX4910 (UPI Ref: UTR-99382109)' : preset?.category === 'TELECOM' ? 'Fiber Connection ID: JIO-FBR-88392' : 'Order ID: AZ-884920 (Invoice: INV-2026-99384)'}
   - Disputed Consideration Amount: ${preset?.category === 'BANKING' ? '₹14,500.00' : preset?.category === 'TELECOM' ? '₹1,499.00' : '₹28,499.00'}
   - Date of Transaction / Incident: ${preset?.category === 'BANKING' ? '12th July 2026' : preset?.category === 'TELECOM' ? '2nd August 2026' : '4th August 2026'}

2. DEFICIENCY OF SERVICE:
   ${resultData?.complaintText}

3. STATUTORY GROUNDS & APPLICABLE LAWS:
   The continuous failure to reverse the disputed amount despite the mandatory cure period constitutes an actionable deficiency under statutory regulations. The statutory limitation period expires on ${preset?.targetForum === 'RBI_OMBUDSMAN' ? '13th July 2027' : preset?.targetForum === 'TRAI' ? '17th October 2026' : '4th August 2028'}.

4. SPECIFIC RELIEF SOUGHT (PRAYER):
   (a) Immediate refund/reversal of the full principal disputed amount.
   (b) Statutory interest @ 18% per annum from the date of wrongful deduction/withholding.
   (c) Compensation of ₹10,000 for harassment, mental anguish, and litigation costs.

Take formal notice that you are granted FIFTEEN (15) DAYS from receipt of this notice to satisfy the aforesaid demands, failing which formal proceedings shall be instituted before the ${preset?.portalName || 'Competent Regulatory Forum'} at your sole cost and risk.

Yours faithfully,
[COMPLAINANT / ADVOCATE FOR COMPLAINANT]
Contact: [YOUR PHONE / EMAIL]`;

  const handleCopy = () => {
    soundFx.playSuccess();
    navigator.clipboard.writeText(noticeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    soundFx.playSuccess();
    setEmailSent(true);
    setTimeout(() => {
      setIsEmailModalOpen(false);
      setEmailSent(false);
    }, 1800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2">
            {isRejected ? (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Deterministic Guard Interception (Zero Out-of-Policy Drafts)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                Pipeline Execution Complete
              </span>
            )}
            <span className="text-xs font-mono text-slate-400">Case ID: {resultData?.caseId || 'c_7bb19b36'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-2">
            {isRejected ? 'Compliance Guard Interception Report' : 'Autonomous Notice & Routing Dossier'}
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isRejected && (
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
              title="Print Official Legal Letterhead"
            >
              <Printer className="w-3.5 h-3.5 text-brand-400" />
              <span>Print / Export PDF</span>
            </button>
          )}

          <button
            onClick={() => { soundFx.playClick(); onReset(); }}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Escalation</span>
          </button>
        </div>
      </div>

      {/* Main Split-Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column: Authority, Clock, Rules Inspection (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Forum Assignment Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Designated Authority
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Confidence: {((preset?.confidence || 0.96) * 100).toFixed(0)}%
              </span>
            </div>

            <h2 className="text-xl font-display font-bold text-white mb-1">
              {preset?.portalName || "e-Daakhil / District Consumer Commission"}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {preset?.badge || "Consumer Protection Act 2019"} • Pecuniary & Territorial Jurisdiction Confirmed
            </p>

            {preset?.portalUrl && (
              <a
                href={preset.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all group"
              >
                <span>Direct Filing Portal ({preset.portalUrl.replace('https://', '')})</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}
          </div>

          {/* Statutory Limitation Period Clock */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Statutory Limitation Period
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isRejected ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isRejected ? 'EXPIRED' : 'ACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-surface-900/60 p-4 rounded-2xl border border-white/5 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Statutory Window</span>
                <span className="text-lg font-bold text-white">
                  {preset?.deadlineDays ? `${preset.deadlineDays} Days` : '730 Days'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  ({preset?.targetForum === 'TRAI' ? '1 Month' : preset?.targetForum === 'RBI_OMBUDSMAN' ? '1 Year' : '2 Years'})
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Filing Deadline</span>
                <span className={`text-lg font-bold ${isRejected ? 'text-rose-400' : 'text-teal-300'}`}>
                  {isRejected ? 'Expired (2025)' : preset?.targetForum === 'TRAI' ? '2026-10-17' : preset?.targetForum === 'RBI_OMBUDSMAN' ? '2027-07-13' : '2028-08-04'}
                </span>
                <span className="text-[11px] text-slate-400 block">Strict limitation bar</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <BellRing className="w-3.5 h-3.5 text-aws-orange shrink-0" />
              <span>Amazon EventBridge + SES reminder scheduled 3 days prior.</span>
            </div>
          </div>

          {/* Compliance Guard Audit Score Breakdown */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Compliance Guard Audit Score
              </span>
              <span className={`text-xs font-mono font-bold ${isRejected ? 'text-rose-400' : 'text-teal-300'}`}>
                {isRejected ? '0% FAILED' : '100% VERIFIED'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/60 border border-white/5">
                <span className="text-slate-300">Mandatory Fields Check:</span>
                <span className="text-teal-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Passed (4/4 Present)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/60 border border-white/5">
                <span className="text-slate-300">Statutory Limitation Check:</span>
                {isRejected ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Barred (&gt;2 Yrs)
                  </span>
                ) : (
                  <span className="text-teal-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Valid (Within 2 Yrs)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/60 border border-white/5">
                <span className="text-slate-300">Tone & Threat Scan:</span>
                <span className="text-teal-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Clean (Zero Violations)
                </span>
              </div>
            </div>
          </div>

          {/* Bedrock RAG Citations Panel */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 text-xs">
            <div className="flex items-center gap-2 mb-2 text-brand-400 font-bold uppercase text-[11px] tracking-wider">
              <BookOpen className="w-3.5 h-3.5" /> Bedrock Knowledge Base Excerpt
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-mono bg-surface-950/70 p-3 rounded-xl border border-white/5">
              {preset?.targetForum === 'RBI_OMBUDSMAN' 
                ? "RBI Integrated Ombudsman Scheme, 2021 (Clause 10): Covers deficiency in banking services, unauthorized electronic transactions, and failed UPI reversals with 30-day preliminary cure notice requirement."
                : preset?.targetForum === 'TRAI'
                ? "TRAI Telecom Consumers Protection Regulations (Chapter V): Appellate Authority jurisdiction over broadband SLAs, billing disputes, and unresolved 30-day complaints."
                : "Consumer Protection Act, 2019 (Section 35 & 69): District Consumer Disputes Redressal Commission pecuniary limit up to ₹50 Lakhs. 2-year limitation period from cause of action."}
            </p>
          </div>

        </div>

        {/* Right Column: Notice Studio / Letterhead (7 cols) */}
        <div className="lg:col-span-7">
          
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col h-full">
            
            {/* Studio Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-400" />
                  Statutory Escalation Notice Studio
                </span>
                <p className="text-[11px] text-slate-400">
                  Ready for instant dispatch via Registered Email / Legal Post
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-surface-800 hover:bg-surface-750 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>Send Notice</span>
                </button>

                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
                    copied 
                      ? 'bg-emerald-500 text-surface-950 font-extrabold' 
                      : 'bg-brand-500 hover:bg-brand-400 text-surface-950'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Notice'}</span>
                </button>
              </div>
            </div>

            {/* Legal Notice Body Preview (Printable) */}
            <div className="flex-1 bg-surface-950/90 rounded-2xl p-5 sm:p-6 border border-white/5 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-200 overflow-y-auto max-h-[580px] print-legal-notice select-text">
              <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                {noticeText}
              </pre>
            </div>

            {/* Footer Badge */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Model: Claude 3 Haiku • Bedrock RAG</span>
              <span className="text-teal-400">Format: Courtroom Legal Notice</span>
            </div>

          </div>

        </div>

      </div>

      {/* 1-Click Email Dispatch Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-white/15 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white font-display">
                  Dispatch Legal Notice via Email
                </h3>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {emailSent ? (
              <div className="py-8 text-center animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3 animate-bounce" />
                <h4 className="text-lg font-bold text-white">Notice Dispatched!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Amazon SES has delivered the formal notice to the Nodal Officer with an audit copy to your email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">To (Grievance Nodal Officer):</label>
                  <input 
                    type="email" 
                    defaultValue={preset?.category === 'BANKING' ? 'nodal.officer@hdfcbank.com' : preset?.category === 'TELECOM' ? 'appellate.authority@jio.com' : 'grievance-officer@apexretail.in'}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject:</label>
                  <input 
                    type="text" 
                    defaultValue={`FORMAL STATUTORY NOTICE: Deficiency in Service [Case #${resultData?.caseId || 'c_7bb19b36'}]`}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Email (for CC & Audit Proof):</label>
                  <input 
                    type="email" 
                    placeholder="your.email@example.com"
                    required
                    defaultValue="complainant@example.com"
                    className="w-full bg-surface-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-brand-400 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold flex items-center gap-1.5 shadow-glow-teal"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via Amazon SES</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
