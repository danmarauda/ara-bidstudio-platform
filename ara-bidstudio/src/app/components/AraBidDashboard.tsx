"use client";

import React from "react";
import { AgentState } from "@/lib/state";
import { ARA_TENANT_CONFIG } from "@/lib/tenant";
import { AraLogo } from "./AraLogo";

interface AraBidDashboardProps {
  state: AgentState;
  themeColor: string;
}

const WORKFLOW_STEPS = [
  { id: "setup", label: "Setup", description: "Configure project and tender" },
  { id: "ingest", label: "Ingest", description: "Upload and analyze documents" },
  { id: "analyze", label: "Analyze", description: "Extract requirements & compliance" },
  { id: "estimate", label: "Estimate", description: "Generate cost estimates" },
  { id: "draft", label: "Draft", description: "Create proposal sections" },
  { id: "review", label: "Review", description: "Quality assurance & validation" },
  { id: "submit", label: "Submit", description: "Prepare final submission" },
];

export function AraBidDashboard({ state, themeColor }: AraBidDashboardProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.id === state.currentStep);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <AraLogo 
            className="h-12 mr-4" 
            showText={true}
          />
          <div>
            <h1 className="text-3xl font-bold text-white">ARA Bid Studio</h1>
            <p className="text-white/80">{ARA_TENANT_CONFIG.tagline}</p>
            <p className="text-white/60 text-sm">Property Services Tender Management</p>
          </div>
        </div>
      </div>

      {/* Current Tender Context */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Tenant</h3>
            <p className="text-white font-semibold">{ARA_TENANT_CONFIG.name}</p>
          </div>
          <div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Project</h3>
            <p className="text-white font-semibold">{state.projectName}</p>
          </div>
          <div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Tender</h3>
            <p className="text-white font-semibold">
              {state.tenderName || "No tender selected"}
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-6">Bid Workflow Progress</h2>
        
        <div className="flex items-center justify-between mb-6">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                ${index <= currentStepIndex 
                  ? 'bg-white text-black' 
                  : 'bg-white/20 text-white/60'
                }
              `}>
                {index + 1}
              </div>
              <div className="mt-2 text-center">
                <p className="text-white font-medium text-sm">{step.label}</p>
                <p className="text-white/60 text-xs">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatusCard 
          title="Documents" 
          count={state.documents.length}
          status={state.hasIngestedDocs}
          icon="📄"
        />
        <StatusCard 
          title="Requirements" 
          count={state.requirements.length}
          status={state.requirementsExtracted}
          icon="📋"
        />
        <StatusCard 
          title="Compliance" 
          count={state.complianceItems.length}
          status={state.complianceAnalyzed}
          icon="✅"
        />
        <StatusCard 
          title="Estimates" 
          count={state.estimateItems.length}
          status={state.estimateReady}
          icon="💰"
        />
        <StatusCard 
          title="Drafts" 
          count={state.drafts.length}
          status={state.draftsCompleted}
          icon="📝"
        />
        <StatusCard 
          title="Checklist" 
          count={state.checklist.filter(item => item.status === "done").length}
          status={state.submissionPrepared}
          icon="🎯"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionButton
            title="Upload Documents"
            description="Ingest RFP and tender documents"
            icon="📤"
            primary={!state.hasIngestedDocs}
          />
          <ActionButton
            title="Extract Requirements"
            description="Analyze and categorize requirements"
            icon="🔍"
            primary={state.hasIngestedDocs && !state.requirementsExtracted}
          />
          <ActionButton
            title="Generate Estimate"
            description="Create detailed cost estimates"
            icon="💸"
            primary={state.requirementsExtracted && !state.estimateReady}
          />
          <ActionButton
            title="Draft Proposal"
            description="Create proposal sections"
            icon="✍️"
            primary={state.estimateReady && !state.draftsCompleted}
          />
        </div>
      </div>

      {/* Current Step Details */}
      <CurrentStepDetails 
        step={WORKFLOW_STEPS[currentStepIndex]} 
        state={state} 
      />
    </div>
  );
}

function StatusCard({ title, count, status, icon }: {
  title: string;
  count: number;
  status: boolean;
  icon: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`w-3 h-3 rounded-full ${status ? 'bg-white' : 'bg-yellow-400'}`} />
      </div>
      <h3 className="text-white font-medium text-sm">{title}</h3>
      <p className="text-2xl font-bold text-white">{count}</p>
    </div>
  );
}

function ActionButton({ title, description, icon, primary }: {
  title: string;
  description: string;
  icon: string;
  primary?: boolean;
}) {
  return (
    <button className={`
      p-4 rounded-lg border text-left transition-all hover:scale-105
      ${primary 
        ? 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30' 
        : 'bg-white/5 border-white/20 hover:bg-white/10'
      }
    `}>
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-white font-medium text-sm mb-1">{title}</h3>
      <p className="text-white/60 text-xs">{description}</p>
    </button>
  );
}

function CurrentStepDetails({ step, state }: {
  step: typeof WORKFLOW_STEPS[0];
  state: AgentState;
}) {
  const getStepContent = () => {
    switch (step.id) {
      case "setup":
        return (
          <div>
            <p className="text-white/80 mb-4">
              Configure your project context and select the tender you're working on.
            </p>
            <ul className="text-white/60 text-sm space-y-2">
              <li>• Verify tenant: {state.tenantSlug}</li>
              <li>• Project: {state.projectName}</li>
              <li>• Tender: {state.tenderName || "Not selected"}</li>
            </ul>
          </div>
        );
      
      case "ingest":
        return (
          <div>
            <p className="text-white/80 mb-4">
              Upload and analyze RFP documents, SOWs, and specifications.
            </p>
            <ul className="text-white/60 text-sm space-y-2">
              <li>• Documents uploaded: {state.documents.length}</li>
              <li>• Analysis complete: {state.hasIngestedDocs ? "Yes" : "No"}</li>
            </ul>
          </div>
        );

      case "analyze":
        return (
          <div>
            <p className="text-white/80 mb-4">
              Extract requirements and perform capability mapping.
            </p>
            <ul className="text-white/60 text-sm space-y-2">
              <li>• Requirements extracted: {state.requirements.length}</li>
              <li>• Compliance items: {state.complianceItems.length}</li>
            </ul>
          </div>
        );

      default:
        return (
          <p className="text-white/80">
            {step.description}
          </p>
        );
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-white mb-4">
        Current Step: {step.label}
      </h2>
      {getStepContent()}
    </div>
  );
}
