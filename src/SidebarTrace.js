import React, { useState, useEffect } from 'react';

export default function SidebarTrace({ currentStep, traceLogs }) {
  // Track which step is expanded (default to the current running step)
  const [expandedStep, setExpandedStep] = useState(null);

  // Auto-expand the step that is currently active
  useEffect(() => {
    if (currentStep > 0 && currentStep < 100) {
      setExpandedStep(currentStep);
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

  return (
    <div className="card border-0 bg-light mb-3 fade-in">
      <div className="card-body p-2">
        
        {/* Header */}
        <div className="d-flex align-items-center mb-3 px-2 pt-1">
           <div className="spinner-border text-primary me-2" style={{width: '0.8rem', height: '0.8rem', borderWidth: '2px'}}></div>
           <small className="fw-bold text-primary" style={{fontSize: '0.75rem'}}>LIVE ANALYSIS TRACE</small>
        </div>

        {/* Expandable Steps */}
        <div className="d-flex flex-column gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id || currentStep === 100;
            const logContent = traceLogs[step.id] || "";
            const isExpanded = expandedStep === step.id;

            return (
              <div key={step.id} className="border rounded bg-white shadow-sm overflow-hidden">
                
                {/* Step Header (Clickable) */}
                <div 
                    className={`d-flex align-items-center p-2 cursor-pointer ${isActive ? 'bg-primary-subtle' : ''}`}
                    onClick={() => toggleStep(step.id)}
                    style={{ cursor: 'pointer' }}
                >
                  {/* Status Icon */}
                  <div className="me-2" style={{width: '20px'}}>
                    {isDone ? (
                      <i className="bi bi-check-circle-fill text-success"></i>
                    ) : isActive ? (
                      <div className="spinner-grow text-primary" style={{width: '10px', height: '10px'}}></div>
                    ) : (
                      <i className={`bi ${step.icon} text-muted opacity-50`}></i>
                    )}
                  </div>

                  {/* Title */}
                  <span className={`small flex-grow-1 ${isActive ? 'fw-bold text-primary' : 'text-dark'}`} style={{fontSize: '0.8rem'}}>
                    {step.title}
                  </span>

                  {/* Chevron (Only if there are logs) */}
                  {logContent && (
                    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted small`}></i>
                  )}
                </div>

                {/* Detailed Logs (Expandable) */}
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