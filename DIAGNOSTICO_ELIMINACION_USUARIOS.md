# 🗑️ Diagnóstico: Problema de Eliminación de Usuarios

## 📋 Descripción del Problema

Los usuarios se eliminan del frontend (desaparecen de la lista) pero **NO se eliminan de la base de datos**. Cuando se recarga la página, los usuarios "eliminados" vuelven a aparecer.

---

## 🔍 Análisis del Código

### Flujo Actual de Eliminación

1. **Usuario hace clic en eliminar** → `UsersPage.tsx` línea 740
2. **Se abre diálogo de confirmación** → `handleDeleteUser()` línea 250-256
3. **Usuario confirma** → `confirmDeleteUser()` línea 258-276
4. **Se llama a AuthContext** → `deleteUser()` línea 262
5. **AuthContext llama a la API** → `apiService.deleteUsuario()` línea 355
6. **API hace petición DELETE** → `DELETE /api/usuarios/{id}` línea 192-194
7. **Se recarga la lista** → `loadUsers()` línea 264

### Código Relevante

#### UsersPage.tsx (línea 258-276)
```typescript
const confirmDeleteUser = async () => {
  if (!userToDelete) return;

  try {
    const result = await deleteUser(userToDelete.id.toString());
    if (result.success) {
      await loadUsers(); // ✅ Recarga la lista
      success("Usuario eliminado", `El usuario "${userToDelete.nombres} ${userToDelete.apellidos}" ha sido eliminado del sistema.`);
    } else {
      error('Error al eliminar', result.error || 'No se pudo eliminar el usuario');
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    error('Error al eliminar usuario', 'No se pudo eliminar el usuario de la API');
  } finally {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  }
};
```

#### AuthContext.tsx (línea 345-362)
```typescript
const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const apiUserId = parseInt(userId);

    // No permitir eliminar el propio usuario
    if (user && user.id === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta' };
    }

    // Eliminar usuario en la API
    await apiService.deleteUsuario(apiUserId); // ✅ Llama a la API

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message || 'Error al eliminar usuario' };
  }
};
```

#### api.ts (línea 189-212 - ACTUALIZADO)
```typescript
async deleteUsuario(id: number): Promise<void> {
  try {
    console.log(`🗑️ Intentando eliminar usuario con ID: ${id}`);
    const response = await this.request(`/usuarios/${id}`, {
      method: 'DELETE',
    });
    
    const text = await response.text();
    console.log(`✅ Usuario eliminado - Respuesta del servidor:`, text || '(sin contenido)');
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log(`📊 Datos de respuesta parseados:`, data);
      } catch (e) {
        console.log(`📝 Respuesta en texto plano:`, text);
      }
    }
  } catch (error: any) {
    console.error('❌ Error deleting usuario:', error);
    console.error('❌ Detalles del error:', error.message);
    throw error;
  }
}
```

---

## 🎯 Posibles Causas

### 1. **La API No Elimina Físicamente el Usuario** (MÁS PROBABLE)
La API podría estar haciendo una **eliminación lógica** en lugar de física:
- Cambia el campo `estado` a `false` o `deleted`
- Marca un campo `fechaEliminacion`
- **NO elimina el registro de la base de datos**

**Evidencia**: Según conversaciones anteriores, existe un sistema de "smart delete" que:
- Hace eliminación física cuando no hay historial
- Hace eliminación lógica cuando hay relaciones/historial

### 2. **La API Devuelve 200 OK Pero No Hace Nada**
El servidor podría estar:
- Aceptando la petición DELETE
- Devolviendo 200 OK
- Pero no ejecutando la eliminación en la base de datos

### 3. **Problema de Permisos en la Base de Datos**
El usuario de la API podría no tener permisos para eliminar registros.

### 4. **Restricciones de Clave Foránea**
Si hay relaciones con otras tablas (agendamientos, ventas, etc.), la base de datos podría estar rechazando la eliminación.

---

## 🧪 Cómo Diagnosticar

