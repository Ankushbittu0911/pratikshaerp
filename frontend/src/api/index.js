import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname.includes('vercel.app') ? 'https://pratikshaerp-backend.onrender.com' : '/api')

const api = axios.create({
  baseURL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── API helpers ─────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  roles: () => api.get('/users/roles'),
}

export const enquiryAPI = {
  list: (params) => api.get('/enquiries', { params }),
  get: (id) => api.get(`/enquiries/${id}`),
  create: (data) => api.post('/enquiries', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/enquiries/${id}`, data),
  stats: () => api.get('/enquiries/stats'),
  delete: (id) => api.delete(`/enquiries/${id}`),
}

export const quotationAPI = {
  list: (params) => api.get('/quotations', { params }),
  get: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  updateAdminStatus: (id, data) => api.put(`/quotations/${id}/admin-status`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateSalesStatus: (id, data) => api.put(`/quotations/${id}/sales-status`, data),
  uploadFiles: (id, data) => api.post(`/quotations/${id}/upload-files`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/quotations/${id}`),
}

export const purchaseAPI = {
  list: (params) => api.get('/purchase-orders', { params }),
  get: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  approve: (id, data) => api.put(`/purchase-orders/${id}/approve`, data),
  markReady: (id) => api.put(`/purchase-orders/${id}/mark-ready`),
  updateMaterials: (id, data) => api.put(`/purchase-orders/${id}/material-tracking`, data),
  addItem: (id, data) => api.post(`/purchase-orders/${id}/material-items`, data),
  updateItem: (id, itemId, data) => api.put(`/purchase-orders/${id}/material-items/${itemId}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
}

export const materialAPI = {
  list: (params) => api.get('/materials', { params }),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  bulkUpload: (data) => api.post('/materials/bulk-upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  template: () => api.get('/materials/template', { responseType: 'blob' }),
}

export const productionAPI = {
  list: (params) => api.get('/production', { params }),
  get: (id) => api.get(`/production/${id}`),
  create: (data) => api.post('/production', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateFabrication: (id, data) => api.put(`/production/${id}/fabrication-status`, data),
  updatePowderCoating: (id, data) => api.put(`/production/${id}/powder-coating-status`, data),
  updateMountingPlatePowderCoating: (id, data) => api.put(`/production/${id}/mounting-plate-powder-coating-status`, data),
  updateElectrical: (id, data) => api.put(`/production/${id}/electrical-status`, data),
  addWorkLog: (id, data) => api.post(`/production/${id}/work-logs`, data),
  assign: (id, data) => api.put(`/production/${id}/assign`, data),
  stats: () => api.get('/production/stats'),
  delete: (id) => api.delete(`/production/${id}`),
}

export const materialRequestAPI = {
  list: (params) => api.get('/material-requests', { params }),
  create: (data) => api.post('/material-requests', data),
  updateStatus: (id, data) => api.put(`/material-requests/${id}/status`, data),
  delete: (id) => api.delete(`/material-requests/${id}`),
}

export const notificationAPI = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
}

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  enquiry: (params) => api.get('/reports/enquiry', { params }),
  quotation: (params) => api.get('/reports/quotation', { params }),
  purchase: () => api.get('/reports/purchase'),
  material: () => api.get('/reports/material'),
  production: () => api.get('/reports/production'),
}
