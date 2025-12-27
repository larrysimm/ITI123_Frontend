import React from 'react';

export default function ThinkingTrace({ currentStep }) {
  // LOGIC: These steps match the backend 'step_id' events
  const steps = [
    { id: 1, text: "Extracting Role & Skill Data..." },     // Backend Step 1
    { id: 2, text: "Manager: Proficiency Analysis..." },    // Backend Step 2
    { id: 3, text: "Coach: Structure Refinement..." },      // Backend Step 3
    { id: 4, text: "Finalizing Architected Answer..." }     // Backend Step 4
  ];

  return (
    // UI STYLE: Kept exactly as you requested
    <div className="card card-modern border-0 mb-5 fade-in bg-light">
      <div className="card-body p-4">
        <div className="d-flex align-items-center mb-4">
          <div className="spinner-border text-primary me-3" style={{width: '1.5rem', height: '1.5rem'}} role="status"></div>
          <h6 className="mb-0 fw-bold text-primary">AI Analyst is working...</h6>
        </div>

        <div className="d-flex flex-column gap-3">
          {steps.map((step) => {
            // LOGIC: Determine status based on currentStep from Backend
            let status = 'pending';
            if (currentStep > step.id) status = 'completed';
            if (currentStep === step.id) status = 'active';

            return (
              <div key={step.id} className="d-flex align-items-center transition-all">
                <div className="me-3" style={{width: '24px'}}>
                  {status === 'completed' && <i className="bi bi-check-circle-fill text-success fs-5 fade-in"></i>}
                  {status === 'active' && <div className="spinner-grow text-primary" style={{width: '12px', height: '12px'}}></div>}
                  {status === 'pending' && <div className="rounded-circle border border-2" style={{width: '12px', height: '12px', borderColor: '#cbd5e1'}}></div>}
                </div>
                <span className={`small fw-medium ${
                  status === 'completed' ? 'text-dark' : 
                  status === 'active' ? 'text-primary fw-bold' : 'text-muted opacity-50'
                }`}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}