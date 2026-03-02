import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface TextCaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export function TextCaptcha({ onValidate, className = '' }: TextCaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  // Generar string aleatorio
  const generateRandomString = (length: number = 5): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos como O, 0, I, 1
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generar ruido en el canvas
  const addNoise = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Líneas de ruido
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    // Puntos de ruido
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.4)`;
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
  };

  // Dibujar texto distorsionado
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 200;
    canvas.height = 80;

    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 200, 80);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#2d2d2d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 80);

    // Agregar ruido de fondo
    addNoise(ctx, 200, 80);

    // Configurar texto
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dibujar cada letra con distorsión
    const letterSpacing = 30;
    const startX = 35;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = startX + (i * letterSpacing);
      const y = 40;

      // Transformación aleatoria
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5); // Rotación ligera
      
      // Color del texto con variación
      const colors = ['#f97316', '#ffffff', '#d97706', '#fbbf24'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      // Sombra del texto
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 3;
      
      // Dibujar letra
      ctx.fillText(char, 0, 0);
      
      ctx.restore();
    }

    // Agregar más ruido encima
    addNoise(ctx, 200, 80);
  };

  // Generar nuevo captcha
  const generateNewCaptcha = () => {
    const newText = generateRandomString();
    setCaptchaText(newText);
    setUserInput('');
    setIsValid(false);
    onValidate(false);
    
    // Pequeño delay para asegurar que el canvas esté listo
    setTimeout(() => {
      drawCaptcha(newText);
    }, 100);
  };

  // Validar entrada del usuario
  const validateInput = (value: string) => {
    const valid = value.toUpperCase() === captchaText.toUpperCase();
    setIsValid(valid);
    onValidate(valid);
  };

  // Manejar cambio en input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);
    
    if (value.length >= captchaText.length) {
      validateInput(value);
    } else {
      setIsValid(false);
      onValidate(false);
    }
  };

  // Generar captcha inicial
  useEffect(() => {
    generateNewCaptcha();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-4 bg-gray-darker rounded-lg border border-gray-dark">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white-primary font-medium flex items-center gap-2">
            🔤 Verificación de texto
          </h4>
          <Button
            type="button"
            onClick={generateNewCaptcha}
            className="p-2 bg-gray-medium hover:bg-gray-light rounded-lg transition-colors"
            title="Generar nuevo captcha"
          >
            <RefreshCw className="w-4 h-4 text-gray-lightest" />
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Canvas para el captcha */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border-2 border-orange-primary/30 rounded-lg bg-gray-darkest"
              style={{ filter: 'contrast(1.1) brightness(1.05)' }}
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-transparent to-orange-primary/5 pointer-events-none" />
          </div>

          {/* Input para la respuesta */}
          <div className="w-full max-w-xs">
            <Input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Escribe el texto que ves..."
              className={`elegante-input text-center uppercase tracking-wider ${
                userInput.length >= captchaText.length
                  ? isValid 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-red-500 bg-red-900/20'
                  : ''
              }`}
              maxLength={captchaText.length + 2}
              autoComplete="off"
            />
            {userInput.length >= captchaText.length && (
              <div className={`text-center mt-2 ${
                isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {isValid ? '✓ Correcto!' : '✗ Incorrecto'}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-lightest text-center">
          {isValid ? (
            <span className="text-green-400 flex items-center justify-center gap-2">
              ✓ Verificación completada correctamente
            </span>
          ) : (
            <span>Transcribe exactamente el texto que aparece en la imagen</span>
          )}
        </div>
      </div>
    </div>
  );
}
