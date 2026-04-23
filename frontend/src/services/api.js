import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Product APIs
export const verifyProduct = async (barcode) => {
  const response = await api.get(`/products/verify/${barcode}`);
  return response.data;
};

export const getAllProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// Scan APIs
export const getScanHistory = async (limit = 50) => {
  const response = await api.get(`/scans/history?limit=${limit}`);
  return response.data;
};

export const getScanStats = async () => {
  const response = await api.get('/scans/stats');
  return response.data;
};

export default api;
