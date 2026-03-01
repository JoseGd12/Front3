# Sistema de Captcha Anti-Brute Force

Este sistema proporciona múltiples tipos de captcha para proteger tu aplicación contra ataques de fuerza bruta y bots automatizados.

## 🛡️ Tipos de Captcha Disponibles

### 1. **Captcha Checkbox** (`CheckboxCaptcha`)
- **Descripción**: Verificación rápida tipo "No soy un robot"
- **Uso**: Login frecuente, formularios simples
- **Seguridad**: Alta
- **Dificultad**: Muy Fácil

### 2. **Captcha Matemático** (`MathCaptcha`)
- **Descripción**: Operaciones aritméticas simples
- **Uso**: Formularios de contacto, comentarios
- **Seguridad**: Media
- **Dificultad**: Fácil

### 3. **Puzzle Deslizante** (`SliderCaptcha`)
- **Descripción**: Completa el puzzle arrastrando
- **Uso**: Registro de usuarios, gamificación
- **Seguridad**: Alta
- **Dificultad**: Medio

### 4. **Texto Distorsionado** (`TextCaptcha`)
- **Descripción**: Transcripción de texto con distorsión visual
- **Uso**: Seguridad alta, formularios críticos
- **Seguridad**: Alta
- **Dificultad**: Medio

### 5. **Selección de Imágenes** (`ImageSelectionCaptcha`)
- **Descripción**: Identificación de objetos en imágenes
- **Uso**: Máxima seguridad, prevención avanzada
- **Seguridad**: Muy Alta
- **Dificultad**: Medio-Alto

### 6. **Selector Unificado** (`CaptchaSelector`)
- **Descripción**: Permite elegir entre diferentes tipos
- **Uso**: Flexibilidad máxima para el usuario
- **Seguridad**: Variable
- **Dificultad**: Variable

## 🚀 Uso Básico

### Importación
```tsx
import { CaptchaSelector, MathCaptcha, CheckboxCaptcha } from './captcha';
```

### Ejemplo Simple
```tsx
import { CaptchaSelector } from './captcha';

function LoginForm() {
  const [captchaValid, setCaptchaValid] = useState(false);

  const handleCaptchaValidation = (isValid: boolean) => {
    setCaptchaValid(isValid);
  };

  return (
    <form>
      {/* Otros campos del formulario */}
      
      <CaptchaSelector 
        onValidate={handleCaptchaValidation}
        defaultType="checkbox"
        allowTypeChange={true}
      />
      
      <button 
        type="submit" 
        disabled={!captchaValid}
      >
        Iniciar Sesión
      </button>
    </form>
  );
}
```

### Ejemplo con Captcha Específico
```tsx
import { MathCaptcha } from './captcha';

function ContactForm() {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <form>
      {/* Campos del formulario */}
      
      <MathCaptcha 
        onValidate={setIsVerified}
        className="mt-4"
      />
      
      <button disabled={!isVerified}>
        Enviar Mensaje
      </button>
    </form>
  );
}
```

## ⚙️ Props Comunes

### CaptchaSelector
```tsx
interface CaptchaSelectorProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
  defaultType?: CaptchaType;
  allowTypeChange?: boolean;
  title?: string;
}
```

### Captchas Individuales
```tsx
interface CaptchaProps {
  onValidate: (isValid: boolean) => void;
  className?: string;
}
```

## 🔧 Integración en Formularios de Autenticación

### Login con Captcha Progresivo
```tsx
function LoginPage() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaValidated, setCaptchaValidated] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    
    // Requerir captcha después de 2 intentos fallidos
    if (failedAttempts >= 2 && !captchaValidated) {
      setError('Completa la verificación de seguridad');
      return;
    }

    try {
      await login(email, password);
      setFailedAttempts(0);
    } catch {
      setFailedAttempts(prev => prev + 1);
      setCaptchaValidated(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Campos de login */}
      
      {failedAttempts >= 2 && (
        <CaptchaSelector 
          onValidate={setCaptchaValidated}
          defaultType="checkbox"
        />
      )}
      
      <button disabled={failedAttempts >= 2 && !captchaValidated}>
        Iniciar Sesión
      </button>
    </form>
  );
}
```

## 🎨 Personalización de Estilos

Los captchas usan las clases CSS del sistema de diseño del proyecto:

- `elegante-card`: Contenedor principal
- `elegante-button-primary`: Botones principales
- `elegante-button-secondary`: Botones secundarios
- `elegante-input`: Campos de entrada

Para personalizar, puedes sobrescribir estas clases o agregar clases adicionales via la prop `className`.

## 📱 Compatibilidad Móvil

Todos los captchas están optimizados para dispositivos móviles:

- **SliderCaptcha**: Soporte completo para touch events
- **TextCaptcha**: Teclado optimizado para entrada de texto
- **ImageSelectionCaptcha**: Grid responsive para pantallas pequeñas

## 🔒 Consideraciones de Seguridad

### Frontend (Solo Visual)
- ✅ Validación de entrada del usuario
- ✅ Prevención de spam básico
- ✅ Mejora de UX con feedback visual

### Para Seguridad Completa (Backend Requerido)
- ⚠️ Validación del servidor obligatoria
- ⚠️ Rate limiting por IP
- ⚠️ Logging de intentos sospechosos
- ⚠️ Tokens de sesión únicos

## 🐛 Solución de Problemas

### Captcha no se Muestra
1. Verificar imports correctos
2. Comprobar que las props requeridas están pasadas
3. Revisar estilos CSS necesarios

### Validación no Funciona
1. Verificar que `onValidate` está correctamente conectado
2. Comprobar el estado del componente padre
3. Revisar condiciones de habilitación del botón

### Errores de TypeScript
1. Importar tipos: `import type { CaptchaType } from './captcha'`
2. Verificar versiones de dependencias
3. Comprobar configuración de TypeScript

## 📄 Licencia

Este componente es parte del sistema de gestión de barbería y sigue la misma licencia del proyecto principal.
