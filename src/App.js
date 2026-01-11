import React, { useState, useEffect } from "react";
import "./App.css";
import polyTitle from "./poly2pro.png";
import logo from "./logo.png";

// Import Components (From previous step)
import Sidebar from "./components/Sidebar";
import LandingScreen from "./components/LandingScreen";
import MainInterface from "./components/MainInterface";

// Import Logic Hooks
import { useServerHealth } from "./hooks/useServerHealth";
import { useInterviewData } from "./hooks/useInterviewData";
import { useInterviewSession } from "./hooks/useInterviewSession";

// Configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function App() {
  // 1. Hook: Manage Server Connection
  const { serverStatus, elapsedTime, setRetryTrigger } =
    useServerHealth(API_URL);

  // 2. Hook: Fetch Roles & Questions
  const { questionBank, availableRoles, defaultQuestion, defaultRole } =
    useInterviewData(API_URL, serverStatus);

  // 3. Local UI State (User Selections)
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [question, setQuestion] = useState("");
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const [answer, setAnswer] = useState("");

  // Sync Defaults when API loads
  useEffect(() => {
    if (defaultRole) setTargetRole(defaultRole);
    if (defaultQuestion) setQuestion(defaultQuestion);
  }, [defaultRole, defaultQuestion]);

  // 4. Hook: Manage Interview Session (Uploads, Analysis, Streams)
  const session = useInterviewSession(API_URL, serverStatus, targetRole);

  // Computed Logic for Button Disable
  const isValidateDisabled =
    !answer.trim() || !session.skillAnalysis || !question.trim();

  return (
    <div className="dashboard-container">
      {/* LEFT SIDEBAR */}
      <Sidebar
        logo={logo}
        polyTitle={polyTitle}
        serverStatus={serverStatus}
        setRetryTrigger={setRetryTrigger}
        elapsedTime={elapsedTime}
        targetRole={targetRole}
        setTargetRole={setTargetRole}
        availableRoles={availableRoles}
        resumeName={session.resumeName}
        isAnalyzingProfile={session.isAnalyzingProfile}
        skillAnalysis={session.skillAnalysis}
        skillStep={session.skillStep}
        traceLogs={session.traceLogs}
      />

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="container" style={{ maxWidth: "900px" }}>
          {/* CONDITION: Show Landing Screen if no resume */}
          {!session.resumeName ? (
            <LandingScreen
              logo={logo}
              targetRole={targetRole}
              serverStatus={serverStatus}
              uploading={session.uploading}
              handleFileUpload={session.handleFileUpload}
            />
          ) : (
            /* CONDITION: Show Main Interface if resume exists */
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
              // Wrapper to pass current question/answer to the hook
              handleAnalyzeStream={() =>
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
    </div>
  );
}
