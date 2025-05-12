import React, { useEffect, useState } from 'react';
import { NotificationService } from '../services/notificationService';
import { Database } from '../types/supabase';
import { Bell, Check } from 'lucide-react';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationListProps {
  userId: string;
}

export function NotificationList({ userId }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      const data = await NotificationService.getUserNotifications(userId);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId, userId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando notificaciones...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No tienes notificaciones
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border ${
            notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Bell className={`h-5 w-5 ${notification.read ? 'text-gray-400' : 'text-blue-500'}`} />
              <h3 className={`ml-2 font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                {notification.title}
              </h3>
            </div>
            {!notification.read && (
              <button
                onClick={() => handleMarkAsRead(notification.id)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                Marcar como leída
              </button>
            )}
          </div>
          <p className={`mt-2 text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            {new Date(notification.created_at).toLocaleString()}
            {notification.telegram_sent && (
              <span className="ml-2 text-green-600">✓ Enviado por Telegram</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 