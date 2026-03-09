# 🔍 Guía de Diagnóstico - Error 400 al Crear Usuario

## 📊 Estado Actual

**Problema Detectado**: Error 400 (Bad Request) al intentar crear un nuevo usuario en la API

**Flujo del Error**:
1. ✅ GET /api/usuarios → 200 OK (obtiene usuarios existentes)
2. ❌ POST /api/usuarios → 400 Bad Request (intenta crear usuario nuevo)

---

## 🧪 Pasos para Diagnosticar

### 1. Abre la Consola del Navegador
- Presiona **F12**
- Ve a la pestaña **Console**

### 2. Intenta Iniciar Sesión
Usa una de estas cuentas:

**Opción A - Cuenta que debería existir:**
- Email: `admin@elitebarbershop.com`
- Contraseña: `admin123`

**Opción B - Cuenta nueva (para ver el error):**
- Email: `test@example.com`
- Contraseña: `test123`

### 3. Busca en la Consola

Busca estos mensajes (en orden):

```
🔵 Creando usuario - Datos originales: {...}
🔵 Creando usuario - Datos mapeados (enviados): {...}
📤 Request Body: {...}
❌ API Error [400]: ...
❌ Error creating usuario: ...
```

### 4. Copia y Comparte

Copia **TODO** el contenido de la consola que aparezca después de intentar iniciar sesión, especialmente:
- Los datos originales
- Los datos mapeados
- El Request Body
- El mensaje de error del servidor

---

## 🎯 Qué Buscar

### Campos Requeridos por la API

Según el código, estos son los campos que se envían al crear un usuario:

```json
{
  "Nombre": "string",
  "Apellido": "string",
  "Correo": "string",
  "Contrasena": "string",
  "RolId": number,
  "FotoPerfil": "string | null",
  "Estado": boolean
}
```

### Posibles Causas del Error 400

1. **Campo faltante**: La API requiere un campo que no estamos enviando
2. **Formato incorrecto**: Un campo tiene un formato que la API no acepta
3. **Validación fallida**: Los datos no cumplen con las reglas de validación del servidor
4. **Email duplicado**: El email ya existe en la base de datos
5. **Contraseña débil**: La contraseña no cumple con los requisitos mínimos

---

## 🔧 Soluciones Temporales

### Opción 1: Usar Solo Cuentas Existentes

Si las cuentas de demostración ya existen en la base de datos, el login debería funcionar sin necesidad de crear usuarios nuevos.

**Cuentas de demostración:**
- `admin@elitebarbershop.com` / `admin123`
- `juan.perez@email.com` / `cliente123`
- `maria.gomez@email.com` / `cliente123`

### Opción 2: Crear Usuario Manualmente en la Base de Datos

Si tienes acceso a la base de datos, puedes crear el usuario directamente allí.

### Opción 3: Ajustar los Datos Enviados

Una vez que veamos el error exacto del servidor, podemos ajustar los datos que se envían.

---

## 📝 Información Adicional

### Endpoint de la API
```
POST http://edwisbarber.somee.com/api/usuarios
```

### Headers
```
Content-Type: application/json
```

### Ejemplo de Body Esperado
```json
{
  "Nombre": "Usuario",
  "Apellido": "Firebase",
  "Correo": "usuario@example.com",
  "Contrasena": "firebase_auth_123",
  "RolId": 5,
  "FotoPerfil": null,
  "Estado": true
}
```

---

## 🚀 Próximos Pasos

1. **Abre la consola del navegador** (F12)
2. **Intenta iniciar sesión** con cualquier cuenta
3. **Copia TODO el output de la consola**
4. **Compártelo conmigo** para que pueda ver:
   - Qué datos se están enviando exactamente
   - Qué error específico devuelve el servidor
   - Si hay algún campo faltante o con formato incorrecto

Con esa información podré darte una solución exacta al problema.

---

**Fecha**: 2026-02-07
**Estado**: Esperando logs de la consola para diagnóstico preciso
