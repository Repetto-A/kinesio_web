import { useEffect, useState } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Sesión actual:', currentSession);
        setSession(currentSession);
        
        const adminEmail = process.env.ADMIN_EMAIL;
        console.log('Email de administrador configurado:', adminEmail);
        
        if (currentSession?.user?.email === adminEmail) {
          console.log('Usuario es administrador');
          setIsAdmin(true);
        } else {
          console.log('Usuario no es administrador');
          setIsAdmin(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log('Cambio en el estado de autenticación:', { event: _event, session });
          setSession(session);
          if (session?.user?.email === adminEmail) {
            console.log('Usuario es administrador (cambio de estado)');
            setIsAdmin(true);
          } else {
            console.log('Usuario no es administrador (cambio de estado)');
            setIsAdmin(false);
          }
        });

        setIsInitialized(true);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (session?.user && isInitialized) {
      console.log('Cargando citas para:', { 
        userEmail: session.user.email, 
        adminEmail: process.env.ADMIN_EMAIL,
        isAdmin 
      });
      loadAppointments();
    }
  }, [session, isAdmin, isInitialized]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carga de citas...', { isAdmin, userId: session?.user?.id });
      
      let appointments;
      if (isAdmin) {
        console.log('Cargando todas las citas (admin)');
        appointments = await AppointmentService.getAllAppointments();
      } else {
        console.log('Cargando citas del usuario');
        appointments = await AppointmentService.getUserAppointments(session.user.id);
      }
      
      console.log('Citas cargadas:', appointments);
      setAppointments(appointments);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
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
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-gradient" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32 relative">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl animate-fade-in">
              <span className="block">Transforma tu Vida a través del</span>
              <span className="block text-blue-600 animate-gradient-text">Movimiento & Sanación</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl animate-fade-in-up">
              Servicios expertos de fisioterapia y rehabilitación adaptados a tus necesidades únicas. Comienza tu viaje hacia una mejor salud hoy.
            </p>
            <div id="auth-section" className="mt-10 flex gap-x-4 justify-center animate-fade-in-up delay-200">
              {!session ? (
                <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Únete a Nuestra Comunidad de Salud
                  </h2>
                  <SignInForm />
                  <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Al registrarte, obtendrás acceso a:</p>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-center justify-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        Programación fácil de citas
                      </li>
                      <li className="flex items-center justify-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        Recordatorios de citas
                      </li>
                      <li className="flex items-center justify-center">
                        <Activity className="h-4 w-4 mr-2 text-blue-500" />
                        Seguimiento personalizado
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-lg text-gray-700">
                    ¡Bienvenido de nuevo, {session.user.email}!
                  </p>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transform hover:scale-105 transition-all duration-200"
                  >
                    Cerrar Sesión
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
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Cita</h3>
                      {session?.user?.id ? (
                        <AppointmentForm
                          userId={session.user.id}
                          onSuccess={loadAppointments}
                        />
                      ) : (
                        <div className="text-red-600 bg-red-50 p-4 rounded-md">
                          Error: No se pudo obtener el ID del usuario. Por favor, intenta iniciar sesión nuevamente.
                        </div>
                      )}
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
              <h2 className="text-3xl font-bold text-gray-900 animate-fade-in">Nuestros Servicios</h2>
              <p className="mt-4 text-lg text-gray-500 animate-fade-in-up">Cuidado integral para tu bienestar físico</p>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
              {services.map((service, index) => (
                <div 
                  key={service.title} 
                  className="relative group animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div className="inline-flex p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-300">
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
              <h2 className="text-3xl font-bold text-gray-900 animate-fade-in">Testimonios de Pacientes</h2>
              <p className="mt-4 text-lg text-gray-500 animate-fade-in-up">Lo que nuestros pacientes dicen sobre su experiencia</p>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.name} 
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
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
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl animate-fade-in">
              <span className="block">¿Listo para comenzar tu viaje?</span>
              <span className="block text-blue-200 animate-fade-in-up">Reserva tu consulta hoy.</span>
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
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
                >
                  {session ? 'Reservar Cita' : 'Comenzar'}
                  <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;