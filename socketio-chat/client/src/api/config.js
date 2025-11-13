import axiois from 'axios';

const api = axiois.create({
  baseURL: 'http://localhost:5000/api',
});

// interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export default api;