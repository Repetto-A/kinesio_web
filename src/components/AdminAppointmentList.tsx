import React, { useState } from 'react';
import { Appointment } from '../domain/appointment';
import { format, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, FileText, Check, X, Filter, Mail, User, RotateCcw } from 'lucide-react';
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

  console.log('AdminAppointmentList - Citas recibidas:', appointments);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
      default:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
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

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed' | 'pending') => {
    setLoading(id);
    setError(null);
    
    try {
      console.log('Iniciando actualización de estado:', { id, status });
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) throw new Error('Cita no encontrada');

      console.log('Cita encontrada:', appointment);
      await AppointmentService.updateAppointmentStatus(id, status);
      console.log('Estado actualizado correctamente');
      onStatusUpdate();
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar el estado');
    } finally {
      setLoading(null);
    }
  };

  const handleUndo = async (id: string) => {
    setLoading(id);
    setError(null);
    
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) throw new Error('Cita no encontrada');

      await AppointmentService.updateAppointmentStatus(id, 'pending');
      onStatusUpdate();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al deshacer la acción');
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
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  console.log('AdminAppointmentList - Citas filtradas:', filteredAppointments);

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-md mb-4 flex items-center animate-fade-in">
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
          >
            <option value="all">Todas las Fechas</option>
            <option value="past">Pasadas</option>
            <option value="today">Hoy</option>
            <option value="upcoming">Próximas</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => {
          const statusColors = getStatusColor(appointment.status);
          const isLoading = loading === appointment.id;
          const appointmentDate = parseISO(appointment.date);
          const canUndo = isAfter(appointmentDate, new Date()) && 
                         (appointment.status === 'confirmed' || appointment.status === 'cancelled');
          
          return (
            <div
              key={appointment.id}
              className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-all duration-300 border ${statusColors.border}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg text-gray-900">
                    {appointment.serviceType}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors.bg} ${statusColors.text} transition-all duration-200`}>
                      {getStatusText(appointment.status)}
                    </span>
                    {canUndo && (
                      <button
                        onClick={() => handleUndo(appointment.id)}
                        disabled={isLoading}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Deshacer
                      </button>
                    )}
                  </div>
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
                    <span>{format(appointmentDate, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es })}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{format(appointmentDate, 'h:mm a')}</span>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="flex items-start text-gray-600">
                    <FileText className="h-4 w-4 mr-2 mt-1" />
                    <span className="text-sm">{appointment.notes}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {isLoading ? 'Confirmando...' : 'Confirmar'}
                    </button>
                  )}
                  
                  {appointment.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {isLoading ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {isLoading ? 'Completando...' : 'Marcar como Completada'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 