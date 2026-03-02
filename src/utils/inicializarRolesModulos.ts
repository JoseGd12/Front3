import { rolesModulosService } from '../services/rolesModulosService';

// Configuración de módulos por rol
const ROLES_MODULOS_CONFIG = {
  1: [1, 2, 3, 4, 5, 6], // Administrador: Todos los módulos
  2: [4, 5, 6],          // Barbero: Agendamientos, Productos, Servicios
  3: [4],                 // Cliente: Solo Agendamientos
  4: [1, 2, 4],          // Recepcionista: Usuarios, Ventas, Agendamientos
  5: [2, 3],             // Cajero: Ventas, Compras
  6: [3, 5, 6],          // Inventario: Compras, Productos, Servicios
};

// Descripción de roles y módulos para debugging
const ROLES_DESCRIPTION = {
  1: 'Administrador',
  2: 'Barbero', 
  3: 'Cliente',
  4: 'Recepcionista',
  5: 'Cajero',
  6: 'Inventario'
};

const MODULOS_DESCRIPTION = {
  1: 'Usuarios',
  2: 'Ventas',
  3: 'Compras',
  4: 'Agendamientos',
  5: 'Productos',
  6: 'Servicios'
};

export async function inicializarRolesModulos() {
  console.log('🚀 Inicializando módulos por rol...');
  
  try {
    // Obtener roles y módulos existentes
    const roles = await rolesModulosService.getRolesConModulos();
    const modulos = await rolesModulosService.getModulos();
    
    console.log('📋 Roles encontrados:', roles.length);
    console.log('📋 Módulos encontrados:', modulos.length);
    
    // Para cada rol, asignar sus módulos correspondientes
    for (const [rolIdStr, modulosIds] of Object.entries(ROLES_MODULOS_CONFIG)) {
      const rolId = parseInt(rolIdStr);
      const rolNombre = ROLES_DESCRIPTION[rolId as keyof typeof ROLES_DESCRIPTION];
      
      console.log(`\n🔧 Configurando rol: ${rolNombre} (ID: ${rolId})`);
      console.log(`📦 Módulos a asignar: ${modulosIds.map(id => MODULOS_DESCRIPTION[id as keyof typeof MODULOS_DESCRIPTION]).join(', ')}`);
      
      try {
        await rolesModulosService.asignarModulosARol(rolId, modulosIds as number[]);
        console.log(`✅ Rol ${rolNombre} configurado exitosamente`);
      } catch (error) {
        console.error(`❌ Error configurando rol ${rolNombre}:`, error);
      }
    }
    
    // Verificación final
    console.log('\n🔍 Verificando configuración...');
    for (const rolIdStr of Object.keys(ROLES_MODULOS_CONFIG)) {
      const rolId = parseInt(rolIdStr);
      const rolNombre = ROLES_DESCRIPTION[rolId as keyof typeof ROLES_DESCRIPTION];
      
      try {
        const modulosDelRol = await rolesModulosService.getModulosDeRol(rolId);
        console.log(`✅ ${rolNombre}: ${modulosDelRol.length} módulos asignados`);
      } catch (error) {
        console.error(`❌ Error verificando rol ${rolNombre}:`, error);
      }
    }
    
    console.log('\n🎉 Inicialización de roles y módulos completada');
    
  } catch (error) {
    console.error('❌ Error crítico en inicialización:', error);
    throw error;
  }
}

// Función para ejecutar desde la consola del navegador
export async function ejecutarInicializacion() {
  try {
    await inicializarRolesModulos();
    alert('✅ Roles y módulos inicializados correctamente. Recarga la página para ver los cambios.');
  } catch (error) {
    console.error('Error en inicialización:', error);
    alert('❌ Error al inicializar roles y módulos. Revisa la consola para más detalles.');
  }
}

// Auto-ejecutar si se importa en un entorno de desarrollo
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 Para inicializar roles y módulos, ejecuta: ejecutarInicializacion()');
}
