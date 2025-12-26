import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css'; 
import ThinkingTrace from './ThinkingTrace';

const API_URL = "https://iti123-project.onrender.com"; 
const MAX_WAIT_TIME_MS = 300000; // 5 Minutes

export default function App() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Data
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("Tell me about a time you had to manage a difficult client situation.");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // --- HEALTH CHECK STATE ---
  const [serverStatus, setServerStatus] = useState("sleeping"); // 'sleeping', 'waking', 'ready', 'timeout'
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);

  // --- AUTO-WAKE FUNCTION ---
  const startWakeUp = () => {
    setServerStatus("waking");
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    pingBackend();
  };

  const pingBackend = async () => {
    // 1. Check if we passed the timeout limit
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    setElapsedTime(Math.floor(elapsed / 1000));

    if (elapsed > MAX_WAIT_TIME_MS) {
      setServerStatus("timeout");
      return; 
    }

    // 2. Try to hit the root endpoint
    try {
      const res = await axios.get(`${API_URL}/`, { timeout: 5000 });
      if (res.data.status === "OK") {
        setServerStatus("ready");
      }
    } catch (err) {
      // 3. If failed, keep waiting if status is still 'waking'
      console.log(`Backend sleeping... (${Math.floor(elapsed/1000)}s)`);
      setTimeout(() => {
        // Only recurse if we haven't succeeded yet
        setServerStatus((prevStatus) => {
          if (prevStatus === "waking") {
             pingBackend();
             return "waking";
          }
          return prevStatus;
        });
      }, 2000);
    }
  };

  // Run on Mount
  useEffect(() => {
    startWakeUp();
    
    // Optional: Visual timer interval (updates UI every second smoothly)
    const timerInterval = setInterval(() => {
      setServerStatus((prev) => {
        if (prev === "waking" && startTimeRef.current) {
           setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // --- HANDLERS ---
  const handleFileUpload = async (e) => {
    if (serverStatus !== 'ready') {
      alert("Please wait for the AI Server to come online.");
      e.target.value = null; 
      return;
    }

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
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeStream = async () => {
    if (!answer.trim()) return alert("Please type an answer first.");
    setLoading(true);
    setResult(null);
    setCurrentStep(1); 
    try {
      const response = await fetch(`${API_URL}/analyze_stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_answer: answer, question: question, target_role: targetRole, resume_text: resumeText })
      });
      if (!response.ok) throw new Error(response.statusText);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); 
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.type === "step") setCurrentStep(json.step_id);
            else if (json.type === "result") setResult(json.data);
            else if (json.type === "error") { alert("AI Error: " + json.message); setLoading(false); return; }
          } catch (e) { console.error("Parse Error", e); }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* --- SIDEBAR --- */}
      <div className="sidebar p-4">
        <div className="d-flex align-items-center mb-4 text-primary">
          <i className="bi bi-briefcase-fill fs-4 me-2"></i>
          <h5 className="mb-0 fw-bold">Poly-to-Pro</h5>
        </div>
        
        {/* --- STATUS INDICATOR --- */}
        <div className="mb-4">
          {serverStatus === 'ready' ? (
            <div className="d-flex align-items-center p-2 bg-success-subtle rounded border border-success-subtle">
              <span className="spinner-grow spinner-grow-sm text-success me-2" role="status"></span>
              <span className="small fw-bold text-success">System Online</span>
            </div>
          ) : serverStatus === 'timeout' ? (
            <div className="d-flex align-items-center p-2 bg-danger-subtle rounded border border-danger-subtle">
              <i className="bi bi-x-circle-fill text-danger me-2"></i>
              <div>
                <span className="small fw-bold text-danger d-block">Connection Failed</span>
                <span className="text-danger small" style={{fontSize: '10px'}}>Server unreachable</span>
              </div>
            </div>
          ) : (
             <div className="d-flex align-items-center p-2 bg-warning-subtle rounded border border-warning-subtle">
              <div className="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
              <div>
                <span className="small fw-bold text-warning-emphasis d-block">Waking up AI...</span>
                <span className="text-muted font-monospace" style={{fontSize: '11px'}}>
                   {elapsedTime}s / 300s
                </span>
              </div>
            </div>
          )}
        </div>

        <hr className="text-secondary opacity-25" />
        
        <div className="flex-grow-1 overflow-auto">
          {/* ... Role Select (Same as before) ... */}
          <div className="mb-4">
            <label className="form-label text-uppercase fw-bold text-muted" style={{fontSize: '11px'}}>Target Role</label>
            <select className="form-select shadow-sm" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Audit Associate</option>
              <option>Digital Marketer</option>
              <option>HR Executive</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label text-uppercase fw-bold text-muted" style={{fontSize: '11px'}}>Resume Context</label>
            <div className={`upload-box p-3 text-center position-relative ${resumeName ? 'border-success bg-success-subtle' : ''}`}>
              <input type="file" accept=".pdf" className="position-absolute top-0 start-0 w-100 h-100 opacity-0" style={{cursor: 'pointer'}} onChange={handleFileUpload} />
              {uploading ? (
                 <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              ) : resumeName ? (
                <div>
                  <i className="bi bi-check-circle-fill text-success fs-4 mb-1"></i>
                  <p className="mb-0 small fw-bold text-success text-truncate">{resumeName}</p>
                </div>
              ) : (
                <div>
                  <i className="bi bi-cloud-arrow-up text-secondary fs-4 mb-1"></i>
                  <p className="mb-0 small text-muted">Upload PDF</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main-content d-flex flex-column">
        
        {!resumeName ? (
          <div className="container h-100 d-flex flex-column justify-content-center align-items-center text-center fade-in">
             <div className="card card-modern p-5 shadow-lg border-0" style={{maxWidth: '600px'}}>
                <div className="mb-4">
                  <div className="bg-primary-subtle d-inline-block p-4 rounded-circle text-primary">
                    <i className="bi bi-file-earmark-person fs-1"></i>
                  </div>
                </div>
                <h2 className="fw-bold mb-3">Welcome to the Interview Simulator</h2>
                <p className="text-muted mb-4 lead">Please upload your resume to get started.</p>
                
                {/* DYNAMIC BUTTON BASED ON STATUS */}
                <div className="position-relative d-inline-block mx-auto">
                  {serverStatus === 'ready' ? (
                    <>
                      <button className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow">
                        {uploading ? <span><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</span> : <span><i className="bi bi-upload me-2"></i> Upload Resume (PDF)</span>}
                      </button>
                      <input type="file" accept=".pdf" onChange={handleFileUpload} className="position-absolute top-0 start-0 w-100 h-100 opacity-0" style={{cursor: 'pointer'}} />
                    </>
                  ) : serverStatus === 'timeout' ? (
                    <button className="btn btn-danger btn-lg px-5 py-3 rounded-pill shadow" onClick={startWakeUp}>
                      <i className="bi bi-arrow-clockwise me-2"></i> Retry Connection
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-lg px-5 py-3 rounded-pill shadow" disabled>
                       <span className="spinner-border spinner-border-sm me-2"></span>Waking up Server... ({elapsedTime}s)
                    </button>
                  )}
                </div>
                {serverStatus === 'waking' && <p className="text-muted mt-3 small">Free servers sleep when inactive. This takes ~50s.</p>}
             </div>
          </div>
        ) : (
            /* ... (Simulator Section - same as before) ... */
          <div className="container py-5 px-lg-5 pb-5 mb-5 fade-in">
             {/* ... Header, Question, Answer Area (Copied from previous steps) ... */}
             <div className="mb-5"><h1 className="fw-bolder display-6">Prepare for <span className="text-primary">{targetRole}</span></h1></div>
             {/* ... Question Select ... */}
             <div className="card card-modern bg-white mb-4"><div className="card-body p-1"><select className="form-select form-select-lg border-0 bg-transparent fw-bold text-secondary" value={question} onChange={(e) => setQuestion(e.target.value)}><option>Tell me about a time you had to manage a difficult client situation.</option><option>Describe a project where you had to analyze complex data.</option><option>Tell me about a time you failed to meet a deadline.</option><option value="custom">-- Type Custom Question --</option></select></div></div>
             {question === "custom" && <input type="text" className="form-control form-control-lg mb-4" placeholder="Type your question..." onChange={(e) => setQuestion(e.target.value)} />}
             
             {/* Answer Area */}
             <div className="mb-5 position-relative">
              <textarea className="form-control p-4 shadow-sm" rows="8" value={answer} onChange={(e) => setAnswer(e.target.value)} style={{borderRadius: '16px', border: '1px solid #e2e8f0', resize: 'none'}}></textarea>
              <div className="d-flex justify-content-end mt-3"><button className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm" onClick={handleAnalyzeStream} disabled={loading}>{loading ? <span>Validating...</span> : <span>Validate Answer <i className="bi bi-arrow-right ms-2"></i></span>}</button></div>
             </div>

             {loading && <ThinkingTrace currentStep={currentStep} />}

             {!loading && result && (
              <div className="row g-4 fade-in">
                <div className="col-lg-12">
                  <div className="card card-modern border-0 h-100">
                    <div className="card-header bg-danger-subtle border-0 py-3"><h6 className="mb-0 fw-bold text-danger-emphasis">Hiring Manager Feedback</h6></div>
                    <div className="card-body p-4 text-secondary markdown-body"><ReactMarkdown>{result.manager_critique}</ReactMarkdown></div>
                  </div>
                </div>
                <div className="col-lg-12">
                  <div className="card card-modern border-0 h-100">
                    <div className="card-header bg-success-subtle border-0 py-3"><h6 className="mb-0 fw-bold text-success-emphasis">Career Coach Refinement</h6></div>
                    <div className="card-body p-4 text-secondary markdown-body"><ReactMarkdown>{result.coach_feedback}</ReactMarkdown></div>
                  </div>
                </div>
              </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}