import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return 'https://api.redes.inversionesvawi.com/api';
  return 'http://localhost:3000/api';
};

// Instancia global de Axios
export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el JWT, WorkspaceID y normalizar URLs
api.interceptors.request.use((config) => {
  // Evitar duplicar el prefijo /api si la URL relativa ya lo incluye
  if (config.url && config.url.startsWith('/api/')) {
    config.url = config.url.substring(4);
  }

  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.workspace_id) {
        config.headers['x-workspace-id'] = user.workspace_id;
      }
    } catch (e) {}
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor global de errores (Cerrar sesión si el JWT expiró)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o token inválido.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
