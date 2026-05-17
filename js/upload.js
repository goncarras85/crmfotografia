/**
 * Servicio de Subida de Imágenes - CL Fotógrafos
 * VERSIÓN FINAL: Usando aws4fetch para Cloudflare R2 (más ligero y compatible)
 */

// Cargar aws4fetch dinámicamente para mejor manejo de errores
let AwsV4Signer = null;

async function loadAws4Fetch() {
    if (AwsV4Signer) return AwsV4Signer;
    
    // Intentar múltiples CDNs en orden de preferencia (versión correcta: 1.0.20)
    // esm.sh es más confiable, lo intentamos primero
    const cdns = [
        "https://esm.sh/aws4fetch@1.0.20",
        "https://unpkg.com/aws4fetch@1.0.20/dist/aws4fetch.mjs",
        "https://cdn.jsdelivr.net/npm/aws4fetch@1.0.20/dist/aws4fetch.mjs"
    ];
    
    for (const cdnUrl of cdns) {
        try {
            console.log(`📦 Intentando cargar aws4fetch desde: ${cdnUrl}`);
            const module = await import(cdnUrl);
            // aws4fetch exporta AwsV4Signer, no AwsClient
            AwsV4Signer = module.AwsV4Signer || module.default?.AwsV4Signer || module;
            console.log('✅ aws4fetch cargado correctamente');
            return AwsV4Signer;
        } catch (error) {
            console.warn(`⚠️ Error con ${cdnUrl}:`, error.message);
            continue;
        }
    }
    
    throw new Error('❌ No se pudo cargar aws4fetch desde ningún CDN. Verifica tu conexión a internet.');
}

class UploadService {
    constructor() {
        this.s3Client = null;
        this.isDemoMode = false; 
        this.awsV4SignerClass = null;

        // Obtener CONFIG desde window (ya que config.js se carga como script normal)
        const currentConfig = window.CONFIG || (typeof globalThis !== 'undefined' ? globalThis.CONFIG : null);
        
        // FORZAR modo demo a false si CONFIG.useDemoMode() retorna false
        if (currentConfig && typeof currentConfig.useDemoMode === 'function' && currentConfig.useDemoMode() === false) {
            this.isDemoMode = false;
            console.log('✅ Modo demo DESACTIVADO - Usando R2 real');
        }
        
        if (currentConfig && currentConfig.r2 && currentConfig.r2.accessKeyId) {
            // Inicializar de forma asíncrona
            this.initS3Client();
        } else {
            console.warn('⚠️ No hay claves R2 configuradas. Modo Demo.');
            this.isDemoMode = true;
        }
        
        console.log('🔧 UploadService - isDemoMode:', this.isDemoMode);
    }

    async initS3Client() {
        try {
            // Obtener CONFIG desde window
            const currentConfig = window.CONFIG || (typeof globalThis !== 'undefined' ? globalThis.CONFIG : null);
            
            if (!currentConfig || !currentConfig.r2) {
                throw new Error('CONFIG no disponible o sin configuración R2');
            }
            
            console.log('📦 Cargando aws4fetch...');
            // Cargar aws4fetch si no está cargado (solo la clase, no una instancia)
            if (!this.awsV4SignerClass) {
                this.awsV4SignerClass = await loadAws4Fetch();
            }
            
            console.log('🔧 aws4fetch cargado. Se usará para firmar cada request.');
            // No creamos un cliente reutilizable, aws4fetch crea un signer por cada request
            // Solo guardamos la clase y las credenciales para usarlas después

            this.bucketName = currentConfig.r2.bucketName;
            this.endpoint = `https://${currentConfig.r2.accountId}.r2.cloudflarestorage.com`;
            this.publicUrlBase = currentConfig.r2.publicUrl;
            this.accessKeyId = currentConfig.r2.accessKeyId;
            this.secretAccessKey = currentConfig.r2.secretAccessKey;
            
            // Marcar como inicializado (aunque no hay un cliente reutilizable)
            this.s3Client = { initialized: true };
            
            console.log('✅ R2 Client inicializado (aws4fetch)');
            console.log('📍 Endpoint:', this.endpoint);
            console.log('🪣 Bucket:', this.bucketName);
            
            // Asegurar que NO estamos en modo demo si llegamos aquí
            this.isDemoMode = false;
        } catch (error) {
            console.error('❌ Error inicializando S3 Client:', error);
            console.error('Stack:', error.stack);
            // Solo poner en modo demo si realmente no hay credenciales
            const currentConfig = window.CONFIG || (typeof globalThis !== 'undefined' ? globalThis.CONFIG : null);
            if (!currentConfig || !currentConfig.r2 || !currentConfig.r2.accessKeyId) {
                console.warn('⚠️ Sin credenciales R2, activando modo demo');
                this.isDemoMode = true;
            } else {
                // Hay credenciales pero falló la inicialización, mantener isDemoMode en false
                // para que se pueda reintentar
                console.warn('⚠️ Error en inicialización pero hay credenciales. Se reintentará en la próxima subida.');
                this.isDemoMode = false;
            }
        }
    }

