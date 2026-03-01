import React, { useState, useEffect, useRef } from 'react';
import { Shield, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface CheckboxCaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export function CheckboxCaptcha({ onValidate, className = '' }: CheckboxCaptchaProps) {
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isSuspicious, setIsSuspicious] = useState<boolean>(false);
  const [verificationStage, setVerificationStage] = useState<number>(0);
  
  // Métricas de comportamiento humano
  const [mouseMovements, setMouseMovements] = useState<number>(0);
  const [timingData, setTimingData] = useState<{ start: number; clickDelay: number }>({ start: 0, clickDelay: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar movimiento del mouse
  useEffect(() => {
    const handleMouseMove = () => {
      setMouseMovements(prev => prev + 1);
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    const startTime = Date.now();
    setTimingData(prev => ({ ...prev, start: startTime }));

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Simular proceso de verificación
  const performVerification = async () => {
    setIsVerifying(true);
    setVerificationStage(0);
    
    // Simular múltiples etapas de verificación
    const stages = [
      'Verificando comportamiento...',
      'Analizando patrones de mouse...',
      'Validando tiempos de respuesta...',
      'Completando verificación...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setVerificationStage(i);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    }

    // Análisis del comportamiento (simulado)
    const clickDelay = Date.now() - timingData.start;
    const hasMouseMovement = mouseMovements > 5;
    const reasonableDelay = clickDelay > 1000 && clickDelay < 30000;
    
    // Determinar si el comportamiento parece humano
    const isHuman = hasMouseMovement && reasonableDelay && Math.random() > 0.1; // 90% probabilidad de éxito
    
    if (isHuman) {
      setIsVerified(true);
      setIsSuspicious(false);
      onValidate(true);
    } else {
      setIsSuspicious(true);
      setIsVerified(false);
      setIsChecked(false);
      onValidate(false);
    }
    
    setIsVerifying(false);
  };

  // Manejar clic en checkbox
  const handleCheckboxClick = () => {
    if (isVerified || isVerifying) return;
    
    setIsChecked(true);
    setTimingData(prev => ({ ...prev, clickDelay: Date.now() - prev.start }));
    performVerification();
  };

  // Resetear captcha
  const resetCaptcha = () => {
    setIsChecked(false);
    setIsVerifying(false);
    setIsVerified(false);
    setIsSuspicious(false);
    setMouseMovements(0);
    setVerificationStage(0);
    setTimingData({ start: Date.now(), clickDelay: 0 });
    onValidate(false);
  };

  // Obtener mensaje de estado
  const getStatusMessage = () => {
    if (isVerifying) {
      const stages = [
        'Verificando comportamiento...',
        'Analizando patrones de mouse...',
        'Validando tiempos de respuesta...',
        'Completando verificación...'
      ];
      return stages[verificationStage] || 'Verificando...';
    }
    
    if (isVerified) return 'Verificación completada';
    if (isSuspicious) return 'Comportamiento sospechoso detectado';
    return 'Haz clic para verificar que no eres un robot';
  };

  // Obtener color del borde
  const getBorderColor = () => {
    if (isVerified) return 'border-green-500';
    if (isSuspicious) return 'border-red-500';
    if (isVerifying) return 'border-orange-primary';
    return 'border-gray-dark';
  };

  const stageProgress = verificationStage * 25;

  return (
    <div className={`space-y-4 ${className}`} ref={containerRef}>
      <div className={`p-4 bg-gray-darker rounded-lg border-2 transition-all duration-300 ${getBorderColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white-primary font-medium flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-primary" />
            Verificación de seguridad
          </h4>
          {(isSuspicious || isVerified) && (
            <Button
              type="button"
              onClick={resetCaptcha}
              className="p-2 bg-gray-medium hover:bg-gray-light rounded-lg transition-colors"
              title="Intentar de nuevo"
            >
              <RefreshCw className="w-4 h-4 text-gray-lightest" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Checkbox */}
          <div 
            className={`relative w-6 h-6 rounded border-2 cursor-pointer transition-all duration-300 flex items-center justify-center ${
              isVerified
                ? 'bg-green-500 border-green-500'
                : isSuspicious
                  ? 'bg-red-500 border-red-500'
                  : isVerifying || isChecked
                    ? 'bg-orange-primary border-orange-primary'
                    : 'bg-transparent border-gray-medium hover:border-orange-primary'
            } ${(isVerifying || isVerified) ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={handleCheckboxClick}
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-black-primary border-t-transparent rounded-full animate-spin" />
            ) : isVerified ? (
              <Check className="w-4 h-4 text-white" />
            ) : isSuspicious ? (
              <AlertTriangle className="w-4 h-4 text-white" />
            ) : null}
          </div>

          {/* Texto de estado */}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              isVerified 
                ? 'text-green-400' 
                : isSuspicious 
                  ? 'text-red-400'
                  : 'text-white-primary'
            }`}>
              {getStatusMessage()}
            </p>
            
            {/* Barra de progreso durante verificación */}
            {isVerifying && (
              <div className="mt-2 w-full bg-gray-darkest rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-primary to-orange-secondary transition-all duration-300 ease-out"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
            )}

            {/* Información adicional para casos sospechosos */}
            {isSuspicious && (
              <p className="text-xs text-red-300 mt-1">
                Por favor, mueve el mouse y vuelve a intentar
              </p>
            )}
          </div>
        </div>

        {/* Información de comportamiento (solo para desarrollo/debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 pt-3 border-t border-gray-dark text-xs text-gray-lightest">
            <div className="grid grid-cols-2 gap-2">
              <div>Movimientos: {mouseMovements}</div>
              <div>Tiempo: {timingData.clickDelay}ms</div>
            </div>
          </div>
        )}

        {/* Logo de verificación */}
        <div className="mt-4 pt-3 border-t border-gray-dark">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-lighter">
            <Shield className="w-3 h-3" />
            <span>Protegido por VerifyBot™</span>
            <span className="text-orange-primary">•</span>
            <span>Privacidad - Términos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
