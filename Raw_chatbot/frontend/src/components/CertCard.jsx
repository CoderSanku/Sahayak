// src/components/CertCard.jsx
// Backend /chat response.data structure:
//   certificate: { certificate_id, certificate_name (string), issuing_authority (string) }
//   documents:   { mandatory: [string,...], required: [string,...], optional: [string,...] }
//   suggestions: [string,...]
// sample (top-level in response):
//   { found, sample_pdf_url, disclaimer, language_notice }

import { useState } from "react";
import { pdfUrl } from "../api";
import DocTracker from "./DocTracker";

export default function CertCard({ data, sample, onViewPdf, onBack, lang }) {
  const [trackerOpen, setTrackerOpen] = useState(false);

  const cert = data?.certificate;
  const docs = data?.documents || {};
  const suggestions = data?.suggestions || [];

  // Backend returns already-localized plain string arrays
  const mandatory = docs.mandatory || [];
  const required  = docs.required  || [];
  const optional  = docs.optional  || [];

  if (!cert) return null;

  const certName  = cert.certificate_name  || "";
  const authority = cert.issuing_authority || "";

  return (
    <>
      <div className="cert-card">
        <div className="cert-card-title">📜 {certName}</div>

        {mandatory.length > 0 && (
          <div className="doc-section">
            <div className="doc-label mandatory">🔴 Mandatory Documents</div>
            <ul className="doc-list mandatory">
              {mandatory.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}

        {required.length > 0 && (
          <div className="doc-section">
            <div className="doc-label required">🔵 Required Documents</div>
            <ul className="doc-list required">
              {required.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}

        {optional.length > 0 && (
          <div className="doc-section">
            <div className="doc-label optional">🟢 Optional Documents</div>
            <ul className="doc-list optional">
              {optional.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}

        {mandatory.length === 0 && required.length === 0 && optional.length === 0 && (
          <div style={{ color: "#6B7280", fontSize: 13, marginBottom: 8 }}>
            ✅ All documents accounted for.
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="suggestions-box">
            {suggestions.map((s, i) => <div key={i}>💡 {s}</div>)}
          </div>
        )}

        <div className="cert-footer">
          <span className="authority-badge">🏛 {authority}</span>
          {sample?.found && sample?.sample_pdf_url && (
            <button className="pdf-btn" onClick={() => onViewPdf(pdfUrl(sample.sample_pdf_url))}>
              📄 View Sample PDF
            </button>
          )}
        </div>

        {/* ── CHECK DOCUMENTS BUTTON ── */}
        <button
          onClick={() => setTrackerOpen(true)}
          className="doc-btn"
          style={{
            marginTop: 12, width: "100%",
            padding: "10px 16px",
            fontSize: 13, justifyContent: "center",
          }}
        >
          📋 Check Documents & Apply
        </button>

        {sample?.language_notice && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#0048A8", fontStyle: "italic" }}>
            ℹ️ {typeof sample.language_notice === "object"
              ? sample.language_notice.en : sample.language_notice}
          </div>
        )}

        {sample?.disclaimer && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#6B7280", fontStyle: "italic" }}>
            {typeof sample.disclaimer === "object"
              ? sample.disclaimer.en : sample.disclaimer}
          </div>
        )}
      </div>

      {/* ── TRACKER PANEL ── */}
      <DocTracker
        open={trackerOpen}
        onClose={() => { setTrackerOpen(false); if (onBack) onBack(); }}
        certName={certName}
        certId={cert.certificate_id}
        lang={lang || "en"}
        mandatory={mandatory}
        required={required}
        optional={optional}
      />
    </>
  );
}