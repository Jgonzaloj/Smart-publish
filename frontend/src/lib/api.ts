import axios from 'axios';

// Instancia global de Axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Conexión local o servidor en producción
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el JWT y el WorkspaceID en cada petición
api.interceptors.request.use((config) => {
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
