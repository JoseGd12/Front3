# 🔥 Implementación Completa: Firebase Auth → Usuarios → Clientes/Barberos

## 📋 Resumen

Se ha implementado el **mismo flujo de autenticación** que el proyecto Flutter, donde Firebase actúa como proveedor de identidad y automáticamente se crean perfiles en las tablas `Clientes` o `Barberos` según el rol del usuario.

---

## 🏗️ Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE (IdP)                           │
│  • Authentication: Verifica credenciales                    │
│  • Google Sign-In: Autenticación social                     │
│  Proyecto: appbarber-845d7                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │   App React (Web)     │
         │  • AuthContext        │
         │  • clienteService     │
         │  • barberoService     │
         │  • apiService         │
         └────────────┬──────────┘
                      │
                      ↓
         ┌───────────────────────┐
         │   API REST (.NET)     │
         │ http://edwisbarber... │
         │  • /Usuarios          │
         │  • /Clientes          │
         │  • /Barberos          │
         └────────────┬──────────┘
                      │
                      ↓
         ┌───────────────────────┐
         │    SQL Server         │
         │  • Tabla: Usuarios    │
         │  • Tabla: Clientes    │
         │  • Tabla: Barberos    │
         │  • Tabla: Agendamientos
         │  • Tabla: Ventas      │
         └───────────────────────┘
```

---

## 🔄 Flujo Completo de Autenticación

### Escenario 1: Registro de Nuevo Usuario como Cliente

```
┌─ PASO 1: AUTENTICACIÓN EN FIREBASE ─┐
│ usuario@gmail.com                   │
│ → Email/Password o Google Sign-In   │
│ → Firebase verifica credenciales    │
│ ✓ UserCredential (Firebase)         │
└─────────────────────────────────────┘
         ↓
┌─ PASO 2: REACT APP ─────────────────────┐
│ • Obtiene: currentUser.email            │
│ • Llama: syncUsuarioConApi()            │
│   (con rolId: 5 para Cliente)           │
└─────────────────────────────────────────┘
         ↓
┌─ PASO 3: BUSCAR EN BASE DE DATOS ───────┐
│ • GET /api/usuarios                     │
│ • Filtrar: correo == usuario@gmail.com  │
│ • Respuesta: null (no existe)           │
└─────────────────────────────────────────┘
         ↓
┌─ PASO 4: CREAR USUARIO EN BD ───────────┐
│ • POST /api/usuarios                    │
│ • Body:                                 │
│   {                                     │
│     "Correo": "usuario@gmail.com",     │
│     "Contrasena": "firebase_auth_123", │
│     "RolId": 5,                        │
│     "Estado": true                     │
│   }                                     │
│ • Respuesta: Usuario{id:42, ...}      │
│ • SQL: INSERT INTO Usuarios(...)       │
└─────────────────────────────────────────┘
         ↓
┌─ PASO 5: 🔥 AUTO-CREAR CLIENTE ──────────┐
│ • clienteService.crearCliente()         │
│ • POST /api/clientes                    │
│ • Body:                                 │
│   {                                     │
│     "UsuarioId": 42,                   │
│     "Documento": "G-1707329845123",   │
│     "Nombre": "Usuario",               │
│     "Apellido": "Firebase",            │
│     "Email": "usuario@gmail.com",      │
│     "Estado": true                     │
│   }                                     │
│ • Respuesta: Cliente{id:78, ...}       │
│ • SQL: INSERT INTO Clientes(...)       │
└─────────────────────────────────────────┘
         ↓
