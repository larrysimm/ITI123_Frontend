import React from 'react';

export default function SidebarTrace({ currentStep }) {
  
  // Define the specific steps for Skill Analysis
  const steps = [
    { id: 1, text: "Retrieving Role Standards..." },
    { id: 2, text: "Scanning Resume Keywords..." },
    { id: 3, text: "Calculating Proficiency Gaps..." }
  ];

  return (
    <div className="card border-0 bg-light mb-3 fade-in">
      <div className="card-body p-3">
        
        {/* Header */}
        <div className="d-flex align-items-center mb-3">
           <div className="spinner-border text-primary me-2" style={{width: '1rem', height: '1rem', borderWidth: '2px'}}></div>
           <small className="fw-bold text-primary">AI Skill Matcher</small>
        </div>

        {/* Steps List */}
        <div className="d-flex flex-column gap-2">
          {steps.map((step) => {
            let status = 'pending';
            if (currentStep > step.id || currentStep === 100) status = 'completed';
            if (currentStep === step.id) status = 'active';

            return (
              <div key={step.id} className="d-flex align-items-center transition-all">
                {/* Icon Column */}
                <div className="me-2" style={{width: '16px'}}>
                  {status === 'completed' && <i className="bi bi-check-circle-fill text-success" style={{fontSize: '0.9rem'}}></i>}
                  {status === 'active' && <div className="spinner-grow text-primary" style={{width: '8px', height: '8px'}}></div>}
                  {status === 'pending' && <div className="rounded-circle border" style={{width: '8px', height: '8px', borderColor: '#cbd5e1'}}></div>}
                </div>
                
                {/* Text Column */}
                <span className={`small ${
                  status === 'completed' ? 'text-dark' : 
                  status === 'active' ? 'text-primary fw-bold' : 'text-muted opacity-75'
                }`} style={{fontSize: '0.75rem'}}>
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