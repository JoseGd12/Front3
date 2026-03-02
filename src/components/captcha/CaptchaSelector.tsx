import React, { useState } from 'react';
import { Shield, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { MathCaptcha } from './MathCaptcha';
import { TextCaptcha } from './TextCaptcha';
import { SliderCaptcha } from './SliderCaptcha';
import { CheckboxCaptcha } from './CheckboxCaptcha';
import { ImageSelectionCaptcha } from './ImageSelectionCaptcha';

export type CaptchaType = 'math' | 'text' | 'slider' | 'checkbox' | 'image-selection';

interface CaptchaSelectorProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
  defaultType?: CaptchaType;
  allowTypeChange?: boolean;
  title?: string;
}

export function CaptchaSelector({ 
  onValidate, 
  className = '', 
  defaultType = 'checkbox',
  allowTypeChange = true,
  title = 'Verificación de Seguridad'
}: CaptchaSelectorProps) {
  const [currentType, setCurrentType] = useState<CaptchaType>(defaultType);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [key, setKey] = useState<number>(0); // Para forzar re-render

  const captchaTypes = [
    { 
      id: 'checkbox' as CaptchaType, 
      name: 'Verificación Rápida', 
      icon: '✓', 
      description: 'Un clic para verificar',
      difficulty: 'Fácil',
      security: 'Alta'
    },
    { 
      id: 'math' as CaptchaType, 
      name: 'Captcha Matemático', 
      icon: '🔢', 
      description: 'Resuelve una operación simple',
      difficulty: 'Fácil',
      security: 'Media'
    },
    { 
      id: 'slider' as CaptchaType, 
      name: 'Puzzle Deslizante', 
      icon: '🧩', 
      description: 'Completa el puzzle arrastrando',
      difficulty: 'Medio',
      security: 'Alta'
    },
    { 
      id: 'text' as CaptchaType, 
      name: 'Texto Distorsionado', 
      icon: '🔤', 
      description: 'Transcribe el texto de la imagen',
      difficulty: 'Medio',
      security: 'Alta'
    },
    { 
      id: 'image-selection' as CaptchaType, 
      name: 'Selección de Imágenes', 
      icon: '🖼️', 
      description: 'Selecciona las imágenes correctas',
      difficulty: 'Medio',
      security: 'Muy Alta'
    }
  ];

  const handleValidationChange = (valid: boolean) => {
    setIsValid(valid);
    onValidate(valid);
  };

  const handleTypeChange = (type: CaptchaType) => {
    setCurrentType(type);
    setIsValid(false);
    setKey(prev => prev + 1); // Forzar re-render del captcha
    onValidate(false);
  };

  const resetCaptcha = () => {
    setKey(prev => prev + 1);
    setIsValid(false);
    onValidate(false);
  };

  const renderCaptcha = () => {
    const commonProps = {
      onValidate: handleValidationChange,
      key: key,
      className: 'w-full'
    };

    switch (currentType) {
      case 'math':
        return <MathCaptcha {...commonProps} />;
      case 'text':
        return <TextCaptcha {...commonProps} />;
      case 'slider':
        return <SliderCaptcha {...commonProps} />;
      case 'checkbox':
        return <CheckboxCaptcha {...commonProps} />;
      case 'image-selection':
        return <ImageSelectionCaptcha {...commonProps} />;
      default:
        return <CheckboxCaptcha {...commonProps} />;
    }
  };

  const currentCaptcha = captchaTypes.find(type => type.id === currentType);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con información del captcha actual */}
      <div className="p-4 bg-gray-darker rounded-lg border border-gray-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-primary/20 rounded-lg flex items-center justify-center border border-orange-primary/30">
              <Shield className="w-5 h-5 text-orange-primary" />
            </div>
            <div>
              <h3 className="text-white-primary font-semibold">{title}</h3>
              {currentCaptcha && (
                <p className="text-sm text-gray-lightest">
                  {currentCaptcha.name} • {currentCaptcha.difficulty} • Seguridad: {currentCaptcha.security}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={resetCaptcha}
              className="p-2 bg-gray-medium hover:bg-gray-light rounded-lg transition-colors"
              title="Reiniciar captcha"
            >
              <RotateCcw className="w-4 h-4 text-gray-lightest" />
            </Button>
            
            {/* Indicador de estado */}
            <div className={`w-3 h-3 rounded-full ${
              isValid ? 'bg-green-500' : 'bg-gray-medium'
            }`} />
          </div>
        </div>

        {/* Selector de tipo de captcha */}
        {allowTypeChange && (
          <div className="mt-4">
            <p className="text-sm text-gray-lightest mb-2">Tipo de verificación:</p>
            <div className="flex flex-wrap gap-2">
              {captchaTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                    currentType === type.id
                      ? 'bg-orange-primary text-black-primary font-medium'
                      : 'bg-gray-medium text-gray-lightest hover:bg-gray-light'
                  }`}
                  title={type.description}
                >
                  <span>{type.icon}</span>
                  <span className="hidden sm:inline">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Captcha actual */}
      {renderCaptcha()}

      {/* Estado de validación */}
      <div className={`p-3 rounded-lg border transition-all duration-300 ${
        isValid
          ? 'bg-green-900/20 border-green-600/30'
          : 'bg-orange-900/10 border-orange-primary/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isValid ? 'bg-green-500' : 'bg-orange-primary/30'
            }`}>
              {isValid ? (
                <span className="text-white text-sm">✓</span>
              ) : (
                <Shield className="w-4 h-4 text-orange-primary" />
              )}
            </div>
            <div>
              <p className={`font-medium ${
                isValid ? 'text-green-400' : 'text-orange-primary'
              }`}>
                {isValid ? 'Verificación Completada' : 'Verificación Pendiente'}
              </p>
              <p className="text-sm text-gray-lightest">
                {isValid 
                  ? 'Puedes continuar con el formulario' 
                  : 'Completa la verificación para continuar'
                }
              </p>
            </div>
          </div>
          
          {/* Información adicional */}
          {currentCaptcha && !isValid && (
            <div className="text-right">
              <p className="text-xs text-gray-lighter">
                {currentCaptcha.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información de seguridad */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-darkest rounded-lg border border-gray-dark">
          <Shield className="w-4 h-4 text-orange-primary" />
          <span className="text-xs text-gray-lightest">
            Protección anti-bot • Sistema de seguridad multicapa
          </span>
        </div>
      </div>
    </div>
  );
}
