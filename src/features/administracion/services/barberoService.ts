const API_BASE_URL = '/api';

export interface Barbero {
    id?: number;
    usuarioId: number;
    documento: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string | null;
    direccion?: string | null;
    fechaIngreso?: string | null;
    especialidad?: string | null;
    estado: boolean;
}

class BarberoService {
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
            console.log(`Barbero API [${config.method || 'GET'}]: ${url}`);
            if (config.body) {
                console.log(`📤 Barbero Request Body:`, config.body);
            }

            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Barbero API Error [${response.status}]: ${errorText}`);
                throw new Error(`Error del servidor (${response.status}): ${errorText || response.statusText}`);
            }

            return response;
        } catch (error) {
            console.error('Barbero Network/API Error:', error);
            throw error;
        }
    }

    // Mapear objeto a PascalCase para las peticiones (POST/PUT)
    private mapToApiFormat(data: Partial<Barbero>): any {
        const mapped: any = {};

        if (data.id !== undefined) mapped.Id = data.id;
        if (data.usuarioId !== undefined) mapped.UsuarioId = data.usuarioId;
        if (data.documento !== undefined) mapped.Documento = data.documento;
        if (data.nombre !== undefined) mapped.Nombre = data.nombre;
        if (data.apellido !== undefined) mapped.Apellido = data.apellido;
        if (data.email !== undefined) mapped.Email = data.email;
        if (data.telefono !== undefined) mapped.Telefono = data.telefono;
        if (data.direccion !== undefined) mapped.Direccion = data.direccion;
        if (data.fechaIngreso !== undefined) mapped.FechaIngreso = data.fechaIngreso;
        if (data.especialidad !== undefined) mapped.Especialidad = data.especialidad;
        if (data.estado !== undefined) mapped.Estado = !!data.estado;

        return mapped;
    }

    async obtenerBarberos(): Promise<Barbero[]> {
        try {
            const response = await this.request('/barberos');
            const text = await response.text();
            const data = text ? JSON.parse(text) : [];
            return data;
        } catch (error) {
            console.error('Error fetching barberos:', error);
            throw error;
        }
    }

    async obtenerBarberoPorUsuarioId(usuarioId: number): Promise<Barbero | null> {
        try {
            const barberos = await this.obtenerBarberos();
            const barbero = barberos.find(b => b.usuarioId === usuarioId);
            return barbero || null;
        } catch (error) {
            console.error('Error fetching barbero by usuarioId:', error);
            return null;
        }
    }

    async obtenerBarberoPorEmail(email: string): Promise<Barbero | null> {
        try {
            const barberos = await this.obtenerBarberos();
            const barbero = barberos.find(b => b.email.toLowerCase() === email.toLowerCase());
            return barbero || null;
        } catch (error) {
            console.error('Error fetching barbero by email:', error);
            return null;
        }
    }

    async crearBarbero(barberoData: Partial<Barbero>): Promise<Barbero> {
        try {
            const apiBody = this.mapToApiFormat(barberoData);
            console.log('🔵 Creando barbero - Datos originales:', barberoData);
            console.log('🔵 Creando barbero - Datos mapeados (enviados):', apiBody);

            const response = await this.request('/barberos', {
                method: 'POST',
                body: JSON.stringify(apiBody),
            });

            const text = await response.text();
            if (!text) return { ...barberoData, id: 0 } as Barbero;

            const result = JSON.parse(text);
            console.log('✅ Barbero creado exitosamente:', result);
            return result;
        } catch (error: any) {
            console.error('❌ Error creating barbero:', error);
            console.error('❌ Datos que causaron el error:', barberoData);
            throw error;
        }
    }

    async actualizarBarbero(id: number, barberoData: Partial<Barbero>): Promise<Barbero> {
        try {
            const apiBody = this.mapToApiFormat(barberoData);
            apiBody.Id = id;

            const response = await this.request(`/barberos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(apiBody),
            });

            const text = await response.text();
            if (!text) return { ...barberoData, id } as Barbero;

            return JSON.parse(text);
        } catch (error) {
            console.error('Error updating barbero:', error);
            throw error;
        }
    }

    async eliminarBarbero(id: number): Promise<void> {
        try {
            console.log(`🗑️ Intentando eliminar barbero con ID: ${id}`);
            await this.request(`/barberos/${id}`, {
                method: 'DELETE',
            });
            console.log(`✅ Barbero eliminado exitosamente`);
        } catch (error: any) {
            console.error('❌ Error deleting barbero:', error);
            throw error;
        }
    }
}

export const barberoService = new BarberoService();
