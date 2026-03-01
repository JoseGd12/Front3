import { apiService } from './api';

export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  rolesModulos?: RolesModulo[];
}

export interface Modulo {
  id: number;
  nombre: string;
  estado: boolean;
  rolesModulos?: RolesModulo[];
}

export interface RolesModulo {
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

// Mantener compatibilidad con código existente
export interface RolModulo extends RolesModulo {}

export class RolesModulosService {
  // ==================== OBTENER ====================
  
  // Obtener todos los roles con sus módulos
  async getRolesConModulos(): Promise<Role[]> {
    try {
      console.log('📊 Obteniendo todos los roles con módulos...');
      const roles = await apiService.getRoles();
      
      // Enriquecer roles con sus módulos
      const rolesEnriquecidos = await Promise.all(
        roles.map(async (role) => {
          const modulosDelRol = await this.getModulosDeRol(role.id);
          const permisosRol = await this.getPermisosRol(role.id);
          return {
            ...role,
            modulos: modulosDelRol,
            rolesModulos: permisosRol,
          };
        })
      );
      
      console.log('✅ Roles obtenidos:', rolesEnriquecidos);
      return rolesEnriquecidos;
    } catch (error) {
      console.error('❌ Error obteniendo roles con módulos:', error);
      throw error;
    }
  }

  // Obtener un rol específico por ID
  async getRoleById(roleId: number): Promise<Role | null> {
    try {
      console.log(`📊 Obteniendo rol ${roleId}...`);
      const role = await apiService.getRoleById(roleId);
      if (!role) return null;
      
      // Enriquecer con módulos
      const modulosDelRol = await this.getModulosDeRol(roleId);
      const permisosRol = await this.getPermisosRol(roleId);
      
      const roleEnriquecido = {
        ...role,
        modulos: modulosDelRol,
        rolesModulos: permisosRol,
      };
      
      console.log(`✅ Rol ${roleId} obtenido:`, roleEnriquecido);
      return roleEnriquecido;
    } catch (error) {
      console.error(`❌ Error obteniendo rol ${roleId}:`, error);
      throw error;
    }
  }

  // Obtener todos los módulos
  async getModulos(): Promise<Modulo[]> {
    try {
      console.log('📚 Obteniendo todos los módulos...');
      const modulos = await apiService.getModulos();
      console.log('✅ Módulos obtenidos:', modulos);
      return modulos;
    } catch (error) {
      console.error('❌ Error obteniendo módulos:', error);
      throw error;
    }
  }

  // Obtener asignaciones rol-módulo
  async getRolesModulos(): Promise<RolModulo[]> {
    try {
      console.log('🔗 Obteniendo todas las asignaciones rol-módulo...');
      const rolesModulos = await apiService.getRolesModulos();
      console.log('✅ Asignaciones obtenidas:', rolesModulos);
      return rolesModulos;
    } catch (error) {
      console.error('❌ Error obteniendo asignaciones rol-módulo:', error);
      throw error;
    }
  }

  // Obtener módulos de un rol específico
  async getModulosDeRol(rolId: number): Promise<Modulo[]> {
    try {
      console.log(`📚 Obteniendo módulos del rol ${rolId}...`);
      const rolesModulos = await apiService.getRolesModulosByRolId(rolId);
      const modulos = await this.getModulos();
      
      const modulosDelRol = modulos.filter(m => 
        rolesModulos.some(rm => rm.moduloId === m.id && rm.puedeVer)
      );
      
      console.log(`✅ Módulos del rol ${rolId}:`, modulosDelRol);
      return modulosDelRol;
    } catch (error) {
      console.error(`❌ Error obteniendo módulos del rol ${rolId}:`, error);
      throw error;
    }
  }

  // Obtener permisos completos de un rol
  async getPermisosRol(rolId: number): Promise<RolesModulo[]> {
    try {
      console.log(`🔐 Obteniendo permisos del rol ${rolId}...`);
      const permisos = await apiService.getRolesModulosByRolId(rolId);
      console.log(`✅ Permisos del rol ${rolId}:`, permisos);
      return permisos;
    } catch (error) {
      console.error(`❌ Error obteniendo permisos del rol ${rolId}:`, error);
      throw error;
    }
  }

  // ==================== CREAR ====================

  // Asignar módulos a un rol con permisos específicos
  async asignarModulosARol(
    rolId: number, 
    asignaciones: { moduloId: number; permisos: Partial<RolesModulo> }[]
  ): Promise<void> {
    try {
      console.log(`🔧 Asignando ${asignaciones.length} módulos al rol ${rolId}...`);
      
      // Primero eliminar las asignaciones existentes
      await apiService.deleteRolesModulosByRolId(rolId);
      
      // Luego crear las nuevas asignaciones con permisos
      for (const asignacion of asignaciones) {
        const rolModulo: RolesModulo = {
          rolId: rolId,
          moduloId: asignacion.moduloId,
          puedeVer: asignacion.permisos.puedeVer ?? true,
          puedeCrear: asignacion.permisos.puedeCrear ?? false,
          puedeEditar: asignacion.permisos.puedeEditar ?? false,
          puedeEliminar: asignacion.permisos.puedeEliminar ?? false
        };
        
        await apiService.createRolModulo(rolModulo);
      }
      
      console.log(`✅ ${asignaciones.length} módulos asignados al rol ${rolId}`);
    } catch (error) {
      console.error(`❌ Error asignando módulos al rol ${rolId}:`, error);
      throw error;
    }
  }

