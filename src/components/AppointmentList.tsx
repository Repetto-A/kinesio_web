import React, { useState } from 'react';
import { Appointment } from '../domain/appointment';
import { format, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Calendar, Clock, FileText, X, Filter, ChevronDown } from 'lucide-react';
import { es } from 'date-fns/locale';

interface AppointmentListProps {
  appointments: Appointment[];
  onCancel: (id: string) => void;
}

export function AppointmentList({ appointments, onCancel }: AppointmentListProps) {
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

  const handleCancel = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await onCancel(id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cancelar la cita');
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
    .sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  console.log('Citas filtradas finales:', filteredAppointments.map(cita => ({
    id: cita.id,
    status: cita.status,
    date: cita.date
  })));

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-md mb-4 flex items-center">
          <X className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

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
            const appointmentDate = parseISO(appointment.date);
            const canCancel = isAfter(appointmentDate, new Date()) && 
                            (appointment.status === 'pending' || appointment.status === 'confirmed');
            const isLoading = loading === appointment.id;
            
            console.log('Renderizando cita:', {
              id: appointment.id,
              status: appointment.status,
              date: appointment.date,
              canCancel
            });
            
            return (
              <div
                key={appointment.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg text-gray-900">
                        {appointment.serviceType}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors.bg} ${statusColors.text}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(appointmentDate, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{format(appointmentDate, 'h:mm a')}</span>
                    </div>

                    {appointment.notes && (
                      <div className="flex items-start text-gray-600 mt-2">
                        <FileText className="h-4 w-4 mr-2 mt-1" />
                        <span className="text-sm">{appointment.notes}</span>
                      </div>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      disabled={isLoading}
                      className="ml-4 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancelar cita"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                    </button>
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
              : 'Aún no se han programado citas'}
          </p>
        </div>
      )}
    </div>
  );
}