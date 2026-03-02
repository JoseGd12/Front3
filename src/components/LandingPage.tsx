import { useState } from 'react';
import { useAuth } from './AuthContext';
import { 
  Scissors, 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Menu, 
  X as CloseIcon,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook
} from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import logo from '../assets/a51cd14e3664f3752eaa436dadb14492d91e40aa.png';

// Datos de productos (solo activos)
const productosData = [
  {
    id: 1,
    nombre: "Pomada Hair Wax",
    descripcion: "Pomada premium para fijación fuerte",
    categoria: "Cuidado Capilar",
    precio: 45000,
    imagen: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop&crop=center",
    activo: true
  },
  {
    id: 2,
    nombre: "Shampoo Premium",
    descripcion: "Shampoo profesional para todo tipo de cabello",
    categoria: "Cuidado Capilar",
    precio: 55000,
    imagen: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop&crop=center",
    activo: true
  },
  {
    id: 3,
    nombre: "Aceite de Barba",
    descripcion: "Aceite nutritivo para barba y bigote",
    categoria: "Cuidado Barba",
    precio: 48000,
    imagen: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=400&h=400&fit=crop&crop=center",
    activo: true
  },
  {
    id: 5,
    nombre: "Cuchillas de Afeitar",
    descripcion: "Cuchillas profesionales de acero inoxidable",
    categoria: "Herramientas",
    precio: 25000,
    imagen: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=400&h=400&fit=crop&crop=center",
    activo: true
  },
  {
    id: 6,
    nombre: "Cadena de Rodio Plateada",
    descripcion: "Cadena elegante de rodio con acabado brillante",
    categoria: "Accesorios",
    precio: 180000,
    imagen: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center",
    activo: true
  }
];

// Datos de servicios (solo activos)
const serviciosData = [
  {
    id: 1,
    nombre: "Corte Caballero",
    descripcion: "Corte clásico masculino con tijera y máquina",
    duracion: 30,
    precio: 35000,
    categoria: "Cortes",
    activo: true
  },
  {
    id: 2,
    nombre: "Corte + Barba",
    descripcion: "Corte completo con arreglo de barba y bigote",
    duracion: 60,
    precio: 55000,
    categoria: "Cortes",
    activo: true
  },
  {
    id: 3,
    nombre: "Afeitado Clásico",
    descripcion: "Afeitado tradicional con navaja y toalla caliente",
    duracion: 30,
    precio: 30000,
    categoria: "Afeitado",
    activo: true
  },
  {
    id: 4,
    nombre: "Corte Dama",
    descripcion: "Corte femenino con lavado y secado",
    duracion: 45,
    precio: 45000,
    categoria: "Cortes",
    activo: true
  },
  {
    id: 5,
    nombre: "Tratamiento Capilar",
    descripcion: "Tratamiento nutritivo e hidratante para el cabello",
    duracion: 90,
    precio: 85000,
    categoria: "Tratamientos",
    activo: true
  },
  {
    id: 6,
    nombre: "Peinado Evento",
    descripcion: "Peinado especial para eventos y ocasiones importantes",
    duracion: 60,
    precio: 70000,
    categoria: "Peinados",
    activo: true
  },
  {
    id: 7,
    nombre: "Tintura",
    descripcion: "Coloración completa del cabello",
    duracion: 120,
    precio: 120000,
    categoria: "Coloración",
    activo: true
  }
];

interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  tipo: 'producto' | 'servicio';
  imagen?: string;
}

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

interface LandingPageProps {
  onRequestLogin?: () => void;
  onRequestRegister?: () => void;
}

