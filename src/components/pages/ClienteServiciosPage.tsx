import { useState } from "react";
import { Search, Star, Clock, DollarSign, Scissors, Check, Calendar, Sparkles, Award } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { toast } from "sonner@2.0.3";

// Función para formatear moneda colombiana
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

// Datos de servicios disponibles
const serviciosDisponibles = [
  {
    id: "SRV001",
    nombre: "Corte Caballero",
    descripcion: "Corte clásico masculino con tijera y máquina, incluye lavado y estilizado profesional",
    precio: 35000,
    duracion: 30,
    popularidad: 4.5,
    categoria: "Cortes",
    beneficios: [
      "Corte personalizado según tu estilo",
      "Lavado con productos premium",
      "Estilizado profesional",
      "Asesoría de estilo incluida"
    ],
    disponible: true,
    popular: true,
    recomendado: false
  },
  {
    id: "SRV002",
    nombre: "Corte + Barba",
    descripcion: "Servicio completo que incluye corte de cabello y arreglo profesional de barba y bigote",
    precio: 55000,
    duracion: 60,
    popularidad: 4.8,
    categoria: "Cortes",
    beneficios: [
      "Corte de cabello premium",
      "Perfilado y arreglo de barba",
      "Hidratación de barba",
      "Productos de acabado incluidos"
    ],
    disponible: true,
    popular: true,
    recomendado: true
  },
  {
    id: "SRV003",
    nombre: "Afeitado Clásico",
    descripcion: "Afeitado tradicional con navaja y toalla caliente al estilo barbería antigua",
    precio: 30000,
    duracion: 30,
    popularidad: 4.6,
    categoria: "Afeitado",
    beneficios: [
      "Afeitado con navaja profesional",
      "Toalla caliente relajante",
      "Loción post-afeitado premium",
      "Masaje facial incluido"
    ],
    disponible: true,
    popular: false,
    recomendado: false
  },
  {
    id: "SRV004",
    nombre: "Corte Dama",
    descripcion: "Corte femenino profesional con lavado, secado y estilizado",
    precio: 45000,
    duracion: 45,
    popularidad: 4.4,
    categoria: "Cortes",
    beneficios: [
      "Corte personalizado",
      "Lavado con productos especializados",
      "Secado y planchado",
      "Tratamiento de puntas"
    ],
    disponible: true,
    popular: false,
    recomendado: false
  },
  {
    id: "SRV005",
    nombre: "Tratamiento Capilar",
    descripcion: "Tratamiento nutritivo e hidratante profundo para todo tipo de cabello",
    precio: 85000,
    duracion: 90,
    popularidad: 4.7,
    categoria: "Tratamientos",
    beneficios: [
      "Diagnóstico capilar personalizado",
      "Productos de alta gama",
      "Masaje capilar relajante",
      "Hidratación profunda",
      "Resultados visibles inmediatos"
    ],
    disponible: true,
    popular: true,
    recomendado: true
  },
  {
    id: "SRV006",
    nombre: "Peinado Evento",
    descripcion: "Peinado especial para bodas, graduaciones y ocasiones importantes",
    precio: 70000,
    duracion: 60,
    popularidad: 4.3,
    categoria: "Peinados",
    beneficios: [
      "Diseño personalizado",
      "Productos de fijación duradera",
      "Prueba de peinado incluida",
      "Retoques el mismo día"
    ],
    disponible: true,
    popular: false,
    recomendado: false
  },
  {
    id: "SRV007",
    nombre: "Tintura Premium",
    descripcion: "Coloración completa del cabello con productos de última generación",
    precio: 120000,
    duracion: 120,
    popularidad: 4.5,
    categoria: "Coloración",
    beneficios: [
      "Consulta de color personalizada",
      "Productos sin amoniaco",
      "Tratamiento post-color incluido",
      "Mantenimiento recomendado",
      "Garantía de color"
    ],
    disponible: true,
    popular: true,
    recomendado: false
  },
  {
    id: "SRV008",
    nombre: "Mechas y Reflejos",
    descripcion: "Aplicación profesional de mechas y reflejos para darle vida a tu cabello",
    precio: 150000,
    duracion: 150,
    popularidad: 4.4,
    categoria: "Coloración",
    beneficios: [
      "Técnicas modernas (balayage, ombré)",
      "Productos premium importados",
      "Tonalización incluida",
      "Tratamiento de brillo",
      "Asesoría de mantenimiento"
    ],
    disponible: true,
    popular: false,
    recomendado: true
  },
  {
    id: "SRV009",
    nombre: "Arreglo de Cejas",
    descripcion: "Perfilado y arreglo profesional de cejas para hombres",
    precio: 15000,
    duracion: 15,
    popularidad: 4.2,
    categoria: "Estética",
    beneficios: [
      "Diseño según facciones",
      "Técnicas precisas",
      "Productos hipoalergénicos",
      "Resultados naturales"
    ],
    disponible: true,
    popular: false,
    recomendado: false
  },
  {
    id: "SRV010",
    nombre: "Spa Capilar Completo",
    descripcion: "Experiencia relajante completa con tratamientos múltiples para el cabello",
    precio: 180000,
    duracion: 180,
    popularidad: 4.9,
    categoria: "Tratamientos",
    beneficios: [
      "Masaje capilar extendido",
      "Exfoliación del cuero cabelludo",
      "Hidratación intensiva",
      "Aromaterapia incluida",
      "Tratamiento de keratina",
      "Ambiente spa exclusivo"
    ],
    disponible: true,
    popular: true,
    recomendado: true
  },
  {
    id: "SRV011",
    nombre: "Corte Niño",
    descripcion: "Corte infantil en ambiente amigable con atención especializada",
    precio: 25000,
    duracion: 30,
    popularidad: 4.6,
    categoria: "Cortes",
    beneficios: [
      "Ambiente infantil cómodo",
      "Barberos especializados",
      "Paciencia garantizada",
      "Dulce de cortesía"
    ],
    disponible: true,
    popular: true,
    recomendado: false
  },
  {
    id: "SRV012",
    nombre: "Decoloración",
    descripcion: "Proceso de decoloración profesional para cambios de color dramáticos",
    precio: 200000,
    duracion: 180,
    popularidad: 4.1,
    categoria: "Coloración",
    beneficios: [
      "Evaluación de cabello previa",
      "Productos protectores",
      "Tonalización incluida",
      "Tratamiento reconstructor",
      "Plan de cuidados post-decoloración"
    ],
    disponible: true,
    popular: false,
    recomendado: false
  }
];

