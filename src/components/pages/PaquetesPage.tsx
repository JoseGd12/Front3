import React, { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Edit,
  ToggleLeft,
  ToggleRight,
  Search,
  Eye,
  Clock,
  DollarSign,
  Scissors,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Calculator,
  FileText
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useCustomAlert } from "../ui/custom-alert";
import { useDoubleConfirmation } from "../ui/double-confirmation";
import { apiService, Paquete } from "../../services/api";

import { servicioService, Servicio } from "../../services/servicioService";

const categorias = ["Premium", "Clásico", "Moderno", "Especial"];

export function PaquetesPage() {
  const { created, edited, deleted, AlertContainer } = useCustomAlert();
  const { confirmCreateAction, DoubleConfirmationContainer } = useDoubleConfirmation();
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingPaquete, setEditingPaquete] = useState<Paquete | null>(null);
  const [selectedPaquete, setSelectedPaquete] = useState<Paquete | null>(null);
  const [detallePaquete, setDetallePaquete] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Servicios disponibles cargados desde la API
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>([]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [paquetesData, serviciosData] = await Promise.all([
          apiService.getPaquetes(),
          servicioService.getServicios()
        ]);
        setPaquetes(paquetesData);
        setServiciosDisponibles(serviciosData.filter(s => s.estado === true));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to reload paquetes
  const loadPaquetes = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPaquetes();
      setPaquetes(data);
    } catch (error) {
      console.error('Error loading paquetes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to load detalle paquete
  const loadDetallePaquete = async (paqueteId: number) => {
    try {
      setLoadingDetalle(true);

      // 1. Obtener los detalles específicos desde el endpoint de detalles
      const data = await apiService.getDetallePaquetesByPaqueteId(paqueteId);
      setDetallePaquete(data);

      // 2. Opcionalmente recargar el paquete por ID para asegurar que tiene los strings de servicios
      const fullPaquete = await apiService.getPaqueteById(paqueteId);
      if (fullPaquete) {
        setSelectedPaquete(fullPaquete);
      }
    } catch (error) {
      console.error('Error loading detalle paquete:', error);
      setDetallePaquete([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [serviciosAgregados, setServiciosAgregados] = useState<Array<{ nombre: string, precio: number }>>([]);
  const [nuevoPaquete, setNuevoPaquete] = useState({
    nombre: '',
    descripcion: '',
    servicios: [] as string[],
    serviciosTexto: '',
    duracion: 60,
    precio: 0,
    descuento: 0,
    categoria: '',
    activo: true,
    metodoPago: '',
    porcentajeDescuento: 0
  });

  // Estado inicial para reset
  const estadoInicialPaquete = {
    nombre: '',
    descripcion: '',
    servicios: [] as string[],
    serviciosTexto: '',
    duracion: 60,
    precio: 0,
    descuento: 0,
    categoria: '',
    activo: true,
    metodoPago: '',
    porcentajeDescuento: 0
  };

  const filteredPaquetes = paquetes.filter(paquete => {
    const matchesSearch = paquete.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paquete.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "all" || paquete.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const totalPages = Math.ceil(filteredPaquetes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedPaquetes = filteredPaquetes.slice(startIndex, startIndex + itemsPerPage);



  // Funciones para manejar servicios automáticamente con precios
  const agregarServicio = () => {
    if (!servicioSeleccionado) return;

    const yaExiste = serviciosAgregados.find(s => s.nombre === servicioSeleccionado);
    if (!yaExiste) {
      const servicioEncontrado = serviciosDisponibles.find(s => s.nombre === servicioSeleccionado);
      if (!servicioEncontrado) return;

      const precioServicio = servicioEncontrado.precio;

      const nuevosServicios = [...serviciosAgregados, {
        id: servicioEncontrado.id,
        nombre: servicioSeleccionado,
        precio: precioServicio
      }];

      setServiciosAgregados(nuevosServicios);
      setNuevoPaquete({
        ...nuevoPaquete,
        servicios: nuevosServicios.map(s => s.nombre),
        serviciosTexto: nuevosServicios.map(s => s.nombre).join(', '),
        precio: nuevosServicios.reduce((total, s) => total + s.precio, 0)
      });
    }

    setServicioSeleccionado('');
  };

  const eliminarServicio = (nombreServicio: string) => {
    const nuevosServicios = serviciosAgregados.filter(s => s.nombre !== nombreServicio);

    setServiciosAgregados(nuevosServicios);
    setNuevoPaquete({
      ...nuevoPaquete,
      servicios: nuevosServicios.map(s => s.nombre),
      serviciosTexto: nuevosServicios.map(s => s.nombre).join(', '),
      precio: nuevosServicios.reduce((total, s) => total + s.precio, 0)
    });
  };

  // Funciones para cálculos automáticos
  const calcularSubtotal = () => {
    return nuevoPaquete.precio;
  };

  const calcularDescuento = (subtotal: number) => {
    return subtotal * (nuevoPaquete.porcentajeDescuento / 100);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuento(subtotal);
    return subtotal - descuento;
  };

  const handleCreatePaquete = async () => {
    if (!nuevoPaquete.nombre || !nuevoPaquete.descripcion || serviciosAgregados.length === 0) {
      return;
    }

    try {
      // 1. Preparar la estructura para el endpoint /completo
      const paqueteData = {
        ...nuevoPaquete,
        precio: parseFloat(nuevoPaquete.precio.toString()),
        duracion: Number(nuevoPaquete.duracion),
        detalles: serviciosAgregados.map(s => ({
          servicioId: (s as any).id,
          cantidad: 1
        }))
      };

      // 2. Crear paquete y detalles en una sola transacción API
      const createdPaquete = await apiService.createPaqueteCompleto(paqueteData);

      setPaquetes([...paquetes, createdPaquete]);
      setNuevoPaquete({ ...estadoInicialPaquete });
      setServiciosAgregados([]);
      setIsDialogOpen(false);

      created("Paquete creado exitosamente ✔️", `El paquete "${createdPaquete.nombre}" ha sido creado correctamente con todos sus servicios en una sola operación.`);
    } catch (error) {
      console.error('Error creating paquete completo:', error);
    }
  };

  const handleEditPaquete = (paquete: Paquete) => {
    setEditingPaquete(paquete);
    const serviciosArray = Array.isArray(paquete.servicios) ? paquete.servicios : [];
    const serviciosTexto = serviciosArray.join(', ');

    // Convertir servicios a objetos con nombre y precio
    const serviciosConPrecio = serviciosArray.map((nombreServicio: string) => {
      const servicioEncontrado = serviciosDisponibles.find(s => s.nombre === nombreServicio);
      return {
        id: servicioEncontrado ? servicioEncontrado.id : 0,
        nombre: nombreServicio,
        precio: servicioEncontrado ? servicioEncontrado.precio : 0
      };
    });

    setNuevoPaquete({
      nombre: paquete.nombre || '',
      descripcion: paquete.descripcion || '',
      servicios: serviciosArray,
      serviciosTexto: serviciosTexto,
      duracion: paquete.duracion || 60,
      precio: paquete.precio || 0,
      descuento: paquete.descuento || 0,
      categoria: paquete.categoria || '',
      activo: paquete.activo ?? true,
      metodoPago: '',
      porcentajeDescuento: 0
    });

    setServiciosAgregados(serviciosConPrecio);
    setIsDialogOpen(true);
  };

  const handleUpdatePaquete = async () => {
    if (!editingPaquete) return;

    const nombrePaquete = nuevoPaquete.nombre;
    const tempPaqueteData = { ...nuevoPaquete };

    // Cerrar el modal temporalmente para evitar conflictos de z-index
    setIsDialogOpen(false);

    confirmCreateAction(
      `${nombrePaquete}`,
      async () => {
        try {
          const updatedPaquete = await apiService.updatePaquete(editingPaquete.id, {
            ...tempPaqueteData,
            precio: parseFloat(tempPaqueteData.precio.toString()),
            precioOriginal: parseFloat(tempPaqueteData.precio.toString()) * (1 + tempPaqueteData.descuento / 100)
          });

          // Actualizar detalles (borrar y volver a crear)
          console.log(`🔄 Actualizando detalles para el paquete ${editingPaquete.id}`);
          await apiService.deleteDetallePaquetesByPaqueteId(editingPaquete.id);

          for (const servicio of serviciosAgregados) {
            await apiService.createDetallePaquete({
              paqueteId: editingPaquete.id,
              servicioId: (servicio as any).id,
              cantidad: 1
            });
          }

          await loadPaquetes(); // Recargar todos los paquetes como en ServiciosPage
          setEditingPaquete(null);
          setNuevoPaquete({ ...estadoInicialPaquete });
          setServiciosAgregados([]);

          edited("Paquete actualizado exitosamente ✔️", `El paquete "${nombrePaquete}" ha sido actualizado correctamente con la nueva información.`);
        } catch (error) {
          console.error('Error updating paquete:', error);
        }
      },
      {
        confirmTitle: 'Actualizar Paquete',
        confirmMessage: `¿Estás seguro de que deseas actualizar el paquete "${nombrePaquete}"? Se aplicarán todos los cambios realizados en el formulario.`,
        successTitle: 'Paquete actualizado exitosamente ✔️',
        successMessage: `El paquete "${nombrePaquete}" ha sido actualizado correctamente con la nueva información.`,
        requireInput: false
      }
    );
  };

  const handleToggleEstadoPaquete = (paquete: Paquete) => {
    const nombrePaquete = paquete.nombre;
    const nuevoEstado = !paquete.activo;

    confirmCreateAction(
      `${nombrePaquete}`,
      async () => {
        try {
          await apiService.updatePaqueteStatus(paquete.id, nuevoEstado);
          await loadPaquetes(); // Recargar todos los paquetes como en ServiciosPage
          edited(`Paquete ${nuevoEstado ? 'activado' : 'desactivado'} ✔️`, `El paquete "${nombrePaquete}" ha sido ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`);
        } catch (error) {
          console.error('Error updating paquete status:', error);
        }
      },
      {
        confirmTitle: `${nuevoEstado ? 'Activar' : 'Desactivar'} Paquete`,
        confirmMessage: `¿Estás seguro de que deseas ${nuevoEstado ? 'activar' : 'desactivar'} el paquete "${nombrePaquete}"?`,
        successTitle: `Paquete ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente ✔`,
        successMessage: `El paquete "${nombrePaquete}" ha sido ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`,
        requireInput: false
      }
    );
  };

  const handleEliminarPaquete = (paquete: Paquete) => {
    const nombrePaquete = paquete.nombre;

    confirmCreateAction(
      `${nombrePaquete}`,
      async () => {
        try {
          await apiService.deletePaquete(paquete.id);
          await loadPaquetes(); // Recargar todos los paquetes como en ServiciosPage
          deleted("Paquete eliminado exitosamente ✔️", `El paquete "${nombrePaquete}" ha sido eliminado permanentemente del sistema.`);
        } catch (error) {
          console.error('Error deleting paquete:', error);
        }
      },
      {
        confirmTitle: 'Eliminar Paquete',
        confirmMessage: `¿Estás seguro de que deseas eliminar permanentemente el paquete "${nombrePaquete}"? Esta acción no se puede deshacer y se perderán todos los datos asociados.`,
        successTitle: 'Paquete eliminado exitosamente ✔️',
        successMessage: `El paquete "${nombrePaquete}" ha sido eliminado permanentemente del sistema.`,
        requireInput: true
      }
    );
  };

  const toggleEstadoPaquete = (paqueteId: number) => {
    const paquete = paquetes.find(p => p.id === paqueteId);
    if (!paquete) return;

    handleToggleEstadoPaquete(paquete);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Paquetes de Servicios</h1>
            <p className="text-sm text-gray-lightest mt-1">Gestiona combinaciones de servicios con descuentos especiales</p>
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
                      setEditingPaquete(null);
                      setNuevoPaquete({ ...estadoInicialPaquete });
                      setServiciosAgregados([]);
                      setServicioSeleccionado('');
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Paquete
                  </button>
                </DialogTrigger>
              </Dialog>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                <Input
                  placeholder="Buscar paquetes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="elegante-input pl-11 w-80"
                />
              </div>

              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="elegante-input"
              >
                <option value="all">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-lightest">
                Mostrando {displayedPaquetes.length} de {filteredPaquetes.length} paquetes
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-white-primary mb-2">Cargando paquetes...</h3>
                <p className="text-gray-lightest">Por favor espera un momento</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-dark">
                      <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">Paquete</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Servicios</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Duración</th>
                      <th className="text-right py-3 px-4 text-white-primary font-bold text-sm">Precio</th>
                      <th className="text-center py-3 px-4 text-white-primary font-bold text-sm">Estado</th>
                      <th className="text-right py-3 px-4 text-white-primary font-bold text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPaquetes.map((paquete) => (
                      <tr key={paquete.id} className="border-b border-gray-dark hover:bg-gray-darker transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-primary rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-black-primary" />
                            </div>
                            <span className="text-gray-lighter">{paquete.nombre}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-lighter">{paquete.servicios.length} servicios</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-lighter">{paquete.duracion} min</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-gray-lighter">${(paquete.precio ?? 0).toLocaleString('es-CO')}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-3 py-1 rounded-full text-xs bg-gray-medium text-gray-lighter">
                            {paquete.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedPaquete(paquete);
                                setIsDetailDialogOpen(true);
                                loadDetallePaquete(paquete.id); // Cargar detalles del paquete
                              }}
                              className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                              title="Ver Detalle"
                            >
                              <Eye className="w-4 h-4 text-gray-lightest group-hover:text-orange-primary" />
                            </button>
                            <button
                              onClick={() => handleEditPaquete(paquete)}
                              className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-gray-lightest group-hover:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleToggleEstadoPaquete(paquete)}
                              className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                              title={paquete.activo ? "Desactivar paquete" : "Activar paquete"}
                            >
                              {paquete.activo ? (
                                <ToggleRight className="w-4 h-4 text-gray-lightest group-hover:text-green-400" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEliminarPaquete(paquete)}
                              className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {displayedPaquetes.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Gift className="w-16 h-16 text-gray-medium mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white-primary mb-2">No se encontraron paquetes</h3>
                    <p className="text-gray-lightest">Intenta con otros términos de búsqueda</p>
                  </div>
                )}
              </>
            )}
          </div>

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

        {/* Dialog de Creación/Edición */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPaquete(null);
            setNuevoPaquete({ ...estadoInicialPaquete });
            setServiciosAgregados([]);
            setServicioSeleccionado('');
          }
        }}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-primary" />
                {editingPaquete ? 'Editar Paquete' : 'Crear Nuevo Paquete'}
              </DialogTitle>
              <DialogDescription className="text-gray-lightest">
                {editingPaquete ? 'Modifica la información del paquete seleccionado' : 'Crea una nueva combinación de servicios con descuentos especiales'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Nombre y Descripción */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-primary" />
                    Nombre del Paquete *
                  </Label>
                  <Input
                    value={nuevoPaquete.nombre}
                    onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, nombre: e.target.value })}
                    placeholder="Ej: Paquete Premium Completo"
                    className="elegante-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-primary" />
                    Precio ($) *
                  </Label>
                  <Input
                    type="number"
                    value={nuevoPaquete.precio}
                    onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, precio: parseFloat(e.target.value) || 0 })}
                    className="elegante-input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Duración y Descuento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-primary" />
                    Duración (min)
                  </Label>
                  <Input
                    type="number"
                    value={nuevoPaquete.duracion}
                    onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, duracion: parseInt(e.target.value) || 0 })}
                    className="elegante-input"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-orange-primary" />
                    Porcentaje Descuento (%)
                  </Label>
                  <Input
                    type="number"
                    value={nuevoPaquete.porcentajeDescuento}
                    onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, porcentajeDescuento: parseFloat(e.target.value) || 0 })}
                    className="elegante-input"
                    min="0"
                    max="100"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label className="text-white-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-primary" />
                  Descripción
                </Label>
                <Textarea
                  value={nuevoPaquete.descripcion}
                  onChange={(e) => setNuevoPaquete({ ...nuevoPaquete, descripcion: e.target.value })}
                  placeholder="Describe el paquete de servicios"
                  className="elegante-input"
                  rows={3}
                />
              </div>

              {/* Servicios */}
              <div className="space-y-2">
                <Label className="text-white-primary flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-orange-primary" />
                  Servicios Seleccionados *
                </Label>
                <Input
                  value={nuevoPaquete.serviciosTexto}
                  readOnly
                  disabled
                  placeholder="Agrega servicios desde el selector inferior"
                  className="elegante-input bg-gray-medium cursor-not-allowed"
                />
                <p className="text-gray-lightest text-xs">
                  Los servicios agregados se mostrarán aquí. Puedes editar el precio de cada uno.
                </p>
              </div>

              {/* Gestión de Servicios */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white-primary flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-orange-primary" />
                    Agregar servicio
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={servicioSeleccionado}
                      onChange={(e) => setServicioSeleccionado(e.target.value)}
                      className="elegante-input flex-1"
                    >
                      <option value="">Selecciona un servicio</option>
                      {serviciosDisponibles.map((servicio, index) => (
                        <option key={index} value={servicio.nombre}>
                          {servicio.nombre} - ${(servicio.precio ?? 0).toLocaleString('es-CO')}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        agregarServicio();
                      }}
                      className="elegante-button-primary px-4 py-2"
                      disabled={!servicioSeleccionado}
                    >
                      Agregar Servicio
                    </button>
                  </div>
                </div>

                {/* Lista de servicios agregados */}
                {serviciosAgregados.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-white-primary">Servicios Agregados:</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {serviciosAgregados.map((servicio, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-darker p-3 rounded-lg">
                          <div className="flex-1">
                            <span className="text-white-primary font-medium">{servicio.nombre}</span>
                            <div className="text-sm text-gray-lightest">
                              Cantidad: 1 | Precio: ${(servicio.precio ?? 0).toLocaleString('es-CO')} |
                              Subtotal: ${(servicio.precio ?? 0).toLocaleString('es-CO')}
                            </div>
                          </div>
                          <button
                            onClick={() => eliminarServicio(servicio.nombre)}
                            className="ml-3 p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                            title="Eliminar servicio"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de Totales */}
              {nuevoPaquete.precio > 0 && (
                <div className="bg-gray-darker border border-gray-dark rounded-lg p-4">
                  <h3 className="text-white-primary font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-primary" />
                    Resumen de Totales
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-lightest">Subtotal:</span>
                      <span className="text-white-primary">${calcularSubtotal().toLocaleString('es-CO')}</span>
                    </div>
                    {nuevoPaquete.porcentajeDescuento > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-lightest">Descuento ({nuevoPaquete.porcentajeDescuento}%):</span>
                        <span className="text-red-400">-${calcularDescuento(calcularSubtotal()).toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-dark pt-2">
                      <span className="text-white-primary">Total:</span>
                      <span className="text-orange-primary">${calcularTotal().toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-dark">
                <button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPaquete(null);
                    setNuevoPaquete({ ...estadoInicialPaquete });
                    setServiciosAgregados([]);
                    setServicioSeleccionado('');
                  }}
                  className="elegante-button-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingPaquete ? handleUpdatePaquete : handleCreatePaquete}
                  className="elegante-button-primary"
                >
                  {editingPaquete ? 'Actualizar' : 'Crear'} Paquete
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>



        {/* Dialog de Detalle del Paquete */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-gray-darkest border-gray-dark max-w-md">
            {selectedPaquete && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white-primary">{selectedPaquete.nombre}</DialogTitle>
                  <DialogDescription className="text-gray-lightest">{selectedPaquete.descripcion}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-darkest border border-gray-dark p-6 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 hover:border-blue-400/30">
                      <Clock className="w-8 h-8 text-blue-400 mb-2" />
                      <span className="text-2xl font-bold text-white-primary">{selectedPaquete.duracion} min</span>
                      <span className="text-gray-lightest text-sm">Duración</span>
                    </div>
                    <div className="bg-gray-darkest border border-gray-dark p-6 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 hover:border-orange-primary/30">
                      <Scissors className="w-8 h-8 text-orange-primary mb-2" />
                      <span className="text-2xl font-bold text-white-primary">{selectedPaquete.servicios.length}</span>
                      <span className="text-gray-lightest text-sm">Servicios</span>
                    </div>
                  </div>

                  <div className="elegante-card">
                    <h4 className="font-semibold text-white-primary mb-3">Servicios Incluidos</h4>
                    {loadingDetalle ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-primary mx-auto mb-2"></div>
                        <p className="text-gray-lightest text-sm">Cargando servicios...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detallePaquete.length > 0 ? (
                          detallePaquete.map((detalle: any, index: number) => (
                            <div key={index} className="flex items-center justify-between bg-gray-darker p-3 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-orange-primary rounded-full"></div>
                                <span className="text-gray-lightest font-medium">{detalle.nombreServicio}</span>
                              </div>
                              <span className="text-gray-lightest">
                                ${(detalle.precioServicio ?? 0).toLocaleString('es-CO')}
                              </span>
                            </div>
                          ))
                        ) : selectedPaquete.servicios && selectedPaquete.servicios.length > 0 ? (
                          // Fallback: mostrar servicios del paquete si no hay detalles
                          selectedPaquete.servicios.map((servicio: string, index: number) => {
                            const servicioInfo = serviciosDisponibles.find(s => s.nombre === servicio);
                            return (
                              <div key={index} className="flex items-center justify-between bg-gray-darker p-3 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-orange-primary rounded-full"></div>
                                  <span className="text-gray-lightest font-medium">{servicio}</span>
                                </div>
                                <span className="text-gray-lightest">
                                  ${servicioInfo ? (servicioInfo.precio ?? 0).toLocaleString('es-CO') : '0'}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-lightest">No hay servicios disponibles para este paquete</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="elegante-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-white-primary">Precio Final</span>
                      <span className="text-2xl font-bold text-primary-orange">
                        ${(selectedPaquete.precio ?? 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-lightest">Precio original:</span>
                      <span className="line-through text-gray-lighter">
                        ${(selectedPaquete.precioOriginal ?? 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-lightest">Descuento:</span>
                      <span className="text-green-400">{selectedPaquete.descuento}% OFF</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertContainer />
        <DoubleConfirmationContainer />
      </main>
    </>
  );
}