// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

function StatCard({ emoji, label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 14, padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        border: `1.5px solid #E5E7EB`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s",
        borderLeft: `4px solid ${color}`,
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 28 }}>{emoji}</span>
        <span style={{
          fontSize: 28, fontWeight: 800, color,
        }}>{value ?? <span className="spinner" />}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const [
        { count: totalApps },
        { count: pendingApps },
        { count: approvedApps },
        { count: generatedApps },
        { count: rejectedApps },
        { count: totalCmps },
        { count: pendingCmps },
        { count: resolvedCmps },
      ] = await Promise.all([
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "generated"),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("complaints").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "resolved"),
      ]);

      setStats({
        totalApps, pendingApps, approvedApps, generatedApps, rejectedApps,
        totalCmps, pendingCmps, resolvedCmps,
      });
    }
    load();
  }, []);

  // Recent applications
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    supabase
      .from("applications")
      .select("application_id, certificate_name, applicant_name, status, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent(data || []));
  }, []);

  const STATUS_COLOR = {
    pending:   "#F59E0B",
    approved:  "#2563EB",
    generated: "#16A34A",
    rejected:  "#DC2626",
    reviewed:  "#2563EB",
    resolved:  "#16A34A",
    dismissed: "#DC2626",
  };

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1A237E" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
          Live overview of all applications and complaints
        </p>
      </div>

      {/* ── APPLICATION STATS ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
        Applications
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 28,
      }}>
        <StatCard emoji="📄" label="Total Applications" value={stats?.totalApps}    color="#0048A8" onClick={() => navigate("/applications")} />
        <StatCard emoji="⏳" label="Pending"            value={stats?.pendingApps}  color="#F59E0B" onClick={() => navigate("/applications?status=pending")} />
        <StatCard emoji="✅" label="Approved"           value={stats?.approvedApps} color="#2563EB" onClick={() => navigate("/applications?status=approved")} />
        <StatCard emoji="🎉" label="Generated"          value={stats?.generatedApps}color="#16A34A" onClick={() => navigate("/applications?status=generated")} />
        <StatCard emoji="❌" label="Rejected"           value={stats?.rejectedApps} color="#DC2626" onClick={() => navigate("/applications?status=rejected")} />
      </div>

      {/* ── COMPLAINT STATS ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
        Complaints
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 32,
      }}>
        <StatCard emoji="📝" label="Total Complaints"  value={stats?.totalCmps}   color="#7C3AED" onClick={() => navigate("/complaints")} />
        <StatCard emoji="⏳" label="Pending"           value={stats?.pendingCmps} color="#F59E0B" onClick={() => navigate("/complaints?status=pending")} />
        <StatCard emoji="✅" label="Resolved"          value={stats?.resolvedCmps}color="#16A34A" onClick={() => navigate("/complaints?status=resolved")} />
      </div>

      {/* ── RECENT APPLICATIONS ── */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1.5px solid #E5E7EB",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1A237E" }}>Recent Applications</div>
          <button
            onClick={() => navigate("/applications")}
            style={{
              fontSize: 12, fontWeight: 700, color: "#0048A8",
              background: "none", border: "none", padding: 0,
            }}
          >
            View all →
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "16px 0" }}>
            No applications yet
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                {["Application ID", "Certificate", "Applicant", "Date", "Status"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "6px 10px",
                    fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                    textTransform: "uppercase", letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.application_id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px 10px", fontFamily: "monospace", fontWeight: 700, color: "#0048A8", fontSize: 11 }}>{r.application_id}</td>
                  <td style={{ padding: "10px 10px", color: "#374151" }}>{r.certificate_name || "—"}</td>
                  <td style={{ padding: "10px 10px", color: "#374151" }}>{r.applicant_name || "—"}</td>
                  <td style={{ padding: "10px 10px", color: "#6B7280" }}>{fmt(r.submitted_at)}</td>
                  <td style={{ padding: "10px 10px" }}>
                    <span className={`pill ${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
