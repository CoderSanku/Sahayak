// src/lib/auth.jsx
// Simple password-based admin gate.
// No external auth service needed — just a hardcoded password stored
// in sessionStorage so the page survives refresh.
// Change ADMIN_PASSWORD to whatever you want.

import { createContext, useContext, useState } from "react";

const ADMIN_PASSWORD = "Admin@123";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("sahayak_admin_auth") === "1"
  );

  function login(pw) {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("sahayak_admin_auth", "1");
      setAuthed(true);
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem("sahayak_admin_auth");
    setAuthed(false);
  }

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