const categorias = ["Todos", "Cortes", "Afeitado", "Tratamientos", "Peinados", "Coloración", "Estética"];

export function ClienteServiciosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("Todos");
  const [selectedServicio, setSelectedServicio] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Filtrar servicios
  const filteredServicios = serviciosDisponibles.filter(servicio => {
    const matchesSearch = servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = selectedCategoria === "Todos" || servicio.categoria === selectedCategoria;
    return matchesSearch && matchesCategoria && servicio.disponible;
  });

  const handleViewDetails = (servicio: any) => {
    setSelectedServicio(servicio);
    setIsDetailDialogOpen(true);
  };

  const handleReservarServicio = (servicio: any) => {
    toast.success(`Servicio "${servicio.nombre}" agregado`, {
      description: `Se ha iniciado el proceso de reserva. Serás redirigido a la agenda.`,
      duration: 3000,
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-orange-primary text-orange-primary" : "text-gray-medium"
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
            <h1 className="text-2xl font-semibold text-white-primary">Servicios Disponibles</h1>
            <p className="text-sm text-gray-lightest mt-1">Descubre todos nuestros servicios profesionales de barbería</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-black-primary">
        {/* Filtros */}
        <div className="elegante-card mb-8">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-lightest w-4 h-4" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="elegante-input pl-10"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="flex flex-wrap gap-2">
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setSelectedCategoria(categoria)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategoria === categoria
                      ? "bg-orange-primary text-black-primary"
                      : "bg-gray-darker text-gray-lightest border border-gray-dark hover:bg-gray-dark"
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServicios.map((servicio) => (
            <div key={servicio.id} className="elegante-card relative">
              {/* Badge de Popular o Recomendado */}
              {servicio.popular && (
                <div className="absolute top-4 right-4 bg-orange-primary text-black-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Popular
                </div>
              )}
              {servicio.recomendado && !servicio.popular && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Recomendado
                </div>
              )}

              {/* Contenido del servicio */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white-primary mb-1">{servicio.nombre}</h3>
                    <span className="text-xs text-orange-primary font-medium bg-orange-primary/10 px-2 py-1 rounded">
                      {servicio.categoria}
                    </span>
                  </div>
                </div>
                <p className="text-gray-lightest text-sm mb-3 line-clamp-2">{servicio.descripcion}</p>
                {renderStars(servicio.popularidad)}
              </div>

              {/* Beneficios principales */}
              <div className="mb-4">
                <h4 className="text-white-primary font-medium text-sm mb-2">Incluye:</h4>
                <div className="space-y-1">
                  {servicio.beneficios.slice(0, 3).map((beneficio, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-gray-lightest">{beneficio}</span>
                    </div>
                  ))}
                  {servicio.beneficios.length > 3 && (
                    <div className="text-orange-primary text-xs font-medium">
                      +{servicio.beneficios.length - 3} beneficios más
                    </div>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div className="flex items-center justify-between text-xs text-gray-lightest mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{servicio.duracion} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Scissors className="w-3 h-3" />
                  <span>{servicio.categoria}</span>
                </div>
              </div>

              {/* Precio */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-orange-primary font-bold text-2xl">
                    ${formatCurrency(servicio.precio)}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(servicio)}
                  className="elegante-button-secondary flex-1 text-sm py-2"
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => handleReservarServicio(servicio)}
                  className="elegante-button-primary flex-1 text-sm py-2"
                  disabled={!servicio.disponible}
                >
                  {servicio.disponible ? "Reservar" : "No Disponible"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredServicios.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-lightest mb-4">
              <Scissors className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron servicios que coincidan con tu búsqueda.</p>
            </div>
          </div>
        )}

        {/* Modal de Detalles */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl bg-gray-darkest border-gray-dark max-h-[90vh] flex flex-col">
            {selectedServicio && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white-primary text-xl flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-orange-primary" />
                    {selectedServicio.nombre}
                  </DialogTitle>
                  <DialogDescription className="text-gray-lightest">
                    Detalles completos del servicio
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
                  {/* Categoría y Rating */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-orange-primary font-medium bg-orange-primary/10 px-3 py-1 rounded-full">
                        {selectedServicio.categoria}
                      </span>
                      {selectedServicio.popular && (
                        <span className="text-sm bg-orange-primary text-black-primary px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Popular
                        </span>
                      )}
                      {selectedServicio.recomendado && (
                        <span className="text-sm bg-green-600 text-white px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-gray-lightest mb-3">{selectedServicio.descripcion}</p>
                    {renderStars(selectedServicio.popularidad)}
                  </div>

                  {/* Información del precio y duración */}
                  <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-lightest text-sm mb-1">Precio del Servicio</p>
                        <p className="text-orange-primary font-bold text-2xl">
                          ${formatCurrency(selectedServicio.precio)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-lightest text-sm mb-1">Duración Estimada</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-primary" />
                          <p className="text-white-primary font-semibold text-xl">
                            {selectedServicio.duracion} minutos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Todos los beneficios */}
                  <div>
                    <h4 className="text-white-primary font-semibold mb-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      Beneficios del Servicio
                    </h4>
                    <div className="bg-gray-darker p-4 rounded-lg border border-gray-dark">
                      <div className="grid grid-cols-1 gap-2">
                        {selectedServicio.beneficios.map((beneficio: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-lightest text-sm">{beneficio}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-orange-primary/10 border border-orange-primary/30 p-4 rounded-lg">
                    <h4 className="text-orange-primary font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Importante
                    </h4>
                    <ul className="text-gray-lightest text-sm space-y-1">
                      <li>• Llega 5 minutos antes de tu cita</li>
                      <li>• Puedes reprogramar hasta 2 horas antes</li>
                      <li>• Productos de alta calidad garantizados</li>
                      <li>• Barberos certificados y experimentados</li>
                    </ul>
                  </div>

                  {/* Botón de reserva */}
                  <div className="flex gap-3 pt-4 border-t border-gray-dark">
                    <button
                      onClick={() => setIsDetailDialogOpen(false)}
                      className="elegante-button-secondary flex-1"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={() => {
                        handleReservarServicio(selectedServicio);
                        setIsDetailDialogOpen(false);
                      }}
                      className="elegante-button-primary flex-1"
                    >
                      <Calendar className="w-4 h-4 mr-2 inline" />
                      Reservar Ahora
                    </button>
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
