import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css'; // Import the CSS we just made

const API_URL = "https://iti123-project.onrender.com"; 

export default function App() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Data State
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("Tell me about a time you had to manage a difficult client situation.");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

  // --- Handlers ---
  const handleFileUpload = async (e) => {
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

  const handleAnalyze = async () => {
    if (!answer.trim()) return alert("Please type an answer first.");
    setLoading(true);
    setResult(null); 
    try {
      const payload = {
        student_answer: answer,
        question: question,
        target_role: targetRole,
        resume_text: resumeText || "No resume provided."
      };
      const res = await axios.post(`${API_URL}/analyze`, payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
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
        <hr className="text-secondary opacity-25" />
        
        <div className="flex-grow-1 overflow-auto">
          {/* Role Selector */}
          <div className="mb-4">
            <label className="form-label text-uppercase fw-bold text-muted" style={{fontSize: '11px'}}>Target Role</label>
            <select 
              className="form-select shadow-sm"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Audit Associate</option>
              <option>Digital Marketer</option>
              <option>HR Executive</option>
            </select>
          </div>

          {/* Upload Section */}
          <div className="mb-4">
            <label className="form-label text-uppercase fw-bold text-muted" style={{fontSize: '11px'}}>Resume Context</label>
            <div className="upload-box p-4 text-center position-relative">
              <input 
                type="file" 
                accept=".pdf"
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                style={{cursor: 'pointer'}}
                onChange={handleFileUpload}
              />
              {uploading ? (
                 <div className="spinner-border text-primary" role="status"></div>
              ) : resumeName ? (
                <div>
                  <i className="bi bi-check-circle-fill text-success fs-3 mb-2"></i>
                  <p className="mb-0 small fw-bold text-success">Context Loaded</p>
                </div>
              ) : (
                <div>
                  <i className="bi bi-cloud-upload text-secondary fs-3 mb-2"></i>
                  <p className="mb-0 small text-muted">Click to Upload PDF</p>
                </div>
              )}
            </div>
            {resumeName && <div className="mt-2 small text-truncate text-muted"><i className="bi bi-file-earmark-text me-1"></i> {resumeName}</div>}
          </div>
        </div>

        <div className="mt-auto pt-3 border-top text-center">
          <small className="text-muted" style={{fontSize: '10px'}}>Powered by Gemini AI</small>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main-content">
        <div className="container py-5 px-lg-5 pb-5 mb-5">
          
          <div className="mb-5">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-3">INTERVIEW SIMULATOR</span>
            <h1 className="fw-bolder display-6">Prepare for <span className="text-primary">{targetRole}</span></h1>
            <p className="lead text-muted">Practice behavioral questions with real-time feedback.</p>
          </div>

          {/* Question Card */}
          <div className="card card-modern bg-white mb-4">
            <div className="card-body p-1">
              <select 
                className="form-select form-select-lg border-0 bg-transparent fw-bold text-secondary"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              >
                <option>Tell me about a time you had to manage a difficult client situation.</option>
                <option>Describe a project where you had to analyze complex data.</option>
                <option>Tell me about a time you failed to meet a deadline.</option>
                <option value="custom">-- Type Custom Question --</option>
              </select>
            </div>
          </div>
          {question === "custom" && (
            <input 
              type="text" 
              className="form-control form-control-lg mb-4" 
              placeholder="Type your question..." 
            />
          )}

          {/* Answer Area */}
          <div className="mb-5 position-relative">
            <textarea 
              className="form-control p-4 shadow-sm" 
              rows="8" 
              placeholder="Situation: I was working on... Task: My goal was to... Action: I specifically... Result: The outcome was..."
              style={{borderRadius: '16px', border: '1px solid #e2e8f0', resize: 'none'}}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            
            <div className="d-flex justify-content-end mt-3">
              <button 
                className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm" 
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <span><span className="spinner-border spinner-border-sm me-2"></span>Analyzing...</span>
                ) : (
                  <span>Validate Answer <i className="bi bi-arrow-right ms-2"></i></span>
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          {result && (
            <div className="row g-4 fade-in">
              {/* Manager Feedback */}
              <div className="col-lg-12">
                <div className="card card-modern border-0 h-100">
                  <div className="card-header bg-danger-subtle border-0 py-3 d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-5 me-3"></i>
                    <div>
                      <h6 className="mb-0 fw-bold text-danger-emphasis">Hiring Manager Feedback</h6>
                    </div>
                  </div>
                  <div className="card-body p-4 text-secondary markdown-body">
                    <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Coach Feedback */}
              <div className="col-lg-12">
                <div className="card card-modern border-0 h-100">
                  <div className="card-header bg-success-subtle border-0 py-3 d-flex align-items-center">
                    <i className="bi bi-stars text-success fs-5 me-3"></i>
                    <div>
                      <h6 className="mb-0 fw-bold text-success-emphasis">Career Coach Refinement</h6>
                    </div>
                  </div>
                  <div className="card-body p-4 text-secondary markdown-body">
                    <ReactMarkdown>{result.coach_feedback}</ReactMarkdown>
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