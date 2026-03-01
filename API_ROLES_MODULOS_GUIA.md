# 📚 Consumo de API: Roles y Módulos

## 📖 Descripción

Este documento describe cómo se ha configurado el proyecto para consumir correctamente la API de roles y módulos desde **http://edwisbarber.somee.com/api/**.

---

## 🔧 Cambios Realizados

### 1. **Configuración del Proxy (vite.config.ts)**

Se actualizó la configuración del servidor de desarrollo para redirigir correctamente las peticiones a la API remota:

```typescript
server: {
  port: 3000,
  open: true,
  proxy: {
    '/api': {
      target: 'http://edwisbarber.somee.com',  // ✅ Cambio: localhost:5000 → edwisbarber.somee.com
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, '/api'),
    }
  }
},
```

**Impacto:** Todas las peticiones a `/api/*` serán redirigidas a `http://edwisbarber.somee.com/api/*`

---

### 2. **Mejoras en el Servicio de API (src/services/api.ts)**

Se añadieron métodos mejorados para consumir los endpoints de Roles, Módulos y RolesModulos con:

- ✅ Logs detallados de cada operación
- ✅ Manejo correcto de formatos PascalCase
- ✅ Control de errores robusto
- ✅ Soporte para operaciones CRUD completas

#### Métodos de Roles:
```typescript
// Obtener todos los roles
getRoles(): Promise<any[]>

// Obtener un rol específico
getRoleById(id: number): Promise<any>

// Crear un nuevo rol
createRole(roleData: any): Promise<any>

// Actualizar un rol
updateRole(id: number, roleData: any): Promise<any>

// Eliminar un rol
deleteRole(id: number): Promise<void>
```

#### Métodos de Módulos:
```typescript
// Obtener todos los módulos
getModulos(): Promise<any[]>

// Obtener un módulo específico
getModuloById(id: number): Promise<any>

// Crear un nuevo módulo
createModulo(moduloData: any): Promise<any>
```

#### Métodos de Roles-Módulos:
```typescript
// Obtener todas las asignaciones rol-módulo
getRolesModulos(): Promise<any[]>

// Obtener módulos de un rol
getRolesModulosByRolId(rolId: number): Promise<any[]>

// Asignar módulos a un rol
createRolModulo(rolModuloData: any): Promise<any>

// Actualizar permisos de una asignación
updateRolModulo(id: number, rolModuloData: any): Promise<any>

// Eliminar una asignación
deleteRolModulo(id: number): Promise<void>

// Eliminar todas las asignaciones de un rol
deleteRolesModulosByRolId(rolId: number): Promise<void>
```

---

### 3. **Servicio Mejorado de Roles y Módulos (src/services/rolesModulosService.ts)**

Se reescribió completamente con:

- ✅ Métodos organizados por categoría (Obtener, Crear, Actualizar, Eliminar)
- ✅ Métodos de validación de permisos
- ✅ Enriquecimiento de datos automático
- ✅ Logs informativos en cada operación
- ✅ Manejo completo de errores

#### Nuevos Métodos Disponibles:

**Obtener Datos:**
```typescript
getRolesConModulos(): Promise<Role[]>
getRoleById(roleId: number): Promise<Role | null>
getModulos(): Promise<Modulo[]>
getRolesModulos(): Promise<RolModulo[]>
getModulosDeRol(rolId: number): Promise<Modulo[]>
getPermisosRol(rolId: number): Promise<RolesModulo[]>
```

**Crear/Asignar:**
```typescript
asignarModulosARol(rolId: number, asignaciones: ...): Promise<void>
asignarModulosARolSimple(rolId: number, modulosIds: number[]): Promise<void>
asignarModuloARol(rolId: number, moduloId: number, permisos?: ...): Promise<RolesModulo>
```

**Actualizar:**
```typescript
actualizarPermisos(id: number, permisos: ...): Promise<RolesModulo>
actualizarPermisosRol(rolId: number, permisosMap: ...): Promise<void>
```

