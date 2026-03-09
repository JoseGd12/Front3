# Barbería App

> Sistema de gestión integral para barberías - Agendamiento, ventas, inventario y más

## 📋 Descripción

Barbería App es una solución completa de gestión empresarial diseñada específicamente para barberías modernas. Ofrece un conjunto integral de herramientas para administrar todos los aspectos del negocio desde una única plataforma.

## ✨ Características Principales

- **📅 Agendamiento de Citas**: Sistema completo de reservas con calendario interactivo
- **👥 Gestión de Clientes**: Base de datos de clientes con historial completo
- **💈 Gestión de Barberos**: Administración de personal y horarios
- **💰 Ventas y Facturación**: Sistema POS integrado para ventas de productos y servicios
- **📦 Control de Inventario**: Gestión de productos, stock y proveedores
- **📊 Reportes y Análisis**: Dashboard con métricas y estadísticas del negocio
- **🔐 Sistema de Roles**: Control de acceso basado en roles (Admin/Cliente)
- **🌓 Tema Claro/Oscuro**: Interfaz moderna con soporte para temas

## 🚀 Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS (via index.css)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Date Picker**: React Day Picker
- **Notifications**: Sonner

## 📦 Instalación

### Prerequisitos

- Node.js 18+ 
- npm o yarn

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd FRONTT
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

4. Abrir en el navegador:
```
http://localhost:3000
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Genera el build de producción
- `npm run preview` - Previsualiza el build de producción
- `npm run type-check` - Verifica tipos de TypeScript sin generar archivos

## 📁 Estructura del Proyecto

```
FRONTT/
├── src/
│   ├── components/        # Componentes React
│   │   ├── pages/        # Páginas principales
│   │   ├── ui/           # Componentes UI reutilizables
│   │   └── utils/        # Utilidades
│   ├── assets/           # Imágenes y recursos estáticos
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Punto de entrada
│   └── index.css         # Estilos globales
├── build/                # Build de producción
├── public/               # Archivos públicos estáticos
├── index.html            # HTML principal
├── vite.config.ts        # Configuración de Vite
├── tsconfig.json         # Configuración de TypeScript
└── package.json          # Dependencias y scripts
```

## 🎨 Características de la Interfaz

- Diseño responsive optimizado para desktop y móvil
- Componentes accesibles siguiendo estándares ARIA
- Animaciones suaves y transiciones
- Tema oscuro/claro con persistencia
- Interfaz intuitiva y moderna

## 🔒 Sistema de Autenticación

La aplicación incluye un sistema de autenticación con:
- Login seguro
- Recuperación de contraseña
- Roles de usuario (Admin/Cliente)
- Dashboards personalizados por rol

## 📱 Módulos Principales

### Para Administradores
- Dashboard con métricas generales
- Gestión completa de citas
- Administración de clientes y barberos
- Control de inventario y compras
- Gestión de ventas y devoluciones
- Reportes y análisis
- Configuración de servicios y paquetes
- Control de acceso y roles

### Para Clientes
- Agendar nuevas citas
- Ver historial de citas
- Consultar servicios disponibles
- Ver paquetes y promociones
- Historial de compras

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👤 Autor

**Jose**

## 🙏 Agradecimientos

- Diseño original basado en Figma: [Barbería - copia uno](https://www.figma.com/design/UZJ9bexmmQHJj1qKjCCfj7/Barber%C3%ADa--copia-uno-)
- Radix UI por los componentes accesibles
- Lucide por los iconos