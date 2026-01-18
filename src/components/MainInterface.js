import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import ThinkingTrace from "../ThinkingTrace";
import CollapsibleCard from "./CollapsibleCard";
import VoiceRecorder from "./VoiceRecorder";

export default function MainInterface({
  logo,
  targetRole,
  apiUrl,
  setResumeName,
  setResumeText,
  question,
  setQuestion,
  isCustomQuestion,
  setIsCustomQuestion,
  questionBank,
  answer,
  setAnswer,
  handleAnalyzeStream,
  isValidateDisabled,
  loading,
  skillAnalysis,
  result,
  currentStep,
  handleResetPractice,
}) {
  const dropdownRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const renderWithManualBold = (text) => {
    // Split the string whenever we see **something**
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} style={{ fontWeight: "800", color: "black" }}>
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const formatStarResponse = (text) => {
    if (!text) return null;

    let cleanText = text
      .replace(/\*\*Situation:?\*\*/g, "Situation:")
      .replace(/\*\*Task:?\*\*/g, "Task:")
      .replace(/\*\*Action:?\*\*/g, "Action:")
      .replace(/\*\*Result:?\*\*/g, "Result:")
      .replace(/\*\*Situation\*\*:?/g, "Situation:")
      .replace(/\*\*Task\*\*:?/g, "Task:")
      .replace(/\*\*Action\*\*:?/g, "Action:")
      .replace(/\*\*Result\*\*:?/g, "Result:");

    return cleanText
      .split(/(Situation:|Task:|Action:|Result:)/g)
      .map((part, index) => {
        const trimmed = part.trim();
        if (["Situation:", "Task:", "Action:", "Result:"].includes(trimmed)) {
          return (
            <div
              key={index}
              className="fw-bold text-success mt-3 mb-1 text-uppercase"
              style={{ letterSpacing: "0.5px" }}
            >
              {trimmed}
            </div>
          );
        }
        if (!trimmed) return null;
        return (
          <div
            key={index}
            className="mb-2 text-dark"
            style={{ lineHeight: "1.6" }}
          >
            {renderWithManualBold(part)}
          </div>
        );
      });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      // If the dropdown is open AND the click is NOT inside the dropdown container
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on cleanup
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="container-fluid py-2" style={{ maxWidth: "1000px" }}>
      {/* --- HEADER SECTION --- */}
      <div className="text-center mb-5">
        <img
          src={logo}
          alt="Logo"
          style={{ height: "60px", marginBottom: "15px" }}
        />
        <h2 className="fw-bold text-dark mb-1">
          Cognitive-Intelligent STAR Answer Builder
        </h2>
        <span className="d-block text-muted small mt-2">
          Build hire-ready STAR responses through structured reasoning and
          feedback
        </span>
        <span className="badge bg-primary-subtle text-primary fs-6 px-3 py-4 rounded-pill">
          Target Role: {targetRole}
        </span>
        <div className="mt-3">
          <button
            onClick={() => {
              if (
                window.confirm("Change Resume? This will reset your session.")
              ) {
                setResumeName("");
                setResumeText("");
              }
            }}
            className="btn btn-sm btn-link text-muted text-decoration-none"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Switch Resume
          </button>
        </div>
      </div>

      <div className="row g-5">
        {/* ========================== */}
        {/* STEP 1: THE CHALLENGE      */}
        {/* ========================== */}
        <div className="col-12">
          <h4 className="fw-bold text-secondary mb-3">
            <i className="bi bi-1-circle-fill text-primary me-2"></i>
            The Challenge
          </h4>

          <div className="card border-0 shadow-sm bg-light">
            <div className="card-body p-4">
              <label className="form-label text-muted fw-bold text-uppercase small mb-3">
                Current Question
              </label>

              <div className="d-flex align-items-start">
                <i className="bi bi-chat-quote-fill text-primary fs-3 me-3 opacity-50 mt-1"></i>
                <div className="w-100 position-relative" ref={dropdownRef}>
                  {isCustomQuestion ? (
                    <div className="d-flex gap-2 align-items-center">
                      {/* Input Wrapper for the "Clear" button positioning */}
                      <div className="position-relative w-100">
                        <input
                          type="text"
                          className="form-control form-control-lg border-0 bg-white shadow-sm fw-bold text-dark pe-5" // pe-5 adds padding for the X
                          style={{ fontSize: "1.2rem" }}
                          value={question}
                          autoFocus
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="Type your own custom question here..."
                        />

                        {/* ❌ Clear Text Button (Only shows when typing) */}
                        {question.length > 0 && (
                          <button
                            onClick={() => setQuestion("")}
                            className="btn btn-sm text-muted position-absolute top-50 end-0 translate-middle-y me-2"
                            style={{
                              zIndex: 5,
                              background: "transparent",
                              border: "none",
                            }}
                            title="Clear text"
                          >
                            <i className="bi bi-x-circle-fill fs-5"></i>
                          </button>
                        )}
                      </div>

                      {/* 🔙 Navigation Button */}
                      <button
                        className="btn btn-outline-secondary text-nowrap px-3 shadow-sm bg-white"
                        onClick={() => setIsCustomQuestion(false)}
                        title="Return to Question Bank"
                      >
                        <i className="bi bi-arrow-left me-2"></i> Back to List
                      </button>
                    </div>
                  ) : (
                    // --- DROPDOWN LOGIC (UNCHANGED) ---
                    <>
                      <div
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-2 rounded d-flex justify-content-between align-items-center"
                        style={{
                          cursor: "pointer",
                          border: showDropdown
                            ? "1px solid #dee2e6"
                            : "1px solid transparent",
                          backgroundColor: showDropdown
                            ? "white"
                            : "transparent",
                        }}
                      >
                        <h3
                          className="fw-bold text-dark mb-0 me-3"
                          style={{ fontSize: "1.3rem", lineHeight: "1.4" }}
                        >
                          {question || "Select a question to begin..."}
                        </h3>
                        <i
                          className={`bi bi-chevron-${
                            showDropdown ? "up" : "down"
                          } text-muted`}
                        ></i>
                      </div>

                      {showDropdown && (
                        <div
                          className="card border-0 shadow-lg position-absolute w-100 mt-2"
                          style={{
                            zIndex: 1000,
                            maxHeight: "400px",
                            overflowY: "auto",
                          }}
                        >
                          <ul className="list-group list-group-flush">
                            {questionBank.map((q) => (
                              <button
                                key={q.id}
                                className="list-group-item list-group-item-action py-3 text-start"
                                onClick={() => {
                                  setQuestion(q.text);
                                  setShowDropdown(false);
                                }}
                              >
                                {q.text}
                              </button>
                            ))}
                            <button
                              className="list-group-item list-group-item-action py-3 text-primary fw-bold text-start"
                              onClick={() => {
                                setIsCustomQuestion(true);
                                setQuestion("");
                                setShowDropdown(false);
                              }}
                            >
                              ✎ Write my own question...
                            </button>
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================== */}
        {/* STEP 2: YOUR SOLUTION      */}
        {/* ========================== */}
        <div className="col-12">
          <h4 className="fw-bold text-secondary mb-3">
            <i className="bi bi-2-circle-fill text-primary me-2"></i>
            Your Solution
          </h4>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div style={{ position: "relative" }}>
                <textarea
                  className="form-control border-0 p-4"
                  rows="8"
                  // 2. Logic: Disable ONLY if recording or analyzing
                  disabled={!question || loading || isRecording}
                  placeholder={
                    !question
                      ? "Please select or type a question above to start..."
                      : isRecording
                      ? "Listening..."
                      : "Start speaking or type your answer here..."
                  }
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: "1.6",
                    resize: "none",
                    borderRadius: "10px 10px 0 0",
                    color: "#333",
                    backgroundColor:
                      isRecording || !question ? "#f0f2f5" : "#fff",
                  }}
                ></textarea>

                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                    zIndex: 10,
                    opacity: !question ? 0.5 : 1,
                    pointerEvents: !question ? "none" : "auto",
                    cursor: !question ? "not-allowed" : "pointer",
                  }}
                >
                  <VoiceRecorder
                    apiUrl={apiUrl}
                    // 3. Update 'isRecording' state
                    onRecordingStart={() => {
                      setAnswer("");
                      setIsRecording(true); // Lock the text box
                    }}
                    onTranscriptionComplete={(text) => {
                      setIsRecording(false); // Unlock the text box
                      setAnswer(text); // Update text
                      handleAnalyzeStream(text); // 🚀 Auto-submit!
                    }}
                  />
                </div>
              </div>

              {/* ACTION BAR: Show "Validate" button for manual typists */}
              <div className="bg-light p-3 rounded-bottom d-flex align-items-center justify-content-between border-top">
                <button
                  className="btn btn-link text-muted text-decoration-none btn-sm"
                  onClick={() => {
                    if (window.confirm("Clear your answer?")) setAnswer("");
                  }}
                  disabled={!answer.trim() || loading || isRecording}
                >
                  <i className="bi bi-trash me-1"></i> Clear
                </button>

                <div className="d-flex align-items-center gap-3">
                  <div className="text-muted small">
                    {isRecording ? (
                      <span className="text-danger fw-bold animate__animated animate__flash animate__infinite">
                        ● Recording...
                      </span>
                    ) : answer.trim().length > 0 ? (
                      `${answer.trim().split(/\s+/).length} words`
                    ) : (
                      ""
                    )}
                  </div>

                  <button
                    className="btn btn-primary px-4 py-2 rounded-pill shadow-sm fw-bold"
                    onClick={() => handleAnalyzeStream(null)} // Manual click passes null, so App.js uses 'answer' state
                    disabled={isValidateDisabled || loading || isRecording}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Validate Answer{" "}
                        <i className="bi bi-arrow-right ms-2"></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================== */}
        {/* STEP 3: FEEDBACK / RESULTS */}
        {/* ========================== */}

        {/* SHOW TRACE: While loading OR if we have a finished trace */}
        {(loading || result?.manager_thinking) && (
          <div className="col-12 mt-4">
            <ThinkingTrace
              currentStep={loading ? currentStep : 100}
              managerThinking={result?.manager_thinking}
              coachThinking={result?.coach_thinking}
            />
          </div>
        )}

        {/* FINAL RESULTS */}
        {result && !loading && (
          <div className="col-12 animate__animated animate__fadeInUp">
            <div className="d-flex align-items-center mb-4 mt-5">
              <div className="flex-grow-1 border-bottom"></div>
              <h3 className="mx-3 text-center fw-bold text-success">
                <i className="bi bi-stars me-2"></i> Analysis Results
              </h3>
              <div className="flex-grow-1 border-bottom"></div>
            </div>

            <div className="row g-4 pb-5">
              {/* 1. Manager's Gaps (Red) */}
              <div className="col-12">
                <CollapsibleCard
                  title="Manager's Gaps"
                  icon="bi-exclamation-octagon-fill"
                  bgClass="bg-danger-subtle"
                  textClass="text-danger-emphasis"
                  borderClass="border-danger-subtle"
                  defaultOpen={true}
                >
                  <div className="markdown-body text-secondary">
                    <ReactMarkdown>{result.manager_critique}</ReactMarkdown>
                  </div>
                </CollapsibleCard>
              </div>

              {/* 2. Structure Critique (Yellow) */}
              <div className="col-12">
                <CollapsibleCard
                  title="Structure Critique"
                  icon="bi-lightbulb-fill"
                  bgClass="bg-warning-subtle"
                  textClass="text-warning-emphasis"
                  borderClass="border-warning-subtle"
                  defaultOpen={true}
                >
                  <div className="markdown-body text-secondary">
                    <ReactMarkdown>{result.coach_critique}</ReactMarkdown>
                  </div>
                </CollapsibleCard>
              </div>

              {/* 3. Architected Response (Green) */}
              <div className="col-12">
                <CollapsibleCard
                  title="Architected Response"
                  icon="bi-patch-check-fill"
                  bgClass="bg-success-subtle"
                  textClass="text-success-emphasis"
                  borderClass="border-success-subtle"
                  defaultOpen={true}
                >
                  <div
                    className="card-text text-dark"
                    style={{ lineHeight: "1.7", fontSize: "1.05rem" }}
                  >
                    {formatStarResponse(result.rewritten_answer)}
                  </div>
                </CollapsibleCard>
              </div>

              <div className="text-center mt-4">
                <button
                  className="btn btn-outline-primary btn-lg px-5 shadow-sm rounded-pill"
                  onClick={handleResetPractice}
                >
                  <i className="bi bi-arrow-repeat me-2"></i> Practice Another
                  Question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
