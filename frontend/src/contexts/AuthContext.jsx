import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // demo user: change role to test
  const [user, setUser] = useState({ role: "HospitalAdmin" });

  const value = useMemo(
    () => ({
      user,
      loginAs: (role) => setUser({ role }),
      logout: () => setUser(null),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};