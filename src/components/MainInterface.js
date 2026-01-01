import React from "react";
import ReactMarkdown from "react-markdown";
import ThinkingTrace from "../ThinkingTrace";
import CollapsibleCard from "./CollapsibleCard";

export default function MainInterface({
  logo,
  targetRole,
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
  const renderWithManualBold = (text) => {
    // Split the string whenever we see **something**
    // The regex captures the text inside the asterisks
    const parts = text.split(/\*\*(.*?)\*\*/g);

    return parts.map((part, index) => {
      // Odd indices (1, 3, 5...) are the text that was inside ** **
      if (index % 2 === 1) {
        return (
          <span key={index} style={{ fontWeight: "800", color: "black" }}>
            {part}
          </span>
        );
      }
      // Even indices are normal text
      return <span key={index}>{part}</span>;
    });
  };

  const formatStarResponse = (text) => {
    if (!text) return null;

    // 1. CLEANUP: Remove asterisks specifically from the headers
    // Transforms "**Situation:**" -> "Situation:"
    let cleanText = text
      .replace(/\*\*Situation:?\*\*/g, "Situation:")
      .replace(/\*\*Task:?\*\*/g, "Task:")
      .replace(/\*\*Action:?\*\*/g, "Action:")
      .replace(/\*\*Result:?\*\*/g, "Result:")
      // Also catch cases where AI forgets the colon inside the bold
      .replace(/\*\*Situation\*\*:?/g, "Situation:")
      .replace(/\*\*Task\*\*:?/g, "Task:")
      .replace(/\*\*Action\*\*:?/g, "Action:")
      .replace(/\*\*Result\*\*:?/g, "Result:");

    // 2. SPLIT & RENDER
    return cleanText
      .split(/(Situation:|Task:|Action:|Result:)/g)
      .map((part, index) => {
        const trimmed = part.trim();

        // A. Header (Green & Bold)
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

        // B. Empty strings
        if (!trimmed) return null;

        // C. Body Text (with manual bold support)
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

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          {/* Logo with margin-end (me-3) for spacing */}
          <img
            src={logo}
            alt="App Logo"
            style={{ height: "72px" }}
            className="me-3"
          />

          {/* Text Wrapper: Keeps Title and Subtitle stacked vertically */}
          <div>
            <h1 className="display-6 fw-bold text-dark m-0">
              Interview Architect
            </h1>
            <small className="text-muted">
              Optimizing answers for <strong>{targetRole}</strong>
            </small>
          </div>
        </div>
        <button
          onClick={() => {
            setResumeName("");
            setResumeText("");
          }}
          className="btn btn-sm btn-outline-secondary"
        >
          <i className="bi bi-arrow-counterclockwise me-1"></i> Change Resume
        </button>
      </div>

      {/* Question Selection */}
      <div className="mb-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-2">
            {!isCustomQuestion ? (
              <select
                className="form-select border-0 fw-bold text-secondary"
                style={{ fontSize: "1.1rem" }}
                value={question}
                onChange={(e) => {
                  if (e.target.value === "CUSTOM_MODE") {
                    setIsCustomQuestion(true);
                    setQuestion("");
                  } else {
                    setQuestion(e.target.value);
                  }
                }}
              >
                {questionBank.map((q, index) => (
                  <option key={q.id} value={q.text}>
                    {index + 1}. {q.text}
                  </option>
                ))}

                <option disabled>──────────────────────────</option>
                <option value="CUSTOM_MODE">✎ Type a custom question...</option>
              </select>
            ) : (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-light border text-muted"
                  onClick={() => {
                    setIsCustomQuestion(false);
                    if (questionBank.length > 0)
                      setQuestion(questionBank[0].text);
                  }}
                >
                  <i className="bi bi-arrow-left"></i>
                </button>
                <input
                  className="form-control border-0 fw-bold text-secondary"
                  placeholder="Type your question..."
                  value={question}
                  autoFocus
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer Area */}
      <div className="mb-4">
        <textarea
          className="form-control p-4 shadow-sm"
          rows="6"
          placeholder={`Type your answer here...`}
          style={{ resize: "none", borderRadius: "12px" }}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        ></textarea>

        <div className="d-flex justify-content-between align-items-center mt-3">
          {/* 1. Clear / Reset Button */}
          <button
            className="btn btn-link text-muted text-decoration-none btn-sm"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to clear your answer?")
              ) {
                setAnswer("");
              }
            }}
            disabled={!answer.trim() || loading} // Disable if empty
          >
            <i className="bi bi-trash me-1"></i> Clear
          </button>
          <button
            onClick={handleAnalyzeStream}
            // 1. DISABLE ATTRIBUTE
            disabled={isValidateDisabled || loading}
            // 2. VISUAL FEEDBACK (Bootstrap classes)
            className={`btn w-100 py-3 fw-bold shadow-sm transition-all ${
              isValidateDisabled
                ? "btn-secondary opacity-50 cursor-not-allowed"
                : "btn-primary"
            }`}
            style={{ borderRadius: "12px" }}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Analyzing Response...
              </>
            ) : (
              <>
                <i className="bi bi-patch-check-fill me-2"></i>
                Validate Answer
              </>
            )}
          </button>
          {isValidateDisabled && !loading && (
            <div className="text-center mt-2">
              <small className="text-muted fst-italic">
                {!skillAnalysis
                  ? "* Please wait for the Skill Gap Analysis first."
                  : !question.trim()
                  ? "* Please enter a question."
                  : "* Please type an answer to validate."}
              </small>
            </div>
          )}
        </div>
      </div>

      {/* SHOW TRACE: While loading OR if we have a finished trace */}
      {(loading || result?.manager_thinking) && (
        <ThinkingTrace
          // If loading is done, force step to 100 so all items show as "Checked/Completed"
          currentStep={loading ? currentStep : 100}
          managerThinking={result?.manager_thinking}
          coachThinking={result?.coach_thinking}
        />
      )}

      {result && !loading && (
        <div className="row g-4 pb-5">
          {/* 1. Manager's Gaps (Red/Danger Theme) */}
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

          {/* 2. Structure Critique (Yellow/Warning Theme) */}
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

          {/* 3. Architected Response (Green/Success Theme) */}
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
          <div className="text-center mt-5 mb-5 pb-5">
            <button
              className="btn btn-outline-primary btn-lg px-5 shadow-sm rounded-pill"
              onClick={handleResetPractice}
            >
              <i className="bi bi-arrow-repeat me-2"></i> Practice Another
              Question
            </button>
          </div>
        </div>
      )}
    </>
  );
}
