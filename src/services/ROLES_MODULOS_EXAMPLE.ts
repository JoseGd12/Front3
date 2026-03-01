/**
 * EJEMPLO DE USO: Consumo de API de Roles y Módulos
 * 
 * Este archivo demuestra cómo usar los servicios de roles y módulos
 * para interactuar con http://edwisbarber.somee.com/api/
 */

import { apiService } from './api';
import { rolesModulosService } from './rolesModulosService';

// ==================== EJEMPLOS DE USO ====================

export async function ejemploConsumirAPI() {
  try {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║     EJEMPLO: Consumo de API de Roles y Módulos      ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    // 1. OBTENER TODOS LOS ROLES
    console.log('📋 1. Obteniendo todos los roles...\n');
    const roles = await apiService.getRoles();
    console.log('✅ Roles obtenidos:', roles);
    console.log(`Total: ${roles.length} roles\n`);

    // 2. OBTENER TODOS LOS MÓDULOS
    console.log('📚 2. Obteniendo todos los módulos...\n');
    const modulos = await apiService.getModulos();
    console.log('✅ Módulos obtenidos:', modulos);
    console.log(`Total: ${modulos.length} módulos\n`);

    // 3. OBTENER ASIGNACIONES ROL-MÓDULO
    console.log('🔗 3. Obteniendo asignaciones rol-módulo...\n');
    const rolesModulos = await apiService.getRolesModulos();
    console.log('✅ Asignaciones obtenidas:', rolesModulos);
    console.log(`Total: ${rolesModulos.length} asignaciones\n`);

    // 4. SI HAY ROLES, OBTENER DETALLES DEL PRIMER ROL
    if (roles.length > 0) {
      const rolId = roles[0].id;
      console.log(`📊 4. Obteniendo detalles del rol ${rolId}...\n`);

      // 4a. Obtener módulos del rol
      const modulosDelRol = await rolesModulosService.getModulosDeRol(rolId);
      console.log(`✅ Módulos del rol ${rolId}:`, modulosDelRol);

      // 4b. Obtener permisos del rol
      const permisosRol = await rolesModulosService.getPermisosRol(rolId);
      console.log(`✅ Permisos del rol ${rolId}:`, permisosRol);

      // 4c. Obtener rol enriquecido
      const rolCompleто = await rolesModulosService.getRoleById(rolId);
      console.log(`✅ Rol completo ${rolId}:`, rolCompleто);
    }

    // 5. CREAR NUEVO ROL (si necesitas)
    // console.log('\n➕ 5. Creando nuevo rol...\n');
    // const nuevoRol = await apiService.createRole({
    //   nombre: 'Nuevo Rol',
    //   descripcion: 'Descripción del rol',
    //   estado: true
    // });
    // console.log('✅ Rol creado:', nuevoRol);

    // 6. ASIGNAR MÓDULOS A UN ROL
    // if (roles.length > 0 && modulos.length > 0) {
    //   console.log(`\n🔗 6. Asignando módulos al rol ${roles[0].id}...\n`);
    //   
    //   const asignaciones = modulos.slice(0, 2).map(m => ({
    //     moduloId: m.id,
    //     permisos: {
    //       puedeVer: true,
    //       puedeCrear: true,
    //       puedeEditar: true,
    //       puedeEliminar: false
    //     }
    //   }));
    //   
    //   await rolesModulosService.asignarModulosARol(roles[0].id, asignaciones);
    //   console.log(`✅ Módulos asignados al rol ${roles[0].id}`);
    // }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║              ✅ Ejemplo completado                  ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error en ejemplo:', error);
    throw error;
  }
}

// ==================== CASOS DE USO COMUNES ====================

/**
 * Caso 1: Obtener todos los roles con sus módulos
 */
export async function obtenerRolesConModulos() {
  console.log('📋 Obteniendo roles con módulos...');
  const rolesConModulos = await rolesModulosService.getRolesConModulos();
  console.log('✅ Resultado:', rolesConModulos);
  return rolesConModulos;
}

/**
 * Caso 2: Obtener los datos de un rol específico
 */
export async function obtenerDetallesRol(rolId: number) {
  console.log(`📊 Obteniendo detalles del rol ${rolId}...`);
  const rol = await rolesModulosService.getRoleById(rolId);
  console.log('✅ Resultado:', rol);
  return rol;
}

/**
 * Caso 3: Asignar múltiples módulos a un rol con permisos específicos
 */
export async function asignarModulosConPermisos(
  rolId: number,
  asignaciones: { moduloId: number; puedeVer?: boolean; puedeCrear?: boolean; puedeEditar?: boolean; puedeEliminar?: boolean }[]
) {
  console.log(`🔧 Asignando ${asignaciones.length} módulos al rol ${rolId}...`);
  
  const asignacionesFormateadas = asignaciones.map(a => ({
    moduloId: a.moduloId,
    permisos: {
      puedeVer: a.puedeVer ?? true,
      puedeCrear: a.puedeCrear ?? false,
      puedeEditar: a.puedeEditar ?? false,
      puedeEliminar: a.puedeEliminar ?? false
    }
  }));
  
  await rolesModulosService.asignarModulosARol(rolId, asignacionesFormateadas);
  console.log(`✅ Módulos asignados al rol ${rolId}`);
}

/**
 * Caso 4: Verificar si un usuario con un rol tiene acceso a un módulo
 */
export async function verificarAccesoAModulo(rolId: number, moduloId: number) {
  console.log(`🔐 Verificando acceso del rol ${rolId} al módulo ${moduloId}...`);
  const tieneAcceso = await rolesModulosService.tieneAccesoAModulo(rolId, moduloId);
  console.log(`✅ Resultado: ${tieneAcceso ? 'SÍ tiene acceso' : 'NO tiene acceso'}`);
  return tieneAcceso;
}

