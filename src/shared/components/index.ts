export { RolesPage } from '../../features/administracion/pages/RolesPage';

// Tipos y utilidades para el sistema modular
export type ModuloProyecto = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: any;
  color: string;
};

export type RolModular = {
  id: string;
  nombre: string;
  fechaCreacion: string;
  usuariosAsignados: number;
  estado: 'active' | 'inactive';
  observaciones: string;
  modulos: string[]; // IDs de módulos con acceso
};
