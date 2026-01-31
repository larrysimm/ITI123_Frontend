import { useState } from "react";
import axios from "axios";

export function useInterviewSession(
  apiUrl,
  questionBank,
  targetRole,
  setQuestion,
  setAnswer,
  serverStatus
) {
  // --- STATE ---
  const [uploading, setUploading] = useState(false); // Phase 1: Uploading File
  const [isVerified, setIsVerified] = useState(false); // Phase 1 Complete: Ready to Analyze
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false); // Phase 2: AI working

  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [uploadError, setUploadError] = useState("");

  // --- Analysis Data ---
  const [skillAnalysis, setSkillAnalysis] = useState(null);
  const [skillStep, setSkillStep] = useState(0);
  const [traceLogs, setTraceLogs] = useState({});

  // --- Answer Practice Data ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const apiSecret = process.env.REACT_APP_BACKEND_SECRET;

  // ==================================================
  // STEP 1: UPLOAD & VERIFY (Stops after success)
  // ==================================================
  const handleFileUpload = async (e) => {
    // Handle both standard Event and Drag-and-Drop synthetic event
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setResumeName(file.name);

    // Reset Analysis States
    setIsVerified(false);
    setIsAnalyzingProfile(false);
    setSkillAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // ✅ PRESERVED URL & HEADER
      const response = await axios.post(
        `${apiUrl}/api/skills/upload_resume`,
        formData,
        {
          headers: { "X-Poly-Secret": apiSecret },
        }
      );

      // ✅ SUCCESS: Store text, Mark as VERIFIED
      setResumeText(response.data.safety_text || response.data.extracted_text); // Handle potential naming diffs
      setIsVerified(true);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsVerified(false);
      setResumeName("");

      let msg = "Failed to upload resume.";
      if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      }
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  // ==================================================
  // STEP 2: START ANALYSIS (Manual Trigger)
  // ==================================================
  const startProfileAnalysis = async () => {
    if (!resumeText || !targetRole) {
      alert("Missing resume or target role.");
      return;
    }

    setIsAnalyzingProfile(true);
    setSkillStep(1);
    setTraceLogs({ 1: "Initializing analysis stream...\n" });

    try {
      // ✅ PRESERVED URL & HEADER
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
              if (data.type === "log") {
                setTraceLogs((prev) => ({
                  ...prev,
                  [data.step]: (prev[data.step] || "") + data.message + "\n",
                }));
                setSkillStep(data.step);
              } else if (data.type === "result") {
                setSkillAnalysis(data.data);
                setIsAnalyzingProfile(false);
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setIsAnalyzingProfile(false);
    }
  };

  // Step 3 (Unchanged)
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
              }
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
    // UI Flags
    uploading,
    isVerified, // <--- Use this to show "Start Button"
    isAnalyzingProfile, // <--- Use this to show "Analyzing Spinner"

    // Data
    resumeName,
    setResumeName,
    setResumeText,
    skillAnalysis,
    skillStep,
    traceLogs,
    result,
    currentStep,

    // Functions
    handleFileUpload,
    startProfileAnalysis,
    handleAnalyzeStream,
    handleResetPractice,
  };
}
