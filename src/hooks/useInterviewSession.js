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
  // --- SESSION STATUS ---
  // 'idle'      -> Waiting for file
  // 'uploading' -> Sending to server
  // 'verified'  -> File accepted. Waiting for user to click "Start".
  // 'analyzing' -> AI is streaming results
  // 'done'      -> Analysis complete
  const [sessionStatus, setSessionStatus] = useState("idle");
  const [uploadError, setUploadError] = useState("");

  // --- Data States ---
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");

  // --- Skill Analysis State ---
  const [skillAnalysis, setSkillAnalysis] = useState(null);
  const [skillStep, setSkillStep] = useState(0);
  const [traceLogs, setTraceLogs] = useState({});

  // --- Answer Analysis State ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const apiSecret = process.env.REACT_APP_BACKEND_SECRET;

  // ==================================================
  // STEP 1: UPLOAD & VERIFY (Stops after verification)
  // ==================================================
  const handleFileUpload = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setSessionStatus("uploading");
    setUploadError("");
    setResumeName(file.name);
    setSkillAnalysis(null);
    setTraceLogs({});

    const formData = new FormData();
    formData.append("file", file);

    try {
      // ✅ CORRECT URL: /api/skills/upload_resume
      // ✅ CORRECT HEADER: X-Poly-Secret
      const response = await axios.post(
        `${apiUrl}/api/skills/upload_resume`,
        formData,
        {
          headers: {
            "X-Poly-Secret": apiSecret,
          },
        }
      );

      // SUCCESS: Store text, but STOP here.
      setResumeText(response.data.safety_text);
      setSessionStatus("verified");
    } catch (error) {
      console.error("Upload failed:", error);
      setSessionStatus("error");
      setResumeName("");

      let msg = "Failed to upload resume.";
      if (error.response && error.response.data && error.response.data.detail) {
        msg = error.response.data.detail;
      }
      setUploadError(msg);
    }
  };

  // ==================================================
  // STEP 2: START ANALYSIS (Manual Trigger)
  // ==================================================
  const startProfileAnalysis = async () => {
    if (!resumeText || !targetRole) {
      alert("Please ensure a resume is uploaded and a role is selected.");
      return;
    }

    setSessionStatus("analyzing");
    setSkillStep(1);
    setTraceLogs({ 1: "Initializing analysis stream...\n" });

    try {
      // ✅ CORRECT URL: /api/skills/match_skills
      // ✅ CORRECT HEADER: X-Poly-Secret
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
                setSessionStatus("done");
              }
            } catch (e) {
              console.error("JSON Parse Error", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setSessionStatus("verified");
      setUploadError("Analysis connection failed. Please try again.");
    }
  };

  // ==================================================
  // STEP 3: ANSWER ANALYSIS (Unchanged)
  // ==================================================
  const handleAnswerSubmit = async (answer) => {
    if (!answer.trim()) return;
    setLoading(true);
    setResult(null);

    const question = questionBank[currentStep];

    try {
      // ✅ CORRECT URL: /api/interview/analyze_stream
      // ✅ CORRECT HEADER: X-Poly-Secret
      const response = await fetch(`${apiUrl}/api/interview/analyze_stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Poly-Secret": apiSecret,
        },
        body: JSON.stringify({
          target_role: targetRole,
          question: question,
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

  // --- COMPATIBILITY MAPPING ---
  // We map the new "sessionStatus" back to the booleans your UI expects.
  const uploading = sessionStatus === "uploading";
  const isAnalyzingProfile = sessionStatus === "analyzing";
  const isReadyToAnalyze = sessionStatus === "verified"; // <--- USE THIS FOR YOUR BUTTON

  return {
    // Legacy Variables (So your UI doesn't break)
    uploading,
    isAnalyzingProfile,
    resumeName,
    resumeText,

    // New Variables
    sessionStatus,
    uploadError,
    isReadyToAnalyze,

    // Data
    skillAnalysis,
    skillStep,
    traceLogs,
    loading,
    result,
    currentStep,

    // Functions
    handleFileUpload,
    startProfileAnalysis,
    handleAnswerSubmit,
    handleResetPractice,
  };
}
