# 📁 CL Fotógrafos - Estructura del Proyecto

## 🗂️ Organización de Archivos

El proyecto está organizado en carpetas por categorías para facilitar el mantenimiento:

```
demo_cl/
├── pages/                    # Todas las páginas HTML
│   ├── public/              # Páginas públicas (acceso libre)
│   │   ├── index.html       # Página principal
│   │   ├── contacto.html    # Formulario de contacto
│   │   ├── servicios.html   # Tarifas y servicios
│   │   ├── nosotros.html    # Sobre nosotros
│   │   └── galeria-publica.html
│   │
│   ├── admin/               # Panel de administración
│   │   ├── admin-panel.html      # Dashboard principal
│   │   ├── mis-clientes.html      # Gestión de clientes
│   │   ├── gestor-cliente.html   # Subir fotos por cliente
│   │   └── ajustes-admin.html   # Configuración del admin
│   │
│   ├── client/              # Área de clientes
│   │   ├── area-clientes.html   # Login de clientes
│   │   └── dashboard-cliente.html # Galería del cliente
│   │
├── components/              # Componentes HTML reutilizables
│   ├── header.html          # Header principal (navegación)
│   ├── footer.html          # Footer del sitio
│   └── dashboard-header.html # Header del dashboard
│
├── js/                      # Scripts JavaScript
│   ├── config.js           # Configuración (Supabase, R2)
│   ├── auth.js             # Autenticación
│   ├── db.js               # Base de datos (Supabase)
│   ├── upload.js           # Subida a Cloudflare R2
│   ├── gallery.js          # Visualización de galerías
│   ├── email-service.js    # Envío de emails
│   ├── notifications.js    # Sistema de notificaciones
│   ├── include.js          # Inclusión de componentes
│   ├── mobile-menu.js      # Menú móvil
│   └── main.js             # Script principal
│
├── css/                     # Estilos
│   └── style.css           # Estilos principales
│
├── img/                     # Imágenes estáticas
│   └── premio.PNG
│
└── docs/                    # Documentación
    ├── SETUP_SUPABASE_R2.md        # Configuración de Supabase y R2
    ├── INTEGRACION_SERVICIOS.md    # Guía de integración
    ├── LISTO_PARA_USAR.md          # Guía rápida
    ├── CONFIGURAR_EMAIL.md         # Configuración de emails
    ├── PRUEBA_RAPIDA_EMAILS.md     # Pruebas de emails
    └── NUEVAS_FUNCIONALIDADES.md   # Changelog
```

---

## 🚀 Páginas Principales

### Públicas (`pages/public/`)
- **`index.html`** - Página de inicio
- **`contacto.html`** - Formulario de contacto
- **`servicios.html`** - Tarifas y servicios
- **`nosotros.html`** - Sobre la empresa
- **`galeria-publica.html`** - Galerías compartidas

### Admin (`pages/admin/`)
- **`admin-panel.html`** - Dashboard principal del admin
- **`mis-clientes.html`** - Lista y creación de clientes
- **`gestor-cliente.html`** - Subir y gestionar fotos por cliente
- **`ajustes-admin.html`** - Configuración del administrador

### Cliente (`pages/client/`)
- **`area-clientes.html`** - Login de clientes y administradores
- **`dashboard-cliente.html`** - Galería privada del cliente


---

## 📝 Rutas Relativas

### Desde `pages/public/`:
- CSS: `../../css/style.css`
- JS: `../../js/script.js`
- Components: `../../components/header.html`
- Otras páginas públicas: `contacto.html` (mismo directorio)
- Admin: `../admin/admin-panel.html`
- Cliente: `../client/area-clientes.html`

### Desde `pages/admin/`:
- CSS: `../../css/style.css`
- JS: `../../js/script.js`
- Components: `../../components/header.html`
- Otras páginas admin: `mis-clientes.html` (mismo directorio)
- Cliente: `../client/area-clientes.html`
- Público: `../public/index.html`

### Desde `pages/client/`:
- CSS: `../../css/style.css`
- JS: `../../js/script.js`
- Components: `../../components/header.html`
- Admin: `../admin/admin-panel.html`
- Público: `../public/index.html`

---

## 🔧 Servicios JavaScript

Todos los servicios están en `js/`:

- **`config.js`** - Configuración centralizada (Supabase, R2)
- **`auth.js`** - Autenticación y protección de rutas
- **`db.js`** - Operaciones con Supabase (CRUD)
- **`upload.js`** - Subida de imágenes a Cloudflare R2
- **`gallery.js`** - Visualización de galerías
- **`email-service.js`** - Envío de emails (EmailJS)
- **`notifications.js`** - Sistema de notificaciones toast

---

## 📚 Documentación

Toda la documentación está en `docs/`:

- **`SETUP_SUPABASE_R2.md`** - Configuración paso a paso
- **`INTEGRACION_SERVICIOS.md`** - Detalles técnicos
- **`LISTO_PARA_USAR.md`** - Guía rápida de inicio

---

## 🎯 Puntos de Entrada

### Para Usuarios:
1. **Inicio**: `/pages/public/index.html`
2. **Login**: `/pages/client/area-clientes.html`

### Para Administradores:
1. **Login**: `/pages/client/area-clientes.html` (admin@admin / 1234)
2. **Dashboard**: `/pages/admin/admin-panel.html`

### Para Clientes:
1. **Login**: `/pages/client/area-clientes.html` (email / accessCode)
2. **Galería**: `/pages/client/dashboard-cliente.html`

---

## ⚙️ Configuración

1. **Configurar credenciales**: Edita `js/config.js`
2. **Ejecutar SQL**: Ver `docs/SETUP_SUPABASE_R2.md`
3. **Configurar CORS**: Ver `docs/SETUP_SUPABASE_R2.md`

---

## ✅ Ventajas de esta Estructura

- ✅ **Organización clara**: Fácil encontrar archivos
- ✅ **Mantenimiento simple**: Separación por funcionalidad
- ✅ **Escalable**: Fácil añadir nuevas páginas
- ✅ **Profesional**: Estructura estándar de proyectos web

---

## 🔄 Migración Completada

Todos los archivos han sido movidos y las rutas actualizadas. El proyecto está listo para usar.

**Nota**: Si usas un servidor local, asegúrate de que la raíz del servidor apunte a la carpeta `demo_cl/` para que las rutas funcionen correctamente.
