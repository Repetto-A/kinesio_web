export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          user_id: string
          service_type: string
          date: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_type: string
          date: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_type?: string
          date?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'appointment_created' | 'appointment_updated' | 'appointment_reminder' | 'system'
          read: boolean
          telegram_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'appointment_created' | 'appointment_updated' | 'appointment_reminder' | 'system'
          read?: boolean
          telegram_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'appointment_created' | 'appointment_updated' | 'appointment_reminder' | 'system'
          read?: boolean
          telegram_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'user' | 'worker' | 'admin'
          first_name: string | null
          last_name: string | null
          sex: 'male' | 'female' | 'other' | null
          age: number | null
          phone_number: string | null
          clinical_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'user' | 'worker' | 'admin'
          first_name?: string | null
          last_name?: string | null
          sex?: 'male' | 'female' | 'other' | null
          age?: number | null
          phone_number?: string | null
          clinical_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'user' | 'worker' | 'admin'
          first_name?: string | null
          last_name?: string | null
          sex?: 'male' | 'female' | 'other' | null
          age?: number | null
          phone_number?: string | null
          clinical_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}