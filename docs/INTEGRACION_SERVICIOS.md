# 🔗 INTEGRACIÓN DE SERVICIOS - CL Fotógrafos

## 📋 ARCHIVOS CREADOS

1. ✅ `js/config.js` - Configuración centralizada
2. ✅ `js/auth.js` - Servicio de autenticación
3. ✅ `js/db.js` - Servicio de base de datos
4. ✅ `js/upload.js` - Servicio de subida a R2
5. ✅ `js/gallery.js` - Servicio de visualización de galerías

---

## 🔧 PASO 1: Cargar Scripts en tus HTML

### En `area-clientes.html` (Login):

```html
<head>
    <!-- ... otros scripts ... -->
    
    <!-- Cargar servicios en orden -->
    <script src="js/config.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/db.js"></script>
</head>
```

### En `admin-panel.html` y `mis-clientes.html`:

```html
<head>
    <!-- ... otros scripts ... -->
    
    <script src="js/config.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/db.js"></script>
    <script src="js/upload.js"></script>
</head>
```

### En `dashboard-cliente.html`:

```html
<head>
    <!-- ... otros scripts ... -->
    
    <script src="js/config.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/db.js"></script>
    <script src="js/gallery.js"></script>
</head>
```

---

## 🔐 PASO 2: Actualizar Login en `area-clientes.html`

Reemplaza la lógica de login existente con:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay sesión
    const session = await window.authService.checkSession();
    if (session) {
        if (session.type === 'admin') {
            window.location.href = 'admin-panel.html';
        } else {
            window.location.href = `dashboard-cliente.html?key=${session.accessCode}`;
        }
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const accessCodeInput = document.getElementById('access-code');
    const submitButton = document.getElementById('submitButton');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = usernameInput.value.trim();
        const accessCode = accessCodeInput.value.trim();

        if (!email || !accessCode) {
            alert('Por favor, completa todos los campos');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Verificando...';

        // Intentar login como admin primero
        const adminResult = await window.authService.loginAdmin(email, accessCode);
        
        if (adminResult.success) {
            window.location.href = 'admin-panel.html';
            return;
        }

        // Si no es admin, intentar como cliente
        const clientResult = await window.authService.loginClient(email, accessCode);
        
        if (clientResult.success) {
            window.location.href = `dashboard-cliente.html?key=${clientResult.user.accessCode}`;
        } else {
            alert('Credenciales incorrectas');
            submitButton.disabled = false;
            submitButton.textContent = 'Iniciar Sesión';
        }
    });
});
```

---

## 📤 PASO 3: Actualizar Subida de Fotos en `gestor-cliente.html`

Reemplaza la lógica de subida existente con:

```javascript
// En la función que maneja el upload de archivos
async function handleFileUpload(file, category, clientId) {
    // Validar archivo
    const validation = window.uploadService.validateFile(file);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    // Mostrar progreso
    const progressBar = document.createElement('div');
    progressBar.className = 'upload-progress';
    progressBar.innerHTML = `
        <div class="progress-bar" style="width: 0%"></div>
        <span class="progress-text">0%</span>
    `;
    // Añadir progressBar al DOM donde corresponda

    // Subir imagen
    const uploadResult = await window.uploadService.uploadImage(
        file,
        clientId,
        category,
        (percent) => {
            // Actualizar barra de progreso
            progressBar.querySelector('.progress-bar').style.width = percent + '%';
            progressBar.querySelector('.progress-text').textContent = percent + '%';
        }
    );

    if (uploadResult.success) {
        // Guardar referencia en Supabase
        const saveResult = await window.dbService.savePhoto({
            clientId: clientId,
            category: category,
            r2Url: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType
        });

        if (saveResult.success) {
            // Mostrar imagen en la UI
            displayUploadedImage(uploadResult.url, category);
            
            // Notificar éxito
            if (window.notificationSystem) {
                window.notificationSystem.notify('Foto subida exitosamente', 'success');
            }
        } else {
            alert('Error al guardar la referencia de la foto');
        }
    } else {
        alert('Error al subir la imagen: ' + uploadResult.message);
    }

    // Remover barra de progreso
    progressBar.remove();
}
```

---

## 🖼️ PASO 4: Actualizar Visualización en `dashboard-cliente.html`

Reemplaza la lógica de carga de fotos con:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!window.authService.protectRoute('client')) {
        return;
    }

    const user = window.authService.getCurrentUser();
    if (!user) {
        window.location.href = 'area-clientes.html';
        return;
    }

    // Obtener clientId desde la URL o del usuario
    const urlParams = new URLSearchParams(window.location.search);
    const accessCode = urlParams.get('key') || user.accessCode;

    // Cargar fotos
    const photosContainer = document.getElementById('photosGrid');
    
    // Cargar favoritos
    window.galleryService.loadFavorites(accessCode);

    // Cargar fotos del cliente
    let clientId = user.id;
    if (CONFIG.useDemoMode()) {
        clientId = accessCode; // En demo usamos accessCode
    }

    const result = await window.galleryService.loadClientPhotos(clientId, accessCode);

    if (result.success) {
        // Renderizar galería
        window.galleryService.renderGallery(photosContainer, 'all', {
            enableLightbox: true,
            enableFavorites: true,
            columns: 3,
            gap: '1rem'
        });
    } else {
        photosContainer.innerHTML = '<p>Error al cargar las fotos</p>';
    }

    // Manejar cambio de categoría
    const categorySelector = document.getElementById('categorySelector');
    if (categorySelector) {
        categorySelector.addEventListener('change', (e) => {
            const category = e.target.value;
            window.galleryService.renderGallery(photosContainer, category, {
                enableLightbox: true,
                enableFavorites: true
            });
        });
    }
});
```

