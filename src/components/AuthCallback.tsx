import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';

export function AuthCallback() {
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setMessage('Email verified successfully!');
        
        // Iniciar cuenta regresiva
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              window.location.href = '/';
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during verification');
      }
    };

    handleEmailConfirmation();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {error ? (
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-red-600 text-xl font-semibold mb-4">{error}</div>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="flex justify-center mb-6">
              <Activity className="h-12 w-12 text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{message}</h2>
            <p className="text-gray-600">
              Redirecting you in {countdown} seconds...
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 