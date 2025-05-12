import React, { useState } from 'react';
import { Appointment } from '../domain/appointment';
import { format, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, FileText, Check, X, Filter, Mail, User } from 'lucide-react';
import { AppointmentService } from '../services/appointmentService';

interface AdminAppointmentListProps {
  appointments: Appointment[];
  onStatusUpdate: () => void;
}

export function AdminAppointmentList({ appointments, onStatusUpdate }: AdminAppointmentListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-800' };
      default:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return 'Pendiente';
    }
  };

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    console.log('Iniciando actualización de cita:', { id, status });
    setLoading(id);
    setError(null);
    
    if (!id) {
      const errorMsg = 'ID de cita no válido';
      console.error(errorMsg);
      setError(errorMsg);
      setLoading(null);
      return;
    }

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      const errorMsg = 'Estado de cita no válido';
      console.error(errorMsg, status);
      setError(errorMsg);
      setLoading(null);
      return;
    }

    try {
      console.log('Llamando a updateAppointmentStatus con:', { id, status });
      await AppointmentService.updateAppointmentStatus(id, status);
      console.log('Cita actualizada exitosamente:', { id, status });
      onStatusUpdate();
    } catch (error) {
      console.error('Error detallado al actualizar el estado de la cita:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        errorStack: error instanceof Error ? error.stack : undefined,
        id,
        status
      });
      
      // Manejar el error y mostrar mensaje apropiado
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al actualizar el estado de la cita');
      }
      
      // Reproducir sonido de error (opcional)
      try {
        const errorSound = new Audio('/sounds/error.mp3');
        await errorSound.play();
      } catch (audioError) {
        // Ignorar errores de reproducción de audio
        console.log('No se pudo reproducir el sonido de error');
      }
    } finally {
      setLoading(null);
    }
  };

  const filteredAppointments = appointments
    .filter(appointment => {
      if (statusFilter === 'all') return true;
      return appointment.status === statusFilter;
    })
    .filter(appointment => {
      const appointmentDate = parseISO(appointment.date);
      const today = startOfDay(new Date());
      
      switch (dateFilter) {
        case 'past':
          return isBefore(appointmentDate, today);
        case 'today':
          return isBefore(appointmentDate, endOfDay(today)) && 
                 isAfter(appointmentDate, startOfDay(today));
        case 'upcoming':
          return isAfter(appointmentDate, today);
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Componente para mostrar el error
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="text-red-600 text-sm bg-red-50 p-4 rounded-md mb-4 flex items-center">
      <X className="h-5 w-5 mr-2" />
      <span>{message}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Filter className="h-4 w-4 inline-block mr-1" />
            Filtrar por Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="completed">Completadas</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="h-4 w-4 inline-block mr-1" />
            Filtrar por Fecha
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todas las Fechas</option>
            <option value="past">Pasadas</option>
            <option value="today">Hoy</option>
            <option value="upcoming">Próximas</option>
          </select>
        </div>
      </div>

      {filteredAppointments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const statusColors = getStatusColor(appointment.status);
            const isLoading = loading === appointment.id;
            
            console.log('Renderizando cita:', { 
              id: appointment.id, 
              status: appointment.status,
              serviceType: appointment.serviceType
            });
            
            return (
              <div
                key={appointment.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg text-gray-900">
                      {appointment.serviceType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors.bg} ${statusColors.text}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>{appointment.patientName}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{appointment.patientEmail}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(parseISO(appointment.date), 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{format(parseISO(appointment.date), 'h:mm a')}</span>
                    </div>
                  </div>

                  <div>
                    {appointment.notes && (
                      <div className="flex items-start text-gray-600">
                        <FileText className="h-4 w-4 mr-2 mt-1" />
                        <span className="text-sm">{appointment.notes}</span>
                      </div>
                    )}
                  </div>

                  {appointment.status === 'pending' && (
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isLoading ? 'Confirmando...' : 'Confirmar'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {isLoading ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  )}

                  {appointment.status === 'confirmed' && (
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isLoading ? 'Completando...' : 'Marcar como Completada'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron citas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Intenta cambiar los filtros para ver más citas'
              : 'No hay citas programadas aún'}
          </p>
        </div>
      )}
    </div>
  );
} 