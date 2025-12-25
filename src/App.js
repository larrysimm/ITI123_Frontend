import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, ChevronRight, 
  CheckCircle, AlertCircle, RefreshCw, FileText, Zap, Star, Layout
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
    // The layout structure is handled by index.css to be safe
    <div className="flex min-h-screen bg-slate-50 text-slate-600">
      
      {/* --- SIDEBAR (Soft White) --- */}
      <aside className="bg-white border-r border-slate-100 shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-8 pb-4">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="bg-indigo-50 p-2 rounded-xl">
              <Layout className="w-5 h-5 text-indigo-600" />
            </div>
            Poly-to-Pro
          </h1>
          <p className="text-[11px] text-slate-400 mt-2 font-medium uppercase tracking-widest pl-1">
            v2.1 Validator
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10 flex-1">
          
          {/* Role Select */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Target Role
            </label>
            <div className="relative">
              <select 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none transition-all appearance-none cursor-pointer hover:bg-white"
              >
                <option>Software Engineer</option>
                <option>Data Analyst</option>
                <option>Audit Associate</option>
                <option>Digital Marketer</option>
                <option>HR Executive</option>
              </select>
              <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Upload Context
            </label>
            
            <div className="relative group cursor-pointer">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300
                ${resumeName 
                  ? 'border-emerald-200 bg-emerald-50/50' 
                  : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white'
                }
              `}>
                {uploading ? (
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                ) : resumeName ? (
                  <div className="bg-emerald-100 p-2 rounded-full mb-3">
                     <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                ) : (
                  <div className="bg-slate-100 p-2 rounded-full mb-3 group-hover:bg-indigo-50 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                  </div>
                )}
                
                <span className="text-sm font-semibold text-slate-600">
                  {uploading ? "Analyzing..." : resumeName ? "Resume Active" : "Upload Resume"}
                </span>
                {!resumeName && <span className="text-xs text-slate-400 mt-1">PDF format (Max 5MB)</span>}
              </div>
            </div>

            {/* Active File Badge */}
            <AnimatePresence>
              {resumeName && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white border border-slate-100 shadow-sm rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <FileText className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{resumeName}</p>
                    <p className="text-[10px] text-emerald-500 font-medium">Ready for Context</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            <Zap className="w-3 h-3 text-amber-400 fill-current" />
            Powered by Gemini AI
          </div>
        </div>
      </aside>


      {/* --- MAIN CONTENT (Soft Light Gray) --- */}
      <main className="flex-1 relative">
        <div className="max-w-4xl mx-auto p-10 md:p-14 pb-40">
          
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-5 border border-indigo-100">
              Interview Simulator
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Prepare for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600">{targetRole}</span>
            </h2>
            <p className="text-slate-500 mt-4 text-lg font-light leading-relaxed max-w-2xl">
              Draft your response using the STAR method. Our dual-agent system will validate your answer against official SkillsFuture frameworks.
            </p>
          </header>

          {/* Question Card */}
          <section className="mb-8 group">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 group-hover:border-indigo-200 group-hover:shadow-md transition-all">
              <select 
                className="w-full p-4 text-lg bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer rounded-xl"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              >
                <option>Tell me about a time you had to manage a difficult client situation.</option>
                <option>Describe a project where you had to analyze complex data.</option>
                <option>Tell me about a time you failed to meet a deadline.</option>
                <option value="custom">-- Type Your Own Question --</option>
              </select>
            </div>
            {question === "custom" && (
              <input 
                type="text" 
                placeholder="Type your question..."
                className="w-full mt-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            )}
          </section>

          {/* Answer Area */}
          <section className="mb-12 relative">
            <div className="absolute -top-3 left-6 bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider z-10">
              Your Answer
            </div>
            <textarea 
              className="w-full h-64 p-8 text-lg border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none text-slate-700 leading-relaxed shadow-sm bg-white resize-none transition-all placeholder:text-slate-300"
              placeholder="Situation: I was working on... Task: My goal was to... Action: I specifically... Result: The outcome was..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            
            <div className="absolute bottom-6 right-6">
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className={`
                  flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white shadow-xl shadow-indigo-200 transform transition-all active:scale-95
                  ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:shadow-2xl hover:-translate-y-1'}
                `}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin"/> Processing...</span>
                ) : (
                  <>Validate <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </section>

          {/* Results (Soft Colors) */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-10"
              >
                {/* Manager Card (Soft Red) */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="bg-rose-50/60 p-6 flex items-center gap-5 border-b border-rose-100/50">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-rose-500">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Hiring Manager Feedback</h3>
                      <p className="text-xs text-rose-500 font-bold uppercase tracking-wide mt-0.5">Gap Analysis</p>
                    </div>
                  </div>
                  <div className="p-10 text-slate-600 markdown-content">
                    <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                  </div>
                </div>

                {/* Coach Card (Soft Teal) */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="bg-teal-50/60 p-6 flex items-center gap-5 border-b border-teal-100/50">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-teal-500">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Career Coach Refinement</h3>
                      <p className="text-xs text-teal-500 font-bold uppercase tracking-wide mt-0.5">Model STAR Answer</p>
                    </div>
                  </div>
                  <div className="p-10 text-slate-600 markdown-content">
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