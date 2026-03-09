import {
  Calendar,
  Scissors,
  Package,
  ShoppingCart,
  Users,
  UserCog,
  Shield,
  UserCheck,
  Clock,
  Settings,
  FileText,
  CreditCard,
  Truck,
  MessageSquare,
  Bell,
  Gift,
  Tag,
  PackageX,
  RotateCcw
} from "lucide-react";

// Configuración centralizada de módulos del proyecto
export const MODULOS_PROYECTO = [
  {
    id: "agendamiento",
    nombre: "Agendamiento",
    descripcion: "Gestión de citas y reservas de clientes",
    icono: Calendar,
    color: "text-blue-400",
    categoria: "operacional"
  },
  {
    id: "servicios",
    nombre: "Servicios",
    descripcion: "Catálogo de servicios ofrecidos por la barbería",
    icono: Scissors,
    color: "text-purple-400",
    categoria: "operacional"
  },
  {
    id: "paquetes",
    nombre: "Paquetes",
    descripcion: "Gestión de paquetes de servicios y promociones",
    icono: Gift,
    color: "text-pink-400",
    categoria: "operacional"
  },
  {
    id: "productos",
    nombre: "Productos",
    descripcion: "Inventario y gestión de productos",
    icono: Package,
    color: "text-green-400",
    categoria: "inventario"
  },
  {
    id: "ventas",
    nombre: "Ventas",
    descripcion: "Procesamiento y seguimiento de ventas",
    icono: ShoppingCart,
    color: "text-yellow-400",
    categoria: "financiero"
  },
  {
    id: "compras",
    nombre: "Compras",
    descripcion: "Registro y gestión de compras a proveedores",
    icono: CreditCard,
    color: "text-emerald-400",
    categoria: "financiero"
  },
  {
    id: "proveedores",
    nombre: "Proveedores",
    descripcion: "Gestión de proveedores y contactos",
    icono: Truck,
    color: "text-amber-400",
    categoria: "inventario"
  },
  {
    id: "categorias",
    nombre: "Categorías",
    descripcion: "Administración de categorías de productos",
    icono: Tag,
    color: "text-lime-400",
    categoria: "inventario"
  },
  {
    id: "entregas",
    nombre: "Entregas de Insumos",
    descripcion: "Control de entregas de insumos a barberos",
    icono: PackageX,
    color: "text-sky-400",
    categoria: "inventario"
  },
  {
    id: "devoluciones",
    nombre: "Devoluciones",
    descripcion: "Gestión de devoluciones de productos",
    icono: RotateCcw,
    color: "text-rose-400",
    categoria: "financiero"
  },
  {
    id: "clientes",
    nombre: "Clientes",
    descripcion: "Base de datos de clientes y información personal",
    icono: Users,
    color: "text-fuchsia-400",
    categoria: "operacional"
  },
  {
    id: "usuarios",
    nombre: "Usuarios",
    descripcion: "Gestión de usuarios del sistema",
    icono: UserCog,
    color: "text-indigo-400",
    categoria: "administracion"
  },
  {
    id: "roles",
    nombre: "Roles y Permisos",
    descripcion: "Configuración de roles y permisos de usuario",
    icono: Shield,
    color: "text-orange-400",
    categoria: "administracion"
  },
  {
    id: "barberos",
    nombre: "Barberos",
    descripcion: "Gestión del personal y barberos",
    icono: UserCheck,
    color: "text-cyan-400",
    categoria: "recursos_humanos"
  },
  {
    id: "horarios",
    nombre: "Horarios",
    descripcion: "Configuración de horarios de trabajo",
    icono: Clock,
    color: "text-teal-400",
    categoria: "operacional"
  }
] as const;

