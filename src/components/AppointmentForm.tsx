import React, { useState, useRef } from 'react';
import { CreateAppointmentSchema } from '../domain/appointment';
import { AppointmentService } from '../services/appointmentService';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format, addMinutes, addMonths, parseISO, isAfter, isBefore } from 'date-fns';
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
  const formRef = useRef<HTMLFormElement>(null);

  const minDate = addMinutes(new Date(), 30);
  const maxDate = addMonths(new Date(), 3);

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setError(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Iniciando envío del formulario...');
      console.log('UserId recibido:', userId);

      if (!userId) {
        throw new Error('Error de autenticación: ID de usuario no disponible');
      }

      const formData = new FormData(e.currentTarget);
      const dateValue = formData.get('date') as string;
      const serviceType = formData.get('serviceType') as string;
      const notes = formData.get('notes') as string;
      
      console.log('Datos del formulario:', {
        dateValue,
        serviceType,
        notes
      });

      // Validaciones adicionales
      if (!serviceType) {
        throw new Error('Por favor seleccione un tipo de servicio');
      }

      if (!dateValue) {
        throw new Error('Por favor seleccione una fecha y hora para la cita');
      }

      // Convertir la fecha local a UTC ISO string
      const localDate = parseISO(dateValue);
      const formattedDate = localDate.toISOString();

      console.log('Fechas procesadas:', {
        localDate,
        formattedDate,
        minDate,
        maxDate
      });

      // Validar que la fecha esté dentro del rango permitido
      if (isBefore(localDate, minDate)) {
        throw new Error('La fecha seleccionada debe ser al menos 30 minutos en el futuro');
      }
      if (isAfter(localDate, maxDate)) {
        throw new Error('La fecha seleccionada no puede ser más de 3 meses en el futuro');
      }

      const appointmentData = {
        userId,
        serviceType,
        date: formattedDate,
        notes: notes || null
      };

      console.log('Datos de la cita a crear:', appointmentData);

      // Validar los datos usando el esquema
      const validatedData = CreateAppointmentSchema.parse(appointmentData);
      console.log('Datos validados:', validatedData);
      
      // Crear la cita
      console.log('Intentando crear la cita en Supabase...');
      try {
        const appointment = await AppointmentService.createAppointment(validatedData);
        console.log('Cita creada exitosamente:', appointment);
        resetForm();
        onSuccess();
      } catch (error: any) {
        console.error('Error detallado al crear la cita:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        });
        throw error;
      }
    } catch (err: any) {
      console.error('Error detallado al crear la cita:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        error: err
      });
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
          <option value="">Seleccione un servicio</option>
          <option value="Fisioterapia">Fisioterapia</option>
          <option value="Rehabilitación">Rehabilitación</option>
          <option value="Masaje Terapéutico">Masaje Terapéutico</option>
          <option value="Evaluación">Evaluación</option>
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Fecha y Hora
        </label>
        <input
          type="datetime-local"
          id="date"
          name="date"
          required
          min={format(minDate, "yyyy-MM-dd'T'HH:mm")}
          max={format(maxDate, "yyyy-MM-dd'T'HH:mm")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          La cita debe ser entre 30 minutos desde ahora y 3 meses en el futuro
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
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
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
        disabled={loading || !!error}
        className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Agendando...' : 'Agendar Cita'}
        <Calendar className="ml-2 h-4 w-4" />
      </button>
    </form>
  );
}