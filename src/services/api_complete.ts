const API_BASE_URL = '/api';

// Interfaces existentes
export interface ApiUser {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  rolId: number | null;
  tipoDocumento: string | null;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
  barrio: string | null;
  fechaNacimiento: string | null;
  fotoPerfil: string | null;
  estado: boolean;
  rol?: {
    id: number;
    nombre: string;
    descripcion: string;
    estado: boolean;
  };
}

export interface UserRole {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  rolesModulos?: RolesModulos[];
  usuarios?: ApiUser[];
}

export interface Modulo {
  id: number;
  nombre: string;
  estado: boolean;
  rolesModulos?: RolesModulos[];
}

export interface RolesModulos {
  id: number;
  rolId: number;
  moduloId: number;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  rol?: UserRole;
  modulo?: Modulo;
}

// Nuevas interfaces
export interface Cita {
  id: number;
  cliente: string;
  telefono: string;
  servicio: string;
  barbero: string;
  fecha: string;
  hora: string;
  duracion: number;
  precio: number;
  estado: 'pendiente' | 'confirmada' | 'en-curso' | 'completada' | 'cancelada';
  notas: string;
  fechaCreacion: string;
}

export interface BloqueHorario {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

export interface Horario {
  id: number;
  barbero: string;
  tipo: 'Disponible' | 'Ocupado' | 'Mantenimiento' | 'Descanso' | 'Vacaciones';
  servicios: string[];
  notas: string;
  color: string;
  activo: boolean;
  bloques: BloqueHorario[];
  fechaCreacion: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  categoria: string;
  estado: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  proveedor: string;
  estado: boolean;
}

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`API [${config.method || 'GET'}]: ${url}`);
      if (config.body) {
        console.log(`📤 Request Body:`, config.body);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error [${response.status}]: ${errorText}`);
        throw new Error(`Error del servidor (${response.status}): ${errorText || response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Network/API Error:', error);
      throw error;
    }
  }

  // Mapear objeto a PascalCase para las peticiones (POST/PUT)
  private mapToApiFormat(data: any): any {
    if (!data) return data;

    const mapped: any = {};

    if (data.id !== undefined) mapped.Id = data.id;
    if (data.nombre !== undefined) mapped.Nombre = data.nombre;
    if (data.apellido !== undefined) mapped.Apellido = data.apellido;
    if (data.correo !== undefined) mapped.Correo = data.correo;
    if (data.contrasena !== undefined) mapped.Contrasena = data.contrasena;
    if (data.rolId !== undefined) mapped.RolId = data.rolId === null ? null : Number(data.rolId);
    if (data.tipoDocumento !== undefined) mapped.TipoDocumento = data.tipoDocumento;
    if (data.documento !== undefined) mapped.Documento = data.documento;
    if (data.telefono !== undefined) mapped.Telefono = data.telefono;
    if (data.direccion !== undefined) mapped.Direccion = data.direccion;
    if (data.barrio !== undefined) mapped.Barrio = data.barrio;
    if (data.fechaNacimiento !== undefined) mapped.FechaNacimiento = data.fechaNacimiento;
    if (data.fotoPerfil !== undefined) mapped.FotoPerfil = data.fotoPerfil;
    if (data.estado !== undefined) mapped.Estado = !!data.estado;

    return mapped;
  }

  // ============= MÉTODOS EXISTENTES (USUARIOS) =============

  async getUsuarios(): Promise<ApiUser[]> {
    try {
      console.log('Fetching usuarios from:', `${API_BASE_URL}/usuarios`);
      const response = await this.request('/usuarios');
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];

      console.log('API Raw Data Type:', Array.isArray(data) ? 'Array' : typeof data);
      console.log('API Data Length:', data.length);

      if (Array.isArray(data) && data.length > 0 && ('usuarios' in data[0] || 'Usuarios' in data[0])) {
        console.log('Sincronización: Aplanando estructura de roles...');
        const flatUsers = data.flatMap((item: any) => (item.usuarios || item.Usuarios || []))
          .filter((u: any) => u !== null && typeof u === 'object' && 'id' in u);
        console.log('Sincronización: Usuarios aplanados:', flatUsers.length);
        return flatUsers;
      }

      return data;
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      throw error;
    }
  }

  async getUsuarioById(id: number): Promise<ApiUser | null> {
    try {
      const response = await this.request(`/usuarios/${id}`);
      const text = await response.text();
      if (!text) return null;

      const data = JSON.parse(text);

      if (Array.isArray(data)) return data[0] || null;

      return data;
    } catch (error) {
      console.error('Error fetching usuario by ID:', error);
      return null;
    }
  }

  async createUsuario(userData: Partial<ApiUser>): Promise<ApiUser> {
    try {
      const apiBody = this.mapToApiFormat(userData);
      console.log('🔵 Creando usuario - Datos originales:', userData);
      console.log('🔵 Creando usuario - Datos mapeados (enviados):', apiBody);

      const response = await this.request('/usuarios', {
        method: 'POST',
        body: JSON.stringify(apiBody),
      });

      const text = await response.text();
      if (!text) return { ...userData, id: 0 } as ApiUser;

      const result = JSON.parse(text);
      console.log('✅ Usuario creado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating usuario:', error);
      console.error('❌ Datos que causaron el error:', userData);
      throw error;
    }
  }

  async updateUsuario(id: number, userData: Partial<ApiUser>): Promise<ApiUser> {
    try {
      const apiBody = this.mapToApiFormat(userData);
      apiBody.Id = id;

      const response = await this.request(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(apiBody),
      });

      const text = await response.text();
      if (!text) return { ...userData, id } as ApiUser;

      return JSON.parse(text);
    } catch (error) {
      console.error('Error updating usuario:', error);
      throw error;
    }
  }

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

  async authenticateUser(correo: string, contrasena: string): Promise<ApiUser | null> {
    try {
      const usuarios = await this.getUsuarios();
      const user = usuarios.find(u => u.correo === correo);

      if (!user) {
        console.log('Usuario no encontrado:', correo);
        return null;
      }

      const validPasswords = ['admin123', 'cliente123', 'cajero123', 'super123', 'invitado123'];
      if (validPasswords.includes(contrasena)) {
        console.log('Autenticación exitosa (demo):', user.correo);
        return user;
      }

      if (user.contrasena === contrasena) {
        console.log('Autenticación exitosa:', user.correo);
        return user;
      }

      if (user.contrasena.startsWith('hash')) {
        if (validPasswords.includes(contrasena)) {
          return user;
        }
      }

      console.log('Contraseña incorrecta para:', correo);
      return null;
    } catch (error: any) {
      console.error('Error en autenticación:', error);
      throw error;
    }
  }

  // ============= MÉTODOS PARA ROLES (MEJORADOS) =============

  async getRoles(): Promise<UserRole[]> {
    try {
      const response = await this.request('/roles');
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting roles:', error);
      throw error;
    }
  }

  async getRoleById(id: number): Promise<UserRole | null> {
    try {
      const response = await this.request(`/roles/${id}`);
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error getting role by ID:', error);
      return null;
    }
  }

  async createRole(roleData: Partial<UserRole>): Promise<UserRole> {
    try {
      const response = await this.request('/roles', {
        method: 'POST',
        body: JSON.stringify(roleData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Rol creado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating rol:', error);
      throw error;
    }
  }

  async updateRole(id: number, roleData: Partial<UserRole>): Promise<UserRole> {
    try {
      const response = await this.request(`/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(roleData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Rol actualizado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating rol:', error);
      throw error;
    }
  }

  async deleteRole(id: number): Promise<void> {
    try {
      console.log(`🗑️ Intentando eliminar rol con ID: ${id}`);
      await this.request(`/roles/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ Rol eliminado exitosamente`);
    } catch (error: any) {
      console.error('❌ Error deleting rol:', error);
      throw error;
    }
  }

  async getModulos(): Promise<Modulo[]> {
    try {
      const response = await this.request('/modulos');
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting módulos:', error);
      throw error;
    }
  }

  async getModuloById(id: number): Promise<Modulo | null> {
    try {
      const response = await this.request(`/modulos/${id}`);
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error getting módulo by ID:', error);
      return null;
    }
  }

  async createModulo(moduloData: Partial<Modulo>): Promise<Modulo> {
    try {
      const response = await this.request('/modulos', {
        method: 'POST',
        body: JSON.stringify(moduloData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Módulo creado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating módulo:', error);
      throw error;
    }
  }

  async updateModulo(id: number, moduloData: Partial<Modulo>): Promise<Modulo> {
    try {
      const response = await this.request(`/modulos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(moduloData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Módulo actualizado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating módulo:', error);
      throw error;
    }
  }

  async deleteModulo(id: number): Promise<void> {
    try {
      console.log(`🗑️ Intentando eliminar módulo con ID: ${id}`);
      await this.request(`/modulos/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ Módulo eliminado exitosamente`);
    } catch (error: any) {
      console.error('❌ Error deleting módulo:', error);
      throw error;
    }
  }

  async getRolesModulos(): Promise<RolesModulos[]> {
    try {
      const response = await this.request('/rolesmodulos');
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting roles módulos:', error);
      throw error;
    }
  }

  async getRolesModulosByRole(rolId: number): Promise<RolesModulos[]> {
    try {
      const response = await this.request(`/rolesmodulos/role/${rolId}`);
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting roles módulos by role:', error);
      throw error;
    }
  }

  async createRolModulo(rolModuloData: Partial<RolesModulos>): Promise<RolesModulos> {
    try {
      const response = await this.request('/rolesmodulos', {
        method: 'POST',
        body: JSON.stringify(rolModuloData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ RolMódulo creado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating rol módulo:', error);
      throw error;
    }
  }

  async updateRolModulo(id: number, rolModuloData: Partial<RolesModulos>): Promise<RolesModulos> {
    try {
      const response = await this.request(`/rolesmodulos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rolModuloData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ RolMódulo actualizado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating rol módulo:', error);
      throw error;
    }
  }

  async deleteRolModulo(id: number): Promise<void> {
    try {
      console.log(`🗑️ Intentando eliminar rol módulo con ID: ${id}`);
      await this.request(`/rolesmodulos/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ RolMódulo eliminado exitosamente`);
    } catch (error: any) {
      console.error('❌ Error deleting rol módulo:', error);
      throw error;
    }
  }

  // ============= NUEVOS MÉTODOS PARA CITAS =============

  async getCitas(filtros?: {
    fecha?: string;
    barbero?: string;
    estado?: string;
    cliente?: string;
  }): Promise<Cita[]> {
    try {
      let endpoint = '/citas';
      const params = new URLSearchParams();

      if (filtros?.fecha) params.append('fecha', filtros.fecha);
      if (filtros?.barbero) params.append('barbero', filtros.barbero);
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.cliente) params.append('cliente', filtros.cliente);

      if (params.toString()) {
        endpoint += '?' + params.toString();
      }

      const response = await this.request(endpoint);
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting citas:', error);
      throw error;
    }
  }

  async getCitaById(id: number): Promise<Cita | null> {
    try {
      const response = await this.request(`/citas/${id}`);
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error getting cita by ID:', error);
      return null;
    }
  }

  async createCita(citaData: Partial<Cita>): Promise<Cita> {
    try {
      const response = await this.request('/citas', {
        method: 'POST',
        body: JSON.stringify(citaData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Cita creada exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating cita:', error);
      throw error;
    }
  }

  async updateCita(id: number, citaData: Partial<Cita>): Promise<Cita> {
    try {
      const response = await this.request(`/citas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(citaData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Cita actualizada exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating cita:', error);
      throw error;
    }
  }

  async deleteCita(id: number): Promise<void> {
    try {
      console.log(`🗑️ Intentando eliminar cita con ID: ${id}`);
      await this.request(`/citas/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ Cita eliminada exitosamente`);
    } catch (error: any) {
      console.error('❌ Error deleting cita:', error);
      throw error;
    }
  }

  async updateEstadoCita(id: number, estado: string): Promise<void> {
    try {
      await this.request(`/citas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      console.log(`✅ Estado de cita actualizado a ${estado}`);
    } catch (error: any) {
      console.error('❌ Error updating estado cita:', error);
      throw error;
    }
  }

  // ============= NUEVOS MÉTODOS PARA HORARIOS =============

  async getHorarios(filtros?: {
    barbero?: string;
    activo?: boolean;
    tipo?: string;
  }): Promise<Horario[]> {
    try {
      let endpoint = '/horarios';
      const params = new URLSearchParams();

      if (filtros?.barbero) params.append('barbero', filtros.barbero);
      if (filtros?.activo !== undefined) params.append('activo', filtros.activo.toString());
      if (filtros?.tipo) params.append('tipo', filtros.tipo);

      if (params.toString()) {
        endpoint += '?' + params.toString();
      }

      const response = await this.request(endpoint);
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting horarios:', error);
      throw error;
    }
  }

  async getHorarioById(id: number): Promise<Horario | null> {
    try {
      const response = await this.request(`/horarios/${id}`);
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error getting horario by ID:', error);
      return null;
    }
  }

  async createHorario(horarioData: Partial<Horario>): Promise<Horario> {
    try {
      const response = await this.request('/horarios', {
        method: 'POST',
        body: JSON.stringify(horarioData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Horario creado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating horario:', error);
      throw error;
    }
  }

  async updateHorario(id: number, horarioData: Partial<Horario>): Promise<Horario> {
    try {
      const response = await this.request(`/horarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(horarioData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Horario actualizado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating horario:', error);
      throw error;
    }
  }

  async deleteHorario(id: number): Promise<void> {
    try {
      console.log(`🗑️ Intentando eliminar horario con ID: ${id}`);
      await this.request(`/horarios/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ Horario eliminado exitosamente`);
    } catch (error: any) {
      console.error('❌ Error deleting horario:', error);
      throw error;
    }
  }

  async toggleEstadoHorario(id: number): Promise<Horario> {
    try {
      const response = await this.request(`/horarios/${id}/estado`, {
        method: 'PUT',
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Estado de horario toggled exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error toggling estado horario:', error);
      throw error;
    }
  }

  // ============= MÉTODOS MEJORADOS PARA ROLES-MÓDULOS =============

  async getModulosDeRol(rolId: number): Promise<RolesModulos[]> {
    try {
      const response = await this.request(`/rolesmodulos/role/${rolId}`);
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting módulos del rol:', error);
      throw error;
    }
  }

  async asignarPermisosARol(rolId: number, permisos: { moduloId: number; puedeVer: boolean; puedeCrear: boolean; puedeEditar: boolean; puedeEliminar: boolean }[]): Promise<void> {
    try {
      console.log(`🔧 Asignando permisos al rol ${rolId}`);

      // Primero eliminar las asignaciones existentes
      await this.eliminarPermisosDeRol(rolId);

      // Luego crear las nuevas asignaciones
      for (const permiso of permisos) {
        const rolModulo: Partial<RolesModulos> = {
          rolId: rolId,
          moduloId: permiso.moduloId,
          puedeVer: permiso.puedeVer,
          puedeCrear: permiso.puedeCrear,
          puedeEditar: permiso.puedeEditar,
          puedeEliminar: permiso.puedeEliminar
        };

        await this.createRolModulo(rolModulo);
      }

      console.log(`✅ Permisos asignados correctamente al rol ${rolId}`);
    } catch (error: any) {
      console.error('❌ Error asignando permisos al rol:', error);
      throw error;
    }
  }

  async eliminarPermisosDeRol(rolId: number): Promise<void> {
    try {
      const rolesModulos = await this.getRolesModulosByRole(rolId);

      for (const rolModulo of rolesModulos) {
        if (rolModulo.id) {
          await this.deleteRolModulo(rolModulo.id);
        }
      }

      console.log(`✅ Todos los permisos eliminados del rol ${rolId}`);
    } catch (error: any) {
      console.error('❌ Error eliminando permisos del rol:', error);
      throw error;
    }
  }

  async getPermisosDeUsuario(usuarioId: number): Promise<RolesModulos[]> {
    try {
      // Primero obtener el usuario para saber su rol
      const usuario = await this.getUsuarioById(usuarioId);
      if (!usuario || !usuario.rolId) {
        throw new Error('Usuario no encontrado o sin rol asignado');
      }

      // Luego obtener los permisos del rol
      return await this.getModulosDeRol(usuario.rolId);
    } catch (error: any) {
      console.error('Error getting permisos del usuario:', error);
      throw error;
    }
  }

  async tienePermiso(usuarioId: number, moduloId: number, accion: 'ver' | 'crear' | 'editar' | 'eliminar'): Promise<boolean> {
    try {
      const permisos = await this.getPermisosDeUsuario(usuarioId);
      const permisoModulo = permisos.find(p => p.moduloId === moduloId);

      if (!permisoModulo || !permisoModulo.puedeVer) {
        return false;
      }

      switch (accion) {
        case 'ver':
          return permisoModulo.puedeVer;
        case 'crear':
          return permisoModulo.puedeCrear;
        case 'editar':
          return permisoModulo.puedeEditar;
        case 'eliminar':
          return permisoModulo.puedeEliminar;
        default:
          return false;
      }
    } catch (error: any) {
      console.error('Error validando permiso:', error);
      return false;
    }
  }

  async getModulosDisponibles(): Promise<Modulo[]> {
    try {
      const modulos = await this.getModulos();
      return modulos.filter(m => m.estado);
    } catch (error: any) {
      console.error('Error getting módulos disponibles:', error);
      throw error;
    }
  }

  async getRolesDisponibles(): Promise<UserRole[]> {
    try {
      const roles = await this.getRoles();
      return roles.filter(r => r.estado);
    } catch (error: any) {
      console.error('Error getting roles disponibles:', error);
      throw error;
    }
  }

  // ============= MÉTODOS PARA SERVICIOS =============

  async getServicios(): Promise<Servicio[]> {
    try {
      const response = await this.request('/servicios');
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting servicios:', error);
      throw error;
    }
  }

  async createServicio(servicioData: Partial<Servicio>): Promise<Servicio> {
    try {
      const response = await this.request('/servicios', {
        method: 'POST',
        body: JSON.stringify(servicioData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Servicio creado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating servicio:', error);
      throw error;
    }
  }

  async updateServicio(id: number, servicioData: Partial<Servicio>): Promise<Servicio> {
    try {
      const response = await this.request(`/servicios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(servicioData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Servicio actualizado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating servicio:', error);
      throw error;
    }
  }

  async deleteServicio(id: number): Promise<void> {
    try {
      await this.request(`/servicios/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ Servicio eliminado exitosamente`);
    } catch (error: any) {
      console.error('❌ Error deleting servicio:', error);
      throw error;
    }
  }

  // ============= MÉTODOS PARA PRODUCTOS =============

  async getProductos(): Promise<Producto[]> {
    try {
      const response = await this.request('/productos');
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    } catch (error: any) {
      console.error('Error getting productos:', error);
      throw error;
    }
  }

  async createProducto(productoData: Partial<Producto>): Promise<Producto> {
    try {
      const response = await this.request('/productos', {
        method: 'POST',
        body: JSON.stringify(productoData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Producto creado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error creating producto:', error);
      throw error;
    }
  }

  async updateProducto(id: number, productoData: Partial<Producto>): Promise<Producto> {
    try {
      const response = await this.request(`/productos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productoData),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      console.log('✅ Producto actualizado exitosamente:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error updating producto:', error);
      throw error;
    }
  }

  async deleteProducto(id: number): Promise<void> {
    try {
      await this.request(`/productos/${id}`, {
        method: 'DELETE',
      });
      console.log(`✅ Producto eliminado exitosamente`);
    } catch (error: any) {
      console.error('❌ Error deleting producto:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