**Eliminar:**
```typescript
eliminarModulosDeRol(rolId: number): Promise<void>
eliminarModuloDeRol(rolId: number, moduloId: number): Promise<void>
```

**Validar:**
```typescript
tieneAccesoAModulo(rolId: number, moduloId: number): Promise<boolean>
tienePermiso(rolId: number, moduloId: number, permiso: ...): Promise<boolean>
```

---

## 📝 Cómo Usar

### Importar los servicios:

```typescript
import { apiService } from '@/services/api';
import { rolesModulosService } from '@/services/rolesModulosService';
```

### Ejemplos de Uso:

#### 1. Obtener todos los roles con sus módulos:
```typescript
const roles = await rolesModulosService.getRolesConModulos();
console.log(roles); // Roles enriquecidos con módulos
```

#### 2. Obtener detalles de un rol específico:
```typescript
const rol = await rolesModulosService.getRoleById(1);
console.log(rol); // Incluye módulos y permisos
```

#### 3. Obtener todos los módulos disponibles:
```typescript
const modulos = await rolesModulosService.getModulos();
console.log(modulos);
```

#### 4. Asignar módulos a un rol con permisos:
```typescript
await rolesModulosService.asignarModulosARol(1, [
  {
    moduloId: 1,
    permisos: {
      puedeVer: true,
      puedeCrear: true,
      puedeEditar: true,
      puedeEliminar: false
    }
  },
  {
    moduloId: 2,
    permisos: {
      puedeVer: true,
      puedeCrear: false,
      puedeEditar: false,
      puedeEliminar: false
    }
  }
]);
```

#### 5. Asignación rápida (todos con permisos por defecto):
```typescript
await rolesModulosService.asignarModulosARolSimple(1, [1, 2, 3]);
```

#### 6. Verificar si un rol tiene acceso a un módulo:
```typescript
const tieneAcceso = await rolesModulosService.tieneAccesoAModulo(1, 5);
if (tieneAcceso) {
  console.log('El rol tiene acceso al módulo');
}
```

#### 7. Verificar permisos específicos:
```typescript
const puedeCrcampearar = await rolesModulosService.tienePermiso(1, 5, 'crear');
const puedeEditar = await rolesModulosService.tienePermiso(1, 5, 'editar');
const puedeEliminar = await rolesModulosService.tienePermiso(1, 5, 'eliminar');

if (puedeCrampearar && puedeEditar) {
  console.log('El rol puede crear y editar en este módulo');
}
```

#### 8. Obtener módulos de un rol:
```typescript
const modulos = await rolesModulosService.getModulosDeRol(1);
console.log(modulos); // Módulos asignados al rol 1
```

#### 9. Obtener permisos de un rol:
```typescript
const permisos = await rolesModulosService.getPermisosRol(1);
console.log(permisos); // Todas las asignaciones del rol 1
```

#### 10. Actualizar permisos de una asignación:
```typescript
await rolesModulosService.actualizarPermisos(asignacionId, {
  puedeVer: true,
  puedeCrear: true,
  puedeEditar: true,
  puedeEliminar: true
});
```

---

## 📊 Estructura de Datos

### Role
```typescript
{
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  modulos?: Modulo[];
  rolesModulos?: RolesModulo[];
}
```

### Modulo
```typescript
{
  id: number;
  nombre: string;
  estado: boolean;
  rolesModulos?: RolesModulo[];
}
```

### RolesModulo (Asignación)
```typescript
{
  id?: number;
  rolId: number;
  moduloId: number;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  rol?: Role;
  modulo?: Modulo;
}
```

---

## 🧪 Archivo de Ejemplos

Se proporciona un archivo completo de ejemplos en:
📄 `src/services/ROLES_MODULOS_EXAMPLE.ts`

Este archivo contiene funciones de demostración que muestran cómo usar cada característica.

### Para ejecutar los ejemplos:

```typescript
import { ejemploConsumirAPI } from '@/services/ROLES_MODULOS_EXAMPLE';

// En tu componente o archivo de inicialización:
ejemploConsumirAPI();
```

### Casos de uso disponibles en el archivo:

