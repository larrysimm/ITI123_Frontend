import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css'; 
import ThinkingTrace from './ThinkingTrace';

const API_URL = "https://iti123-project.onrender.com"; 

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

  // Streaming State
  const [currentStep, setCurrentStep] = useState(0);

  // --- NEW: SERVER HEALTH STATE ---
  const [serverStatus, setServerStatus] = useState("sleeping"); // 'sleeping', 'waking', 'ready'

  // --- NEW: AUTO-WAKE FUNCTION ---
  useEffect(() => {
    const wakeUpBackend = async () => {
      setServerStatus("waking");
      try {
        // Try to hit the root endpoint
        const res = await axios.get(`${API_URL}/`, { timeout: 5000 }); // 5s timeout
        if (res.data.status === "OK") {
          setServerStatus("ready");
        }
      } catch (err) {
        // If it fails (timeout or 503), try again in 2 seconds
        console.log("Backend sleeping... pinging again...");
        setTimeout(wakeUpBackend, 2000);
      }
    };

    wakeUpBackend();
  }, []);

  // --- HANDLERS ---
  const handleFileUpload = async (e) => {
    // Prevent interaction if server is waking
    if (serverStatus !== 'ready') {
      alert("Please wait for the AI Server to wake up (Status indicator in sidebar). This can take ~50 seconds on the free tier.");
      e.target.value = null; // Reset file input
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
        body: JSON.stringify({
          student_answer: answer,
          question: question,
          target_role: targetRole,
          resume_text: resumeText || "No resume context."
        })
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
            else if (json.type === "error") {
              alert("AI Error: " + json.message);
              setLoading(false);
              return;
            }
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
        
        {/* --- NEW: STATUS INDICATOR --- */}
        <div className="mb-4">
          {serverStatus === 'ready' ? (
            <div className="d-flex align-items-center p-2 bg-success-subtle rounded border border-success-subtle">
              <span className="spinner-grow spinner-grow-sm text-success me-2" role="status"></span>
              <span className="small fw-bold text-success">System Online</span>
            </div>
          ) : (
             <div className="d-flex align-items-center p-2 bg-warning-subtle rounded border border-warning-subtle">
              <div className="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
              <div>
                <span className="small fw-bold text-warning-emphasis d-block">Waking up AI...</span>
                <span className="text-muted" style={{fontSize: '10px'}}>Takes ~50s (Free Tier)</span>
              </div>
            </div>
          )}
        </div>

        <hr className="text-secondary opacity-25" />
        
        <div className="flex-grow-1 overflow-auto">
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
                
                {/* BLOCKED BUTTON IF SLEEPING */}
                <div className="position-relative d-inline-block mx-auto">
                  <button 
                    className={`btn btn-lg px-5 py-3 rounded-pill shadow ${serverStatus === 'ready' ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={serverStatus !== 'ready'}
                  >
                    {serverStatus === 'ready' ? (
                       uploading ? <span><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</span> : <span><i className="bi bi-upload me-2"></i> Upload Resume (PDF)</span>
                    ) : (
                       <span><span className="spinner-border spinner-border-sm me-2"></span>Wait for System...</span>
                    )}
                  </button>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="position-absolute top-0 start-0 w-100 h-100 opacity-0" style={{cursor: 'pointer'}} disabled={serverStatus !== 'ready'} />
                </div>
             </div>
          </div>
        ) : (
          <div className="container py-5 px-lg-5 pb-5 mb-5 fade-in">
            <div className="mb-5">
              <span className="badge bg-success-subtle text-success border border-success-subtle mb-3"><i className="bi bi-check-circle me-1"></i> RESUME ACTIVE</span>
              <h1 className="fw-bolder display-6">Prepare for <span className="text-primary">{targetRole}</span></h1>
            </div>

            <div className="card card-modern bg-white mb-4">
              <div className="card-body p-1">
                <select className="form-select form-select-lg border-0 bg-transparent fw-bold text-secondary" value={question} onChange={(e) => setQuestion(e.target.value)}>
                  <option>Tell me about a time you had to manage a difficult client situation.</option>
                  <option>Describe a project where you had to analyze complex data.</option>
                  <option>Tell me about a time you failed to meet a deadline.</option>
                  <option value="custom">-- Type Custom Question --</option>
                </select>
              </div>
            </div>
            {question === "custom" && <input type="text" className="form-control form-control-lg mb-4" placeholder="Type your question..." onChange={(e) => setQuestion(e.target.value)} />}

            <div className="mb-5 position-relative">
              <textarea 
                className="form-control p-4 shadow-sm" rows="8" 
                placeholder="Situation: I was working on... Task: My goal was to... Action: I specifically... Result: The outcome was..."
                style={{borderRadius: '16px', border: '1px solid #e2e8f0', resize: 'none'}}
                value={answer} onChange={(e) => setAnswer(e.target.value)}
              ></textarea>
              
              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm" onClick={handleAnalyzeStream} disabled={loading}>
                  {loading ? <span>Validating...</span> : <span>Validate Answer <i className="bi bi-arrow-right ms-2"></i></span>}
                </button>
              </div>
            </div>

            {loading && <ThinkingTrace currentStep={currentStep} />}

            {!loading && result && (
              <div className="row g-4 fade-in">
                <div className="col-lg-12">
                  <div className="card card-modern border-0 h-100">
                    <div className="card-header bg-danger-subtle border-0 py-3 d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle-fill text-danger fs-5 me-3"></i>
                      <h6 className="mb-0 fw-bold text-danger-emphasis">Hiring Manager Feedback</h6>
                    </div>
                    <div className="card-body p-4 text-secondary markdown-body"><ReactMarkdown>{result.manager_critique}</ReactMarkdown></div>
                  </div>
                </div>

                <div className="col-lg-12">
                  <div className="card card-modern border-0 h-100">
                    <div className="card-header bg-success-subtle border-0 py-3 d-flex align-items-center">
                      <i className="bi bi-stars text-success fs-5 me-3"></i>
                      <h6 className="mb-0 fw-bold text-success-emphasis">Career Coach Refinement</h6>
                    </div>
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