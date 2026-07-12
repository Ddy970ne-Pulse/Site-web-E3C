import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

const EMPTY_PROVIDERS = { google_client_id: "", facebook_app_id: "", apple_client_id: "" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [providers, setProviders] = useState(EMPTY_PROVIDERS);

  useEffect(() => {
    axios.get(`${API}/auth/me`, { withCredentials: true })
      .then(r => setUser(r.data))
      .catch(() => setUser(null));
    // Client IDs des boutons de connexion sociale : configurés depuis Admin > Paramètres,
    // pas des variables d'environnement frontend — sinon un changement dans l'admin
    // n'aurait aucun effet sans reconstruire le frontend.
    axios.get(`${API}/auth/providers`)
      .then(r => setProviders(r.data))
      .catch(() => setProviders(EMPTY_PROVIDERS));
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
    <AuthContext.Provider value={{ user, setUser, login, register, googleLogin, facebookLogin, appleLogin, logout, providers, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
