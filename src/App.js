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

      // Timeout Check
      if (elapsed > MAX_WAIT_TIME_MS) {
        if (isMounted) setServerStatus("timeout");
        return;
      }

      // API Call
      try {
        const res = await axios.get(`${API_URL}/`, { timeout: 5000 });
        if (res.data.status === "OK" && isMounted) {
          setServerStatus("ready");
          return; // Stop recursion on success
        }
      } catch (err) {
        // Continue waiting
      }

      // Recursive Retry
      if (isMounted && serverStatus !== "ready") {
        timeoutId = setTimeout(ping, 2000);
      }
    };

    ping();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
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
    <div className="container-fluid min-vh-100 bg-light d-flex">
      {/* SIDEBAR */}
      <div className="bg-white border-end p-4" style={{width: '300px', minWidth: '300px'}}>
        <h4 className="fw-bold text-primary mb-4">Poly-to-Pro</h4>
        
        {/* Status Badge */}
        <div className="mb-4">
          {serverStatus === 'ready' ? (
             <div className="alert alert-success py-2 d-flex align-items-center">
               <span className="me-2">●</span> System Online
             </div>
          ) : serverStatus === 'timeout' ? (
             <div className="alert alert-danger py-2">
               <div>Connection Failed</div>
               <button className="btn btn-sm btn-outline-danger mt-2" onClick={() => setRetryTrigger(p => p+1)}>Retry</button>
             </div>
          ) : (
             <div className="alert alert-warning py-2">
               <div className="spinner-border spinner-border-sm me-2"></div>
               Waking up... ({elapsedTime}s)
             </div>
          )}
        </div>

        {/* Inputs */}
        <div className="mb-3">
          <label className="small fw-bold text-muted">TARGET ROLE</label>
          <select className="form-select" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
            <option>Software Engineer</option>
            <option>Data Analyst</option>
            <option>Digital Marketer</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="small fw-bold text-muted">RESUME</label>
          <div className="card p-3 text-center bg-light border-dashed">
            {uploading ? <span className="spinner-border spinner-border-sm"></span> : 
             resumeName ? <span className="text-success fw-bold">{resumeName}</span> : 
             <span className="text-muted">Upload PDF</span>
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

      {/* MAIN CONTENT */}
      <div className="flex-grow-1 p-5 overflow-auto">
        <h1 className="display-6 fw-bold mb-4">Mock Interview</h1>
        
        <div className="mb-4">
           <select className="form-select form-select-lg mb-2" value={question} onChange={e => setQuestion(e.target.value)}>
             <option>Tell me about a time you had to manage a difficult client situation.</option>
             <option>Describe a project where you had to analyze complex data.</option>
             <option value="custom">-- Custom Question --</option>
           </select>
           {question === "custom" && (
             <input className="form-control" placeholder="Type question..." onChange={e => setQuestion(e.target.value)} />
           )}
        </div>

        <div className="mb-4">
          <textarea 
            className="form-control p-3" rows="6"
            placeholder="Type your answer here..."
            value={answer} onChange={e => setAnswer(e.target.value)}
          ></textarea>
        </div>

        <button 
          className="btn btn-primary btn-lg px-5 mb-4"
          onClick={handleAnalyzeStream}
          disabled={loading || serverStatus !== 'ready'}
        >
          {loading ? "Analyzing..." : "Validate Answer"}
        </button>

        {loading && <ThinkingTrace currentStep={currentStep} />}

        {result && !loading && (
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-danger text-white fw-bold">Manager Critique</div>
                <div className="card-body">
                  <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-success text-white fw-bold">Coach Feedback</div>
                <div className="card-body">
                  <ReactMarkdown>{result.coach_feedback}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}