---

## 👥 PASO 5: Actualizar Creación de Clientes en `admin-panel.html`

Reemplaza la lógica de creación de clientes con:

```javascript
async function createNewClient(clientData) {
    // Generar access_code único
    const accessCode = generateAccessCode();

    const newClient = {
        username: clientData.name,
        email: clientData.email,
        accessCode: accessCode,
        categories: clientData.categories || []
    };

    // Crear cliente en Supabase
    const result = await window.dbService.createClient(newClient);

    if (result.success) {
        // Enviar email de bienvenida (si está configurado)
        if (window.emailService) {
            await window.emailService.sendWelcomeEmail({
                ...newClient,
                id: result.data.id
            });
        }

        // Notificar éxito
        if (window.notificationSystem) {
            window.notificationSystem.notify('Cliente creado exitosamente', 'success');
        }

        // Recargar lista de clientes
        loadClientsList();
    } else {
        alert('Error al crear el cliente: ' + result.message);
    }
}

function generateAccessCode() {
    const prefix = 'BODA';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
}
```

---

## 🔒 PASO 6: Proteger Rutas

Añade al inicio de cada página protegida:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const user = window.authService.getCurrentUser();
    
    if (!user) {
        window.location.href = 'area-clientes.html';
        return;
    }

    // Verificar tipo de usuario según la página
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('admin') || currentPath.includes('gestor')) {
        if (user.type !== 'admin') {
            window.location.href = 'area-clientes.html';
            return;
        }
    } else if (currentPath.includes('dashboard-cliente')) {
        if (user.type !== 'client') {
            window.location.href = 'area-clientes.html';
            return;
        }
    }

    // Continuar con la lógica de la página...
});
```

---

## 🎨 ESTILOS ADICIONALES PARA LA GALERÍA

Añade estos estilos en `css/style.css`:

```css
/* Gallery Grid */
.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem 0;
}

.gallery-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
}

.gallery-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.gallery-item:hover .gallery-image {
    transform: scale(1.05);
}

.favorite-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 10;
}

.favorite-btn.active {
    color: #e6007e;
}

.favorite-btn:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
}

/* Responsive */
@media (max-width: 768px) {
    .gallery-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.5rem;
    }
}
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Configurar `js/config.js` con credenciales reales
- [ ] Ejecutar SQL en Supabase (ver `SETUP_SUPABASE_R2.md`)
- [ ] Configurar CORS en Cloudflare R2
- [ ] Cargar scripts en todos los HTML necesarios
- [ ] Actualizar lógica de login en `area-clientes.html`
- [ ] Actualizar lógica de subida en `gestor-cliente.html`
- [ ] Actualizar lógica de visualización en `dashboard-cliente.html`
- [ ] Actualizar creación de clientes en `admin-panel.html`
- [ ] Añadir protección de rutas
- [ ] Añadir estilos CSS para galería
- [ ] Probar flujo completo: Login → Subir foto → Ver galería

---

## 🐛 DEBUGGING

Si algo no funciona:

1. **Abre la consola del navegador (F12)**
2. **Verifica que todos los scripts se carguen correctamente**
3. **Revisa los errores en la consola**
4. **Verifica que las credenciales en `config.js` sean correctas**
5. **Asegúrate de que el modo demo esté funcionando si no has configurado aún**

---

## 📚 PRÓXIMOS PASOS

Una vez integrado todo:

1. Probar el flujo completo
2. Optimizar imágenes antes de subir (comprimir)
3. Implementar paginación para galerías grandes
4. Añadir cache para mejorar rendimiento
5. Considerar usar Cloudflare Workers como backend intermedio para mayor seguridad
