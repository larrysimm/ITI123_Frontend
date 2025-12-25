import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Briefcase, ChevronRight, 
  CheckCircle, AlertCircle, RefreshCw, FileText, Zap, Star
} from 'lucide-react';

// --- CHANGE THIS TO YOUR RENDER URL ---
const API_URL = "https://iti123-project.onrender.com"; 

export default function App() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Sidebar State
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");

  // Main Interview State
  const [question, setQuestion] = useState("Tell me about a time you had to manage a difficult client situation.");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

  // --- 1. UPLOAD RESUME ---
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
      alert("Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  // --- 2. ANALYZE ANSWER ---
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
      alert("Analysis failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* ================= LEFT SIDEBAR (Dark Mode) ================= */}
      <aside className="w-80 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl z-20">
        
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 bg-slate-900">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            Poly-to-Pro
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">
            Competency Validator v2.1
          </p>
        </div>

        {/* Sidebar Content */}
        <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Target Role Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Target Role
            </label>
            <div className="relative">
              <select 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all"
              >
                <option>Software Engineer</option>
                <option>Data Analyst</option>
                <option>Audit Associate</option>
                <option>Digital Marketer</option>
                <option>HR Executive</option>
              </select>
              <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Upload Context
            </label>
            
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300
                ${resumeName 
                  ? 'border-emerald-500/50 bg-emerald-500/10' 
                  : 'border-slate-700 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800'
                }
              `}>
                {uploading ? (
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                ) : resumeName ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-500 mb-3 group-hover:text-blue-400" />
                )}
                
                <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                  {uploading ? "Analyzing..." : resumeName ? "Resume Active" : "Upload PDF Resume"}
                </span>
              </div>
            </div>

            {/* Active File Badge */}
            {resumeName && (
              <div className="bg-slate-800/80 rounded-lg p-3 flex items-center gap-3 border border-slate-700 mt-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-200 truncate font-medium">{resumeName}</p>
                  <p className="text-[10px] text-emerald-500">Context Loaded</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-600">
            Powered by Gemini 1.5 Flash & SSG Skills Framework
          </p>
        </div>
      </aside>


      {/* ================= MAIN CONTENT (Light Mode) ================= */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50">
        <div className="max-w-4xl mx-auto p-8 md:p-12 pb-32">
          
          {/* Main Header */}
          <header className="mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
              <Zap className="w-3 h-3" /> AI Interview Simulator
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Prepare for <span className="text-blue-600">{targetRole}</span>
            </h2>
            <p className="text-slate-500 mt-3 text-lg leading-relaxed">
              Practice your behavioral questions. Our dual-agent AI will critique your answer against the official Skills Framework.
            </p>
          </header>

          {/* Question Section */}
          <section className="mb-6">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <select 
                className="w-full p-4 text-lg bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              >
                <option>Tell me about a time you had to manage a difficult client situation.</option>
                <option>Describe a project where you had to analyze complex data.</option>
                <option>Tell me about a time you failed to meet a deadline.</option>
                <option>How do you ensure accuracy in your work?</option>
                <option value="custom">-- Type Your Own Question --</option>
              </select>
            </div>
            {question === "custom" && (
              <input 
                type="text" 
                placeholder="Type your question here..."
                className="w-full mt-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </section>

          {/* Answer Input Section */}
          <section className="mb-10 relative">
            <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-slate-400 uppercase tracking-wider z-10">
              Your Answer (STAR Method)
            </div>
            <textarea 
              className="w-full h-64 p-6 text-lg border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 leading-relaxed shadow-sm bg-white resize-none transition-all placeholder:text-slate-300"
              placeholder="Situation: I was working on... Task: My goal was to... Action: I specifically... Result: The outcome was..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            
            <div className="absolute bottom-6 right-6">
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-xl shadow-blue-600/20 transform transition-all active:scale-95
                  ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1'}
                `}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin"/> Evaluating...</span>
                ) : (
                  <>Validate Answer <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </section>

          {/* Results Section (Animated) */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-8"
              >
                {/* 1. Hiring Manager Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
                  <div className="bg-red-50/80 p-5 border-b border-red-100 flex items-center gap-4">
                    <div className="bg-red-100 p-2.5 rounded-xl text-red-600">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 text-lg">Hiring Manager Feedback</h3>
                      <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Gap Analysis</p>
                    </div>
                  </div>
                  <div className="p-8 text-slate-700 markdown-content">
                    {/* THIS COMPONENT FIXES THE FORMATTING */}
                    <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                  </div>
                </div>

                {/* 2. Career Coach Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
                  <div className="bg-emerald-50/80 p-5 border-b border-emerald-100 flex items-center gap-4">
                    <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900 text-lg">Career Coach Refinement</h3>
                      <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Suggested STAR Answer</p>
                    </div>
                  </div>
                  <div className="p-8 text-slate-700 markdown-content">
                    {/* THIS COMPONENT FIXES THE FORMATTING */}
                    <ReactMarkdown>{result.coach_feedback}</ReactMarkdown>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}