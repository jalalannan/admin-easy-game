'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Volume2, VolumeX, Play, Settings, Bell, BellOff } from 'lucide-react';

interface SoundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SoundSettings({ isOpen, onClose }: SoundSettingsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(50);
  const [testingSound, setTestingSound] = useState<string | null>(null);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Load settings from localStorage
  useEffect(() => {
    const savedEnabled = localStorage.getItem('notificationSoundEnabled');
    const savedVolume = localStorage.getItem('notificationVolume');
    const savedBrowserNotifications = localStorage.getItem('browserNotificationsEnabled');
    
    if (savedEnabled !== null) {
      setSoundEnabled(JSON.parse(savedEnabled));
    }
    if (savedVolume !== null) {
      setVolume(JSON.parse(savedVolume));
    }
    if (savedBrowserNotifications !== null) {
      setBrowserNotificationsEnabled(JSON.parse(savedBrowserNotifications));
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationVolume', JSON.stringify(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('browserNotificationsEnabled', JSON.stringify(browserNotificationsEnabled));
  }, [browserNotificationsEnabled]);

  const testSound = async (senderType: 'student' | 'tutor' | 'admin' | 'default') => {
    setTestingSound(senderType);
    
    try {
      // Create a test audio context
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
      
      const volumeLevel = volume / 100;
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volumeLevel * 0.2, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(volumeLevel * 0.2, audioContext.currentTime + 0.11);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      console.log(`Testing ${senderType} notification sound`);
    } catch (error) {
      console.error('Error testing sound:', error);
    } finally {
      setTimeout(() => setTestingSound(null), 500);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Show a test notification
        const testNotification = new Notification('Test Notification', {
          body: 'Browser notifications are now enabled!',
          icon: '/notification-icon.svg',
          tag: 'test-notification'
        });
        
        setTimeout(() => testNotification.close(), 3000);
      } else if (permission === 'denied') {
        alert('Notification permission denied. Please enable it in your browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Error requesting notification permission');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Sound Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sound Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sound-enabled">Enable Notification Sounds</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds when new notifications arrive
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          {/* Volume Control */}
          {soundEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume">Volume</Label>
                <div className="flex items-center gap-2">
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span className="text-sm text-muted-foreground">{volume}%</span>
                </div>
              </div>
              <Slider
                id="volume"
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          )}

          {/* Browser Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show pop-up notifications even when tab is not active
                </p>
              </div>
              <Switch
                id="browser-notifications"
                checked={browserNotificationsEnabled}
                onCheckedChange={setBrowserNotificationsEnabled}
                disabled={notificationPermission === 'denied'}
              />
            </div>
            
            {notificationPermission === 'default' && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestNotificationPermission}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Enable Browser Notifications
              </Button>
            )}
            
            {notificationPermission === 'denied' && (
              <Alert>
                <BellOff className="h-4 w-4" />
                <AlertDescription>
                  Browser notifications are blocked. Please enable them in your browser settings.
                </AlertDescription>
              </Alert>
            )}
            
            {notificationPermission === 'granted' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Bell className="h-4 w-4" />
                Browser notifications are enabled
              </div>
            )}
          </div>

          {/* Sound Testing */}
          {soundEnabled && (
            <div className="space-y-3">
              <Label>Test Sounds</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('student')}
                  disabled={testingSound !== null}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Student
                  {testingSound === 'student' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('tutor')}
                  disabled={testingSound !== null}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Tutor
                  {testingSound === 'tutor' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('admin')}
                  disabled={testingSound !== null}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Admin
                  {testingSound === 'admin' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('default')}
                  disabled={testingSound !== null}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Default
                  {testingSound === 'default' && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertDescription>
              <strong>Custom Sounds:</strong> Place MP3 files in <code>/public/sounds/</code> directory:
              <br />• tutor-notification.mp3
              <br />• student-notification.mp3
              <br />• admin-notification.mp3
              <br />• default-notification.mp3
            </AlertDescription>
          </Alert>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
