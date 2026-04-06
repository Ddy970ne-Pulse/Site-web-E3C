import api from "./client";

export const paymentsApi = {
  list: () => api.get("/payments").then((r) => r.data),
  createCheckout: (invoiceId, trancheId, originUrl) =>
    api
      .post("/payments/checkout", {
        invoice_id: invoiceId,
        tranche_id: trancheId,
        origin_url: originUrl,
      })
      .then((r) => r.data),
  getStatus: (sessionId) =>
    api.get(`/payments/status/${sessionId}`).then((r) => r.data),
};
