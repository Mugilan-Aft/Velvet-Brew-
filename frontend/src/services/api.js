export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
};

// ── Menu ──────────────────────────────────────
export const getMenu = () => request('/api/menu');
export const createMenuItem = (body) => request('/api/menu', { method: 'POST', body: JSON.stringify(body) });
export const updateMenuItem = (id, body) => request(`/api/menu/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteMenuItem = (id) => request(`/api/menu/${id}`, { method: 'DELETE' });

// ── Tabs ──────────────────────────────────────
export const openTab = (body) => request('/api/tabs', { method: 'POST', body: JSON.stringify(body) });
export const getTab = (id) => request(`/api/tabs/${id}`);
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const getCategories = () => request('/api/categories');
export const createCategory = (cat) => request('/api/categories', { method: 'POST', body: JSON.stringify(cat) });
export const deleteCategory = (id) => request(`/api/categories/${id}`, { method: 'DELETE' });

export const updateInventory = (id, body) => request(`/api/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const getTabs = (status) => request(`/api/tabs${status ? `?status=${status}` : ''}`);
export const updateTab = (id, body) => request(`/api/tabs/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

// ── Orders ────────────────────────────────────
export const placeOrder = (body) => request('/api/orders', { method: 'POST', body: JSON.stringify(body) });
export const getOrders = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/api/orders${q ? `?${q}` : ''}`);
};
export const updateOrderStatus = (id, status) =>
  request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const updateOrderPrepStatus = (id, prep_status_updates) =>
  request(`/api/orders/${id}/prep-status`, { method: 'PATCH', body: JSON.stringify({ prep_status_updates }) });
export const deleteOrder = (id) => request(`/api/orders/${id}`, { method: 'DELETE' });
export const purgeMockOrders = () => request('/api/orders/mock', { method: 'DELETE' });
export const createRazorpayOrder = (amount) => request('/api/razorpay/order', { method: 'POST', body: JSON.stringify({ amount }) });

// ── Stations & Order Items ────────────────────
export const getStations = () => request('/api/stations');
export const getOrderItems = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/api/order-items${q ? `?${q}` : ''}`);
};
export const updateOrderItemStatus = (id, status) => request(`/api/order-items/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ── Analytics ─────────────────────────────────
export const getStats = () => request('/api/stats');

// ── Reviews ───────────────────────────────────
export const getReviews = () => request('/api/reviews');
export const submitReview = (body) => request('/api/reviews', { method: 'POST', body: JSON.stringify(body) });
