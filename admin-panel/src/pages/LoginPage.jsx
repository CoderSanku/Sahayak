// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (login(pw)) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1A237E 0%, #0048A8 60%, #138808 100%)",
    }}>
      {/* Card */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 36px",
        width: 380, maxWidth: "92vw",
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        animation: shake ? "shake 0.4s ease" : "fadeIn 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🏛️</div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: "#1A237E", letterSpacing: 0.5,
          }}>Sahayak Admin</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Maharashtra Certificate Portal
          </div>
          {/* Tricolor bar */}
          <div style={{
            height: 3, borderRadius: 2, marginTop: 16,
            background: "linear-gradient(90deg, #FF6B00 33%, #fff 33% 66%, #138808 66%)",
          }} />
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{
            fontSize: 12, fontWeight: 700, color: "#374151",
            display: "block", marginBottom: 6,
          }}>
            Admin Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="Enter admin password"
            autoFocus
            style={{
              width: "100%", padding: "12px 14px",
              border: `1.5px solid ${error ? "#EF4444" : "#E5E7EB"}`,
              borderRadius: 10, fontSize: 14,
              color: "#1C1C2E", background: "#FAFAFA", outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => { if (!error) e.target.style.borderColor = "#0048A8"; }}
            onBlur={(e)  => { if (!error) e.target.style.borderColor = "#E5E7EB"; }}
          />
          {error && (
            <div style={{
              marginTop: 8, fontSize: 12, color: "#DC2626", fontWeight: 600,
            }}>
              ❌ Incorrect password. Try again.
            </div>
          )}

          <button
            type="submit"
            style={{
              marginTop: 20, width: "100%", padding: "13px",
              background: "linear-gradient(135deg, #1A237E, #0048A8)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 14, fontWeight: 800,
              letterSpacing: 0.3, transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            🔐 Sign In
          </button>
        </form>

        <div style={{
          marginTop: 20, fontSize: 11, color: "#9CA3AF",
          textAlign: "center", lineHeight: 1.6,
        }}>
          Restricted access — authorised personnel only
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
