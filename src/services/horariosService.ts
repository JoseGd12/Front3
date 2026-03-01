const API_BASE_URL = '/api';

export interface HorarioBarbero {
    id?: number;
    barberoId: number;
    dia: string; // "Lunes", "Martes", etc.
    horaInicio: string; // "HH:mm"
    horaFin: string; // "HH:mm"
    estado?: boolean;
}

// DTOs internos para comunicación con API
interface HorarioBarberoApi {
    id: number;
    barberoId: number;
    diaSemana: number; // 1=Lunes, 7=Domingo
    horaInicio: string; // "HH:mm:ss"
    horaFin: string; // "HH:mm:ss"
    estado: boolean;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

class HorariosService {
    private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${API_BASE_URL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                ...options.headers,
            },
        };

        if (options.method && options.method !== 'GET' && options.method !== 'HEAD') {
            (config.headers as any)['Content-Type'] = 'application/json';
        }

        try {
            console.log(`Resources API [${config.method || 'GET'}]: ${url}`);
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

    private mapApiToLocal(apiData: HorarioBarberoApi): HorarioBarbero {
        // En .NET DayOfWeek: 0 = Domingo, 1 = Lunes...
        // Pero el controller dice: 1=Lunes, 7=Domingo (ajuste manual en controller)
        // DIA Array: ["Domingo", "Lunes", "Martes"...] (indices 0-6)

        let diaStr = "Desconocido";
        if (apiData.diaSemana === 7) {
            diaStr = "Domingo";
        } else if (apiData.diaSemana >= 1 && apiData.diaSemana <= 6) {
            diaStr = DIAS[apiData.diaSemana];
        }

        // Extraer HH:mm de "HH:mm:ss"
        const hInicio = apiData.horaInicio ? apiData.horaInicio.toString().substring(0, 5) : "00:00";
        const hFin = apiData.horaFin ? apiData.horaFin.toString().substring(0, 5) : "00:00";

        return {
            id: apiData.id,
            barberoId: apiData.barberoId,
            dia: diaStr,
            horaInicio: hInicio,
            horaFin: hFin,
            estado: apiData.estado
        };
    }

    private mapLocalToApiCreate(local: HorarioBarbero): any {
        let diaInt = DIAS.indexOf(local.dia);
        if (local.dia === "Domingo") diaInt = 7;

        return {
            BarberoId: local.barberoId,
            DiaSemana: diaInt,
            HoraInicio: local.horaInicio.length === 5 ? `${local.horaInicio}:00` : local.horaInicio,
            HoraFin: local.horaFin.length === 5 ? `${local.horaFin}:00` : local.horaFin
        };
    }

    private mapLocalToApiUpdate(local: HorarioBarbero): any {
        let diaInt = DIAS.indexOf(local.dia);
        if (local.dia === "Domingo") diaInt = 7;

        return {
            BarberoId: local.barberoId,
            DiaSemana: diaInt,
            HoraInicio: local.horaInicio.length === 5 ? `${local.horaInicio}:00` : local.horaInicio,
            HoraFin: local.horaFin.length === 5 ? `${local.horaFin}:00` : local.horaFin,
            Estado: local.estado ?? true
        };
    }

    async getHorarios(): Promise<HorarioBarbero[]> {
        const response = await this.request('/HorariosBarberos');
        const text = await response.text();
        const data: HorarioBarberoApi[] = text ? JSON.parse(text) : [];
        return data.map(d => this.mapApiToLocal(d));
    }

    async getHorariosByBarberoId(barberoId: number): Promise<HorarioBarbero[]> {
        const response = await this.request(`/HorariosBarberos/barbero/${barberoId}`);
        const text = await response.text();
        const data: HorarioBarberoApi[] = text ? JSON.parse(text) : [];
        return data.map(d => this.mapApiToLocal(d));
    }

    async createHorario(horario: HorarioBarbero): Promise<HorarioBarbero> {
        const payload = this.mapLocalToApiCreate(horario);
        const response = await this.request('/HorariosBarberos', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const text = await response.text();
        const data: HorarioBarberoApi = text ? JSON.parse(text) : {};
        return this.mapApiToLocal(data);
    }

    async updateHorario(id: number, horario: HorarioBarbero): Promise<HorarioBarbero> {
        const payload = this.mapLocalToApiUpdate(horario);
        const response = await this.request(`/HorariosBarberos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        const text = await response.text();
        const data: HorarioBarberoApi = text ? JSON.parse(text) : {};
        return this.mapApiToLocal(data);
    }

    async deleteHorario(id: number): Promise<void> {
        await this.request(`/HorariosBarberos/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleEstado(id: number, estado: boolean): Promise<void> {
        await this.request(`/HorariosBarberos/${id}/estado`, {
            method: 'POST',
            body: JSON.stringify({ estado }),
        });
    }
}

export const horariosService = new HorariosService();
