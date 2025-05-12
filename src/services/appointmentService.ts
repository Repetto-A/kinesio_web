import { supabase } from '../lib/supabase';
import { Appointment, CreateAppointment } from '../domain/appointment';
import { format } from 'date-fns';
import { NotificationService } from './notificationService';

export class AppointmentService {
  static async createAppointment(appointment: CreateAppointment): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        user_id: appointment.userId,
        service_type: appointment.serviceType,
        date: format(new Date(appointment.date), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        notes: appointment.notes,
        status: 'pending' // Estado inicial
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapAppointment(data);
  }

  static async getAllAppointments(): Promise<Appointment[]> {
    console.log('Obteniendo todas las citas...');
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        profile:user_id (
          first_name,
          last_name,
          email,
          sex,
          age,
          phone_number,
          clinical_notes
        )
      `)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error al obtener las citas:', error);
      throw new Error(error.message);
    }

    console.log('Datos crudos de citas:', data);

    if (!data) {
      console.log('No se encontraron citas');
      return [];
    }

    const mappedAppointments = data.map(this.mapAppointmentWithProfile);
    console.log('Citas mapeadas:', mappedAppointments);
    return mappedAppointments;
  }

  static async getUserAppointments(userId: string): Promise<Appointment[]> {
    console.log('Obteniendo citas del usuario:', userId);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        profile:user_id (
          first_name,
          last_name,
          email,
          sex,
          age,
          phone_number,
          clinical_notes
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error al obtener las citas del usuario:', error);
      throw new Error(error.message);
    }

    console.log('Datos crudos de citas del usuario:', data);

    if (!data) {
      console.log('No se encontraron citas para el usuario');
      return [];
    }

    const mappedAppointments = data.map(this.mapAppointmentWithProfile);
    console.log('Citas mapeadas del usuario:', mappedAppointments);
    return mappedAppointments;
  }

  static async updateAppointmentStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed'): Promise<void> {
    console.log('Iniciando updateAppointmentStatus:', { id, status });
    console.log('Tipo de ID:', typeof id, 'Longitud:', id.length);
    
    // Validación inicial de parámetros
    if (!id?.trim()) {
      const error = new Error('El ID de la cita es requerido');
      console.error('Error de validación:', error);
      throw error;
    }

    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      const error = new Error(`Estado no válido: ${status}`);
      console.error('Error de validación:', error);
      throw error;
    }

    const cleanId = id.trim();
    console.log('ID limpio a utilizar:', cleanId);

    try {
      // Verificar el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Usuario actual:', { id: user?.id, email: user?.email });

      if (userError) {
        console.error('Error al obtener usuario:', userError);
        throw new Error('Error de autenticación: ' + userError.message);
      }

      if (!user) {
        const error = new Error('Usuario no autenticado');
        console.error('Error de autenticación:', error);
        throw error;
      }

      // Verificar si la cita existe
      console.log('Buscando cita con ID:', cleanId);
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (appointmentError) {
        console.error('Error al buscar la cita:', appointmentError);
        throw new Error('Error al buscar la cita: ' + appointmentError.message);
      }

      if (!appointment) {
        const error = new Error(`No se encontró la cita con ID: ${cleanId}`);
        console.error('Error de búsqueda:', error);
        throw error;
      }

      console.log('Cita encontrada:', appointment);

      // Validar transición de estado
      if (appointment.status === status) {
        const error = new Error(`La cita ya está en estado: ${status}`);
        console.error('Error de estado:', error);
        throw error;
      }

      if (appointment.status === 'cancelled') {
        const error = new Error('No se puede modificar una cita cancelada');
        console.error('Error de estado:', error);
        throw error;
      }

      if (appointment.status === 'completed') {
        const error = new Error('No se puede modificar una cita completada');
        console.error('Error de estado:', error);
        throw error;
      }

      // Actualizar el estado
      console.log('Actualizando estado de la cita:', { id: cleanId, status });
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', cleanId);

      if (updateError) {
        console.error('Error al actualizar el estado:', updateError);
        throw new Error('Error al actualizar el estado: ' + updateError.message);
      }

      console.log('Estado actualizado correctamente');

      // Enviar notificación
      try {
        await NotificationService.createAppointmentNotification(
          appointment.user_id,
          'appointment_updated',
          appointment.date,
          appointment.service_type
        );
        console.log('Notificación enviada correctamente');
      } catch (error) {
        console.error('Error al enviar la notificación:', error);
        // No interrumpimos el flujo principal, pero registramos el error
      }
    } catch (error) {
      console.error('Error en updateAppointmentStatus:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al actualizar la cita');
    }
  }

  static async cancelAppointment(id: string): Promise<void> {
    // Primero obtener la cita actual
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Error fetching appointment: ${fetchError.message}`);
    }

    // Actualizar el estado
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Error cancelling appointment: ${updateError.message}`);
    }

    // Enviar notificación
    try {
      await NotificationService.createAppointmentNotification(
        appointment.user_id,
        'appointment_updated',
        appointment.date,
        appointment.service_type
      );
    } catch (error) {
      console.error('Error sending notification:', error);
      // No lanzamos el error aquí para no interrumpir el flujo principal
    }
  }

  private static mapAppointment(data: any): Appointment {
    if (!data) {
      throw new Error('No se pueden mapear datos nulos');
    }

    console.log('Mapeando cita simple:', data);
    return {
      id: data.id,
      userId: data.user_id,
      serviceType: data.service_type,
      date: data.date,
      status: data.status || 'pending',
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private static mapAppointmentWithProfile(data: any): Appointment {
    if (!data) {
      throw new Error('No se pueden mapear datos nulos');
    }

    console.log('Mapeando cita con perfil:', data);
    
    const profile = data.profile;
    const fullName = profile ? 
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
      'Unknown';

    return {
      id: data.id,
      userId: data.user_id,
      serviceType: data.service_type,
      date: data.date,
      status: data.status || 'pending',
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      patientName: fullName || 'Unknown',
      patientEmail: profile?.email || 'No email',
      patientSex: profile?.sex || null,
      patientAge: profile?.age || null,
      patientPhone: profile?.phone_number || null,
      clinicalNotes: profile?.clinical_notes || null
    };
  }
}