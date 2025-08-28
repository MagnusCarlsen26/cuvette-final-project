// Simple API client and auth token storage

const TOKEN_STORAGE_KEY = "auth_token";
const API_BASE = process.env.REACT_APP_API_BASE || (typeof window !== 'undefined' && window.location && window.location.port === '3000' ? 'http://localhost:5000' : ""); // prefer backend in dev

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (_err) {
    // ignore storage errors
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (_err) {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (_err) {
    // ignore
  }
}

async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const token = getToken();
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  };
  const res = await fetch(`${API_BASE}${path}`, init);
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const message = (isJson && data && data.error) ? data.error : (typeof data === "string" ? data : "Request failed");
    throw new Error(message);
  }
  return data;
}

export function apiLogin({ email, password }) {
  return apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
}

export function apiSignup({ name, email, password }) {
  return apiFetch("/api/auth/signup", { method: "POST", body: { name, email, password } });
}

export function apiForgotPassword({ email }) {
  return apiFetch("/api/auth/forgot-password", { method: "POST", body: { email } });
}

export function apiResetPassword({ email, otp, newPassword }) {
  return apiFetch("/api/auth/reset-password", { method: "POST", body: { email, otp, newPassword } });
}

// Me / Profile
export function apiGetMe() {
  return apiFetch("/api/auth/me");
}
export function apiUpdateProfile(body) {
  return apiFetch("/api/auth/me", { method: "PUT", body });
}

// Layout
export function apiGetLayout(page) {
  return apiFetch(`/api/layout/${page}`);
}
export function apiSaveLayout(page, layout) {
  return apiFetch(`/api/layout/${page}`, { method: "PUT", body: { layout } });
}

// Products
export function apiGetProducts({ page = 1, limit = 10, search = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search ? { search } : {}) });
  return apiFetch(`/api/products?${params.toString()}`);
}
export function apiCreateProduct(body) {
  return apiFetch("/api/products", { method: "POST", body });
}
export function apiOrderProductQuantity(id, delta) {
  return apiFetch(`/api/products/${id}/order`, { method: "PATCH", body: { delta } });
}
export function apiDeleteProduct(id) {
  return apiFetch(`/api/products/${id}`, { method: "DELETE" });
}
export function apiUploadProductsCsv(csvText) {
  const token = getToken();
  return fetch(`${API_BASE}/api/products/csv`, {
    method: "POST",
    headers: {
      "Content-Type": "text/csv",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: csvText
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data && data.error ? data.error : "Upload failed");
    return data;
  });
}

export function apiGetProductMetrics() {
  return apiFetch("/api/products/metrics");
}

// Invoices
export function apiGetInvoices({ page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/api/invoices?${params.toString()}`);
}
export function apiCreateInvoice(body) {
  return apiFetch("/api/invoices", { method: "POST", body });
}
export function apiGetInvoice(id) {
  return apiFetch(`/api/invoices/${id}`);
}
export function apiMarkInvoicePaid(id) {
  return apiFetch(`/api/invoices/${id}/mark-paid`, { method: "PATCH" });
}
export function apiDeleteInvoice(id) {
  return apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
}

export function apiGetInvoiceMetrics() {
  return apiFetch("/api/invoices/metrics");
}

// Stats
export function apiGetKpis(params = {}) {
  const qs = new URLSearchParams(params);
  return apiFetch(`/api/stats/kpis${qs.toString() ? `?${qs.toString()}` : ""}`);
}
export function apiGetTopProducts(params = {}) {
  const qs = new URLSearchParams(params);
  return apiFetch(`/api/stats/top-products${qs.toString() ? `?${qs.toString()}` : ""}`);
}

export function apiGetGraph(params = {}) {
  const qs = new URLSearchParams(params);
  return apiFetch(`/api/stats/graph${qs.toString() ? `?${qs.toString()}` : ""}`);
}
