import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  X,
  ToggleRight,
  ToggleLeft,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useCustomAlert } from "../ui/custom-alert";
import { barberosService, Barbero } from "../../services/barberosService";
import { horariosService, HorarioBarbero } from "../../services/horariosService";

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

// Tipo para un bloque de horario (día + hora inicio + hora fin)
interface BloqueHorario {
  id?: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  estado?: boolean;
}

// Tipo para un horario completo (un solo registro con múltiples bloques)
interface HorarioSemanal {
  id: number;
  barberoId: number;
  barbero: string;
  documento?: string;
  tipoDocumento?: string;
  activo: boolean; // Estado derivado
  bloques: BloqueHorario[];
  notas?: string;
}

export function HorariosPage() {
  const { success, error, AlertContainer } = useCustomAlert();
  const [horarios, setHorarios] = useState<HorarioSemanal[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Selection states
  const [editingHorario, setEditingHorario] = useState<HorarioSemanal | null>(null);
  const [horarioToDelete, setHorarioToDelete] = useState<HorarioSemanal | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<HorarioSemanal | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBarbero, setFilterBarbero] = useState("all");
  const [showInactivos, setShowInactivos] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Estado para el formulario de nuevo horario
  const [nuevoHorario, setNuevoHorario] = useState<{
    barberoId: string;
    activo: boolean;
    bloques: BloqueHorario[];
  }>({
    barberoId: "",
    activo: true,
    bloques: [],
  });

  // Estado para agregar un nuevo bloque
  const [nuevoBloque, setNuevoBloque] = useState<BloqueHorario>({
    dia: "",
    horaInicio: "",
    horaFin: "",
  });

  // Cargar datos al inicio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [barberosData, horariosData] = await Promise.all([
        barberosService.getBarberos(),
        horariosService.getHorarios()
      ]);

      // Mapear barberos de API a formato local para evitar problemas de nombres de propiedades
      const barberosMapeados = barberosData.map(b => ({
        id: b.id,
        nombre: b.nombres || (b as any).nombre,
        apellido: b.apellidos || (b as any).apellido,
        documento: b.documento || (b as any).documento || '',
        tipoDocumento: b.tipoDocumento || (b as any).tipoDocumento || 'CC',
        estado: b.estado
      }));

      setBarberos(barberosMapeados as any);

      // Agrupar horarios por barberoId
      const horariosPorBarbero: Record<number, HorarioBarbero[]> = {};
      horariosData.forEach(h => {
        if (!horariosPorBarbero[h.barberoId]) {
          horariosPorBarbero[h.barberoId] = [];
        }
        horariosPorBarbero[h.barberoId].push(h);
      });

      // Mapear a la estructura de la vista
      const horariosMapeados: HorarioSemanal[] = barberosMapeados
        .filter(b => b.id !== undefined && horariosPorBarbero[b.id] && horariosPorBarbero[b.id].length > 0)
        .map(b => {
          const bloquesBarbero = horariosPorBarbero[b.id!] || [];
          // El estado activo del horario depende de si tiene al menos un bloque activo
          const representsActivo = bloquesBarbero.some(h => h.estado !== false);

          return {
            id: b.id!,
            barberoId: b.id!,
            barbero: `${b.nombre} ${b.apellido}`,
            documento: b.documento || '',
            tipoDocumento: b.tipoDocumento || 'CC',
            activo: representsActivo,
            bloques: bloquesBarbero.map(h => ({
              id: h.id,
              dia: h.dia,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
              estado: h.estado ?? true
            }))
          };
        });

      setHorarios(horariosMapeados);
    } catch (err) {
      console.error("Error cargando horarios:", err);
      error("Error de conexión", "No se pudieron cargar los horarios de los barberos.");
    } finally {
      setLoading(false);
    }
  };

  const filteredHorarios = horarios.filter((horario) => {
    const matchesSearch = horario.barbero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarbero = filterBarbero === "all" || horario.barberoId.toString() === filterBarbero;
    const matchesActivo = showInactivos || horario.activo;
    return matchesSearch && matchesBarbero && matchesActivo;
  });

  // Paginación
  const totalPages = Math.ceil(filteredHorarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedHorarios = filteredHorarios.slice(startIndex, startIndex + itemsPerPage);

  // Agregar bloque al formulario
  const handleAgregarBloque = () => {
    if (!nuevoBloque.dia) {
      error("Día requerido", "Por favor selecciona un día de la semana.");
      return;
    }
    if (!nuevoBloque.horaInicio || !nuevoBloque.horaFin) {
      error("Horario incompleto", "Por favor ingresa la hora de inicio y fin.");
      return;
    }
    if (nuevoBloque.horaInicio >= nuevoBloque.horaFin) {
      error("Horario inválido", "La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    setNuevoHorario({
      ...nuevoHorario,
      bloques: [...nuevoHorario.bloques, { ...nuevoBloque, estado: true }],
    });
    setNuevoBloque({ dia: "", horaInicio: "", horaFin: "" });
  };

  // Eliminar bloque del formulario
  const handleEliminarBloque = (index: number) => {
    setNuevoHorario({
      ...nuevoHorario,
      bloques: nuevoHorario.bloques.filter((_, i) => i !== index),
    });
  };

  // Resetear formulario
  const resetFormulario = () => {
    setNuevoHorario({
      barberoId: "",
      activo: true,
      bloques: [],
    });
    setNuevoBloque({ dia: "", horaInicio: "", horaFin: "" });
  };

  const handleCreateHorario = () => {
    if (!nuevoHorario.barberoId) {
      error("Barbero requerido", "Por favor selecciona un barbero.");
      return;
    }
    if (nuevoHorario.bloques.length === 0) {
      error("Sin bloques", "Debes agregar al menos un bloque de horario (día + horas).");
      return;
    }

    if (horarios.some(h => h.barberoId.toString() === nuevoHorario.barberoId)) {
      error("Duplicado", "Este barbero ya tiene horarios asignados. Edítalos en su lugar.");
      return;
    }

    setIsCreateDialogOpen(true);
  };

  const confirmCreateHorario = async () => {
    try {
      const barberoIdNum = parseInt(nuevoHorario.barberoId);
      const promises = nuevoHorario.bloques.map(bloque => {
        const horarioData: HorarioBarbero = {
          barberoId: barberoIdNum,
          dia: bloque.dia,
          horaInicio: bloque.horaInicio,
          horaFin: bloque.horaFin,
          estado: true
        };
        return horariosService.createHorario(horarioData);
      });

      await Promise.all(promises);

      resetFormulario();
      setIsDialogOpen(false);
      setIsCreateDialogOpen(false);
      await loadData();
      success("¡Horario creado!", "Se han registrado los horarios correctamente.");
    } catch (err) {
      console.error(err);
      error("Error", "No se pudieron crear los horarios.");
    }
  };

  const handleEditHorario = (horario: HorarioSemanal) => {
    setEditingHorario(horario);
    setNuevoHorario({
      barberoId: horario.barberoId.toString(),
      activo: horario.activo,
      bloques: [...horario.bloques],
    });
    setIsDialogOpen(true);
  };

  const handleUpdateHorario = () => {
    if (!nuevoHorario.barberoId) {
      error("Barbero requerido", "Por favor selecciona un barbero.");
      return;
    }
    if (nuevoHorario.bloques.length === 0) {
      error("Sin bloques", "Debes agregar al menos un bloque de horario.");
      return;
    }
    setIsEditDialogOpen(true);
  };

  const confirmEditHorario = async () => {
    if (!editingHorario) return;

    try {
      const barberoIdNum = parseInt(nuevoHorario.barberoId);

      // Bloques actuales en BD (traídos en loadData y guardados en editingHorario)
      const bloquesActuales = editingHorario.bloques;

      // Bloques en el formulario
      const bloquesNuevos = nuevoHorario.bloques;

      // 1. Eliminar los que ya no están
      // Un bloque se elimina si tiene ID y ese ID no está en la lista nueva
      const idsNuevos = new Set(bloquesNuevos.map(b => b.id).filter(id => id !== undefined));
      const bloquesAEliminar = bloquesActuales.filter(b => b.id !== undefined && !idsNuevos.has(b.id));

      // 2. Crear los nuevos (no tienen ID)
      const bloquesACrear = bloquesNuevos.filter(b => b.id === undefined);

      // 3. Actualizar los existentes (tienen ID)
      const bloquesAActualizar = bloquesNuevos.filter(b => b.id !== undefined);

      const deletePromises = bloquesAEliminar.map(b => horariosService.deleteHorario(b.id!));

      const createPromises = bloquesACrear.map(b => horariosService.createHorario({
        barberoId: barberoIdNum,
        dia: b.dia,
        horaInicio: b.horaInicio,
        horaFin: b.horaFin,
        estado: true
      }));

      const updatePromises = bloquesAActualizar.map(b => horariosService.updateHorario(b.id!, {
        id: b.id,
        barberoId: barberoIdNum,
        dia: b.dia,
        horaInicio: b.horaInicio,
        horaFin: b.horaFin,
        estado: true
      }));

      await Promise.all([...deletePromises, ...createPromises, ...updatePromises]);

      setEditingHorario(null);
      resetFormulario();
      setIsDialogOpen(false);
      setIsEditDialogOpen(false);
      await loadData();

      success("¡Horario actualizado!", "Los cambios han sido guardados exitosamente.");
    } catch (err) {
      console.error(err);
      error("Error", "Ocurrió un error al actualizar los horarios.");
    }
  };

  const handleDeleteHorario = (horario: HorarioSemanal) => {
    setHorarioToDelete(horario);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (horarioToDelete) {
      try {
        const promises = horarioToDelete.bloques.map(b =>
          b.id ? horariosService.deleteHorario(b.id) : Promise.resolve()
        );
        await Promise.all(promises);

        setIsDeleteDialogOpen(false);
        setHorarioToDelete(null);
        await loadData();
        success("¡Horario eliminado!", `El horario de ${horarioToDelete.barbero} ha sido eliminado.`);
      } catch (err) {
        console.error(err);
        error("Error", "No se pudo eliminar el horario.");
      }
    }
  };

  const toggleEstadoHorario = async (horario: HorarioSemanal) => {
    try {
      setTogglingId(horario.id);
      const nuevoEstado = !horario.activo;
      const promises = horario.bloques.map(b => {
        if (!b.id) return Promise.resolve();
        return horariosService.updateHorario(b.id, {
          id: b.id,
          barberoId: horario.barberoId,
          dia: b.dia,
          horaInicio: b.horaInicio,
          horaFin: b.horaFin,
          estado: nuevoEstado
        });
      });
      await Promise.all(promises);
      await loadData();
      success("Estado actualizado", `El horario de ${horario.barbero} ahora está ${nuevoEstado ? 'activo' : 'inactivo'}`);
    } catch (err) {
      console.error(err);
      error("Error", "No se pudo cambiar el estado.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleViewDetail = (horario: HorarioSemanal) => {
    setSelectedHorario(horario);
    setIsDetailDialogOpen(true);
  };


  // Obtener resumen de días del horario
  const getDiasResumen = (bloques: BloqueHorario[]) => {
    const diasUnicos = [...new Set(bloques.map((b) => b.dia))];
    if (diasUnicos.length <= 3) {
      return diasUnicos.join(", ");
    }
    return `${diasUnicos.slice(0, 2).join(", ")} +${diasUnicos.length - 2} más`;
  };

  // Ordenar bloques por día de la semana
  const ordenarBloques = (bloques: BloqueHorario[]) => {
    const ordenDias: { [key: string]: number } = {
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
      Domingo: 7,
    };
    return [...bloques].sort((a, b) => {
      const ordenA = ordenDias[a.dia] || 0;
      const ordenB = ordenDias[b.dia] || 0;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">
              Horarios de Barbería
            </h1>
            <p className="text-sm text-gray-lightest mt-1">
              Gestiona los horarios semanales del personal
            </p>
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
                      setEditingHorario(null);
                      resetFormulario();
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Horario
                  </button>
                </DialogTrigger>
              </Dialog>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
                <Input
                  placeholder="Buscar barbero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="elegante-input pl-11 w-80"
                />
              </div>

              <select
                value={filterBarbero}
                onChange={(e) => setFilterBarbero(e.target.value)}
                className="elegante-input"
              >
                <option value="all">Todos los barberos</option>
                {barberos.map((barbero) => (
                  <option key={barbero.id} value={barbero.id}>
                    {barbero.nombre} {barbero.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-lightest">
                Mostrando {displayedHorarios.length} de {filteredHorarios.length} registros
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-lightest">Cargando horarios de barberos...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-dark">
                    <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">
                      Documento
                    </th>
                    <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">
                      Barbero
                    </th>
                    <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">
                      Días
                    </th>
                    <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">
                      Horas
                    </th>
                    <th className="text-left py-3 px-4 text-white-primary font-bold text-sm">
                      Bloques
                    </th>
                    <th className="text-right py-3 px-4 text-white-primary font-bold text-sm">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHorarios.map((horario) => (
                    <tr
                      key={horario.id}
                      className="border-b border-gray-dark hover:bg-gray-darker transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="text-gray-lighter">
                          {horario.tipoDocumento} {horario.documento || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-dark border-2 border-gray-medium flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-lightest" />
                          </div>
                          <span className="text-gray-lighter">
                            {horario.barbero}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-lighter">
                          {getDiasResumen(horario.bloques)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-lighter text-sm">
                          {horario.bloques.length > 0 && (
                            <div className="text-gray-lighter">
                              {horario.bloques[0].horaInicio} - {horario.bloques[0].horaFin}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded bg-gray-medium text-gray-lighter text-sm">
                          {horario.bloques.length} bloque{horario.bloques.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(horario)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4 text-gray-lightest group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={() => toggleEstadoHorario(horario)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title={horario.activo ? "Desactivar" : "Activar"}
                            disabled={togglingId === horario.id}
                          >
                            {togglingId === horario.id ? (
                              <Loader2 className="w-4 h-4 text-orange-primary animate-spin" />
                            ) : horario.activo ? (
                              <ToggleRight className="w-4 h-4 text-gray-lightest group-hover:text-green-400" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditHorario(horario)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-gray-lightest group-hover:text-orange-primary" />
                          </button>
                          <button
                            onClick={() => handleDeleteHorario(horario)}
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
            )}

            {!loading && displayedHorarios.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-gray-medium mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white-primary mb-2">
                  No se encontraron horarios
                </h3>
                <p className="text-gray-lightest">
                  No hay horarios asignados o intenta con otros filtros.
                </p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-dark">
              <div className="text-sm text-gray-lightest">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-lightest" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-lightest" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dialog de Creación/Edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-dark">
            <DialogTitle className="text-white-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-primary" />
              {editingHorario ? "Editar Horario" : "Nuevo Horario"}
            </DialogTitle>
            <DialogDescription className="text-gray-lightest mt-1.5">
              {editingHorario
                ? "Modifica la información del horario"
                : "Crea un horario semanal agregando bloques de día y hora"}
            </DialogDescription>
          </DialogHeader>


          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda: Barbero + Agregar Bloque */}
              <div className="space-y-4">
                {/* Barbero */}
                <div className="space-y-1.5">
                  <Label className="text-gray-lightest text-sm">Barbero *</Label>
                  <select
                    value={nuevoHorario.barberoId}
                    onChange={(e) =>
                      setNuevoHorario({ ...nuevoHorario, barberoId: e.target.value })
                    }
                    className="elegante-input p-2.5 w-full"
                    disabled={!!editingHorario}
                  >
                    <option value="">Seleccionar barbero</option>
                    {barberos.map((barbero) => (
                      <option key={barbero.id} value={barbero.id}>
                        {barbero.nombre} {barbero.apellido}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agregar Bloque */}
                <div className="bg-gray-darker rounded-lg p-4 border border-gray-dark">
                  <h3 className="text-white-primary font-medium mb-3 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-orange-primary" />
                    Agregar Bloque de Horario
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-gray-lightest text-sm">Día</Label>
                      <select
                        value={nuevoBloque.dia}
                        onChange={(e) => setNuevoBloque({ ...nuevoBloque, dia: e.target.value })}
                        className="elegante-input p-2.5 w-full"
                      >
                        <option value="">Seleccionar día</option>
                        {diasSemana.map((dia) => (
                          <option key={dia} value={dia}>
                            {dia}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-gray-lightest text-sm">Hora inicio</Label>
                        <Input
                          type="time"
                          value={nuevoBloque.horaInicio}
                          onChange={(e) =>
                            setNuevoBloque({ ...nuevoBloque, horaInicio: e.target.value })
                          }
                          className="elegante-input p-2.5"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-lightest text-sm">Hora fin</Label>
                        <Input
                          type="time"
                          value={nuevoBloque.horaFin}
                          onChange={(e) =>
                            setNuevoBloque({ ...nuevoBloque, horaFin: e.target.value })
                          }
                          className="elegante-input p-2.5"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAgregarBloque}
                      className="w-full elegante-button-primary py-2 flex items-center justify-center gap-2 text-sm"
                      disabled={!nuevoBloque.dia || !nuevoBloque.horaInicio || !nuevoBloque.horaFin}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Bloque
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Bloques Agregados */}
              <div className="space-y-4">
                <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white-primary font-medium flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-primary" />
                      Bloques Agregados
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-orange-primary/20 text-orange-primary text-xs font-medium">
                      {nuevoHorario.bloques.length}
                    </span>
                  </div>

                  {nuevoHorario.bloques.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-dark rounded-lg">
                      <Calendar className="w-8 h-8 text-gray-medium mx-auto mb-2" />
                      <p className="text-gray-lightest text-sm">Sin bloques</p>
                      <p className="text-gray-medium text-xs mt-1">
                        Agrega bloques de día y hora
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {ordenarBloques(nuevoHorario.bloques).map((bloque, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-gray-darkest border border-gray-dark"
                        >
                          <div className="flex items-center gap-2" style={{ padding: "1rem" }}>
                            <div className="w-7 h-7 rounded bg-orange-primary/20 flex items-center justify-center">
                              <Calendar className="w-3.5 h-3.5 text-orange-primary" />
                            </div>
                            <div>
                              <p className="text-white-primary font-semibold text-base">
                                {bloque.dia}
                              </p>
                              <p className="text-gray-lightest text-xs">
                                {bloque.horaInicio} - {bloque.horaFin}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEliminarBloque(nuevoHorario.bloques.indexOf(bloque))}
                            className="p-1.5 rounded hover:bg-red-600/20 transition-colors group" style={{ padding: "1rem" }}
                            title="Eliminar bloque"
                          >
                            <X className="w-4 h-4 text-gray-lightest group-hover:text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-dark">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-medium hover:bg-gray-dark border border-gray-dark text-white-primary transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={editingHorario ? handleUpdateHorario : handleCreateHorario}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={!nuevoHorario.barberoId || nuevoHorario.bloques.length === 0}
            >
              <Clock className="w-4 h-4" />
              {editingHorario ? "Actualizar" : "Crear"} Horario
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialogs */}
      <AlertDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <AlertDialogContent className="bg-gray-darkest border-gray-dark">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              ¿Crear horario?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-lightest">
              Se creará <span className="font-semibold text-orange-primary">1 registro</span> de
              horario para{" "}
              <span className="font-semibold text-white-primary">
                {barberos.find(b => b.id.toString() === nuevoHorario.barberoId)?.nombre || 'Barbero'}
              </span> con{" "}
              <span className="font-semibold text-orange-primary">
                {nuevoHorario.bloques.length} bloque{nuevoHorario.bloques.length !== 1 ? "s" : ""}
              </span>{" "}
              de horario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsCreateDialogOpen(false)}
              className="elegante-button-secondary"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreateHorario} className="elegante-button-primary">
              Crear Horario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent className="bg-gray-darkest border-gray-dark">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              ¿Guardar cambios?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-lightest">
              Se actualizará el horario de{" "}
              <span className="font-semibold text-white-primary">
                {barberos.find(b => b.id.toString() === nuevoHorario.barberoId)?.nombre || 'Barbero'}
              </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsEditDialogOpen(false)}
              className="elegante-button-secondary"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmEditHorario} className="elegante-button-primary">
              Guardar Cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-darkest border-gray-dark">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              ¿Eliminar Horario?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-lightest">
              Se eliminará permanentemente el horario de{" "}
              <span className="font-semibold text-white-primary">{horarioToDelete?.barbero}</span>{" "}
              con todos sus bloques.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteDialogOpen(false)}
              className="elegante-button-secondary"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Eliminar Horario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Ver Detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white-primary text-xl flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Detalles del Horario
            </DialogTitle>
          </DialogHeader>

          {selectedHorario && (
            <div className="py-4 space-y-4">
              {/* Info Principal */}
              <div className="bg-gray-darker rounded-lg p-4 border border-gray-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-dark border-2 border-gray-medium flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-lightest" />
                    </div>
                  <div className="flex-1">
                    <h3 className="text-white-primary font-semibold text-lg">
                      {selectedHorario.barbero}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedHorario.activo
                        ? "bg-green-600/20 text-green-400"
                        : "bg-red-600/20 text-red-400"
                        }`}
                    >
                      {selectedHorario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloques de Horario */}
              <div className="bg-gray-darker rounded-lg p-4 border border-gray-dark">
                <h4 className="text-white-primary font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-primary" />
                  Bloques de Horario ({selectedHorario.bloques.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ordenarBloques(selectedHorario.bloques).map(
                    (bloque: BloqueHorario, index: number) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-gray-darkest border border-gray-dark"
                      >
                        <p className="text-white-primary font-medium">{bloque.dia}</p>
                        <p className="text-orange-primary text-sm">
                          {bloque.horaInicio} - {bloque.horaFin}
                        </p>
                      </div>
                    )
                  )
                  }
                </div>
              </div>

              {/* Notas */}
              {selectedHorario.notas && (
                <div className="bg-gray-darker rounded-lg p-4 border border-gray-dark">
                  <h4 className="text-white-primary font-medium mb-2">Notas</h4>
                  <p className="text-gray-lightest text-sm">{selectedHorario.notas}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertContainer />
    </>
  );
}
