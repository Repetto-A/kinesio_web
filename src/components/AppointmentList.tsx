import React, { useState } from 'react';
import { Appointment } from '../domain/appointment';
import { format, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Calendar, Clock, FileText, X, Filter, ChevronDown } from 'lucide-react';

interface AppointmentListProps {
  appointments: Appointment[];
  onCancel: (id: string) => void;
}

export function AppointmentList({ appointments, onCancel }: AppointmentListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');

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
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{format(parseISO(appointment.date), 'h:mm a')}</span>
                    </div>

                    {appointment.notes && (
                      <div className="flex items-start text-gray-600 mt-2">
                        <FileText className="h-4 w-4 mr-2 mt-1" />
                        <span className="text-sm">{appointment.notes}</span>
                      </div>
                    )}
                  </div>

                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => onCancel(appointment.id)}
                      className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                      title="Cancel appointment"
                    >
                      <X className="h-5 w-5" />
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