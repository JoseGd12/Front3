// Servicio completo para gestión de roles con módulos y permisos
import { rolesService } from './rolesService';
import { modulosService } from './modulosService';
import { rolesModulosService, Role, Modulo, RolesModulo } from './rolesModulosService';

export interface RoleWithPermissions extends Role {
  modulosAsignados: (Modulo & { permisos: RolesModulo })[];
}

export class RolesCompleteService {
  // Crear un rol completo con módulos y permisos
  async createRoleComplete(
    roleData: Partial<Role>,
    asignacionesModulos: { moduloId: number; permisos: Partial<RolesModulo> }[]
  ): Promise<Role> {
    try {
      console.log('🔧 Creando rol completo con módulos y permisos');
      
      // 1. Crear el rol
      const nuevoRol = await rolesService.createRole(roleData);
      console.log('✅ Rol creado:', nuevoRol);
      
      // 2. Asignar módulos con permisos
      if (asignacionesModulos.length > 0) {
        await rolesModulosService.asignarModulosARol(nuevoRol.id, asignacionesModulos);
        console.log('✅ Módulos y permisos asignados');
      }
      
      return nuevoRol;
    } catch (error) {
      console.error('❌ Error creando rol completo:', error);
      throw error;
    }
  }

  // Actualizar un rol completo con módulos y permisos
  async updateRoleComplete(
    id: number,
    roleData: Partial<Role>,
    asignacionesModulos?: { moduloId: number; permisos: Partial<RolesModulo> }[]
  ): Promise<Role> {
    try {
      console.log(`🔧 Actualizando rol ${id} completo`);
      
      // 1. Actualizar datos del rol
      const rolActualizado = await rolesService.updateRole(id, roleData);
      console.log('✅ Rol actualizado:', rolActualizado);
      
      // 2. Si se proporcionan nuevas asignaciones, actualizarlas
      if (asignacionesModulos) {
        await rolesModulosService.asignarModulosARol(id, asignacionesModulos);
        console.log('✅ Módulos y permisos actualizados');
      }
      
      return rolActualizado;
    } catch (error) {
      console.error('❌ Error actualizando rol completo:', error);
      throw error;
    }
  }

  // Eliminar un rol completo (incluyendo sus asignaciones de módulos)
  async deleteRoleComplete(id: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando rol ${id} completo`);
      
      // 1. Eliminar todas las asignaciones de módulos
      await rolesModulosService.eliminarModulosDeRol(id);
      console.log('✅ Asignaciones de módulos eliminadas');
      
      // 2. Eliminar el rol (soft delete)
      await rolesService.deleteRole(id);
      console.log('✅ Rol eliminado');
    } catch (error) {
      console.error('❌ Error eliminando rol completo:', error);
      throw error;
    }
  }

  // Obtener rol con todos sus módulos y permisos
  async getRoleWithPermissions(id: number): Promise<RoleWithPermissions | null> {
    try {
      console.log(`🔍 Obteniendo rol ${id} con permisos completos`);
      
      // 1. Obtener datos del rol
      const rol = await rolesService.getRoleById(id);
      if (!rol) return null;
      
      // 2. Obtener permisos del rol
      const permisos = await rolesModulosService.getPermisosRol(id);
      
      // 3. Obtener detalles de los módulos
      const todosLosModulos = await modulosService.getModulos();
      
      // 4. Combinar información
      const modulosAsignados = permisos.map(permiso => {
        const modulo = todosLosModulos.find(m => m.id === permiso.moduloId);
        return {
          ...modulo!,
          permisos: permiso
        };
      });
      
      return {
        ...rol,
        modulosAsignados
      };
    } catch (error) {
      console.error('❌ Error obteniendo rol con permisos:', error);
      throw error;
    }
  }

  // Obtener todos los roles con sus módulos y permisos
  async getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
    try {
      console.log('🔍 Obteniendo todos los roles con permisos');
      
      // 1. Obtener todos los roles
      const roles = await rolesService.getRoles();
      
      // 2. Para cada rol, obtener sus permisos
      const rolesConPermisos = await Promise.all(
        roles.map(async (rol) => {
          return await this.getRoleWithPermissions(rol.id);
        })
      );
      
      return rolesConPermisos.filter((rol): rol is RoleWithPermissions => rol !== null);
    } catch (error) {
      console.error('❌ Error obteniendo todos los roles con permisos:', error);
      throw error;
    }
  }

  // Clonar un rol con todos sus permisos
  async cloneRole(
    originalRoleId: number,
    nuevoNombre: string,
    nuevaDescripcion?: string
  ): Promise<Role> {
    try {
      console.log(`🔄 Clonando rol ${originalRoleId} como "${nuevoNombre}"`);
      
      // 1. Obtener rol original con permisos
      const rolOriginal = await this.getRoleWithPermissions(originalRoleId);
      if (!rolOriginal) {
        throw new Error('Rol original no encontrado');
      }
      
      // 2. Preparar datos del nuevo rol
      const nuevoRolData = {
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion || `Copia de ${rolOriginal.descripcion}`,
        estado: true
      };
      
      // 3. Preparar asignaciones de módulos
      const asignaciones = rolOriginal.modulosAsignados.map(modulo => ({
        moduloId: modulo.id,
        permisos: modulo.permisos
      }));
      
      // 4. Crear nuevo rol con permisos
      const nuevoRol = await this.createRoleComplete(nuevoRolData, asignaciones);
      
      console.log('✅ Rol clonado exitosamente');
      return nuevoRol;
    } catch (error) {
      console.error('❌ Error clonando rol:', error);
      throw error;
    }
  }

  // Verificar si un rol tiene un permiso específico en un módulo
  async hasPermission(
    rolId: number,
    moduloId: number,
    permiso: keyof Omit<RolesModulo, 'id' | 'rolId' | 'moduloId' | 'rol' | 'modulo'>
  ): Promise<boolean> {
    try {
      const permisos = await rolesModulosService.getPermisosRol(rolId);
      const permisoModulo = permisos.find(p => p.moduloId === moduloId);
      
      return permisoModulo?.[permiso] ?? false;
    } catch (error) {
      console.error('❌ Error verificando permiso:', error);
      return false;
    }
  }

  // Obtener todos los módulos disponibles con el estado de permisos para un rol
  async getModulosWithPermissionStatus(rolId: number): Promise<(Modulo & { permisos?: RolesModulo })[]> {
    try {
      console.log(`🔍 Obteniendo módulos con estado de permisos para rol ${rolId}`);
      
      // 1. Obtener todos los módulos
      const todosLosModulos = await modulosService.getModulos();
      
      // 2. Obtener permisos del rol
      const permisos = await rolesModulosService.getPermisosRol(rolId);
      
      // 3. Combinar información
      return todosLosModulos.map(modulo => {
        const permiso = permisos.find(p => p.moduloId === modulo.id);
        return {
          ...modulo,
          permisos: permiso || undefined
        };
      });
    } catch (error) {
      console.error('❌ Error obteniendo módulos con estado de permisos:', error);
      throw error;
    }
  }
}

export const rolesCompleteService = new RolesCompleteService();
