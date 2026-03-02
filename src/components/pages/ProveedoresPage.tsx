import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  IdCard,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Globe,
  Calendar,
  Briefcase,
  Users,
  FileText,
  UserCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { useCustomAlert } from "../ui/custom-alert";
import { useDoubleConfirmation } from "../ui/double-confirmation";
import { proveedorService, Proveedor } from "../../services/proveedorService";

// Tipos de proveedor
const TIPOS_PROVEEDOR = [
  { value: 'Juridico', label: 'Jurídico (Empresa)' },
  { value: 'Natural', label: 'Natural (Persona)' }
];

// Datos estáticos para fallback cuando la API no está disponible
const proveedoresDataFallback: Proveedor[] = [
  {
    id: 1,
    nombre: "Suministros Barbería Pro",
    razonSocial: "Suministros Barbería Pro S.A.S",
    tipoProveedor: "Juridico",
    nit: "900123456-7",
    correo: "ventas@barberiapro.com",
    numero: "+57 301 234 5678",
    direccion: "Calle 72 #10-34, Oficina 501, Bogotá",
    representanteLegal: "María Elena García",
    documentoRepresentante: "52123456",
    telefonoRepresentante: "+57 301 111 2222",
    correoRepresentante: "maria.garcia@barberiapro.com",
    sectorEconomico: "Comercio al por mayor de productos de belleza",
    anosOperacion: 12,
    paginaWeb: "www.barberiapro.com",
    fechaCreacion: "15-03-2025",
    activo: true
  },
  {
    id: 2,
    nombre: "Perfumería Andina Ltda",
    razonSocial: "Perfumería Andina Ltda",
    tipoProveedor: "Juridico",
    nit: "800987654-3",
    correo: "contacto@perfumeriaandina.co",
    numero: "+57 302 345 6789",
    direccion: "Carrera 15 #93-47, Local 102, Bogotá",
    representanteLegal: "Carlos Andrés Rodríguez",
    documentoRepresentante: "71987654",
    telefonoRepresentante: "+57 302 333 4444",
    correoRepresentante: "carlos.rodriguez@perfumeriaandina.co",
    sectorEconomico: "Comercio de perfumes y fragancias",
    anosOperacion: 8,
    paginaWeb: "www.perfumeriaandina.co",
    fechaCreacion: "22-06-2025",
    activo: true
  },
  {
    id: 3,
    nombre: "Accesorios & Más Ltda",
    razonSocial: "Accesorios & Más Ltda",
    tipoProveedor: "Juridico",
    nit: "900555666-9",
    correo: "info@accesoriosymas.com",
    numero: "+57 303 456 7890",
    direccion: "Centro Comercial Santafé, Local 245, Bogotá",
    representanteLegal: "Ana María Pérez",
    documentoRepresentante: "41555666",
    telefonoRepresentante: "+57 303 555 6666",
    correoRepresentante: "ana.perez@accesoriosymas.com",
    sectorEconomico: "Comercio de accesorios y joyería",
    anosOperacion: 5,
    paginaWeb: "www.accesoriosymas.com",
    fechaCreacion: "08-04-2025",
    activo: false
  },
  {
    id: 4,
    nombre: "Carlos Andrés Martínez",
    tipoProveedor: "Natural",
    nit: "12345678-9",
    correo: "carlos.martinez@email.com",
    numero: "+57 305 678 9012",
    direccion: "Barrio La Candelaria, Calle 11 #6-42, Bogotá",
    fechaCreacion: "12-07-2025",
    activo: true
  }
];

