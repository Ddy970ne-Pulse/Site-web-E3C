import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    authApi.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data);
    return data;
  };

  const register = async (email, password, name, phone) => {
    const data = await authApi.register(email, password, name, phone);
    setUser(data);
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
