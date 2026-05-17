# 📧 CONFIGURACIÓN DE ENVÍO DE EMAILS

## 🎯 FUNCIONALIDAD

El sistema ahora envía **emails automáticos** a los clientes cuando se crea su área de cliente, incluyendo:

- ✅ Credenciales de acceso (email y clave)
- ✅ Enlace directo al login
- ✅ Instrucciones de uso
- ✅ Información de contacto

---

## 🚀 MODO ACTUAL: DEMO

**Por defecto, el sistema está en MODO DEMO:**
- ✅ Los emails se **simulan** pero no se envían realmente
- ✅ Puedes ver el contenido completo en la consola del navegador
- ✅ Se muestra un modal con los detalles del email
- ✅ Perfecto para **testing y demos**

---

## 📨 CONFIGURAR EMAILJS (ENVÍO REAL)

Para enviar emails **reales** de forma gratuita usando EmailJS:

### **Paso 1: Crear cuenta en EmailJS**

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Haz clic en "Sign Up" (es gratis hasta 200 emails/mes)
3. Confirma tu email

### **Paso 2: Crear un Servicio de Email**

1. En el dashboard, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Selecciona tu proveedor (Gmail, Outlook, Yahoo, etc.)
4. Sigue las instrucciones para conectar tu cuenta
5. **Copia el Service ID** (ejemplo: `service_abc123`)

### **Paso 3: Crear el Template de Email**