/**
 * Caso 5: Verificar permisos específicos de un rol en un módulo
 */
export async function verificarPermisos(
  rolId: number,
  moduloId: number,
  permiso: 'ver' | 'crear' | 'editar' | 'eliminar'
) {
  console.log(`🔐 Verificando permiso "${permiso}" del rol ${rolId} en módulo ${moduloId}...`);
  const tienePermiso = await rolesModulosService.tienePermiso(rolId, moduloId, permiso);
  console.log(`✅ Resultado: ${tienePermiso ? 'SÍ tiene permiso' : 'NO tiene permiso'}`);
  return tienePermiso;
}

/**
 * Caso 6: Actualizar permisos de un rol en un módulo específico
 */
export async function actualizarPermisosModulo(
  rolId: number,
  moduloId: number,
  nuevosPermisos: { puedeVer?: boolean; puedeCrear?: boolean; puedeEditar?: boolean; puedeEliminar?: boolean }
) {
  console.log(`🔧 Actualizando permisos del rol ${rolId} en módulo ${moduloId}...`);
  
  // Obtener la asignación actual
  const rolesModulos = await apiService.getRolesModulosByRolId(rolId);
  const asignacion = rolesModulos.find(rm => rm.moduloId === moduloId);
  
  if (!asignacion || !asignacion.id) {
    console.error('❌ No existe asignación para actualizar');
    return;
  }
  
  // Actualizar
  await rolesModulosService.actualizarPermisos(asignacion.id, nuevosPermisos);
  console.log(`✅ Permisos actualizados`);
}

/**
 * Caso 7: Eliminar un módulo de un rol
 */
export async function eliminarModuloDeRol(rolId: number, moduloId: number) {
  console.log(`🗑️ Eliminando módulo ${moduloId} del rol ${rolId}...`);
  await rolesModulosService.eliminarModuloDeRol(rolId, moduloId);
  console.log(`✅ Módulo eliminado del rol`);
}

/**
 * Caso 8: Obtener estructura completa de la aplicación
 * (Todos los roles, módulos y sus relaciones)
 */
export async function obtenerEstructuraCompleta() {
  console.log('📊 Obteniendo estructura completa de la aplicación...\n');
  
  const roles = await apiService.getRoles();
  const modulos = await apiService.getModulos();
  const rolesModulos = await apiService.getRolesModulos();
  
  const estructura = {
    totalRoles: roles.length,
    totalModulos: modulos.length,
    totalAsignaciones: rolesModulos.length,
    roles: roles.map(r => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      estado: r.estado,
      modulosAsignados: rolesModulos
        .filter(rm => rm.rolId === r.id)
        .map(rm => {
          const modulo = modulos.find(m => m.id === rm.moduloId);
          return {
            moduloId: rm.moduloId,
            moduloNombre: modulo?.nombre,
            permisos: {
              ver: rm.puedeVer,
              crear: rm.puedeCrear,
              editar: rm.puedeEditar,
              eliminar: rm.puedeEliminar
            }
          };
        })
    })),
    modulos: modulos.map(m => ({
      id: m.id,
      nombre: m.nombre,
      estado: m.estado,
      asignadosA: rolesModulos
        .filter(rm => rm.moduloId === m.id)
        .map(rm => {
          const rol = roles.find(r => r.id === rm.rolId);
          return {
            rolId: rm.rolId,
            rolNombre: rol?.nombre
          };
        })
    }))
  };
  
  console.log('✅ Estructura obtenida:');
  console.log(JSON.stringify(estructura, null, 2));
  return estructura;
}

// ==================== SCRIPT DE INICIALIZACIÓN ====================

/**
 * Inicializar la aplicación con roles y módulos por defecto
 * (Descomenta para usar)
 */
export async function inicializarDatos() {
  console.log('🚀 Inicializando datos de la aplicación...\n');
  
  try {
    // Obtener roles existentes
    const roles = await apiService.getRoles();
    console.log(`📋 Roles existentes: ${roles.length}`);

    if (roles.length === 0) {
      console.log('ℹ️ No hay roles. Considera crearlos manualmente en la API.');
    } else {
      // Listar roles
      roles.forEach(r => {
        console.log(`  - ${r.nombre} (ID: ${r.id})`);
      });
    }

    // Obtener módulos existentes
    const modulos = await apiService.getModulos();
    console.log(`\n📚 Módulos existentes: ${modulos.length}`);

    if (modulos.length === 0) {
      console.log('ℹ️ No hay módulos. Considera crearlos manualmente en la API.');
    } else {
      // Listar módulos
      modulos.forEach(m => {
        console.log(`  - ${m.nombre} (ID: ${m.id})`);
      });
    }

    // Obtener asignaciones
    const rolesModulos = await apiService.getRolesModulos();
    console.log(`\n🔗 Asignaciones rol-módulo: ${rolesModulos.length}`);

    console.log('\n✅ Inicialización completada\n');
  } catch (error) {
    console.error('❌ Error durante inicialización:', error);
  }
}

// ==================== EXPORT ====================

export default {
  ejemploConsumirAPI,
  obtenerRolesConModulos,
  obtenerDetallesRol,
  asignarModulosConPermisos,
  verificarAccesoAModulo,
  verificarPermisos,
  actualizarPermisosModulo,
  eliminarModuloDeRol,
  obtenerEstructuraCompleta,
  inicializarDatos
};