export function LandingPage({ onRequestLogin, onRequestRegister }: LandingPageProps) {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('inicio');

  // Filtrar solo productos y servicios activos
  const productosActivos = productosData.filter(p => p.activo);
  const serviciosActivos = serviciosData.filter(s => s.activo);

  const addToCart = (item: any, tipo: 'producto' | 'servicio') => {
    if (!isAuthenticated) {
      onRequestLogin?.();
      return;
    }

    const existingItem = cart.find(c => c.id === item.id && c.tipo === tipo);
    if (existingItem) {
      setCart(cart.map(c => 
        c.id === item.id && c.tipo === tipo
          ? { ...c, cantidad: c.cantidad + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: 1,
        tipo,
        imagen: item.imagen
      }]);
    }
    setCartOpen(true);
  };

  const removeFromCart = (id: number, tipo: 'producto' | 'servicio') => {
    setCart(cart.filter(c => !(c.id === id && c.tipo === tipo)));
  };

  const updateQuantity = (id: number, tipo: 'producto' | 'servicio', cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id, tipo);
      return;
    }
    setCart(cart.map(c => 
      c.id === id && c.tipo === tipo
        ? { ...c, cantidad }
        : c
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      onRequestLogin?.();
      return;
    }
    // Aquí iría la lógica de checkout
    alert('Redirigiendo al proceso de compra...');
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Barra de Navegación */}
      <nav className="fixed top-0 left-0 right-0 bg-black-primary/95 backdrop-blur-sm border-b border-gray-dark z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center elegante-shadow-lg relative overflow-hidden">
                <img
                  src={logo}
                  alt="Edwin's Barbería Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white-primary">EDWINS BARBERIA</h1>
                <p className="text-xs text-gray-lighter">Barberia de élite</p>
              </div>
            </div>

            {/* Menú Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('inicio')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'inicio' ? 'text-orange-primary' : 'text-gray-lightest hover:text-orange-primary'
                }`}
              >
                Inicio
              </button>
              <button
                onClick={() => scrollToSection('servicios')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'servicios' ? 'text-orange-primary' : 'text-gray-lightest hover:text-orange-primary'
                }`}
              >
                Servicios
              </button>
              <button
                onClick={() => scrollToSection('productos')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'productos' ? 'text-orange-primary' : 'text-gray-lightest hover:text-orange-primary'
                }`}
              >
                Productos
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'contacto' ? 'text-orange-primary' : 'text-gray-lightest hover:text-orange-primary'
                }`}
              >
                Contacto
              </button>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-4">
              {/* Carrito */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg bg-gray-darker hover:bg-gray-medium border border-gray-dark transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-orange-primary" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-primary text-black-primary rounded-full text-xs font-bold flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Botón Registro */}
              <button
                onClick={() => {
                  onRequestRegister?.();
                }}
                className="hidden md:block px-4 py-2 rounded-lg bg-gray-darker hover:bg-gray-medium border border-gray-dark text-gray-lightest text-sm font-medium transition-colors"
              >
                Registrarse
              </button>

              {/* Botón Iniciar Sesión */}
              <button
                onClick={() => {
                  onRequestLogin?.();
                }}
                className="px-4 py-2 rounded-lg bg-orange-primary hover:bg-orange-secondary text-black-primary text-sm font-semibold transition-colors"
              >
                Iniciar Sesión
              </button>

              {/* Menú Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-gray-darker hover:bg-gray-medium border border-gray-dark"
              >
                {mobileMenuOpen ? (
                  <CloseIcon className="w-5 h-5 text-orange-primary" />
                ) : (
                  <Menu className="w-5 h-5 text-orange-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-dark bg-black-primary">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => scrollToSection('inicio')}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-darker text-gray-lightest"
              >
                Inicio
              </button>
              <button
                onClick={() => scrollToSection('servicios')}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-darker text-gray-lightest"
              >
                Servicios
              </button>
              <button
                onClick={() => scrollToSection('productos')}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-darker text-gray-lightest"
              >
                Productos
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-darker text-gray-lightest"
              >
                Contacto
              </button>
              <button
                onClick={() => {
                  onRequestLogin?.();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 rounded-lg bg-orange-primary text-black-primary font-semibold mt-4"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  onRequestRegister?.();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 rounded-lg bg-gray-darker hover:bg-gray-medium border border-gray-dark text-gray-lightest mt-2"
              >
                Registrarse
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Contenido Principal */}
      <div className="pt-20">
        {/* Hero Section */}
        <section id="inicio" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black-primary via-gray-darkest to-black-primary overflow-hidden">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #d8b081 1px, transparent 0)`,
              backgroundSize: '40px 40px',
              backgroundAttachment: 'fixed',
            }}
          ></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Texto */}
              <div className="text-center md:text-left">
                
                <h1 className="text-5xl md:text-6xl font-bold text-white-primary mb-6 leading-tight">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-primary/10 border border-orange-primary/20 mb-6">
                  <Sparkles className="w-4 h-4 text-orange-primary" />
                  Estilo y Elegancia
                  <span className="block text-orange-primary">en Cada Corte</span>
                </div>
                </h1>
                <p className="text-xl text-gray-lightest mb-8 max-w-xl">
                  Descubre la experiencia premium de barbería. Servicios profesionales, productos de calidad y atención excepcional.
                </p>
                <div className="flex flex-col sm:flex-row gap-8">
                  <button
                    onClick={() => scrollToSection('servicios')}
                    className="ml-5 mr-3 px-8 py-4 rounded-lg bg-orange-primary hover:bg-orange-secondary text-black-primary font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ marginLeft: '70px', marginRight: '10px' }}
                  >
                    Ver Servicios
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollToSection('productos')}
                    className="ml-5 px-8 py-4 rounded-lg bg-gray-darker hover:bg-gray-medium border border-gray-dark text-white-primary font-semibold transition-colors" 
                  >
                    Explorar Productos
                  </button>
                </div>
                <br />
                <br />
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-dark">
                  
                  <div>
                  <br />
                    <div className="text-3xl font-bold text-orange-primary">{serviciosActivos.length}+</div>
                    <div className="text-sm text-gray-lightest">Servicios</div>
                  </div>
                  <div>
                  <br />
                    <div className="text-3xl font-bold text-orange-primary">{productosActivos.length}+</div>
                    <div className="text-sm text-gray-lightest">Productos</div>
                  </div>
                  <div>
                  <br />
                    <div className="text-3xl font-bold text-orange-primary">5+</div>
                    <div className="text-sm text-gray-lightest">Años</div>
                  </div>
                </div>
              </div>
              

              {/* Imagen Hero */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden elegante-shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=800&fit=crop&crop=center"
                    alt="Barbería Elite"
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black-primary/80 via-transparent to-transparent"></div>
                </div>
                {/* Badge */}
                
              </div>
            </div>
          </div>
        </section>

        {/* Sección Sobre el Negocio y su Trayectoria (dos cajones paralelos) */}
        <section
          id="trayectoria"
          className="relative py-24"
          style={{ backgroundColor: '#856949' }}
        >
          {/* Patrón de puntos negros en el fondo */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #000000 1px, transparent 0)`,
              backgroundSize: '40px 40px',
              backgroundAttachment: 'fixed',
            }}
          ></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
            {/* El contenedor solo define la grilla en dos columnas */}
            <div className="grid gap-10 lg:gap-12 lg:grid-cols-2 mt-10">

              {/* Cajón izquierdo: Historia y trayectoria (fondo difuminado hacia el café) */}
              <section className="relative rounded-3xl border border-orange-primary/30 shadow-lg shadow-black/40 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(17,17,17,0.96) 0%, rgba(24,24,24,0.95) 30%, rgba(133,105,73,0) 100%)',
                  }}
                />
                <div className="relative px-8 sm:px-10 pt-14 pb-12">
                  <br />
                  <br />
                  <br />
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-primary/10 border border-orange-primary/20 mb-4">
                    <Sparkles className="w-4 h-4 text-orange-primary" />
                    <span className="text-sm text-orange-primary font-medium">Nuestra Trayectoria</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white-primary mb-6 leading-tight">
                    EDWINS BARBERIA, pasión por el estilo desde 2023
                  </h2>
                  <p className="text-base md:text-lg text-gray-lightest mb-4 leading-relaxed">
                    EDWINS BARBERIA es una barbería ubicada en la Calle 79 #52-12, barrio El Bosque, dedicada al cuidado de la
                    apariencia masculina desde el 1 de abril de 2023. Con más de 2 años de trayectoria, nos hemos consolidado
                    como un punto de referencia para quienes buscan un servicio profesional y cercano.
                  </p>
                  <p className="text-base md:text-lg text-gray-lightest mb-4 leading-relaxed">
                    Contamos con un equipo de <span className="text-orange-primary font-semibold">6 colaboradores</span>, entre
                    ellos <span className="text-orange-primary font-semibold">5 barberos especializados</span> y personal
                    administrativo, todos comprometidos con brindar una experiencia cómoda, segura y de alta calidad.
                  </p>
                  <p className="text-base md:text-lg text-gray-lightest leading-relaxed">
                    Además de nuestros servicios de barbería, ofrecemos una línea completa de productos para el cuidado facial y
                    capilar, así como accesorios como cadenas, aretes, anillos de rodio, gafas de estilo masculino, manillas
                    artesanales, perfumes y lociones.
                  </p>
                </div>
              </section>

              {/* Cajón derecho: Información rápida y datos clave (fondo difuminado hacia el café) */}
              <section className="relative rounded-3xl border border-orange-primary/30 shadow-lg shadow-black/40 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(17,17,17,0.96) 0%, rgba(24,24,24,0.95) 30%, rgba(133,105,73,0) 100%)',
                  }}
                />
                <div className="relative px-8 sm:px-10 pt-14 pb-12">
                  <br />
                  <br />
                  <h3 className="text-2xl md:text-3xl font-bold text-white-primary mb-6">
                    Datos clave de la barbería
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6 mb-6">
                    <div className="bg-black-primary/40 rounded-2xl p-5 border border-gray-dark">
                      <h4 className="text-lg font-semibold text-white-primary mb-2">Ubicación</h4>
                      <div className="flex items-start gap-3 text-gray-lightest">
                        <MapPin className="w-5 h-5 text-orange-primary mt-1" />
                        <p>
                          Calle 79 #52-12<br />
                          Barrio El Bosque
                        </p>
                      </div>
                    </div>

                    <div className="bg-black-primary/40 rounded-2xl p-5 border border-gray-dark">
                      <h4 className="text-lg font-semibold text-white-primary mb-2">Contacto</h4>
                      <div className="space-y-2 text-gray-lightest">
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-orange-primary mt-1" />
                          <p>301 483 6189</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-orange-primary mt-1" />
                          <p>Edwainsolano007@gmail.com</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-black-primary/40 rounded-2xl p-5 border border-gray-dark">
                      <h4 className="text-lg font-semibold text-white-primary mb-2">Experiencia</h4>
                      <div className="flex items-center gap-3 text-gray-lightest">
                        <Star className="w-5 h-5 text-orange-primary" />
                        <p>Más de 2 años dedicados al cuidado de la imagen masculina.</p>
                      </div>
                    </div>

                    <div className="bg-black-primary/40 rounded-2xl p-5 border border-gray-dark">
                      <h4 className="text-lg font-semibold text-white-primary mb-2">Equipo</h4>
                      <div className="flex items-center gap-3 text-gray-lightest">
                        <Scissors className="w-5 h-5 text-orange-primary" />
                        <p>5 barberos profesionales y personal administrativo a tu servicio.</p>
                      </div>
                    </div>
                    <br />
                  </div>
                </div>
              </section>

            </div>
          </div>
        </section>
      

        {/* Sección de Servicios */}
        <section id="servicios" className="py-20 bg-gray-darkest">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 py-12">
        
              <br />
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white-primary mb-8 leading-tight" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 'bold' }}>
                 Nuestros<span className="text-orange-primary"> servicios</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-lightest max-w-3xl mx-auto">
                Ofrecemos una amplia gama de servicios profesionales para cuidar tu estilo
              </p>
              <br />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviciosActivos.map((servicio) => (
                <div
                  key={servicio.id}
                  className="group bg-gray-darker rounded-2xl p-6 border border-gray-dark hover:border-orange-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-primary/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-primary/10 flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-orange-primary" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white-primary">${formatCurrency(servicio.precio)}</div>
                      <div className="text-sm text-gray-lightest flex items-center gap-1 justify-end">
                        <Clock className="w-4 h-4" />
                        {servicio.duracion} min
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white-primary mb-2">{servicio.nombre}</h3>
                  <p className="text-gray-lightest mb-6">{servicio.descripcion}</p>
                  <button
                    onClick={() => addToCart(servicio, 'servicio')}
                    className="w-full px-4 py-3 rounded-lg bg-orange-primary hover:bg-orange-secondary text-black-primary font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Agregar al Carrito
                  </button>
                </div>
                
              ))}
            </div>
            <br />
            <br />
            <br />
          </div>
        </section>
        <br />


        {/* Sección de Productos */}
        <section id="productos" className="relative py-20 bg-black-primary overflow-hidden">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #d8b081 1px, transparent 0)`,
              backgroundSize: '40px 40px',
              backgroundAttachment: 'fixed',
            }}
          ></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 py-12">
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white-primary mb-8 leading-tight" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 'bold' }}>
                Nuestros <span className="text-orange-primary">productos</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-lightest max-w-3xl mx-auto">
                Productos premium de cuidado personal y accesorios de calidad
              </p>
              <br />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {productosActivos.map((producto) => (
                <div
                  key={producto.id}
                  className="group bg-gray-darkest rounded-2xl overflow-hidden border border-gray-dark hover:border-orange-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-primary/10"
                >
                  <div className="relative h-64 bg-gray-darker overflow-hidden">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full bg-black-primary/80 text-white-primary text-xs font-medium">
                        {producto.categoria}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white-primary mb-2">{producto.nombre}</h3>
                    <p className="text-gray-lightest mb-4 text-sm">{producto.descripcion}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-orange-primary">
                        ${formatCurrency(producto.precio)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-orange-primary text-orange-primary" />
                        <span className="text-sm text-gray-lightest">4.8</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(producto, 'producto')}
                      className="w-full px-4 py-3 rounded-lg bg-orange-primary hover:bg-orange-secondary text-black-primary font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <br />
            <br />
            <br />
          </div>
        </section>

        {/* Sección de Contacto */}
        <section id="contacto" className="py-20 bg-gray-darkest">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <br />
              <h2 className="text-4xl md:text-5xl font-bold text-white-primary mb-4">
                Contáctanos
              </h2>
              <p className="text-xl text-gray-lightest max-w-2xl mx-auto">
                Estamos aquí para ayudarte. Visítanos o contáctanos
              </p>
              <br />
              <br />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-darker rounded-2xl p-8 border border-gray-dark text-center">
                <div className="w-16 h-16 rounded-full bg-orange-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-orange-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-2">Dirección</h3>
                <p className="text-gray-lightest">
                  Calle Principal #123<br />
                  Bogotá, Colombia
                </p>
              </div>

              <div className="bg-gray-darker rounded-2xl p-8 border border-gray-dark text-center">
                <div className="w-16 h-16 rounded-full bg-orange-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-orange-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-2">Teléfono</h3>
                <p className="text-gray-lightest">
                  +57 300 123 4567<br />
                  Lunes - Sábado: 9am - 8pm
                </p>
              </div>

              <div className="bg-gray-darker rounded-2xl p-8 border border-gray-dark text-center">
                <div className="w-16 h-16 rounded-full bg-orange-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-orange-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white-primary mb-2">Email</h3>
                <p className="text-gray-lightest">
                  contacto@edwinsbarber.com<br />
                  info@edwinsbarber.com
                </p>
              </div>
            </div>
            <br />
            <br />
            
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black-primary border-t border-gray-dark py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center elegante-shadow-lg relative overflow-hidden">
                    <img
                      src={logo}
                      alt="Edwin's Barbería Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white-primary">EDWINS BARBER</h3>
                  </div>
                </div>
                <p className="text-gray-lightest text-sm">
                  El mejor cuidado para tu estilo. Servicios profesionales y productos de calidad.
                </p>
              </div>

              <div>
                <h4 className="text-white-primary font-semibold mb-4">Enlaces</h4>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => scrollToSection('inicio')} className="text-gray-lightest hover:text-orange-primary text-sm transition-colors">
                      Inicio
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('servicios')} className="text-gray-lightest hover:text-orange-primary text-sm transition-colors">
                      Servicios
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('productos')} className="text-gray-lightest hover:text-orange-primary text-sm transition-colors">
                      Productos
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white-primary font-semibold mb-4">Síguenos</h4>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-darker hover:bg-gray-medium border border-gray-dark flex items-center justify-center transition-colors">
                    <Instagram className="w-5 h-5 text-orange-primary" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-darker hover:bg-gray-medium border border-gray-dark flex items-center justify-center transition-colors">
                    <Facebook className="w-5 h-5 text-orange-primary" />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-white-primary font-semibold mb-4">Horarios</h4>
                <p className="text-gray-lightest text-sm">
                  Lunes - Viernes: 9:00 AM - 8:00 PM<br />
                  Sábados: 9:00 AM - 6:00 PM<br />
                  Domingos: Cerrado
                </p>
              </div>
            </div>

            <div className="border-t border-gray-dark pt-8 text-center">

              <br />

              <p className="text-gray-lightest text-sm">
                © {new Date().getFullYear()} EDWINS BARBER. Todos los derechos reservados.
              </p>
              
            </div>
          </div>
        </footer>
      </div>

      {/* Carrito de Compras */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="bg-gray-darkest border-gray-dark max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white-primary flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-orange-primary" />
              Carrito de Compras
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-darker transition-colors"
            >
              <X className="w-5 h-5 text-gray-lightest" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-medium mx-auto mb-4" />
              <p className="text-gray-lightest">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-4 p-4 bg-gray-darker rounded-lg border border-gray-dark">
                    {item.imagen && (
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-white-primary font-medium">{item.nombre}</h4>
                      <p className="text-orange-primary font-semibold">${formatCurrency(item.precio)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.tipo, item.cantidad - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-darkest hover:bg-gray-medium border border-gray-dark flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-lightest" />
                      </button>
                      <span className="w-8 text-center text-white-primary font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.tipo, item.cantidad + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-darkest hover:bg-gray-medium border border-gray-dark flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-lightest" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.tipo)}
                      className="p-2 rounded-lg hover:bg-red-900/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-dark pt-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold text-white-primary">Total:</span>
                  <span className="text-2xl font-bold text-orange-primary">${formatCurrency(cartTotal)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full px-6 py-4 rounded-lg bg-orange-primary hover:bg-orange-secondary text-black-primary font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Proceder al Pago
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}

