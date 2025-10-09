import { create } from 'zustand';
import { 
  Notification, 
  CreateNotificationRequest, 
  UpdateNotificationRequest, 
  NotificationFilters,
  NotificationListResponse 
} from '@/types/notification';

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  filters: NotificationFilters;
}

interface NotificationActions {
  // CRUD Operations
  fetchNotifications: (filters?: NotificationFilters, page?: number, limit?: number) => Promise<void>;
  createNotification: (data: CreateNotificationRequest) => Promise<Notification>;
  updateNotification: (id: string, data: UpdateNotificationRequest) => Promise<Notification>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Filtering and Search
  setFilters: (filters: NotificationFilters) => void;
  clearFilters: () => void;
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  filters: {},
};

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  ...initialState,

  fetchNotifications: async (filters = {}, page = 1, limit = 10) => {
    set({ loading: true, error: null });
    
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const response = await fetch(`/api/notifications?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      
      const data: NotificationListResponse = await response.json();
      
      set({
        notifications: data.notifications,
        total: data.total,
        page: data.page,
        limit: data.limit,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
        loading: false,
      });
    }
  },

  createNotification: async (data: CreateNotificationRequest) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create notification: ${response.statusText}`);
      }
      
      const notification: Notification = await response.json();
      
      // Add to current list
      set((state) => ({
        notifications: [notification, ...state.notifications],
        total: state.total + 1,
        loading: false,
      }));
      
      return notification;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create notification',
        loading: false,
      });
      throw error;
    }
  },

  updateNotification: async (id: string, data: UpdateNotificationRequest) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update notification: ${response.statusText}`);
      }
      
      const notification: Notification = await response.json();
      
      // Update in current list
      set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? notification : n
        ),
        loading: false,
      }));
      
      return notification;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update notification',
        loading: false,
      });
      throw error;
    }
  },

  deleteNotification: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`);
      }
      
      // Remove from current list
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        total: state.total - 1,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete notification',
        loading: false,
      });
      throw error;
    }
  },

  setFilters: (filters: NotificationFilters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  reset: () => {
    set(initialState);
  },
}));
