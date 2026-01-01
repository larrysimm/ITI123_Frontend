import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import LandingScreen from "./components/LandingScreen";
import MainInterface from "./components/MainInterface";
import polyTitle from "./poly2pro.png";
import logo from "./logo.png";
import "./App.css";

// Use Env Var or Default to Localhost
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const MAX_WAIT_TIME_MS = 300000; // 5 Minutes Timeout

export default function App() {
  // UI State
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Data State
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [question, setQuestion] = useState(
    "Tell me about a time you had to manage a difficult client situation."
  );
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [questionBank, setQuestionBank] = useState([]); // Store the list
  const [isCustomQuestion, setIsCustomQuestion] = useState(false); // Toggle dropdown vs input
  const [availableRoles, setAvailableRoles] = useState([]);
  const [skillAnalysis, setSkillAnalysis] = useState(null); // Stores the match results
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
  const isValidateDisabled =
    !answer.trim() || !skillAnalysis || !question.trim();
  const [skillStep, setSkillStep] = useState(0);
  const [traceLogs, setTraceLogs] = useState({ 1: "", 2: "", 3: "" });

  // Server Health State
  const [serverStatus, setServerStatus] = useState("sleeping"); // sleeping, waking, ready, timeout
  const [elapsedTime, setElapsedTime] = useState(0);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const startTimeRef = useRef(null);

  // --- 1. AUTO-WAKE & PING LOGIC ---
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    // Reset logic on trigger
    setServerStatus("waking");
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    const ping = async () => {
      if (!isMounted) return;

      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      setElapsedTime(Math.floor(elapsed / 1000));

      // 1. Timeout Check
      if (elapsed > MAX_WAIT_TIME_MS) {
        if (isMounted) setServerStatus("timeout");
        return; // Stop looping
      }

      // 2. API Call
      try {
        const res = await axios.get(`${API_URL}/`, { timeout: 5000 });
        if (res.data.status === "OK") {
          if (isMounted) setServerStatus("ready");
          return; // Stop looping on success
        }
      } catch (err) {
        // Ignore error, continue to retry logic
      }

      // 3. Recursive Retry
      // We removed the check for 'serverStatus' here to fix the lint warning.
      // The 'return' above guarantees we only reach here if we haven't succeeded yet.
      if (isMounted) {
        timeoutId = setTimeout(ping, 2000);
      }
    };

    ping();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
    // DEPENDENCIES: Only retryTrigger. The effect won't re-run on state changes, which is what we want.
  }, [retryTrigger]);

  // Visual Timer Interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (serverStatus === "waking" && startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [serverStatus]);

  // FETCH QUESTIONS ON LOAD

  useEffect(() => {
    if (serverStatus === "ready") {
      console.log("🚀 Fetching initial data (Questions & Roles)...");

      // A. Fetch Questions
      axios
        .get(`${API_URL}/questions`)
        .then((res) => {
          // 1. Sort Alphabetically
          const sortedQuestions = res.data.sort((a, b) =>
            a.text.localeCompare(b.text)
          );

          setQuestionBank(sortedQuestions);

          // 2. Select the first one (Alphabetical #1)
          if (Array.isArray(sortedQuestions) && sortedQuestions.length > 0) {
            setQuestion(sortedQuestions[0].text);
          }
        })
        .catch((err) => console.error("❌ Error fetching questions:", err));

      // B. Fetch Roles (NEW)
      axios
        .get(`${API_URL}/roles`)
        .then((res) => {
          console.log("✅ Roles received:", res.data);
          setAvailableRoles(res.data);

          // Set default role if list is not empty
          if (res.data.length > 0) {
            // Keep existing selection if valid, otherwise pick first one
            setTargetRole((prev) =>
              res.data.includes(prev) ? prev : res.data[0]
            );
          } else {
            // Fallback if DB is empty
            setTargetRole("Software Engineer");
          }
        })
        .catch((err) => console.error("❌ Error fetching roles:", err));
    }
  }, [serverStatus]);

  // SKILL MATCHING LOGIC (With Expandable Trace)
  useEffect(() => {
    if (serverStatus === "ready" && resumeText && targetRole) {
      console.log("⚡ Starting Detailed Skill Analysis...");
      setIsAnalyzingProfile(true);
      setSkillAnalysis(null);
      setSkillStep(1);
      // Reset logs
      setTraceLogs({
        1: "Initializing connection...\n",
        2: "",
        3: "",
      });

      const fetchStream = async () => {
        try {
          const response = await fetch(`${API_URL}/match_skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

                  // 1. UPDATE STEP NUMBER
                  if (msg.step) {
                    setSkillStep(msg.step);
                  }

                  // 2. APPEND LOGS TO THE SPECIFIC STEP
                  if (msg.message) {
                    setTraceLogs((prev) => ({
                      ...prev,
                      [msg.step]: prev[msg.step] + "➜ " + msg.message + "\n",
                    }));
                  }

                  // 3. HANDLE FINAL RESULT
                  if (msg.type === "result") {
                    setSkillStep(100);
                    setSkillAnalysis(msg.data);
                    setTimeout(() => setIsAnalyzingProfile(false), 2000); // Keep open longer so user can read logs
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream Error:", err);
          setIsAnalyzingProfile(false);
        }
      };

      fetchStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeText, targetRole, serverStatus]);

  // --- 2. HANDLERS ---
  const handleFileUpload = async (e) => {
    if (serverStatus !== "ready") return alert("Waiting for server...");

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
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeStream = async () => {
    if (!resumeText) return;

    setLoading(true);
    setResult(null);
    setCurrentStep(1);
    setRetryTrigger(0);

    try {
      const response = await fetch(`${API_URL}/analyze_stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          target_role: targetRole,
          question: question,
          student_answer: answer,
          skill_data: skillAnalysis,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; // <--- 1. Create a buffer to hold incomplete chunks

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // 2. Add new chunk to the buffer
        buffer += decoder.decode(value, { stream: true });

        // 3. Split by newline to get all COMPLETE messages
        const lines = buffer.split("\n");

        // 4. The last item in 'lines' is likely incomplete (remainder).
        //    Pop it off and save it back to the buffer for the next loop.
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);

              if (data.type === "step") {
                setCurrentStep(data.step_id);
              } else if (data.type === "partial_update") {
                // Merges the new "manager_thinking" into the existing result object
                setResult((prev) => ({ ...prev, ...data.data }));
              } else if (data.type === "result") {
                setResult(data.data);
                setLoading(false);
              } else if (data.type === "error") {
                console.error("Stream error:", data.message);
                setLoading(false);
              }
            } catch (e) {
              console.error("JSON Parse Error", e, "Line:", line);
            }
          }
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
    }
  };

  // RESET HANDLER: Clears the answer and results, keeps the resume/role
  const handleResetPractice = () => {
    setAnswer(""); // Clear the user's typed answer
    setResult(null); // Clear the AI analysis results
    setCurrentStep(0); // Reset the progress bar
    setIsCustomQuestion(false); // Optional: Reset custom question mode

    // Optional: Scroll back to the top to choose a new question
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- 3. RENDER ---
  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <Sidebar
        logo={logo}
        polyTitle={polyTitle}
        serverStatus={serverStatus}
        setRetryTrigger={setRetryTrigger}
        elapsedTime={elapsedTime}
        targetRole={targetRole}
        setTargetRole={setTargetRole}
        availableRoles={availableRoles}
        resumeName={resumeName}
        isAnalyzingProfile={isAnalyzingProfile}
        skillAnalysis={skillAnalysis}
        skillStep={skillStep}
        traceLogs={traceLogs}
      />
      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        <div className="container" style={{ maxWidth: "900px" }}>
          {/* GATE: LANDING SCREEN */}
          {!resumeName ? (
            <LandingScreen
              logo={logo}
              targetRole={targetRole}
              serverStatus={serverStatus}
              uploading={uploading}
              handleFileUpload={handleFileUpload}
            />
          ) : (
            /* MAIN INTERFACE */
            <MainInterface
              logo={logo}
              targetRole={targetRole}
              setResumeName={setResumeName}
              setResumeText={setResumeText}
              question={question}
              setQuestion={setQuestion}
              isCustomQuestion={isCustomQuestion}
              setIsCustomQuestion={setIsCustomQuestion}
              questionBank={questionBank}
              answer={answer}
              setAnswer={setAnswer}
              handleAnalyzeStream={handleAnalyzeStream}
              isValidateDisabled={isValidateDisabled}
              loading={loading}
              skillAnalysis={skillAnalysis}
              result={result}
              currentStep={currentStep}
              handleResetPractice={handleResetPractice}
            />
          )}
        </div>
      </div>
    </div>
  );
}
