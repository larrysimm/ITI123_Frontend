import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import ThinkingTrace from './ThinkingTrace';
import './App.css'; // Ensure you have basic styles
import logo from './logo.png';

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
  const [availableRoles, setAvailableRoles] = useState([]);
  const [skillAnalysis, setSkillAnalysis] = useState(null); // Stores the match results
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);

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

  // ... replace the existing "FETCH QUESTIONS ON LOAD" useEffect with this ...

  useEffect(() => {
    if (serverStatus === 'ready') {
      console.log("🚀 Fetching initial data (Questions & Roles)...");

      // A. Fetch Questions
      axios.get(`${API_URL}/questions`)
        .then(res => {
          setQuestionBank(res.data);
          if (Array.isArray(res.data) && res.data.length > 0) {
            setQuestion(res.data[0].text);
          }
        })
        .catch(err => console.error("❌ Error fetching questions:", err));

      // B. Fetch Roles (NEW)
      axios.get(`${API_URL}/roles`)
        .then(res => {
          console.log("✅ Roles received:", res.data);
          setAvailableRoles(res.data);

          // Set default role if list is not empty
          if (res.data.length > 0) {
            // Keep existing selection if valid, otherwise pick first one
            setTargetRole(prev => res.data.includes(prev) ? prev : res.data[0]);
          } else {
            // Fallback if DB is empty
            setTargetRole("Software Engineer");
          }
        })
        .catch(err => console.error("❌ Error fetching roles:", err));
    }
  }, [serverStatus]);

  useEffect(() => {
    // Only run if we have BOTH a resume text and a selected role
    if (serverStatus === 'ready' && resumeText && targetRole) {
      setIsAnalyzingProfile(true);
      
      axios.post(`${API_URL}/match_skills`, {
        resume_text: resumeText,
        target_role: targetRole
      })
      .then(res => {
        setSkillAnalysis(res.data);
        setIsAnalyzingProfile(false);
      })
      .catch(err => {
        console.error("Skill Match Error:", err);
        setIsAnalyzingProfile(false);
      });
    }
  }, [resumeText, targetRole, serverStatus]);

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
    <div className="dashboard-container">

      {/* SIDEBAR (Always Visible) */}
      <div className="sidebar p-4">
        <div className="mb-4 d-flex align-items-center gap-2">
          <img src={logo} alt="App Logo" style={{ height: '32px' }} />
          <h5 className="fw-bold text-primary m-0">Poly-2-Pro</h5>
        </div>
        
        {/* Status Badge */}
        <div className="mb-4">
          {serverStatus === 'ready' ? (
            <div className="alert alert-success py-2 d-flex align-items-center small fw-bold">
              <span className="me-2">●</span> System Online
            </div>
          ) : serverStatus === 'timeout' ? (
            <div className="alert alert-danger py-2 small">
              <div>Connection Failed</div>
              <button className="btn btn-sm btn-outline-danger mt-2" onClick={() => setRetryTrigger(p => p + 1)}>Retry</button>
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
          <label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>TARGET ROLE</label>
          <select
            className="form-select shadow-sm"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            disabled={availableRoles.length === 0}
          >
            {availableRoles.length > 0 ? (
              availableRoles.map((role, index) => (
                <option key={index} value={role}>{role}</option>
              ))
            ) : (
              <option>Loading roles...</option>
            )}
          </select>
        </div>

        {/* --- DYNAMIC SKILLS MATCHING SIDEBAR (Replaces old Resume Status) --- */}
        {resumeName ? (
          <div className="mb-3 animate__animated animate__fadeIn">
            <label className="small fw-bold text-muted mb-2" style={{ fontSize: '11px' }}>
              SKILL GAP ANALYSIS
            </label>

            <div className="card bg-white border shadow-sm">
              <div className="card-body p-3">

                {/* 1. Loading State */}
                {isAnalyzingProfile && (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
                    <div className="small text-muted">Scanning Resume...</div>
                  </div>
                )}

                {/* 2. Results Display */}
                {!isAnalyzingProfile && skillAnalysis && (
                  <>
                    {/* Role Description Header */}
                    <div className="mb-3 pb-2 border-bottom">
                      <small className="text-secondary fst-italic" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                        Match for: <strong>{targetRole}</strong>
                      </small>
                    </div>

                    {/* MATCHED Skills (Green) */}
                    {skillAnalysis.matched.length > 0 && (
                      <div className="mb-3">
                        <h6 className="small fw-bold text-success mb-1">
                          <i className="bi bi-check-circle-fill me-1"></i> Matches
                        </h6>
                        <ul className="list-unstyled mb-0 ps-1">
                          {skillAnalysis.matched.map((skill, i) => (
                            <li key={i} className="text-dark small mb-1" style={{ fontSize: '0.8rem' }}>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* MISSING Skills (Gray/Red) */}
                    {skillAnalysis.missing.length > 0 && (
                      <div>
                        <h6 className="small fw-bold text-secondary mb-1">
                          <i className="bi bi-circle me-1"></i> Gaps to Address
                        </h6>
                        <ul className="list-unstyled mb-0 ps-1">
                          {skillAnalysis.missing.map((skill, i) => (
                            <li key={i} className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Empty State Logic */}
                    {skillAnalysis.matched.length === 0 && skillAnalysis.missing.length === 0 && (
                      <small className="text-muted">No specific skills found in DB for this role.</small>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Active Resume Badge */}
            <div className="mt-2 text-end">
              <span className="badge bg-light text-secondary border fw-normal text-truncate" style={{ maxWidth: '100%' }}>
                <i className="bi bi-file-earmark-pdf me-1"></i> {resumeName}
              </span>
            </div>
          </div>
        ) : (
          /* Fallback if no resume uploaded */
          <div className="mb-3">
            <label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>RESUME STATUS</label>
            <div className="p-2 bg-light text-muted rounded small border border-dashed">
              Waiting for upload...
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        <div className="container" style={{ maxWidth: '900px' }}>

          {/* --- GATE: LANDING SCREEN (If no resume) --- */}
          {!resumeName ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
              <div className="mb-4">
                <img src={logo} alt="Logo" style={{ width: '300px', height: 'auto' }} />
              </div>
              <p className="lead text-secondary mb-5">
                Master your {targetRole} interview with AI-driven precision.
              </p>

              {/* INSTRUCTIONS CARDS */}
              <div className="row w-100 mb-5 text-start g-3 justify-content-center">
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-white h-100 shadow-sm">
                    <h6 className="fw-bold text-primary"><i className="bi bi-1-circle me-2"></i>Upload Resume</h6>
                    <small className="text-muted">Upload your PDF so the AI understands your unique background.</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-white h-100 shadow-sm">
                    <h6 className="fw-bold text-primary"><i className="bi bi-2-circle me-2"></i>Target Role</h6>
                    <small className="text-muted">Select your desired job title to align questions with industry standards.</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-white h-100 shadow-sm">
                    <h6 className="fw-bold text-primary"><i className="bi bi-3-circle me-2"></i>Validate</h6>
                    <small className="text-muted">Answer situational questions and get instant gap analysis & coaching.</small>
                  </div>
                </div>
              </div>

              {/* UPLOAD ACTION */}
              <div className="position-relative">
                <button
                  className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow fw-bold"
                  disabled={serverStatus !== 'ready' || uploading}
                >
                  {uploading ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span>Analyzing Profile...</span>
                  ) : (
                    <span><i className="bi bi-cloud-upload me-2"></i> Upload Resume to Start</span>
                  )}
                </button>

                <input
                  type="file" accept=".pdf"
                  disabled={serverStatus !== 'ready' || uploading}
                  onChange={handleFileUpload}
                  className="position-absolute w-100 h-100 start-0 top-0 opacity-0"
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {serverStatus !== 'ready' && (
                <div className="mt-3 text-muted small">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  System initializing...
                </div>
              )}

            </div>
          ) : (

            /* --- MAIN INTERFACE (Resume Exists) --- */
            <>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h1 className="display-6 fw-bold text-dark m-0">Interview Architect</h1>
                  <small className="text-muted">Optimizing answers for <strong>{targetRole}</strong></small>
                </div>
                <button onClick={() => { setResumeName(""); setResumeText("") }} className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Change Resume
                </button>
              </div>

              {/* Question Selection */}
              <div className="mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-2">
                    {!isCustomQuestion ? (
                      <select
                        className="form-select border-0 fw-bold text-secondary"
                        style={{ fontSize: '1.1rem' }}
                        value={question}
                        onChange={(e) => {
                          if (e.target.value === "CUSTOM_MODE") {
                            setIsCustomQuestion(true);
                            setQuestion("");
                          } else {
                            setQuestion(e.target.value);
                          }
                        }}
                      >
                        {questionBank.map((q) => (
                          <option key={q.id} value={q.text}>{q.text}</option>
                        ))}
                        <option disabled>──────────────────────────</option>
                        <option value="CUSTOM_MODE">✎ Type a custom question...</option>
                      </select>
                    ) : (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-light border text-muted"
                          onClick={() => {
                            setIsCustomQuestion(false);
                            if (questionBank.length > 0) setQuestion(questionBank[0].text);
                          }}
                        >
                          <i className="bi bi-arrow-left"></i>
                        </button>
                        <input
                          className="form-control border-0 fw-bold text-secondary"
                          placeholder="Type your question..."
                          value={question}
                          autoFocus
                          onChange={e => setQuestion(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Answer Area */}
              <div className="mb-4">
                <textarea
                  className="form-control p-4 shadow-sm" rows="6"
                  placeholder={`Type your answer here...`}
                  style={{ resize: 'none', borderRadius: '12px' }}
                  value={answer} onChange={e => setAnswer(e.target.value)}
                ></textarea>

                <div className="d-flex justify-content-end mt-3">
                  <button
                    className="btn btn-primary btn-lg px-5 rounded-pill shadow"
                    onClick={handleAnalyzeStream}
                    disabled={loading}
                  >
                    {loading ? <span><span className="spinner-border spinner-border-sm me-2"></span>Architecting...</span> : "Validate Answer"}
                  </button>
                </div>
              </div>

              {loading && <ThinkingTrace currentStep={currentStep} />}

              {result && !loading && (
                <div className="row g-4 pb-5">
                  {/* Manager Gaps */}
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

                  {/* Coach Critique */}
                  <div className="col-12">
                    <div className="card card-modern h-100">
                      <div className="card-header bg-warning-subtle border-0 py-3 d-flex align-items-center">
                        <i className="bi bi-lightbulb-fill text-warning-emphasis fs-5 me-3"></i>
                        <h6 className="mb-0 fw-bold text-warning-emphasis">Structure Critique</h6>
                      </div>
                      <div className="card-body p-4 markdown-body text-secondary">
                        <ReactMarkdown>{result.coach_critique}</ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Optimized Answer */}
                  <div className="col-12">
                    <div className="card card-modern h-100 border-success-subtle">
                      <div className="card-header bg-success-subtle border-0 py-3 d-flex align-items-center">
                        <i className="bi bi-patch-check-fill text-success fs-5 me-3"></i>
                        <h6 className="mb-0 fw-bold text-success-emphasis">Architected Response</h6>
                      </div>
                      <div className="card-body p-4 markdown-body text-dark bg-success-subtle bg-opacity-10">
                        <ReactMarkdown>{result.rewritten_answer}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}