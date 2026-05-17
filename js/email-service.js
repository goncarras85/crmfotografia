/**
 * Servicio de Email
 * Envía emails a clientes usando EmailJS
 * 
 * CONFIGURACIÓN REQUERIDA:
 * 1. Crear cuenta gratuita en https://www.emailjs.com/
 * 2. Crear un servicio de email (Gmail, Outlook, etc.)
 * 3. Crear un template de email
 * 4. Copiar las claves en este archivo
 */

class EmailService {
    constructor() {
        // CONFIGURACIÓN: Reemplaza con tus credenciales de EmailJS
        this.config = {
            serviceId: 'YOUR_SERVICE_ID',      // ID del servicio de EmailJS
            templateId: 'YOUR_TEMPLATE_ID',    // ID del template
            publicKey: 'YOUR_PUBLIC_KEY'       // Public Key de EmailJS
        };
        
        // Para DEMO: simular envío sin configuración real
        this.isDemoMode = this.config.serviceId === 'YOUR_SERVICE_ID';
        
        if (this.isDemoMode) {
            console.warn('⚠️ EmailService en MODO DEMO - Los emails se simularán pero no se enviarán realmente');
            console.log('📧 Para enviar emails reales, configura EmailJS en js/email-service.js');
        } else {
            this.initEmailJS();
        }
    }

    initEmailJS() {
        // Cargar EmailJS si no está en modo demo
        if (typeof emailjs === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => {
                emailjs.init(this.config.publicKey);
                console.log('✅ EmailJS inicializado');
            };
            document.head.appendChild(script);
        }
    }

    /**
     * Enviar email de bienvenida al crear área de cliente
     * @param {Object} clientData - Datos del cliente
     * @returns {Promise<Object>} Resultado del envío
     */
    async sendWelcomeEmail(clientData) {
        const emailData = {
            to_email: clientData.email,
            to_name: clientData.username,
            client_area: clientData.username,
            client_email: clientData.email,
            access_code: clientData.accessCode,
            login_url: `${window.location.origin}/pages/client/area-clientes.html`,
            created_date: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        if (this.isDemoMode) {
            return this.simulateEmailSend(emailData);
        } else {
            return this.sendRealEmail(emailData);
        }
    }

    /**
     * Enviar email real usando EmailJS
     */
    async sendRealEmail(emailData) {
        try {
            const response = await emailjs.send(
                this.config.serviceId,
                this.config.templateId,
                emailData
            );

            console.log('✅ Email enviado correctamente', response);
            
            return {
                success: true,
                message: 'Email enviado exitosamente',
                details: response
            };
        } catch (error) {
            console.error('❌ Error al enviar email:', error);
            
            return {
                success: false,
                message: 'Error al enviar el email',
                error: error
            };
        }
    }

    /**
     * Simular envío de email (modo demo)
     */
    async simulateEmailSend(emailData) {
        console.log('📧 SIMULANDO ENVÍO DE EMAIL...');
        console.log('───────────────────────────────────────');
        console.log('Para:', emailData.to_email);
        console.log('Nombre:', emailData.to_name);
        console.log('Asunto: Bienvenido a tu Área de Cliente - CL Fotógrafos');
        console.log('───────────────────────────────────────');
        console.log('CONTENIDO DEL EMAIL:');
        console.log(this.generateEmailPreview(emailData));
        console.log('───────────────────────────────────────');

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            success: true,
            message: 'Email simulado (DEMO MODE)',
            preview: this.generateEmailPreview(emailData),
            data: emailData
        };
    }

    /**
     * Generar preview del email para consola
     */
    generateEmailPreview(data) {
        return `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            🎉 ¡BIENVENIDO A TU ÁREA DE CLIENTE! 🎉       ║
║                     CL FOTÓGRAFOS                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Hola ${data.to_name},

¡Tu área de cliente ha sido creada exitosamente!

CREDENCIALES DE ACCESO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email:        ${data.client_email}
🔑 Clave:        ${data.access_code}
🌐 Acceder en:   ${data.login_url}
📅 Fecha:        ${data.created_date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿QUÉ PUEDES HACER EN TU ÁREA?
• Ver y descargar todas tus fotografías
• Organizar fotos por categorías
• Marcar tus favoritas
• Descargar en formato ZIP
• Acceso 24/7 desde cualquier dispositivo

IMPORTANTE:
⚠️ Guarda esta clave en un lugar seguro
⚠️ No compartas tus credenciales con nadie

¿NECESITAS AYUDA?
Si tienes alguna pregunta, no dudes en contactarnos.

¡Disfruta de tus recuerdos! 📸

────────────────────────────────────────────────────────────
CL Fotógrafos - Más que fotos, guardamos tus recuerdos
www.clfotografos.com | info@clfotografos.com
        `;
    }

