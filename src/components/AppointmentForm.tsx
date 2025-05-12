import React, { useState, useRef } from 'react';
import { CreateAppointmentSchema } from '../domain/appointment';
import { AppointmentService } from '../services/appointmentService';
import { NotificationService } from '../services/notificationService';
import { Calendar, CheckCircle } from 'lucide-react';
import { format, addMinutes, addMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ZodError } from 'zod';

interface AppointmentFormProps {
  userId: string;
  onSuccess: () => void;
}

export function AppointmentForm({ userId, onSuccess }: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Establecer fecha mínima (30 minutos desde ahora) y máxima (3 meses desde ahora)
  const now = new Date();
  const minDate = addMinutes(now, 30);
  const maxDate = addMonths(now, 3);
  
  const minDateTime = format(minDate, "yyyy-MM-dd'T'HH:mm");
  const maxDateTime = format(maxDate, "yyyy-MM-dd'T'HH:mm");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);
    setError(null);
    setSuccess(false);
  };

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
      setSelectedDate('');
    }
    setError(null);
    setSuccess(true);
    // Ocultar el mensaje de éxito después de 3 segundos
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const dateValue = formData.get('date') as string;
      const serviceType = formData.get('serviceType') as string;
      
      // Validar que la fecha no esté vacía
      if (!dateValue) {
        throw new Error('Por favor seleccione una fecha y hora para la cita');
      }

      // Convertir la fecha local a UTC ISO string
      const localDate = parseISO(dateValue);
      const formattedDate = localDate.toISOString();

      const appointmentData = {
        userId,
        serviceType,
        date: formattedDate,
        notes: formData.get('notes') as string || null
      };

      // Validar los datos usando el esquema
      const validatedData = CreateAppointmentSchema.parse(appointmentData);
      
      // Crear la cita
      const appointment = await AppointmentService.createAppointment(validatedData);

      // Crear notificación
      await NotificationService.createAppointmentNotification(
        userId,
        'appointment_created',
        formattedDate,
        serviceType
      );

      resetForm();
      onSuccess();
    } catch (err) {
      if (err instanceof ZodError) {
        // Manejar errores de validación de Zod
        setError(err.errors.map(e => e.message).join(', '));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ha ocurrido un error al validar los datos de la cita');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
          Tipo de Servicio
        </label>
        <select
          id="serviceType"
          name="serviceType"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Seleccionar servicio</option>
          <option value="Physical Therapy">Fisioterapia</option>
          <option value="Sports Medicine">Medicina Deportiva</option>
          <option value="Rehabilitation">Rehabilitación</option>
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Fecha y Hora de la Cita
        </label>
        <input
          type="datetime-local"
          id="date"
          name="date"
          value={selectedDate}
          onChange={handleDateChange}
          required
          min={minDateTime}
          max={maxDateTime}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Por favor seleccione una fecha y hora entre {format(minDate, 'PPP p', { locale: es })} y {format(maxDate, 'PPP', { locale: es })}
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Información adicional o requerimientos especiales..."
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          ¡Cita agendada exitosamente!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Agendando...' : 'Agendar Cita'}
        <Calendar className="ml-2 h-4 w-4" />
      </button>
    </form>
  );
}