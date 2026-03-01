import { useState, useEffect } from 'react';
import { MailCheck, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { firebaseAuthService } from '../services/firebase';

interface EmailVerificationPageProps {
  oobCode: string;
  onVerificationComplete: () => void;
  onBackToLogin: () => void;
}

export function EmailVerificationPage({ oobCode, onVerificationComplete, onBackToLogin }: EmailVerificationPageProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async () => {
    if (!oobCode) {
      setStatus('error');
      setErrorMessage('Enlace de verificación inválido o inexistente.');
      return;
    }

    setStatus('verifying');
    try {
      await firebaseAuthService.verifyEmailWithCode(oobCode);
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'El enlace de verificación es inválido o ha expirado.');
    }
  };

  return (
    <div className="min-h-screen bg-black-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="elegante-card text-center relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-primary to-orange-secondary" />

          {status === 'idle' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-orange-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-10 h-10 text-orange-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white-primary mb-4">Verificación de Correo</h1>
              <p className="text-gray-lightest mb-8">
                Estás a un paso de activar tu cuenta. Haz clic en el botón de abajo para confirmar tu correo electrónico.
              </p>
              <button
                onClick={handleVerify}
                className="elegante-button-primary w-full flex items-center justify-center mb-4"
              >
                <span>Verificar mi cuenta</span>
                <CheckCircle className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}

          {status === 'verifying' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-orange-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-orange-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white-primary mb-4">Verificando cuenta...</h1>
              <p className="text-gray-lightest">Por favor espera mientras confirmamos tu correo electrónico.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white-primary mb-4">¡Correo verificado!</h1>
              <p className="text-gray-lightest mb-8">
                Tu cuenta ha sido activada correctamente. Ya puedes acceder a todas las funcionalidades del sistema.
              </p>
              <button
                onClick={onVerificationComplete}
                className="elegante-button-primary w-full flex items-center justify-center"
              >
                <span>Ir al inicio de sesión</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white-primary mb-4">Error de verificación</h1>
              <p className="text-gray-lightest mb-8">{errorMessage}</p>
              <button
                onClick={onBackToLogin}
                className="elegante-button-secondary w-full"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
