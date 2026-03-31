StatusModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Info, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

export default function StatusModal({
  open,
  onClose,
  onSave,
  saving,
  row,
  statusOptions,
  title,
}) {
  if (!open || !row) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020617]/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[160]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Tricolor Accent */}
          <div className="relative p-6 border-b border-slate-800 bg-[#1E293B]/30">
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="flex-1 bg-orange-500" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-green-600" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-bold text-lg tracking-tight">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <ModalBody
            row={row}
            statusOptions={statusOptions}
            onClose={onClose}
            onSave={onSave}
            saving={saving}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ModalBody({ row, statusOptions, onClose, onSave, saving }) {
  const [status, setStatus] = useState(row.status || statusOptions[0]?.value);
  const [note, setNote] = useState(row.admin_note || "");

  const infoRows = Object.entries({
    ...(row.application_id ? { "ID": row.application_id } : {}),
    ...(row.complaint_id ? { "ID": row.complaint_id } : {}),
    ...(row.certificate_name ? { "Type": row.certificate_name } : {}),
    ...(row.applicant_name ? { "Citizen": row.applicant_name } : {}),
    ...(row.taluka ? { "Region": `${row.taluka}, ${row.village || ""}` } : {}),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Information Grid */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
        {infoRows.map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{k}</span>
            <span className="text-sm text-slate-200 font-medium truncate">{v}</span>
          </div>
        ))}
      </div>

      {/* Status Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          Update Workflow Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(({ value, label, color }) => {
            const isSelected = status === value;
            return (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 border-2 ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Note Section */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          Internal Remarks / User Note
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter comments that will be visible to the citizen..."
          className="w-full h-28 p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
        />
        <p className="text-[10px] text-slate-500 italic">
          * This note will be synchronized with the citizen-side AI chatbot.
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-all"
        >
          Discard
        </button>
        <button
          onClick={() => onSave({ status, admin_note: note.trim() || null })}
          disabled={saving}
          className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Confirm Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
