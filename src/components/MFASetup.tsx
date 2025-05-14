import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { Shield, Smartphone, Mail, Key } from 'lucide-react';

export function MFASetup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [factors, setFactors] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'totp' | 'sms' | 'email'>('totp');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    try {
      const data = await AuthService.getMFAFactors();
      setFactors(data.all || []);
    } catch (error) {
      console.error('Error al cargar factores MFA:', error);
    }
  };

  const handleSetupMFA = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await AuthService.setupMFA(selectedType);
      
      if (selectedType === 'totp' && data.totp_uri) {
        setQrCode(data.totp_uri);
      } else {
        setSuccess('Se ha enviado un código de verificación a tu dispositivo');
      }
    } catch (error: any) {
      setError(error.message || 'Error al configurar MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const factor = factors.find(f => f.type === selectedType);
      if (!factor) throw new Error('Factor no encontrado');

      await AuthService.verifyMFA(factor.id, factor.challenge_id, verificationCode);
      setSuccess('MFA configurado exitosamente');
      setQrCode(null);
      setVerificationCode('');
      await loadFactors();
    } catch (error: any) {
      setError(error.message || 'Error al verificar MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFactor = async (factorId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await AuthService.removeMFAFactor(factorId);
      setSuccess('Factor MFA eliminado exitosamente');
      await loadFactors();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar factor MFA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Shield className="h-6 w-6 mr-2 text-blue-500" />
        Configuración de Autenticación de Dos Factores
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona un método de autenticación
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedType('totp')}
              className={`p-4 rounded-lg border ${
                selectedType === 'totp'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
            >
              <Key className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm">Aplicación</span>
            </button>
            <button
              onClick={() => setSelectedType('sms')}
              className={`p-4 rounded-lg border ${
                selectedType === 'sms'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
            >
              <Smartphone className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm">SMS</span>
            </button>
            <button
              onClick={() => setSelectedType('email')}
              className={`p-4 rounded-lg border ${
                selectedType === 'email'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
            >
              <Mail className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm">Email</span>
            </button>
          </div>
        </div>

        {qrCode && (
          <div className="text-center">
            <img src={qrCode} alt="QR Code" className="mx-auto mb-4" />
            <p className="text-sm text-gray-600">
              Escanea este código QR con tu aplicación de autenticación
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código de verificación
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ingresa el código"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSetupMFA}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Configurando...' : 'Configurar MFA'}
          </button>
          <button
            onClick={handleVerifyMFA}
            disabled={loading || !verificationCode}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
      </div>

      {factors.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Factores configurados
          </h3>
          <div className="space-y-2">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center">
                  {factor.type === 'totp' && <Key className="h-5 w-5 mr-2" />}
                  {factor.type === 'sms' && <Smartphone className="h-5 w-5 mr-2" />}
                  {factor.type === 'email' && <Mail className="h-5 w-5 mr-2" />}
                  <span className="text-sm">
                    {factor.type === 'totp' && 'Aplicación de autenticación'}
                    {factor.type === 'sms' && 'SMS'}
                    {factor.type === 'email' && 'Email'}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFactor(factor.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 