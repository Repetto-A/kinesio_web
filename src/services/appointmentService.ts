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
        profiles:user_id (
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
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw new Error(error.message);
    return data.map(this.mapAppointment);
  }

  static async updateAppointmentStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed'): Promise<void> {
    console.log('Actualizando estado de cita:', { id, status });
    
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('El ID de la cita es requerido y debe ser un string válido');
    }

    // Primero obtener la cita actual con información del perfil
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id.trim())
      .limit(2); // Obtenemos hasta 2 para verificar si hay duplicados

    console.log('Resultado de la búsqueda:', { appointments, fetchError });

    if (fetchError) {
      console.error('Error al obtener la cita:', fetchError);
      throw new Error(`Error al obtener la cita: ${fetchError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      console.error('No se encontró la cita con ID:', id);
      throw new Error('No se encontró la cita especificada');
    }

    if (appointments.length > 1) {
      console.error('Múltiples citas encontradas:', appointments);
      throw new Error('Se encontraron múltiples citas con el mismo ID. Por favor, contacte al administrador');
    }

    const appointment = appointments[0];
    console.log('Cita encontrada:', appointment);

    // Validar transición de estado
    if (appointment.status === 'cancelled') {
      throw new Error('No se puede modificar una cita cancelada');
    }

    if (appointment.status === 'completed') {
      throw new Error('No se puede modificar una cita completada');
    }

    // Actualizar el estado
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id.trim());

    if (updateError) {
      console.error('Error al actualizar el estado:', updateError);
      throw new Error(`Error al actualizar el estado de la cita: ${updateError.message}`);
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
    
    const fullName = data.profiles ? 
      `${data.profiles.first_name || ''} ${data.profiles.last_name || ''}`.trim() : 
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
      patientEmail: data.profiles?.email || 'No email',
      patientSex: data.profiles?.sex || null,
      patientAge: data.profiles?.age || null,
      patientPhone: data.profiles?.phone_number || null,
      clinicalNotes: data.profiles?.clinical_notes || null
    };
  }
}