# Documentación del Sistema de Autenticación y Registro

Este documento detalla el funcionamiento técnico del módulo de autenticación de la aplicación, cubriendo el Registro de Usuarios, Inicio de Sesión y Recuperación de Contraseña. El sistema utiliza **Firebase Authentication** para la gestión de identidades y seguridad, integrado con un **Backend API** propio para la gestión de roles y perfiles de negocio.

---

## 1. Registro de Usuarios (`RegisterPage.tsx`)

El proceso de registro combina la creación de una cuenta segura en Firebase con la creación automática de un perfil de cliente en la base de datos del negocio.

### Flujo de Funcionamiento:

1.  **Validación de Formulario**: Se verifican los campos en tiempo real (contraseña segura, email válido).
2.  **Llamada a `register`**: Se invoca la función del `AuthContext`.
3.  **Firebase Create**: Se crea el usuario en Firebase Auth.
4.  **Sincronización API**: Se envían los datos al backend para crear el registro en la tabla `Clientes`.

### Código Clave Explicado:

```typescript
// src/components/RegisterPage.tsx

const handleRegister = async (e: FormEvent) => {
  e.preventDefault();
  
  // 1. Validaciones previas
  if (!passwordValidations.minLength || !passwordsMatch || !captchaValidated) {
    return;
  }

  try {
    // 2. Llamada al contexto de autenticación
    const result = await register({
      name: formData.name.trim(),
      apellido: formData.apellido.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: 'cliente' // Por defecto, todos se registran como clientes
    });

    if (result.success) {
      setSuccess(true); // Muestra pantalla de éxito
    } else {
      // Manejo de errores (ej: email duplicado)
      if (result.error?.includes('already in use')) {
        setEmailConflictError('El email ya está registrado.');
      }
    }
  } catch (err) {
    setError('Error al crear la cuenta.');
  }
};
```

---

## 2. Inicio de Sesión (`LoginPage.tsx`)

El login autentica al usuario contra Firebase y luego determina su rol y permisos consultando la API del backend.

### Flujo de Funcionamiento:

1.  **Autenticación Firebase**: Se valida email y contraseña.
2.  **Obtención de Token**: Firebase devuelve un token de acceso seguro.
3.  **Sincronización/Login Backend**: El `AuthContext` usa este token para pedir al backend los datos del usuario (Rol, ID de Cliente/Barbero).
4.  **Redirección**: Según el rol (`admin`, `barbero`, `cliente`), se redirige al dashboard correspondiente.

### Código Clave Explicado:

```typescript
// src/components/LoginPage.tsx

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1. Verificación de seguridad (Captcha)
  if (!captchaValidated) {
    setError('Completa la verificación "No soy un robot"');
    return;
  }

  try {
    // 2. Intento de login
    // Esta función 'login' encapsula la lógica de Firebase + Backend Sync
    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error || 'Credenciales inválidas');
    }
    // Si es exitoso, el AuthContext actualiza el estado 'user' automáticamente
    // y el componente App.tsx redirige al usuario.
  } catch (err) {
    setError('Error al iniciar sesión');
  }
};
```

---

## 3. Lógica Central de Autenticación (`AuthContext.tsx`)

Este es el "cerebro" de la autenticación. Mantiene el estado global del usuario y coordina Firebase con el Backend.

### Código Clave Explicado:

```typescript
// src/components/AuthContext.tsx

const login = async (email, password) => {
  try {
    // 1. Autenticar con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Verificar si el email está validado
    if (!firebaseUser.emailVerified) {
      return { success: false, error: 'Por favor verifica tu correo electrónico.' };
    }

    // 3. Obtener el token para el backend
    const token = await firebaseUser.getIdToken();

    // 4. Sincronizar con Backend (Obtener rol y perfil)
    // Esta llamada asegura que tengamos los datos de negocio (ID Cliente, Saldo, etc.)
    const apiUser = await authSyncService.syncUser(firebaseUser);
    
    // 5. Actualizar estado global
    setUser(apiUser);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

---

## 4. Recuperación de Contraseña

El flujo de recuperación maneja la redirección desde un correo externo de vuelta a la aplicación para establecer una nueva contraseña.

### Flujo de Funcionamiento:

1.  **Solicitud**: Usuario pide reset en `ForgotPasswordPage`.
2.  **Envío**: Firebase manda email con enlace mágico.
3.  **Detección en App**: `App.tsx` detecta parámetros `mode=resetPassword` y `oobCode` en la URL.
4.  **Intercepción**: Muestra `PasswordResetPage` en lugar del Login.
5.  **Cambio**: `PasswordResetPage` usa el código (`oobCode`) para permitir al usuario poner una nueva clave.

### Código Clave Explicado (`App.tsx`):

```typescript
// src/App.tsx

useEffect(() => {
  // Detectar parámetros de la URL (vienen del link del correo)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode'); // 'resetPassword' o 'verifyEmail'
  const oobCode = urlParams.get('oobCode'); // Código único de un solo uso

  if (mode === 'resetPassword' && oobCode) {
    // Si es un reset, preparamos la vista especial
    setPublicView("login"); // Mostramos el contenedor de login...
    // ...pero le pasamos datos para que Login muestre el formulario de reset
    setResetData({ email: '', token: oobCode }); 
  } 
}, []);
```

### Código Clave Explicado (`PasswordResetPage.tsx`):

```typescript
// src/components/PasswordResetPage.tsx

const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Usamos la función de Firebase para confirmar el cambio
    await confirmPasswordReset(auth, token, newPassword);
    
    // Notificamos éxito y regresamos al login
    onComplete();
    alert('Contraseña actualizada correctamente.');
  } catch (error) {
    setError('El enlace ha expirado o es inválido.');
  }
};
```