export function ProveedoresPage() {
  const { created, edited, deleted, AlertContainer } = useCustomAlert();
  const { confirmDeleteAction, confirmEditAction, DoubleConfirmationContainer } = useDoubleConfirmation();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    nombre: "",
    tipoProveedor: "Juridico" as 'Juridico' | 'Natural',
    nit: "",
    correo: "",
    numero: "",
    direccion: "",
    razonSocial: "",
    representanteLegal: "",
    documentoRepresentante: "",
    telefonoRepresentante: "",
    correoRepresentante: "",
    sectorEconomico: "",
    anosOperacion: 0,
    paginaWeb: "",
    personaContacto: "",
    // Campos adicionales faltantes
    apellidos: "",
    cargoRepLegal: "",
    ciudad: "",
    departamento: "",
    numeroIdentificacion: "",
    numeroIdentificacionRepLegal: ""
  });

  // Cargar proveedores desde la API
  const cargarProveedores = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      console.log('📥 Loading providers...');
      const data = await proveedorService.obtenerProveedores();
      console.log('✅ Providers loaded:', data);

      // Asegurarse de que los datos sean un array válido
      if (Array.isArray(data) && data.length > 0) {
        setProveedores(data);
      } else if (Array.isArray(data)) {
        // Si el array está vacío, mantenerlo vacío pero no mostrar error
        console.log('📭 No providers found, using empty array');
        setProveedores([]);
      } else {
        // Si los datos no son un array, usar fallback
        console.warn('⚠️ Invalid data format, using fallback');
        setProveedores(proveedoresDataFallback);
      }
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
      setError('No se pudieron cargar los proveedores desde el servidor. Mostrando datos locales.');
      // Usar datos de fallback en caso de error
      setProveedores(proveedoresDataFallback);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarProveedores();
  }, []);

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipoProveedor: "Juridico",
      nit: "",
      correo: "",
      numero: "",
      direccion: "",
      razonSocial: "",
      representanteLegal: "",
      documentoRepresentante: "",
      telefonoRepresentante: "",
      correoRepresentante: "",
      sectorEconomico: "",
      anosOperacion: 0,
      paginaWeb: "",
      personaContacto: "",
      // Campos adicionales faltantes
      apellidos: "",
      cargoRepLegal: "",
      ciudad: "",
      departamento: "",
      numeroIdentificacion: "",
      numeroIdentificacionRepLegal: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const nuevoProveedor = await proveedorService.crearProveedor({
        ...formData,
        fechaCreacion: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        activo: true
      });

      created("Proveedor creado", `El proveedor "${formData.nombre}" ha sido agregado exitosamente al sistema.`);

      // Refrescar datos desde la API
      await cargarProveedores();

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creando proveedor:', error);
      // En caso de error, agregar localmente
      const nuevoProveedor: Proveedor = {
        id: proveedores.length + 1,
        ...formData,
        fechaCreacion: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        activo: true
      };

      setProveedores([...proveedores, nuevoProveedor]);
      created("Proveedor creado", `El proveedor "${formData.nombre}" ha sido agregado localmente.`);

      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);

    // Configurar tipo de proveedor, con fallback a 'Juridico' si no está definido
    const tipo = (proveedor.tipoProveedor === 'Natural' || proveedor.tipoProveedor === 'Juridico')
      ? proveedor.tipoProveedor
      : 'Juridico';

    setFormData({
      nombre: proveedor.nombre || "",
      tipoProveedor: tipo,
      nit: proveedor.nit || proveedor.numeroIdentificacion || "",
      correo: proveedor.correo || "",
      numero: proveedor.numero || proveedor.telefono || "",
      direccion: proveedor.direccion || "",
      ciudad: proveedor.ciudad || "",
      departamento: proveedor.departamento || "",

      // Contacto adicional (Natural)
      personaContacto: proveedor.personaContacto || proveedor.contacto || "",

      // Datos Jurídicos
      razonSocial: proveedor.razonSocial || "",
      representanteLegal: proveedor.representanteLegal || "",
      numeroIdentificacionRepLegal: proveedor.numeroIdentificacionRepLegal || "",
      cargoRepLegal: proveedor.cargoRepLegal || "",
      documentoRepresentante: proveedor.documentoRepresentante || "",
      telefonoRepresentante: proveedor.telefonoRepresentante || "",
      correoRepresentante: proveedor.correoRepresentante || "",
      sectorEconomico: proveedor.sectorEconomico || "",
      anosOperacion: proveedor.anosOperacion || 0,
      paginaWeb: proveedor.paginaWeb || "",

      // Campos legacy o adicionales para evitar errores
      apellidos: proveedor.apellidos || "",
      numeroIdentificacion: proveedor.numeroIdentificacion || ""
    });

    setIsEditDialogOpen(true);
    setIsDialogOpen(true); // Abrimos el mismo diálogo pero en modo edición
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProveedor) return;

    // Cerrar el modal temporalmente para evitar conflictos de z-index
    const tempFormData = { ...formData };
    const tempSelectedProveedor = { ...selectedProveedor };

    setIsEditDialogOpen(false);

    confirmEditAction(
      formData.nombre,
      async () => {
        try {
          if (tempSelectedProveedor.id) {
            const proveedorActualizado = await proveedorService.actualizarProveedor(
              tempSelectedProveedor.id,
              tempFormData
            );

            // Refrescar datos desde la API para obtener los datos más actualizados
            await cargarProveedores();
          }
        } catch (error) {
          console.error('Error actualizando proveedor:', error);
          // Actualizar localmente en caso de error
          const proveedorActualizado: Proveedor = {
            ...tempSelectedProveedor,
            ...tempFormData
          };

          setProveedores(proveedores.map(p =>
            p.id === tempSelectedProveedor.id ? proveedorActualizado : p
          ));
        }

        setSelectedProveedor(null);
        resetForm();
      },
      {
        confirmTitle: 'Confirmar Edición',
        confirmMessage: `¿Estás seguro de que deseas actualizar la información del proveedor "${formData.nombre}"?`,
        successTitle: 'Proveedor actualizado ✔️',
        successMessage: `La información del proveedor "${formData.nombre}" ha sido actualizada exitosamente.`,
        requireInput: false
      }
    );
  };

  const handleDeleteClick = (proveedor: Proveedor) => {
    confirmDeleteAction(
      proveedor.nombre,
      async () => {
        try {
          if (proveedor.id) {
            await proveedorService.eliminarProveedor(proveedor.id);
          }
          // Refrescar datos desde la API para sincronizar con el servidor
          await cargarProveedores();
        } catch (error) {
          console.error('Error eliminando proveedor:', error);
          // Eliminar localmente en caso de error
          setProveedores(proveedores.filter(p => p.id !== proveedor.id));
        }
      },
      {
        confirmTitle: 'Eliminar Proveedor',
        confirmMessage: `¿Estás seguro de que deseas eliminar el proveedor "${proveedor.nombre}" y toda su información asociada? Esta acción no se puede deshacer.`,
        requireInput: false,
        successTitle: 'Proveedor eliminado ✔️',
        successMessage: `El proveedor "${proveedor.nombre}" ha sido eliminado exitosamente del sistema.`
      }
    );
  };

  const handleToggleStatus = async (proveedor: Proveedor) => {
    // Usar estado si está disponible, sino activo (compatibilidad)
    const estadoActual = proveedor.estado !== undefined ? proveedor.estado : proveedor.activo;
    const nuevoEstado = !estadoActual;
    console.log(`🔄 Toggle status for provider ${proveedor.id}: ${estadoActual} -> ${nuevoEstado}`);

    try {
      if (proveedor.id) {
        await proveedorService.cambiarEstadoProveedor(proveedor.id, nuevoEstado);
      }

      // Refrescar datos desde la API para sincronizar con el servidor (de forma silenciosa)
      await cargarProveedores(true);

      if (nuevoEstado) {
        created("Proveedor activado", `El proveedor "${proveedor.nombre}" ha sido activado.`);
      } else {
        edited("Proveedor desactivado", `El proveedor "${proveedor.nombre}" ha sido desactivado.`);
      }
    } catch (error) {
      console.error('❌ Error cambiando estado del proveedor:', error);

      // Cambiar estado localmente en caso de error, pero solo si la lista actual no está vacía
      if (proveedores.length > 0) {
        setProveedores(proveedores.map(p =>
          p.id === proveedor.id ? { ...p, estado: nuevoEstado, activo: nuevoEstado } : p
        ));

        if (nuevoEstado) {
          created("Proveedor activado", `El proveedor "${proveedor.nombre}" ha sido activado localmente.`);
        } else {
          edited("Proveedor desactivado", `El proveedor "${proveedor.nombre}" ha sido desactivado localmente.`);
        }
      } else {
        // Si la lista está vacía, recargar los datos
        console.log('📥 Provider list is empty, reloading...');
        await cargarProveedores();
      }
    }
  };

  const handleViewDetails = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetailDialogOpen(true);
  };

  const getTipoProveedorLabel = (tipo: string) => {
    const tipoProveedor = TIPOS_PROVEEDOR.find(t => t.value === tipo);
    return tipoProveedor ? tipoProveedor.label : tipo;
  };

  const proveedoresActivos = proveedores.filter(p => p.activo).length;
  const proveedoresInactivos = proveedores.filter(p => !p.activo).length;

  // Filtrado y paginación
  const filteredProveedores = proveedores.filter(proveedor =>
    (proveedor.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.nit || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.correo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.tipoProveedor || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProveedores = filteredProveedores.slice(startIndex, endIndex);

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Gestión de Proveedores</h1>
            <p className="text-sm text-gray-lightest mt-1">Administra la red de proveedores</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Sección Principal */}
        <div className="elegante-card">
          {/* Barra de Controles */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-dark">
            <div className="flex flex-wrap items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="elegante-button-primary gap-2 flex items-center"
                    onClick={() => resetForm()}
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Proveedor
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white-primary flex items-center gap-2">
                      <Truck className="w-5 h-5 text-orange-primary" />
                      {isEditDialogOpen ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-lightest">
                      {isEditDialogOpen ? 'Modifique los datos del proveedor seleccionado' : 'Complete los datos del nuevo proveedor en el sistema'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={isEditDialogOpen ? handleEditSubmit : handleSubmit} className="space-y-6 pt-4">
                    {/* Sección 1: Información Básica e Identificación */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Building className="w-4 h-4 text-orange-primary" />
                          Tipo de Proveedor <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="tipoProveedor"
                          value={formData.tipoProveedor}
                          onChange={(e) => setFormData({ ...formData, tipoProveedor: e.target.value as 'Juridico' | 'Natural' })}
                          className="elegante-input w-full"
                          required
                          disabled={isEditDialogOpen} // No permitir cambiar tipo al editar
                        >
                          {TIPOS_PROVEEDOR.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-primary" />
                          {formData.tipoProveedor === 'Juridico' ? 'Nombre Comercial' : 'Nombre Completo'} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="elegante-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <IdCard className="w-4 h-4 text-orange-primary" />
                          NIT / Identificación <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nit"
                          value={formData.nit}
                          onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                          className="elegante-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-primary" />
                          Dirección <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="direccion"
                          value={formData.direccion}
                          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                          className="elegante-input"
                          required
                        />
                      </div>
                    </div>

                    {/* Sección 2: Contacto Principal */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Phone className="w-4 h-4 text-orange-primary" />
                          Teléfono Principal <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="numero"
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                          className="elegante-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Mail className="w-4 h-4 text-orange-primary" />
                          Correo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="correo"
                          type="email"
                          value={formData.correo}
                          onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                          className="elegante-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-primary" />
                          Departamento
                        </Label>
                        <Input
                          id="departamento"
                          value={formData.departamento}
                          onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                          className="elegante-input"
                          placeholder="Departamento"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-primary" />
                          Ciudad
                        </Label>
                        <Input
                          id="ciudad"
                          value={formData.ciudad}
                          onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                          className="elegante-input"
                          placeholder="Ciudad"
                        />
                      </div>
                    </div>

                    {/* Sección 3: Datos Específicos */}
                    {formData.tipoProveedor === 'Juridico' && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <h4 className="text-orange-primary font-medium mb-4 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" /> Información Legal y Representante
                        </h4>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              Razón Social
                            </Label>
                            <Input
                              id="razonSocial"
                              value={formData.razonSocial}
                              onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                              className="elegante-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-400" />
                              Página Web
                            </Label>
                            <Input
                              id="paginaWeb"
                              value={formData.paginaWeb}
                              onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })}
                              className="elegante-input"
                              placeholder="www.ejemplo.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-gray-400" />
                              Representante Legal
                            </Label>
                            <Input
                              id="representanteLegal"
                              value={formData.representanteLegal}
                              onChange={(e) => setFormData({ ...formData, representanteLegal: e.target.value })}
                              className="elegante-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <IdCard className="w-4 h-4 text-gray-400" />
                              Documento Rep. Legal
                            </Label>
                            <Input
                              id="numeroIdentificacionRepLegal"
                              value={formData.numeroIdentificacionRepLegal}
                              onChange={(e) => setFormData({ ...formData, numeroIdentificacionRepLegal: e.target.value })}
                              className="elegante-input"
                              placeholder="Cédula del representante"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              Cargo Rep. Legal
                            </Label>
                            <Input
                              id="cargoRepLegal"
                              value={formData.cargoRepLegal}
                              onChange={(e) => setFormData({ ...formData, cargoRepLegal: e.target.value })}
                              className="elegante-input"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              Sector Económico
                            </Label>
                            <Input
                              id="sectorEconomico"
                              value={formData.sectorEconomico}
                              onChange={(e) => setFormData({ ...formData, sectorEconomico: e.target.value })}
                              className="elegante-input"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.tipoProveedor === 'Natural' && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <div className="space-y-2">
                          <Label className="text-white-primary flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-orange-primary" />
                            Persona de Contacto (Opcional)
                          </Label>
                          <Input
                            id="personaContacto"
                            value={formData.personaContacto || ''}
                            onChange={(e) => setFormData({ ...formData, personaContacto: e.target.value })}
                            className="elegante-input"
                            placeholder="Nombre de contacto alternativo"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-dark">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setIsEditDialogOpen(false);
                          resetForm();
                        }}
                        className="elegante-button-secondary"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="elegante-button-primary"
                      >
                        {isEditDialogOpen ? 'Actualizar Proveedor' : 'Agregar Proveedor'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                <Input
                  placeholder="Buscar por nombre, NIT, correo o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="elegante-input pl-11 w-80"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-lightest">
                {loading ? 'Cargando...' : `Mostrando ${currentProveedores.length} de ${filteredProveedores.length} proveedores`}
              </div>
            </div>
          </div>

          {/* Tabla de Proveedores */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-dark">
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">NIT</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Proveedor</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Contacto</th>
                  <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Fecha</th>
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Estado</th>
                  <th className="text-right py-3 px-4 text-white-primary font-bold text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-orange-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-lg font-medium text-white-primary mb-2">Cargando proveedores...</h3>
                        <p className="text-gray-lightest">Obteniendo información desde el servidor</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white-primary mb-2">Error de conexión</h3>
                      <p className="text-gray-lightest mb-4">{error}</p>
                      <button
                        onClick={cargarProveedores}
                        className="elegante-button-primary text-sm"
                      >
                        Reintentar
                      </button>
                    </td>
                  </tr>
                ) : currentProveedores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Truck className="w-12 h-12 text-gray-medium mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white-primary mb-2">No hay proveedores</h3>
                      <p className="text-gray-lightest">
                        {searchTerm ? 'No se encontraron proveedores con ese criterio de búsqueda.' : 'Comience agregando un nuevo proveedor.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentProveedores.map((proveedor) => (
                    <tr
                      key={proveedor.id}
                      className="border-b border-gray-dark hover:bg-gray-darker transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-lighter">{proveedor.nit}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-primary rounded-lg flex items-center justify-center">
                            {proveedor.tipoProveedor === 'Juridico' ? (
                              <Building className="w-4 h-4 text-black-primary" />
                            ) : (
                              <User className="w-4 h-4 text-black-primary" />
                            )}
                          </div>
                          <span className="text-sm text-gray-lighter">{proveedor.nombre}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-lighter">{proveedor.correo}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-lighter">{proveedor.fechaCreacion}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`elegante-tag text-xs ${(proveedor.estado !== undefined ? proveedor.estado : proveedor.activo) ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                            {(proveedor.estado !== undefined ? proveedor.estado : proveedor.activo) ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(proveedor)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title={(proveedor.estado !== undefined ? proveedor.estado : proveedor.activo) ? "Desactivar" : "Activar"}
                          >
                            {(proveedor.estado !== undefined ? proveedor.estado : proveedor.activo) ? (
                              <ToggleRight className="w-4 h-4 text-gray-lightest group-hover:text-green-400" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleViewDetails(proveedor)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4 text-gray-lightest group-hover:text-orange-primary" />
                          </button>
                          <button
                            onClick={() => handleEdit(proveedor)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-gray-lightest group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(proveedor)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {!loading && !error && filteredProveedores.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-dark">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-lightest">
                  Página {currentPage} de {totalPages}
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="elegante-input text-sm w-auto"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-lightest" />
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm transition-colors ${currentPage === pageNum
                          ? 'bg-orange-primary text-black-primary font-medium'
                          : 'border border-gray-dark hover:bg-gray-darker text-gray-lightest'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4 text-gray-lightest" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de proveedores - OLD */}
        <div className="elegante-card" style={{ display: 'none' }}>
          {currentProveedores.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-medium mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white-primary mb-2">No hay proveedores</h3>
              <p className="text-gray-lightest">
                {searchTerm ? 'No se encontraron proveedores con ese criterio de búsqueda.' : 'Comience agregando un nuevo proveedor.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Encabezados de tabla */}
              <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-dark bg-gray-darker">
                <div className="text-sm font-medium text-white-primary">ID</div>
                <div className="text-sm font-medium text-white-primary">Proveedor</div>
                <div className="text-sm font-medium text-white-primary">Fecha</div>
                <div className="text-sm font-medium text-white-primary">Total</div>
                <div className="text-sm font-medium text-white-primary">Estado</div>
                <div className="text-sm font-medium text-white-primary">Acciones</div>
              </div>

              {/* Filas de datos */}
              <div className="space-y-0">
                {currentProveedores.map((proveedor) => (
                  <div
                    key={proveedor.id}
                    className="grid grid-cols-6 gap-4 p-4 border-b border-gray-dark hover:bg-gray-darker transition-colors"
                  >
                    {/* ID */}
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-primary rounded-lg flex items-center justify-center mr-3">
                        {proveedor.tipoProveedor === 'Juridico' ? (
                          <Building className="w-4 h-4 text-black-primary" />
                        ) : (
                          <User className="w-4 h-4 text-black-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-white-primary">{proveedor.id}</span>
                    </div>

                    {/* Proveedor */}
                    <div>
                      <div className="text-sm font-medium text-white-primary">{proveedor.nombre}</div>
                      <div className="text-xs text-gray-lightest">{proveedor.correo}</div>
                    </div>

                    {/* Fecha */}
                    <div className="flex items-center">
                      <span className="text-sm text-gray-lightest">{proveedor.fechaCreacion}</span>
                    </div>

                    {/* Total */}
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-primary-orange">
                        ${(Math.random() * 3000000 + 500000).toLocaleString('es-CO')}
                      </span>
                      <div className="text-xs text-gray-lightest ml-1">
                        {proveedor.tipoProveedor === 'Juridico' ? 'Transferencia' : 'Efectivo'}
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-center gap-2">
                      <span className={`elegante-tag text-xs ${proveedor.activo ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(proveedor)}
                        className="flex items-center"
                      >
                        {proveedor.activo ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-medium" />
                        )}
                      </button>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(proveedor)}
                        className="elegante-button-secondary p-2 h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(proveedor)}
                        className="elegante-button-secondary p-2 h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(proveedor)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white p-2 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paginación */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-dark">
            <div className="text-sm text-gray-lightest">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-lightest" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-lightest" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Detalle */}
      {selectedProveedor && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-orange" />
                Detalle del Proveedor
              </DialogTitle>
              <DialogDescription>
                Información completa del proveedor seleccionado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Información básica */}
              <div className="elegante-card bg-gray-darker">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-primary rounded-lg flex items-center justify-center">
                    {selectedProveedor.tipoProveedor === 'Juridico' ? (
                      <Building className="w-5 h-5 text-black-primary" />
                    ) : (
                      <User className="w-5 h-5 text-black-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white-primary">{selectedProveedor.nombre}</h3>
                    <p className="text-sm text-gray-lightest">{getTipoProveedorLabel(selectedProveedor.tipoProveedor || "Juridico")}</p>
                  </div>
                  
                <div className="flex items-center gap-2">
                  <span className={`elegante-tag ${(selectedProveedor.estado !== undefined ? selectedProveedor.estado : selectedProveedor.activo) ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {(selectedProveedor.estado !== undefined ? selectedProveedor.estado : selectedProveedor.activo) ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-gray-lightest" />
                    <span className="text-sm text-gray-lightest">
                      {selectedProveedor.tipoProveedor === 'Natural' ? 'Identificación:' : 'NIT:'}
                    </span>
                    <span className="text-sm text-white-primary">{selectedProveedor.nit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-lightest" />
                    <span className="text-sm text-gray-lightest">Fecha registro:</span>
                    <span className="text-sm text-white-primary">{selectedProveedor.fechaCreacion}</span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="elegante-card bg-gray-darker">
                <h4 className="text-sm font-medium text-white-primary mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-orange" />
                  Información de Contacto
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-lightest" />
                    <span className="text-sm text-gray-lightest">Correo:</span>
                    <span className="text-sm text-white-primary">{selectedProveedor.correo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-lightest" />
                    <span className="text-sm text-gray-lightest">Teléfono:</span>
                    <span className="text-sm text-white-primary">{selectedProveedor.numero}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-lightest" />
                    <span className="text-sm text-gray-lightest">Dirección:</span>
                    <span className="text-sm text-white-primary">{selectedProveedor.direccion}</span>
                  </div>
                </div>
              </div>

              {/* Información específica para proveedores jurídicos */}
              {selectedProveedor.tipoProveedor === 'Juridico' && (
                <div className="elegante-card bg-gray-darker">
                  <h4 className="text-sm font-medium text-white-primary mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary-orange" />
                    Información Empresarial
                  </h4>
                  <div className="space-y-3">
                    {selectedProveedor.razonSocial && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-lightest" />
                        <span className="text-sm text-gray-lightest">Razón Social:</span>
                        <span className="text-sm text-white-primary">{selectedProveedor.razonSocial}</span>
                      </div>
                    )}
                    {selectedProveedor.representanteLegal && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-gray-lightest" />
                        <span className="text-sm text-gray-lightest">Representante Legal:</span>
                        <span className="text-sm text-white-primary">{selectedProveedor.representanteLegal}</span>
                      </div>
                    )}
                    {selectedProveedor.sectorEconomico && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-lightest" />
                        <span className="text-sm text-gray-lightest">Sector Económico:</span>
                        <span className="text-sm text-white-primary">{selectedProveedor.sectorEconomico}</span>
                      </div>
                    )}
                    {selectedProveedor.anosOperacion && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-lightest" />
                        <span className="text-sm text-gray-lightest">Años de Operación:</span>
                        <span className="text-sm text-white-primary">{selectedProveedor.anosOperacion} años</span>
                      </div>
                    )}
                    {selectedProveedor.paginaWeb && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-lightest" />
                        <span className="text-sm text-gray-lightest">Página Web:</span>
                        <span className="text-sm text-primary-orange">{selectedProveedor.paginaWeb}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setIsDetailDialogOpen(false)}
                className="elegante-button-primary"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertContainer />
      <DoubleConfirmationContainer />
    </>
  );
}