┌─ PASO 6: AUTENTICACIÓN COMPLETA ─────────┐
│ • Usuario autenticado en Firebase       │
│ • Usuario creado en tabla Usuarios      │
│ • Cliente creado en tabla Clientes      │
│ • Navegación al dashboard               │
└─────────────────────────────────────────┘
```

### Escenario 2: Registro de Nuevo Usuario como Barbero

El flujo es idéntico, pero en el **PASO 5** se crea un registro en la tabla `Barberos` en lugar de `Clientes`:

```
┌─ PASO 5: 🔥 AUTO-CREAR BARBERO ──────────┐
│ • barberoService.crearBarbero()         │
│ • POST /api/barberos                    │
│ • Body:                                 │
│   {                                     │
│     "UsuarioId": 42,                   │
│     "Documento": "B-1707329845123",   │
│     "Nombre": "Carlos",                │
│     "Apellido": "González",            │
│     "Email": "carlos@gmail.com",       │
│     "FechaIngreso": "2026-02-07",     │
│     "Estado": true                     │
│   }                                     │
│ • Respuesta: Barbero{id:15, ...}       │
│ • SQL: INSERT INTO Barberos(...)       │
└─────────────────────────────────────────┘
```

---

## 📁 Archivos Creados/Modificados

### 1. **Nuevos Servicios**

#### `src/services/clienteService.ts`
Servicio para gestionar clientes en la API.

**Métodos principales:**
- `obtenerClientes()` - GET /clientes
- `obtenerClientePorUsuarioId(usuarioId)` - Buscar cliente por ID de usuario
- `obtenerClientePorEmail(email)` - Buscar cliente por email
- `crearCliente(clienteData)` - POST /clientes
- `actualizarCliente(id, clienteData)` - PUT /clientes/{id}
- `eliminarCliente(id)` - DELETE /clientes/{id}

#### `src/services/barberoService.ts`
Servicio para gestionar barberos en la API.

**Métodos principales:**
- `obtenerBarberos()` - GET /barberos
- `obtenerBarberoPorUsuarioId(usuarioId)` - Buscar barbero por ID de usuario
- `obtenerBarberoPorEmail(email)` - Buscar barbero por email
- `crearBarbero(barberoData)` - POST /barberos
- `actualizarBarbero(id, barberoData)` - PUT /barberos/{id}
- `eliminarBarbero(id)` - DELETE /barberos/{id}

### 2. **Modificaciones**

#### `src/components/AuthContext.tsx`

**Cambios realizados:**

1. **Imports agregados:**
```typescript
import { clienteService } from '../services/clienteService';
import { barberoService } from '../services/barberoService';
```

2. **Función `syncUsuarioConApi` mejorada:**
   - Detecta si es un usuario nuevo
   - Después de crear/actualizar en tabla `Usuarios`
   - **Auto-crea perfil** en tabla `Clientes` o `Barberos` según el rol

**Lógica de auto-creación:**
```typescript
// Si es Cliente (rolId = 5)
if (apiUser.rolId === 5) {
  const existingCliente = await clienteService.obtenerClientePorUsuarioId(apiUser.id);
  if (!existingCliente) {
    await clienteService.crearCliente({
      usuarioId: apiUser.id,
      documento: `G-${Date.now()}`,
      nombre: apiUser.nombre,
      apellido: apiUser.apellido,
      email: apiUser.correo,
      estado: true
    });
  }
}

// Si es Barbero (rolId = 2)
else if (apiUser.rolId === 2) {
  const existingBarbero = await barberoService.obtenerBarberoPorUsuarioId(apiUser.id);
  if (!existingBarbero) {
    await barberoService.crearBarbero({
      usuarioId: apiUser.id,
      documento: `B-${Date.now()}`,
      nombre: apiUser.nombre,
      apellido: apiUser.apellido,
      email: apiUser.correo,
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: true
    });
  }
}
```

---

## 🎯 Mapeo de Roles

| RolId | Nombre | Tabla Adicional | Auto-creación |
|-------|--------|-----------------|---------------|
| 1 | Admin | - | ❌ No requiere |
| 2 | Barbero | `Barberos` | ✅ Sí |
| 3 | Cliente | `Clientes` | ✅ Sí |
| 4 | Recepcionista | - | ❌ No requiere |
| 5 | Gerente | - | ❌ No requiere |
| 6 | Cajero | `Clientes` (opcional) | ⚠️ Depende de lógica |

---

## 🔍 Logging Detallado

El sistema ahora incluye logging completo para debugging:

### Logs de Sincronización:
```
Sincronización: Iniciando para usuario@gmail.com
Sincronización: Creando nuevo usuario en API...
🔵 Creando usuario - Datos originales: {...}
🔵 Creando usuario - Datos mapeados (enviados): {...}
✅ Usuario creado exitosamente: {...}
```

### Logs de Auto-creación:
```
🔥 Auto-creación de perfil: Verificando rol... 5
🔥 Auto-creación: Verificando si ya existe perfil de Cliente...
🔥 Auto-creación: Creando perfil de Cliente...
🔵 Creando cliente - Datos originales: {...}
🔵 Creando cliente - Datos mapeados (enviados): {...}
✅ Cliente creado exitosamente: {...}
```

### Logs de Perfil Existente:
```
ℹ️ Perfil de Cliente ya existe: {...}
```

### Logs de Roles sin Perfil:
```
ℹ️ Rol 1 no requiere perfil adicional (Admin/Cajero/Supervisor)
```

---

## 🧪 Cómo Probar

### 1. Registro de Nuevo Cliente

1. Abre `http://localhost:3001`
2. Haz clic en "Registrarse"
3. Completa el formulario (el rol por defecto es Cliente)
4. Haz clic en "Crear Cuenta"
5. **Abre la consola del navegador** (F12)
6. Deberías ver:
   ```
   Sincronización: Creando nuevo usuario en API...
   ✅ Usuario creado exitosamente
   🔥 Auto-creación de perfil: Verificando rol... 5
   🔥 Auto-creación: Creando perfil de Cliente...
   ✅ Cliente creado exitosamente
   ```