1. Ve a **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. Copia y pega este template:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #b8941f 0%, #d4af37 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
        }
        .credentials-box {
            background: #fafafa;
            border-left: 4px solid #b8941f;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .credentials-box strong {
            color: #b8941f;
        }
        .credentials-box code {
            background: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            display: inline-block;
            margin: 5px 0;
            border: 1px solid #e0e0e0;
        }
        .btn {
            display: inline-block;
            background: #b8941f;
            color: white !important;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .features {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .features ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .features li {
            margin: 8px 0;
        }
        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-radius: 0 0 10px 10px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 ¡Bienvenido a tu Área de Cliente!</h1>
        <p>CL FOTÓGRAFOS</p>
    </div>
    
    <div class="content">
        <p>Hola <strong>{{to_name}}</strong>,</p>
        
        <p>¡Tu área de cliente ha sido creada exitosamente! Ya puedes acceder a todas tus fotografías desde cualquier dispositivo.</p>
        
        <div class="credentials-box">
            <h3>🔐 TUS CREDENCIALES DE ACCESO</h3>
            <p><strong>📧 Email:</strong> <code>{{client_email}}</code></p>
            <p><strong>🔑 Clave de acceso:</strong> <code>{{access_code}}</code></p>
            <p><strong>📅 Fecha de creación:</strong> {{created_date}}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="{{login_url}}" class="btn">🌐 ACCEDER A MI ÁREA</a>
        </div>
        
        <div class="features">
            <h3>✨ ¿Qué puedes hacer en tu área?</h3>
            <ul>
                <li>📸 Ver y descargar todas tus fotografías</li>
                <li>📁 Organizar fotos por categorías</li>
                <li>❤️ Marcar tus favoritas</li>
                <li>📦 Descargar todo en formato ZIP</li>
                <li>📱 Acceso 24/7 desde cualquier dispositivo</li>
            </ul>
        </div>
        
        <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong>
            <ul style="margin: 10px 0;">
                <li>Guarda esta clave en un lugar seguro</li>
                <li>No compartas tus credenciales con nadie</li>
                <li>Si pierdes tu clave, contacta con nosotros</li>
            </ul>
        </div>
        
        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para ayudarte!</p>
        
        <p><strong>¡Disfruta de tus recuerdos!</strong> 📷</p>
    </div>
    
    <div class="footer">
        <p><strong>CL Fotógrafos</strong></p>
        <p>Más que fotos, guardamos tus recuerdos</p>
        <p>📧 info@clfotografos.com | 🌐 www.clfotografos.com</p>
        <p style="font-size: 12px; margin-top: 15px; color: #999;">
            Este es un email automático. Por favor, no respondas a este mensaje.
        </p>
    </div>
</body>
</html>
```

4. En "Subject", pon: `¡Bienvenido a tu Área de Cliente! - CL Fotógrafos`
5. Guarda el template
6. **Copia el Template ID** (ejemplo: `template_xyz789`)

### **Paso 4: Obtener tu Public Key**

1. Ve a **"Account" → "General"**
2. En la sección **"API Keys"**
3. **Copia tu Public Key** (ejemplo: `user_AbCdEfGhIj123456`)

### **Paso 5: Configurar el código**

Abre el archivo `js/email-service.js` y reemplaza estas líneas:

```javascript
// ANTES (modo demo):
this.config = {
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
    publicKey: 'YOUR_PUBLIC_KEY'
};

// DESPUÉS (con tus credenciales):
this.config = {
    serviceId: 'service_abc123',        // Tu Service ID
    templateId: 'template_xyz789',      // Tu Template ID
    publicKey: 'user_AbCdEfGhIj123456'  // Tu Public Key
};
```

### **Paso 6: ¡Listo!**

- ✅ Ahora los emails se enviarán **realmente**
- ✅ El cliente recibirá un email bonito con sus credenciales
- ✅ Plan gratuito: **200 emails/mes**
- ✅ Si necesitas más, puedes contratar un plan superior

---

## 🧪 PROBAR EL SISTEMA

### **Modo Demo (actual):**

1. Ve a `admin-panel.html` o `mis-clientes.html`
2. Crea un nuevo cliente
3. Se mostrará un modal con el preview del email
4. Abre la consola del navegador (F12)
5. Verás el contenido completo del email simulado

### **Modo Real (con EmailJS configurado):**

1. Crea un cliente con un email **real tuyo**
2. Espera 5-10 segundos
3. ¡Revisa tu bandeja de entrada!
4. Deberías recibir el email de bienvenida

---

## 🎨 PERSONALIZACIÓN DEL EMAIL

Puedes personalizar el template en EmailJS editando:

- **Colores:** Cambia `#b8941f` por tu color corporativo
- **Logo:** Añade tu logo en la cabecera
- **Textos:** Modifica el contenido según tu estilo
- **Enlaces:** Añade redes sociales, teléfono, etc.

### Variables disponibles:

- `{{to_name}}` - Nombre del cliente
- `{{to_email}}` - Email del cliente
- `{{client_email}}` - Email para login
- `{{access_code}}` - Clave de acceso
- `{{login_url}}` - URL del área de clientes
- `{{created_date}}` - Fecha de creación

---

## ⚙️ OPCIONES AVANZADAS

### **Activar/desactivar emails:**

En `js/email-service.js`, puedes crear un toggle:

```javascript
// Al inicio del archivo
const EMAIL_ENABLED = true; // Cambiar a false para desactivar

// En la función sendWelcomeEmail
if (!EMAIL_ENABLED) {
    console.log('📧 Emails desactivados');
    return { success: true, message: 'Emails desactivados' };
}
```

### **Diferentes templates:**

Puedes crear múltiples templates para diferentes situaciones:

- **Bienvenida:** `template_bienvenida`
- **Recuperar clave:** `template_recuperar`
- **Fotos listas:** `template_fotos_listas`
- **Galería compartida:** `template_compartir`

---

## 🆓 ALTERNATIVAS A EMAILJS

Si no quieres usar EmailJS, otras opciones son:

### **1. SendGrid (15,000 emails/mes gratis)**
- Más profesional
- API más compleja
- Requiere verificación de dominio

### **2. Mailgun (100 emails/día gratis)**
- API potente
- Documentación excelente
- Bueno para producción

### **3. Resend (3,000 emails/mes gratis)**
- Moderno y sencillo
- Interfaz limpia
- Buena documentación

### **4. Backend propio**
- Control total
- Usar Nodemailer con Node.js
- SMTP de tu proveedor

---

## 📊 LÍMITES Y COSTOS

### **EmailJS:**
- ✅ **Gratis:** 200 emails/mes
- 💰 **Personal:** $9/mes → 1,000 emails/mes
- 💰 **Pro:** $35/mes → 10,000 emails/mes

### **Consejos:**
- Usa el plan gratuito para demos y pequeños proyectos
- Para producción, considera un plan de pago
- Monitorea el uso en el dashboard de EmailJS

---

## ❓ PROBLEMAS COMUNES

### **Los emails van a spam:**

1. Verifica tu dominio en EmailJS
2. Configura SPF y DKIM records
3. Usa un email corporativo (no @gmail.com)
4. Añade "no-reply@tudominio.com"

### **Error "Invalid public key":**

- Revisa que copiaste correctamente el Public Key
- Asegúrate de que no hay espacios extra
- Prueba regenerando la clave en EmailJS

### **"Template not found":**

- Verifica el Template ID
- Asegúrate de que el template está activo
- Revisa que las variables coinciden

---

## 📝 NOTAS FINALES

- ✅ **Modo Demo:** Perfecto para desarrollo y testing
- ✅ **EmailJS:** Ideal para prototipos y pequeños proyectos
- ✅ **Producción:** Considera un backend con SendGrid/Mailgun
- ✅ **GDPR:** Añade política de privacidad y consentimiento

---

## 🎉 ¡LISTO!

Ahora tu sistema puede:
1. ✅ Crear áreas de cliente
2. ✅ Enviar emails automáticos
3. ✅ Notificar con toasts
4. ✅ Mostrar preview del email
5. ✅ Funcionar en modo demo o real

**¿Necesitas ayuda?** Revisa la consola del navegador para mensajes de debug detallados.
