import React, { useState } from 'react';
import { ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { 
  MathCaptcha, 
  TextCaptcha, 
  SliderCaptcha, 
  CheckboxCaptcha, 
  ImageSelectionCaptcha,
  CaptchaSelector,
  type CaptchaType
} from './captcha';

interface CaptchaDemoProps {
  onBack?: () => void;
}

export function CaptchaDemo({ onBack }: CaptchaDemoProps) {
  const [activeDemo, setActiveDemo] = useState<'selector' | CaptchaType>('selector');
  const [validationStates, setValidationStates] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const handleValidation = (type: string, isValid: boolean) => {
    setValidationStates(prev => ({ ...prev, [type]: isValid }));
  };

  const captchaTypes = [
    {
      id: 'selector',
      name: 'Selector Unificado',
      description: 'Permite al usuario elegir entre diferentes tipos de captcha',
      icon: '🎛️',
      useCase: 'Ideal para dar flexibilidad al usuario',
      security: 'Variable',
      difficulty: 'Variable'
    },
    {
      id: 'checkbox' as CaptchaType,
      name: 'Captcha Checkbox',
      description: 'Verificación rápida con análisis de comportamiento',
      icon: '✅',
      useCase: 'Login frecuente, UX fluida',
      security: 'Alta',
      difficulty: 'Muy Fácil'
    },
    {
      id: 'math' as CaptchaType,
      name: 'Captcha Matemático',
      description: 'Operaciones aritméticas simples',
      icon: '🔢',
      useCase: 'Formularios simples, accesible',
      security: 'Media',
      difficulty: 'Fácil'
    },
    {
      id: 'slider' as CaptchaType,
      name: 'Puzzle Deslizante',
      description: 'Completa el puzzle arrastrando el control',
      icon: '🧩',
      useCase: 'Registro de usuarios, gamificación',
      security: 'Alta',
      difficulty: 'Medio'
    },
    {
      id: 'text' as CaptchaType,
      name: 'Texto Distorsionado',
      description: 'Transcripción de texto con distorsión visual',
      icon: '🔤',
      useCase: 'Seguridad alta, formularios críticos',
      security: 'Alta',
      difficulty: 'Medio'
    },
    {
      id: 'image-selection' as CaptchaType,
      name: 'Selección de Imágenes',
      description: 'Identificación de objetos en imágenes',
      icon: '🖼️',
      useCase: 'Máxima seguridad, prevención avanzada',
      security: 'Muy Alta',
      difficulty: 'Medio-Alto'
    }
  ];

  const renderCaptcha = (type: 'selector' | CaptchaType) => {
    const commonProps = {
      onValidate: (isValid: boolean) => handleValidation(type, isValid),
      className: 'w-full'
    };

    switch (type) {
      case 'selector':
        return (
          <CaptchaSelector
            {...commonProps}
            defaultType="checkbox"
            allowTypeChange={true}
            title="Selector de Captcha Unificado"
          />
        );
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
        return <CaptchaSelector {...commonProps} />;
    }
  };

  const currentCaptcha = captchaTypes.find(c => c.id === activeDemo);

  return (
    <div className="min-h-screen bg-black-primary p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  onClick={onBack}
                  className="p-2 bg-gray-medium hover:bg-gray-light rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-lightest" />
                </Button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white-primary">
                  Sistema de Captcha Anti-Brute Force
                </h1>
                <p className="text-gray-lightest mt-2">
                  Demostración de diferentes sistemas de verificación para prevenir ataques automatizados
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                className="elegante-button-secondary"
              >
                {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
              </Button>
            </div>
          </div>

          {/* Información actual */}
          {currentCaptcha && (
            <div className="elegante-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-primary/20 rounded-xl flex items-center justify-center text-2xl border border-orange-primary/30">
                  {currentCaptcha.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white-primary">
                    {currentCaptcha.name}
                  </h2>
                  <p className="text-gray-lightest">
                    {currentCaptcha.description}
                  </p>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                  validationStates[activeDemo]
                    ? 'bg-green-900/30 text-green-400 border border-green-600/30'
                    : 'bg-gray-medium text-gray-lightest'
                }`}>
                  {validationStates[activeDemo] ? '✓ Validado' : '○ Pendiente'}
                </div>
              </div>

              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-dark">
                  <div>
                    <span className="text-sm font-medium text-orange-primary">Caso de Uso:</span>
                    <p className="text-sm text-gray-lightest mt-1">{currentCaptcha.useCase}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-orange-primary">Seguridad:</span>
                    <p className="text-sm text-gray-lightest mt-1">{currentCaptcha.security}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-orange-primary">Dificultad:</span>
                    <p className="text-sm text-gray-lightest mt-1">{currentCaptcha.difficulty}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con tipos de captcha */}
          <div className="lg:col-span-1">
            <div className="elegante-card sticky top-4">
              <h3 className="text-lg font-semibold text-white-primary mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-primary" />
                Tipos de Captcha
              </h3>
              <div className="space-y-2">
                {captchaTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setActiveDemo(type.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                      activeDemo === type.id
                        ? 'bg-orange-primary text-black-primary'
                        : 'bg-gray-medium text-gray-lightest hover:bg-gray-light'
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{type.name}</p>
                      <p className={`text-xs truncate mt-1 ${
                        activeDemo === type.id ? 'text-black-primary/70' : 'text-gray-lighter'
                      }`}>
                        {type.security} • {type.difficulty}
                      </p>
                    </div>
                    {validationStates[type.id] && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Área de demostración */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Captcha activo */}
              <div>
                {renderCaptcha(activeDemo)}
              </div>

              {/* Información técnica */}
              {showDetails && (
                <div className="elegante-card">
                  <h3 className="text-lg font-semibold text-white-primary mb-4">
                    Información Técnica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-orange-primary mb-2">Casos de Uso Recomendados:</h4>
                      <ul className="text-sm text-gray-lightest space-y-1">
                        <li>• <strong>Checkbox:</strong> Login frecuente, formularios simples</li>
                        <li>• <strong>Matemático:</strong> Formularios de contacto, comentarios</li>
                        <li>• <strong>Slider:</strong> Registro de usuarios, checkout</li>
                        <li>• <strong>Texto:</strong> Formularios críticos, transacciones</li>
                        <li>• <strong>Imágenes:</strong> Seguridad máxima, admin panels</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-primary mb-2">Implementación:</h4>
                      <div className="text-sm text-gray-lightest space-y-2">
                        <p>• <strong>Frontend:</strong> Validación visual y UX</p>
                        <p>• <strong>Backend:</strong> Verificación del servidor</p>
                        <p>• <strong>Rate Limiting:</strong> Límites por IP/usuario</p>
                        <p>• <strong>Logging:</strong> Monitoreo de intentos sospechosos</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado de validación global */}
              <div className="elegante-card">
                <h3 className="text-lg font-semibold text-white-primary mb-4">
                  Estado de Validaciones
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {captchaTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        validationStates[type.id]
                          ? 'bg-green-900/20 border-green-600/30'
                          : 'bg-gray-medium border-gray-dark'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs text-gray-lightest truncate">
                        {type.name.split(' ')[0]}
                      </div>
                      <div className={`text-xs mt-1 ${
                        validationStates[type.id] ? 'text-green-400' : 'text-gray-lighter'
                      }`}>
                        {validationStates[type.id] ? '✓' : '○'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
