import React, { useEffect, useRef } from 'react';

export default function SidebarTrace({ currentStep, liveMessage }) {
  const scrollRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveMessage]);

  const steps = [
    { id: 1, text: "Retrieving Standards" },
    { id: 2, text: "AI Gap Analysis" },
    { id: 3, text: "Formatting Results" }
  ];

  return (
    <div className="card border-0 bg-light mb-3 fade-in">
      <div className="card-body p-3">
        
        {/* Header */}
        <div className="d-flex align-items-center mb-3">
           <div className="spinner-border text-primary me-2" style={{width: '1rem', height: '1rem', borderWidth: '2px'}}></div>
           <small className="fw-bold text-primary">Live Skill Analysis</small>
        </div>

        {/* Steps */}
        <div className="d-flex flex-column gap-2 mb-3">
          {steps.map((step) => {
            let status = 'pending';
            if (currentStep > step.id || currentStep === 100) status = 'completed';
            if (currentStep === step.id) status = 'active';

            return (
              <div key={step.id} className="d-flex align-items-center">
                <div className="me-2" style={{width: '16px'}}>
                  {status === 'completed' && <i className="bi bi-check-circle-fill text-success" style={{fontSize: '0.9rem'}}></i>}
                  {status === 'active' && <div className="spinner-grow text-primary" style={{width: '8px', height: '8px'}}></div>}
                  {status === 'pending' && <div className="rounded-circle border" style={{width: '8px', height: '8px', borderColor: '#cbd5e1'}}></div>}
                </div>
                <span className={`small ${status === 'active' ? 'fw-bold text-dark' : 'text-muted'}`} style={{fontSize: '0.75rem'}}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Box */}
        <div 
            ref={scrollRef}
            className="bg-dark rounded p-2 mt-2 d-flex align-items-center" 
            style={{ fontFamily: 'monospace', height: '45px', overflowY: 'hidden' }}
        >
            <span className="text-success me-2">➜</span>
            <span className="text-white small text-truncate" style={{ fontSize: '0.75rem' }}>
                {liveMessage || "Initializing..."}
            </span>
        </div>

      </div>
    </div>
  );
}