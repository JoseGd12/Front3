import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Eye, EyeOff, Lock, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { PasswordResetPage } from './PasswordResetPage';
import { SimpleCaptcha } from './captcha';
import logo from '../assets/a51cd14e3664f3752eaa436dadb14492d91e40aa.png';

interface LoginPageProps {
  onRequestRegister?: () => void;
  onBackToLanding?: () => void;
  initialResetData?: { email: string; token: string } | null;
  onResetComplete?: () => void;
}

export function LoginPage({ onRequestRegister, onBackToLanding, initialResetData, onResetComplete }: LoginPageProps) {
  const { login, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'login' | 'forgot-password' | 'password-reset'>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [captchaValidated, setCaptchaValidated] = useState<boolean>(false);

  // Efecto para manejar redirección desde email de recuperación
  useEffect(() => {
    if (initialResetData && initialResetData.token) {
      console.log('🔄 Inbox reset detected, switching to reset view');
      setResetToken(initialResetData.token);
      setResetEmail(initialResetData.email);
      setCurrentView('password-reset');
      setCaptchaValidated(true); // Saltamos captcha para el flujo de reset desde link
    }
  }, [initialResetData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar que el captcha esté validado
    if (!captchaValidated) {
      setError('Completa la verificación "No soy un robot" para continuar');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // El sistema detectará automáticamente el rol del usuario desde la API
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setError(result.error || 'Credenciales inválidas');
        setCaptchaValidated(false); // Resetear captcha en login fallido
      }
    } catch (err) {
      setError('Error al iniciar sesión');
      setCaptchaValidated(false); // Resetear captcha en error
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
    setError('');
    setResetToken('');
    setResetEmail('');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // El sistema detectará automáticamente el rol del usuario desde la API
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || 'Error con Google Sign-In');
      }
    } catch (err) {
      setError('Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaValidation = (isValid: boolean) => {
    setCaptchaValidated(isValid);
  };

  const handlePasswordReset = (email: string, token: string) => {
    setResetEmail(email);
    setResetToken(token);
    setCurrentView('password-reset');
  };

  const handlePasswordResetComplete = () => {
    setCurrentView('login');
    setResetToken('');
    setResetEmail('');
    if (onResetComplete) onResetComplete();
    // Mostrar mensaje de éxito
    alert('Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.');
  };

  if (currentView === 'forgot-password') {
    return <ForgotPasswordPage onBack={handleBackToLogin} onPasswordReset={handlePasswordReset} />;
  }

  if (currentView === 'password-reset') {
    return (
      <PasswordResetPage
        token={resetToken}
        email={resetEmail}
        onComplete={handlePasswordResetComplete}
        onBack={handleBackToLogin}
      />
    );
  }

  // Vista principal de login
  return (
    <div className="min-h-screen bg-black-primary flex items-center justify-center p-4 relative">

      <div className="w-full max-w-sm">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 elegante-shadow-lg relative overflow-hidden">
            <img
              src={logo}
              alt="Edwin's Barbería Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white-primary mb-2">
            EDWINS BARBER
          </h1>
          <p className="text-gray-lightest">
            Sistema de Gestión Integral
          </p>
        </div>

        {/* Formulario principal de login */}
        <div className="elegante-card mb-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-900/20 border border-red-600/30">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white-primary">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="elegante-input pl-10"
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white-primary">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tu contraseña"
                  className="elegante-input pl-10 pr-10"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-lighter hover:text-white-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Captcha de seguridad - Siempre visible */}
            <div className="mt-6">
              <SimpleCaptcha
                onValidate={handleCaptchaValidation}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !captchaValidated}
              className={`elegante-button-primary w-full flex items-center justify-center ${!captchaValidated ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                <>

                  Iniciar Sesión
                </>
              )}
            </Button>

            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className=" top-6 left-6 text-sm text-gray-lightest hover:text-white-primary flex items-center gap-2"
                style={{ marginBottom: '4px' }}
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Volver al inicio
              </button>
            )}

            {/* Botón de Google Sign-In */}
            <div className="mt-4">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-gray-600 hover:bg-gray-800"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </Button>
            </div>

            {/* Enlaces de soporte */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setCurrentView('forgot-password')}
                className="text-sm text-orange-primary hover:text-orange-secondary transition-colors underline"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <button
                type="button"
                onClick={onRequestRegister}
                className="text-sm text-orange-primary hover:text-orange-secondary transition-colors underline"
              >
                Registrarse
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}