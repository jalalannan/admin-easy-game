import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, AuthResponse, AuthError } from '@/types/auth';
import { API_CONFIG } from '@/config/api';
import { fetchWithProgress } from '@/lib/api-progress';

interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => boolean;
}

// API functions for authentication
const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetchWithProgress(`${API_CONFIG.baseUrl}/admin/login`, {
      method: 'POST',
      headers: API_CONFIG.defaultHeaders,
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  },

  async logout(token: string): Promise<void> {
    try {
      await fetchWithProgress(`${API_CONFIG.baseUrl}/admin/logout`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Even if logout fails on server, we'll clear local data
      console.error('Logout API call failed:', error);
    }
  },

  async me(token: string): Promise<User> {
    const response = await fetchWithProgress(`${API_CONFIG.baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    return data.data;
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        try {
          set({ loading: true, error: null });
          
          const response = await authApi.login(credentials);
          console.log(response);
          // Store token in localStorage for getAuthHeaders to access
          localStorage.setItem('auth_token', response?.token || '');
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          console.error('Login error:', error);
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            loading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();
        
        if (token) {
          try {
            await authApi.logout(token);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }

        // Clear localStorage token
        localStorage.removeItem('auth_token');
        
        // Clear store state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading) => set({ loading }),

      checkAuth: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync localStorage with store token
        if (state?.token) {
          localStorage.setItem('auth_token', state.token);
        }
      },
    }
  )
); 