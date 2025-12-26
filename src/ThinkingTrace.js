import React from 'react';

export default function ThinkingTrace({ currentStep }) {
  // These are the static labels, but we unlock them based on 'currentStep' from the backend
  const steps = [
    { id: 1, text: "Reading resume context..." },
    { id: 2, text: "Analyzing STAR structure..." },
    { id: 3, text: "Cross-referencing SkillsFuture..." },
    { id: 4, text: "Drafting final feedback..." }
  ];

  return (
    <div className="card card-modern border-0 mb-5 fade-in bg-light">
      <div className="card-body p-4">
        <div className="d-flex align-items-center mb-4">
          <div className="spinner-border text-primary me-3" style={{width: '1.5rem', height: '1.5rem'}} role="status"></div>
          <h6 className="mb-0 fw-bold text-primary">AI Analyst is working...</h6>
        </div>

        <div className="d-flex flex-column gap-3">
          {steps.map((step) => {
            // LOGIC: If the backend says we are at step 3, then 1 and 2 are DONE, 3 is ACTIVE.
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