    generateUniqueFileName(fileName, clientId, category) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = fileName.split('.').pop();
        const cleanCategory = category.replace(/[^a-zA-Z0-9]/g, '_');
        
        return `${clientId}/${cleanCategory}/${timestamp}_${random}.${extension}`;
    }

    async uploadImage(file, clientId, category, onProgress = null) {
        // Obtener CONFIG desde window
        const currentConfig = window.CONFIG || (typeof globalThis !== 'undefined' ? globalThis.CONFIG : null);
        
        // Verificar si realmente deberíamos estar en modo demo
        if (this.isDemoMode) {
            // Si tenemos CONFIG y credenciales, NO deberíamos estar en modo demo
            if (currentConfig && currentConfig.r2 && currentConfig.r2.accessKeyId) {
                console.warn('⚠️ Servicio estaba en modo demo pero hay credenciales. Reintentando inicialización...');
                this.isDemoMode = false;
                // Intentar inicializar de nuevo
                try {
                    await this.initS3Client();
                } catch (e) {
                    console.error('❌ Error al reintentar inicialización:', e);
                    return this.uploadImageDemo(file, clientId, category, onProgress);
                }
            } else {
                console.log('📦 Modo demo activo (sin credenciales R2)');
                return this.uploadImageDemo(file, clientId, category, onProgress);
            }
        }

        try {
            // Verificar que tenemos awsV4SignerClass y credenciales, si no, inicializar
            if (!this.awsV4SignerClass || !this.s3Client || !this.s3Client.initialized) {
                console.log('🔄 Inicializando s3Client...');
                await this.initS3Client();
                
                // Si después de inicializar seguimos sin awsV4SignerClass, hay un problema
                if (!this.awsV4SignerClass) {
                    throw new Error('No se pudo cargar aws4fetch');
                }
            }
            
            if (!currentConfig) {
                throw new Error('CONFIG no disponible');
            }
            
            console.log('✅ Verificaciones pasadas. Iniciando subida a R2...');

            const uniqueFileName = this.generateUniqueFileName(file.name, clientId, category);
            const objectUrl = `${this.endpoint}/${this.bucketName}/${uniqueFileName}`;

            console.log('🔐 Firmando request con aws4fetch...');
            // Crear signer de aws4fetch para este request específico
            const signer = new this.awsV4SignerClass({
                url: objectUrl,
                service: 's3',
                region: 'auto',
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            });

            // Firmar el request
            const signed = await signer.sign();
            
            console.log('✅ Request firmado correctamente');

            // Subir con XMLHttpRequest para tener progreso
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Manejar progreso
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            onProgress(percent);
                        }
                    });
                }

                // Manejar respuesta
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        // Construir URL pública correcta
                        const publicUrl = currentConfig.r2.publicUrl.endsWith('/') 
                            ? `${currentConfig.r2.publicUrl}${uniqueFileName}`
                            : `${currentConfig.r2.publicUrl}/${uniqueFileName}`;
                        
                        console.log('✅ Imagen subida exitosamente a R2');
                        console.log('📍 Key en R2:', uniqueFileName);
                        console.log('🌐 URL pública:', publicUrl);
                        
                        resolve({
                            success: true,
                            url: publicUrl,
                            key: uniqueFileName,
                            fileName: file.name,
                            fileSize: file.size,
                            mimeType: file.type,
                            message: 'Imagen subida exitosamente'
                        });
                    } else {
                        console.error('❌ Error en respuesta de R2:', xhr.status, xhr.statusText);
                        console.error('📄 Respuesta:', xhr.responseText);
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Error de red al subir la imagen'));
                });

                // Configurar y enviar
                xhr.open(signed.method, signed.url);
                
                // Copiar headers del request firmado
                signed.headers.forEach((value, key) => {
                    xhr.setRequestHeader(key, value);
                });

                // Enviar archivo (aws4fetch no modifica el body, usar el archivo original)
                xhr.send(file);
            });

        } catch (error) {
            console.error('❌ Error al subir imagen:', error);
            console.error('Error completo:', error);
            console.error('Stack:', error.stack);
            
            // Si hay un error pero tenemos credenciales, NO devolver modo demo
            // Devolver error real para que el usuario sepa qué pasó
            return {
                success: false,
                message: `Error al subir a R2: ${error.message}`,
                error: error
            };
        }
    }

    async deleteImage(key) {
        if (this.isDemoMode) return { success: true };

        try {
            if (!this.s3Client || !this.s3Client.initialized) await this.initS3Client();

            const objectUrl = `${this.endpoint}/${this.bucketName}/${key}`;
            
            // Crear signer para DELETE
            const signer = new this.awsV4SignerClass({
                url: objectUrl,
                service: 's3',
                region: 'auto',
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
                method: 'DELETE',
            });

            // Firmar el request
            const signed = await signer.sign();

            // Ejecutar petición
            const response = await fetch(signed.url, {
                method: signed.method,
                headers: signed.headers,
            });

            if (response.ok) {
                return { success: true, message: 'Imagen eliminada' };
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            return { success: false, error: error };
        }
    }

    // --- MÉTODOS AUXILIARES ---

    async uploadMultipleImages(files, clientId, category, onProgress = null) {
        const results = [];
        const total = files.length;
        for (let i = 0; i < files.length; i++) {
            const result = await this.uploadImage(files[i], clientId, category, (percent) => {
                if (onProgress) {
                    const overallProgress = Math.round(((i + percent / 100) / total) * 100);
                    onProgress(overallProgress, i + 1, total);
                }
            });
            results.push(result);
        }
        return results;
    }

    async uploadImageDemo(file, clientId, category, onProgress) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const dataUrl = e.target.result;

                // Simular progreso
                if (onProgress) {
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += 10;
                        onProgress(Math.min(progress, 100));
                        if (progress >= 100) {
                            clearInterval(interval);
                        }
                    }, 50);
                }

                setTimeout(() => {
                    // Generar un nombre único para el demo
                    const uniqueFileName = this.generateUniqueFileName(file.name, clientId, category);
                    
                    resolve({ 
                        success: true, 
                        url: dataUrl, // Usar data URL en lugar de ruta relativa
                        key: uniqueFileName,
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        message: 'Imagen subida exitosamente (DEMO)'
                    });
                }, 500);
            };

            reader.readAsDataURL(file);
        });
    }

    validateFile(file) {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) return { valid: false, message: 'Formato inválido' };
        if (file.size > 10 * 1024 * 1024) return { valid: false, message: 'Máx 10MB' };
        return { valid: true };
    }
}