// Módulos adicionales que se pueden habilitar según necesidades
export const MODULOS_OPCIONALES = [
  {
    id: "contabilidad",
    nombre: "Contabilidad",
    descripcion: "Gestión contable y financiera avanzada",
    icono: FileText,
    color: "text-emerald-400",
    categoria: "financiero"
  },
  {
    id: "comunicaciones",
    nombre: "Comunicaciones",
    descripcion: "Sistema de mensajería y notificaciones",
    icono: MessageSquare,
    color: "text-sky-400",
    categoria: "comunicacion"
  },
  {
    id: "notificaciones",
    nombre: "Notificaciones",
    descripcion: "Gestión de alertas y recordatorios",
    icono: Bell,
    color: "text-violet-400",
    categoria: "comunicacion"
  },
  {
    id: "configuracion",
    nombre: "Configuración",
    descripcion: "Configuración general del sistema",
    icono: Settings,
    color: "text-slate-400",
    categoria: "administracion"
  }
] as const;

// Categorías de módulos para organización
export const CATEGORIAS_MODULOS = {
  operacional: {
    nombre: "Operacional",
    descripcion: "Módulos para operaciones diarias",
    color: "text-blue-400"
  },
  financiero: {
    nombre: "Financiero",
    descripcion: "Gestión financiera y contable",
    color: "text-green-400"
  },
  inventario: {
    nombre: "Inventario",
    descripcion: "Gestión de productos y proveedores",
    color: "text-purple-400"
  },
  administracion: {
    nombre: "Administración",
    descripcion: "Configuración y gestión del sistema",
    color: "text-orange-400"
  },
  recursos_humanos: {
    nombre: "Recursos Humanos",
    descripcion: "Gestión de personal y empleados",
    color: "text-cyan-400"
  },
  analitica: {
    nombre: "Analítica",
    descripcion: "Reportes y análisis de datos",
    color: "text-red-400"
  },
  comunicacion: {
    nombre: "Comunicación",
    descripcion: "Mensajería y notificaciones",
    color: "text-sky-400"
  }
} as const;

// Roles predefinidos con sus módulos típicos
export const ROLES_PREDEFINIDOS = {
  super_admin: {
    nombre: "Super Administrador",
    modulos: MODULOS_PROYECTO.map(m => m.id),
    descripcion: "Acceso completo al sistema"
  },
  admin: {
    nombre: "Administrador",
    modulos: ["ventas", "compras", "clientes", "barberos", "productos", "proveedores", "horarios"],
    descripcion: "Gestión administrativa completa"
  },
  recepcionista: {
    nombre: "Recepcionista",
    modulos: ["agendamiento", "clientes", "ventas", "productos", "paquetes"],
    descripcion: "Atención al cliente y ventas básicas"
  },
  barbero: {
    nombre: "Barbero",
    modulos: ["agendamiento", "servicios", "clientes", "horarios"],
    descripcion: "Gestión de citas y servicios"
  },
  cliente: {
    nombre: "Cliente",
    modulos: ["agendamiento", "servicios", "paquetes"],
    descripcion: "Acceso básico para clientes"
  }
} as const;

// Utilidad para obtener módulos por categoría
export const getModulosPorCategoria = (categoria?: keyof typeof CATEGORIAS_MODULOS) => {
  if (!categoria) return MODULOS_PROYECTO;
  return MODULOS_PROYECTO.filter(modulo => modulo.categoria === categoria);
};

// Utilidad para obtener información de un módulo
export const getModuloInfo = (moduloId: string) => {
  return [...MODULOS_PROYECTO, ...MODULOS_OPCIONALES].find(m => m.id === moduloId);
};

// Utilidad para validar si un módulo existe
export const existeModulo = (moduloId: string): boolean => {
  return [...MODULOS_PROYECTO, ...MODULOS_OPCIONALES].some(m => m.id === moduloId);
};

// Configuración para habilitar/deshabilitar módulos opcionales
export const CONFIG_MODULOS = {
  habilitarModulosOpcionales: false, // Cambiar a true para habilitar módulos adicionales
  modulosOpcionales: [], // Lista de IDs de módulos opcionales a habilitar
} as const;

export type ModuloId = typeof MODULOS_PROYECTO[number]['id'];
export type CategoriaId = keyof typeof CATEGORIAS_MODULOS;
export type RolPredefinidoId = keyof typeof ROLES_PREDEFINIDOS;
