import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    axios.get(`${API}/auth/me`, { withCredentials: true })
      .then(r => setUser(r.data))
      .catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    setUser(data);
    return data;
  };

  const register = async (email, password, name, phone) => {
    const { data } = await axios.post(`${API}/auth/register`, { email, password, name, phone }, { withCredentials: true });
    setUser(data);
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await axios.post(`${API}/auth/google`, { credential }, { withCredentials: true });
    setUser(data);
    return data;
  };

  const facebookLogin = async (accessToken) => {
    const { data } = await axios.post(`${API}/auth/facebook`, { access_token: accessToken }, { withCredentials: true });
    setUser(data);
    return data;
  };

  const appleLogin = async (idToken, name) => {
    const { data } = await axios.post(`${API}/auth/apple`, { id_token: idToken, name }, { withCredentials: true });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, googleLogin, facebookLogin, appleLogin, logout, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
