import React, { useState } from 'react';

// 🔹 Accept 'managerThinking' as a new prop
export default function ThinkingTrace({ currentStep, managerThinking }) {
  const [expanded, setExpanded] = useState(false);

  const steps = [
    { id: 1, text: "Extracting Role & Skill Data..." },
    { id: 2, text: "Manager: Proficiency Analysis..." }, // We will attach logic here
    { id: 3, text: "Coach: Structure Refinement..." },
    { id: 4, text: "Finalizing Architected Answer..." }
  ];

  return (
    <div className="card card-modern border-0 mb-5 fade-in bg-light">
      <div className="card-body p-4">
        
        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          {currentStep < 5 ? (
             <>
               <div className="spinner-border text-primary me-3" style={{width: '1.5rem', height: '1.5rem'}} role="status"></div>
               <h6 className="mb-0 fw-bold text-primary">AI Analyst is working...</h6>
             </>
          ) : (
             <>
               <i className="bi bi-check-circle-fill text-success me-3 fs-4"></i>
               <h6 className="mb-0 fw-bold text-success">Analysis Complete</h6>
             </>
          )}
        </div>

        {/* Steps List */}
        <div className="d-flex flex-column gap-3">
          {steps.map((step) => {
            let status = 'pending';
            if (currentStep > step.id) status = 'completed';
            if (currentStep === step.id) status = 'active';

            return (
              <div key={step.id} className="d-flex flex-column transition-all">
                
                {/* Step Row */}
                <div className="d-flex align-items-center">
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

                {/* 🔹 NEW: INSERT THINKING TRACE UNDER STEP 2 */}
                {step.id === 2 && managerThinking && (
                  <div className="ms-5 mt-2 fade-in">
                    <button 
                      onClick={() => setExpanded(!expanded)}
                      className="btn btn-sm btn-light border-0 text-secondary d-flex align-items-center px-0"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <i className={`bi bi-chevron-${expanded ? 'down' : 'right'} me-1`}></i>
                      {expanded ? "Hide Manager Logic" : "View Manager Logic"}
                    </button>
                    
                    {expanded && (
                      <div className="card bg-white border mt-1 shadow-sm">
                        <div className="card-body p-2 bg-dark-subtle rounded">
                          <pre className="mb-0 text-dark-emphasis" style={{ 
                            whiteSpace: 'pre-wrap', 
                            fontSize: '0.75rem', 
                            fontFamily: 'monospace' 
                          }}>
                            {managerThinking}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}