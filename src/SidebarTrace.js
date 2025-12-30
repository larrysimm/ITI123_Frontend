import React, { useState, useEffect } from 'react';

export default function SidebarTrace({ currentStep, traceLogs }) {
  const [expandedStep, setExpandedStep] = useState(null);

  // 1. Auto-expand active steps
  // 2. Auto-collapse when finished (Step 100) to make room for results
  useEffect(() => {
    if (currentStep < 100) {
      setExpandedStep(currentStep);
    } else {
      setExpandedStep(null); // Collapse all when done
    }
  }, [currentStep]);

  const steps = [
    { id: 1, title: "Retrieving Standards", icon: "bi-database" },
    { id: 2, title: "AI Gap Analysis", icon: "bi-cpu" },
    { id: 3, title: "Formatting Results", icon: "bi-file-earmark-code" }
  ];

  const toggleStep = (id) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  const isComplete = currentStep === 100;

  return (
    <div className={`card border-0 mb-3 fade-in ${isComplete ? 'bg-success-subtle' : 'bg-light'}`}>
      <div className="card-body p-2">
        
        {/* Header - Changes color when done */}
        <div className="d-flex align-items-center mb-2 px-2 pt-1">
           {isComplete ? (
             <i className="bi bi-check-all text-success me-2"></i>
           ) : (
             <div className="spinner-border text-primary me-2" style={{width: '0.8rem', height: '0.8rem', borderWidth: '2px'}}></div>
           )}
           <small className={`fw-bold ${isComplete ? 'text-success' : 'text-primary'}`} style={{fontSize: '0.75rem'}}>
             {isComplete ? "ANALYSIS COMPLETE" : "LIVE ANALYSIS TRACE"}
           </small>
        </div>

        {/* Steps List */}
        <div className="d-flex flex-column gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id || isComplete;
            const logContent = traceLogs[step.id] || "";
            const isExpanded = expandedStep === step.id;

            return (
              <div key={step.id} className="border rounded bg-white shadow-sm overflow-hidden">
                
                {/* Step Header */}
                <div 
                    className={`d-flex align-items-center p-2 cursor-pointer ${isActive ? 'bg-primary-subtle' : ''}`}
                    onClick={() => toggleStep(step.id)}
                    style={{ cursor: 'pointer' }}
                >
                  <div className="me-2" style={{width: '20px'}}>
                    {isDone ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : isActive ? (
                      <div className="spinner-grow text-primary" style={{width: '10px', height: '10px'}}></div>
                    ) : (
                      <i className={`bi ${step.icon} text-muted opacity-50`}></i>
                    )}
                  </div>

                  <span className={`small flex-grow-1 ${isActive ? 'fw-bold text-primary' : 'text-dark'}`} style={{fontSize: '0.8rem'}}>
                    {step.title}
                  </span>

                  {logContent && (
                    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted small`}></i>
                  )}
                </div>

                {/* Logs */}
                {isExpanded && logContent && (
                  <div className="bg-dark p-2 border-top">
                    <pre className="text-white mb-0 small" style={{ 
                        fontSize: '0.65rem', 
                        whiteSpace: 'pre-wrap', 
                        fontFamily: 'Consolas, monospace',
                        maxHeight: '150px',
                        overflowY: 'auto'
                    }}>
                      {logContent}
                    </pre>
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