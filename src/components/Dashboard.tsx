import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { BarberPole } from "./ui/BarberPole";
import {
  Calendar,
  Scissors,
  Package,
  Users,
  DollarSign,
  Clock,
  Gift,
  ShoppingCart,
  Truck,
  Tags,
  FileText,
  Shield,
  User,
  LogOut,
  Menu,
  RotateCcw,
  Sun,
  Moon,
  LayoutGrid,
  Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import logo from "../assets/a51cd14e3664f3752eaa436dadb14492d91e40aa.png";
import { DashboardPage } from "./pages/DashboardPage";
import { AgendamientoPage } from "./pages/AgendamientoPage";
import { ServiciosPage } from "./pages/ServiciosPage";
import { BarberosPage } from "./pages/BarberosPage";
import { ProductosPage } from "./pages/ProductosPage";
import { VentasPage } from "./pages/VentasPage";
import { ClientesPage } from "./pages/ClientesPage";
import { HorariosPage } from "./pages/HorariosPage";
import { PaquetesPage } from "./pages/PaquetesPage";
import { ComprasPage } from "./pages/ComprasPage";
import { ProveedoresPage } from "./pages/ProveedoresPage";
import { CategoriasPage } from "./pages/CategoriasPage";
import { EntregaInsumosPage } from "./pages/EntregaInsumosPage";
import { DevolucionesPage } from "./pages/DevolucionesPage";
import { RolesPage } from "./pages/RolesPage";
import { UsersPage } from "./pages/UsersPage";

// Información de cada módulo para el título dinámico
const moduleInfo: Record<string, {
  title: string;
  description: string;
  icon: any;
  color: string;
}> = {
  "Dashboard": {
    title: "Panel Principal",
    description: "Vista general del sistema",
    icon: LayoutGrid,
    color: "text-orange-primary"
  },
  "Ventas": {
    title: "Gestión de Ventas",
    description: "Procesamiento y seguimiento de ventas",
    icon: DollarSign,
    color: "text-green-400"
  },
  "Compras": {
    title: "Gestión de Compras",
    description: "Administración de compras y proveedores",
    icon: ShoppingCart,
    color: "text-blue-400"
  },
  "Devoluciones": {
    title: "Devoluciones",
    description: "Gestión de devoluciones y reembolsos",
    icon: RotateCcw,
    color: "text-yellow-400"
  },
  "Proveedores": {
    title: "Proveedores",
    description: "Administración de proveedores",
    icon: Truck,
    color: "text-purple-400"
  },
  "Agendamientos": {
    title: "Agendamiento",
    description: "Gestión de citas y reservas",
    icon: Calendar,
    color: "text-blue-400"
  },
  "Horarios": {
    title: "Horarios",
    description: "Configuración de horarios de trabajo",
    icon: Clock,
    color: "text-cyan-400"
  },
  "Barberos": {
    title: "Barberos",
    description: "Gestión del personal y barberos",
    icon: Users,
    color: "text-pink-400"
  },
  "Servicios": {
    title: "Servicios",
    description: "Catálogo de servicios de la barbería",
    icon: Scissors,
    color: "text-purple-400"
  },
  "Categorías": {
    title: "Categorías",
    description: "Organización de productos y servicios",
    icon: Tags,
    color: "text-indigo-400"
  },
  "Paquetes": {
    title: "Paquetes",
    description: "Paquetes promocionales",
    icon: Gift,
    color: "text-red-400"
  },
  "Productos": {
    title: "Productos",
    description: "Inventario y gestión de productos",
    icon: Package,
    color: "text-green-400"
  },
  "Entregas de Insumos": {
    title: "Entregas de Insumos",
    description: "Control de entregas de materiales",
    icon: FileText,
    color: "text-amber-400"
  },
  "Clientes": {
    title: "Clientes",
    description: "Base de datos de clientes",
    icon: Users,
    color: "text-pink-400"
  },
  "Usuarios": {
    title: "Usuarios",
    description: "Gestión de usuarios del sistema",
    icon: User,
    color: "text-indigo-400"
  },
  "Roles": {
    title: "Roles y Permisos",
    description: "Configuración de roles por módulos",
    icon: Shield,
    color: "text-orange-400"
  }
};

const menuSections = [
  {
    title: "Agenda",
    items: [
      { icon: Calendar, label: "Agendamientos" },
      { icon: Clock, label: "Horarios" },
      { icon: Users, label: "Barberos" },
    ],
  },
  {
    title: "Ventas",
    items: [
      { icon: DollarSign, label: "Ventas" },
      { icon: Scissors, label: "Servicios" },
      { icon: Gift, label: "Paquetes" },
      { icon: RotateCcw, label: "Devoluciones" },
      { icon: Users, label: "Clientes" },
    ],
  },
  {
    title: "Compras",
    items: [
      { icon: ShoppingCart, label: "Compras" },
      { icon: Package, label: "Productos" },
      { icon: Tags, label: "Categorías" },
      { icon: Truck, label: "Proveedores" },
      { icon: FileText, label: "Entregas de Insumos" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { icon: User, label: "Usuarios" },
      { icon: Shield, label: "Roles" },
    ],
  },
];

export function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const targetPage = item.page ?? item.label;
    const isActive = activePage === targetPage;

    const buttonElement = (
      <button
        key={item.label}
        onClick={() => {
          setActivePage(targetPage);
        }}
        className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-orange-primary/10 text-orange-primary" : "text-gray-lighter hover:bg-white/5"
          } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
        title={item.label}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-orange-primary" : "text-gray-lighter"}`} />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </button>
    );

    // Si el sidebar está colapsado, envolvemos el botón con un Tooltip
    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.label} delayDuration={0}>
          <TooltipTrigger asChild>
            {buttonElement}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-darkest border-gray-dark text-white-primary">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonElement;
  };

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardPage />;
      case "Agendamientos":
        return <AgendamientoPage />;
      case "Horarios":
        return <HorariosPage />;
      case "Barberos":
        return <BarberosPage />;
      case "Entregas de Insumos":
        return <EntregaInsumosPage />;
      case "Servicios":
        return <ServiciosPage />;
      case "Paquetes":
        return <PaquetesPage />;
      case "Ventas":
        return <VentasPage />;
      case "Compras":
        return <ComprasPage />;
      case "Devoluciones":
        return <DevolucionesPage />;
      case "Proveedores":
        return <ProveedoresPage />;
      case "Productos":
        return <ProductosPage />;
      case "Categorías":
        return <CategoriasPage />;
      case "Clientes":
        return <ClientesPage />;
      case "Usuarios":
        return <UsersPage />;
      case "Roles":
        return <RolesPage />;
      default:
        return <DashboardPage />;
    }
  };

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(menuSections.map(section => [section.title, false]))
  );

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-black-primary" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Barra Superior */}
        <header
          className="border-b border-gray-dark px-6 lg:px-8 py-4 flex items-center gap-6 transition-colors z-[100] relative"
          style={{
            backgroundColor: theme === 'dark' ? '#111111' : '#c9b7a3',
            boxShadow: theme === 'dark' ? '0px 0px 25px rgba(0,0,0,0.8)' : '0px 0px 25px rgba(0,0,0,0.35)'
          }}
        >
          <div className="flex items-center gap-4 shrink-0">
          <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="group relative p-2 rounded-md bg-muted border border-[#5D4037]/40 transition-all duration-300 flex items-center justify-center overflow-visible"
              style={{
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(174, 120, 14, 0.81), 0 4px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(244, 194, 69, 0.6)';
                e.currentTarget.style.backgroundColor = 'rgba(145, 129, 112, 0.98)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(93, 64, 55, 0.4)';
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title={sidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
            >
              <div className="transition-all duration-300 group-hover:scale-110">
                <BarberPole />
              </div>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center elegante-shadow-lg relative overflow-hidden">
                <img
                  src={logo}
                  alt="Edwin's Barbería Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white-primary">EDWINS BARBER</h1>
                <p className="text-xs text-gray-lighter font-medium">Sistema de Gestión</p>
              </div>
            </div>
          </div>

          {/* Título dinámico del módulo */}
          <div className="flex-1 flex items-center justify-center text-center px-4">
            {moduleInfo[activePage] && (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gray-darkest flex items-center justify-center ${moduleInfo[activePage].color}`}>
                  {React.createElement(moduleInfo[activePage].icon, { className: "w-5 h-5" })}
                </div>
                <div className="text-left">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-lightest/70">Módulo actual</p>
                  <h2 className="text-xl font-semibold text-white-primary leading-tight">{moduleInfo[activePage].title}</h2>
                  <p className="text-xs text-gray-lightest/80">{moduleInfo[activePage].description}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md bg-gray-darker hover:bg-gray-medium border border-gray-medium transition-colors"
              title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-orange-primary" />
              ) : (
                <Moon className="w-5 h-5 text-orange-primary" />
              )}
            </button>

            {/* Información del Usuario */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-darkest border border-gray-dark">
              <div className="w-8 h-8 bg-orange-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-black-primary" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-white-primary">{user?.name || "Usuario"}</p>
                <p className="text-xs text-gray-lighter">Administrador</p>
              </div>
            </div>

            <button
              onClick={() => setIsUserDetailOpen(true)}
              className="p-2 rounded-md bg-gray-darker hover:bg-gray-medium border border-gray-medium transition-colors"
              title="Ver detalles del usuario"
            >
              <Eye className="w-5 h-5 text-orange-primary" />
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-md bg-gray-darker hover:bg-gray-medium border border-gray-medium transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 text-orange-primary" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside
            className={`border-r border-gray-dark flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-72"} z-[90] relative`}
            style={{
              backgroundColor: theme === 'dark' ? '#111111' : '#c9b7a3',
              boxShadow: theme === 'dark' ? '0px 0px 25px rgba(0,0,0,0.8)' : '0px 0px 25px rgba(0,0,0,0.35)'
            }}
          >
            <div className={`px-4 py-5 ${sidebarCollapsed ? "flex justify-center" : "flex items-center gap-3"}`}>
              {!sidebarCollapsed && (
                <div>
                  <p className="text-white-primary font-semibold text-lg mt-5 leading-tight">Panel Principal</p>
                  <p className="text-sm mt-5 mb-4 text-gray-lighter">Accesos directos</p>
                </div>
              )}
            </div>
            <nav className={`flex-1 overflow-y-auto px-3 mt-5 pb-6 ${sidebarCollapsed ? "space-y-2" : "space-y-6"}`}>
              {sidebarCollapsed ? (
                <div className="space-y-1">
                  {/* Dashboard independiente */}
                  {renderNavItem({ icon: LayoutGrid, label: "Dashboard", page: "Dashboard" })}
                  {/* Otros módulos */}
                  {menuSections.flatMap(section => section.items).map(renderNavItem)}
                </div>
              ) : (
                <>
                  {/* Dashboard como elemento independiente */}
                  <div className="space-y-1">
                    {renderNavItem({ icon: LayoutGrid, label: "Dashboard", page: "Dashboard" })}
                  </div>
                  {/* Secciones desplegables */}
                  {menuSections.map(section => {
                    const isCollapsed = collapsedSections[section.title];
                    return (
                      <div key={section.title} className="space-y-2">
                        <button
                          onClick={() => toggleSection(section.title)}
                          className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-gray-lightest/80 px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
                          aria-expanded={!isCollapsed}
                        >
                          <span>{section.title}</span>
                          <span className="text-xs">
                            {isCollapsed ? "+" : "–"}
                          </span>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ${isCollapsed
                            ? "max-h-0 opacity-0 pointer-events-none"
                            : "max-h-96 opacity-100"
                            } space-y-1 pl-1`}
                        >
                          {!isCollapsed && section.items.map(renderNavItem)}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </nav>
          </aside>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="module-content flex-1 overflow-y-auto px-6 lg:px-8 py-6">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Dialog de Detalles del Usuario */}
        <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white-primary">Detalles del Usuario</DialogTitle>
              <DialogDescription className="text-gray-lightest">
                Información del usuario actual
              </DialogDescription>
            </DialogHeader>
            {user && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 p-4 bg-gray-darker rounded-lg border border-gray-dark">
                  <div className="w-16 h-16 bg-orange-primary rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-black-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white-primary">{user.name}</h3>
                    <p className="text-sm text-gray-lighter">{user.email || "No especificado"}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-orange-primary text-black-primary">
                      Administrador
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-lighter mb-1">Nombre completo</p>
                    <p className="text-sm text-white-primary">{user.name}</p>
                  </div>
                  {user.email && (
                    <div>
                      <p className="text-xs text-gray-lighter mb-1">Correo electrónico</p>
                      <p className="text-sm text-white-primary">{user.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
