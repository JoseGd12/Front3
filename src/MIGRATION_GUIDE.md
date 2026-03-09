# 📋 Guía de Migración a Estructura Feature-Based

## ⚠️ IMPORTANTE: Hacer Backup Antes de Empezar

```bash
# Crear una copia de seguridad del proyecto
cp -r . ../edwin-barberia-backup
```

## 🗂️ Estructura Nueva vs Antigua

### Antes:
```
/
├── App.tsx
├── components/
│   ├── AuthContext.tsx
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx
│   ├── pages/
│   └── ui/
└── styles/
```

### Después:
```
/src/
├── App.tsx
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── agendamiento/
│   ├── servicios/
│   ├── productos/
│   ├── ventas/
│   ├── clientes/
│   ├── inventario/
│   ├── administracion/
│   ├── horarios/
│   └── paquetes/
└── shared/
    ├── components/ui/
    ├── contexts/
    ├── utils/
    └── styles/
```

## 🚀 Pasos de Migración

### Paso 1: Crear la estructura de carpetas

```bash
# Crear carpeta src si no existe
mkdir -p src

# Crear estructura de features
mkdir -p src/features/auth/{components,contexts}
mkdir -p src/features/dashboard/{components,pages}
mkdir -p src/features/agendamiento/{components,pages}
mkdir -p src/features/servicios/pages
mkdir -p src/features/productos/pages
mkdir -p src/features/ventas/pages
mkdir -p src/features/clientes/{components,pages}
mkdir -p src/features/inventario/{components/entrega-insumos,pages}
mkdir -p src/features/administracion/{components/{users,barberos},pages}
mkdir -p src/features/horarios/pages
mkdir -p src/features/paquetes/pages

# Crear estructura shared
mkdir -p src/shared/components/{ui,figma}
mkdir -p src/shared/{contexts,utils,styles}
```

### Paso 2: Mover archivos AUTH

```bash
# Contexto y componentes de autenticación
mv components/AuthContext.tsx src/features/auth/contexts/
mv components/LoginPageSimplified.tsx src/features/auth/components/
mv components/LoginPage.tsx src/features/auth/components/
mv components/LoginPageFixed.tsx src/features/auth/components/
mv components/LoginPageNew.tsx src/features/auth/components/
mv components/LoginPageSimple.tsx src/features/auth/components/
mv components/RegisterPage.tsx src/features/auth/components/
mv components/ForgotPasswordPage.tsx src/features/auth/components/
mv components/PasswordResetPage.tsx src/features/auth/components/
mv components/PasswordResetStandalone.tsx src/features/auth/components/
```

### Paso 3: Mover archivos DASHBOARD

```bash
mv components/Dashboard.tsx src/features/dashboard/components/
mv components/pages/DashboardPage.tsx src/features/dashboard/pages/
```

### Paso 4: Mover archivos AGENDAMIENTO

```bash
mv components/pages/AgendamientoPage.tsx src/features/agendamiento/pages/
mv components/pages/AgendamientoPageAdvanced.tsx src/features/agendamiento/pages/
mv components/pages/AgendamientoPageGoogleCalendar.tsx src/features/agendamiento/pages/
mv components/pages/NuevaCitaComponent.tsx src/features/agendamiento/components/
mv components/NuevaCitaCliente.tsx src/features/agendamiento/components/
mv components/EmailSimulatorCita.tsx src/features/agendamiento/components/
```

### Paso 5: Mover archivos SERVICIOS

```bash
mv components/pages/ServiciosPage.tsx src/features/servicios/pages/
mv components/pages/ClienteServiciosPage.tsx src/features/servicios/pages/
```

### Paso 6: Mover archivos PRODUCTOS

```bash
mv components/pages/ProductosPage.tsx src/features/productos/pages/
mv components/pages/ProductosPageUpdated.tsx src/features/productos/pages/
```

### Paso 7: Mover archivos VENTAS

```bash
mv components/pages/VentasPage.tsx src/features/ventas/pages/
mv components/pages/VentasPageComplete.tsx src/features/ventas/pages/
mv components/pages/DevolucionesPage.tsx src/features/ventas/pages/
mv components/pages/DevolucionesPageUpdated.tsx src/features/ventas/pages/
mv components/pages/NotasCreditoPage.tsx src/features/ventas/pages/
```

### Paso 8: Mover archivos CLIENTES

```bash
mv components/ClienteDashboard.tsx src/features/clientes/components/
mv components/ClienteDashboardSimple.tsx src/features/clientes/components/
mv components/pages/ClientesPage.tsx src/features/clientes/pages/
mv components/pages/ClientesPageWithPhoto.tsx src/features/clientes/pages/
mv components/pages/ClienteMisCitasPageCalendar.tsx src/features/clientes/pages/
mv components/pages/ClienteAgendarCitaPage.tsx src/features/clientes/pages/
mv components/pages/ClienteAgendarCitaPageGoogleStyle.tsx src/features/clientes/pages/
mv components/pages/ClienteHistorialVentasPage.tsx src/features/clientes/pages/
mv components/pages/ClienteHistorialDevolucionesPage.tsx src/features/clientes/pages/
```

