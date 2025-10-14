'use client';

import { create } from 'zustand';
import { db } from '@/config/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';

// Sound configuration
interface SoundConfig {
  tutor: string;
  student: string;
  admin: string;
  default: string;
}

// Default sound URLs (you can replace these with your own MP3 files)
const DEFAULT_SOUNDS: SoundConfig = {
  tutor: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Replace with your tutor MP3
  student: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Replace with your student MP3
  admin: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Replace with your admin MP3
  default: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' // Replace with your default MP3
};

// Local sound files (place these in your public folder)
const LOCAL_SOUNDS: SoundConfig = {
  tutor: '/sounds/tutor-notification.mp3',
  student: '/sounds/student-notification.mp3', 
  admin: '/sounds/admin-notification.mp3',
  default: '/sounds/default-notification.mp3'
};

// Audio cache to avoid reloading sounds
const audioCache = new Map<string, HTMLAudioElement>();

// Function to load and cache audio
const loadAudio = async (url: string): Promise<HTMLAudioElement> => {
  if (audioCache.has(url)) {
    return audioCache.get(url)!;
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.5; // Default volume
    
    audio.addEventListener('canplaythrough', () => {
      audioCache.set(url, audio);
      resolve(audio);
    });
    
    audio.addEventListener('error', (e) => {
      console.error(`Failed to load audio: ${url}`, e);
      reject(e);
    });
    
    // Try to load the audio
    audio.load();
  });
};

// Function to request notification permission
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Function to show browser notification
const showBrowserNotification = async (notification: AdminNotification) => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Cannot show browser notification: permission denied');
      return;
    }

    // Check if browser notifications are enabled
    const browserNotificationsEnabled = localStorage.getItem('browserNotificationsEnabled');
    if (browserNotificationsEnabled === 'false') {
      console.log('Browser notifications are disabled');
      return;
    }

    // Create notification
    const browserNotification = new Notification(
      `${notification.senderNickname || notification.senderName} - New Message`,
      {
        body: notification.content,
        icon: '/notification-icon.svg', // Custom notification icon
        badge: '/notification-icon.svg',
        tag: `notification-${notification.id}`, // Prevent duplicate notifications
        requireInteraction: false,
        silent: false,
        data: {
          requestId: notification.requestId,
          notificationId: notification.id,
          senderType: notification.senderType,
          timestamp: notification.timestamp?.toDate ? notification.timestamp.toDate().getTime() : Date.now()
        }
      }
    );

    // Handle notification click
    browserNotification.onclick = () => {
      window.focus();
      // Open the request detail page in a new tab
      if (notification.requestId) {
        window.open(`/dashboard/requests/${notification.requestId}`, '_blank');
      }
      browserNotification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);

    console.log(`Browser notification shown for ${notification.senderType}: ${notification.senderName}`);
  } catch (error) {
    console.error('Error showing browser notification:', error);
  }
};

// Function to play notification sound based on sender type
const playNotificationSound = async (senderType: 'student' | 'tutor' | 'admin' | 'default' = 'default') => {
  try {
    // Check if sound is enabled
    const soundEnabled = localStorage.getItem('notificationSoundEnabled');
    if (soundEnabled === 'false') {
      console.log('Notification sound is disabled');
      return;
    }

    // Get volume setting
    const volumeSetting = localStorage.getItem('notificationVolume');
    const volume = volumeSetting ? JSON.parse(volumeSetting) / 100 : 0.5;

    // Try local sounds first, then fallback to default sounds
    const soundUrl = LOCAL_SOUNDS[senderType] || DEFAULT_SOUNDS[senderType] || DEFAULT_SOUNDS.default;
    
    try {
      const audio = await loadAudio(soundUrl);
      audio.currentTime = 0; // Reset to beginning
      audio.volume = volume; // Set volume from settings
      await audio.play();
      console.log(`Playing ${senderType} notification sound at ${volume * 100}% volume`);
    } catch (audioError) {
      console.log(`Failed to play ${senderType} sound, trying fallback:`, audioError);
      
      // Fallback to Web Audio API
      await playFallbackSound(senderType, volume);
    }
  } catch (error) {
    console.log('Could not play notification sound:', error);
    // Final fallback to basic beep
    await playFallbackSound(senderType, 0.5);
  }
};

// Fallback sound using Web Audio API
const playFallbackSound = async (senderType: 'student' | 'tutor' | 'admin' | 'default' = 'default', volume: number = 0.5) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different sender types
    const frequencies = {
      student: [600, 800], // Higher pitch for students
      tutor: [400, 600],   // Lower pitch for tutors
      admin: [500, 700],  // Medium pitch for admin
      default: [600, 800] // Default pitch
    };
    
    const freq = frequencies[senderType] || frequencies.default;
    
    // Create a pleasant notification sound (two quick beeps)
    oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
    oscillator.frequency.setValueAtTime(freq[1], audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.2, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(volume * 0.2, audioContext.currentTime + 0.11);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
    console.log(`Playing fallback ${senderType} notification sound at ${volume * 100}% volume`);
  } catch (fallbackError) {
    console.log('Fallback audio also failed:', fallbackError);
  }
};

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
  previousNotificationCount: number;
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
  previousNotificationCount: 0,

  setNotifications: (notifications) => {
    const unseenCount = notifications.filter(n => !n.seen).length;
    const { previousNotificationCount, notifications: prevNotifications } = get();
    
    // Play sound if new notifications arrived (not just on initial load)
    if (notifications.length > previousNotificationCount && previousNotificationCount > 0) {
      // Check if there are actually new notifications by comparing IDs
      const prevIds = new Set(prevNotifications.map(n => n.id));
      const newNotifications = notifications.filter(n => !prevIds.has(n.id));
      
      if (newNotifications.length > 0) {
        console.log(`New notification received: ${newNotifications.length}`);
        // Play sound and show browser notification for each new notification
        newNotifications.forEach(notification => {
          playNotificationSound(notification.senderType);
          showBrowserNotification(notification);
        });
      }
    }
    
    set({ 
      notifications, 
      unseenCount, 
      previousNotificationCount: notifications.length 
    });
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
      
      if (unseenNotifications.length === 0) {
        console.log('No unseen notifications to mark');
        return;
      }
      
      console.log(`Marking ${unseenNotifications.length} notifications as seen`);
      
      const updatePromises = unseenNotifications.map(notification => 
        updateDoc(doc(db, 'admin_notifications', notification.id), {
          seen: true,
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state immediately
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, seen: true })),
        unseenCount: 0
      }));
      
      console.log('All notifications marked as seen successfully');
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
