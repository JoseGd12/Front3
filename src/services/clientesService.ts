// Interfaces para la API de clientes
export interface ClienteAPI {
  id: number;
  usuarioId?: number;
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  barrio?: string;
  fechaNacimiento?: string;
  estado: boolean;
  fotoPerfil?: string;
  usuario?: any;
}

// Interface para el componente Cliente
export interface Cliente {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  barrio: string;
  fechaNacimiento: string;
  fechaRegistro: string;
  activo: boolean;
  fotoPerfil?: string;
  // Campos para compatibilidad con el frontend
  ultimaVisita?: string;
  saldoAFavor?: number;
  contraseña?: string;
}

// Interface para crear cliente
export interface CreateClienteData {
  usuarioId?: number;
  nombre: string;
  apellido: string;
  documento: string;
  correo: string;
  telefono?: string;
  fechaNacimiento?: string;
  direccion?: string;
  barrio?: string;
  fotoPerfil?: string;
}

const API_BASE_URL = '/api/Clientes';
const USUARIOS_API_URL = '/api/Usuarios';

class ClientesService {
  // Mapear datos de la API al formato del componente (usando campos aplanados)
  mapApiToComponent(apiCliente: any): Cliente {
    const documentoStr = apiCliente.documento || (apiCliente.usuario?.documento) || '';
    const partesDocumento = documentoStr.split(' ');
    const tipoDocumento = partesDocumento.length > 1 ? partesDocumento[0] : 'CC';
    const numeroDocumento = partesDocumento.length > 1 ? partesDocumento.slice(1).join(' ') : documentoStr;

    return {
      id: (apiCliente.id || apiCliente.Id || 0).toString(),
      tipoDocumento: tipoDocumento || 'CC',
      numeroDocumento: numeroDocumento,
      nombre: apiCliente.nombre || apiCliente.Nombre || '',
      apellido: apiCliente.apellido || apiCliente.Apellido || '',
      email: apiCliente.correo || apiCliente.Correo || '',
      telefono: apiCliente.telefono || apiCliente.Telefono || '',
      direccion: apiCliente.direccion || apiCliente.Direccion || '',
      barrio: apiCliente.barrio || apiCliente.Barrio || '',
      fechaNacimiento: apiCliente.fechaNacimiento || apiCliente.FechaNacimiento || '',
      fechaRegistro: new Date().toLocaleDateString(),
      activo: apiCliente.estado === true || apiCliente.Estado === true,
      fotoPerfil: apiCliente.fotoPerfil || apiCliente.FotoPerfil || apiCliente.imagenUrl || '',
      saldoAFavor: Number(apiCliente.saldoAFavor || apiCliente.SaldoAFavor || 0)
    };
  }

  // Mapear para envío al servidor (PascalCase)
  private mapToApiFormat(data: any): any {
    return {
      Nombre: data.nombre,
      Apellido: data.apellido,
      Documento: data.documento,
      Correo: data.correo,
      Telefono: data.telefono,
      Direccion: data.direccion,
      Barrio: data.barrio,
      FechaNacimiento: data.fechaNacimiento,
      FotoPerfil: data.fotoPerfil || '',
      Estado: true
    };
  }

  async getClientes(): Promise<ClienteAPI[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const text = await response.text();
    const data = text ? JSON.parse(text) : [];

    // Normalize keys
    return Array.isArray(data) ? data.map((item: any) => ({
      id: item.id || item.Id,
      nombre: item.nombre || item.Nombre,
      apellido: item.apellido || item.Apellido,
      documento: item.documento || item.Documento,
      correo: item.correo || item.Correo || item.email || item.Email,
      telefono: item.telefono || item.Telefono,
      direccion: item.direccion || item.Direccion,
      barrio: item.barrio || item.Barrio,
      fechaNacimiento: item.fechaNacimiento || item.FechaNacimiento,
      fotoPerfil: item.fotoPerfil || item.FotoPerfil,
      estado: (item.estado === true || item.Estado === true) && (item.usuario || item.Usuario ? ((item.usuario || item.Usuario).estado === true || (item.usuario || item.Usuario).Estado === true) : true),
      usuario: item.usuario || item.Usuario
    })) : [];
  }

  async getClienteById(id: number): Promise<ClienteAPI> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  }

  // Creación robusta: si ya tiene usuarioId usa POST /api/clientes, si no usa POST /api/Usuarios
  async createCliente(clienteData: CreateClienteData): Promise<any> {
    if (clienteData.usuarioId) {
      // Flujo 1: El usuario ya existe en Usuarios, solo creamos el perfil cliente
      const apiData = {
        ...this.mapToApiFormat(clienteData),
        UsuarioId: clienteData.usuarioId
      };
      console.log('🔵 Creando Perfil Cliente directo en /api/clientes:', apiData.Correo);
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Error en API Clientes ${response.status}: ${err}`);
      }
      return await response.json();
    }

    // Flujo 2: El usuario no existe, creamos todo vía Usuarios API (que internamente crea el perfil)
    const apiData = {
      ...this.mapToApiFormat(clienteData),
      RolId: 3, // Rol de Cliente
      Contrasena: clienteData.documento || "Cliente123*" // Contraseña temporal
    };

    console.log('🔵 Creando Usuario+Cliente vía /api/Usuarios:', apiData.Correo);

    const response = await fetch(USUARIOS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en API Usuarios ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  async updateCliente(id: number, clienteData: any): Promise<any> {
    const apiData = {
      Id: id,
      ...this.mapToApiFormat(clienteData),
      Estado: clienteData.estado !== undefined ? clienteData.estado : true
    };

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.status === 204 ? clienteData : await response.json();
  }

  async deleteCliente(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
  }

  async toggleClienteEstado(id: number, estado: boolean): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}/estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
  }
}

export const clientesService = new ClientesService();