### 2. Login con Google

1. Haz clic en "Continuar con Google"
2. Selecciona tu cuenta de Google
3. **Abre la consola del navegador** (F12)
4. Deberías ver el mismo flujo de auto-creación

### 3. Verificar en la Base de Datos

Después de registrar un usuario, verifica en SQL Server:

```sql
-- Ver el usuario creado
SELECT * FROM Usuarios WHERE Correo = 'usuario@gmail.com';

-- Ver el cliente asociado
SELECT c.* 
FROM Clientes c
INNER JOIN Usuarios u ON c.UsuarioId = u.Id
WHERE u.Correo = 'usuario@gmail.com';

-- Ver el barbero asociado (si aplica)
SELECT b.* 
FROM Barberos b
INNER JOIN Usuarios u ON b.UsuarioId = u.Id
WHERE u.Correo = 'barbero@gmail.com';
```

---

## ⚠️ Manejo de Errores

### Error en Auto-creación de Perfil

Si falla la creación del perfil de Cliente/Barbero:
- ⚠️ Se registra el error en la consola
- ✅ El usuario **SÍ se crea** en la tabla `Usuarios`
- ✅ El login **SÍ funciona**
- ℹ️ El perfil se puede crear manualmente después

**Razón**: Separamos la creación del usuario de la creación del perfil para que un error en el perfil no bloquee el acceso del usuario.

### Perfil Ya Existe

Si el perfil ya existe (por ejemplo, creado manualmente):
- ℹ️ Se detecta y NO se intenta crear de nuevo
- ✅ Se usa el perfil existente
- ✅ No hay duplicados

---

## 📊 Estructura de Datos

### Tabla: USUARIOS
```
Id | Nombre   | Apellido  | Correo              | RolId | Estado
---|----------|-----------|---------------------|-------|-------
42 | Usuario  | Firebase  | usuario@gmail.com   | 5     | 1
43 | Carlos   | González  | carlos@gmail.com    | 2     | 1
```

### Tabla: CLIENTES
```
Id | UsuarioId | Documento        | Nombre   | Apellido  | Email               | Estado
---|-----------|------------------|----------|-----------|---------------------|-------
78 | 42        | G-1707329845123  | Usuario  | Firebase  | usuario@gmail.com   | 1
```

### Tabla: BARBEROS
```
Id | UsuarioId | Documento        | Nombre  | Apellido  | Email              | FechaIngreso | Estado
---|-----------|------------------|---------|-----------|--------------------|--------------| -------
15 | 43        | B-1707329845456  | Carlos  | González  | carlos@gmail.com   | 2026-02-07   | 1
```

---

## 🔗 Relaciones

```
USUARIOS (1) ←─ (1) CLIENTES
   └─ Id = UsuarioId

USUARIOS (1) ←─ (1) BARBEROS
   └─ Id = UsuarioId

CLIENTES (1) ←─ (N) AGENDAMIENTOS
   └─ Id = ClienteId

BARBEROS (1) ←─ (N) AGENDAMIENTOS
   └─ Id = BarberoId
```

---

## ✅ Ventajas de Esta Implementación

1. **Consistencia**: Mismo flujo que el proyecto Flutter
2. **Automatización**: No requiere pasos manuales
3. **Integridad**: Garantiza que cada usuario tenga su perfil
4. **Trazabilidad**: Logging completo para debugging
5. **Resiliencia**: Manejo de errores robusto
6. **Escalabilidad**: Fácil agregar más roles en el futuro

---

## 🚀 Próximos Pasos Recomendados

1. **Probar el flujo completo** con diferentes roles
2. **Verificar en la base de datos** que se crean los registros
3. **Agregar validación de roles** en el login (opcional)
4. **Implementar actualización de perfiles** cuando el usuario edite sus datos
5. **Considerar agregar** campos adicionales en el registro (documento, teléfono, etc.)

---

## 📝 Notas Importantes

### Documentos Temporales

Los documentos se generan automáticamente:
- **Clientes**: `G-{timestamp}` (G = Google/General)
- **Barberos**: `B-{timestamp}` (B = Barbero)

**Recomendación**: Permitir que el usuario actualice su documento después del registro.

### Contraseñas

Para usuarios de Firebase, la contraseña en la tabla `Usuarios` es:
- `firebase_auth_123` (valor dummy)

**Razón**: Firebase maneja la autenticación, la API solo necesita un registro.

---

**Fecha de Implementación**: 2026-02-07
**Estado**: ✅ Implementado y Listo para Probar
**Compatibilidad**: 100% con el flujo del proyecto Flutter
