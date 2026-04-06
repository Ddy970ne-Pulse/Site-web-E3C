/**
 * Instance Axios centralisée avec :
 * - Base URL depuis REACT_APP_BACKEND_URL
 * - Cookies credentials inclus automatiquement
 * - Intercepteur erreurs : redirige vers /connexion sur 401
 */
import axios from "axios";

const apiClient = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Intercepteur réponse : gestion globale des erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou absent → rediriger vers login si pas déjà sur une page auth
      const publicPaths = ["/connexion", "/inscription", "/", "/devis", "/contact"];
      const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isPublic) {
        window.location.href = "/connexion";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
