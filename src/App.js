import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Briefcase, ChevronRight, 
  CheckCircle, AlertCircle, RefreshCw, FileText, Zap, Star
} from 'lucide-react';

// --- CONFIGURATION ---
const API_URL = "https://iti123-project.onrender.com"; 

export default function App() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // State
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
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
      const res = await axios.post(`${API_URL}/upload_resume`, formData);
      setResumeText(res.data.extracted_text);
      setResumeName(res.data.filename);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check backend.");
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
    // The layout is handled by index.css 'aside' and 'main' rules
    <div className="flex min-h-screen">
      
      {/* --- SIDEBAR --- */}
      <aside>
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-900">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            Poly-to-Pro
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
            v2.1 Validator
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Role Select */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              1. Target Role
            </label>
            <select 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Audit Associate</option>
              <option>Digital Marketer</option>
              <option>HR Executive</option>
            </select>
          </div>

          {/* Upload */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              2. Upload Context
            </label>
            <div className="relative group cursor-pointer">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all
                ${resumeName ? 'border-emerald-500/50 bg-emerald-900/20' : 'border-slate-600 bg-slate-800 hover:border-blue-500'}
              `}>
                {uploading ? (
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mb-2" />
                ) : resumeName ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                )}
                <span className="text-xs font-medium text-slate-300">
                  {uploading ? "Parsing..." : resumeName ? "Resume Active" : "Click to Upload PDF"}
                </span>
              </div>
            </div>
            {resumeName && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <FileText className="w-3 h-3" /> {resumeName}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900">
          <div className="text-[10px] text-center text-slate-500">
            Powered by Gemini 1.5 Flash
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main>
        <div className="max-w-4xl mx-auto p-8 md:p-12 pb-32">
          
          <header className="mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
              <Zap className="w-3 h-3" /> Interview Simulator
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Prepare for <span className="text-blue-600">{targetRole}</span>
            </h2>
          </header>

          {/* Question */}
          <section className="mb-8">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              <select 
                className="w-full p-3 text-lg bg-transparent outline-none"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              >
                <option>Tell me about a time you had to manage a difficult client situation.</option>
                <option>Describe a project where you had to analyze complex data.</option>
                <option>Tell me about a time you failed to meet a deadline.</option>
                <option value="custom">-- Custom Question --</option>
              </select>
            </div>
            {question === "custom" && (
              <input 
                type="text" 
                placeholder="Type your question..."
                className="w-full mt-3 p-3 border border-slate-200 rounded-lg"
              />
            )}
          </section>

          {/* Answer */}
          <section className="mb-10 relative">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Your Answer (STAR Method)</label>
            <textarea 
              className="w-full h-64 p-5 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-sm"
              placeholder="Situation: ... Task: ... Action: ... Result: ..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className={`absolute bottom-6 right-6 px-6 py-2 rounded-lg font-bold text-white transition-all ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? "Analyzing..." : "Validate Answer"}
            </button>
          </section>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Manager Feedback */}
                <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                  <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                    <AlertCircle className="text-red-600 w-5 h-5" />
                    <h3 className="font-bold text-red-900">Hiring Manager Critique</h3>
                  </div>
                  <div className="p-6 text-slate-700 markdown-content">
                    <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                  </div>
                </div>

                {/* Coach Feedback */}
                <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
                  <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-3">
                    <Star className="text-emerald-600 w-5 h-5" />
                    <h3 className="font-bold text-emerald-900">Career Coach Refinement</h3>
                  </div>
                  <div className="p-6 text-slate-700 markdown-content">
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