import api from "./client";

export const invoicesApi = {
  list: () => api.get("/invoices").then((r) => r.data),
  get: (id) => api.get(`/invoices/${id}`).then((r) => r.data),
  setTranches: (id, tranches) =>
    api.put(`/invoices/${id}/tranches`, { tranches }).then((r) => r.data),
  pdfUrl: (id) => `${process.env.REACT_APP_BACKEND_URL}/api/invoices/${id}/pdf`,
};
