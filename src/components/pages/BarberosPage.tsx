import React, { useRef, useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import {
  Users, Plus, Edit, Trash2, Mail, Phone, Calendar,
  Search, Filter, UserCheck, UserX, Eye, ChevronLeft,
  ChevronRight, Lock, EyeOff, Scissors, Star,
  TrendingUp, TrendingDown, Target, Award, Crown, Medal,
  MapPin, CreditCard, Home, Camera,
  Upload, ToggleRight, ToggleLeft, X, Loader2
} from "lucide-react";
import { useCustomAlert } from "../ui/custom-alert";
import { barberosService, Barbero, CreateBarberoData } from "../../services/barberosService";
import ImageRenderer from "../ui/ImageRenderer";
import { apiService } from "../../services/api";

const tiposDocumento = ["Cédula", "Cédula de Extranjería", "Pasaporte"];
const BARBERO_LIMITS = {
  nombre: 100,
  apellido: 100,
  documento: 20,
  correo: 100,
  telefono: 20,
  especialidad: 100
};

export function BarberosPage() {
  const { success: successAlert, error: errorAlert, AlertContainer } = useCustomAlert();
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBarbero, setEditingBarbero] = useState<Barbero | null>(null);
  const [selectedBarbero, setSelectedBarbero] = useState<Barbero | null>(null);
  const [barberoToDelete, setBarberoToDelete] = useState<Barbero | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [newBarbero, setNewBarbero] = useState<CreateBarberoData>({
    nombre: '',
    apellido: '',
    tipoDocumento: '',
    documento: '',
    correo: '',
    telefono: '',
    direccion: '',
    barrio: '',
    fechaNacimiento: '',
    rol: 'Barbero',
    status: 'active',
    fotoPerfil: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showBarberoFormErrors, setShowBarberoFormErrors] = useState(false);

  // Cargar barberos desde la API al montar el componente
  useEffect(() => {
    loadBarberos();
  }, []);

  const loadBarberos = async () => {
    try {
      setLoading(true);
      const data = await barberosService.getBarberos();
      const mappedData = data.map((barbero: any) => barberosService.mapApiToComponent(barbero));
      setBarberos(mappedData);
    } catch (err: unknown) {
      console.error('Error cargando barberos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      errorAlert("Error", `No se pudieron cargar los barberos: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtros de barbero
  const filteredBarberos = barberos.filter(barbero => {
    const searchMatch = (barbero.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (barbero.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (barbero.correo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (barbero.documento || '').includes(searchTerm);

    const statusMatch = filterStatus === "all" ||
      (filterStatus === "active" && barbero.status === 'active') ||
      (filterStatus === "inactive" && barbero.status === 'inactive');

    return searchMatch && statusMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBarberos.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedBarberos = filteredBarberos.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setNewBarbero({
      nombre: '', apellido: '', tipoDocumento: '', documento: '', correo: '', telefono: '',
      direccion: '', barrio: '', fechaNacimiento: '', rol: 'Barbero', status: 'active', fotoPerfil: ''
    });
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewBarbero((prev) => ({ ...prev, fotoPerfil: result }));
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const imageUrl = await apiService.uploadImage(file);
      setNewBarbero((prev) => ({ ...prev, fotoPerfil: imageUrl }));
    } catch (err: any) {
      console.error('Error uploading image:', err);
      errorAlert('Error al subir imagen', 'No se pudo subir la imagen al servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const removeProfileImage = () => {
    setNewBarbero((prev) => ({ ...prev, fotoPerfil: '' }));
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateBarbero = async () => {
    setShowBarberoFormErrors(true);
    if (!newBarbero.nombre || !newBarbero.apellido || !newBarbero.tipoDocumento || !newBarbero.documento || !newBarbero.correo || !newBarbero.telefono) {
      errorAlert("Campos obligatorios faltantes", "Por favor completa todos los campos obligatorios: nombre, apellido, documento, correo y teléfono.");
      return;
    }

    try {
      const createdBarbero = await barberosService.createBarbero(newBarbero);
      const mappedBarbero = barberosService.mapApiToComponent(createdBarbero);
      setBarberos([mappedBarbero, ...barberos]);
      resetForm();
      setIsDialogOpen(false);
      successAlert("¡Barbero creado exitosamente!", `El barbero "${mappedBarbero.nombre} ${mappedBarbero.apellido}" ha sido registrado en el sistema.`);
    } catch (err: unknown) {
      console.error('Error creando barbero:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      errorAlert("Error", `No se pudo crear el barbero: ${errorMessage}`);
    }
  };

  const handleEditBarbero = (barbero: Barbero) => {
    setEditingBarbero(barbero);
    setNewBarbero({
      nombre: barbero.nombre || '',
      apellido: barbero.apellido || '',
      tipoDocumento: barbero.tipoDocumento || '',
      documento: barbero.documento || '',
      correo: barbero.correo || '',
      telefono: barbero.telefono || '',
      direccion: barbero.direccion || '',
      barrio: barbero.barrio || '',
      fechaNacimiento: barbero.fechaNacimiento || '',
      rol: barbero.rol || 'Barbero',
      status: barbero.status || 'active',
      fotoPerfil: barbero.fotoPerfil || ''
    });
    setPreviewUrl(barbero.fotoPerfil || '');
    setShowBarberoFormErrors(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsDialogOpen(true);
  };

  const handleUpdateBarbero = async () => {
    setShowBarberoFormErrors(true);
    if (!editingBarbero || !newBarbero.nombre || !newBarbero.apellido || !newBarbero.tipoDocumento || !newBarbero.documento || !newBarbero.correo || !newBarbero.telefono) {
      errorAlert("Campos obligatorios faltantes", "Por favor completa todos los campos obligatorios: nombre, apellido, documento, correo y teléfono.");
      return;
    }

    try {
      // Mapear datos del componente a la API
      const apiData = barberosService.mapComponentToApi({
        ...newBarbero,
        id: editingBarbero.id
      });

      const updatedBarbero = await barberosService.updateBarbero(editingBarbero.id, apiData);
      const mappedBarbero = barberosService.mapApiToComponent(updatedBarbero);

      setBarberos(barberos.map(b => b.id === editingBarbero.id ? mappedBarbero : b));
      resetForm();
      setIsDialogOpen(false);
      setEditingBarbero(null);
      successAlert("Barbero actualizado", `Los datos de ${mappedBarbero.nombre} han sido actualizados exitosamente.`);
    } catch (err: unknown) {
      console.error('Error actualizando barbero:', err);
      errorAlert("Error", "No se pudo actualizar el barbero. Por favor intenta nuevamente.");
    }
  };

  const handleDeleteBarbero = (id: number) => {
    const barbero = barberos.find(b => b.id === id);
    if (barbero) {
      setBarberoToDelete(barbero);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteBarbero = async () => {
    if (!barberoToDelete) return;

    try {
      await barberosService.deleteBarbero(barberoToDelete.id);
      setBarberos(barberos.filter(b => b.id !== barberoToDelete.id));
      setIsDeleteDialogOpen(false);
      setBarberoToDelete(null);
      successAlert("Barbero eliminado", `El barbero ${barberoToDelete.nombre} ${barberoToDelete.apellido} ha sido eliminado del sistema.`);
    } catch (err: unknown) {
      console.error('Error eliminando barbero:', err);
      errorAlert("Error", "No se pudo eliminar el barbero. Por favor intenta nuevamente.");
    }
  };

  const toggleBarberoStatus = async (id: number) => {
    const barbero = barberos.find(b => b.id === id);
    if (!barbero) return;

    const newStatus = barbero.status === 'active' ? 'inactive' : 'active';
    const newEstado = newStatus === 'active';

    try {
      await barberosService.updateBarberoStatus(id, newEstado);
      setBarberos(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, estado: newEstado } : b));
      successAlert(newStatus === 'active' ? "Barbero activado" : "Barbero desactivado",
        `${barbero.nombre} ahora está ${newStatus === 'active' ? "activo" : "inactivo"}`);
    } catch (err: unknown) {
      console.error('Error cambiando estado:', err);
      errorAlert("Error", "No se pudo cambiar el estado del barbero.");
    }
  };

  return (
    <>
      <AlertContainer />
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Gestión de Barberos</h1>
            <p className="text-sm text-gray-lightest mt-1">Administra el personal de la barbería</p>
          </div>

        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        <div className="elegante-card">

          <div className="flex flex-wrap   gap-4 mb-6 pb-6 border-b border-gray-dark">
            <button
              onClick={() => {
                setEditingBarbero(null);
                resetForm();
                setIsDialogOpen(true);
              }}
              className="elegante-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Nuevo Barbero
            </button>
            <div className="relative flex-1 max-w-md mt-2">

              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-lightest w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, correo o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="elegante-input pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-lightest" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="elegante-input py-2"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-dark">
                  <th className="py-4 px-4 text-gray-lightest font-medium">Documento</th>
                  <th className="py-4 px-4 text-gray-lightest font-medium">Barbero</th>
                  <th className="py-4 px-4 text-gray-lightest font-medium">Contacto</th>
                  <th className="py-4 px-4 text-gray-lightest font-medium">Especialidad</th>
                  <th className="py-4 px-4 text-gray-lightest font-medium">Estado</th>
                  <th className="py-4 px-4 text-gray-lightest font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-orange-primary animate-spin" />
                        <p className="text-gray-lightest">Cargando barberos...</p>
                      </div>
                    </td>
                  </tr>
                ) : displayedBarberos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-gray-dark" />
                        <p className="text-gray-lightest">No se encontraron barberos</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedBarberos.map(barbero => (
                    <tr key={barbero.id} className="border-b border-gray-dark hover:bg-gray-darker transition-colors">
                      <td className="py-4 px-4 text-gray-lighter">
                        {barbero.tipoDocumento} {barbero.documento}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <ImageRenderer
                            url={barbero.fotoPerfil}
                            alt={`Foto de ${barbero.nombre}`}
                            className="w-10 h-10 rounded-full border-2 border-orange-primary shadow-sm"
                          />
                          <span className="text-gray-lighter">{barbero.nombre} {barbero.apellido}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-gray-lighter text-sm">{barbero.correo}</span>
                          <span className="text-gray-lightest text-xs">{barbero.telefono}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-dark text-orange-primary border border-orange-primary/20">
                          {barbero.especialidad || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${barbero.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                          {barbero.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBarbero(barbero);
                              setIsDetailDialogOpen(true);
                            }}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-gray-lightest group-hover:text-orange-primary" />
                          </button>
                          <button
                            onClick={() => handleEditBarbero(barbero)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-gray-lightest group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={() => toggleBarberoStatus(barbero.id)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title={barbero.status === 'active' ? 'Desactivar' : 'Activar'}
                          >
                            {barbero.status === 'active' ? (
                              <ToggleRight className="w-4 h-4 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-red-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteBarbero(barbero.id)}
                            className="p-2 hover:bg-gray-darker rounded-lg transition-colors group"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-gray-lightest group-hover:text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-dark text-sm">
            <p className="text-gray-lightest">
              Mostrando {displayedBarberos.length} de {filteredBarberos.length} barberos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-lightest" />
              </button>
              <span className="text-white-primary px-4">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-dark hover:bg-gray-darker disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-lightest" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogo de Creación/Edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-2xl text-white-primary">
          <DialogHeader>
            <DialogTitle>
              {editingBarbero ? 'Editar Barbero' : 'Nuevo Barbero'}
            </DialogTitle>
            <DialogDescription className="text-gray-lightest">
              {editingBarbero ? 'Actualiza la información del barbero' : 'Ingresa los datos del nuevo barbero para el sistema'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ImageRenderer url={previewUrl} className="h-20 w-20 rounded-full" />
                  {previewUrl && (
                    <button
                      onClick={removeProfileImage}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={triggerFileSelect}
                  className="elegante-button-secondary text-xs"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Cambiar Foto
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newBarbero.nombre}
                onChange={(e) => setNewBarbero({ ...newBarbero, nombre: e.target.value })}
                maxLength={BARBERO_LIMITS.nombre}
                className={`elegante-input ${showBarberoFormErrors && !newBarbero.nombre.trim() ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {showBarberoFormErrors && !newBarbero.nombre.trim() && <p className="text-xs text-red-400">Este campo es obligatorio.</p>}
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                value={newBarbero.apellido}
                onChange={(e) => setNewBarbero({ ...newBarbero, apellido: e.target.value })}
                maxLength={BARBERO_LIMITS.apellido}
                className={`elegante-input ${showBarberoFormErrors && !newBarbero.apellido.trim() ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {showBarberoFormErrors && !newBarbero.apellido.trim() && <p className="text-xs text-red-400">Este campo es obligatorio.</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <select
                value={newBarbero.tipoDocumento}
                onChange={(e) => setNewBarbero({ ...newBarbero, tipoDocumento: e.target.value })}
                className={`elegante-input w-full ${showBarberoFormErrors && !newBarbero.tipoDocumento ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              >
                <option value="">Seleccionar...</option>
                {tiposDocumento.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
              {showBarberoFormErrors && !newBarbero.tipoDocumento && <p className="text-xs text-red-400">Este campo es obligatorio.</p>}
            </div>
            <div className="space-y-2">
              <Label>Documento</Label>
              <Input
                value={newBarbero.documento}
                onChange={(e) => setNewBarbero({ ...newBarbero, documento: e.target.value })}
                maxLength={BARBERO_LIMITS.documento}
                className={`elegante-input ${showBarberoFormErrors && !newBarbero.documento.trim() ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {showBarberoFormErrors && !newBarbero.documento.trim() && <p className="text-xs text-red-400">Este campo es obligatorio.</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Correo Electrónico</Label>
              <Input
                type="email"
                value={newBarbero.correo}
                onChange={(e) => setNewBarbero({ ...newBarbero, correo: e.target.value })}
                maxLength={BARBERO_LIMITS.correo}
                className={`elegante-input ${showBarberoFormErrors && !newBarbero.correo.trim() ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {showBarberoFormErrors && !newBarbero.correo.trim() && <p className="text-xs text-red-400">Este campo es obligatorio.</p>}
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={newBarbero.telefono}
                onChange={(e) => setNewBarbero({ ...newBarbero, telefono: e.target.value })}
                maxLength={BARBERO_LIMITS.telefono}
                className={`elegante-input ${showBarberoFormErrors && !newBarbero.telefono.trim() ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {showBarberoFormErrors && !newBarbero.telefono.trim() && <p className="text-xs text-red-400">Este campo es obligatorio.</p>}
            </div>
            <div className="space-y-2">
              <Label>Especialidad</Label>
              <Input
                value={newBarbero.especialidad}
                onChange={(e) => setNewBarbero({ ...newBarbero, especialidad: e.target.value })}
                maxLength={BARBERO_LIMITS.especialidad}
                className="elegante-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => {
              setShowBarberoFormErrors(false);
              setIsDialogOpen(false);
            }} className="elegante-button-secondary">
              Cancelar
            </button>
            <button
              onClick={editingBarbero ? handleUpdateBarbero : handleCreateBarbero}
              className="elegante-button-primary"
            >
              {editingBarbero ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Detalles */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-2xl text-white-primary">
          <DialogHeader>
            <DialogTitle>Detalles del Barbero</DialogTitle>
          </DialogHeader>
          {selectedBarbero && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-6 p-4 bg-gray-darker rounded-lg border border-gray-dark">
                <ImageRenderer url={selectedBarbero.fotoPerfil} className="h-24 w-24 rounded-full border-2 border-orange-primary" />
                <div>
                  <h3 className="text-2xl font-bold text-white-primary">{selectedBarbero.nombre} {selectedBarbero.apellido}</h3>
                  <p className="text-orange-primary font-medium">{selectedBarbero.especialidad || 'General'}</p>
                  <p className="text-gray-lightest text-sm mt-1">ID Sistema: {selectedBarbero.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-2">
                <div>
                  <Label className="text-gray-lightest text-xs uppercase tracking-wider">Documento</Label>
                  <p className="text-white-primary py-1 border-b border-gray-dark">{selectedBarbero.tipoDocumento} {selectedBarbero.documento}</p>
                </div>
                <div>
                  <Label className="text-gray-lightest text-xs uppercase tracking-wider">Estado</Label>
                  <p className={`py-1 border-b border-gray-dark ${selectedBarbero.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedBarbero.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-lightest text-xs uppercase tracking-wider">Correo</Label>
                  <p className="text-white-primary py-1 border-b border-gray-dark">{selectedBarbero.correo}</p>
                </div>
                <div>
                  <Label className="text-gray-lightest text-xs uppercase tracking-wider">Teléfono</Label>
                  <p className="text-white-primary py-1 border-b border-gray-dark">{selectedBarbero.telefono}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-lightest text-xs uppercase tracking-wider">Dirección</Label>
                  <p className="text-white-primary py-1 border-b border-gray-dark">{selectedBarbero.direccion || 'No especificada'} {selectedBarbero.barrio ? ` - ${selectedBarbero.barrio}` : ''}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button onClick={() => setIsDetailDialogOpen(false)} className="elegante-button-primary px-8">
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerta de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-darkest border-gray-dark">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white-primary text-xl">¿Eliminar barbero?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-lightest font-medium">
              Esta acción eliminará permanentemente al barbero <span className="text-orange-primary">"{barberoToDelete?.nombre} {barberoToDelete?.apellido}"</span> y todo su historial asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-transparent border-gray-dark text-white-primary hover:bg-gray-darker">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBarbero}
              className="bg-red-600 text-white hover:bg-red-700 font-semibold"
            >
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
