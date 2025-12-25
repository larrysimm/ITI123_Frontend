import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Briefcase, ChevronRight, 
  CheckCircle, AlertCircle, RefreshCw, FileText, BarChart3
} from 'lucide-react';

// --- CONFIGURATION ---
// CHANGE THIS to your specific Render URL
const API_URL = "https://iti123-project.onrender.com"; 

export default function App() {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Context Data (Lives in Sidebar)
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [targetRole, setTargetRole] = useState("Audit Associate");

  // Interview Data (Lives in Main Area)
  const [question, setQuestion] = useState("Tell me about a time you had to manage a difficult client situation.");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

  // --- HANDLERS ---

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload to Backend
      const res = await axios.post(`${API_URL}/upload_resume`, formData);
      setResumeText(res.data.extracted_text);
      setResumeName(res.data.filename);
      alert(`Success! Loaded: ${res.data.filename}`);
    } catch (err) {
      console.error(err);
      alert("Error uploading resume. Check backend connection.");
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
      alert("Analysis failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* --- LEFT SIDEBAR: CONTEXT & UPLOAD --- */}
      <aside className="w-80 bg-slate-900 text-slate-300 flex flex-col fixed h-full border-r border-slate-700 shadow-2xl z-10">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Poly-to-Pro
          </h1>
          <p className="text-xs text-slate-500 mt-1">Competency Validator v2.1</p>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          
          {/* Section 1: Target Role */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              1. Target Role
            </label>
            <select 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option>Audit Associate</option>
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Digital Marketer</option>
              <option>HR Executive</option>
            </select>
          </div>

          {/* Section 2: Resume Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              2. Upload Resume
            </label>
            
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all group-hover:border-emerald-500 group-hover:bg-slate-750">
                {uploading ? (
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-emerald-400" />
                )}
                <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                  {uploading ? "Parsing..." : "Click to Upload PDF"}
                </span>
                <span className="text-xs text-slate-500 mt-1">Max 5MB</span>
              </div>
            </div>

            {/* Uploaded File Indicator */}
            {resumeName && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mt-3 bg-emerald-900/30 border border-emerald-500/30 p-3 rounded-lg"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-300 truncate">{resumeName}</p>
                  <p className="text-[10px] text-emerald-500/80">Analysis Ready</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </motion.div>
            )}
          </div>

          {/* Section 3: Stats (Gamification) */}
          <div className="pt-6 border-t border-slate-700">
             <div className="flex items-center gap-2 mb-4">
               <BarChart3 className="w-4 h-4 text-purple-400" />
               <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Session Stats</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <div className="text-2xl font-bold text-white">
                    {result ? "1" : "0"}
                  </div>
                  <div className="text-[10px] text-slate-400">Answers</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <div className="text-2xl font-bold text-emerald-400">
                    {resumeName ? "ON" : "OFF"}
                  </div>
                  <div className="text-[10px] text-slate-400">Context Mode</div>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA: INTERVIEW --- */}
      <main className="flex-1 ml-80 p-8 md:p-12 max-w-6xl">
        
        {/* Header */}
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            Interview Simulator
          </h2>
          <p className="text-slate-500 mt-2">
            Practicing for <span className="font-semibold text-blue-600">{targetRole}</span>
            {resumeName && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Resume Active</span>}
          </p>
        </header>

        {/* Question Area */}
        <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            Step 1: The Question
          </label>
          <select 
            className="w-full p-4 text-lg border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          >
            <option>Tell me about a time you had to manage a difficult client situation.</option>
            <option>Describe a project where you had to analyze complex data.</option>
            <option>Tell me about a time you failed to meet a deadline.</option>
            <option>How do you ensure accuracy in your work?</option>
            <option value="custom">-- Type Custom Question --</option>
          </select>
          
          {question === "custom" && (
            <input 
              type="text" 
              placeholder="Type your custom question here..."
              className="w-full mt-4 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}
        </section>

        {/* Answer Area */}
        <section className="mb-10">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            Step 2: Your Answer (STAR Method)
          </label>
          <div className="relative">
            <textarea 
              className="w-full h-56 p-6 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 leading-relaxed shadow-inner bg-white resize-none text-lg"
              placeholder="Start typing your answer here... (e.g. 'I was working on my final year audit project when...')"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            
            {/* Analyze Button */}
            <div className="absolute bottom-4 right-4">
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white shadow-lg transform transition-all 
                  ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}
                `}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin"/> Analyzing...</span>
                ) : (
                  <>Validate Answer <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results Area (The Dual Agents) */}
        <AnimatePresence>
          {result && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Manager Agent */}
              <div className="bg-white rounded-xl shadow-xl border-t-4 border-red-500 overflow-hidden ring-1 ring-slate-900/5">
                <div className="bg-red-50/50 p-4 flex items-center gap-3 border-b border-red-100">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900 text-lg">Hiring Manager</h3>
                    <p className="text-xs text-red-700 font-medium">Critique & Technical Gaps</p>
                  </div>
                </div>
                <div className="p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {result.manager_critique}
                </div>
              </div>

              {/* Coach Agent */}
              <div className="bg-white rounded-xl shadow-xl border-t-4 border-emerald-500 overflow-hidden ring-1 ring-slate-900/5">
                <div className="bg-emerald-50/50 p-4 flex items-center gap-3 border-b border-emerald-100">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 text-lg">Career Coach</h3>
                    <p className="text-xs text-emerald-700 font-medium">Refinement & STAR Structure</p>
                  </div>
                </div>
                <div className="p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {result.coach_feedback}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}