'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '@/app/actions/notifications';
import { supabase } from '@/lib/supabase/client';

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    };

    loadUnreadCount();

    // Supabase Realtime subscription for notifications
    if (supabase) {
      const notificationsChannel = supabase
        .channel('notifications_badge')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
          console.log('Notifications updated:', payload);
          // Reload count when notifications change
          void loadUnreadCount();
        })
        .subscribe((status) => {
          console.log('Notifications subscription status:', status);
        });

      return () => {
        notificationsChannel.unsubscribe();
      };
    }
  }, []);

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
}
