import React, { useEffect, useState } from 'react';
import { Activity, Calendar, Clock, Users, ChevronRight, Star } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AppointmentForm } from './components/AppointmentForm';
import { AppointmentList } from './components/AppointmentList';
import { SignInForm } from './components/SignInForm';
import { AuthCallback } from './components/AuthCallback';
import { Appointment } from './domain/appointment';
import { AppointmentService } from './services/appointmentService';
import { AdminAppointmentList } from './components/AdminAppointmentList';

function App() {
  const [session, setSession] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Verificar si el usuario es administrador
      if (session?.user?.email === 'admin@example.com') { // Reemplaza con el email del kinesiólogo
        setIsAdmin(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email === 'admin@example.com') { // Reemplaza con el email del kinesiólogo
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadAppointments();
    }
  }, [session, isAdmin]);

  const loadAppointments = async () => {
    try {
      const appointments = isAdmin 
        ? await AppointmentService.getAllAppointments()
        : await AppointmentService.getUserAppointments(session.user.id);
      setAppointments(appointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Si estamos en la ruta de callback, mostrar el componente AuthCallback
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  const handleCancelAppointment = async (id: string) => {
    try {
      await AppointmentService.cancelAppointment(id);
      await loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const services = [
    {
      title: 'Physical Therapy',
      description: 'Personalized treatment plans to restore mobility and function',
      icon: Activity
    },
    {
      title: 'Sports Medicine',
      description: 'Specialized care for athletes and active individuals',
      icon: Users
    },
    {
      title: 'Rehabilitation',
      description: 'Comprehensive recovery programs for optimal results',
      icon: Clock
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      text: 'The care and attention I received was exceptional. My recovery exceeded all expectations.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      text: 'Professional staff and state-of-the-art facilities. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emma Davis',
      text: 'Life-changing results. I\'m back to my active lifestyle thanks to their expertise.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Transform Your Life Through</span>
            <span className="block text-blue-600">Movement & Healing</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Expert physiotherapy and rehabilitation services tailored to your unique needs. Start your journey to better health today.
          </p>
          <div id="auth-section" className="mt-10 flex gap-x-4 justify-center">
            {!session ? (
              <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Join Our Health Community
                </h2>
                <SignInForm />
                <p className="mt-6 text-center text-sm text-gray-500">
                  By signing up, you'll get access to:
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center justify-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      Easy appointment scheduling
                    </li>
                    <li className="flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      Appointment reminders
                    </li>
                    <li className="flex items-center justify-center">
                      <Activity className="h-4 w-4 mr-2 text-blue-500" />
                      Personalized treatment tracking
                    </li>
                  </ul>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <p className="text-lg text-gray-700">
                  Welcome back, {session.user.email}!
                </p>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                >
                  Sign Out
                  <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Section */}
      {session && (
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                {isAdmin ? 'Manage Appointments' : 'Book an Appointment'}
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                {isAdmin 
                  ? 'View and manage all patient appointments'
                  : 'Schedule your next session with our experts'}
              </p>
            </div>

            <div className="mt-12">
              {isAdmin ? (
                <AdminAppointmentList
                  appointments={appointments}
                  onStatusUpdate={loadAppointments}
                />
              ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">New Appointment</h3>
                    <AppointmentForm
                      userId={session.user.id}
                      onSuccess={loadAppointments}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Your Appointments</h3>
                    {loading ? (
                      <p className="text-center text-gray-500">Loading appointments...</p>
                    ) : (
                      <AppointmentList
                        appointments={appointments}
                        onCancel={handleCancelAppointment}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-4 text-lg text-gray-500">Comprehensive care for your physical well-being</p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="relative group">
                <div className="relative p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition duration-300">
                  <div className="inline-flex p-3 rounded-lg bg-blue-100 text-blue-600">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{service.title}</h3>
                  <p className="mt-2 text-gray-500">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Patient Testimonials</h2>
            <p className="mt-4 text-lg text-gray-500">What our patients say about their experience</p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
                <p className="mt-4 font-semibold text-gray-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start your journey?</span>
            <span className="block text-blue-200">Book your consultation today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <button 
                onClick={() => {
                  const element = document.querySelector('#auth-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                {session ? 'Book Appointment' : 'Get Started'}
                <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;