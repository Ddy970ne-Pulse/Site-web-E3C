import api from "./client";

export const contactApi = {
  submit: (data) => api.post("/contact", data).then((r) => r.data),
};

export const galleryApi = {
  list: () => api.get("/gallery").then((r) => r.data),
  upload: (formData) =>
    api
      .post("/gallery", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data),
  delete: (id) => api.delete(`/gallery/${id}`).then((r) => r.data),
};

export const testimonialsApi = {
  list: () => api.get("/testimonials").then((r) => r.data),
  listAdmin: () => api.get("/testimonials/admin").then((r) => r.data),
  submit: (data) => api.post("/testimonials", data).then((r) => r.data),
  updateStatus: (id, status) =>
    api.patch(`/testimonials/${id}`, { status }).then((r) => r.data),
};

export const pricingApi = {
  list: () => api.get("/pricing-grid").then((r) => r.data),
  create: (data) => api.post("/pricing-grid", data).then((r) => r.data),
  update: (id, data) => api.put(`/pricing-grid/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/pricing-grid/${id}`).then((r) => r.data),
};

export const clientsApi = {
  list: () => api.get("/clients").then((r) => r.data),
};
