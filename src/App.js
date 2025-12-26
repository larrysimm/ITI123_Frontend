import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import ThinkingTrace from './ThinkingTrace';
import './App.css'; // Ensure you have basic styles

// Use Env Var or Default to Localhost
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000"; 
const MAX_WAIT_TIME_MS = 300000; // 5 Minutes Timeout

export default function App() {
  // UI State
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Data State
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("Tell me about a time you had to manage a difficult client situation.");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [questionBank, setQuestionBank] = useState([]); // Store the list
  const [isCustomQuestion, setIsCustomQuestion] = useState(false); // Toggle dropdown vs input

  // Server Health State
  const [serverStatus, setServerStatus] = useState("sleeping"); // sleeping, waking, ready, timeout
  const [elapsedTime, setElapsedTime] = useState(0);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const startTimeRef = useRef(null);

  // --- 1. AUTO-WAKE & PING LOGIC ---
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    // Reset logic on trigger
    setServerStatus("waking");
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    const ping = async () => {
      if (!isMounted) return;

      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      setElapsedTime(Math.floor(elapsed / 1000));

      // 1. Timeout Check
      if (elapsed > MAX_WAIT_TIME_MS) {
        if (isMounted) setServerStatus("timeout");
        return; // Stop looping
      }

      // 2. API Call
      try {
        const res = await axios.get(`${API_URL}/`, { timeout: 5000 });
        if (res.data.status === "OK") {
          if (isMounted) setServerStatus("ready");
          return; // Stop looping on success
        }
      } catch (err) {
        // Ignore error, continue to retry logic
      }

      // 3. Recursive Retry
      // We removed the check for 'serverStatus' here to fix the lint warning.
      // The 'return' above guarantees we only reach here if we haven't succeeded yet.
      if (isMounted) {
        timeoutId = setTimeout(ping, 2000);
      }
    };

    ping();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // DEPENDENCIES: Only retryTrigger. The effect won't re-run on state changes, which is what we want.
  }, [retryTrigger]);

  // Visual Timer Interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (serverStatus === "waking" && startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [serverStatus]);

  // FETCH QUESTIONS ON LOAD
