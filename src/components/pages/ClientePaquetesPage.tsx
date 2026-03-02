import { useState, useEffect } from "react";
import { Search, Star, Clock, Package, Scissors, Calendar, Check } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { toast } from "sonner";
import { apiService, Paquete } from "../../services/api";

// Función para formatear moneda colombiana
const formatCurrency = (amount: number): string => {
  return amount?.toLocaleString('es-CO') || '0';
};

export function ClientePaquetesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaquete, setSelectedPaquete] = useState<Paquete | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaquetes = async () => {
      try {
        setLoading(true);
        const data = await apiService.getPaquetes();
        // Filtrar solo paquetes activos para clientes
        setPaquetes(data.filter(p => p.activo));
      } catch (error) {
        toast.error("Error cargando paquetes");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaquetes();
  }, []);

  const filteredPaquetes = paquetes.filter(paquete => {
    const matchesSearch = paquete.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paquete.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (paquete: Paquete) => {
    setSelectedPaquete(paquete);
    setIsDetailDialogOpen(true);
  };

  const handleReservarPaquete = (paquete: Paquete) => {
    toast.success("¡Paquete seleccionado!", {
      description: `El paquete "${paquete.nombre}" ha sido añadido a tu reserva. Serás redirigido para agendar la cita.`
    });
    setIsDetailDialogOpen(false);
    // Aquí iría la lógica de redirección o apertura del modal de cita
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "Básico": return "bg-blue-600 text-white";
      case "Premium": return "bg-orange-primary text-black-primary";
      case "Ejecutivo": return "bg-purple-600 text-white";
      case "Estudiante": return "bg-green-600 text-white";
      case "Especial": return "bg-red-600 text-white";
      default: return "bg-gray-medium text-white";
    }
  };

  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-orange-primary text-orange-primary" : "text-gray-medium"
              }`}
          />
        ))}
        <span className="text-gray-lightest text-sm ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="bg-black-primary border-b border-gray-dark px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white-primary">Paquetes de Servicios</h1>
            <p className="text-sm text-gray-lightest mt-1">Descubre nuestros paquetes especiales con precios preferenciales</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Filtros */}
        <div className="elegante-card mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-lightest w-4 h-4" />
            <Input
              placeholder="Buscar paquetes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="elegante-input pl-10"
            />
          </div>
        </div>

        {/* Grid de Paquetes */}
        {loading ? (
          <div className="text-center py-12 text-white-primary">Cargando paquetes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPaquetes.map((paquete) => {
              const precioOriginal = paquete.precioOriginal || paquete.precio;
              const ahorro = precioOriginal - paquete.precio;
              const serviciosList = paquete.servicios || [];
              const duracion = paquete.duracion || 0;
              const categoria = paquete.categoria || 'General';

              return (
                <div key={paquete.id} className="elegante-card relative">
                  {/* Contenido del paquete */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white-primary">{paquete.nombre}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoriaColor(categoria)}`}>
                        {categoria}
                      </span>
                    </div>
                    <p className="text-gray-lightest text-sm mb-3 min-h-[40px]">{paquete.descripcion}</p>
                    {renderStars(5)}
                  </div>

                  {/* Servicios principales */}
                  <div className="mb-4">
                    <h4 className="text-white-primary font-medium text-sm mb-2">Incluye:</h4>
                    <div className="space-y-1">
                      {serviciosList.slice(0, 3).map((servicio, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Check className="w-3 h-3 text-green-400" />
                          <span className="text-gray-lightest">{servicio}</span>
                        </div>
                      ))}
                      {serviciosList.length > 3 && (
                        <div className="text-orange-primary text-xs font-medium">
                          +{serviciosList.length - 3} servicios más
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="flex items-center justify-between text-xs text-gray-lightest mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{duracion} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      <span>{serviciosList.length} servicios</span>
                    </div>
                  </div>

                  {/* Precios */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-primary font-bold text-xl">
                        ${formatCurrency(paquete.precio)}
                      </span>
                      {ahorro > 0 && (
                        <span className="text-gray-lightest line-through text-sm">
                          ${formatCurrency(precioOriginal)}
                        </span>
                      )}
                    </div>
                    {ahorro > 0 && (
                      <div className="text-green-400 text-sm font-medium">
                        Ahorras ${formatCurrency(ahorro)}
                      </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(paquete)}
                      className="elegante-button-secondary flex-1 text-sm py-2"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => handleReservarPaquete(paquete)}
                      className="elegante-button-primary flex-1 text-sm py-2"
                      disabled={!paquete.activo}
                    >
                      {paquete.activo ? "Reservar" : "No Disponible"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && filteredPaquetes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-lightest mb-4">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron paquetes que coincidan con tu búsqueda.</p>
            </div>
          </div>
        )}

        {/* Modal de Detalles */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl bg-gray-darkest border-gray-dark">
            {selectedPaquete && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white-primary text-xl">
                    {selectedPaquete.nombre}
                  </DialogTitle>
                  <DialogDescription className="text-gray-lightest">
                    Detalles completos del paquete de servicios
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Descripción y Rating */}
                  <div>
                    <p className="text-gray-lightest mb-3">{selectedPaquete.descripcion}</p>
                    {renderStars(5)}
                  </div>

                  {/* Información del precio */}
                  <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-lightest">Precio del paquete:</span>
                      <span className="text-orange-primary font-bold text-xl">
                        ${formatCurrency(selectedPaquete.precio)}
                      </span>
                    </div>
                    {((selectedPaquete.precioOriginal || 0) > selectedPaquete.precio) && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-lightest">Precio individual:</span>
                        <span className="text-gray-lightest line-through">
                          ${formatCurrency(selectedPaquete.precioOriginal || 0)}
                        </span>
                      </div>
                    )}
                    {((selectedPaquete.precioOriginal || 0) > selectedPaquete.precio) && (
                      <div className="flex items-center justify-between text-green-400 font-medium">
                        <span>Tu ahorro:</span>
                        <span>${formatCurrency((selectedPaquete.precioOriginal || 0) - selectedPaquete.precio)}</span>
                      </div>
                    )}
                  </div>

                  {/* Servicios incluidos */}
                  <div>
                    <h4 className="text-white-primary font-semibold mb-3 flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-orange-primary" />
                      Servicios Incluidos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(selectedPaquete.servicios || []).map((servicio: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-darker rounded-lg">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-white-primary text-sm">{servicio}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                    <h4 className="text-white-primary font-semibold mb-3">Información Adicional</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-primary" />
                        <span className="text-gray-lightest">Duración: {selectedPaquete.duracion} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-primary" />
                        <span className="text-gray-lightest">Disponible para reservar</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4 border-t border-gray-dark">
                    <Button
                      onClick={() => setIsDetailDialogOpen(false)}
                      className="elegante-button-secondary flex-1"
                    >
                      Cerrar
                    </Button>
                    <Button
                      onClick={() => handleReservarPaquete(selectedPaquete)}
                      className="elegante-button-primary flex-1"
                      disabled={!selectedPaquete.activo}
                    >
                      {selectedPaquete.activo ? "Reservar Paquete" : "No Disponible"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}