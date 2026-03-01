import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../../../shared/components/ui/input';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Eye, EyeOff, Scissors, User, Lock, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { PasswordResetPage } from './PasswordResetPage';

export function LoginPageSimplified() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot-password' | 'password-reset'>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [resetEmail, setResetEmail] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      if (!success) {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
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

  const handlePasswordReset = (email: string, token: string) => {
    setResetEmail(email);
    setResetToken(token);
    setCurrentView('password-reset');
  };

  const handlePasswordResetComplete = () => {
    setCurrentView('login');
    setResetToken('');
    setResetEmail('');
    // Mostrar mensaje de éxito (opcional)
    alert('Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.');
  };

  // Renderizar vistas según el estado actual
  if (currentView === 'register') {
    return <RegisterPage onBack={handleBackToLogin} />;
  }

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
    <div className="min-h-screen bg-black-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-primary to-orange-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 elegante-shadow-lg">
            <Scissors className="w-10 h-10 text-black-primary" />
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

            <Button
              type="submit"
              disabled={isLoading}
              className="elegante-button-primary w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>

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
                onClick={() => setCurrentView('register')}
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
