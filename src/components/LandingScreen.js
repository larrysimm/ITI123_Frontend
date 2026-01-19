import React, { useState } from "react";

export default function LandingScreen({
  logo,
  targetRole,
  serverStatus,
  uploading,
  handleFileUpload,
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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
    <div className="d-flex flex-column align-items-center justify-content-center-start min-vh-100 py-5 text-center">
      <div className="mb-4">
        <img
          src={logo}
          alt="Logo"
          style={{ width: "300px", height: "auto", padding: "1rem 0" }}
        />
      </div>
      <p className="lead text-secondary mb-5">
        Master your {targetRole} interview with AI-driven precision.
      </p>

      {/* --- INSTRUCTIONS CARDS (Adjusted Width) --- */}
      {/* Changed w-100 to style={{ maxWidth: '900px', width: '100%' }} */}
      <div
        className="row mb-5 text-start g-3 justify-content-center"
        style={{ maxWidth: "900px", width: "100%" }}
      >
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

      {/* --- UPLOAD ZONE --- */}
      <div className="w-100" style={{ maxWidth: "600px" }}>
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-3 small shadow-sm animate__animated animate__shakeX">
            {errorMessage}
          </div>
        )}

        <div
          className={`position-relative p-5 rounded-4 transition-all text-center border-2 ${
            isDragging
              ? "bg-primary-subtle border-primary border-dashed shadow-lg"
              : "bg-light border-secondary border-dashed shadow-sm"
          }`}
          style={{
            transition: "all 0.2s ease-in-out",
            borderStyle: "dashed",
            cursor: serverStatus === "ready" ? "pointer" : "not-allowed",
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            disabled={serverStatus !== "ready" || uploading}
            onChange={onFileSelect}
            className="position-absolute w-100 h-100 start-0 top-0 opacity-0"
            style={{
              cursor: serverStatus === "ready" ? "pointer" : "not-allowed",
              zIndex: 10,
            }}
          />

          {uploading ? (
            <div className="py-4">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
              ></div>
              <h5 className="fw-bold text-primary">Analyzing Profile...</h5>
              <p className="text-muted small mb-0">
                Please wait while we process your resume.
              </p>
            </div>
          ) : (
            <div className="py-2" style={{ pointerEvents: "none" }}>
              <div
                className={`mb-3 ${
                  isDragging ? "animate__animated animate__bounce" : ""
                }`}
              >
                <i
                  className={`bi bi-cloud-arrow-up-fill fs-1 ${
                    isDragging ? "text-primary" : "text-secondary"
                  }`}
                ></i>
              </div>
              <h5 className="fw-bold mb-2">
                {isDragging
                  ? "Drop your resume here!"
                  : "Drag & Drop your resume here"}
              </h5>
              <p className="text-muted small mb-4">
                Supported format: PDF (Max 5MB)
              </p>
              <button
                className={`btn ${
                  isDragging ? "btn-primary" : "btn-outline-primary"
                } rounded-pill px-4 fw-bold`}
              >
                Or Browse Files
              </button>
            </div>
          )}
        </div>

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
