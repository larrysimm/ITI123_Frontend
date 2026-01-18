import React, { useState } from "react";

export default function LandingScreen({
  logo,
  targetRole,
  serverStatus,
  uploading,
  handleFileUpload,
}) {
  // 1. Local state for validation error messages
  const [errorMessage, setErrorMessage] = useState("");

  // 2. Validation wrapper
  const validateAndUpload = (event) => {
    const file = event.target.files[0];

    // Reset error on new attempt
    setErrorMessage("");

    if (file) {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes

      if (file.size > MAX_SIZE) {
        // Calculate size for display
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

        setErrorMessage(
          `⚠️ File is too large (${sizeInMB} MB). Please upload a file smaller than 5MB.`
        );

        // Clear the input so they can try again
        event.target.value = "";
        return;
      }
    }

    // If valid, pass to the parent handler
    handleFileUpload(event);
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
              {/* 3a. Passive Reminder in the card */}
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
      <div className="position-relative">
        {/* 3b. Active Error Message Alert */}
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-3 small shadow-sm animate__animated animate__shakeX">
            {errorMessage}
          </div>
        )}

        <button
          className={`btn btn-lg px-5 py-3 rounded-pill shadow fw-bold ${
            errorMessage ? "btn-outline-danger" : "btn-primary"
          }`}
          disabled={serverStatus !== "ready" || uploading}
        >
          {uploading ? (
            <span>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Analyzing Profile...
            </span>
          ) : (
            <span>
              <i className="bi bi-cloud-upload me-2"></i> Upload Resume to Start
            </span>
          )}
        </button>

        <input
          type="file"
          accept=".pdf"
          disabled={serverStatus !== "ready" || uploading}
          // Change this to use the validation wrapper
          onChange={validateAndUpload}
          className="position-absolute w-100 h-100 start-0 top-0 opacity-0"
          style={{ cursor: "pointer" }}
        />

        {/* Privacy Note / Trust Badge */}
        <div className="mt-3 text-center bg-light p-2 rounded border border-light-subtle">
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
