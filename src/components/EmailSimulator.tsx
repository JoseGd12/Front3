import { useState } from 'react';
import { Button } from './ui/button';
import { Shield, Clock, ArrowRight, Mail, CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';

interface EmailSimulatorProps {
  userEmail: string;
  onClose: () => void;
}

export function EmailSimulator({ userEmail, onClose }: EmailSimulatorProps) {
  const [copied, setCopied] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // Generar un token simulado para el enlace
  const resetToken = 'sim_' + Math.random().toString(36).substr(2, 16);
  const resetLink = `https://elitebarbershop.com/reset-password?token=${resetToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = resetLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 6) {
      return;
    }

    setIsResetting(true);
    
    // Simular proceso de cambio de contraseña
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsResetting(false);
    setResetComplete(true);
  };

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-black-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="elegante-card text-center">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white-primary mb-4">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-gray-lightest mb-6">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button 
              onClick={onClose}
              className="elegante-button-primary w-full"
            >
              Volver al Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-black-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="elegante-card">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white-primary mb-2">
                Restablecer Contraseña
              </h1>
              <p className="text-gray-lightest">
                Crea una nueva contraseña segura para tu cuenta
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white-primary font-medium">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="elegante-input w-full"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label className="text-white-primary font-medium">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className="elegante-input w-full"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-sm">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="bg-orange-primary/10 p-4 rounded-lg border border-orange-primary/20">
                <h4 className="text-orange-primary font-medium mb-2">Requisitos de seguridad:</h4>
                <ul className="text-sm text-gray-lightest space-y-1">
                  <li className={newPassword.length >= 6 ? 'text-green-400' : ''}>
                    • Mínimo 6 caracteres
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? 'text-green-400' : ''}>
                    • Al menos un número (recomendado)
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? 'text-green-400' : ''}>
                    • Al menos una mayúscula (recomendado)
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isResetting || newPassword !== confirmPassword || newPassword.length < 6}
                className="elegante-button-primary w-full flex items-center justify-center"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black-primary border-t-transparent rounded-full animate-spin mr-2" />
                    Actualizando contraseña...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Actualizar Contraseña
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-lightest p-4">
      {/* Header del Email */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white-primary rounded-t-lg border border-gray-light">
          <div className="p-4 border-b border-gray-light bg-gray-lighter">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-primary rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-darkest">Edwins Barber - Sistema de Gestión</p>
                  <p className="text-sm text-gray-medium">no-reply@elitebarbershop.com</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-medium hover:text-gray-darkest transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-sm text-gray-medium">
              <p><strong>Para:</strong> {userEmail}</p>
              <p><strong>Asunto:</strong> Recuperación de contraseña - Edwins Barber</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleString('es-ES')}</p>
            </div>
          </div>
        </div>

        {/* Contenido del Email */}
        <div className="bg-white-primary border-x border-gray-light">
          <div className="p-8">
            {/* Logo y Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-primary to-orange-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-darkest mb-2">Recuperación de Contraseña</h1>
              <p className="text-gray-medium">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta</p>
            </div>

            {/* Información de la cuenta */}
            <div className="bg-gray-lighter p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-darkest mb-2">Detalles de la solicitud:</h3>
              <div className="space-y-1 text-sm text-gray-medium">
                <p><strong>Cuenta:</strong> {userEmail}</p>
                <p><strong>Fecha:</strong> {new Date().toLocaleString('es-ES')}</p>
                <p><strong>IP:</strong> 192.168.1.100 (Simulado)</p>
              </div>
            </div>

            {/* Botón de acción principal */}
            <div className="text-center mb-8">
              <button
                onClick={() => setShowResetForm(true)}
                className="inline-flex items-center gap-2 bg-orange-primary hover:bg-orange-secondary text-white-primary font-semibold py-4 px-8 rounded-lg transition-colors"
              >
                <Shield className="w-5 h-5" />
                Restablecer Contraseña
              </button>
              <p className="text-sm text-gray-medium mt-3">
                Este enlace es válido por 24 horas desde el momento de la solicitud
              </p>
            </div>

            {/* Enlace manual */}
            <div className="bg-gray-lighter p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-darkest mb-2">¿No funciona el botón? Copia este enlace:</h4>
              <div className="flex items-center gap-2 p-3 bg-white-primary border border-gray-light rounded text-sm font-mono text-gray-medium break-all">
                <span className="flex-1">{resetLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-1 text-orange-primary hover:text-orange-secondary transition-colors"
                  title="Copiar enlace"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Información de seguridad */}
            <div className="bg-orange-primary/5 border border-orange-primary/20 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-orange-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-darkest mb-2">Importante - Información de Seguridad</h4>
                  <ul className="text-sm text-gray-medium space-y-1">
                    <li>• Este enlace expira en 24 horas por tu seguridad</li>
                    <li>• Solo puede ser usado una vez</li>
                    <li>• Si no solicitaste este cambio, ignora este correo</li>
                    <li>• Nunca compartas este enlace con otras personas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="space-y-4 text-sm text-gray-medium">
              <h4 className="font-medium text-gray-darkest">Pasos a seguir:</h4>
              <ol className="space-y-2">
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-orange-primary text-white-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Haz clic en el botón "Restablecer Contraseña" de arriba</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-orange-primary text-white-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Serás dirigido a una página segura para cambiar tu contraseña</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-orange-primary text-white-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Ingresa tu nueva contraseña (mínimo 6 caracteres)</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 bg-orange-primary text-white-primary rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <span>Confirma el cambio e inicia sesión con tu nueva contraseña</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer del Email */}
        <div className="bg-gray-darkest text-white-primary rounded-b-lg border border-gray-light border-t-0 p-6 text-center">
          <div className="space-y-2 text-sm">
            <p className="font-medium">EDWINS BARBER - Sistema de Gestión</p>
            <p className="text-gray-lighter">Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p className="text-gray-lighter">Si tienes problemas, contacta al administrador del sistema.</p>
            <div className="pt-4 border-t border-gray-dark mt-4">
              <p className="text-xs text-gray-lighter">
                &copy; 2025 Edwins Barber. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Nota de simulación */}
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <ExternalLink className="w-4 h-4" />
            <span className="font-medium">Simulación de Correo</span>
          </div>
          <p className="text-sm text-blue-300 mt-1">
            Esta es una simulación del correo de recuperación que se enviaría al usuario. 
            En un entorno real, este correo llegaría a la bandeja de entrada del usuario.
          </p>
        </div>
      </div>
    </div>
  );
}