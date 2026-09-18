import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CaseIntake from './components/CaseIntake';
import PipelineStepper from './components/PipelineStepper';
import CaseResultView from './components/CaseResultView';
import Dashboard from './components/Dashboard';
import ArchitectureModal from './components/ArchitectureModal';
import CommandPaletteModal from './components/CommandPaletteModal';
import Toast from './components/Toast';
import { createCase, uploadEvidencePresigned, DEMO_PRESETS } from './services/api';
import { soundFx } from './utils/audio';

export default function App() {
  const [currentView, setCurrentView] = useState('intake'); // 'intake' | 'stepper' | 'result' | 'dashboard'
  const [activeCase, setActiveCase] = useState(null);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = ({ title, message, type = 'info', duration = 3000 }) => {
    setToast({ title, message, type, duration });
  };

  // Global Keyboard Shortcuts (Cmd/Ctrl + K for Command Bar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundFx.playClick();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSound = () => {
    const newState = soundFx.toggle();
    setSoundEnabled(newState);
    if (newState) soundFx.playClick();
    showToast({
      title: newState ? "Sound Enabled" : "Sound Muted",
      message: newState ? "UI audio effects turned on" : "Silent mode active",
      type: "info"
    });
  };

  // Triggered when user submits the intake form
  const handleStartPipeline = async ({ complaintText, category, priority, file, ocrText, extractedFields, presetData, isGuardDemo }) => {
    let s3Key = "";
    if (file) {
      const uploadRes = await uploadEvidencePresigned(file);
      s3Key = uploadRes.s3Key || "";
    }

    const caseRes = await createCase({
      s3Key,
      complaintText,
      category,
      priority,
      isGuardRejectionDemo: isGuardDemo
    });

    const enrichedCaseData = {
      ...caseRes,
      complaintText,
      category,
      priority,
      s3Key,
      ocrText,
      extractedFields,
      presetData,
      isGuardDemo
    };

    setActiveCase(enrichedCaseData);
    setCurrentView('stepper');
  };

  // Triggered when the visual pipeline finishes running
  const handlePipelineComplete = (completedData) => {
    setActiveCase(completedData);
    setCurrentView('result');
    showToast({
      title: completedData.status === 'REJECTED' ? "Guardrail Interception" : "Notice Ready",
      message: completedData.status === 'REJECTED' 
        ? "Deterministic guard blocked out-of-policy filing" 
        : "Statutory notice synthesized and verified",
      type: completedData.status === 'REJECTED' ? "error" : "success"
    });
  };

  // Select a case from the dashboard
  const handleSelectCaseFromDashboard = (caseItem) => {
    const matchingPreset = DEMO_PRESETS.find(p => p.targetForum === caseItem.forum || p.category === caseItem.category) || DEMO_PRESETS[0];
    setActiveCase({
      ...caseItem,
      presetData: matchingPreset,
      isGuardDemo: caseItem.status === 'REJECTED'
    });
    setCurrentView('result');
  };

  const handleSelectPresetFromCommand = (preset) => {
    handleStartPipeline({
      complaintText: preset.complaintText,
      category: preset.category,
      priority: 'NORMAL',
      file: null,
      presetData: preset,
      isGuardDemo: !!preset.isGuardRejectionDemo
    });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-200">
      
      {/* Top Navigation */}
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onOpenArchModal={() => setIsArchModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 pb-12">
        {currentView === 'intake' && (
          <CaseIntake onStartPipeline={handleStartPipeline} onShowToast={showToast} />
        )}

        {currentView === 'stepper' && (
          <PipelineStepper 
            caseData={activeCase} 
            onComplete={handlePipelineComplete}
            onShowToast={showToast}
          />
        )}

        {currentView === 'result' && (
          <CaseResultView 
            resultData={activeCase} 
            onReset={() => setCurrentView('intake')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard 
            onSelectCase={handleSelectCaseFromDashboard}
            onNewCase={() => setCurrentView('intake')}
          />
        )}
      </main>

      {/* Floating Command Palette (Cmd / Ctrl + K) */}
      <CommandPaletteModal 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
        onSelectPreset={handleSelectPresetFromCommand}
        onOpenArchModal={() => setIsArchModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Cloud Architecture Blueprint Modal for Judges */}
      <ArchitectureModal 
        isOpen={isArchModalOpen} 
        onClose={() => setIsArchModalOpen(false)} 
      />

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Global Footer */}
      <footer className="w-full border-t border-white/5 py-6 px-4 bg-surface-950 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-white tracking-wide">GrievEase AI</span>
            <span>•</span>
            <span>Autonomous Multi-Agent Grievance Escalation Engine</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            AWS Step Functions • Bedrock Knowledge Bases • Claude 3 • DynamoDB Single-Table
          </div>
        </div>
      </footer>

    </div>
  );
}
