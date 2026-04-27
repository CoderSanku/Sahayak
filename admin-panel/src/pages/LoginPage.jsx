import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

import { Lock, Shield, AlertCircle, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (login(pw)) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      setLoading(false);
    }, 300);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 40%, #e0f2fe 100%)" }}
    >

      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          x: shake ? [0, -8, 8, -5, 5, 0] : 0,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-[420px] max-w-[92vw] rounded-2xl overflow-hidden shadow-2xl border border-white/30"
      >

        {/* ── TOP — exact sidebar color ── */}
        <div
          className="px-8 pt-8 pb-7 text-center"
          style={{ background: "linear-gradient(160deg, #1e3a6e 0%, #1a3460 100%)" }}
        >
          {/* Indian tricolor */}
          <div className="h-[3px] rounded-full mb-6 bg-gradient-to-r from-orange-400 via-white to-green-400 opacity-90" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex p-4 rounded-2xl mb-4"
            style={{ background: "rgba(96,165,250,0.2)" }}
          >
            <Building2 className="w-8 h-8 text-blue-300" />
          </motion.div>

          <h1 className="text-xl font-extrabold text-white tracking-wide">
            GramSevak Bot Admin
          </h1>
          <p className="text-xs mt-1 tracking-wide" style={{ color: "rgba(147,197,253,0.7)" }}>
            Maharashtra Certificate Portal
          </p> 
        </div>

        {/* ── BOTTOM — light blue matching app background ── */}
        <div
          className="px-8 py-8"
          style={{
            background: "rgba(219, 234, 254, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <form onSubmit={handleSubmit}>

            <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">
              Admin Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                type="password"
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setError(false);
                }}
                placeholder="Enter admin password"
                autoFocus
                className={`pl-10 h-11 bg-white/70 text-slate-800 placeholder:text-slate-400
                  ${error
                    ? "border-rose-400 focus-visible:ring-rose-400"
                    : "border-blue-200 focus-visible:ring-blue-400"
                  }`}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 text-xs text-rose-600 font-medium bg-rose-50 px-3 py-2 rounded-lg border border-rose-200"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Incorrect password. Please try again.
              </motion.div>
            )}

            {/* Submit */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="mt-5"
            >
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-white font-bold tracking-wide border border-blue-300/20"
                style={{
                  background: "linear-gradient(135deg, #1e3a6e 0%, #2563eb 100%)",
                  boxShadow: "0 4px 20px rgba(30,58,110,0.35)",
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <p className="mt-6 text-[11px] text-slate-400 text-center leading-relaxed">
            Restricted access — authorised personnel only
          </p>
        </div>
      </motion.div>
    </div>
  );
}