import React from "react";
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
}) {
  return (
    <div
      className="sidebar"
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* 2. STICKY HEADER */}
      <div
        className="sticky-top"
        style={{
          top: 0,
          zIndex: 100,
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        {/* Inner container to handle padding (keeps content aligned) */}
        <div className="p-4 pb-3">
          {/* A. Logo & Title */}
          {/* CHANGED: Reduced margin-bottom from mb-4 to mb-2 to close the gap */}
          <div className="mb-2 d-flex align-items-center gap-2">
            <img src={logo} alt="App Logo" style={{ height: "40px" }} />
            <img
              src={polyTitle}
              alt="Poly-2-Pro"
              style={{
                // CHANGED: Fixed sizing to prevent it from looking too big
                maxWidth: "160px",
                height: "auto",
                // Removed the negative margin since we are resizing correctly now
              }}
            />
          </div>

          {/* B. System Status */}
          <div className="mb-4">
            {serverStatus === "ready" ? (
              <div className="alert alert-success py-2 d-flex align-items-center small fw-bold mb-0">
                <span className="me-2">●</span> System Online
              </div>
            ) : serverStatus === "timeout" ? (
              <div className="alert alert-danger py-2 small mb-0">
                <div>Connection Failed</div>
                <button
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={() => setRetryTrigger((p) => p + 1)}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="alert alert-warning py-2 small mb-0">
                <div className="spinner-border spinner-border-sm me-2"></div>
                Waking up... ({elapsedTime}s)
              </div>
            )}
          </div>

          {/* C. Target Role Input */}
          <div className="mb-3">
            <label
              className="small fw-bold text-muted"
              style={{ fontSize: "11px" }}
            >
              TARGET ROLE
            </label>
            <select
              className="form-select shadow-sm"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={availableRoles.length === 0}
            >
              {availableRoles.length > 0 ? (
                availableRoles.map((role, index) => (
                  <option key={index} value={role}>
                    {role}
                  </option>
                ))
              ) : (
                <option>Loading roles...</option>
              )}
            </select>
          </div>

          {/* D. Resume Status (Moved UP here) */}
          <div>
            <label
              className="small fw-bold text-muted"
              style={{ fontSize: "11px" }}
            >
              RESUME STATUS
            </label>
            {resumeName ? (
              <div className="p-2 bg-white text-success rounded small border d-flex align-items-center justify-content-between shadow-sm animate__animated animate__fadeIn">
                <span className="text-truncate" style={{ maxWidth: "200px" }}>
                  <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                  {resumeName}
                </span>
                <i className="bi bi-check-circle-fill"></i>
              </div>
            ) : (
              <div className="p-2 bg-light text-muted rounded small border border-dashed">
                Waiting for upload...
              </div>
            )}
          </div>
        </div>
      </div>
      {/* --- END STICKY HEADER --- */}

      {/* 3. SCROLLABLE CONTENT */}
      <div className="p-4 pt-2 pb-5">
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
                {/* SHOW TRACE: During Analysis OR After Completion */}
                {(isAnalyzingProfile ||
                  (skillAnalysis && skillStep === 100)) && (
                  <div className="mb-3">
                    <SidebarTrace
                      currentStep={skillStep}
                      traceLogs={traceLogs}
                    />
                  </div>
                )}

                {/* Results Display */}
                {!isAnalyzingProfile &&
                  skillAnalysis &&
                  (() => {
                    // 1. DETECT CORRECT DATA KEYS (Handles snake_case or camelCase)
                    const matchedList =
                      skillAnalysis.matched ||
                      skillAnalysis.matched_skills ||
                      [];
                    const missingList =
                      skillAnalysis.missing ||
                      skillAnalysis.missing_skills ||
                      [];

                    return (
                      <>
                        <div className="mb-3 pb-2 border-bottom">
                          <small
                            className="text-secondary fst-italic"
                            style={{ fontSize: "0.75rem", lineHeight: "1.3" }}
                          >
                            Match for: <strong>{targetRole}</strong>
                          </small>
                        </div>

                        {/* 2. MATCHED SKILLS */}
                        {matchedList.length > 0 && (
                          <div className="mb-3">
                            <h6 className="small fw-bold text-success mb-2">
                              <i className="bi bi-check-circle-fill me-1"></i>{" "}
                              Verified Matches
                            </h6>
                            <ul className="list-unstyled mb-0 ps-1">
                              {matchedList.map((item, i) => {
                                const skillName =
                                  typeof item === "string" ? item : item.skill;
                                const reason =
                                  typeof item === "string" ? "" : item.reason;
                                const code = item.code || "";

                                return (
                                  <li
                                    key={i}
                                    className="text-dark small mb-2 border-bottom pb-1"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    <div className="d-flex justify-content-between align-items-center">
                                      <strong>{skillName}</strong>
                                      {code && (
                                        <span
                                          className="badge bg-light text-secondary border"
                                          style={{ fontSize: "0.65rem" }}
                                        >
                                          {code}
                                        </span>
                                      )}
                                    </div>
                                    {reason && (
                                      <div
                                        className="text-muted fst-italic mt-1"
                                        style={{
                                          fontSize: "0.75rem",
                                          lineHeight: "1.2",
                                        }}
                                      >
                                        {reason}
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* 3. MISSING SKILLS */}
                        {missingList.length > 0 && (
                          <div>
                            <h6 className="small fw-bold text-danger mb-2">
                              <i className="bi bi-exclamation-octagon-fill me-1"></i>{" "}
                              Critical Gaps
                            </h6>
                            <ul className="list-unstyled mb-0 ps-1">
                              {missingList.map((item, i) => {
                                const skillName =
                                  typeof item === "string" ? item : item.skill;
                                const gap =
                                  typeof item === "string" ? "" : item.gap;
                                const code = item.code || "";

                                return (
                                  <li
                                    key={i}
                                    className="text-dark small mb-2 border-bottom pb-1"
                                    style={{ fontSize: "0.8rem" }}
                                  >
                                    <div className="d-flex justify-content-between align-items-center">
                                      <strong>{skillName}</strong>
                                      {code && (
                                        <span
                                          className="badge bg-light text-secondary border"
                                          style={{ fontSize: "0.65rem" }}
                                        >
                                          {code}
                                        </span>
                                      )}
                                    </div>
                                    {gap && (
                                      <div
                                        className="text-danger mt-1"
                                        style={{
                                          fontSize: "0.75rem",
                                          lineHeight: "1.2",
                                        }}
                                      >
                                        {gap}
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* New Sidebar Footer */}
      <div className="mt-auto pt-4 pb-2 text-center border-top opacity-75">
        <small
          className="text-muted fst-italic"
          style={{ fontSize: "0.75rem" }}
        >
          <i className="bi bi-database-x me-1"></i>
          No personal data is saved to any database.
        </small>
      </div>
    </div>
  );
}
