import { create } from 'zustand';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface SocialAccount {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';
  account_name: string;
}

interface AppState {
  workspaceId: string | null;
  accounts: SocialAccount[];
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setWorkspaceId: (id: string) => void;
  setAccounts: (accounts: SocialAccount[]) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addAccount: (account: SocialAccount) => void;
}

export const useAppStore = create<AppState>((set) => ({
  workspaceId: null,
  accounts: [],
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  setWorkspaceId: (id) => set({ workspaceId: id }),
  setAccounts: (accounts) => set({ accounts }),
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Petición HTTP al Backend
      const response = await api.post('/auth/login', { email, password });
      
      const { token, workspace_id } = response.data;
      
      // 2. Guardar Token en LocalStorage
      localStorage.setItem('jwt_token', token);

      // 3. Actualizar el estado global
      set({ 
        user: { id: '1', name: email.split('@')[0], email }, 
        workspaceId: workspace_id || 'ws-123',
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al iniciar sesión';
      set({ error: msg, isLoading: false });
    }
  },
  logout: () => {
    localStorage.removeItem('jwt_token');
    set({ user: null, isAuthenticated: false, workspaceId: null });
  },
  addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
}));
