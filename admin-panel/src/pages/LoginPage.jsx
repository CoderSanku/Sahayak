import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, AlertCircle, ArrowRight, Landmark } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoggingIn(true);
    
    // Artificial delay to match the "Secure Signing In" feel
    setTimeout(() => {
      if (login(pw)) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(true);
        setIsLoggingIn(false);
        // Reset password field on error for security
        setPw("");
      }
    }, 800);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      {/* Background Glows to match your screenshot's depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: error ? [0, -10, 10, -10, 10, 0] : 0 
        }}
        transition={{ duration: error ? 0.4 : 0.6 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Header Section */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex p-4 rounded-[2rem] bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl shadow-violet-900/40 mb-6"
          >
            <Landmark className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Sahayak Admin
          </h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em]">
            Maharashtra Certificate Portal
          </p>
          
          {/* Decorative Tricolor underline */}
          <div className="flex justify-center gap-1.5 mt-5">
            <div className="w-10 h-1 rounded-full bg-orange-500/80" />
            <div className="w-10 h-1 rounded-full bg-slate-200/80" />
            <div className="w-10 h-1 rounded-full bg-emerald-500/80" />
          </div>
        </div>

        {/* Login Glass Card */}
        <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl border-t-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Access Credentials
              </label>
              
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setError(false); }}
                  placeholder="Enter Admin Password"
                  autoFocus
                  className={`w-full bg-slate-900/50 border ${error ? 'border-rose-500' : 'border-slate-800'} rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all`}
                />
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-rose-400 text-xs font-bold px-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Authentication failed. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !pw}
              className="relative w-full overflow-hidden bg-violet-600 disabled:bg-slate-800 text-white py-4.5 rounded-2xl font-black text-sm tracking-[0.1em] uppercase transition-all hover:bg-violet-500 active:scale-[0.97] shadow-xl shadow-violet-900/20 group"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Secure Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Security Badge */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
            AES-256 Encrypted Session
          </div>
          <div className="text-slate-700 font-bold text-[9px] uppercase tracking-[0.2em]">
            Authorised Personnel Only
          </div>
        </div>
      </motion.div>
    </div>
  );
}