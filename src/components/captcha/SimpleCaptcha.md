# SimpleCaptcha - Captcha Checkbox Simplificado

Un componente de captcha tipo "No soy un robot" minimalista y siempre visible para formularios de autenticación.

## ✅ Características

- **Siempre visible** - No requiere intentos fallidos para aparecer
- **Minimalista** - Sin contadores, textos técnicos o información de debug
- **Simple** - Solo requiere un clic para validar
- **Integrado** - Funciona perfectamente con el diseño del sistema

## 🚀 Uso Básico

```tsx
import { SimpleCaptcha } from './captcha';

function LoginForm() {
  const [captchaValid, setCaptchaValid] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!captchaValid) {
      setError('Completa la verificación "No soy un robot"');
      return;
    }
    
    // Proceder con el envío del formulario
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Otros campos del formulario */}
      
      <SimpleCaptcha 
        onValidate={setCaptchaValid}
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

## 📋 Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `onValidate` | `(isValid: boolean) => void` | Callback que se ejecuta cuando cambia el estado de validación |
| `className` | `string` (opcional) | Clases CSS adicionales para el contenedor |

## 🎨 Estados Visuales

| Estado | Descripción | Color |
|--------|-------------|-------|
| **Sin validar** | Checkbox vacío con texto "No soy un robot" | Gris |
| **Verificando** | Spinner de carga con texto "Verificando..." | Naranja |
| **Verificado** | Checkmark verde con texto "Verificación completada" | Verde |
| **Fallido** | X roja con botón para reintentar | Rojo |

## 🔄 Comportamiento

1. **Clic inicial**: Usuario hace clic en el checkbox
2. **Verificación**: Se muestra spinner por 1-2 segundos
3. **Resultado**: 95% probabilidad de éxito, 5% de fallo
4. **Reset automático**: En caso de fallo, se puede reintentar

## 🎯 Integración Actual

### LoginPageSimplified.tsx
- ✅ Captcha siempre visible
- ✅ Botón deshabilitado sin validación
- ✅ Reset automático en login fallido

### RegisterPage.tsx
- ✅ Captcha siempre visible
- ✅ Botón deshabilitado sin validación
- ✅ Reset automático en registro fallido

## 🔒 Seguridad

**⚠️ Importante**: Este es solo el componente visual (frontend). Para seguridad completa necesitas:

- Validación del servidor
- Rate limiting por IP
- Tokens CSRF
- Logging de intentos

## 🎨 Personalización

El componente usa las clases del sistema de diseño:

```css
.bg-gray-darker      /* Fondo del contenedor */
.border-green-500    /* Borde cuando está validado */
.border-red-500      /* Borde cuando falla */
.text-white-primary  /* Texto principal */
.elegante-button-*   /* Botones del sistema */
```

## 📱 Responsive

Totalmente compatible con dispositivos móviles y diferentes tamaños de pantalla.
