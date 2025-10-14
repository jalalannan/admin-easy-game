'use client';

import { create } from 'zustand';
import { db } from '@/config/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';

interface AdminNotification {
  id: string;
  type: string;
  requestId: string;
  chatId: string;
  senderType: 'student' | 'tutor' | 'admin';
  senderId: string;
  senderName: string;
  senderNickname: string;
  message: string;
  content: string;
  timestamp: any;
  seen: boolean;
  createdAt: any;
  updatedAt: any;
}

interface NotificationState {
  notifications: AdminNotification[];
  unseenCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  setNotifications: (notifications: AdminNotification[]) => void;
  markAsSeen: (notificationId: string) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRealtimeNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  notifications: [],
  unseenCount: 0,
  isLoading: false,
  error: null,

  setNotifications: (notifications) => {
    const unseenCount = notifications.filter(n => !n.seen).length;
    set({ notifications, unseenCount });
  },

  markAsSeen: async (notificationId) => {
    try {
      const notificationRef = doc(db, 'admin_notifications', notificationId);
      await updateDoc(notificationRef, {
        seen: true,
        updatedAt: new Date()
      });
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, seen: true } : n
        ),
        unseenCount: state.unseenCount - 1
      }));
    } catch (error) {
      console.error('Error marking notification as seen:', error);
      set({ error: 'Failed to mark notification as seen' });
    }
  },

  markAllAsSeen: async () => {
    try {
      const { notifications } = get();
      const unseenNotifications = notifications.filter(n => !n.seen);
      console.log(unseenNotifications);
      const updatePromises = unseenNotifications.map(notification => 
        updateDoc(doc(db, 'admin_notifications', notification.id), {
          seen: true,
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, seen: true })),
        unseenCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
      set({ error: 'Failed to mark all notifications as seen' });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// Hook to setup realtime listener
export function useRealtimeNotifications() {
  const { setNotifications, setLoading, setError } = useRealtimeNotificationStore();

  useEffect(() => {
    setLoading(true);
    
    const notificationsRef = collection(db, 'admin_notifications');
    const q = query(
      notificationsRef, 
      orderBy('createdAt', 'desc'), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AdminNotification[];
      
      setNotifications(notifications);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Error listening to notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setNotifications, setLoading, setError]);
}
