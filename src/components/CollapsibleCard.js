import React, { useState } from "react";

export default function CollapsibleCard({
  title,
  icon,
  bgClass,
  textClass,
  borderClass,
  children,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`card card-modern h-100 ${borderClass} mb-4`}>
      {/* Header - Clickable */}
      <div
        className={`card-header ${bgClass} border-0 py-3 d-flex align-items-center justify-content-between`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer" }}
      >
        <div className="d-flex align-items-center">
          <i className={`bi ${icon} ${textClass} fs-5 me-3`}></i>
          <h6 className={`mb-0 fw-bold ${textClass}`}>{title}</h6>
        </div>

        {/* Chevron Icon */}
        <i
          className={`bi bi-chevron-down ${textClass} transition-transform`}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
          }}
        ></i>
      </div>

      {/* Body - Toggles Visibility */}
      {isOpen && (
        <div className="card-body p-4 bg-white fade-in">{children}</div>
      )}
    </div>
  );
}
