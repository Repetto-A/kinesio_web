import React, { useState } from 'react';
import { Appointment } from '../domain/appointment';
import { format, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
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

  const handleStatusUpdate = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    setLoading(id);
    try {
      await AppointmentService.updateAppointmentStatus(id, status);
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating appointment status:', error);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Filter className="h-4 w-4 inline-block mr-1" />
            Status Filter
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="h-4 w-4 inline-block mr-1" />
            Date Filter
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Dates</option>
            <option value="past">Past</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      {filteredAppointments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const statusColors = getStatusColor(appointment.status);
            const isLoading = loading === appointment.id;
            
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
                      {appointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <span>{format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}</span>
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
                  </div>

                  {appointment.status === 'pending' && (
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
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
                        Mark as Completed
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Try changing your filters to see more appointments'
              : 'No appointments have been scheduled yet'}
          </p>
        </div>
      )}
    </div>
  );
} 