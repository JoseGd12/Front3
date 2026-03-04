import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import { Switch } from "../ui/switch";
import { compraService } from "../../services/compraService";

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
  const { error, created, edited, deleted, AlertContainer } = useCustomAlert();
  const { confirmDeleteAction, confirmEditAction, DoubleConfirmationContainer } = useDoubleConfirmation();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
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
    tipoDocumentoRepresentante: "",
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
    numeroIdentificacionRepLegal: "",
    // Contacto adicional (Natural)
    tipoDocumentoContactoAdicional: "",
    documentoContactoAdicional: "",
    telefonoContactoAdicional: "",
    correoContactoAdicional: "",
    estado: true
  });
  const [showProveedorFormErrors, setShowProveedorFormErrors] = useState(false);
  const [proveedorValidationAttempt, setProveedorValidationAttempt] = useState(0);
  const shakeClass = proveedorValidationAttempt % 2 === 0 ? "input-required-shake-a" : "input-required-shake-b";
  const [duplicateErrors, setDuplicateErrors] = useState<{ nombre?: string; nit?: string; numero?: string; correo?: string }>({});

  const normalizeText = (v: unknown) =>
    String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  const normalizeNit = (v: unknown) => String(v ?? '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
  const normalizePhone = (v: unknown) => String(v ?? '').replace(/\D/g, '');
  const normalizeEmail = (v: unknown) => String(v ?? '').toLowerCase().trim();

  const validateDuplicateFields = (payload: { nombre: string; nit: string; numero: string; correo: string }, ignoreId?: number) => {
    const nombreNorm = normalizeText(payload.nombre);
    const nitNorm = normalizeNit(payload.nit);
    const numeroNorm = normalizePhone(payload.numero);
    const correoNorm = normalizeEmail(payload.correo);

    const errs: { nombre?: string; nit?: string; numero?: string; correo?: string } = {};

    for (const p of proveedores) {
      if (ignoreId && p.id === ignoreId) continue;
      const pNombre = normalizeText(p.nombre);
      const pNit = normalizeNit(p.nit || p.numeroIdentificacion || '');
      const pTelefono = normalizePhone((p as any).numero || p.telefono || '');
      const pCorreo = normalizeEmail(p.correo || '');

      if (!errs.nombre && nombreNorm && pNombre && pNombre === nombreNorm) {
        errs.nombre = 'Ya existe un proveedor con este nombre.';
      }
      if (!errs.nit && nitNorm && pNit && pNit === nitNorm) {
        errs.nit = 'Ya existe un proveedor con este NIT.';
      }
      if (!errs.numero && numeroNorm && pTelefono && pTelefono === numeroNorm) {
        errs.numero = 'Ya existe un proveedor con este teléfono.';
      }
      if (!errs.correo && correoNorm && pCorreo && pCorreo === correoNorm) {
        errs.correo = 'Ya existe un proveedor con este correo.';
      }
      if (errs.nombre || errs.nit || errs.numero || errs.correo) break;
    }

    setDuplicateErrors(errs);
    return { hasError: !!(errs.nombre || errs.nit || errs.numero || errs.correo), errs };
  };

  // Cargar proveedores desde la API
  const cargarProveedores = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setPageError(null);
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
      setPageError('No se pudieron cargar los proveedores desde el servidor. Mostrando datos locales.');
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
      tipoDocumentoRepresentante: "",
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
      numeroIdentificacionRepLegal: "",
      // Contacto adicional (Natural)
      tipoDocumentoContactoAdicional: "",
      documentoContactoAdicional: "",
      telefonoContactoAdicional: "",
      correoContactoAdicional: "",
      estado: true
    });
    setShowProveedorFormErrors(false);
    setProveedorValidationAttempt(0);
    setIsEditDialogOpen(false);
    setSelectedProveedor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingRequired =
      !formData.nombre.trim() ||
      !formData.nit.trim() ||
      !formData.direccion.trim() ||
      !formData.numero.trim() ||
      !formData.correo.trim() ||
      (formData.tipoProveedor === 'Juridico' && !formData.razonSocial.trim());

    if (missingRequired) {
      setShowProveedorFormErrors(true);
      setProveedorValidationAttempt(prev => prev + 1);
      return;
    }

    const dupCheck = validateDuplicateFields(
      {
        nombre: formData.nombre,
        nit: formData.nit,
        numero: formData.numero,
        correo: formData.correo
      }
    );
    if (dupCheck.hasError) {
      setProveedorValidationAttempt(prev => prev + 1);
      return;
    }

    try {
      const documentoUnico = (formData.nit || '').trim();
      const payload = {
        ...formData,
        nit: documentoUnico,
        // Para Naturales, el backend usa numeroIdentificacion; para Jurídico, nit.
        numeroIdentificacion: documentoUnico,
        // Valor por defecto razonable si no viene del formulario en Naturales
        tipoIdentificacion: formData.tipoProveedor === 'Natural' ? (formData as any).tipoIdentificacion || 'CC' : (formData as any).tipoIdentificacion,
        fechaCreacion: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        activo: true
      };

      const nuevoProveedor = await proveedorService.crearProveedor(payload as any);

      created("Proveedor creado", `El proveedor "${formData.nombre}" ha sido agregado exitosamente al sistema.`);

      // Refrescar datos desde la API
      await cargarProveedores();

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creando proveedor:', error);
      setPageError('No se pudo crear el proveedor en el servidor. Verifique los datos y su conexión.');
      setProveedorValidationAttempt(prev => prev + 1);
      // Mantener el diálogo abierto para que el usuario corrija
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setShowProveedorFormErrors(false);
    setProveedorValidationAttempt(0);

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
      tipoDocumentoContactoAdicional: (proveedor as any).tipoDocumentoContactoAdicional || "",
      documentoContactoAdicional: (proveedor as any).documentoContactoAdicional || "",
      telefonoContactoAdicional: (proveedor as any).telefonoContactoAdicional || "",
      correoContactoAdicional: (proveedor as any).correoContactoAdicional || "",

      // Datos Jurídicos
      razonSocial: proveedor.razonSocial || "",
      representanteLegal: proveedor.representanteLegal || "",
      tipoDocumentoRepresentante: proveedor.tipoDocumentoRepresentante || "",
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
      numeroIdentificacion: proveedor.numeroIdentificacion || "",
      estado: (proveedor.estado !== undefined ? proveedor.estado : proveedor.activo) ?? true
    });

    setIsEditDialogOpen(true);
    setIsDialogOpen(true); // Abrimos el mismo diálogo pero en modo edición
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProveedor) return;

    const dupCheck = validateDuplicateFields(
      {
        nombre: formData.nombre,
        nit: formData.nit,
        numero: formData.numero,
        correo: formData.correo
      },
      selectedProveedor.id
    );
    if (dupCheck.hasError) {
      setProveedorValidationAttempt(prev => prev + 1);
      return;
    }

    try {
      // Unificar el documento en un solo campo antes de actualizar
      const documentoUnico = (formData.nit || '').trim();
      const tempFormData = {
        ...formData,
        nit: documentoUnico,
        numeroIdentificacion: documentoUnico,
        tipoIdentificacion: formData.tipoProveedor === 'Natural' ? (formData as any).tipoIdentificacion || 'CC' : (formData as any).tipoIdentificacion
      };
      const tempSelectedProveedor = { ...selectedProveedor };
      setIsEditDialogOpen(false);
      if (tempSelectedProveedor.id) {
        await proveedorService.actualizarProveedor(tempSelectedProveedor.id, tempFormData);
        await cargarProveedores();
      }
      edited('Proveedor actualizado ✔️', `La información del proveedor "${formData.nombre}" ha sido actualizada exitosamente.`);
      setSelectedProveedor(null);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      const proveedorActualizado: Proveedor = {
        ...selectedProveedor,
        ...formData
      };
      setProveedores(proveedores.map(p =>
        p.id === selectedProveedor.id ? proveedorActualizado : p
      ));
      edited('Proveedor actualizado ✔️', `La información del proveedor "${formData.nombre}" ha sido actualizada exitosamente.`);
      setSelectedProveedor(null);
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteClick = (proveedor: Proveedor) => {
    confirmDeleteAction(
      proveedor.nombre,
      async () => {
        try {
          // Pre‑check: compras asociadas a este proveedor
          let comprasAsociadas = 0;
          try {
            const compras = await compraService.getCompras();
            const normalize = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
            comprasAsociadas = (compras || []).filter(c =>
              Number(c.proveedorId) === Number(proveedor.id) ||
              (normalize(c.proveedorNombre) && normalize(c.proveedorNombre) === normalize(proveedor.nombre))
            ).length;
          } catch {}

          if (comprasAsociadas > 0) {
            error(
              "No se puede eliminar",
              `El proveedor "${proveedor.nombre}" no se puede eliminar porque tiene ${comprasAsociadas} compra(s) registradas a su nombre.`
            );
            throw new Error('Proveedor asociado a compras');
          }

          if (proveedor.id) {
            await proveedorService.eliminarProveedor(proveedor.id);
          }
          await cargarProveedores();
        } catch (err: any) {
          console.error('Error eliminando proveedor:', err);
          error('Error al eliminar proveedor', err?.message || 'No se pudo eliminar el proveedor.');
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

  if (loading) {
    return (
      <main className="flex-1 overflow-auto p-8 bg-black-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary mx-auto mb-4"></div>
          <p className="text-white-primary text-lg">Cargando proveedores...</p>
        </div>
      </main>
    );
  }

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
                    onClick={() => {
                      resetForm();
                      setIsEditDialogOpen(false);
                    }}
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
                    <h4 className="text-sm font-medium text-white-primary mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-primary" />
                      Información General
                    </h4>
                    {/* Sección 1: Información Básica e Identificación */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Building className="w-4 h-4 text-orange-primary" />
                          Tipo de Proveedor
                        </Label>
                        <select
                          id="tipoProveedor"
                          value={formData.tipoProveedor}
                          onChange={(e) => setFormData({ ...formData, tipoProveedor: e.target.value as 'Juridico' | 'Natural' })}
                          className="elegante-input w-full"
                          disabled={isEditDialogOpen}
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
                          {formData.tipoProveedor === 'Juridico' ? 'Nombre Comercial' : 'Nombre Completo'} <span className="text-white-primary">*</span>
                        </Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          placeholder={formData.tipoProveedor === 'Juridico' ? 'Ej: Suministros Barbería Pro S.A.S' : 'Ej: Carlos Andrés Martínez'}
                          className={`elegante-input ${((showProveedorFormErrors && !isEditDialogOpen && !formData.nombre.trim()) || !!duplicateErrors.nombre) ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                        />
                        {showProveedorFormErrors && !isEditDialogOpen && !formData.nombre.trim() && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                        {!!duplicateErrors.nombre && (
                          <p className="text-xs text-red-400">{duplicateErrors.nombre}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <IdCard className="w-4 h-4 text-orange-primary" />
                          NIT / Identificación <span className="text-white-primary">*</span>
                        </Label>
                        <Input
                          id="nit"
                          value={formData.nit}
                          onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                          placeholder="Ej: 900123456-7"
                          className={`elegante-input ${((showProveedorFormErrors && !isEditDialogOpen && !formData.nit.trim()) || !!duplicateErrors.nit) ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                        />
                        {showProveedorFormErrors && !isEditDialogOpen && !formData.nit.trim() && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                        {!!duplicateErrors.nit && (
                          <p className="text-xs text-red-400">{duplicateErrors.nit}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-primary" />
                          Dirección <span className="text-white-primary">*</span>
                        </Label>
                        <Input
                          id="direccion"
                          value={formData.direccion}
                          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                          placeholder="Ej: Calle 72 #10-34, Bogotá"
                          className={`elegante-input ${showProveedorFormErrors && !isEditDialogOpen && !formData.direccion.trim() ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                        />
                        {showProveedorFormErrors && !isEditDialogOpen && !formData.direccion.trim() && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                      </div>
                    </div>

                    {/* Sección 2: Contacto Principal */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Phone className="w-4 h-4 text-orange-primary" />
                          Teléfono Principal <span className="text-white-primary">*</span>
                        </Label>
                        <Input
                          id="numero"
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                          placeholder="Ej: +57 301 234 5678"
                          className={`elegante-input ${((showProveedorFormErrors && !isEditDialogOpen && !formData.numero.trim()) || !!duplicateErrors.numero) ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                        />
                        {showProveedorFormErrors && !isEditDialogOpen && !formData.numero.trim() && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                        {!!duplicateErrors.numero && (
                          <p className="text-xs text-red-400">{duplicateErrors.numero}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white-primary flex items-center gap-2">
                          <Mail className="w-4 h-4 text-orange-primary" />
                          Correo <span className="text-white-primary">*</span>
                        </Label>
                        <Input
                          id="correo"
                          type="email"
                          value={formData.correo}
                          onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                          placeholder="Ej: proveedor@correo.com"
                          className={`elegante-input ${((showProveedorFormErrors && !isEditDialogOpen && !formData.correo.trim()) || !!duplicateErrors.correo) ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                        />
                        {showProveedorFormErrors && !isEditDialogOpen && !formData.correo.trim() && (
                          <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                        )}
                        {!!duplicateErrors.correo && (
                          <p className="text-xs text-red-400">{duplicateErrors.correo}</p>
                        )}
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
                          placeholder="Ej: Cundinamarca"
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
                          placeholder="Ej: Bogotá"
                        />
                      </div>
                    </div>

                    {/* Sección 3: Datos Específicos */}
                    {formData.tipoProveedor === 'Juridico' && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-white-primary mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" /> Información Representante
                        </h4>

                        <div className="grid grid-cols-1 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              Razón Social <span className="text-white-primary">*</span>
                            </Label>
                            <Input
                              id="razonSocial"
                              value={formData.razonSocial}
                              onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                              className={`elegante-input ${showProveedorFormErrors && !isEditDialogOpen && !formData.razonSocial.trim() ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
                              placeholder="Ej: Razón social registrada"
                            />
                            {showProveedorFormErrors && !isEditDialogOpen && !formData.razonSocial.trim() && (
                              <p className="text-xs text-red-400">Este campo es obligatorio.</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <IdCard className="w-4 h-4 text-gray-400" />
                              Tipo documento representante
                            </Label>
                            <select
                              id="tipoDocumentoRepresentante"
                              value={formData.tipoDocumentoRepresentante}
                              onChange={(e) => setFormData({ ...formData, tipoDocumentoRepresentante: e.target.value })}
                              className="elegante-input w-full"
                            >
                              <option value="">Seleccione</option>
                              <option value="CC">Cédula de Ciudadanía</option>
                              <option value="CE">Cédula de Extranjería</option>
                              <option value="NIT">NIT</option>
                              <option value="PAS">Pasaporte</option>
                            </select>
                          </div>
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
                              placeholder="Ej: Nombre completo del representante"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <IdCard className="w-4 h-4 text-gray-400" />
                              Documento representante
                            </Label>
                            <Input
                              id="numeroIdentificacionRepLegal"
                              value={formData.numeroIdentificacionRepLegal}
                              onChange={(e) => setFormData({ ...formData, numeroIdentificacionRepLegal: e.target.value })}
                              className="elegante-input"
                              placeholder="Cédula del representante"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              Teléfono representante
                            </Label>
                            <Input
                              id="telefonoRepresentante"
                              value={formData.telefonoRepresentante}
                              onChange={(e) => setFormData({ ...formData, telefonoRepresentante: e.target.value })}
                              className="elegante-input"
                              placeholder="Ej: +57 300 000 0000"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              Correo representante
                            </Label>
                            <Input
                              id="correoRepresentante"
                              type="email"
                              value={formData.correoRepresentante}
                              onChange={(e) => setFormData({ ...formData, correoRepresentante: e.target.value })}
                              className="elegante-input"
                              placeholder="representante@empresa.com"
                            />
                          </div>
                          <div />
                        </div>

                        
                      </div>
                    )}

                    {formData.tipoProveedor === 'Natural' && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-white-primary mb-3 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-orange-primary" />
                          Información de Contacto Adicional
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
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
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <IdCard className="w-4 h-4 text-gray-400" />
                              Tipo documento contacto adicional
                            </Label>
                            <select
                              id="tipoDocumentoContactoAdicional"
                              value={formData.tipoDocumentoContactoAdicional}
                              onChange={(e) => setFormData({ ...formData, tipoDocumentoContactoAdicional: e.target.value })}
                              className="elegante-input w-full"
                            >
                              <option value="">Seleccione</option>
                              <option value="CC">Cédula de Ciudadanía</option>
                              <option value="CE">Cédula de Extranjería</option>
                              <option value="PAS">Pasaporte</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <IdCard className="w-4 h-4 text-gray-400" />
                              Documento contacto adicional
                            </Label>
                            <Input
                              id="documentoContactoAdicional"
                              value={formData.documentoContactoAdicional}
                              onChange={(e) => setFormData({ ...formData, documentoContactoAdicional: e.target.value })}
                              className="elegante-input"
                              placeholder="Número de documento del contacto"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              Teléfono contacto adicional
                            </Label>
                            <Input
                              id="telefonoContactoAdicional"
                              value={formData.telefonoContactoAdicional}
                              onChange={(e) => setFormData({ ...formData, telefonoContactoAdicional: e.target.value })}
                              className="elegante-input"
                              placeholder="Ej: +57 300 000 0000"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label className="text-white-primary flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              Correo contacto adicional
                            </Label>
                            <Input
                              id="correoContactoAdicional"
                              type="email"
                              value={formData.correoContactoAdicional}
                              onChange={(e) => setFormData({ ...formData, correoContactoAdicional: e.target.value })}
                              className="elegante-input"
                              placeholder="contacto@correo.com"
                            />
                          </div>
                          <div />
                        </div>
                      </div>
                    )}

                    {isEditDialogOpen && (
                      <div className="space-y-2 border-t border-gray-dark pt-4 mt-4">
                        <Label className="text-white-primary flex items-center gap-2">
                          Estado
                        </Label>
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={!!formData.estado}
                            onCheckedChange={(checked) => setFormData({ ...formData, estado: checked })}
                            className="data-[state=checked]:bg-orange-primary"
                          />
                          <span className={`text-sm font-medium ${formData.estado ? 'text-orange-primary' : 'text-gray-lightest'}`}>
                            {formData.estado ? 'Activo' : 'Inactivo'}
                          </span>
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
                Mostrando {currentProveedores.length} de {filteredProveedores.length} proveedores
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
                  <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Acciones</th>
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
                ) : pageError ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white-primary mb-2">Error de conexión</h3>
                      <p className="text-gray-lightest mb-4">{pageError}</p>
                      <button
                        onClick={() => cargarProveedores()}
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
                          <span className={`px-3 py-1 rounded-full text-xs ${(proveedor.estado !== undefined ? proveedor.estado : proveedor.activo) ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {(proveedor.estado !== undefined ? proveedor.estado : proveedor.activo) ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
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
          {!pageError && filteredProveedores.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-dark">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-lightest">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-lightest">Filas por página:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-8 bg-gray-darker border-gray-dark text-gray-lightest">
                      <SelectValue placeholder={itemsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-darkest border-gray-dark text-gray-lightest">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <span className={`px-3 py-1 rounded-full text-xs ${proveedor.activo ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
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
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white-primary flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-primary" />
                Detalle del Proveedor
              </DialogTitle>
              <DialogDescription className="text-gray-lightest">
                Información completa del proveedor seleccionado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Building className="w-4 h-4 text-orange-primary" />
                    Tipo de Proveedor
                  </Label>
                  <Input
                    value={getTipoProveedorLabel(selectedProveedor.tipoProveedor || 'Juridico')}
                    disabled
                    className="elegante-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-primary" />
                    {selectedProveedor.tipoProveedor === 'Juridico' ? 'Nombre Comercial' : 'Nombre Completo'}
                  </Label>
                  <Input
                    value={selectedProveedor.nombre || ''}
                    disabled
                    className="elegante-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-orange-primary" />
                    NIT / Identificación
                  </Label>
                  <Input
                    value={selectedProveedor.nit || (selectedProveedor as any).numeroIdentificacion || ''}
                    disabled
                    className="elegante-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-primary" />
                    Dirección
                  </Label>
                  <Input
                    value={selectedProveedor.direccion || ''}
                    disabled
                    className="elegante-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-primary" />
                    Teléfono Principal
                  </Label>
                  <Input
                    value={selectedProveedor.numero || (selectedProveedor as any).telefono || ''}
                    disabled
                    className="elegante-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-primary" />
                    Correo
                  </Label>
                  <Input
                    value={selectedProveedor.correo || ''}
                    disabled
                    className="elegante-input"
                  />
                </div>
              </div>

              {selectedProveedor.tipoProveedor === 'Juridico' && (
                <>
                  <h4 className="text-sm font-medium text-white-primary mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-primary" />
                    Información Representante
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-orange-primary" />
                        Tipo documento representante
                      </Label>
                      <Input value={(selectedProveedor as any).tipoDocumentoRepresentante || ''} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-orange-primary" />
                        Representante Legal
                      </Label>
                      <Input value={selectedProveedor.representanteLegal || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-primary" />
                        Razón Social
                      </Label>
                      <Input value={selectedProveedor.razonSocial || ''} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-orange-primary" />
                        Representante Legal
                      </Label>
                      <Input value={selectedProveedor.representanteLegal || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-orange-primary" />
                        Documento representante
                      </Label>
                      <Input value={selectedProveedor.documentoRepresentante || selectedProveedor.numeroIdentificacionRepLegal || ''} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Phone className="w-4 h-4 text-orange-primary" />
                        Teléfono Representante
                      </Label>
                      <Input value={selectedProveedor.telefonoRepresentante || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-primary" />
                        Correo Representante
                      </Label>
                      <Input value={selectedProveedor.correoRepresentante || ''} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-primary" />
                        Sector Económico
                      </Label>
                      <Input value={selectedProveedor.sectorEconomico || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-primary" />
                        Departamento
                      </Label>
                      <Input value={selectedProveedor.departamento || ''} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-primary" />
                        Ciudad
                      </Label>
                      <Input value={selectedProveedor.ciudad || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-primary" />
                        Años de Operación
                      </Label>
                      <Input value={String(selectedProveedor.anosOperacion || '')} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Globe className="w-4 h-4 text-orange-primary" />
                        Página Web
                      </Label>
                      <Input value={selectedProveedor.paginaWeb || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                </>
              )}

              {selectedProveedor.tipoProveedor === 'Natural' && (
                <>
                  <h4 className="text-sm font-medium text-white-primary mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-primary" />
                    Información Representante
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-primary" />
                        Persona de Contacto
                      </Label>
                      <Input value={(selectedProveedor as any).personaContacto || (selectedProveedor as any).contacto || ''} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-orange-primary" />
                        Tipo documento contacto adicional
                      </Label>
                      <Input value={(selectedProveedor as any).tipoDocumentoContactoAdicional || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-orange-primary" />
                        Documento contacto adicional
                      </Label>
                      <Input value={(selectedProveedor as any).documentoContactoAdicional || ''} disabled className="elegante-input" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Phone className="w-4 h-4 text-orange-primary" />
                        Teléfono contacto adicional
                      </Label>
                      <Input value={(selectedProveedor as any).telefonoContactoAdicional || ''} disabled className="elegante-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white-primary flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-primary" />
                        Correo contacto adicional
                      </Label>
                      <Input value={(selectedProveedor as any).correoContactoAdicional || ''} disabled className="elegante-input" />
                    </div>
                    <div />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-dark">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
                className="elegante-button-secondary"
              >
                Cancelar
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
