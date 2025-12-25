import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, ChevronRight, 
  CheckCircle, AlertCircle, RefreshCw, FileText, Star, Layout
} from 'lucide-react';

const API_URL = "https://iti123-project.onrender.com"; 

export default function App() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("Tell me about a time you had to manage a difficult client situation.");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);

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
    <div className="flex min-h-screen font-sans text-slate-900 bg-white">
      
      {/* --- SIDEBAR (Clean White with Border) --- */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
        <div className="p-8 pb-4">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Layout className="w-4 h-4" />
            </div>
            Poly-to-Pro
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 pl-1">
            Validation Engine v2.1
          </p>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* Role Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Role</label>
            <div className="relative">
              <select 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-white transition-colors"
              >
                <option>Software Engineer</option>
                <option>Data Analyst</option>
                <option>Audit Associate</option>
                <option>Digital Marketer</option>
                <option>HR Executive</option>
              </select>
              <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resume Context</label>
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200
                ${resumeName 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                }
              `}>
                {uploading ? (
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                ) : resumeName ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-300 group-hover:text-blue-500 mb-2" />
                )}
                <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">
                  {uploading ? "Parsing..." : resumeName ? "Resume Active" : "Click to Upload PDF"}
                </span>
              </div>
            </div>
            {resumeName && (
              <div className="flex items-center gap-2 mt-2 px-1">
                <FileText className="w-3 h-3 text-green-500" />
                <span className="text-xs font-medium text-gray-600 truncate">{resumeName}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* --- MAIN AREA (Pure White + Gradient Header) --- */}
      <main className="flex-1 ml-80 bg-white relative">
        
        {/* Subtle Top Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none z-0"></div>

        <div className="max-w-4xl mx-auto p-12 relative z-10 pb-40">
          
          <header className="mb-12">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-200">
              AI Interview Mode
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Prepare for <span className="text-blue-600">{targetRole}</span>
            </h2>
            <p className="text-lg text-gray-500 mt-3 font-light">
              Master your behavioral answers with real-time analysis against the Skills Framework.
            </p>
          </header>

          {/* Question Section */}
          <section className="mb-8">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
              <select 
                className="w-full p-4 text-lg text-gray-700 font-medium bg-transparent outline-none cursor-pointer"
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
                className="w-full mt-3 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
              />
            )}
          </section>

          {/* Answer Section */}
          <section className="mb-12 relative">
            <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-gray-400 uppercase tracking-wider z-20">
              Your Answer
            </div>
            <textarea 
              className="w-full h-64 p-6 text-lg border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-700 leading-relaxed bg-white resize-none shadow-sm placeholder:text-gray-300"
              placeholder="Use the STAR method: Situation, Task, Action, Result..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            
            <div className="absolute bottom-6 right-6">
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transform transition-all 
                  ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-blue-200'}
                `}
              >
                {loading ? "Analyzing..." : "Validate Answer"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Results Area */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-8"
              >
                {/* Manager Feedback */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ring-1 ring-black/5">
                  <div className="bg-red-50/50 p-6 border-b border-red-100 flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg text-red-500 shadow-sm">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Hiring Manager Feedback</h3>
                      <p className="text-xs text-red-500 font-bold uppercase tracking-wide">Critical Gaps</p>
                    </div>
                  </div>
                  <div className="p-8 text-gray-600 markdown-content">
                    <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                  </div>
                </div>

                {/* Coach Feedback */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ring-1 ring-black/5">
                  <div className="bg-green-50/50 p-6 border-b border-green-100 flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg text-green-600 shadow-sm">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Career Coach Refinement</h3>
                      <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Model Answer</p>
                    </div>
                  </div>
                  <div className="p-8 text-gray-600 markdown-content">
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