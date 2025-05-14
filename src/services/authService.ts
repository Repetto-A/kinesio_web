import { supabase } from '../lib/supabase';

export class AuthService {
  static async signUp(email: string, password: string, metadata: any) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        if (error.message.includes('password')) {
          throw new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en el registro:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verificar la fortaleza de la contraseña
      const { data: securityData, error: securityError } = await supabase
        .from('password_security')
        .select('password_strength_score, last_password_change')
        .eq('user_id', data.user.id)
        .single();

      if (!securityError && securityData) {
        if (securityData.password_strength_score < 3) {
          console.warn('Contraseña débil detectada');
        }
      }

      return data;
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      throw error;
    }
  }

  static async changePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes('password')) {
          throw new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      throw error;
    }
  }

  static async getPasswordSecurity() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('password_security')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener información de seguridad:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  static async setupMFA(type: 'totp' | 'sms' | 'email') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: type
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al configurar MFA:', error);
      throw error;
    }
  }

  static async verifyMFA(factorId: string, challengeId: string, code: string) {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
        challengeId
      });

      if (error) throw error;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (verifyError) throw verifyError;
      return verifyData;
    } catch (error) {
      console.error('Error al verificar MFA:', error);
      throw error;
    }
  }

  static async getMFAFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener factores MFA:', error);
      throw error;
    }
  }

  static async removeMFAFactor(factorId: string) {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error al eliminar factor MFA:', error);
      throw error;
    }
  }

  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error al obtener la sesión:', error);
      throw error;
    }
  }

  static async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      throw error;
    }
  }
} 