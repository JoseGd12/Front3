import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface SliderCaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export function SliderCaptcha({ onValidate, className = '' }: SliderCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [targetPosition, setTargetPosition] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [tolerance] = useState<number>(15); // Tolerancia en píxeles

  // Generar nueva posición objetivo
  const generateNewTarget = () => {
    const containerWidth = 300; // Ancho fijo del contenedor
    const sliderWidth = 50;    // Ancho del slider
    const maxPosition = containerWidth - sliderWidth;
    
    // Posición aleatoria entre 60% y 90% del recorrido
    const minPos = maxPosition * 0.6;
    const maxPos = maxPosition * 0.9;
    const newTarget = Math.random() * (maxPos - minPos) + minPos;
    
    setTargetPosition(Math.round(newTarget));
    setPosition(0);
    setIsCompleted(false);
    onValidate(false);
  };

  // Manejar inicio del drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCompleted) return;
    setIsDragging(true);
    e.preventDefault();
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !sliderRef.current || isCompleted) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerRef.current.offsetWidth - sliderWidth;
    
    let newPosition = e.clientX - containerRect.left - (sliderWidth / 2);
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    
    setPosition(newPosition);
    
    // Verificar si está cerca del objetivo
    const distance = Math.abs(newPosition - targetPosition);
    if (distance <= tolerance) {
      setPosition(targetPosition);
      setIsCompleted(true);
      setIsDragging(false);
      onValidate(true);
    }
  };

  // Manejar fin del drag
  const handleMouseUp = () => {
    if (isDragging && !isCompleted) {
      // Si no está en la posición correcta, resetear
      const distance = Math.abs(position - targetPosition);
      if (distance > tolerance) {
        setPosition(0);
        onValidate(false);
      }
    }
    setIsDragging(false);
  };

  // Event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, position, targetPosition, isCompleted]);

  // Touch events para móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isCompleted) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || !sliderRef.current || isCompleted) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxPosition = containerRef.current.offsetWidth - sliderWidth;
    
    const touch = e.touches[0];
    let newPosition = touch.clientX - containerRect.left - (sliderWidth / 2);
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));
    
    setPosition(newPosition);
    
    // Verificar si está cerca del objetivo
    const distance = Math.abs(newPosition - targetPosition);
    if (distance <= tolerance) {
      setPosition(targetPosition);
      setIsCompleted(true);
      setIsDragging(false);
      onValidate(true);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && !isCompleted) {
      // Si no está en la posición correcta, resetear
      const distance = Math.abs(position - targetPosition);
      if (distance > tolerance) {
        setPosition(0);
        onValidate(false);
      }
    }
    setIsDragging(false);
  };

  // Generar objetivo inicial
  useEffect(() => {
    generateNewTarget();
  }, []);

  const progressPercentage = (position / 250) * 100; // 250 = 300 - 50 (ancho contenedor - ancho slider)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-4 bg-gray-darker rounded-lg border border-gray-dark">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white-primary font-medium flex items-center gap-2">
            🧩 Desliza para verificar
          </h4>
          <Button
            type="button"
            onClick={generateNewTarget}
            className="p-2 bg-gray-medium hover:bg-gray-light rounded-lg transition-colors"
            title="Generar nuevo puzzle"
          >
            <RefreshCw className="w-4 h-4 text-gray-lightest" />
          </Button>
        </div>

        {/* Contenedor del puzzle visual */}
        <div className="mb-4 p-3 bg-gray-darkest rounded-lg border border-gray-dark">
          <div className="relative h-20 bg-gradient-to-r from-orange-primary/20 to-orange-secondary/20 rounded-lg overflow-hidden">
            {/* Patrón de fondo */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(249, 115, 22, 0.1) 10px,
                  rgba(249, 115, 22, 0.1) 20px
                )`
              }}
            />
            
            {/* Área objetivo (donde debe llegar el slider) */}
            <div
              className="absolute top-2 bottom-2 w-12 bg-orange-primary/30 border-2 border-orange-primary border-dashed rounded-md flex items-center justify-center"
              style={{ left: `${targetPosition}px` }}
            >
              <ArrowRight className="w-4 h-4 text-orange-primary animate-pulse" />
            </div>

            {/* Progreso visual */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500/20 to-green-400/20 transition-all duration-200 ease-out rounded-lg"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Slider track */}
        <div
          ref={containerRef}
          className="relative h-12 bg-gray-darkest rounded-lg border border-gray-dark overflow-hidden cursor-pointer select-none"
        >
          {/* Track background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-medium to-gray-light opacity-20" />
          
          {/* Progress fill */}
          <div 
            className={`absolute left-0 top-0 h-full transition-all duration-200 ease-out ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-500 to-green-400' 
                : 'bg-gradient-to-r from-orange-primary to-orange-secondary'
            }`}
            style={{ width: `${position + 25}px` }} // +25 para centrar el slider
          />

          {/* Slider handle */}
          <div
            ref={sliderRef}
            className={`absolute top-1 left-0 w-12 h-10 rounded-lg cursor-grab transition-all duration-200 ease-out flex items-center justify-center ${
              isDragging 
                ? 'cursor-grabbing scale-105 shadow-lg' 
                : isCompleted 
                  ? 'bg-green-500 shadow-lg'
                  : 'bg-orange-primary hover:bg-orange-secondary shadow-md'
            } ${
              !isCompleted && !isDragging ? 'hover:scale-105' : ''
            }`}
            style={{ 
              transform: `translateX(${position}px)`,
              zIndex: 10
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isCompleted ? (
              <span className="text-white text-lg">✓</span>
            ) : (
              <ArrowRight className="w-5 h-5 text-black-primary" />
            )}
          </div>

          {/* Texto de instrucción */}
          {!isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-gray-lightest text-sm font-medium">
                Arrastra hacia la zona marcada →
              </span>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="mt-3 text-sm text-center">
          {isCompleted ? (
            <span className="text-green-400 flex items-center justify-center gap-2">
              ✓ Puzzle completado correctamente
            </span>
          ) : isDragging ? (
            <span className="text-orange-primary">Arrastrando... posiciona en la zona objetivo</span>
          ) : (
            <span className="text-gray-lightest">Arrastra el control deslizante hasta la zona marcada</span>
          )}
        </div>
      </div>
    </div>
  );
}
