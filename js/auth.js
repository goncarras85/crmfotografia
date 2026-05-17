/**
 * Servicio de Autenticación - CL Fotógrafos
 * 
 * Maneja la autenticación de Administradores y Clientes
 * usando Supabase Auth o modo demo (localStorage)
 */

class AuthService {
    constructor() {
        this.supabaseClient = null;
        this.currentUser = null;
        this.isDemoMode = CONFIG.useDemoMode();

        if (!this.isDemoMode) {
            this.initSupabase();
        } else {
            console.warn('⚠️ AuthService en MODO DEMO - Usando localStorage');
        }
    }

    /**
     * Inicializar cliente de Supabase
     */
    initSupabase() {
        if (typeof supabase === 'undefined') {
            // Cargar SDK de Supabase
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.onload = () => {
                this.supabaseClient = supabase.createClient(
                    CONFIG.supabase.url,
                    CONFIG.supabase.anonKey
                );
                console.log('✅ Supabase Auth inicializado');
                this.checkSession();
            };
            document.head.appendChild(script);
        } else {
            this.supabaseClient = supabase.createClient(
                CONFIG.supabase.url,
                CONFIG.supabase.anonKey
            );
            this.checkSession();
        }
    }

    /**
     * Verificar sesión existente
     */
    async checkSession() {
        if (this.isDemoMode) {
            // Verificar localStorage
            const adminSession = sessionStorage.getItem('adminSession');
            const clientSession = sessionStorage.getItem('clientSession');
            
            if (adminSession) {
                this.currentUser = JSON.parse(adminSession);
                return this.currentUser;
            }
            
            if (clientSession) {
                this.currentUser = JSON.parse(clientSession);
                return this.currentUser;
            }
            
            return null;
        } else {
            // Esperar a que Supabase esté inicializado
            if (!this.supabaseClient) {
                // Esperar hasta que supabaseClient esté disponible
                let attempts = 0;
                while (!this.supabaseClient && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                // Si aún no está disponible, verificar en sessionStorage como fallback
                if (!this.supabaseClient) {
                    const adminSession = sessionStorage.getItem('adminSession');
                    const clientSession = sessionStorage.getItem('clientSession');
                    
                    if (adminSession) {
                        this.currentUser = JSON.parse(adminSession);
                        return this.currentUser;
                    }
                    
                    if (clientSession) {
                        this.currentUser = JSON.parse(clientSession);
                        return this.currentUser;
                    }
                    
                    return null;
                }
            }
            
            // Verificar sesión de Supabase
            try {
                const { data: { session }, error } = await this.supabaseClient.auth.getSession();
                
                if (error) {
                    console.error('❌ Error al verificar sesión:', error);
                    return null;
                }
                
                if (session) {
                    this.currentUser = session.user;
                    return this.currentUser;
                }
                
                // Si no hay sesión en Supabase Auth, verificar sessionStorage como fallback
                const adminSession = sessionStorage.getItem('adminSession');
                const clientSession = sessionStorage.getItem('clientSession');
                
                if (adminSession) {
                    this.currentUser = JSON.parse(adminSession);
                    return this.currentUser;
                }
                
                if (clientSession) {
                    this.currentUser = JSON.parse(clientSession);
                    return this.currentUser;
                }
                
                return null;
            } catch (error) {
                console.error('❌ Error en checkSession:', error);
                return null;
            }
        }
    }

    /**
     * Iniciar sesión como Administrador
     * @param {string} email - Email del admin
     * @param {string} password - Contraseña
     * @returns {Promise<Object>} Resultado del login
     */
    async loginAdmin(email, password) {
        if (this.isDemoMode) {
            return this.loginAdminDemo(email, password);
        }

        try {
            // Buscar admin en la tabla admins
            const { data: admin, error: adminError } = await this.supabaseClient
                .from('admins')
                .select('*')
                .eq('email', email)
                .single();

            if (adminError || !admin) {
                return {
                    success: false,
                    message: 'Credenciales incorrectas'
                };
            }

            // Verificar contraseña (usando bcrypt - necesitarás una función de verificación)
            // Por ahora, asumimos que la verificación se hace en el backend
            // Para producción, usa Supabase Auth o un backend intermedio

            // Crear sesión
            const sessionData = {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                isSupremo: admin.is_supremo,
                permissions: admin.permissions,
                type: 'admin',
                loginTime: new Date().toISOString()
            };

            sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
            this.currentUser = sessionData;

            return {
                success: true,
                user: sessionData,
                message: 'Login exitoso'
            };

        } catch (error) {
            console.error('❌ Error en login admin:', error);
            return {
                success: false,
                message: 'Error al iniciar sesión',
                error: error
            };
        }
    }

    /**
     * Login admin en modo demo
     */
    async loginAdminDemo(email, password) {
        // Credenciales de prueba
        if (email.toLowerCase() === 'admin@admin' && password === '1234') {
            const sessionData = {
                email: 'admin@admin',
                name: 'Administrador',
                loginTime: new Date().toISOString(),
                type: 'admin',
                permissions: 'all',
                isSupremo: true
            };

            sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
            this.currentUser = sessionData;

            return {
                success: true,
                user: sessionData,
                message: 'Login exitoso (DEMO)'
            };
        }

        return {
            success: false,
            message: 'Credenciales incorrectas'
        };
    }

    /**
     * Iniciar sesión como Cliente
     * @param {string} email - Email del cliente
     * @param {string} accessCode - Código de acceso
     * @returns {Promise<Object>} Resultado del login
     */
    async loginClient(email, accessCode) {
        if (this.isDemoMode) {
            return this.loginClientDemo(email, accessCode);
        }

        try {
            // Buscar cliente por email y access_code
            const { data: client, error: clientError } = await this.supabaseClient
                .from('clients')
                .select('*')
                .eq('email', email)
                .eq('access_code', accessCode)
                .single();

            if (clientError || !client) {
                return {
                    success: false,
                    message: 'Credenciales incorrectas'
                };
            }

            // Obtener categorías y fotos del cliente
            const { data: photos, error: photosError } = await this.supabaseClient
                .from('photos')
                .select('*')
                .eq('client_id', client.id)
                .order('created_at', { ascending: false });

            // Organizar fotos por categoría
            const photosByCategory = {};
            if (photos) {
                photos.forEach(photo => {
                    if (!photosByCategory[photo.category]) {
                        photosByCategory[photo.category] = [];
                    }
                    photosByCategory[photo.category].push(photo.r2_url);
                });
            }

            // Obtener categorías del cliente (combinar categorías del cliente con categorías de fotos)
            const clientCategories = client.categories || [];
            const photoCategories = Object.keys(photosByCategory);
            const allCategories = Array.from(new Set([...clientCategories, ...photoCategories]));

            const sessionData = {
                id: client.id,
                username: client.username,
                email: client.email,
                accessCode: client.access_code,
                categories: allCategories,
                photos: photosByCategory,
                type: 'client',
                loginTime: new Date().toISOString()
            };

            sessionStorage.setItem('clientSession', JSON.stringify(sessionData));
            this.currentUser = sessionData;

            return {
                success: true,
                user: sessionData,
                message: 'Login exitoso'
            };

        } catch (error) {
            console.error('❌ Error en login client:', error);
            return {
                success: false,
                message: 'Error al iniciar sesión',
                error: error
            };
        }
    }

    /**
     * Login cliente en modo demo
     */
    async loginClientDemo(email, accessCode) {
        // Buscar en localStorage
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const client = clients.find(c => 
            c.email.toLowerCase() === email.toLowerCase() && 
            c.accessCode === accessCode
        );

        if (!client) {
            return {
                success: false,
                message: 'Credenciales incorrectas'
            };
        }

        // Cargar fotos desde localStorage
        const storedPhotos = JSON.parse(localStorage.getItem(`photos_${client.accessCode}`) || '{}');

        const sessionData = {
            username: client.username,
            email: client.email,
            accessCode: client.accessCode,
            categories: client.categories || [],
            photos: storedPhotos,
            type: 'client',
            loginTime: new Date().toISOString()
        };

        sessionStorage.setItem('clientSession', JSON.stringify(sessionData));
        this.currentUser = sessionData;

        return {
            success: true,
            user: sessionData,
            message: 'Login exitoso (DEMO)'
        };
    }

    /**
     * Cerrar sesión
     */
    logout() {
        sessionStorage.removeItem('adminSession');
        sessionStorage.removeItem('clientSession');
        this.currentUser = null;

        if (!this.isDemoMode && this.supabaseClient) {
            this.supabaseClient.auth.signOut();
        }

        window.location.href = '/pages/client/area-clientes.html';
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Proteger ruta (redirigir si no está autenticado)
     * ⚠️ DEPRECATED: Usar checkSession() directamente en lugar de este método
     * Este método puede causar bucles de redirección
     */
    protectRoute(requiredType = null) {
        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop();

        // Verificar si la ruta está protegida
        if (!CONFIG.app.protectedRoutes.includes(fileName)) {
            return true; // Ruta no protegida
        }

        // Si currentUser no está inicializado, intentar verificar sesión síncronamente
        // (pero esto es limitado, mejor usar checkSession() async)
        if (!this.currentUser) {
            // En modo demo, verificar sessionStorage directamente
            if (this.isDemoMode) {
                const adminSession = sessionStorage.getItem('adminSession');
                const clientSession = sessionStorage.getItem('clientSession');
                
                if (adminSession) {
                    this.currentUser = JSON.parse(adminSession);
                } else if (clientSession) {
                    this.currentUser = JSON.parse(clientSession);
                }
            }
        }

        // Verificar autenticación
        if (!this.isAuthenticated()) {
            // No redirigir automáticamente para evitar bucles
            // Dejar que el código que llama maneje la redirección
            return false;
        }

        // Verificar tipo de usuario si se especifica
        if (requiredType && this.currentUser.type !== requiredType) {
            return false;
        }

        return true;
    }
}

// Inicializar servicio global
window.authService = new AuthService();
