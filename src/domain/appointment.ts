import { z } from 'zod';
import { addMinutes, addMonths, isAfter, isBefore } from 'date-fns';

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  serviceType: z.string().min(1, 'Service type is required'),
  date: z.string().datetime({ message: 'Please provide a valid date and time' }),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  patientName: z.string().optional(),
  patientEmail: z.string().optional()
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentSchema = z.object({
  userId: z.string().uuid(),
  serviceType: z.string().min(1, 'Service type is required'),
  date: z.string()
    .datetime({ message: 'Please provide a valid date and time' })
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
      message: 'Appointment must be between 30 minutes from now and 3 months in the future'
    }),
  notes: z.string().nullable()
});

export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;