    /**
     * Mostrar modal con preview del email
     */
    showEmailPreviewModal(emailData, result) {
        const modal = document.createElement('div');
        modal.className = 'email-preview-modal';
        modal.innerHTML = `
            <div class="email-preview-content">
                <button class="email-preview-close" aria-label="Cerrar">&times;</button>
                
                <div class="email-preview-header">
                    <i class="fas fa-envelope-open-text"></i>
                    <h2>${result.success ? '✅ Email Enviado' : '❌ Error'}</h2>
                    <p>${result.message}</p>
                </div>

                ${this.isDemoMode ? `
                    <div class="email-demo-warning">
                        <i class="fas fa-info-circle"></i>
                        <strong>Modo Demo Activo</strong>
                        <p>Los emails se simulan pero no se envían. Para enviar emails reales, configura EmailJS.</p>
                        <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" class="btn-config-email">
                            <i class="fas fa-cog"></i> Configurar EmailJS
                        </a>
                    </div>
                ` : ''}

                <div class="email-preview-body">
                    <h3>📧 Detalles del Email:</h3>
                    <ul class="email-details">
                        <li><strong>Para:</strong> ${emailData.to_email}</li>
                        <li><strong>Nombre:</strong> ${emailData.to_name}</li>
                        <li><strong>Clave de acceso:</strong> <code>${emailData.access_code}</code></li>
                        <li><strong>URL de acceso:</strong> ${emailData.login_url}</li>
                    </ul>

                    ${this.isDemoMode ? `
                        <details class="email-preview-details">
                            <summary>📄 Ver contenido del email</summary>
                            <pre class="email-preview-text">${result.preview}</pre>
                        </details>
                    ` : ''}
                </div>

                <div class="email-preview-footer">
                    <button class="btn-primary" id="closeEmailPreview">Entendido</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeBtn = modal.querySelector('.email-preview-close');
        const closeButton = modal.querySelector('#closeEmailPreview');
        
        const closeModal = () => {
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 300);
        };

        closeBtn.addEventListener('click', closeModal);
        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Animación de entrada
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

// CSS para el modal de preview
const emailModalStyles = document.createElement('style');
emailModalStyles.textContent = `
/* Modal de Email Preview */
.email-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    padding: 1rem;
}

.email-preview-modal.active {
    opacity: 1;
}

.email-preview-modal.fade-out {
    opacity: 0;
}

.email-preview-content {
    background: var(--card-bg, #fafafa);
    border-radius: 16px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        transform: translateY(50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.email-preview-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--text-secondary, #666);
    cursor: pointer;
    transition: all 0.2s;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.email-preview-close:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text-primary, #000);
    transform: rotate(90deg);
}

.email-preview-header {
    text-align: center;
    padding: 3rem 2rem 2rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.email-preview-header i {
    font-size: 3rem;
    color: var(--gold, #b8941f);
    margin-bottom: 1rem;
}

.email-preview-header h2 {
    color: var(--text-primary, #000);
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
}

.email-preview-header p {
    color: var(--text-secondary, #666);
    margin: 0;
}

.email-demo-warning {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1.5rem;
    text-align: center;
}

.email-demo-warning i {
    font-size: 2rem;
    color: #ff9800;
    margin-bottom: 0.5rem;
}

.email-demo-warning strong {
    display: block;
    color: #856404;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.email-demo-warning p {
    color: #856404;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
}

.btn-config-email {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #ff9800;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s;
}

.btn-config-email:hover {
    background: #f57c00;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.email-preview-body {
    padding: 2rem;
}

.email-preview-body h3 {
    color: var(--text-primary, #000);
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
}

.email-details {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
}

.email-details li {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.email-details li:last-child {
    border-bottom: none;
}

.email-details strong {
    color: var(--text-primary, #000);
    min-width: 140px;
}

.email-details code {
    background: rgba(184, 148, 31, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: var(--gold, #b8941f);
    font-weight: 600;
}

.email-preview-details {
    margin-top: 1.5rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
}

.email-preview-details summary {
    background: var(--bg, #fff);
    padding: 1rem;
    cursor: pointer;
    font-weight: 600;
    color: var(--gold, #b8941f);
    user-select: none;
    transition: background 0.2s;
}

.email-preview-details summary:hover {
    background: rgba(184, 148, 31, 0.05);
}

.email-preview-text {
    background: #f5f5f5;
    padding: 1.5rem;
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    line-height: 1.6;
    color: #333;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-x: auto;
}

.email-preview-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid var(--border-color, #e0e0e0);
    text-align: center;
}

.email-preview-footer .btn-primary {
    padding: 0.875rem 2.5rem;
}

@media (max-width: 768px) {
    .email-preview-content {
        max-width: 100%;
        margin: 1rem;
    }

    .email-preview-header {
        padding: 2.5rem 1.5rem 1.5rem;
    }

    .email-preview-body {
        padding: 1.5rem;
    }

    .email-details strong {
        min-width: 100px;
        font-size: 0.9rem;
    }
}
`;
document.head.appendChild(emailModalStyles);

// Instancia global
window.emailService = new EmailService();
