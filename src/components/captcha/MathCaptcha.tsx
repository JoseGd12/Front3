import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface MathCaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}

export function MathCaptcha({ onValidate, className = '' }: MathCaptchaProps) {
  const [question, setQuestion] = useState<{ num1: number; num2: number; operator: string; answer: number }>({
    num1: 0,
    num2: 0,
    operator: '+',
    answer: 0
  });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  // Generar nueva pregunta matemática
  const generateQuestion = () => {
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const num1 = Math.floor(Math.random() * 20) + 1; // 1-20
    const num2 = Math.floor(Math.random() * 10) + 1; // 1-10
    
    let answer: number;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        // Asegurar que el resultado sea positivo
        const [bigger, smaller] = num1 >= num2 ? [num1, num2] : [num2, num1];
        answer = bigger - smaller;
        setQuestion({ num1: bigger, num2: smaller, operator, answer });
        setUserAnswer('');
        setIsValid(false);
        onValidate(false);
        return;
      case '×':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }
    
    setQuestion({ num1, num2, operator, answer });
    setUserAnswer('');
    setIsValid(false);
    onValidate(false);
  };

  // Validar respuesta
  const validateAnswer = (value: string) => {
    const numericValue = parseInt(value, 10);
    const valid = !isNaN(numericValue) && numericValue === question.answer;
    setIsValid(valid);
    onValidate(valid);
  };

  // Manejar cambio en input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserAnswer(value);
    
    if (value.trim() !== '') {
      validateAnswer(value);
    } else {
      setIsValid(false);
      onValidate(false);
    }
  };

  // Generar pregunta inicial
  useEffect(() => {
    generateQuestion();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-4 bg-gray-darker rounded-lg border border-gray-dark">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white-primary font-medium flex items-center gap-2">
            🔢 Verificación matemática
          </h4>
          <Button
            type="button"
            onClick={generateQuestion}
            className="p-2 bg-gray-medium hover:bg-gray-light rounded-lg transition-colors"
            title="Generar nueva pregunta"
          >
            <RefreshCw className="w-4 h-4 text-gray-lightest" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-xl font-mono text-orange-primary bg-gray-darkest px-4 py-2 rounded-lg border border-orange-primary/30">
            <span>{question.num1}</span>
            <span className="text-white-primary">{question.operator}</span>
            <span>{question.num2}</span>
            <span className="text-white-primary">=</span>
            <span className="text-gray-lighter">?</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Input
              type="number"
              value={userAnswer}
              onChange={handleInputChange}
              placeholder="Tu respuesta..."
              className={`elegante-input text-center ${
                userAnswer 
                  ? isValid 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-red-500 bg-red-900/20'
                  : ''
              }`}
              min="0"
              max="1000"
            />
            {userAnswer && (
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {isValid ? '✓' : '✗'}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-lightest">
          {isValid ? (
            <span className="text-green-400 flex items-center gap-2">
              ✓ Correcto! Verificación completada
            </span>
          ) : userAnswer && !isValid ? (
            <span className="text-red-400 flex items-center gap-2">
              ✗ Respuesta incorrecta, inténtalo de nuevo
            </span>
          ) : (
            <span>Resuelve la operación matemática para continuar</span>
          )}
        </div>
      </div>
    </div>
  );
}
