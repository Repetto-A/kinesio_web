import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export class NotificationService {
  static async createNotification(notification: NotificationInsert) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) {
        console.error('Error al crear notificación:', error);
        // Si la tabla no existe o hay un error de permisos, no interrumpimos el flujo
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error inesperado al crear notificación:', error);
      return null;
    }
  }

  static async getUserNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener notificaciones:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error inesperado al obtener notificaciones:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error al marcar notificación como leída:', error);
      }
    } catch (error) {
      console.error('Error inesperado al marcar notificación como leída:', error);
    }
  }

  static async sendTelegramNotification(notification: Notification) {
    // Solo enviar si está configurado TELEGRAM_BOT_TOKEN
    const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('Telegram not configured');
      return;
    }

    try {
      const message = `🔔 *${notification.title}*\n\n${notification.message}`;
      
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send Telegram notification');
      }

      // Marcar como enviado en Telegram
      await supabase
        .from('notifications')
        .update({ telegram_sent: true })
        .eq('id', notification.id);

    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  }

  // Método de utilidad para crear notificaciones de citas
  static async createAppointmentNotification(
    userId: string,
    type: 'appointment_created' | 'appointment_updated' | 'appointment_reminder',
    appointmentDate: string,
    serviceType: string
  ) {
    try {
      const titles = {
        appointment_created: 'Nueva Cita Programada',
        appointment_updated: 'Cita Actualizada',
        appointment_reminder: 'Recordatorio de Cita',
      };

      const messages = {
        appointment_created: `Se ha programado una nueva cita de ${serviceType} para ${new Date(appointmentDate).toLocaleString()}`,
        appointment_updated: `Tu cita de ${serviceType} ha sido actualizada para ${new Date(appointmentDate).toLocaleString()}`,
        appointment_reminder: `Recordatorio: Tienes una cita de ${serviceType} mañana a las ${new Date(appointmentDate).toLocaleString()}`,
      };

      const notification = await this.createNotification({
        user_id: userId,
        title: titles[type],
        message: messages[type],
        type,
      });

      if (notification) {
        // Intentar enviar por Telegram si está configurado
        await this.sendTelegramNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error al crear notificación de cita:', error);
      return null;
    }
  }
} 