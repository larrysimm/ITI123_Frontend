import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css'; 
import ThinkingTrace from './ThinkingTrace';

// !!! ENSURE THIS MATCHES YOUR BACKEND URL !!!
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

  // --- REAL-TIME STATE ---
  const [currentStep, setCurrentStep] = useState(0);

  const handleFileUpload = async (e) => {
    // ... (Same as before) ...
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_URL}/upload_resume`, formData);
      setResumeText(res.data.extracted_text);
      setResumeName(res.data.filename);
    } catch (err) { alert("Upload failed"); } 
    finally { setUploading(false); }
  };

  // --- THE NEW STREAMING HANDLER ---
  const handleAnalyzeStream = async () => {
    if (!answer.trim()) return alert("Please type an answer first.");
    
    setLoading(true);
    setResult(null);
    setCurrentStep(1); // Start at step 1

    try {
      const response = await fetch(`${API_URL}/analyze_stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_answer: answer,
          question: question,
          target_role: targetRole,
          resume_text: resumeText
        })
      });

      // 1. Get the Reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 2. Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // 3. Split by newline (because multiple JSONs might come in one chunk)
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            
            // 4. Update UI based on message type
            if (json.type === "step") {
              console.log("Server is at step:", json.step_id);
              setCurrentStep(json.step_id);
            } 
            else if (json.type === "result") {
              setResult(json.data);
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e);
          }
        }
      }

    } catch (err) {
      console.error(err);
      alert("Stream failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR (Same as before) */}
      <div className="sidebar p-4">
        {/* ... Sidebar code ... */}
        <div className="mb-4">
            <label className="form-label text-uppercase fw-bold text-muted" style={{fontSize: '11px'}}>Resume Context</label>
            <div className={`upload-box p-3 text-center position-relative ${resumeName ? 'border-success bg-success-subtle' : ''}`}>
              <input type="file" accept=".pdf" className="position-absolute top-0 start-0 w-100 h-100 opacity-0" style={{cursor: 'pointer'}} onChange={handleFileUpload} />
              {uploading ? <div className="spinner-border spinner-border-sm text-primary"></div> : resumeName ? <i className="bi bi-check-circle-fill text-success fs-4"></i> : <i className="bi bi-cloud-arrow-up text-secondary fs-4"></i>}
            </div>
        </div>
      </div>

      <div className="main-content d-flex flex-column">
        {!resumeName ? (
           <div className="container h-100 d-flex justify-content-center align-items-center text-center">
             <div className="card p-5 border-0 shadow">
               <h2>Welcome</h2>
               <p>Please upload a resume.</p>
               <input type="file" onChange={handleFileUpload} />
             </div>
           </div>
        ) : (
          <div className="container py-5 px-lg-5 pb-5 mb-5 fade-in">
            {/* Header ... */}
            <div className="mb-5">
               <h1 className="fw-bolder display-6">Prepare for <span className="text-primary">{targetRole}</span></h1>
            </div>

            {/* Inputs ... */}
            <div className="mb-5 position-relative">
              <textarea 
                className="form-control p-4 shadow-sm" rows="8" 
                value={answer} onChange={(e) => setAnswer(e.target.value)}
              ></textarea>
              <div className="d-flex justify-content-end mt-3">
                <button 
                  className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm" 
                  onClick={handleAnalyzeStream} // <--- USE NEW HANDLER
                  disabled={loading}
                >
                  Validate Answer <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>

            {/* REAL THINKING TRACE */}
            {loading && <ThinkingTrace currentStep={currentStep} />}

            {/* RESULTS */}
            {!loading && result && (
              <div className="row g-4 fade-in">
                <div className="col-lg-12">
                  <div className="card card-modern border-0 h-100">
                    <div className="card-header bg-danger-subtle border-0 py-3"><h6 className="mb-0 fw-bold text-danger-emphasis">Feedback</h6></div>
                    <div className="card-body p-4 markdown-body"><ReactMarkdown>{result.manager_critique}</ReactMarkdown></div>
                  </div>
                </div>
                {/* ... Coach feedback ... */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}