1. `ejemploConsumirAPI()` - Demostración completa
2. `obtenerRolesConModulos()` - Obtener todos los roles
3. `obtenerDetallesRol(rolId)` - Detalles de un rol
4. `asignarModulosConPermisos(rolId, asignaciones)` - Asignar módulos
5. `verificarAccesoAModulo(rolId, moduloId)` - Verificar acceso
6. `verificarPermisos(rolId, moduloId, permiso)` - Verificar permisos
7. `actualizarPermisosModulo(rolId, moduloId, permisos)` - Actualizar permisos
8. `eliminarModuloDeRol(rolId, moduloId)` - Eliminar módulo
9. `obtenerEstructuraCompleta()` - Estructura completa
10. `inicializarDatos()` - Inicializar con datos por defecto

---

## 🔍 Logs y Debugging

Todos los métodos incluyen logs detallados que te ayudarán a entender qué se está enviando y recibiendo:

```
📥 Obteniendo roles desde: /api/Roles
✅ Roles obtenidos: [...]
📚 Obteniendo todos los módulos...
✅ Módulos obtenidos: [...]
🔗 Obteniendo todas las asignaciones rol-módulo...
✅ Asignaciones obtenidas: [...]
```

Abre la consola del navegador (F12 → Console) para ver todos los detalles de las operaciones.

---

## 🛠️ Troubleshooting

### Problema: Error de CORS
**Solución:** Verifica que el proxy en `vite.config.ts` esté correctamente configurado:
```typescript
proxy: {
  '/api': {
    target: 'http://edwisbarber.somee.com',
    changeOrigin: true,
    secure: false,
  }
}
```

### Problema: Las peticiones van a localhost en lugar de la API
**Solución:** Reinicia el servidor de desarrollo:
```bash
npm run dev
```

### Problema: Respuestas vacías o nulas
**Solución:** Verifica que:
1. La API está activa en http://edwisbarber.somee.com
2. Los endpoints existen: `/api/Roles`, `/api/Modulos`, `/api/RolesModulos`
3. La base de datos tiene datos para retornar

---

## 📚 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/Roles` | Obtener todos los roles |
| GET | `/api/Roles/{id}` | Obtener un rol específico |
| POST | `/api/Roles` | Crear un nuevo rol |
| PUT | `/api/Roles/{id}` | Actualizar un rol |
| DELETE | `/api/Roles/{id}` | Eliminar un rol |
| GET | `/api/Modulos` | Obtener todos los módulos |
| GET | `/api/Modulos/{id}` | Obtener un módulo específico |
| POST | `/api/Modulos` | Crear un nuevo módulo |
| GET | `/api/RolesModulos` | Obtener todas las asignaciones |
| POST | `/api/RolesModulos` | Crear una asignación |
| PUT | `/api/RolesModulos/{id}` | Actualizar una asignación |
| DELETE | `/api/RolesModulos/{id}` | Eliminar una asignación |

---

## 📝 Notas Importantes

1. **Capitalization:** La API usa **PascalCase** (ej: `RolId`, `PuedeVer`), pero los servicios manejan automáticamente la conversión desde/hacia **camelCase**

2. **Logs:** Todos los logs incluyen emojis para fácil identificación:
   - 📥 = Entrada de datos
   - 📚 = Datos de módulos
   - 🔗 = Asociaciones
   - 🔐 = Permisos/Seguridad
   - 🔧 = Operaciones de modificación
   - ✅ = Éxito
   - ❌ = Error
   - 🗑️ = Eliminación

3. **Compatibilidad:** El código mantiene compatibilidad con código existente que use `rolesModulosService`

4. **Manejo de Errores:** Todos los métodos manejan errores automáticamente y los registran en la consola

---

## 🎯 Próximos Pasos

1. Usa los servicios en tus componentes React
2. Maneja los estados de carga y error
3. Integra con tu contexto de autenticación
4. Considera cachear datos para mejorar rendimiento

---

**Última actualización:** 10 de febrero de 2026
**Versión:** 1.0.0
**Estado:** ✅ Listo para producción
