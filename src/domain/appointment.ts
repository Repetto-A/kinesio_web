import { z } from 'zod';
import { addMinutes, addMonths, isAfter, isBefore } from 'date-fns';

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  serviceType: z.string().min(1, 'El tipo de servicio es requerido'),
  date: z.string().datetime({ message: 'Por favor proporcione una fecha y hora válida' }),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  patientName: z.string().optional(),
  patientEmail: z.string().optional(),
  patientSex: z.enum(['male', 'female', 'other']).nullable().optional(),
  patientAge: z.number().nullable().optional(),
  patientPhone: z.string().nullable().optional(),
  clinicalNotes: z.string().nullable().optional()
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  serviceType: z.string().min(1, 'El tipo de servicio es requerido'),
  date: z.string()
    .datetime({ message: 'Por favor proporcione una fecha y hora válida' })
    .refine((dateStr) => {
      try {
        const date = new Date(dateStr);
        const now = new Date();
        const minDate = addMinutes(now, 30);
        const maxDate = addMonths(now, 3);

        return isAfter(date, minDate) && isBefore(date, maxDate);
      } catch {
        return false;
      }
    }, {
      message: 'La cita debe ser entre 30 minutos desde ahora y 3 meses en el futuro'
    }),
  notes: z.string().nullable().optional()
});

export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;