### Paso 1: Ver los Logs en la Consola

1. **Abre la consola del navegador** (F12)
2. **Intenta eliminar un usuario**
3. **Busca estos mensajes**:
   ```
   🗑️ Intentando eliminar usuario con ID: X
   API [DELETE]: /api/usuarios/X
   ✅ Usuario eliminado - Respuesta del servidor: ...
   ```

4. **Comparte conmigo**:
   - El ID del usuario que intentaste eliminar
   - La respuesta del servidor
   - Si hay algún error

### Paso 2: Verificar en la Base de Datos

Después de "eliminar" un usuario:
1. Recarga la página
2. ¿El usuario vuelve a aparecer?
3. Si sí, el problema está en el backend

### Paso 3: Verificar el Endpoint de la API

Verifica manualmente con una herramienta como Postman o curl:
```bash
DELETE http://edwisbarber.somee.com/api/usuarios/{id}
```

---

## 💡 Soluciones Propuestas

### Solución 1: Verificar Qué Hace Realmente la API

Necesitamos ver qué devuelve el servidor cuando hacemos DELETE. Los logs mejorados nos dirán:
- Si la petición llega al servidor
- Qué responde el servidor
- Si hay algún error

### Solución 2: Implementar Eliminación Lógica en el Frontend

Si la API hace eliminación lógica, debemos:
1. **Filtrar usuarios eliminados** al cargarlos:
```typescript
const formattedUsers = apiUsers
  .filter(user => user.estado !== false) // Filtrar eliminados
  .map(user => ({...}));
```

2. **O mostrar un campo para ver usuarios eliminados**

### Solución 3: Forzar Eliminación Física

Si queremos eliminación física, necesitamos:
1. Verificar que la API soporte eliminación física
2. Posiblemente pasar un parámetro como `?force=true`
3. O usar un endpoint diferente

### Solución 4: Cambiar el Estado en Lugar de Eliminar

En lugar de eliminar, podríamos:
1. Cambiar el `estado` del usuario a `false`
2. Filtrar usuarios inactivos en la vista
3. Agregar una opción para "ver usuarios eliminados"

---

## 🔧 Cambios Realizados

### Archivo: `src/services/api.ts`

**Agregado logging detallado** para ver:
- Cuándo se intenta eliminar un usuario
- Qué responde el servidor
- Si hay errores

Esto nos permitirá diagnosticar exactamente qué está pasando.

---

## 🚀 Próximos Pasos

1. **Intenta eliminar un usuario**
2. **Abre la consola del navegador** (F12)
3. **Copia todos los mensajes** que aparezcan, especialmente:
   - 🗑️ Intentando eliminar usuario...
   - ✅ Usuario eliminado...
   - ❌ Error...

4. **Comparte esos mensajes conmigo**

Con esa información podré:
- Determinar si la API está eliminando o no
- Ver qué responde el servidor
- Implementar la solución correcta

---

## 📊 Información Adicional

### Endpoint
```
DELETE http://edwisbarber.somee.com/api/usuarios/{id}
```

### Respuestas Esperadas

**Eliminación exitosa:**
- Status: 200 OK o 204 No Content
- Body: Vacío o mensaje de confirmación

**Eliminación fallida:**
- Status: 400 Bad Request (validación)
- Status: 404 Not Found (usuario no existe)
- Status: 409 Conflict (restricciones de clave foránea)
- Status: 500 Internal Server Error (error del servidor)

---

## 🔗 Referencias

- Conversación anterior sobre eliminación de usuarios: `9a1beaa5-45b1-49fd-98f3-9df1d4350dc1`
- Conversación sobre lógica de eliminación: `92394442-252f-4764-b5fa-1c082c49edb9`

Según esas conversaciones, existe un sistema de "smart delete" que:
- Desactiva registros relacionados (barberos, clientes)
- Hace eliminación física cuando es posible
- Hace eliminación lógica cuando hay historial

---

**Fecha**: 2026-02-07
**Estado**: Esperando logs para diagnóstico preciso
