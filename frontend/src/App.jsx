import React, { useState } from 'react';
import Header from './components/Header';
import CaseIntake from './components/CaseIntake';
import PipelineStepper from './components/PipelineStepper';
import CaseResultView from './components/CaseResultView';
import Dashboard from './components/Dashboard';
import ArchitectureModal from './components/ArchitectureModal';
import { createCase, uploadEvidencePresigned, DEMO_PRESETS } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('intake'); // 'intake' | 'stepper' | 'result' | 'dashboard'
  const [activeCase, setActiveCase] = useState(null);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

  // Triggered when user submits the intake form
  const handleStartPipeline = async ({ complaintText, category, file, presetData, isGuardDemo }) => {
    let s3Key = "";
    if (file) {
      const uploadRes = await uploadEvidencePresigned(file);
      s3Key = uploadRes.s3Key || "";
    }

    const caseRes = await createCase({
      s3Key,
      complaintText,
      category,
      isGuardRejectionDemo: isGuardDemo
    });

    const enrichedCaseData = {
      ...caseRes,
      complaintText,
      category,
      s3Key,
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

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-200">
      
      {/* Top Navigation */}
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onOpenArchModal={() => setIsArchModalOpen(true)}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1">
        {currentView === 'intake' && (
          <CaseIntake onStartPipeline={handleStartPipeline} />
        )}

        {currentView === 'stepper' && (
          <PipelineStepper 
            caseData={activeCase} 
            onComplete={handlePipelineComplete} 
          />
        )}

        {currentView === 'result' && (
          <CaseResultView 
            resultData={activeCase} 
            onReset={() => setCurrentView('intake')} 
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard 
            onSelectCase={handleSelectCaseFromDashboard}
            onNewCase={() => setCurrentView('intake')}
          />
        )}
      </main>

      {/* Cloud Architecture Blueprint Modal for Judges */}
      <ArchitectureModal 
        isOpen={isArchModalOpen} 
        onClose={() => setIsArchModalOpen(false)} 
      />

      {/* Global Footer */}
      <footer className="w-full border-t border-white/5 py-6 px-4 bg-[#05080E] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-white">GrievEase AI</span>
            <span>•</span>
            <span>First Commit (Bharat Builds Tour)</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Engineered with AWS Step Functions • Bedrock Knowledge Bases • DynamoDB Single-Table
          </div>
        </div>
      </footer>

    </div>
  );
}