useEffect(() => {
    // Only run if we think the server is ready (or bypass check)
    if (serverStatus === 'ready') { 
      console.log("🚀 React is asking for questions...");

      axios.get(`${API_URL}/questions`)
        .then(res => {
          console.log("✅ DATA RECEIVED IN REACT:", res.data); // Look for this in Console
          
          // 1. Force the data into the state
          setQuestionBank(res.data);
          
          // 2. Select the first question immediately
          if (Array.isArray(res.data) && res.data.length > 0) {
            setQuestion(res.data[0].text);
          } else {
            console.error("⚠️ Data format is wrong. Expected Array, got:", typeof res.data);
          }
        })
        .catch(err => {
          console.error("❌ React Fetch Error:", err);
          alert("Error fetching data. Check Console.");
        });
    }
  }, [serverStatus]);

  // --- 2. HANDLERS ---
  const handleFileUpload = async (e) => {
    if (serverStatus !== 'ready') return alert("Waiting for server...");
    
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await axios.post(`${API_URL}/upload_resume`, formData);
      setResumeText(res.data.extracted_text);
      setResumeName(res.data.filename);
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeStream = async () => {
    if (!answer.trim()) return alert("Please type an answer.");
    
    setLoading(true);
    setResult(null);
    setCurrentStep(1);

    try {
      const response = await fetch(`${API_URL}/analyze_stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_answer: answer,
          question: question,
          target_role: targetRole,
          resume_text: resumeText || "No resume."
        })
      });

      if (!response.ok) throw new Error("Network Error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete chunk

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.type === "step") setCurrentStep(json.step_id);
            else if (json.type === "result") setResult(json.data);
            else if (json.type === "error") {
              alert("Error: " + json.message);
              setLoading(false);
              return;
            }
          } catch (e) { console.error(e); }
        }
      }
    } catch (err) {
      alert("Connection Failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. RENDER ---
  return (
    // 1. USE CUSTOM WRAPPER (Fixes the screen height to 100%)
    <div className="dashboard-container">
      
      {/* 2. SIDEBAR (Uses custom class) */}
      <div className="sidebar p-4">
        <h4 className="fw-bold text-primary mb-4">Poly-to-Pro</h4>
        
        {/* Status Badge */}
        <div className="mb-4">
          {serverStatus === 'ready' ? (
             <div className="alert alert-success py-2 d-flex align-items-center small fw-bold">
               <span className="me-2">●</span> System Online
             </div>
          ) : serverStatus === 'timeout' ? (
             <div className="alert alert-danger py-2 small">
               <div>Connection Failed</div>
               <button className="btn btn-sm btn-outline-danger mt-2" onClick={() => setRetryTrigger(p => p+1)}>Retry</button>
             </div>
          ) : (
             <div className="alert alert-warning py-2 small">
               <div className="spinner-border spinner-border-sm me-2"></div>
               Waking up... ({elapsedTime}s)
             </div>
          )}
        </div>

        {/* Inputs */}
        <div className="mb-3">
          <label className="small fw-bold text-muted" style={{fontSize: '11px'}}>TARGET ROLE</label>
          <select className="form-select shadow-sm" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
            <option>Software Engineer</option>
            <option>Data Analyst</option>
            <option>Digital Marketer</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="small fw-bold text-muted" style={{fontSize: '11px'}}>RESUME</label>
          <div className="card p-3 text-center bg-light border-dashed position-relative">
            {uploading ? <span className="spinner-border spinner-border-sm text-primary"></span> : 
             resumeName ? 
              <div className="text-truncate">
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                <span className="text-success fw-bold small">{resumeName}</span>
              </div> : 
             <div className="text-muted small"><i className="bi bi-cloud-upload me-2"></i>Upload PDF</div>
            }
            <input 
              type="file" accept=".pdf" 
              disabled={serverStatus !== 'ready'}
              onChange={handleFileUpload}
              className="position-absolute w-100 h-100 start-0 top-0 opacity-0"
              style={{cursor: 'pointer'}}
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT (Uses custom class for scrolling) */}
      <div className="main-content">
        <div className="container" style={{maxWidth: '900px'}}>
          {/* --- DEBUG BOX START --- */}
          <div className="alert alert-info">
             <small>Debug Status: {serverStatus}</small><br/>
             <small>Questions in Memory: {questionBank.length}</small>
             <details>
               <summary>View Raw Data</summary>
               <pre>{JSON.stringify(questionBank, null, 2)}</pre>
             </details>
          </div>
          {/* --- DEBUG BOX END --- */}
          
          <h1 className="display-6 fw-bold mb-4 text-dark">Mock Interview</h1>
          
          <div className="mb-4">
             <div className="card border-0 shadow-sm">
               <div className="card-body p-2">
                 
                 {/* MODE A: DROPDOWN LIST */}
                 {!isCustomQuestion ? (
                   <select 
                     className="form-select border-0 fw-bold text-secondary" 
                     style={{fontSize: '1.1rem'}} 
                     value={question} 
                     onChange={(e) => {
                       if (e.target.value === "CUSTOM_MODE") {
                         setIsCustomQuestion(true);
                         setQuestion(""); // Clear text for typing
                       } else {
                         setQuestion(e.target.value);
                       }
                     }}
                   >
                     {/* 1. Map questions from JSON/DB */}
                     {questionBank.map((q, index) => (
                       <option key={index} value={q.text}>
                         {q.text}
                       </option>
                     ))}
                     
                     {/* 2. Divider & Custom Option */}
                     <option disabled>──────────────────────────</option>
                     <option value="CUSTOM_MODE">✎ Type a custom question...</option>
                   </select>
                 ) : (
                   
                   /* MODE B: TEXT INPUT (Back button included) */
                   <div className="d-flex gap-2">
                     <button 
                       className="btn btn-light border text-muted"
                       onClick={() => {
                         setIsCustomQuestion(false);
                         // Reset to first question in bank if exists
                         if(questionBank.length > 0) setQuestion(questionBank[0].text);
                       }}
                       title="Back to list"
                     >
                       <i className="bi bi-arrow-left"></i>
                     </button>
                     <input 
                       className="form-control border-0 fw-bold text-secondary" 
                       placeholder="Type your interview question here..." 
                       value={question} 
                       autoFocus
                       onChange={e => setQuestion(e.target.value)}
                     />
                   </div>
                 )}
               </div>
             </div>
          </div>

          <div className="mb-4">
            <textarea 
              className="form-control p-4 shadow-sm" rows="6"
              placeholder="Type your answer here..."
              style={{resize: 'none', borderRadius: '12px'}}
              value={answer} onChange={e => setAnswer(e.target.value)}
            ></textarea>
            
            <div className="d-flex justify-content-end mt-3">
              <button 
                className="btn btn-primary btn-lg px-5 rounded-pill shadow"
                onClick={handleAnalyzeStream}
                disabled={loading || serverStatus !== 'ready'}
              >
                {loading ? <span><span className="spinner-border spinner-border-sm me-2"></span>Analyzing...</span> : "Validate Answer"}
              </button>
            </div>
          </div>

          {loading && <ThinkingTrace currentStep={currentStep} />}

          {result && !loading && (
            <div className="row g-4 pb-5"> 
              
              {/* 1. MANAGER GAPS (Red) */}
              <div className="col-12">
                <div className="card card-modern h-100">
                  <div className="card-header bg-danger-subtle border-0 py-3 d-flex align-items-center">
                    <i className="bi bi-exclamation-octagon-fill text-danger fs-5 me-3"></i>
                    <h6 className="mb-0 fw-bold text-danger-emphasis">Manager's Gaps</h6>
                  </div>
                  <div className="card-body p-4 markdown-body text-secondary">
                    <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* 2. COACH CRITIQUE (Yellow) */}
              <div className="col-12">
                <div className="card card-modern h-100">
                  <div className="card-header bg-warning-subtle border-0 py-3 d-flex align-items-center">
                    <i className="bi bi-lightbulb-fill text-warning-emphasis fs-5 me-3"></i>
                    <h6 className="mb-0 fw-bold text-warning-emphasis">STAR Method Critique</h6>
                  </div>
                  <div className="card-body p-4 markdown-body text-secondary">
                    <ReactMarkdown>{result.coach_critique}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* 3. REWRITTEN ANSWER (Green) */}
              <div className="col-12">
                <div className="card card-modern h-100 border-success-subtle">
                  <div className="card-header bg-success-subtle border-0 py-3 d-flex align-items-center">
                    <i className="bi bi-patch-check-fill text-success fs-5 me-3"></i>
                    <h6 className="mb-0 fw-bold text-success-emphasis">Optimized Model Answer</h6>
                  </div>
                  <div className="card-body p-4 markdown-body text-dark bg-success-subtle bg-opacity-10">
                    <ReactMarkdown>{result.rewritten_answer}</ReactMarkdown>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}