// ✅ Exportar para uso modular
export { UploadService };

// ✅ Asignar a window para compatibilidad
// Inicializar esperando a que CONFIG esté disponible (config.js se carga como script normal)
console.log('📦 Inicializando UploadService...');

(function initializeUploadService() {
    try {
        // Esperar a que CONFIG esté disponible (config.js se carga antes pero puede haber un pequeño delay)
        const checkConfig = () => {
            const currentConfig = window.CONFIG || (typeof globalThis !== 'undefined' ? globalThis.CONFIG : null);
            
            if (currentConfig) {
                console.log('✅ CONFIG disponible, inicializando UploadService...');
                window.uploadService = new UploadService();
                console.log('✅ UploadService inicializado y disponible en window.uploadService');
            } else {
                console.log('⏳ Esperando a que CONFIG esté disponible...');
                // Reintentar después de 100ms
                setTimeout(checkConfig, 100);
            }
        };
        
        // Iniciar verificación
        checkConfig();
    } catch (error) {
        console.error('❌ Error inicializando UploadService:', error);
        console.error('Stack:', error.stack);
        // Aún así, crear una instancia para evitar errores undefined
        try {
            window.uploadService = new UploadService();
        } catch (e) {
            console.error('❌ No se pudo crear UploadService:', e);
        }
    }
})();
