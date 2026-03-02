import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Eye, User, IdCard, Phone, MapPin, Settings, Lock, Mail, Calendar, Camera, Shield } from "lucide-react";

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onEdit: (user: any) => void;
}

export function UserDetailsDialog({ isOpen, onClose, user, onEdit }: UserDetailsDialogProps) {
  if (!user) return null;

  const dialogDescriptionId = `user-details-description-${user.id || 'unknown'}`;

  const getRolColor = (rol: string) => {
    switch (rol) {
      case "Admin": return "bg-red-600 text-white";
      case "Barbero": return "bg-blue-600 text-white";
      case "Cliente": return "bg-green-600 text-white";
      default: return "bg-gray-medium text-white";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'No calculable';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return `${age} años`;
    } catch {
      return 'No calculable';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="elegante-card max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby={dialogDescriptionId}
      >
        <DialogHeader>
          <DialogTitle className="text-white-primary flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-primary" />
            Detalles del Usuario
          </DialogTitle>
          <DialogDescription 
            id={dialogDescriptionId}
            className="text-gray-lightest"
          >
            Información completa del usuario seleccionado: {user.nombres} {user.apellidos}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          {/* Información Básica con Avatar */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <Avatar className="w-28 h-28 border-3 border-orange-primary">
                  {user.imagenUrl ? (
                    <AvatarImage src={user.imagenUrl} alt={`${user.nombres} ${user.apellidos}`} />
                  ) : (
                    <AvatarFallback className="bg-orange-primary text-black-primary text-2xl font-bold">
                      {user.avatar}
                    </AvatarFallback>
                  )}
                </Avatar>
                {user.imagenUrl && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white-primary mb-3">
                  {user.nombres} {user.apellidos}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`elegante-tag ${getRolColor(user.rol)} text-sm px-3 py-1`}>
                    <Shield className="w-4 h-4 inline mr-1" />
                    {user.rol}
                  </span>
                  <span className={`elegante-tag text-sm px-3 py-1 ${user.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {user.status === 'active' ? '🟢 Activo' : '🔴 Inactivo'}
                  </span>
                  <span className="elegante-tag bg-blue-600 text-white text-sm px-3 py-1">
                    ID: #{user.id}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-primary" />
                    <span className="text-gray-lighter">Registrado:</span>
                    <span className="text-white-primary font-medium">{user.fechaCreacion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-primary" />
                    <span className="text-gray-lighter">Avatar:</span>
                    <span className="text-white-primary font-medium">{user.avatar}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información Personal Completa */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <User className="w-6 h-6 text-orange-primary" />
              Información Personal Completa
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Nombres Completos</Label>
                <div className="bg-gray-darkest p-3 rounded-lg border border-gray-dark">
                  <p className="text-white-primary font-semibold">{user.nombres || 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Apellidos Completos</Label>
                <div className="bg-gray-darkest p-3 rounded-lg border border-gray-dark">
                  <p className="text-white-primary font-semibold">{user.apellidos || 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Nombre Completo</Label>
                <div className="bg-gray-darkest p-3 rounded-lg border border-gray-dark">
                  <p className="text-white-primary font-semibold">{`${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'No especificado'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Fecha de Nacimiento</Label>
                <div className="bg-gray-darkest p-3 rounded-lg border border-gray-dark">
                  <p className="text-white-primary font-medium">{formatDate(user.fechaNacimiento)}</p>
                  {user.fechaNacimiento && (
                    <p className="text-xs text-gray-lighter mt-1">Formato: {user.fechaNacimiento}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Edad Calculada</Label>
                <div className="bg-gray-darkest p-3 rounded-lg border border-gray-dark">
                  <p className="text-white-primary font-medium">{calculateAge(user.fechaNacimiento)}</p>
                  {user.fechaNacimiento && (
                    <p className="text-xs text-gray-lighter mt-1">Calculada automáticamente</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Iniciales (Avatar)</Label>
                <div className="bg-gray-darkest p-3 rounded-lg border border-gray-dark">
                  <p className="text-white-primary font-semibold">{user.avatar || 'No generado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documentación Oficial */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <IdCard className="w-6 h-6 text-orange-primary" />
              Documentación Oficial
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Tipo de Documento de Identidad</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <IdCard className="w-5 h-5 text-orange-primary" />
                    <div>
                      <p className="text-white-primary font-semibold">{user.tipoDocumento || 'No especificado'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Tipo de identificación oficial</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Número de Documento</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔢</span>
                    <div>
                      <p className="text-white-primary font-semibold text-lg tracking-wider">{user.documento || 'No especificado'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Número único de identificación</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-darkest rounded-lg border border-gray-dark">
              <p className="text-sm text-gray-lighter">
                <strong>Identificación completa:</strong> {user.tipoDocumento || 'N/A'} #{user.documento || 'N/A'}
              </p>
            </div>
          </div>

          {/* Información de Contacto Completa */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <Phone className="w-6 h-6 text-orange-primary" />
              Información de Contacto Completa
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Correo Electrónico</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-orange-primary" />
                    <div className="flex-1">
                      <p className="text-white-primary font-medium break-all">{user.correo || 'No especificado'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Email principal de contacto</p>
                    </div>
                  </div>
                  {user.correo && (
                    <div className="mt-3 pt-2 border-t border-gray-dark">
                      <a 
                        href={`mailto:${user.correo}`} 
                        className="text-xs text-orange-primary hover:text-orange-secondary transition-colors"
                      >
                        📧 Enviar correo
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Número de Celular</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-orange-primary" />
                    <div className="flex-1">
                      <p className="text-white-primary font-medium text-lg">{user.celular || 'No especificado'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Teléfono móvil principal</p>
                    </div>
                  </div>
                  {user.celular && (
                    <div className="mt-3 pt-2 border-t border-gray-dark flex gap-4">
                      <a 
                        href={`tel:${user.celular}`} 
                        className="text-xs text-orange-primary hover:text-orange-secondary transition-colors"
                      >
                        📞 Llamar
                      </a>
                      <a 
                        href={`sms:${user.celular}`} 
                        className="text-xs text-orange-primary hover:text-orange-secondary transition-colors"
                      >
                        💬 Enviar SMS
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de Ubicación */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <MapPin className="w-6 h-6 text-orange-primary" />
              Información de Ubicación
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Dirección Completa</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white-primary font-medium">
                        {user.direccion || 'No especificada'}
                      </p>
                      <p className="text-xs text-gray-lighter mt-1">Dirección de residencia</p>
                    </div>
                  </div>
                  {user.direccion && (
                    <div className="mt-3 pt-2 border-t border-gray-dark">
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(user.direccion)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-primary hover:text-orange-secondary transition-colors"
                      >
                        🗺️ Ver en Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Barrio / Localidad</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏘️</span>
                    <div>
                      <p className="text-white-primary font-medium">
                        {user.barrio || 'No especificado'}
                      </p>
                      <p className="text-xs text-gray-lighter mt-1">Zona o barrio de residencia</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {(user.direccion || user.barrio) && (
              <div className="mt-4 p-3 bg-gray-darkest rounded-lg border border-gray-dark">
                <p className="text-sm text-gray-lighter">
                  <strong>Dirección completa:</strong> {user.direccion || 'N/A'}, {user.barrio || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Imagen de Perfil */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <Camera className="w-6 h-6 text-orange-primary" />
              Imagen de Perfil
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">URL de la Imagen</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-orange-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white-primary font-medium break-all text-sm">
                        {user.imagenUrl || 'No especificada - Usando iniciales'}
                      </p>
                      <p className="text-xs text-gray-lighter mt-1">
                        {user.imagenUrl ? 'Imagen personalizada cargada' : 'Se muestran las iniciales del nombre'}
                      </p>
                    </div>
                  </div>
                  {user.imagenUrl && (
                    <div className="mt-3 pt-2 border-t border-gray-dark">
                      <a 
                        href={user.imagenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-primary hover:text-orange-secondary transition-colors"
                      >
                        🔗 Ver imagen original
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Vista Previa</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center justify-center">
                    <Avatar className="w-20 h-20 border-2 border-orange-primary">
                      {user.imagenUrl ? (
                        <AvatarImage src={user.imagenUrl} alt={`${user.nombres} ${user.apellidos}`} />
                      ) : (
                        <AvatarFallback className="bg-orange-primary text-black-primary text-xl font-bold">
                          {user.avatar}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <p className="text-xs text-gray-lighter text-center mt-2">
                    {user.imagenUrl ? 'Imagen personalizada' : `Iniciales: ${user.avatar}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <Settings className="w-6 h-6 text-orange-primary" />
              Información del Sistema
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Rol en el Sistema</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-orange-primary" />
                    <div>
                      <span className={`elegante-tag ${getRolColor(user.rol)} text-sm px-3 py-1`}>
                        {user.rol || 'No asignado'}
                      </span>
                      <p className="text-xs text-gray-lighter mt-2">Nivel de acceso al sistema</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Estado de la Cuenta</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{user.status === 'active' ? '🟢' : '🔴'}</span>
                    <div>
                      <span className={`elegante-tag text-sm px-3 py-1 ${user.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                      <p className="text-xs text-gray-lighter mt-2">
                        {user.status === 'active' ? 'Puede acceder al sistema' : 'Acceso restringido'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Fecha de Registro</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-primary" />
                    <div>
                      <p className="text-white-primary font-medium">{user.fechaCreacion || 'No especificada'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Fecha de creación en el sistema</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Seguridad y Identificación */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <Lock className="w-6 h-6 text-orange-primary" />
              Información de Seguridad y Identificación
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Contraseña del Sistema</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-orange-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white-primary font-medium text-lg tracking-widest">••••••••</p>
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">PROTEGIDA</span>
                      </div>
                      <p className="text-xs text-gray-lighter mt-1">Información confidencial del usuario</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-dark">
                    <p className="text-xs text-gray-lighter">
                      🔒 La contraseña está encriptada y no se puede visualizar por seguridad
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">ID Único del Usuario</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🆔</span>
                    <div>
                      <p className="text-white-primary font-bold text-lg">#{user.id || 'No asignado'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Identificador único en el sistema</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-dark">
                    <p className="text-xs text-gray-lighter">
                      📊 Este ID se genera automáticamente y es único para cada usuario
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas del Usuario en Barbería */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <Calendar className="w-6 h-6 text-orange-primary" />
              Estadísticas en el Sistema
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Citas Realizadas</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-white-primary font-bold text-xl">{user.citasRealizadas || 0}</p>
                      <p className="text-xs text-gray-lighter mt-1">Total de citas completadas</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Última Visita</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🕐</span>
                    <div>
                      <p className="text-white-primary font-medium">{user.ultimaVisita || 'Nunca'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Fecha de última cita</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Servicios Favoritos</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✂️</span>
                    <div>
                      <p className="text-white-primary font-medium">{user.servicioFavorito || 'No registrado'}</p>
                      <p className="text-xs text-gray-lighter mt-1">Servicio más solicitado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional del Usuario */}
          <div className="bg-gray-darker rounded-lg p-6 border border-gray-dark">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <User className="w-6 h-6 text-orange-primary" />
              Información Adicional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Notas del Cliente</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <p className="text-white-primary font-medium text-sm">
                    {user.notas || 'Sin notas registradas para este usuario.'}
                  </p>
                  <p className="text-xs text-gray-lighter mt-2">Comentarios y observaciones especiales</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-lighter font-medium">Preferencias</Label>
                <div className="bg-gray-darkest p-4 rounded-lg border border-gray-dark">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-lighter text-sm">Barbero Preferido:</span>
                      <span className="text-white-primary text-sm">{user.barberoPreferido || 'Sin preferencia'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-lighter text-sm">Horario Preferido:</span>
                      <span className="text-white-primary text-sm">{user.horarioPreferido || 'Flexible'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-lighter text-sm">Notificaciones:</span>
                      <span className="text-white-primary text-sm">{user.recibirNotificaciones === false ? 'Desactivadas' : 'Activadas'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Datos Completos */}
          <div className="bg-gradient-to-r from-gray-darker to-gray-dark rounded-lg p-6 border border-orange-primary/30">
            <h4 className="font-semibold text-white-primary mb-6 flex items-center gap-2 text-lg">
              <Eye className="w-6 h-6 text-orange-primary" />
              Resumen de Datos Completos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Nombre:</strong>
                <span className="text-white-primary ml-2">{`${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Documento:</strong>
                <span className="text-white-primary ml-2">{user.tipoDocumento || 'N/A'} #{user.documento || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Email:</strong>
                <span className="text-white-primary ml-2 break-all">{user.correo || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Teléfono:</strong>
                <span className="text-white-primary ml-2">{user.celular || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Dirección:</strong>
                <span className="text-white-primary ml-2">{user.direccion || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Barrio:</strong>
                <span className="text-white-primary ml-2">{user.barrio || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Nacimiento:</strong>
                <span className="text-white-primary ml-2">{user.fechaNacimiento || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Edad:</strong>
                <span className="text-white-primary ml-2">{calculateAge(user.fechaNacimiento)}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Rol:</strong>
                <span className="text-white-primary ml-2">{user.rol || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Estado:</strong>
                <span className="text-white-primary ml-2">{user.status === 'active' ? '🟢 Activo' : '🔴 Inactivo'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Registro:</strong>
                <span className="text-white-primary ml-2">{user.fechaCreacion || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">ID Sistema:</strong>
                <span className="text-white-primary ml-2">#{user.id || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Avatar:</strong>
                <span className="text-white-primary ml-2">{user.avatar || 'N/A'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Imagen URL:</strong>
                <span className="text-white-primary ml-2 break-all text-xs">{user.imagenUrl || 'Sin imagen'}</span>
              </div>
              <div className="bg-gray-darkest/50 p-3 rounded border border-gray-dark/50">
                <strong className="text-orange-primary">Citas:</strong>
                <span className="text-white-primary ml-2">{user.citasRealizadas || 0} completadas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-dark">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-dark rounded-lg text-gray-lightest hover:bg-gray-darker transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(user);
            }}
            className="elegante-button-primary"
          >
            Editar Usuario
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}