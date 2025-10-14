'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { NotificationsDialog } from '@/components/notifications-dialog';
import { useRealtimeNotificationStore, useRealtimeNotifications } from '@/stores/realtime-notification-store';

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unseenCount } = useRealtimeNotificationStore();
  
  // Setup realtime listener
  useRealtimeNotifications();

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unseenCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
              >
                {unseenCount > 99 ? '99+' : unseenCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      <NotificationsDialog 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </>
  );
}
