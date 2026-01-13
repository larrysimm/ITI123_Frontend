import React, { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

// Assets
import polyTitle from "./poly2pro.png";
import logo from "./logo.png";

// Components
import Sidebar from "./components/Sidebar";
import LandingScreen from "./components/LandingScreen";
import MainInterface from "./components/MainInterface";

// Hooks
import { useServerHealth } from "./hooks/useServerHealth";
import { useInterviewData } from "./hooks/useInterviewData";
import { useInterviewSession } from "./hooks/useInterviewSession";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function App() {
  // --- 1. HOOKS & STATE ---
  const { serverStatus, elapsedTime, setRetryTrigger } =
    useServerHealth(API_URL);

  const { questionBank, availableRoles, defaultRole } = useInterviewData(
    API_URL,
    serverStatus
  );

  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("");
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const [answer, setAnswer] = useState("");

  // NEW: State for Mobile Menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync Defaults
  useEffect(() => {
    if (defaultRole) setTargetRole(defaultRole);
  }, [defaultRole]);

  // Session Logic
  const session = useInterviewSession(
    API_URL,
    questionBank,
    targetRole,
    setQuestion,
    setAnswer,
    serverStatus
  );

  // Helper to ensure isValidateDisabled is boolean
  const isValidateDisabled = !!(
    session.loading ||
    !session.resumeName ||
    !answer.trim()
  );

  return (
    <div className="dashboard-container">
      {/* --- MOBILE: OVERLAY BACKDROP --- */}
      <div
        className={`sidebar-overlay ${mobileMenuOpen ? "show" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* --- MOBILE: HAMBURGER BUTTON --- */}
      <button
        className="btn btn-light shadow-sm mobile-nav-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <i className={`bi ${mobileMenuOpen ? "bi-x-lg" : "bi-list"} fs-4`}></i>
      </button>

      {/* --- SIDEBAR --- */}
      <div className={`sidebar-wrapper ${mobileMenuOpen ? "show" : ""}`}>
        <Sidebar
          logo={logo}
          polyTitle={polyTitle}
          serverStatus={serverStatus}
          setRetryTrigger={setRetryTrigger}
          elapsedTime={elapsedTime}
          targetRole={targetRole}
          setTargetRole={(role) => {
            setTargetRole(role);
            setMobileMenuOpen(false); // Close menu on mobile selection
          }}
          availableRoles={availableRoles}
          resumeName={session.resumeName}
          // 👇 THIS IS THE FIX: We add '|| session.loading'
          isAnalyzingProfile={session.isAnalyzingProfile || session.loading}
          skillAnalysis={session.skillAnalysis}
          skillStep={session.skillStep}
          traceLogs={session.traceLogs}
          // New Prop to handle closing
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main-content">
        {!session.resumeName ? (
          <LandingScreen
            logo={logo}
            targetRole={targetRole}
            serverStatus={serverStatus}
            // 👇 Also fixed this to ensure spinner shows
            uploading={session.uploading || session.loading}
            handleFileUpload={session.handleFileUpload}
          />
        ) : (
          <MainInterface
            logo={logo}
            targetRole={targetRole}
            apiUrl={API_URL}
            setResumeName={session.setResumeName}
            setResumeText={session.setResumeText}
            question={question}
            setQuestion={setQuestion}
            isCustomQuestion={isCustomQuestion}
            setIsCustomQuestion={setIsCustomQuestion}
            questionBank={questionBank}
            answer={answer}
            setAnswer={setAnswer}
            handleAnalyzeStream={(manualAnswer) =>
              session.handleAnalyzeStream(
                question,
                typeof manualAnswer === "string" ? manualAnswer : answer
              )
            }
            isValidateDisabled={isValidateDisabled}
            loading={session.loading}
            skillAnalysis={session.skillAnalysis}
            result={session.result}
            currentStep={session.currentStep}
            handleResetPractice={() => {
              session.handleResetPractice();
              setAnswer("");
              setIsCustomQuestion(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
