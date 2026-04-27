import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle, AlertCircle,
  Info, Eye, ClipboardCheck, Building2,
} from "lucide-react";
import { pdfUrl } from "../api";
import DocTracker from "./DocTracker";
import { createPortal } from "react-dom";

export default function CertCard({ data, sample, onViewPdf, onBack, lang }) {
  const [trackerOpen, setTrackerOpen] = useState(false);

  const cert = data?.certificate;
  const docs = data?.documents || {};
  const suggestions = data?.suggestions || [];

  const mandatory = docs.mandatory || [];
  const required = docs.required || [];
  const optional = docs.optional || [];

  if (!cert) return null;

  const certName = cert.certificate_name || "";
  const authority = cert.issuing_authority || "";

  return (
    <>
      <motion.div
        className="cert-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Title */}
        <div className="cert-card-title">
          <FileText
            style={{
              display: "inline",
              marginRight: 8,
              width: 18,
              height: 18,
              color: "#2563eb",
              verticalAlign: "middle",
            }}
          />
          {certName}
        </div>

        {/* Mandatory Documents */}
        {mandatory.length > 0 && (
          <motion.div
            className="doc-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="doc-label mandatory"
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <AlertCircle style={{ width: 12, height: 12, display: "inline" }} />
              Mandatory Documents
            </div>
            <ul className="doc-list mandatory">
              {mandatory.map((d, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  {d}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Required Documents */}
        {required.length > 0 && (
          <motion.div
            className="doc-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="doc-label required"
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <CheckCircle style={{ width: 12, height: 12, display: "inline" }} />
              Required Documents
            </div>
            <ul className="doc-list required">
              {required.map((d, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                >
                  {d}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Optional Documents */}
        {optional.length > 0 && (
          <motion.div
            className="doc-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="doc-label optional"
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <Info style={{ width: 12, height: 12, display: "inline" }} />
              Optional Documents
            </div>
            <ul className="doc-list optional">
              {optional.map((d, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                >
                  {d}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Empty state */}
        {mandatory.length === 0 && required.length === 0 && optional.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle style={{ width: 14, height: 14, color: "#10b981" }} />
            All documents accounted for.
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            className="suggestions-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {suggestions.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 3 }}>
                <Info style={{ width: 12, height: 12, color: "#3b82f6", flexShrink: 0, marginTop: 2 }} />
                <span>{s}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Footer */}
        <div className="cert-footer">
          <span className="authority-badge">
            <Building2 style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
            {authority}
          </span>

          {sample?.found && sample?.sample_pdf_url && (
            <motion.button
              className="pdf-btn"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onViewPdf(pdfUrl(sample.sample_pdf_url))}
            >
              <Eye style={{ width: 13, height: 13 }} />
              View Sample PDF
            </motion.button>
          )}
        </div>

        {/* Check Documents Button */}
        <motion.button
          onClick={() => setTrackerOpen(true)}
          className="doc-btn"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "10px 16px",
            fontSize: 13,
            justifyContent: "center",
          }}
        >
          <ClipboardCheck style={{ width: 15, height: 15 }} />
          Check Documents & Apply
        </motion.button>

        {/* Notices */}
        {sample?.language_notice && (
          <div style={{
            marginTop: 8,
            fontSize: 11,
            color: "#2563eb",
            fontStyle: "italic",
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
          }}>
            <Info style={{ width: 11, height: 11, flexShrink: 0, marginTop: 2 }} />
            {typeof sample.language_notice === "object"
              ? sample.language_notice.en
              : sample.language_notice}
          </div>
        )}

        {sample?.disclaimer && (
          <div style={{
            marginTop: 4,
            fontSize: 11,
            color: "#64748b",
            fontStyle: "italic",
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
          }}>
            <AlertCircle style={{ width: 11, height: 11, flexShrink: 0, marginTop: 2 }} />
            {typeof sample.disclaimer === "object"
              ? sample.disclaimer.en
              : sample.disclaimer}
          </div>
        )}
      </motion.div>

      {/* DocTracker Panel */}
            {createPortal(
              <DocTracker
                open={trackerOpen}
                onClose={() => { setTrackerOpen(false); if (onBack) onBack(); }}
                certName={certName}
                certId={cert.certificate_id}
                lang={lang || "en"}
                mandatory={mandatory}
                required={required}
                optional={optional}
              />,
              document.body
            )}
          </>
        );
      }