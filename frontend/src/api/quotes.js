import api from "./client";

export const quotesApi = {
  list: () => api.get("/quotes").then((r) => r.data),
  get: (id) => api.get(`/quotes/${id}`).then((r) => r.data),
  create: (data) => api.post("/quotes", data).then((r) => r.data),
  update: (id, data) => api.put(`/quotes/${id}`, data).then((r) => r.data),
  send: (id) => api.post(`/quotes/${id}/send`).then((r) => r.data),
  accept: (id) => api.post(`/quotes/${id}/accept`).then((r) => r.data),
  refuse: (id, reason) => api.post(`/quotes/${id}/refuse`, { reason }).then((r) => r.data),
  convert: (id) => api.post(`/quotes/${id}/convert`).then((r) => r.data),
  pdfUrl: (id) => `${process.env.REACT_APP_BACKEND_URL}/api/quotes/${id}/pdf`,
};

export const quoteRequestsApi = {
  list: () => api.get("/quote-requests").then((r) => r.data),
  create: (data) => api.post("/quote-requests", data).then((r) => r.data),
  updateStatus: (id, status) =>
    api.put(`/quote-requests/${id}/status`, { status }).then((r) => r.data),
};
