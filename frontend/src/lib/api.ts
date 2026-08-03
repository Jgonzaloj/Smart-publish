import axios from 'axios';

// Instancia global de Axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Conexión local o servidor en producción
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
      // Opcional: localStorage.removeItem('jwt_token'); window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
