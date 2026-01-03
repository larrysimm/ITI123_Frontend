import React from "react";

export default function LandingScreen({
  logo,
  targetRole,
  serverStatus,
  uploading,
  handleFileUpload,
}) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
      <div className="mb-4">
        <img src={logo} alt="Logo" style={{ width: "300px", height: "auto" }} />
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
              Upload your PDF so the AI understands your unique background.
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
        <button
          className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow fw-bold"
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
          onChange={handleFileUpload}
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
              <strong>Privacy First:</strong> Your resume is processed in memory
              and{" "}
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
