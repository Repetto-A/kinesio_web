import { supabase } from '../lib/supabase';
import { Appointment, CreateAppointment } from '../domain/appointment';
import { format } from 'date-fns';

export class AppointmentService {
  static async createAppointment(appointment: CreateAppointment): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        user_id: appointment.userId,
        service_type: appointment.serviceType,
        date: format(new Date(appointment.date), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        notes: appointment.notes
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapAppointment(data);
  }

  static async getAllAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, profiles:user_id(full_name, email)')
      .order('date', { ascending: true });

    if (error) throw new Error(error.message);
    return data.map(this.mapAppointmentWithProfile);
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
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating appointment status:', error);
      throw new Error(`Error updating appointment status: ${error.message}`);
    }
  }

  static async cancelAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error(`Error cancelling appointment: ${error.message}`);
    }
  }

  private static mapAppointment(data: any): Appointment {
    return {
      id: data.id,
      userId: data.user_id,
      serviceType: data.service_type,
      date: data.date,
      status: data.status,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private static mapAppointmentWithProfile(data: any): Appointment {
    return {
      id: data.id,
      userId: data.user_id,
      serviceType: data.service_type,
      date: data.date,
      status: data.status,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      patientName: data.profiles?.full_name || 'Unknown',
      patientEmail: data.profiles?.email || 'No email'
    };
  }
}