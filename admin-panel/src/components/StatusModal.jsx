import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Search, CheckCircle, XCircle, Save } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// Status config with colors and icons
// REPLACE the STATUS_CONFIG in StatusModal.jsx with this:
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    active: "bg-amber-500 text-white border-amber-500",
    // ↓ hover darkens the SAME color, not changes to blue
    label: "⏳ Pending"
  },
  approved: {
    icon: CheckCircle,
    color: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    active: "bg-blue-500 text-white border-blue-500",
    label: "✅ Approved"
  },
  generated: {
    icon: CheckCircle,
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    active: "bg-emerald-500 text-white border-emerald-500",
    label: "🎉 Generated"
  },
  rejected: {
    icon: XCircle,
    color: "bg-rose-500/20 text-rose-300 border-rose-400/30",
    active: "bg-rose-500 text-white border-rose-500",
    label: "❌ Rejected"
  },
  reviewed: {
    icon: Search,
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
    active: "bg-indigo-500 text-white border-indigo-500",
    label: "🔍 Reviewed"
  },
  resolved: {
    icon: CheckCircle,
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    active: "bg-emerald-500 text-white border-emerald-500",
    label: "✅ Resolved"
  },
  dismissed: {
    icon: XCircle,
    color: "bg-rose-500/20 text-rose-300 border-rose-400/30",
    active: "bg-rose-500 text-white border-rose-500",
    label: "❌ Dismissed"
  },
};

export default function StatusModal({
  open, onClose, onSave, saving, row, statusOptions, title,
}) {
  if (!open || !row) return null;

  return (
    <AnimatePresence>
      <motion.div
        onClick={onClose}
        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-[480px] max-w-[94vw] max-h-[90vh] overflow-y-auto
                     rounded-2xl border border-white/20
                     shadow-2xl"
          style={{
            background: "rgba(30, 58, 95, 0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* HEADER */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-white/10"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div className="text-sm font-bold text-white tracking-wide">
              {title || "Update Status"}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 transition-colors"
            >
              <X className="w-4 h-4 text-white/80" />
            </motion.button>
          </div>

          {/* BODY */}
          <ModalBody
            row={row}
            statusOptions={statusOptions}
            onClose={onClose}
            onSave={onSave}
            saving={saving}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModalBody({ row, statusOptions, onClose, onSave, saving }) {
  const [status, setStatus] = useState(row.status || statusOptions[0]?.value);
  const [note, setNote] = useState(row.admin_note || "");

  const infoRows = Object.entries({
    ...(row.application_id ? { "Application ID": row.application_id } : {}),
    ...(row.complaint_id ? { "Complaint ID": row.complaint_id } : {}),
    ...(row.certificate_name ? { "Certificate": row.certificate_name } : {}),
    ...(row.complaint_type ? { "Complaint Type": row.complaint_type } : {}),
    ...(row.applicant_name ? { "Applicant": row.applicant_name } : {}),
    ...(row.phone ? { "Phone": row.phone } : {}),
    ...(row.taluka ? { "Taluka": row.taluka } : {}),
    ...(row.village ? { "Village": row.village } : {}),
    ...(row.issue_details ? { "Issue": row.issue_details } : {}),
  });

  return (
    <div className="p-5 space-y-5">

      {/* INFO CARD */}
      <div
        className="rounded-xl border border-white/10 p-4 space-y-2.5"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        {infoRows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 text-sm">
            <span className="text-blue-200/60 text-xs font-semibold uppercase tracking-wider shrink-0">
              {k}
            </span>
            <span className="text-white/90 text-right font-medium break-words max-w-[60%] text-xs">
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* STATUS BUTTONS */}
      <div>
        <div className="text-xs text-blue-200/60 mb-3 font-semibold uppercase tracking-wider">
          Update Status
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map(({ value }) => {
            const cfg = STATUS_CONFIG[value] || {};
            const isActive = status === value;

            return (
              // In ModalBody, update the status button className:
              <motion.button
                key={value}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setStatus(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
    ${isActive ? cfg.active : cfg.color}
    ${!isActive ? "hover:brightness-125" : ""}
  `}
              >
                {cfg.label || value}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ADMIN NOTE */}
      <div>
        <div className="text-xs text-blue-200/60 mb-2 font-semibold uppercase tracking-wider">
          Admin Note
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Optional note..."
          className="w-full rounded-xl border border-white/10 text-white/90 text-sm px-3 py-2.5
                     outline-none focus:border-blue-400/50 resize-none transition-colors
                     placeholder:text-white/30"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-1">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <Button
            variant="ghost"
            className="w-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
            onClick={onClose}
          >
            Cancel
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <Button
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25"
            onClick={() => onSave({ status, admin_note: note.trim() || null })}
            disabled={saving}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}