import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check if already logged in

  // On first load, ask the server "who am I?". It works if the cookie exists.
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setSupplier(res.data))
      .catch(() => setSupplier(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setSupplier(res.data.supplier);
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    setSupplier(res.data.supplier);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setSupplier(null);
  };

  return (
    <AuthContext.Provider value={{ supplier, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);