import { useState } from 'react';
import { Button } from './ui/button';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Mail,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Phone,
  Star
} from 'lucide-react';

interface EmailSimulatorCitaProps {
  citaData: {
    servicio: string;
    barbero: string;
    fecha: string;
    hora: string;
    precio: number;
    duracion: number;
    notas?: string;
  };
  clienteInfo: {
    nombre: string;
    telefono: string;
  };
  onClose: () => void;
}

export function EmailSimulatorCita({ citaData, clienteInfo, onClose }: EmailSimulatorCitaProps) {
  const [copied, setCopied] = useState(false);

  // Generar un número de confirmación simulado
  const numeroConfirmacion = 'CITA-' + Math.random().toString(36).substr(2, 8).toUpperCase();

  // URL simulada para gestionar la cita
  const gestionarCitaLink = `https://edwinsbarber.com/citas/${numeroConfirmacion}`;

  const formatearPrecio = (precio: number): string => {
    return `$ ${precio.toLocaleString('es-CO')}`;
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calcularHoraFin = (horaInicio: string, duracion: number) => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const inicioEnMinutos = horas * 60 + minutos;
    const finEnMinutos = inicioEnMinutos + duracion;
    const horasFin = Math.floor(finEnMinutos / 60);
    const minutosFin = finEnMinutos % 60;
    return `${horasFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gestionarCitaLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = gestionarCitaLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-lightest p-4 overflow-y-auto">
      {/* Header del Email */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white-primary rounded-t-lg border border-gray-light">
          <div className="p-4 border-b border-gray-light bg-gray-lighter">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-primary rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-darkest">Edwins Barber - Confirmación de Cita</p>
                  <p className="text-sm text-gray-medium">citas@edwinsbarber.com</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-medium hover:text-gray-darkest transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-sm text-gray-medium">
              <p><strong>Para:</strong> {clienteInfo.nombre} &lt;cliente@email.com&gt;</p>
              <p><strong>Asunto:</strong> ✅ Cita confirmada - {citaData.servicio} - {formatearFecha(citaData.fecha)}</p>
              <p><strong>Fecha:</strong> {new Date().toLocaleString('es-ES')}</p>
            </div>
          </div>
        </div>

        {/* Contenido del Email */}
        <div className="bg-white-primary border-x border-gray-light">
          <div className="p-8">
            {/* Logo y Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-primary to-orange-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Scissors className="w-10 h-10 text-white-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-darkest mb-2">¡Tu cita está confirmada!</h1>
              <p className="text-gray-medium text-lg">Gracias por confiar en nosotros, {clienteInfo.nombre}</p>
            </div>

            {/* Estado de confirmación */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-8 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold text-lg">CITA CONFIRMADA</span>
              </div>
              <p className="text-green-600">Número de confirmación: <strong>{numeroConfirmacion}</strong></p>
            </div>

            {/* Detalles de la cita */}
            <div className="bg-gray-lighter p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold text-gray-darkest mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-primary" />
                Detalles de tu cita
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Scissors className="w-5 h-5 text-orange-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-darkest">Servicio</p>
                      <p className="text-gray-medium">{citaData.servicio}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-orange-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-darkest">Barbero</p>
                      <p className="text-gray-medium">{citaData.barbero}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-orange-secondary fill-current" />
                        <span className="text-sm text-gray-medium">4.9 • Especialista</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-orange-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-darkest">Fecha</p>
                      <p className="text-gray-medium">{formatearFecha(citaData.fecha)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-primary mt-1" />
                    <div>
                      <p className="font-semibold text-gray-darkest">Horario</p>
                      <p className="text-gray-medium">
                        {citaData.hora} - {calcularHoraFin(citaData.hora, citaData.duracion)}
                      </p>
                      <p className="text-sm text-gray-light">({citaData.duracion} minutos)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-light pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-darkest">Precio total:</span>
                  <span className="text-2xl font-bold text-orange-primary">{formatearPrecio(citaData.precio)}</span>
                </div>
              </div>

              {citaData.notas && (
                <div className="border-t border-gray-light pt-4 mt-4">
                  <p className="font-semibold text-gray-darkest mb-2">Notas especiales:</p>
                  <p className="text-gray-medium bg-gray-lightest p-3 rounded italic">"{citaData.notas}"</p>
                </div>
              )}
            </div>

            {/* Información de la barbería */}
            <div className="bg-orange-primary/5 border border-orange-primary/20 p-6 rounded-lg mb-8">
              <h4 className="font-bold text-gray-darkest mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-primary" />
                EDWINS BARBER
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-medium">
                <div>
                  <p><strong>Dirección:</strong></p>
                  <p>Calle 123 #45-67</p>
                  <p>Bogotá, Colombia</p>
                </div>
                <div>
                  <p><strong>Contacto:</strong></p>
                  <p className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    +57 (1) 234-5678
                  </p>
                  <p>WhatsApp: +57 300 123 4567</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => window.open('https://maps.google.com/?q=EDWINS+BARBER', '_blank')}
                className="bg-orange-primary hover:bg-orange-secondary text-white-primary font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Ver ubicación
              </button>

              <button
                onClick={() => window.open(`tel:+573001234567`, '_blank')}
                className="bg-gray-darkest hover:bg-gray-darker text-white-primary font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Llamar ahora
              </button>
            </div>

            {/* Enlace para gestionar la cita */}
            <div className="bg-gray-lighter p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-darkest mb-2">Gestiona tu cita:</h4>
              <div className="flex items-center gap-2 p-3 bg-white-primary border border-gray-light rounded text-sm font-mono text-gray-medium break-all">
                <span className="flex-1">{gestionarCitaLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-1 text-orange-primary hover:text-orange-secondary transition-colors"
                  title="Copiar enlace"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-medium mt-2">
                Usa este enlace para reprogramar o cancelar tu cita si es necesario
              </p>
            </div>

            {/* Recordatorios importantes */}
            <div className="bg-orange-primary/5 border border-orange-primary/20 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-darkest mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-primary" />
                Recordatorios importantes
              </h4>
              <ul className="text-sm text-gray-medium space-y-2">
                <li>• Llega 5 minutos antes de tu cita</li>
                <li>• Si necesitas cancelar, hazlo con al menos 2 horas de anticipación</li>
                <li>• Recuerda traer una mascarilla si tienes síntomas de gripe</li>
                <li>• Tenemos estacionamiento gratuito disponible</li>
                <li>• Aceptamos efectivo y tarjetas de débito/crédito</li>
              </ul>
            </div>

            {/* Mensaje de agradecimiento */}
            <div className="text-center space-y-4">
              <p className="text-gray-medium">
                Te enviaremos un recordatorio 24 horas antes de tu cita.
              </p>
              <p className="text-lg font-semibold text-gray-darkest">
                ¡Esperamos verte pronto en Edwins Barber! 💈
              </p>
            </div>
          </div>
        </div>

        {/* Footer del Email */}
        <div className="bg-gray-darkest text-white-primary rounded-b-lg border border-gray-light border-t-0 p-6 text-center">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-primary rounded-full flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white-primary" />
              </div>
              <span className="font-bold text-lg">EDWINS BARBER</span>
            </div>

            <p className="font-medium">Tu barbería de confianza desde 2020</p>
            <p className="text-gray-lighter">Especialistas en cortes clásicos y modernos</p>

            <div className="flex justify-center space-x-6 text-xs text-gray-lighter pt-3">
              <span>📍 Calle 123 #45-67, Bogotá</span>
              <span>📞 +57 (1) 234-5678</span>
              <span>🕒 Lun-Sáb 9:00-19:00</span>
            </div>

            <div className="pt-4 border-t border-gray-dark mt-4">
              <p className="text-xs text-gray-lighter">
                Este correo fue enviado automáticamente. Para cambios en tu cita,
                <br />usa el enlace de gestión o llámanos directamente.
              </p>
              <p className="text-xs text-gray-lighter mt-2">
                &copy; 2025 Edwins Barber. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Nota de simulación */}
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <ExternalLink className="w-4 h-4" />
            <span className="font-medium">Simulación de Correo de Confirmación</span>
          </div>
          <p className="text-sm text-blue-300 mt-1">
            Esta es una simulación del correo de confirmación que se enviaría automáticamente al cliente
            después de agendar una cita exitosamente. En un entorno real, este correo llegaría inmediatamente
            a la bandeja de entrada del cliente.
          </p>
        </div>

        {/* Botón para cerrar la simulación */}
        <div className="mt-6 text-center">
          <Button
            onClick={onClose}
            className="elegante-button-primary"
          >
            Cerrar Simulación
          </Button>
        </div>
      </div>
    </div>
  );
}