  // Método simplificado para asignar módulos con permisos por defecto
  async asignarModulosARolSimple(rolId: number, modulosIds: number[]): Promise<void> {
    try {
      console.log(`⚡ Asignación rápida de ${modulosIds.length} módulos al rol ${rolId}...`);
      
      const asignaciones = modulosIds.map(moduloId => ({
        moduloId,
        permisos: {
          puedeVer: true,
          puedeCrear: false,
          puedeEditar: false,
          puedeEliminar: false
        }
      }));
      
      await this.asignarModulosARol(rolId, asignaciones);
      console.log(`✅ Módulos asignados rápidamente al rol ${rolId}`);
    } catch (error) {
      console.error(`❌ Error en asignación rápida al rol ${rolId}:`, error);
      throw error;
    }
  }

  // Asignar un solo módulo a un rol
  async asignarModuloARol(rolId: number, moduloId: number, permisos?: Partial<RolesModulo>): Promise<RolesModulo> {
    try {
      console.log(`🔗 Asignando módulo ${moduloId} al rol ${rolId}...`);
      
      const rolModulo: RolesModulo = {
        rolId,
        moduloId,
        puedeVer: permisos?.puedeVer ?? true,
        puedeCrear: permisos?.puedeCrear ?? false,
        puedeEditar: permisos?.puedeEditar ?? false,
        puedeEliminar: permisos?.puedeEliminar ?? false
      };
      
      const resultado = await apiService.createRolModulo(rolModulo);
      console.log(`✅ Módulo ${moduloId} asignado al rol ${rolId}`);
      return resultado;
    } catch (error) {
      console.error(`❌ Error asignando módulo ${moduloId} al rol ${rolId}:`, error);
      throw error;
    }
  }

  // ==================== ACTUALIZAR ====================

  // Actualizar permisos de un rol-módulo específico
  async actualizarPermisos(id: number, permisos: Partial<RolesModulo>): Promise<RolesModulo> {
    try {
      console.log(`🔧 Actualizando permisos de asignación ${id}...`);
      
      const resultado = await apiService.updateRolModulo(id, permisos);
      console.log(`✅ Permisos actualizados para asignación ${id}`);
      return resultado;
    } catch (error) {
      console.error(`❌ Error actualizando permisos de asignación ${id}:`, error);
      throw error;
    }
  }

  // Actualizar múltiples permisos de un rol
  async actualizarPermisosRol(rolId: number, permisosMap: { [moduloId: number]: Partial<RolesModulo> }): Promise<void> {
    try {
      console.log(`🔧 Actualizando permisos del rol ${rolId}...`);
      
      const rolesModulos = await apiService.getRolesModulosByRolId(rolId);
      
      for (const rm of rolesModulos) {
        if (permisosMap[rm.moduloId]) {
          await this.actualizarPermisos(rm.id!, permisosMap[rm.moduloId]);
        }
      }
      
      console.log(`✅ Permisos del rol ${rolId} actualizados`);
    } catch (error) {
      console.error(`❌ Error actualizando permisos del rol ${rolId}:`, error);
      throw error;
    }
  }

  // ==================== ELIMINAR ====================

  // Eliminar todos los módulos de un rol
  async eliminarModulosDeRol(rolId: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando todos los módulos del rol ${rolId}...`);
      await apiService.deleteRolesModulosByRolId(rolId);
      console.log(`✅ Todos los módulos del rol ${rolId} fueron eliminados`);
    } catch (error) {
      console.error(`❌ Error eliminando módulos del rol ${rolId}:`, error);
      throw error;
    }
  }

  // Eliminar un módulo específico de un rol
  async eliminarModuloDeRol(rolId: number, moduloId: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando módulo ${moduloId} del rol ${rolId}...`);
      const rolesModulos = await apiService.getRolesModulosByRolId(rolId);
      const rm = rolesModulos.find(r => r.moduloId === moduloId);
      
      if (rm && rm.id) {
        await apiService.deleteRolModulo(rm.id);
        console.log(`✅ Módulo ${moduloId} eliminado del rol ${rolId}`);
      }
    } catch (error) {
      console.error(`❌ Error eliminando módulo ${moduloId} del rol ${rolId}:`, error);
      throw error;
    }
  }

  // ==================== VALIDACIONES ====================

  // Verificar si el usuario tiene acceso a un módulo
  async tieneAccesoAModulo(rolId: number, moduloId: number): Promise<boolean> {
    try {
      const modulos = await this.getModulosDeRol(rolId);
      return modulos.some(m => m.id === moduloId);
    } catch (error) {
      console.error(`❌ Error verificando acceso a módulo:`, error);
      return false;
    }
  }

  // Verificar si el usuario tiene permiso específico en un módulo
  async tienePermiso(rolId: number, moduloId: number, permiso: 'ver' | 'crear' | 'editar' | 'eliminar'): Promise<boolean> {
    try {
      const rolesModulos = await apiService.getRolesModulosByRolId(rolId);
      const rm = rolesModulos.find(r => r.moduloId === moduloId);
      
      if (!rm) return false;
      
      switch (permiso) {
        case 'ver': return rm.puedeVer;
        case 'crear': return rm.puedeCrear;
        case 'editar': return rm.puedeEditar;
        case 'eliminar': return rm.puedeEliminar;
        default: return false;
      }
    } catch (error) {
      console.error(`❌ Error verificando permiso:`, error);
      return false;
    }
  }
}

export const rolesModulosService = new RolesModulosService();
