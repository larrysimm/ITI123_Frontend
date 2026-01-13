import React from "react";
// FIX 1: Import from the same folder (./) is the standard for components
import SidebarTrace from "../SidebarTrace";

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
  traceLogs,
  onMobileClose,
}) {
  return (
    <div className="d-flex flex-column h-100 bg-white">
      {/* 1. HEADER & SERVER STATUS */}
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

        {/* Server Timer */}
        {serverStatus !== "ready" && (
          <div className="mt-2 text-center">
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
              {elapsedTime > 0
                ? `Waking up server... (${elapsedTime}s)`
                : "Connecting..."}
            </small>
            <div className="progress mt-1" style={{ height: "4px" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                role="progressbar"
                style={{
                  width: `${Math.min((elapsedTime / 100) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-grow-1 overflow-auto p-4 pt-2 pb-5">
        {/* Role Selector */}
        <div className="mb-4 mt-3">
          <label className="text-muted fw-bold small text-uppercase mb-2">
            Target Role
          </label>
          <select
            className="form-select border-0 bg-light fw-bold text-dark"
            value={targetRole}
            onChange={(e) => {
              setTargetRole(e.target.value);
              if (onMobileClose) onMobileClose();
            }}
            disabled={!!resumeName}
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Skill Gap Analysis Section */}
        {resumeName && (
          <div className="animate__animated animate__fadeIn">
            <label
              className="small fw-bold text-muted mb-2"
              style={{ fontSize: "11px" }}
            >
              SKILL GAP ANALYSIS
            </label>

            <div className="card bg-white border shadow-sm">
              <div className="card-body p-3">
                {/* FIX 2: SidebarTrace is always visible (it handles its own 'Complete' state) 
                    This ensures you see 'Analysis Complete' even after loading stops. */}
                {SidebarTrace ? (
                  <SidebarTrace
                    currentStep={skillStep}
                    traceLogs={traceLogs || {}}
                  />
                ) : (
                  <div className="alert alert-danger p-1 small">
                    Trace Component Missing
                  </div>
                )}

                {/* RESULTS DISPLAY */}
                {/* Only show results if NOT analyzing OR if we have data ready */}
                {(!isAnalyzingProfile || skillAnalysis) &&
                  skillAnalysis &&
                  (() => {
                    // Extract Lists safely
                    const matchedList =
                      skillAnalysis.matched ||
                      skillAnalysis.matched_skills ||
                      skillAnalysis.verified_skills ||
                      [];
                    const missingList =
                      skillAnalysis.missing ||
                      skillAnalysis.missing_skills ||
                      [];

                    if (matchedList.length === 0 && missingList.length === 0) {
                      return (
                        <div className="text-center py-3 border-top mt-3">
                          <i className="bi bi-exclamation-circle text-muted fs-4"></i>
                          <p className="small text-muted mt-2">
                            No specific skill gaps found.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-3 pt-3 border-top animate__animated animate__fadeIn">
                        <div className="mb-3 pb-2 border-bottom">
                          <small
                            className="text-secondary fst-italic"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Match for: <strong>{targetRole}</strong>
                          </small>
                        </div>

                        {/* Verified Matches */}
                        {matchedList.length > 0 && (
                          <div className="mb-3">
                            <h6 className="small fw-bold text-success mb-2">
                              <i className="bi bi-check-circle-fill me-1"></i>{" "}
                              Verified Matches
                            </h6>
                            <ul className="list-unstyled mb-0 ps-1">
                              {matchedList.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-dark small mb-2 border-bottom pb-1"
                                >
                                  <strong>
                                    {typeof item === "string"
                                      ? item
                                      : item.skill}
                                  </strong>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Critical Gaps */}
                        {missingList.length > 0 && (
                          <div>
                            <h6 className="small fw-bold text-danger mb-2">
                              <i className="bi bi-exclamation-octagon-fill me-1"></i>{" "}
                              Critical Gaps
                            </h6>
                            <ul className="list-unstyled mb-0 ps-1">
                              {missingList.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-dark small mb-2 border-bottom pb-1"
                                >
                                  <strong>
                                    {typeof item === "string"
                                      ? item
                                      : item.skill}
                                  </strong>
                                  {item.gap && (
                                    <div
                                      className="text-danger mt-1"
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      {item.gap}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Fallback */}
                {!isAnalyzingProfile && !skillAnalysis && (
                  <div className="text-center py-3 text-muted small border-top mt-3">
                    No analysis data available.
                  </div>
                )}
              </div>
            </div>
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
