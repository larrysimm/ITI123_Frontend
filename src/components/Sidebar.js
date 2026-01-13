import React from "react";
// If you have a SidebarTrace component, keep the import:
// import SidebarTrace from "../SidebarTrace";

export default function Sidebar({
  logo,
  polyTitle,
  serverStatus,
  setRetryTrigger,
  elapsedTime,
  targetRole,
  setTargetRole,
  availableRoles,
  resumeName,
  isAnalyzingProfile,
  skillAnalysis,
  skillStep,
  onMobileClose, // NEW PROP
}) {
  return (
    // REMOVED: style={{ height: "100vh" }} - The CSS class handles this now
    <div className="d-flex flex-column h-100 bg-white">
      {/* 1. HEADER */}
      <div className="p-4 pb-3 border-bottom">
        <div className="mb-2 d-flex align-items-center gap-2">
          <img src={logo} alt="App Logo" style={{ height: "35px" }} />
          {polyTitle && (
            <img src={polyTitle} alt="Title" style={{ height: "24px" }} />
          )}
        </div>

        {/* Status Indicator */}
        <div
          className={`badge rounded-pill ${
            serverStatus === "ready" ? "text-bg-success" : "text-bg-warning"
          } w-100 py-2`}
          style={{ cursor: serverStatus === "error" ? "pointer" : "default" }}
          onClick={serverStatus === "error" ? setRetryTrigger : undefined}
        >
          <i
            className={`bi ${
              serverStatus === "ready"
                ? "bi-check-circle-fill"
                : "bi-hdd-network"
            } me-2`}
          ></i>
          {serverStatus === "ready" ? "System Online" : serverStatus}
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-grow-1 overflow-auto p-3">
        {/* Role Selector */}
        <div className="mb-4">
          <label className="text-muted fw-bold small text-uppercase mb-2">
            Target Role
          </label>
          <select
            className="form-select border-0 bg-light fw-bold text-dark"
            value={targetRole}
            onChange={(e) => {
              setTargetRole(e.target.value);
              // Close menu on mobile when role is changed
              if (onMobileClose) onMobileClose();
            }}
            disabled={!!resumeName} // Lock role during session
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Content (Skill Analysis etc) */}
        {resumeName && (
          <div className="animate-fade-in">
            <div className="p-3 bg-light rounded border mb-3">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-person-badge-fill text-primary me-2"></i>
                <span
                  className="fw-bold small text-truncate"
                  style={{ maxWidth: "180px" }}
                >
                  {resumeName}
                </span>
              </div>
              {/* Progress / Steps */}
              {isAnalyzingProfile && (
                <div className="text-center py-2 text-muted small">
                  <div className="spinner-border spinner-border-sm mb-1"></div>
                  <div>Analyzing Resume...</div>
                </div>
              )}
            </div>

            {/* Add your Skill Gap list here if needed */}
            {/* Only show on Desktop to save space on mobile? Or show both. */}
          </div>
        )}
      </div>

      {/* 3. FOOTER */}
      <div className="mt-auto p-3 border-top text-center bg-light">
        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
          <i className="bi bi-shield-lock me-1"></i>
          Privacy First. No data stored.
        </small>
      </div>
    </div>
  );
}