### Paso 9: Mover archivos INVENTARIO

```bash
mv components/pages/ComprasPage.tsx src/features/inventario/pages/
mv components/pages/ComprasPageComplete.tsx src/features/inventario/pages/
mv components/pages/ProveedoresPage.tsx src/features/inventario/pages/
mv components/pages/CategoriasPage.tsx src/features/inventario/pages/
mv components/pages/EntregaInsumosPage.tsx src/features/inventario/pages/
mv components/pages/entrega-insumos/* src/features/inventario/components/entrega-insumos/
```

### Paso 10: Mover archivos ADMINISTRACIÓN

```bash
mv components/pages/AccessPage.tsx src/features/administracion/pages/
mv components/pages/RolesPage.tsx src/features/administracion/pages/
mv components/pages/RolesPageOptimized.tsx src/features/administracion/pages/
mv components/pages/RolesPageUpdated.tsx src/features/administracion/pages/
mv components/pages/UsersPage.tsx src/features/administracion/pages/
mv components/pages/UsersPageUpdated.tsx src/features/administracion/pages/
mv components/pages/BarberosPage.tsx src/features/administracion/pages/
mv components/pages/users/* src/features/administracion/components/users/
mv components/pages/barberos/* src/features/administracion/components/barberos/
```

### Paso 11: Mover archivos HORARIOS

```bash
mv components/pages/HorariosPage.tsx src/features/horarios/pages/
mv components/pages/HorariosPageWeekly.tsx src/features/horarios/pages/
mv components/pages/ClienteHorariosPageCalendar.tsx src/features/horarios/pages/
```

### Paso 12: Mover archivos PAQUETES

```bash
mv components/pages/PaquetesPage.tsx src/features/paquetes/pages/
mv components/pages/ClientePaquetesPage.tsx src/features/paquetes/pages/
```

### Paso 13: Mover archivos SHARED

```bash
# UI Components (shadcn)
mv components/ui/* src/shared/components/ui/

# Figma Components
mv components/figma/* src/shared/components/figma/

# Contexts
mv components/ThemeContext.tsx src/shared/contexts/

# Utils
mv components/utils/* src/shared/utils/

# Styles
mv styles/* src/shared/styles/
```

### Paso 14: Mover App.tsx

```bash
mv App.tsx src/
```

### Paso 15: Limpiar carpetas vacías

```bash
rm -rf components/
rm -rf styles/
```

## 🔄 Actualización de Importaciones

Después de mover los archivos, necesitas actualizar las importaciones. Aquí están los cambios comunes:

### Importaciones de Auth:
```typescript
// Antes
import { useAuth } from './components/AuthContext';

// Después  
import { useAuth } from '../features/auth/contexts/AuthContext';
// o (desde src/)
import { useAuth } from './features/auth/contexts/AuthContext';
```

### Importaciones de UI Components:
```typescript
// Antes
import { Button } from './components/ui/button';

// Después (desde cualquier feature)
import { Button } from '../../../shared/components/ui/button';
// o (desde src/)
import { Button } from './shared/components/ui/button';
```

### Importaciones de Theme:
```typescript
// Antes
import { useTheme } from './components/ThemeContext';

// Después
import { useTheme } from '../shared/contexts/ThemeContext';
```

### Importaciones de Utils:
```typescript
// Antes
import { useThemeColors } from './components/utils/themeColors';

// Después  
import { useThemeColors } from '../../../shared/utils/themeColors';
```

## 🛠️ Usar VS Code para Actualizar Importaciones Automáticamente

1. Abre VS Code
2. Presiona `Ctrl + Shift + H` (Find and Replace en todos los archivos)
3. Busca: `from './components/ui/`
4. Reemplaza por: `from '../../../shared/components/ui/`
5. Revisa los cambios y confirma

Repite para cada patrón de importación.

## ✅ Verificación Final

```bash
# Verificar que la estructura esté correcta
tree src/

# Intentar compilar el proyecto
npm run build

# Ejecutar el proyecto
npm run dev
```

## 🐛 Solución de Problemas Comunes

### Error: Cannot find module

Revisa las rutas de importación. Usa rutas relativas correctas basándote en la ubicación del archivo.

### Error: Module not found en archivos UI

Asegúrate de que todos los archivos de `components/ui/` estén en `src/shared/components/ui/`.

### Las importaciones son muy largas (../../../)

Considera configurar path aliases en `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@features': path.resolve(__dirname, './src/features'),
    },
  },
});
```

Luego puedes importar así:
```typescript
import { Button } from '@shared/components/ui/button';
import { useAuth } from '@features/auth/contexts/AuthContext';
```

## 📝 Notas Adicionales

- Los archivos ya creados en `/src/` están listos para usar
- El archivo `/src/App.tsx` ya tiene las importaciones actualizadas
- Revisa cada archivo después de moverlo para actualizar sus importaciones internas

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu proyecto tendrá una estructura feature-based profesional y escalable.
