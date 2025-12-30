import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import ThinkingTrace from './ThinkingTrace';
import SidebarTrace from './SidebarTrace';
import polyTitle from './poly2pro.png';
import logo from './logo.png';
import './App.css';

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
  const isValidateDisabled = !answer.trim() || !skillAnalysis;
  const [skillStep, setSkillStep] = useState(0);

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
    if (serverStatus === 'ready') {
      console.log("🚀 Fetching initial data (Questions & Roles)...");

      // A. Fetch Questions
      axios.get(`${API_URL}/questions`)
        .then(res => {
          // 1. Sort Alphabetically
          const sortedQuestions = res.data.sort((a, b) => a.text.localeCompare(b.text));

          setQuestionBank(sortedQuestions);

          // 2. Select the first one (Alphabetical #1)
          if (Array.isArray(sortedQuestions) && sortedQuestions.length > 0) {
            setQuestion(sortedQuestions[0].text);
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
      setSkillAnalysis(null); // Clear previous results
      setSkillStep(1);        // Start at Step 1

      // A. Start a timer to fake progress through steps 1, 2, and 3
      const interval = setInterval(() => {
        setSkillStep((prev) => {
          if (prev < 3) return prev + 1; // Advance up to step 3
          return prev; // Stay on 3 until API finishes
        });
      }, 1200); // 1.2 seconds per step

      // B. Call the API
      axios.post(`${API_URL}/match_skills`, {
        resume_text: resumeText,
        target_role: targetRole
      })
        .then(res => {
          // C. On Success:
          clearInterval(interval);   // Stop the timer
          setSkillStep(100);         // Mark as "Done"
          setSkillAnalysis(res.data);
          setIsAnalyzingProfile(false);
        })
        .catch(err => {
          console.error("Skill Match Error:", err);
          clearInterval(interval);
          setIsAnalyzingProfile(false);
        });

      // Cleanup timer if component unmounts
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRole, serverStatus]);
  // (Note: We keep resumeText out of deps to avoid double-trigger on upload)

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
    if (!resumeText) return;

    setLoading(true);
    setResult(null);
    setCurrentStep(1);
    setRetryTrigger(0);

    try {
      const response = await fetch(`${API_URL}/analyze_stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: targetRole,
          question: question,
          student_answer: answer,
          skill_data: skillAnalysis
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; // <--- 1. Create a buffer to hold incomplete chunks

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // 2. Add new chunk to the buffer
        buffer += decoder.decode(value, { stream: true });

        // 3. Split by newline to get all COMPLETE messages
        const lines = buffer.split("\n");

        // 4. The last item in 'lines' is likely incomplete (remainder). 
        //    Pop it off and save it back to the buffer for the next loop.
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);

              if (data.type === "step") {
                setCurrentStep(data.step_id);
              }
              else if (data.type === "partial_update") {
                // Merges the new "manager_thinking" into the existing result object
                setResult((prev) => ({ ...prev, ...data.data }));
              }
              else if (data.type === "result") {
                setResult(data.data);
                setLoading(false);
              }
              else if (data.type === "error") {
                console.error("Stream error:", data.message);
                setLoading(false);
              }
            } catch (e) {
              console.error("JSON Parse Error", e, "Line:", line);
            }
          }
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
    }
  };

  // 1. Helper function to find **text** and turn it into <b>text</b>
  const renderWithManualBold = (text) => {
    // Split the string whenever we see **something**
    // The regex captures the text inside the asterisks
    const parts = text.split(/\*\*(.*?)\*\*/g);

    return parts.map((part, index) => {
      // Odd indices (1, 3, 5...) are the text that was inside ** **
      if (index % 2 === 1) {
        return (
          <span key={index} style={{ fontWeight: '800', color: 'black' }}>
            {part}
          </span>
        );
      }
      // Even indices are normal text
      return <span key={index}>{part}</span>;
    });
  };

  // Helper to format STAR text
  const formatStarResponse = (text) => {
    if (!text) return null;

    // 1. CLEANUP: Remove asterisks specifically from the headers
    // Transforms "**Situation:**" -> "Situation:"
    let cleanText = text
      .replace(/\*\*Situation:?\*\*/g, 'Situation:')
      .replace(/\*\*Task:?\*\*/g, 'Task:')
      .replace(/\*\*Action:?\*\*/g, 'Action:')
      .replace(/\*\*Result:?\*\*/g, 'Result:')
      // Also catch cases where AI forgets the colon inside the bold
      .replace(/\*\*Situation\*\*:?/g, 'Situation:')
      .replace(/\*\*Task\*\*:?/g, 'Task:')
      .replace(/\*\*Action\*\*:?/g, 'Action:')
      .replace(/\*\*Result\*\*:?/g, 'Result:');

    // 2. SPLIT & RENDER
    return cleanText.split(/(Situation:|Task:|Action:|Result:)/g).map((part, index) => {
      const trimmed = part.trim();

      // A. Header (Green & Bold)
      if (['Situation:', 'Task:', 'Action:', 'Result:'].includes(trimmed)) {
        return (
          <div key={index} className="fw-bold text-success mt-3 mb-1 text-uppercase" style={{ letterSpacing: '0.5px' }}>
            {trimmed}
          </div>
        );
      }

      // B. Empty strings
      if (!trimmed) return null;

      // C. Body Text (with manual bold support)
      return (
        <div key={index} className="mb-2 text-dark" style={{ lineHeight: '1.6' }}>
          {renderWithManualBold(part)}
        </div>
      );
    });
  };

  // Reusable Collapsible Card
  const CollapsibleCard = ({
    title,
    icon,
    bgClass,      // e.g., 'bg-danger-subtle'
    textClass,    // e.g., 'text-danger-emphasis'
    borderClass,  // e.g., 'border-danger-subtle'
    children,
    defaultOpen = true
  }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
      <div className={`card card-modern h-100 ${borderClass} mb-4`}>
        {/* Header - Clickable */}
        <div
          className={`card-header ${bgClass} border-0 py-3 d-flex align-items-center justify-content-between`}
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: 'pointer' }}
        >
          <div className="d-flex align-items-center">
            <i className={`bi ${icon} ${textClass} fs-5 me-3`}></i>
            <h6 className={`mb-0 fw-bold ${textClass}`}>{title}</h6>
          </div>

          {/* Chevron Icon */}
          <i
            className={`bi bi-chevron-down ${textClass} transition-transform`}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          ></i>
        </div>

        {/* Body - Toggles Visibility */}
        {isOpen && (
          <div className="card-body p-4 bg-white fade-in">
            {children}
          </div>
        )}
      </div>
    );
  };

  // RESET HANDLER: Clears the answer and results, keeps the resume/role
  const handleResetPractice = () => {
    setAnswer("");           // Clear the user's typed answer
    setResult(null);         // Clear the AI analysis results
    setCurrentStep(0);       // Reset the progress bar
    setIsCustomQuestion(false); // Optional: Reset custom question mode

    // Optional: Scroll back to the top to choose a new question
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 3. RENDER ---
  return (
    <div className="dashboard-container">

      {/* SIDEBAR (Always Visible) */}
      {/* 1. REMOVE p-4 from here so the sticky header hits the true top edge */}
      <div className="sidebar" style={{
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa'
      }}
      >

        {/* 2. STICKY HEADER 
            - Added p-4 here instead to restore spacing.
            - border-bottom creates a clean separation when content scrolls under.
        */}
        <div
          className="sticky-top"
          style={{
            top: 0,
            zIndex: 100,
            backgroundColor: '#f8f9fa', // Ensure this matches your sidebar background color
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          {/* Inner container to handle padding (keeps content aligned) */}
          <div className="p-4 pb-3">

            {/* A. Logo & Title */}
            <div className="mb-4 d-flex align-items-center gap-2">
              <img src={logo} alt="App Logo" style={{ height: '48px' }} />
              <img
                src={polyTitle}
                alt="Poly-2-Pro"
                style={{
                  height: '152px',        // Adjust size to match the icon
                  objectFit: 'contain',  // Keeps aspect ratio correct
                  marginLeft: '-40px'
                }}
              />
            </div>

            {/* B. System Status */}
            <div className="mb-4">
              {serverStatus === 'ready' ? (
                <div className="alert alert-success py-2 d-flex align-items-center small fw-bold mb-0">
                  <span className="me-2">●</span> System Online
                </div>
              ) : serverStatus === 'timeout' ? (
                <div className="alert alert-danger py-2 small mb-0">
                  <div>Connection Failed</div>
                  <button className="btn btn-sm btn-outline-danger mt-2" onClick={() => setRetryTrigger(p => p + 1)}>Retry</button>
                </div>
              ) : (
                <div className="alert alert-warning py-2 small mb-0">
                  <div className="spinner-border spinner-border-sm me-2"></div>
                  Waking up... ({elapsedTime}s)
                </div>
              )}
            </div>

            {/* C. Target Role Input */}
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

            {/* D. Resume Status (Moved UP here) */}
            <div>
              <label className="small fw-bold text-muted" style={{ fontSize: '11px' }}>RESUME STATUS</label>
              {resumeName ? (
                <div className="p-2 bg-white text-success rounded small border d-flex align-items-center justify-content-between shadow-sm animate__animated animate__fadeIn">
                  <span className="text-truncate" style={{ maxWidth: '200px' }}>
                    <i className="bi bi-file-earmark-pdf-fill me-2"></i>{resumeName}
                  </span>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
              ) : (
                <div className="p-2 bg-light text-muted rounded small border border-dashed">
                  Waiting for upload...
                </div>
              )}
            </div>

          </div>
        </div>
        {/* --- END STICKY HEADER --- */}


        {/* 3. SCROLLABLE CONTENT 
            - Added p-4 here to restore spacing for the content below the header.
        */}
        <div className="p-4 pt-2 pb-5">
          {resumeName && (
            <div className="animate__animated animate__fadeIn">
              <label className="small fw-bold text-muted mb-2" style={{ fontSize: '11px' }}>
                SKILL GAP ANALYSIS
              </label>

              <div className="card bg-white border shadow-sm">
                <div className="card-body p-3">

                  {/* Loading State */}
                  {isAnalyzingProfile && (
                    <div className="mb-3">
                      <SidebarTrace currentStep={skillStep} />
                    </div>
                  )}

                  {/* Results Display */}
                  {!isAnalyzingProfile && skillAnalysis && (
                    <>
                      <div className="mb-3 pb-2 border-bottom">
                        <small className="text-secondary fst-italic" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                          Match for: <strong>{targetRole}</strong>
                        </small>
                      </div>

                      {/* Matched Skills */}
                      {skillAnalysis.matched.length > 0 && (
                        <div className="mb-3">
                          <h6 className="small fw-bold text-success mb-2">
                            <i className="bi bi-check-circle-fill me-1"></i> Verified Matches
                          </h6>
                          <ul className="list-unstyled mb-0 ps-1">
                            {skillAnalysis.matched.map((item, i) => {
                              const skillName = typeof item === 'string' ? item : item.skill;
                              const reason = typeof item === 'string' ? '' : item.reason;
                              const code = item.code || "";

                              return (
                                <li key={i} className="text-dark small mb-2 border-bottom pb-1" style={{ fontSize: '0.8rem' }}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <strong>{skillName}</strong>
                                    {code && <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>{code}</span>}
                                  </div>
                                  {reason && (
                                    <div className="text-muted fst-italic mt-1" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                                      {reason}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {skillAnalysis.missing.length > 0 && (
                        <div>
                          <h6 className="small fw-bold text-danger mb-2">
                            <i className="bi bi-exclamation-octagon-fill me-1"></i> Critical Gaps
                          </h6>
                          <ul className="list-unstyled mb-0 ps-1">
                            {skillAnalysis.missing.map((item, i) => {
                              const skillName = typeof item === 'string' ? item : item.skill;
                              const gap = typeof item === 'string' ? '' : item.gap;
                              const code = item.code || "";

                              return (
                                <li key={i} className="text-dark small mb-2 border-bottom pb-1" style={{ fontSize: '0.8rem' }}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <strong>{skillName}</strong>
                                    {code && <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>{code}</span>}
                                  </div>
                                  {gap && (
                                    <div className="text-danger mt-1" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                                      {gap}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
                <div className="d-flex align-items-center">

                  {/* Logo with margin-end (me-3) for spacing */}
                  <img
                    src={logo}
                    alt="App Logo"
                    style={{ height: '72px' }}
                    className="me-3"
                  />

                  {/* Text Wrapper: Keeps Title and Subtitle stacked vertically */}
                  <div>
                    <h1 className="display-6 fw-bold text-dark m-0">Interview Architect</h1>
                    <small className="text-muted">
                      Optimizing answers for <strong>{targetRole}</strong>
                    </small>
                  </div>
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
                        {questionBank.map((q, index) => (
                          <option key={q.id} value={q.text}>
                            {index + 1}. {q.text}
                          </option>
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

                <div className="d-flex justify-content-between align-items-center mt-3">
                  {/* 1. Clear / Reset Button */}
                  <button
                    className="btn btn-link text-muted text-decoration-none btn-sm"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear your answer?")) {
                        setAnswer("");
                      }
                    }}
                    disabled={!answer.trim() || loading} // Disable if empty
                  >
                    <i className="bi bi-trash me-1"></i> Clear
                  </button>
                  <button
                    onClick={handleAnalyzeStream}
                    // 1. DISABLE ATTRIBUTE
                    disabled={isValidateDisabled || loading}
                    // 2. VISUAL FEEDBACK (Bootstrap classes)
                    className={`btn w-100 py-3 fw-bold shadow-sm transition-all ${isValidateDisabled
                      ? 'btn-secondary opacity-50 cursor-not-allowed'
                      : 'btn-primary'
                      }`}
                    style={{ borderRadius: '12px' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Analyzing Response...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-patch-check-fill me-2"></i>
                        Validate Answer
                      </>
                    )}
                  </button>
                  {isValidateDisabled && !loading && (
                    <div className="text-center mt-2">
                      <small className="text-muted fst-italic">
                        {!skillAnalysis
                          ? "* Please run the Skill Gap Analysis first."
                          : "* Please type an answer to validate."}
                      </small>
                    </div>
                  )}
                </div>
              </div>

              {/* SHOW TRACE: While loading OR if we have a finished trace */}
              {(loading || result?.manager_thinking) && (
                <ThinkingTrace
                  // If loading is done, force step to 100 so all items show as "Checked/Completed"
                  currentStep={loading ? currentStep : 100}
                  managerThinking={result?.manager_thinking}
                  coachThinking={result?.coach_thinking}
                />
              )}

              {result && !loading && (
                <div className="row g-4 pb-5">

                  {/* 1. Manager's Gaps (Red/Danger Theme) */}
                  <div className="col-12">
                    <CollapsibleCard
                      title="Manager's Gaps"
                      icon="bi-exclamation-octagon-fill"
                      bgClass="bg-danger-subtle"
                      textClass="text-danger-emphasis"
                      borderClass="border-danger-subtle"
                      defaultOpen={true}
                    >
                      <div className="markdown-body text-secondary">
                        <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                      </div>
                    </CollapsibleCard>
                  </div>

                  {/* 2. Structure Critique (Yellow/Warning Theme) */}
                  <div className="col-12">
                    <CollapsibleCard
                      title="Structure Critique"
                      icon="bi-lightbulb-fill"
                      bgClass="bg-warning-subtle"
                      textClass="text-warning-emphasis"
                      borderClass="border-warning-subtle"
                      defaultOpen={true}
                    >
                      <div className="markdown-body text-secondary">
                        <ReactMarkdown>{result.coach_critique}</ReactMarkdown>
                      </div>
                    </CollapsibleCard>
                  </div>

                  {/* 3. Architected Response (Green/Success Theme) */}
                  <div className="col-12">
                    <CollapsibleCard
                      title="Architected Response"
                      icon="bi-patch-check-fill"
                      bgClass="bg-success-subtle"
                      textClass="text-success-emphasis"
                      borderClass="border-success-subtle"
                      defaultOpen={true}
                    >
                      <div className="card-text text-dark" style={{ lineHeight: '1.7', fontSize: '1.05rem' }}>
                        {formatStarResponse(result.rewritten_answer)}
                      </div>
                    </CollapsibleCard>
                  </div>
                  <div className="text-center mt-5 mb-5 pb-5">
                    <button
                      className="btn btn-outline-primary btn-lg px-5 shadow-sm rounded-pill"
                      onClick={handleResetPractice}
                    >
                      <i className="bi bi-arrow-repeat me-2"></i> Practice Another Question
                    </button>
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