import { useState, useEffect } from "react";
import axios from "axios";

// 1. FIX: Updated arguments to match App.js exactly
export function useInterviewSession(
  apiUrl,
  questionBank, // Received but not currently used in this version (kept for compatibility)
  targetRole,
  setQuestion, // Received but not currently used in this version
  setAnswer, // Received but not currently used in this version
  serverStatus // This was missing/misaligned before!
) {
  // --- Upload State ---
  const [uploading, setUploading] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");

  // --- Skill Analysis State ---
  const [skillAnalysis, setSkillAnalysis] = useState(null);
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
  const [skillStep, setSkillStep] = useState(0);
  const [traceLogs, setTraceLogs] = useState({ 1: "", 2: "", 3: "" });

  // --- Answer Analysis State ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const apiSecret = process.env.REACT_APP_BACKEND_SECRET;

  // 2. Skill Matching Stream (Triggered automatically when Resume or Role changes)
  useEffect(() => {
    // FIX: Now 'serverStatus' is actually the string "ready", so this works
    if (serverStatus === "ready" && resumeText && targetRole) {
      setIsAnalyzingProfile(true);
      setSkillAnalysis(null);
      setSkillStep(1);
      setTraceLogs({ 1: "Initializing connection...\n", 2: "", 3: "" });

      const fetchSkillStream = async () => {
        try {
          const response = await fetch(`${apiUrl}/api/skills/match_skills`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Poly-Secret": apiSecret,
            },
            body: JSON.stringify({
              resume_text: resumeText,
              target_role: targetRole,
            }),
          });

          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const msg = JSON.parse(line);
                  if (msg.step) setSkillStep(msg.step);
                  if (msg.message) {
                    setTraceLogs((prev) => ({
                      ...prev,
                      [msg.step]:
                        (prev[msg.step] || "") + "➜ " + msg.message + "\n",
                    }));
                  }
                  if (msg.type === "result") {
                    setSkillStep(100);
                    setSkillAnalysis(msg.data); // This populates the Sidebar
                    setTimeout(() => setIsAnalyzingProfile(false), 2000);
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            }
          }
        } catch (err) {
          console.error("Skill Stream Error:", err);
          setIsAnalyzingProfile(false);
        }
      };
      fetchSkillStream();
    }
  }, [resumeText, targetRole, serverStatus, apiUrl, apiSecret]);

  // 3. Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("❌ Invalid File: Please upload a PDF.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Ensure this endpoint matches your backend exactly
      const res = await axios.post(
        `${apiUrl}/api/skills/upload_resume`,
        formData,
        {
          headers: {
            "X-Poly-Secret": apiSecret,
          },
        }
      );

      // Success Logic
      setResumeText(res.data.extracted_text);
      setResumeName(res.data.filename);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const aiMessage = err.response.data.detail;
        alert(`⚠️ Upload Rejected:\n\n${aiMessage}`);
        e.target.value = "";
      } else if (err.response && err.response.status === 413) {
        alert("❌ File is too large (Max 5MB).");
      } else {
        alert("❌ Server Error: Could not verify resume. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // 4. Answer Analysis Handler
  const handleAnalyzeStream = async (question, answer) => {
    if (!resumeText) return;
    setLoading(true);
    setResult(null);
    setCurrentStep(1);

    try {
      const response = await fetch(`${apiUrl}/api/interview/analyze_stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Poly-Secret": apiSecret,
        },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: targetRole,
          question,
          student_answer: answer,
          skill_data: skillAnalysis,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.type === "step") setCurrentStep(data.step_id);
              else if (data.type === "partial_update")
                setResult((prev) => ({ ...prev, ...data.data }));
              else if (data.type === "result") {
                setResult(data.data);
                setLoading(false);
              } else if (data.type === "error") setLoading(false);
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const handleResetPractice = () => {
    setResult(null);
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    uploading,
    loading,
    resumeName,
    setResumeName,
    setResumeText,
    skillAnalysis,
    isAnalyzingProfile,
    skillStep,
    traceLogs,
    result,
    currentStep,
    handleFileUpload,
    handleAnalyzeStream,
    handleResetPractice,
  };
}
