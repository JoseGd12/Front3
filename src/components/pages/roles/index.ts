// Sistemas de roles disponibles
export { RolesPage } from '../RolesPage'; // Sistema original con CRUD
export { RolesPageUpdated } from '../RolesPageUpdated'; // Sistema CRUD actualizado
export { RolesPageOptimized } from '../RolesPageOptimized'; // Sistema CRUD optimizado
export { RolesPageModular } from '../RolesPage'; // Nuevo sistema por módulos
export { RolesDemo } from '../RolesDemo'; // Demo del nuevo sistema

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

// Sistema recomendado
export { RolesPageModular as RolesSystemRecommended } from '../RolesPage';
