// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

const NAV = [
  { to: "/dashboard",    icon: "📊", label: "Dashboard"    },
  { to: "/applications", icon: "📄", label: "Applications" },
  { to: "/complaints",   icon: "📝", label: "Complaints"   },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "linear-gradient(180deg, #1A237E 0%, #0D1B6E 100%)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          {/* Tricolor bar */}
          <div style={{
            height: 3, borderRadius: 2, marginBottom: 16,
            background: "linear-gradient(90deg, #FF6B00 33%, #fff 33% 66%, #138808 66%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 28 }}>🏛️</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>
                Sahayak
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>
                ADMIN PANEL
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "14px 10px" }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                textDecoration: "none", fontSize: 13, fontWeight: 700,
                transition: "all 0.15s",
                background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                borderLeft: isActive ? "3px solid #FF6B00" : "3px solid transparent",
              })}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "14px 10px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10,
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            <span style={{ fontSize: 16 }}>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 56, background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 12,
          position: "sticky", top: 0, zIndex: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>
              Maharashtra Government — Certificate Portal
            </span>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#16A34A",
            background: "#F0FDF4", border: "1px solid #86EFAC",
            padding: "4px 10px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#16A34A", display: "inline-block",
            }} />
            Admin
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
