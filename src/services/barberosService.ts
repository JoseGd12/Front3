const BARBEROS_URL = '/api/Barberos';
const USUARIOS_URL = '/api/Usuarios';

export interface Barbero {
  id: number;
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  documento: string;
  correo: string;
  telefono: string;
  direccion: string;
  barrio: string;
  fechaNacimiento: string;
  rol: string;
  status: 'active' | 'inactive';
  estado?: boolean; // Added for compatibility
  fotoPerfil: string;
  especialidad?: string;
  usuarioId?: number;
  fechaCreacion?: string;
}

export interface CreateBarberoData {
  usuarioId?: number;
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  documento: string;
  correo: string;
  telefono: string;
  direccion: string;
  barrio: string;
  fechaNacimiento: string;
  rol: string;
  status: string;
  fotoPerfil: string;
  especialidad?: string;
  estado?: boolean;
}

class BarberosService {
  private async request(url: string, options: RequestInit = {}): Promise<Response> {
    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Mapeo simplificado (DTO aplanado o con navegación)
  mapApiToComponent(api: any): Barbero {
    const usuario = api.usuario || api.Usuario || {};

    const nombre = api.nombre || api.Nombre || usuario.nombre || usuario.Nombre || "";
    const apellido = api.apellido || api.Apellido || api.apellidos || api.Apellidos || usuario.apellido || usuario.Apellido || usuario.apellidos || usuario.Apellidos || "";
    const isActive = (api.estado ?? api.Estado ?? usuario.estado ?? usuario.Estado ?? true);

    return {
      id: api.id || api.Id || 0,
      nombre: nombre,
      apellido: apellido,
      tipoDocumento: api.tipoDocumento || api.TipoDocumento || usuario.tipoDocumento || usuario.TipoDocumento || "CC",
      documento: api.documento || api.Documento || usuario.documento || usuario.Documento || "",
      correo: api.correo || api.Correo || usuario.correo || usuario.Correo || api.email || api.Email || usuario.email || usuario.Email || "",
      telefono: api.telefono || api.Telefono || api.celular || api.Celular || usuario.telefono || usuario.Telefono || usuario.celular || usuario.Celular || "",
      direccion: api.direccion || api.Direccion || usuario.direccion || usuario.Direction || "",
      barrio: api.barrio || api.Barrio || usuario.barrio || usuario.Barrio || "",
      fechaNacimiento: api.fechaNacimiento || api.FechaNacimiento || usuario.fechaNacimiento || usuario.FechaNacimiento || "No especificada",
      rol: api.rol || api.Rol || (usuario.rol?.nombre) || (usuario.Rol?.Nombre) || 'Barbero',
      status: isActive ? 'active' : 'inactive',
      estado: isActive,
      fotoPerfil: api.fotoPerfil || api.FotoPerfil || api.imagenUrl || api.ImagenUrl || usuario.fotoPerfil || usuario.FotoPerfil || "",
      especialidad: api.especialidad || api.Especialidad || 'General',
      usuarioId: api.usuarioId || api.UsuarioId || (api.Id && api.Id !== api.id ? api.Id : 0) || (usuario.id || api.Id || 0),
      fechaCreacion: api.fechaContratacion || api.FechaContratacion || api.fechaCreacion || api.FechaCreacion || "No especificada"
    };
  }

  mapComponentToApi(data: any): any {
    return {
      nombre: data.nombre,
      apellido: data.apellido,
      documento: data.documento,
      correo: data.correo,
      telefono: data.telefono,
      direccion: data.direccion,
      barrio: data.barrio,
      fechaNacimiento: data.fechaNacimiento,
      especialidad: data.especialidad,
      status: data.status,
      fotoPerfil: data.fotoPerfil
    };
  }

  async getBarberos(): Promise<Barbero[]> {
    const response = await this.request(BARBEROS_URL);
    const data = await response.json();
    return Array.isArray(data) ? data.map(item => this.mapApiToComponent(item)) : [];
  }

  // Creación vía Usuarios para sincronizar cuenta y perfil
  async createBarbero(data: CreateBarberoData): Promise<any> {
    const apiData = {
      Nombre: data.nombre,
      Apellido: data.apellido,
      TipoDocumento: data.tipoDocumento || "CC",
      Documento: data.documento,
      Correo: data.correo,
      Contrasena: data.documento || "Barberia123*",
      RolId: 2, // Barbero
      Telefono: data.telefono,
      Direccion: data.direccion,
      Barrio: data.barrio,
      FechaNacimiento: data.fechaNacimiento,
      Especialidad: data.especialidad || 'General',
      Estado: true,
      FotoPerfil: data.fotoPerfil || ''
    };

    const response = await this.request(USUARIOS_URL, {
      method: 'POST',
      body: JSON.stringify(apiData)
    });
    return await response.json();
  }

  async updateBarbero(id: number, data: any): Promise<any> {
    const apiData = {
      Id: id,
      Nombre: data.nombre,
      Apellido: data.apellido,
      Documento: data.documento,
      Correo: data.correo,
      Telefono: data.telefono,
      Direccion: data.direccion,
      Barrio: data.barrio,
      FechaNacimiento: data.fechaNacimiento,
      Especialidad: data.especialidad,
      Estado: data.status === 'active' || data.estado === true,
      FotoPerfil: data.fotoPerfil || ''
    };

    const response = await this.request(`${BARBEROS_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiData)
    });
    return response.status === 204 ? data : await response.json();
  }

  async deleteBarbero(id: number): Promise<void> {
    await this.request(`${BARBEROS_URL}/${id}`, { method: 'DELETE' });
  }

  async updateBarberoStatus(id: number, estado: boolean): Promise<void> {
    await this.request(`${BARBEROS_URL}/${id}/estado`, {
      method: 'POST',
      body: JSON.stringify({ estado })
    });
  }
}

export const barberosService = new BarberosService();
