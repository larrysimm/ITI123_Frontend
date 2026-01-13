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
                {/* 1. LOADING STATE */}
                {isAnalyzingProfile && (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
                    <p className="small text-muted mb-0">
                      AI is analyzing your resume...
                    </p>
                  </div>
                )}

                {/* 2. TRACE LOGS (Optional: Show if actively stepping through) */}
                {/* Only show if we have logs and are NOT done yet, OR if explicitly requested */}
                {isAnalyzingProfile && traceLogs && traceLogs.length > 0 && (
                  <div className="mb-3 border-bottom pb-3">
                    <SidebarTrace
                      currentStep={skillStep}
                      traceLogs={traceLogs}
                    />
                  </div>
                )}

                {/* 3. RESULTS DISPLAY */}
                {!isAnalyzingProfile &&
                  skillAnalysis &&
                  (() => {
                    // Normalize Data Keys
                    const matchedList =
                      skillAnalysis.matched ||
                      skillAnalysis.matched_skills ||
                      skillAnalysis.verified_skills ||
                      [];
                    const missingList =
                      skillAnalysis.missing ||
                      skillAnalysis.missing_skills ||
                      [];

                    // CHECK: Are both lists empty?
                    if (matchedList.length === 0 && missingList.length === 0) {
                      return (
                        <div className="text-center py-3">
                          <i className="bi bi-exclamation-circle text-muted fs-4"></i>
                          <p className="small text-muted mt-2">
                            No specific skill gaps found.
                            <br />
                            <span style={{ fontSize: "10px" }}>
                              (Debug: Received data, but lists are empty)
                            </span>
                          </p>
                          {/* DEBUG: Uncomment to see raw data if it's failing */}
                          {/* <pre className="text-start bg-light p-2 small">{JSON.stringify(skillAnalysis, null, 2)}</pre> */}
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="mb-3 pb-2 border-bottom">
                          <small
                            className="text-secondary fst-italic"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Match for: <strong>{targetRole}</strong>
                          </small>
                        </div>

                        {/* MATCHED SKILLS */}
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

                        {/* MISSING SKILLS */}
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
                      </>
                    );
                  })()}

                {/* 4. FALLBACK: If NOT analyzing but NO data exists */}
                {!isAnalyzingProfile && !skillAnalysis && (
                  <div className="text-center py-3 text-muted small">
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
