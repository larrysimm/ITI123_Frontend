import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, UserCircle, Briefcase, ChevronRight, 
  MessageSquare, CheckCircle, AlertCircle, RefreshCw, FileText 
} from 'lucide-react';

// --- CONFIGURATION ---
// REPLACE THIS with your Render Backend URL when deploying!
const API_URL = "https://iti123-project.onrender.com"; 
// Example: const API_URL = "https://p2p-backend.onrender.com";

export default function App() {
  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Context Data
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [targetRole, setTargetRole] = useState("Audit Associate"); // Default

  // Interview Data
  const [question, setQuestion] = useState("Tell me about a time you had to manage a difficult client situation.");
  const [answer, setAnswer] = useState("");
  
  // Results
  const [result, setResult] = useState(null);

  // --- HANDLERS ---

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
      alert("Resume Parsed Successfully!");
    } catch (err) {
      console.error(err);
      alert("Error uploading resume. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!answer.trim()) return alert("Please type an answer first.");
    
    setLoading(true);
    setResult(null); // Reset previous result

    try {
      const payload = {
        student_answer: answer,
        question: question,
        target_role: targetRole,
        resume_text: resumeText || "No resume provided."
      };

      const res = await axios.post(`${API_URL}/analyze`, payload);
      setResult(res.data);
      setStep(3); // Move to results view
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // --- UI COMPONENTS ---

  const Sidebar = () => (
    <div className="w-80 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-700 shadow-2xl z-10 hidden md:flex">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-400" />
          Poly-to-Pro
        </h1>
        <p className="text-xs text-slate-500 mt-1">Competency Validator v2.0</p>
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        {/* Step 1: Context Engine */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            1. Context Engine
          </h3>
          
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <Upload className="w-4 h-4 text-blue-400" />
              Upload Resume
            </label>
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileUpload}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer"
            />
            {uploading && <p className="text-xs text-blue-400 mt-2 animate-pulse">Parsing PDF...</p>}
            {resumeName && (
              <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400 bg-emerald-400/10 p-2 rounded">
                <FileText className="w-3 h-3" />
                {resumeName}
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
              <UserCircle className="w-4 h-4 text-purple-400" />
              Target Role
            </label>
            <select 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option>Audit Associate</option>
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Digital Marketer</option>
              <option>HR Executive</option>
            </select>
          </div>
        </div>

        {/* Gamification Stats */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Session Stats
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center">
              <div className="text-xl font-bold text-white">0</div>
              <div className="text-[10px] text-slate-400">Answers</div>
            </div>
            <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center">
              <div className="text-xl font-bold text-emerald-400">--</div>
              <div className="text-[10px] text-slate-400">Avg Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pl-0 md:pl-80">
      <Sidebar />
      
      <main className="max-w-5xl mx-auto p-6 md:p-12">
        {/* Header */}
        <header className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            Interview Simulator
            {loading && <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />}
          </h2>
          <p className="text-slate-500 mt-2">
            Practicing for: <span className="font-semibold text-blue-600">{targetRole}</span>
          </p>
        </header>

        {/* STEP 1: Question Setup */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Step 1: The Interview Question
          </label>
          <div className="flex gap-4">
            <select 
              className="flex-1 p-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            >
              <option>Tell me about a time you had to manage a difficult client situation.</option>
              <option>Describe a project where you had to analyze complex data.</option>
              <option>Tell me about a time you failed to meet a deadline.</option>
              <option>How do you ensure accuracy in your work?</option>
              <option value="custom">-- Type Custom Question --</option>
            </select>
          </div>
          {question === "custom" && (
            <input 
              type="text" 
              placeholder="Type your custom question here..."
              className="w-full mt-3 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}
        </div>

        {/* STEP 2: Answer Input */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Step 2: Your Answer (STAR Method Draft)
          </label>
          <textarea 
            className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 leading-relaxed shadow-inner bg-white resize-none"
            placeholder="I was working on my final year project when..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          ></textarea>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transform transition-all hover:scale-105
                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}
              `}
            >
              {loading ? "Analyzing via AI Agents..." : "Validate My Answer"}
              {!loading && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* STEP 3: Dual-Agent Feedback Cards */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Card 1: Manager (Red/Critical) */}
              <div className="bg-white rounded-xl shadow-lg border-l-4 border-red-500 overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900">The Hiring Manager</h3>
                    <p className="text-xs text-red-700">Focus: Technical Accuracy & SkillsFuture Gaps</p>
                  </div>
                </div>
                <div className="p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.manager_critique}
                </div>
              </div>

              {/* Card 2: Coach (Green/Constructive) */}
              <div className="bg-white rounded-xl shadow-lg border-l-4 border-emerald-500 overflow-hidden">
                <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">The Career Coach</h3>
                    <p className="text-xs text-emerald-700">Focus: Structure (STAR) & Persuasion</p>
                  </div>
                </div>
                <div className="p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.coach_feedback}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}