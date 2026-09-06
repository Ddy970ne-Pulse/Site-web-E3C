import api from "./client";

export const authApi = {
  me: () => api.get("/auth/me").then((r) => r.data),
  login: (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data),
  register: (email, password, name, phone) =>
    api.post("/auth/register", { email, password, name, phone }).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
};
