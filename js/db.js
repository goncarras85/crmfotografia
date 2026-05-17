/**
 * Servicio de Base de Datos - CL Fotógrafos
 * 
 * Maneja todas las operaciones CRUD con Supabase
 * para clientes, fotos y administradores
 */

class DatabaseService {
    constructor() {
        this.supabaseClient = null;
        this.isDemoMode = CONFIG.useDemoMode();
        this.supabaseInitPromise = null;

        if (!this.isDemoMode) {
            // Inicializar Supabase inmediatamente
            this.supabaseInitPromise = this.initSupabase();
        } else {
            console.warn('⚠️ DatabaseService en MODO DEMO - Usando localStorage');
        }
    }

    /**
     * Inicializar cliente de Supabase
     */
    async initSupabase() {
        if (typeof supabase === 'undefined') {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
                script.onload = () => {
                    this.supabaseClient = supabase.createClient(
                        CONFIG.supabase.url,
                        CONFIG.supabase.anonKey
                    );
                    console.log('✅ Supabase Database inicializado');
                    resolve();
                };
                script.onerror = () => {
                    console.error('❌ Error al cargar Supabase script');
                    resolve(); // Resolver igualmente para no bloquear
                };
                document.head.appendChild(script);
            });
        } else {
            this.supabaseClient = supabase.createClient(
                CONFIG.supabase.url,
                CONFIG.supabase.anonKey
            );
            console.log('✅ Supabase Database inicializado');
            return Promise.resolve();
        }
    }

    /**
     * Asegurar que Supabase esté inicializado
     */
    async ensureSupabaseReady() {
        if (this.isDemoMode) return true;
        
        if (!this.supabaseClient) {
            await this.initSupabase();
        }
        
        return this.supabaseClient !== null;
    }

    // ============================================
    // OPERACIONES CON CLIENTS
    // ============================================

    /**
     * Crear nuevo cliente
     * @param {Object} clientData - Datos del cliente
     * @returns {Promise<Object>} Cliente creado
     */
    async createClient(clientData) {
        if (this.isDemoMode) {
            return this.createClientDemo(clientData);
        }

        try {
            const insertData = {
                username: clientData.username,
                email: clientData.email,
                access_code: clientData.accessCode
            };

            // Si hay categorías, añadirlas al insert
            if (clientData.categories && Array.isArray(clientData.categories) && clientData.categories.length > 0) {
                insertData.categories = clientData.categories;
            }

            const { data, error } = await this.supabaseClient
                .from('clients')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data,
                message: 'Cliente creado exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al crear cliente:', error);
            return {
                success: false,
                message: 'Error al crear cliente',
                error: error
            };
        }
    }

    /**
     * Crear cliente en modo demo
     */
    async createClientDemo(clientData) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        
        // Verificar si el access_code ya existe
        if (clients.some(c => c.accessCode === clientData.accessCode)) {
            return {
                success: false,
                message: 'La clave de acceso ya existe'
            };
        }

        const newClient = {
            id: 'demo_' + Date.now(),
            username: clientData.username,
            email: clientData.email,
            accessCode: clientData.accessCode,
            categories: clientData.categories || [],
            createdAt: new Date().toISOString()
        };

        clients.push(newClient);
        localStorage.setItem('clients', JSON.stringify(clients));

        return {
            success: true,
            data: newClient,
            message: 'Cliente creado exitosamente (DEMO)'
        };
    }

    /**
     * Obtener todos los clientes
     * @returns {Promise<Array>} Lista de clientes
     */
    async getAllClients() {
        if (this.isDemoMode) {
            return this.getAllClientsDemo();
        }

        // Asegurar que Supabase esté inicializado
        const isReady = await this.ensureSupabaseReady();
        if (!isReady || !this.supabaseClient) {
            console.error('❌ Supabase no está inicializado');
            return {
                success: false,
                data: [],
                error: 'Supabase no está inicializado'
            };
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Error al obtener clientes:', error);
            return {
                success: false,
                data: [],
                error: error
            };
        }
    }

    async getAllClientsDemo() {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        return {
            success: true,
            data: clients
        };
    }

    /**
     * Obtener cliente por access_code
     * @param {string} accessCode - Código de acceso
     * @returns {Promise<Object>} Cliente
     */
    async getClientByAccessCode(accessCode) {
        if (this.isDemoMode) {
            return this.getClientByAccessCodeDemo(accessCode);
        }

        // Asegurar que Supabase esté listo
        await this.ensureSupabaseReady();

        try {
            const { data, error } = await this.supabaseClient
                .from('clients')
                .select('*')
                .eq('access_code', accessCode)
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Error al obtener cliente:', error);
            return {
                success: false,
                data: null,
                error: error
            };
        }
    }

    async getClientByAccessCodeDemo(accessCode) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const client = clients.find(c => c.accessCode === accessCode);
        return {
            success: true,
            data: client || null
        };
    }

    /**
     * Actualizar cliente
     * @param {string} clientId - ID del cliente
     * @param {Object} updates - Campos a actualizar
     * @returns {Promise<Object>} Cliente actualizado
     */
    async updateClient(clientId, updates) {
        if (this.isDemoMode) {
            return this.updateClientDemo(clientId, updates);
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('clients')
                .update(updates)
                .eq('id', clientId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data,
                message: 'Cliente actualizado exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al actualizar cliente:', error);
            return {
                success: false,
                message: 'Error al actualizar cliente',
                error: error
            };
        }
    }

    async updateClientDemo(clientId, updates) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const index = clients.findIndex(c => c.id === clientId || c.accessCode === clientId);
        
        if (index === -1) {
            return {
                success: false,
                message: 'Cliente no encontrado'
            };
        }

        clients[index] = { ...clients[index], ...updates };
        localStorage.setItem('clients', JSON.stringify(clients));

        return {
            success: true,
            data: clients[index],
            message: 'Cliente actualizado exitosamente (DEMO)'
        };
    }

    /**
     * Eliminar cliente
     * @param {string} clientId - ID del cliente
     * @returns {Promise<Object>} Resultado
     */
    async deleteClient(clientId) {
        if (this.isDemoMode) {
            return this.deleteClientDemo(clientId);
        }

        try {
            const { error } = await this.supabaseClient
                .from('clients')
                .delete()
                .eq('id', clientId);

            if (error) throw error;

            return {
                success: true,
                message: 'Cliente eliminado exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al eliminar cliente:', error);
            return {
                success: false,
                message: 'Error al eliminar cliente',
                error: error
            };
        }
    }

    async deleteClientDemo(clientId) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const filtered = clients.filter(c => c.id !== clientId && c.accessCode !== clientId);
        localStorage.setItem('clients', JSON.stringify(filtered));
        return {
            success: true,
            message: 'Cliente eliminado exitosamente (DEMO)'
        };
    }

    // ============================================
    // OPERACIONES CON PHOTOS
    // ============================================

    /**
     * Guardar referencia de foto en la base de datos
     * @param {Object} photoData - Datos de la foto
     * @returns {Promise<Object>} Foto guardada
     */
    async savePhoto(photoData) {
        if (this.isDemoMode) {
            return this.savePhotoDemo(photoData);
        }

        try {
            // VALIDACIÓN: Asegurar que r2Url sea solo una URL, no datos de imagen
            const r2Url = photoData.r2Url;
            
            // Rechazar si es data URL (base64)
            if (r2Url && r2Url.startsWith('data:')) {
                console.error('❌ ERROR: Se intentó guardar una imagen base64 en lugar de URL de R2');
                return {
                    success: false,
                    message: 'Error: No se puede guardar la imagen directamente. Debe ser una URL de R2.',
                    error: new Error('URL inválida: data URL detectada')
                };
            }
            
            // Rechazar si no es una URL válida
            if (!r2Url || (!r2Url.startsWith('http://') && !r2Url.startsWith('https://'))) {
                console.error('❌ ERROR: URL inválida:', r2Url);
                return {
                    success: false,
                    message: 'Error: URL de R2 inválida',
                    error: new Error('URL debe comenzar con http:// o https://')
                };
            }
            
            // Validar que la URL sea de R2 (debe contener el dominio de R2)
            const r2Domain = window.CONFIG?.r2?.publicUrl || '';
            if (r2Domain && !r2Url.includes(new URL(r2Domain).hostname)) {
                console.warn('⚠️ ADVERTENCIA: La URL no parece ser de R2:', r2Url);
            }
            
            console.log('💾 Guardando SOLO la URL en Supabase (NO la imagen):', r2Url);
            console.log('📊 Datos a insertar:', {
                client_id: photoData.clientId,
                category: photoData.category,
                r2_url: r2Url, // Solo texto/URL, NO imagen
                file_name: photoData.fileName,
                file_size: photoData.fileSize,
                mime_type: photoData.mimeType
            });

            const { data, error } = await this.supabaseClient
                .from('photos')
                .insert([{
                    client_id: photoData.clientId,
                    category: photoData.category,
                    r2_url: r2Url, // Solo la URL como texto, NO la imagen
                    file_name: photoData.fileName,
                    file_size: photoData.fileSize,
                    mime_type: photoData.mimeType
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Foto guardada correctamente. Solo se guardó la URL, NO la imagen.');

            return {
                success: true,
                data: data,
                message: 'Foto guardada exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al guardar foto:', error);
            return {
                success: false,
                message: 'Error al guardar foto',
                error: error
            };
        }
    }

    async savePhotoDemo(photoData) {
        const photosKey = `photos_${photoData.clientId}`;
        const photos = JSON.parse(localStorage.getItem(photosKey) || '{}');
        
        if (!photos[photoData.category]) {
            photos[photoData.category] = [];
        }
        
        photos[photoData.category].push(photoData.r2Url);
        localStorage.setItem(photosKey, JSON.stringify(photos));

        return {
            success: true,
            data: { r2_url: photoData.r2Url },
            message: 'Foto guardada exitosamente (DEMO)'
        };
    }

    /**
     * Obtener fotos de un cliente
     * @param {string} clientId - ID del cliente
     * @param {string} category - Categoría (opcional)
     * @returns {Promise<Object>} Fotos organizadas por categoría
     */
    async getClientPhotos(clientId, category = null, accessCode = null) {
        if (this.isDemoMode) {
            return this.getClientPhotosDemo(clientId, category);
        }

        try {
            // Cargar fotos en lotes para evitar timeout
            const BATCH_SIZE = 100; // Cargar 100 fotos a la vez
            let allPhotos = [];
            let offset = 0;
            let hasMore = true;

            // Primero intentar buscar por clientId (UUID)
            while (hasMore) {
                let query = this.supabaseClient
                    .from('photos')
                    .select('id, category, r2_url')
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false })
                    .range(offset, offset + BATCH_SIZE - 1);

                if (category) {
                    query = query.eq('category', category);
                }

                const { data, error } = await query;

                if (error) {
                    // Si es timeout o error 500, intentar con accessCode como fallback
                    if ((error.code === '57014' || error.message.includes('timeout') || error.code === 'PGRST301') && offset === 0) {
                        console.warn(`⚠️ Timeout/Error con client_id="${clientId}". Intentando con access_code="${accessCode}"...`);
                        
                        if (accessCode && accessCode !== clientId) {
                            // Intentar cargar por accessCode en lotes también
                            let accessCodeOffset = 0;
                            let accessCodeHasMore = true;
                            const accessCodePhotos = [];

                            while (accessCodeHasMore) {
                                let queryByAccessCode = this.supabaseClient
                                    .from('photos')
                                    .select('id, category, r2_url')
                                    .eq('client_id', accessCode)
                                    .order('created_at', { ascending: false })
                                    .range(accessCodeOffset, accessCodeOffset + BATCH_SIZE - 1);

                                if (category) {
                                    queryByAccessCode = queryByAccessCode.eq('category', category);
                                }

                                const result = await queryByAccessCode;
                                
                                if (result.data && result.data.length > 0) {
                                    accessCodePhotos.push(...result.data);
                                    accessCodeOffset += BATCH_SIZE;
                                    accessCodeHasMore = result.data.length === BATCH_SIZE;
                                } else {
                                    accessCodeHasMore = false;
                                }
                            }

                            if (accessCodePhotos.length > 0) {
                                console.warn(`⚠️ Se encontraron ${accessCodePhotos.length} fotos con access_code. Corrigiendo automáticamente...`);
                                allPhotos = accessCodePhotos;
                                
                                // Corregir automáticamente las fotos (en segundo plano, no bloquea)
                                this.corregirClientIdFotos(accessCode, clientId).then(result => {
                                    if (result.success) {
                                        console.log(`✅ ${result.corrected} fotos corregidas en segundo plano.`);
                                    }
                                });
                                hasMore = false;
                                break;
                            }
                        }
                    }
                    
                    // Si no se pudo resolver con accessCode, lanzar error
                    if (offset === 0) {
                        throw error;
                    } else {
                        // Si es un error en un lote posterior, simplemente parar
                        hasMore = false;
                        break;
                    }
                }

                if (data && data.length > 0) {
                    allPhotos = allPhotos.concat(data);
                    offset += BATCH_SIZE;
                    hasMore = data.length === BATCH_SIZE;
                } else {
                    hasMore = false;
                }
            }

            // Si no se encontraron fotos con UUID y tenemos accessCode, intentar buscar por accessCode
            if (allPhotos.length === 0 && accessCode && accessCode !== clientId) {
                console.warn(`⚠️ No se encontraron fotos con client_id="${clientId}". Intentando con access_code="${accessCode}"...`);
                
                let accessCodeOffset = 0;
                let accessCodeHasMore = true;

                while (accessCodeHasMore) {
                    let queryByAccessCode = this.supabaseClient
                        .from('photos')
                        .select('id, category, r2_url')
                        .eq('client_id', accessCode)
                        .order('created_at', { ascending: false })
                        .range(accessCodeOffset, accessCodeOffset + BATCH_SIZE - 1);

                    if (category) {
                        queryByAccessCode = queryByAccessCode.eq('category', category);
                    }

                    const result = await queryByAccessCode;
                    
                    if (result.data && result.data.length > 0) {
                        allPhotos = allPhotos.concat(result.data);
                        accessCodeOffset += BATCH_SIZE;
                        accessCodeHasMore = result.data.length === BATCH_SIZE;
                    } else {
                        accessCodeHasMore = false;
                    }
                }

                if (allPhotos.length > 0) {
                    console.warn(`⚠️ Se encontraron ${allPhotos.length} fotos con access_code. Corrigiendo automáticamente...`);
                    
                    // Corregir automáticamente las fotos (en segundo plano)
                    this.corregirClientIdFotos(accessCode, clientId).then(result => {
                        if (result.success) {
                            console.log(`✅ ${result.corrected} fotos corregidas en segundo plano.`);
                        }
                    });
                }
            }

            // Organizar por categoría (guardar objetos completos con id, r2_url, y r2_key)
            const photosByCategory = {};
            if (allPhotos.length > 0) {
                allPhotos.forEach(photo => {
                    if (!photosByCategory[photo.category]) {
                        photosByCategory[photo.category] = [];
                    }
                    // Extraer el key de R2 de la URL pública
                    // La URL pública es: https://pub-xxx.r2.dev/clientId/category/timestamp_random.ext
                    // El key es: clientId/category/timestamp_random.ext
                    let r2Key = null;
                    if (photo.r2_url) {
                        try {
                            const url = new URL(photo.r2_url);
                            // El pathname incluye el / inicial, así que lo removemos
                            r2Key = url.pathname.substring(1);
                        } catch (e) {
                            console.warn('⚠️ No se pudo extraer key de R2 de la URL:', photo.r2_url);
                        }
                    }
                    
                    photosByCategory[photo.category].push({
                        id: photo.id,
                        r2_url: photo.r2_url,
                        r2_key: r2Key
                    });
                });
            }

            console.log(`✅ Fotos cargadas: ${allPhotos.length} fotos en ${Object.keys(photosByCategory).length} categorías`);

            return {
                success: true,
                data: photosByCategory
            };
        } catch (error) {
            console.error('❌ Error al obtener fotos:', error);
            return {
                success: false,
                data: {},
                error: error
            };
        }
    }

    async getClientPhotosDemo(clientId, category = null) {
        const photosKey = `photos_${clientId}`;
        let photos = JSON.parse(localStorage.getItem(photosKey) || '{}');

        if (category && photos[category]) {
            photos = { [category]: photos[category] };
        }

        return {
            success: true,
            data: photos
        };
    }

    /**
     * Contar total de fotos de un cliente
     * @param {string} clientId - ID del cliente
     * @returns {Promise<number>} Número total de fotos
     */
    async getClientPhotoCount(clientId) {
        if (this.isDemoMode) {
            return this.getClientPhotoCountDemo(clientId);
        }

        try {
            const { count, error } = await this.supabaseClient
                .from('photos')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', clientId);

            if (error) throw error;

            return count || 0;
        } catch (error) {
            console.error('❌ Error al contar fotos:', error);
            return 0;
        }
    }

    async getClientPhotoCountDemo(clientId) {
        const photosKey = `photos_${clientId}`;
        const photos = JSON.parse(localStorage.getItem(photosKey) || '{}');
        let total = 0;
        Object.values(photos).forEach(categoryPhotos => {
            if (Array.isArray(categoryPhotos)) {
                total += categoryPhotos.length;
            }
        });
        return total;
    }

    /**
     * Corregir client_id de fotos que fueron guardadas con access_code en lugar de UUID
     * @param {string} accessCode - Access code incorrecto usado como client_id
     * @param {string} correctClientId - UUID correcto del cliente
     * @returns {Promise<Object>} Resultado de la corrección
     */
    async corregirClientIdFotos(accessCode, correctClientId) {
        if (this.isDemoMode) {
            return { success: true, message: 'Modo demo - no se requiere corrección' };
        }

        try {
            // Buscar todas las fotos con client_id incorrecto
            const { data: photos, error: findError } = await this.supabaseClient
                .from('photos')
                .select('id')
                .eq('client_id', accessCode);

            if (findError) throw findError;

            if (!photos || photos.length === 0) {
                return {
                    success: true,
                    message: 'No hay fotos para corregir',
                    corrected: 0
                };
            }

            // Actualizar cada foto
            let corrected = 0;
            for (const photo of photos) {
                const { error: updateError } = await this.supabaseClient
                    .from('photos')
                    .update({ client_id: correctClientId })
                    .eq('id', photo.id);

                if (!updateError) {
                    corrected++;
                } else {
                    console.error(`Error corrigiendo foto ${photo.id}:`, updateError);
                }
            }

            return {
                success: true,
                message: `${corrected} fotos corregidas`,
                corrected: corrected
            };
        } catch (error) {
            console.error('❌ Error corrigiendo fotos:', error);
            return {
                success: false,
                message: 'Error al corregir fotos',
                error: error
            };
        }
    }

    /**
     * Eliminar foto
     * @param {string} photoId - ID de la foto
     * @returns {Promise<Object>} Resultado
     */
    async deletePhoto(photoId) {
        if (this.isDemoMode) {
            return this.deletePhotoDemo(photoId);
        }

        try {
            const { error } = await this.supabaseClient
                .from('photos')
                .delete()
                .eq('id', photoId);

            if (error) throw error;

            return {
                success: true,
                message: 'Foto eliminada exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al eliminar foto:', error);
            return {
                success: false,
                message: 'Error al eliminar foto',
                error: error
            };
        }
    }

    async deletePhotoDemo(photoId) {
        // En modo demo, necesitarías buscar en todas las categorías
        // Por simplicidad, retornamos éxito
        return {
            success: true,
            message: 'Foto eliminada exitosamente (DEMO)'
        };
    }

    // ============================================
    // OPERACIONES CON ADMINS
    // ============================================

    /**
     * Obtener todos los administradores
     * @returns {Promise<Array>} Lista de administradores
     */
    async getAllAdmins() {
        if (this.isDemoMode) {
            return this.getAllAdminsDemo();
        }

        // Asegurar que Supabase esté inicializado
        const isReady = await this.ensureSupabaseReady();
        if (!isReady || !this.supabaseClient) {
            console.error('❌ Supabase no está inicializado');
            return {
                success: false,
                data: [],
                error: 'Supabase no está inicializado'
            };
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('admins')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: data || []
            };
        } catch (error) {
            console.error('❌ Error al obtener administradores:', error);
            return {
                success: false,
                data: [],
                error: error
            };
        }
    }

    async getAllAdminsDemo() {
        const admins = JSON.parse(localStorage.getItem('administrators') || '[]');
        return {
            success: true,
            data: admins
        };
    }

    /**
     * Crear nuevo administrador
     * @param {Object} adminData - Datos del administrador
     * @returns {Promise<Object>} Administrador creado
     */
    async createAdmin(adminData) {
        if (this.isDemoMode) {
            return this.createAdminDemo(adminData);
        }

        // Asegurar que Supabase esté inicializado
        const isReady = await this.ensureSupabaseReady();
        if (!isReady || !this.supabaseClient) {
            return {
                success: false,
                message: 'Supabase no está inicializado'
            };
        }

        try {
            const insertData = {
                name: adminData.name,
                email: adminData.email,
                password_hash: adminData.password, // Supabase usa password_hash (en producción, hashear esto)
                permissions: adminData.permissions || [],
                is_supremo: adminData.isSupremo || false
            };

            const { data, error } = await this.supabaseClient
                .from('admins')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data,
                message: 'Administrador creado exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al crear administrador:', error);
            return {
                success: false,
                message: 'Error al crear administrador: ' + (error.message || 'Error desconocido'),
                error: error
            };
        }
    }

    async createAdminDemo(adminData) {
        const admins = JSON.parse(localStorage.getItem('administrators') || '[]');
        
        const newAdmin = {
            id: Date.now().toString(),
            ...adminData,
            createdAt: new Date().toISOString()
        };

        admins.push(newAdmin);
        localStorage.setItem('administrators', JSON.stringify(admins));

        return {
            success: true,
            data: newAdmin,
            message: 'Administrador creado exitosamente (DEMO)'
        };
    }

    /**
     * Actualizar administrador
     * @param {string} adminId - ID del administrador
     * @param {Object} updates - Campos a actualizar
     * @returns {Promise<Object>} Administrador actualizado
     */
    async updateAdmin(adminId, updates) {
        if (this.isDemoMode) {
            return this.updateAdminDemo(adminId, updates);
        }

        // Asegurar que Supabase esté inicializado
        const isReady = await this.ensureSupabaseReady();
        if (!isReady || !this.supabaseClient) {
            return {
                success: false,
                message: 'Supabase no está inicializado'
            };
        }

        try {
            // Limpiar y formatear los datos de actualización
            const formattedUpdates = {};
            
            // Solo incluir campos que existen en la tabla
            if (updates.name !== undefined) formattedUpdates.name = updates.name;
            if (updates.email !== undefined) formattedUpdates.email = updates.email;
            
            // password_hash - NOTA: En producción, el password debería hashearse antes de guardarse
            // Por ahora aceptamos password plano y lo guardamos como password_hash
            // Solo actualizar si el password no está vacío y no es 'undefined'
            if (updates.password !== undefined && 
                updates.password !== null && 
                updates.password !== 'undefined' && 
                typeof updates.password === 'string' && 
                updates.password.trim() !== '') {
                formattedUpdates.password_hash = updates.password.trim(); // Supabase usa password_hash
            }
            
            // permissions debe ser JSONB
            if (updates.permissions !== undefined) {
                formattedUpdates.permissions = Array.isArray(updates.permissions) 
                    ? updates.permissions 
                    : [];
            }
            
            // is_supremo (no debería actualizarse normalmente, pero lo incluimos)
            if (updates.isSupremo !== undefined) {
                formattedUpdates.is_supremo = updates.isSupremo;
            } else if (updates.is_supremo !== undefined) {
                formattedUpdates.is_supremo = updates.is_supremo;
            }
            
            // Verificar que hay algo que actualizar
            if (Object.keys(formattedUpdates).length === 0) {
                return {
                    success: false,
                    message: 'No hay campos para actualizar'
                };
            }
            
            console.log('📝 Actualizando administrador con:', formattedUpdates);
            console.log('🔍 ID del administrador:', adminId, 'tipo:', typeof adminId);
            
            // Primero verificar que el administrador existe
            const { data: checkData, error: checkError } = await this.supabaseClient
                .from('admins')
                .select('id, name, email')
                .eq('id', adminId)
                .limit(1);
            
            if (checkError) {
                console.error('❌ Error al verificar administrador:', checkError);
                return {
                    success: false,
                    message: 'Error al verificar administrador: ' + checkError.message
                };
            }
            
            if (!checkData || checkData.length === 0) {
                console.warn('⚠️ Administrador no encontrado antes de actualizar. ID:', adminId);
                console.log('🔍 Intentando buscar todos los admins para verificar IDs...');
                const { data: allAdmins } = await this.supabaseClient
                    .from('admins')
                    .select('id, name, email')
                    .limit(10);
                console.log('📋 Administradores encontrados:', allAdmins);
                return {
                    success: false,
                    message: 'No se encontró el administrador a actualizar. Verifique el ID.'
                };
            }
            
            console.log('✅ Administrador encontrado:', checkData[0]);
            
            // Usar .select() sin .single() para evitar errores si no hay filas
            const { data, error } = await this.supabaseClient
                .from('admins')
                .update(formattedUpdates)
                .eq('id', adminId)
                .select();

            if (error) {
                console.error('❌ Error de Supabase al actualizar:', error);
                throw error;
            }

            // Verificar que se actualizó al menos una fila
            if (!data || data.length === 0) {
                console.warn('⚠️ No se actualizó ninguna fila. ID:', adminId);
                console.warn('⚠️ Posible causa: RLS (Row Level Security) bloqueando la actualización');
                return {
                    success: false,
                    message: 'No se pudo actualizar el administrador. Posible causa: RLS bloqueando la actualización.'
                };
            }

            return {
                success: true,
                data: data[0], // Retornar el primer (y único) resultado
                message: 'Administrador actualizado exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al actualizar administrador:', error);
            return {
                success: false,
                message: 'Error al actualizar administrador: ' + (error.message || JSON.stringify(error)),
                error: error
            };
        }
    }

    async updateAdminDemo(adminId, updates) {
        const admins = JSON.parse(localStorage.getItem('administrators') || '[]');
        const index = admins.findIndex(a => a.id === adminId);
        
        if (index === -1) {
            return {
                success: false,
                message: 'Administrador no encontrado'
            };
        }

        admins[index] = { ...admins[index], ...updates };
        localStorage.setItem('administrators', JSON.stringify(admins));

        return {
            success: true,
            data: admins[index],
            message: 'Administrador actualizado exitosamente (DEMO)'
        };
    }

    /**
     * Eliminar administrador
     * @param {string} adminId - ID del administrador
     * @returns {Promise<Object>} Resultado
     */
    async deleteAdmin(adminId) {
        if (this.isDemoMode) {
            return this.deleteAdminDemo(adminId);
        }

        // Asegurar que Supabase esté inicializado
        const isReady = await this.ensureSupabaseReady();
        if (!isReady || !this.supabaseClient) {
            return {
                success: false,
                message: 'Supabase no está inicializado'
            };
        }

        try {
            const { error } = await this.supabaseClient
                .from('admins')
                .delete()
                .eq('id', adminId);

            if (error) throw error;

            return {
                success: true,
                message: 'Administrador eliminado exitosamente'
            };
        } catch (error) {
            console.error('❌ Error al eliminar administrador:', error);
            return {
                success: false,
                message: 'Error al eliminar administrador',
                error: error
            };
        }
    }

    async deleteAdminDemo(adminId) {
        const admins = JSON.parse(localStorage.getItem('administrators') || '[]');
        const filtered = admins.filter(a => a.id !== adminId);
        localStorage.setItem('administrators', JSON.stringify(filtered));
        return {
            success: true,
            message: 'Administrador eliminado exitosamente (DEMO)'
        };
    }
}

// Inicializar servicio global
window.dbService = new DatabaseService();
