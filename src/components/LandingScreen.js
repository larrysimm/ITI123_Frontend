import React, { useState } from "react";

export default function LandingScreen({
  logo,
  targetRole,
  serverStatus,

  // New props from the hook
  uploading,
  isVerified,
  isAnalyzingProfile,

  handleFileUpload,
  startProfileAnalysis, // <--- New Function
  resumeName, // <--- To show file name
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`⚠️ File is too large (${sizeInMB} MB). Max 5MB.`);
      return false;
    }
    return true;
  };

  const onFileSelect = (event) => {
    const file = event.target.files[0];
    setErrorMessage("");
    if (file) {
      if (!validateFile(file)) {
        event.target.value = "";
        return;
      }
      handleFileUpload(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && serverStatus === "ready" && !isVerified) {
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

    // Prevent drop if already verified or busy
    if (uploading || isVerified || serverStatus !== "ready") return;

    const file = e.dataTransfer.files[0];
    setErrorMessage("");

    if (file) {
      if (file.type !== "application/pdf") {
        setErrorMessage("⚠️ Only PDF files are supported.");
        return;
      }
      if (validateFile(file)) {
        const syntheticEvent = { target: { files: [file] } };
        handleFileUpload(syntheticEvent);
      }
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-start min-vh-100 pt-4 pb-4 text-center">
      <div className="mb-3">
        <img
          src={logo}
          alt="Logo"
          style={{ width: "300px", height: "auto", padding: "0.5rem 0" }}
        />
      </div>
      <p className="lead text-secondary mb-4">
        Master your {targetRole} interview with AI-driven precision.
      </p>

      {/* Instructions Row (Unchanged) */}
      <div
        className="row mb-4 text-start g-3 justify-content-center"
        style={{ maxWidth: "900px", width: "100%" }}
      >
        <div className="col-md-4">
          <div className="p-3 border rounded bg-white h-100 shadow-sm">
            <h6 className="fw-bold text-primary">
              <i className="bi bi-1-circle me-2"></i>Target Role
            </h6>
            <small className="text-muted">Select your desired job title.</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 border rounded bg-white h-100 shadow-sm">
            <h6 className="fw-bold text-primary">
              <i className="bi bi-2-circle me-2"></i>Upload Resume
            </h6>
            <small className="text-muted">
              Upload your PDF <strong>(Max 5MB)</strong>.
            </small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 border rounded bg-white h-100 shadow-sm">
            <h6 className="fw-bold text-primary">
              <i className="bi bi-3-circle me-2"></i>Analyze
            </h6>
            <small className="text-muted">
              Start AI analysis to find gaps.
            </small>
          </div>
        </div>
      </div>

      {/* --- DYNAMIC UPLOAD ZONE --- */}
      <div className="w-100" style={{ maxWidth: "600px" }}>
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-3 small shadow-sm animate__animated animate__shakeX">
            {errorMessage}
          </div>
        )}

        <div
          className={`position-relative p-4 rounded-4 transition-all text-center border-2 ${
            isDragging
              ? "bg-primary-subtle border-primary border-dashed shadow-lg"
              : isVerified
              ? "bg-success-subtle border-success border-solid shadow-sm" // Green border when verified
              : "bg-light border-secondary border-dashed shadow-sm"
          }`}
          style={{
            transition: "all 0.2s ease-in-out",
            borderStyle: isVerified ? "solid" : "dashed",
            // Only show pointer if we are waiting for upload
            cursor:
              !isVerified && serverStatus === "ready" ? "pointer" : "default",
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* CRITICAL FIX: 
             Only render the invisible <input> if we are NOT verified yet.
             This allows the "Start Analysis" button below to be clickable.
          */}
          {!isVerified && !uploading && !isAnalyzingProfile && (
            <input
              type="file"
              accept=".pdf"
              disabled={serverStatus !== "ready"}
              onChange={onFileSelect}
              className="position-absolute w-100 h-100 start-0 top-0 opacity-0"
              style={{
                cursor: serverStatus === "ready" ? "pointer" : "not-allowed",
                zIndex: 10,
              }}
            />
          )}

          {/* STATE 1: UPLOADING */}
          {uploading && (
            <div className="py-3">
              <div
                className="spinner-border text-primary mb-2"
                role="status"
              ></div>
              <h5 className="fw-bold text-primary">Uploading Resume...</h5>
              <p className="text-muted small mb-0">Verifying file format...</p>
            </div>
          )}

          {/* STATE 2: ANALYZING PROFILE (AI WORKING) */}
          {isAnalyzingProfile && (
            <div className="py-3">
              <div
                className="spinner-border text-success mb-2"
                role="status"
              ></div>
              <h5 className="fw-bold text-success">AI Analyzing Profile...</h5>
              <p className="text-muted small mb-0">
                Matching skills to {targetRole}...
              </p>
            </div>
          )}

          {/* STATE 3: VERIFIED (READY TO START) */}
          {isVerified && !isAnalyzingProfile && (
            <div className="py-3">
              <div className="mb-2 animate__animated animate__bounceIn">
                <i className="bi bi-check-circle-fill fs-1 text-success"></i>
              </div>
              <h5 className="fw-bold text-dark">{resumeName}</h5>
              <p className="text-success small mb-3">Resume Verified & Ready</p>

              {/* REAL BUTTON (Clickable because input is gone) */}
              <button
                onClick={startProfileAnalysis}
                className="btn btn-success rounded-pill px-5 fw-bold shadow-sm"
                style={{ zIndex: 20, position: "relative" }}
              >
                Start AI Analysis{" "}
                <i className="bi bi-rocket-takeoff-fill ms-2"></i>
              </button>
            </div>
          )}

          {/* STATE 4: DEFAULT (WAITING FOR UPLOAD) */}
          {!uploading && !isVerified && !isAnalyzingProfile && (
            <div className="py-1" style={{ pointerEvents: "none" }}>
              <div
                className={`mb-2 ${
                  isDragging ? "animate__animated animate__bounce" : ""
                }`}
              >
                <i
                  className={`bi bi-cloud-arrow-up-fill fs-2 ${
                    isDragging ? "text-primary" : "text-secondary"
                  }`}
                ></i>
              </div>
              <h5 className="fw-bold mb-1">
                {isDragging
                  ? "Drop your resume here!"
                  : "Drag & Drop your resume here"}
              </h5>
              <p className="text-muted small mb-3">
                Supported format: PDF (Max 5MB)
              </p>

              {/* Fake button for visuals */}
              <button
                className={`btn ${
                  isDragging ? "btn-primary" : "btn-outline-primary"
                } rounded-pill px-4 fw-bold btn-sm`}
              >
                Or Browse Files
              </button>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-3 text-center">
          <small
            className="text-muted d-flex align-items-center justify-content-center gap-2"
            style={{ fontSize: "0.85rem" }}
          >
            <i className="bi bi-shield-lock-fill text-success"></i>
            <span>
              <strong>Privacy First:</strong> Your resume is processed in memory
              and never stored.
            </span>
          </small>
        </div>

        {serverStatus !== "ready" && (
          <div className="mt-3 text-muted small">
            <span className="spinner-border spinner-border-sm me-2"></span>
            System initializing...
          </div>
        )}
      </div>
    </div>
  );
}
