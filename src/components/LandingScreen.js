import React, { useState } from "react";

export default function LandingScreen({
  logo,
  targetRole,
  serverStatus,
  uploading,
  handleFileUpload,
}) {
  const [errorMessage, setErrorMessage] = useState("");
  // 1. New state for drag visual feedback
  const [isDragging, setIsDragging] = useState(false);

  // 2. Helper function to check file validity (reused by both input and drop)
  const validateFile = (file) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `⚠️ File is too large (${sizeInMB} MB). Please upload a file smaller than 5MB.`
      );
      return false;
    }
    return true;
  };

  // 3. Handler for standard file input click
  const onFileSelect = (event) => {
    const file = event.target.files[0];
    setErrorMessage("");

    if (file) {
      if (!validateFile(file)) {
        event.target.value = ""; // Clear input on error
        return;
      }
      // Pass valid event to parent
      handleFileUpload(event);
    }
  };

  // 4. Handlers for Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && serverStatus === "ready") {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading || serverStatus !== "ready") return;

    const file = e.dataTransfer.files[0];
    setErrorMessage("");

    if (file) {
      // Ensure it is a PDF
      if (file.type !== "application/pdf") {
        setErrorMessage("⚠️ Only PDF files are supported.");
        return;
      }

      if (validateFile(file)) {
        // Create a synthetic event object to match what the parent expects
        const syntheticEvent = {
          target: {
            files: [file],
          },
        };
        handleFileUpload(syntheticEvent);
      }
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center-start min-vh-100 py-5 text-center">
      <div className="mb-4">
        <img
          src={logo}
          alt="Logo"
          style={{
            width: "300px",
            height: "auto",
            paddingTop: "1rem",
            paddingBottom: "1rem",
          }}
        />
      </div>
      <p className="lead text-secondary mb-5">
        Master your {targetRole} interview with AI-driven precision.
      </p>

      {/* INSTRUCTIONS CARDS */}
      <div className="row w-100 mb-5 text-start g-3 justify-content-center">
        {/* ... (Existing instruction cards remain unchanged) ... */}
        <div className="col-md-4">
          <div className="p-3 border rounded bg-white h-100 shadow-sm">
            <h6 className="fw-bold text-primary">
              <i className="bi bi-1-circle me-2"></i>Target Role
            </h6>
            <small className="text-muted">
              Select your desired job title to align questions with industry
              standards.
            </small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 border rounded bg-white h-100 shadow-sm">
            <h6 className="fw-bold text-primary">
              <i className="bi bi-2-circle me-2"></i>Upload Resume
            </h6>
            <small className="text-muted">
              Upload your PDF <strong>(Max 5MB)</strong> so the AI understands
              your unique background.
            </small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 border rounded bg-white h-100 shadow-sm">
            <h6 className="fw-bold text-primary">
              <i className="bi bi-3-circle me-2"></i>Validate
            </h6>
            <small className="text-muted">
              Answer situational questions and get instant gap analysis &
              coaching.
            </small>
          </div>
        </div>
      </div>

      {/* UPLOAD ACTION */}
      {/* 5. Attach Drop Handlers to the container */}
      <div
        className={`position-relative p-4 rounded-3 transition-all ${
          isDragging
            ? "bg-light border border-primary border-2 border-dashed shadow-sm"
            : ""
        }`}
        style={{ transition: "all 0.2s ease-in-out" }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-3 small shadow-sm animate__animated animate__shakeX">
            {errorMessage}
          </div>
        )}

        <button
          className={`btn btn-lg px-5 py-3 rounded-pill shadow fw-bold ${
            errorMessage ? "btn-outline-danger" : "btn-primary"
          } ${isDragging ? "scale-105" : ""}`}
          disabled={serverStatus !== "ready" || uploading}
          style={{ pointerEvents: "none" }} // Let clicks pass through to the input
        >
          {uploading ? (
            <span>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Analyzing Profile...
            </span>
          ) : (
            <span>
              <i className="bi bi-cloud-upload me-2"></i>
              {/* Change text based on drag state */}
              {isDragging ? "Drop PDF Here" : "Upload Resume to Start"}
            </span>
          )}
        </button>

        <input
          type="file"
          accept=".pdf"
          disabled={serverStatus !== "ready" || uploading}
          onChange={onFileSelect}
          className="position-absolute w-100 h-100 start-0 top-0 opacity-0"
          style={{ cursor: "pointer" }}
        />

        {/* Privacy Note */}
        <div className="mt-3 text-center p-2 rounded">
          <small
            className="text-muted d-flex align-items-center justify-content-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <i className="bi bi-shield-lock-fill text-success fs-5"></i>
            <span>
              <strong>Privacy First:</strong> Your resume is PII-redacted,
              processed in memory and{" "}
              <span className="text-decoration-underline">never stored</span>.
            </span>
          </small>
        </div>
      </div>

      {serverStatus !== "ready" && (
        <div className="mt-3 text-muted small">
          <span className="spinner-border spinner-border-sm me-2"></span>
          System initializing...
        </div>
      )}
    </div>
  );
}
