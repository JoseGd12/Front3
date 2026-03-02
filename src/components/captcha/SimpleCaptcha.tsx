import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface SimpleCaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export function SimpleCaptcha({ onValidate, className = '' }: SimpleCaptchaProps) {
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);

  // Simular proceso de verificación simple
  const performVerification = async () => {
    setIsVerifying(true);
    setIsFailed(false);
    
    // Simular verificación (1-2 segundos)
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
    
    // 95% probabilidad de éxito
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
      setIsVerified(true);
      setIsFailed(false);
      onValidate(true);
    } else {
      setIsFailed(true);
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
    performVerification();
  };

  // Resetear captcha
  const resetCaptcha = () => {
    setIsChecked(false);
    setIsVerifying(false);
    setIsVerified(false);
    setIsFailed(false);
    onValidate(false);
  };

  return (
    <div className={`${className}`}>
      <div className={`p-4 bg-gray-darker rounded-lg border-2 transition-all duration-300 ${
        isVerified 
          ? 'border-green-500' 
          : isFailed 
            ? 'border-red-500' 
            : 'border-gray-dark'
      }`}>
        <div className="flex items-center gap-4">
          {/* Checkbox */}
          <div 
            className={`relative w-6 h-6 rounded border-2 cursor-pointer transition-all duration-300 flex items-center justify-center ${
              isVerified
                ? 'bg-green-500 border-green-500'
                : isFailed
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
            ) : isFailed ? (
              <AlertTriangle className="w-4 h-4 text-white" />
            ) : null}
          </div>

          {/* Texto */}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              isVerified 
                ? 'text-green-400' 
                : isFailed 
                  ? 'text-red-400'
                  : 'text-white-primary'
            }`}>
              {isVerifying 
                ? 'Verificando...' 
                : isVerified 
                  ? 'Verificación completada'
                  : isFailed
                    ? 'Verificación falló, intenta de nuevo'
                    : 'No soy un robot'
              }
            </p>
          </div>

          {/* Botón de reset solo si falló */}
          {isFailed && (
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
      </div>
    </div>
  );
}
