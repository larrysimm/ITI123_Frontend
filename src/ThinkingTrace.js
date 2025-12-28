import React, { useState, useEffect } from 'react';

// 1. Add coachThinking to props
export default function ThinkingTrace({ currentStep, managerThinking, coachThinking }) {
  const [showDetails, setShowDetails] = useState(true);
  
  // 2. Separate toggles for Manager and Coach
  const [expandManager, setExpandManager] = useState(false);
  const [expandCoach, setExpandCoach] = useState(false);

  useEffect(() => {
    if (currentStep === 100) {
      setShowDetails(false);
    } else {
      setShowDetails(true);
    }
  }, [currentStep]);

  const steps = [
    { id: 1, text: "Extracting Role & Skill Data..." },
    { id: 2, text: "Manager: Proficiency Analysis..." },
    { id: 3, text: "Coach: Structure Refinement..." }, // Coach is Step 3
    { id: 4, text: "Finalizing Architected Answer..." }
  ];

  // Helper to render the collapsible logic box
  const renderLogicBox = (thinkingText, isExpanded, toggleFunc) => (
    <div className="ms-5 mt-2 fade-in">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          toggleFunc(!isExpanded);
        }}
        className="btn btn-sm btn-light border-0 text-secondary d-flex align-items-center px-0"
        style={{ fontSize: '0.8rem' }}
      >
        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} me-1`}></i>
        {isExpanded ? "Hide Agent Logic" : "View Agent Logic"}
      </button>
      
      {isExpanded && (
        <div className="card bg-white border mt-1 shadow-sm">
          <div className="card-body p-2 bg-dark-subtle rounded">
            <pre className="mb-0 text-dark-emphasis" style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '0.75rem', 
              fontFamily: 'monospace' 
            }}>
              {thinkingText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card card-modern border-0 mb-4 fade-in bg-light">
      <div className="card-body p-4">
        
        <div 
          className={`d-flex align-items-center justify-content-between ${showDetails ? 'mb-4' : 'mb-0'}`}
          onClick={() => setShowDetails(!showDetails)}
          style={{ cursor: 'pointer' }}
        >
          <div className="d-flex align-items-center">
            {currentStep < 100 ? (
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
          <div className="text-secondary small fw-medium d-flex align-items-center">
            {showDetails ? "Hide Process" : "Show Details"}
            <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'} ms-2`}></i>
          </div>
        </div>

        {showDetails && (
          <div className="d-flex flex-column gap-3 fade-in">
            {steps.map((step) => {
              let status = 'pending';
              if (currentStep > step.id || currentStep === 100) status = 'completed';
              if (currentStep === step.id) status = 'active';

              return (
                <div key={step.id} className="d-flex flex-column transition-all">
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

                  {/* 🔹 Render Manager Logic (Step 2) */}
                  {step.id === 2 && managerThinking && renderLogicBox(managerThinking, expandManager, setExpandManager)}

                  {/* 🔹 Render Coach Logic (Step 3) */}
                  {step.id === 3 && coachThinking && renderLogicBox(coachThinking, expandCoach, setExpandCoach)}
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}