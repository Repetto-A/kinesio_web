import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, Phone, FileText, UserPlus, Eye, EyeOff, ChevronDown } from 'lucide-react';

interface CountryCode {
  name: string;
  code: string;
  flag: string;
  prefix: string;
}

const countryCodes: CountryCode[] = [
  { name: 'Argentina', code: 'AR', flag: '🇦🇷', prefix: '+54' },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾', prefix: '+598' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱', prefix: '+56' },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾', prefix: '+595' },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴', prefix: '+591' },
  { name: 'Perú', code: 'PE', flag: '🇵🇪', prefix: '+51' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴', prefix: '+57' },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪', prefix: '+58' },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨', prefix: '+593' },
  { name: 'Brasil', code: 'BR', flag: '🇧🇷', prefix: '+55' },
  { name: 'México', code: 'MX', flag: '🇲🇽', prefix: '+52' },
  { name: 'España', code: 'ES', flag: '🇪🇸', prefix: '+34' },
];

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('');
  const [age, setAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]); // Argentina por defecto
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const validateEmail = (email: string) => {
    // Validación básica de email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      if (!trimmedEmail) {
        setError('El email es requerido');
        return;
      }

      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }

        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          return;
        }

        if (!firstName.trim() || !lastName.trim()) {
          setError('Por favor, completa todos los campos requeridos');
          return;
        }

        // Intentar el registro con el método más básico
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password.trim(),
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              sex: sex || null,
              age: age ? parseInt(age) : null,
              phone_number: phoneNumber ? `${selectedCountry.prefix}${phoneNumber.replace(/\D/g, '')}` : null,
              clinical_notes: clinicalNotes.trim() || null
            }
          }
        });

        if (error) {
          console.error('Error de registro:', error);
          if (error.message.includes('already registered')) {
            setError('Este email ya está registrado. Por favor, inicia sesión.');
          } else if (error.message.includes('password')) {
            setError('La contraseña debe tener al menos 6 caracteres');
          } else if (error.message.includes('email')) {
            setError('El email ingresado no es válido. Por favor, verifica el formato.');
          } else {
            setError(`Error al registrarse: ${error.message}`);
          }
          return;
        }

        if (data?.user) {
          setError('Por favor, revisa tu email para el enlace de verificación');
          // Limpiar el formulario
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setFirstName('');
          setLastName('');
          setSex('');
          setAge('');
          setPhoneNumber('');
          setClinicalNotes('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: trimmedEmail, 
          password: password.trim()
        });

        if (error) {
          console.error('Error de inicio de sesión:', error);
          if (error.message.includes('Invalid login credentials')) {
            setError('Email o contraseña incorrectos');
          } else {
            setError(`Error al iniciar sesión: ${error.message}`);
          }
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userData = user?.user_metadata;
    } catch (error: any) {
      console.error('Error inesperado:', error);
      setError('Ha ocurrido un error inesperado. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo permite números
    setPhoneNumber(value);
  };

  const formatPhoneNumber = (number: string) => {
    if (!number) return '';
    // Formatea el número según el país seleccionado
    const cleaned = number.replace(/\D/g, '');
    if (selectedCountry.code === 'AR') {
      // Formato argentino: 11-1234-5678
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return cleaned;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-4 mb-6">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError(null);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            !isSignUp
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:text-blue-600'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setError(null);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            isSignUp
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:text-blue-600'
          }`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            <Mail className="h-4 w-4 inline-block mr-1" />
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {isSignUp && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline-block mr-1" />
                  Nombre
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline-block mr-1" />
                  Apellido
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                <UserPlus className="h-4 w-4 inline-block mr-1" />
                Sexo
              </label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seleccionar sexo</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline-block mr-1" />
                  Edad
                </label>
                <input
                  id="age"
                  type="number"
                  min="0"
                  max="150"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 inline-block mr-1" />
                  Teléfono
                </label>
                <div className="mt-1 relative">
                  <div className="flex">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <span className="mr-2">{selectedCountry.flag}</span>
                        <span className="text-sm">{selectedCountry.prefix}</span>
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute z-10 mt-1 w-56 rounded-md bg-white shadow-lg">
                          <ul className="max-h-60 overflow-auto py-1 text-base">
                            {countryCodes.map((country) => (
                              <li
                                key={country.code}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setShowCountryDropdown(false);
                                }}
                              >
                                <div className="flex items-center">
                                  <span className="mr-2">{country.flag}</span>
                                  <span className="text-sm">{country.name}</span>
                                  <span className="ml-2 text-gray-500">{country.prefix}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <input
                      id="phoneNumber"
                      type="tel"
                      value={formatPhoneNumber(phoneNumber)}
                      onChange={handlePhoneChange}
                      placeholder={selectedCountry.code === 'AR' ? '11-1234-5678' : 'Número de teléfono'}
                      required
                      className="flex-1 block w-full rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="clinicalNotes" className="block text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4 inline-block mr-1" />
                Notas Clínicas
              </label>
              <textarea
                id="clinicalNotes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Condiciones médicas importantes, alergias u otra información de salud..."
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            <Lock className="h-4 w-4 inline-block mr-1" />
            Contraseña
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              <Lock className="h-4 w-4 inline-block mr-1" />
              Confirmar Contraseña
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className={`text-sm ${error.includes('revisa tu email') ? 'text-green-600' : 'text-red-600'}`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (isSignUp ? 'Registrando...' : 'Iniciando sesión...') : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
        </button>
      </form>
    </div>
  );
}