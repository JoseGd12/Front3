const API_BASE_URL = '/api';

export interface Cliente {
    id?: number;
    usuarioId: number;
    documento: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string | null;
    direccion?: string | null;
    barrio?: string | null;
    fechaNacimiento?: string | null;
    estado: boolean;
    fotoPerfil?: string;
}

class ClienteService {
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
            console.log(`Cliente API [${config.method || 'GET'}]: ${url}`);
            if (config.body) {
                console.log(`📤 Cliente Request Body:`, config.body);
            }

            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Cliente API Error [${response.status}]: ${errorText}`);
                throw new Error(`Error del servidor (${response.status}): ${errorText || response.statusText}`);
            }

            return response;
        } catch (error) {
            console.error('Cliente Network/API Error:', error);
            throw error;
        }
    }

    // Mapear objeto a PascalCase para las peticiones (POST/PUT)
    private mapToApiFormat(data: Partial<Cliente>): any {
        const mapped: any = {};

        if (data.id !== undefined) mapped.Id = data.id;
        if (data.usuarioId !== undefined) mapped.UsuarioId = data.usuarioId;
        if (data.documento !== undefined) mapped.Documento = data.documento;
        if (data.nombre !== undefined) mapped.Nombre = data.nombre;
        if (data.apellido !== undefined) mapped.Apellido = data.apellido;
        if (data.email !== undefined) mapped.Email = data.email;
        if (data.telefono !== undefined) mapped.Telefono = data.telefono;
        if (data.direccion !== undefined) mapped.Direccion = data.direccion;
        if (data.barrio !== undefined) mapped.Barrio = data.barrio;
        if (data.fechaNacimiento !== undefined) mapped.FechaNacimiento = data.fechaNacimiento;
        if (data.estado !== undefined) mapped.Estado = !!data.estado;
        if (data.fotoPerfil !== undefined) mapped.FotoPerfil = data.fotoPerfil;

        return mapped;
    }

    async obtenerClientes(): Promise<Cliente[]> {
        try {
            const response = await this.request('/clientes');
            const text = await response.text();
            const data = text ? JSON.parse(text) : [];
            return data;
        } catch (error) {
            console.error('Error fetching clientes:', error);
            throw error;
        }
    }

    async obtenerClientePorUsuarioId(usuarioId: number): Promise<Cliente | null> {
        try {
            const clientes = await this.obtenerClientes();
            const cliente = clientes.find(c => c.usuarioId === usuarioId);
            return cliente || null;
        } catch (error) {
            console.error('Error fetching cliente by usuarioId:', error);
            return null;
        }
    }

    async obtenerClientePorEmail(email: string): Promise<Cliente | null> {
        try {
            const clientes = await this.obtenerClientes();
            const cliente = clientes.find(c => c.email.toLowerCase() === email.toLowerCase());
            return cliente || null;
        } catch (error) {
            console.error('Error fetching cliente by email:', error);
            return null;
        }
    }

    async crearCliente(clienteData: Partial<Cliente>): Promise<Cliente> {
        try {
            const apiBody = this.mapToApiFormat(clienteData);
            console.log('🔵 Creando cliente - Datos originales:', clienteData);
            console.log('🔵 Creando cliente - Datos mapeados (enviados):', apiBody);

            const response = await this.request('/clientes', {
                method: 'POST',
                body: JSON.stringify(apiBody),
            });

            const text = await response.text();
            if (!text) return { ...clienteData, id: 0 } as Cliente;

            const result = JSON.parse(text);
            console.log('✅ Cliente creado exitosamente:', result);
            return result;
        } catch (error: any) {
            console.error('❌ Error creating cliente:', error);
            console.error('❌ Datos que causaron el error:', clienteData);
            throw error;
        }
    }

    async actualizarCliente(id: number, clienteData: Partial<Cliente>): Promise<Cliente> {
        try {
            const apiBody = this.mapToApiFormat(clienteData);
            apiBody.Id = id;

            const response = await this.request(`/clientes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(apiBody),
            });

            const text = await response.text();
            if (!text) return { ...clienteData, id } as Cliente;

            return JSON.parse(text);
        } catch (error) {
            console.error('Error updating cliente:', error);
            throw error;
        }
    }

    async eliminarCliente(id: number): Promise<void> {
        try {
            console.log(`🗑️ Intentando eliminar cliente con ID: ${id}`);
            await this.request(`/clientes/${id}`, {
                method: 'DELETE',
            });
            console.log(`✅ Cliente eliminado exitosamente`);
        } catch (error: any) {
            console.error('❌ Error deleting cliente:', error);
            throw error;
        }
    }
}

export const clienteService = new ClienteService();
