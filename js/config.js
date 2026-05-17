/**
 * Configuración Centralizada - CL Fotógrafos
 * 
 * ⚠️ IMPORTANTE: Reemplaza todos los valores con tus credenciales reales
 * 
 * SUPABASE:
 * 1. Ve a tu proyecto en Supabase → Settings → API
 * 2. Copia Project URL y anon public key
 * 
 * CLOUDFLARE R2:
 * 1. Crea un bucket en R2
 * 2. Crea un API Token con permisos Read & Write
 * 3. Copia Access Key ID, Secret Access Key y Account ID
 */

// ✅ Configuración como objeto global (compatible con scripts normales y módulos ES)
const CONFIG = {
    // ============================================
    // SUPABASE CONFIGURATION
    // ============================================
    supabase: {
        url: 'https://clyllexmxtwgjqgaswlq.supabase.co/rest/v1/',           // URL del proyecto
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseWxsZXhteHR3Z2pxZ2Fzd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDY2MDcsImV4cCI6MjA5NDYyMjYwN30.imDCURe96RChmHnRSVkz6mTdyC8BcdMLkyg2dokFfys',  // Clave pública (anon key)
        // ⚠️ NUNCA expongas la service_role key en el frontend
    },

    // ============================================
    // CLOUDFLARE R2 CONFIGURATION
    // ============================================
    r2: {
        accountId: 'f4e0f5a346cfbc85253cd3326f71ad9f',           // ⚠️ NECESITAS: Account ID completo (empieza con f4e0f5a346cfbc85253cd3326f71...)
        accessKeyId: 'ec876b3a21b25ceaceb329fe7a0142b4',      // ✅ Configurado
        secretAccessKey: '4c3604b42e5225fdd1bac6125cec41c47f2c332e425cea0fec1840bd99456f07',      // ✅ Configurado
        bucketName: 'cl-fotografos-storage',        // Nombre de tu bucket
        region: 'auto',                             // Región (usar 'auto' o específica como 'weur')
        publicUrl: 'https://pub-260c3d6bfc8f460f9734cfb37af7dff6.r2.dev',           // ✅ Configurado
    },

    // ============================================
    // APP CONFIGURATION
    // ============================================
    app: {
        name: 'CL Fotógrafos',
        version: '1.0.0',
        // Rutas protegidas que requieren autenticación
        protectedRoutes: [
            'admin-panel.html',
            'mis-clientes.html',
            'gestor-cliente.html',
            'ajustes-admin.html',
            'dashboard-cliente.html'
        ]
    },

    // ============================================
    // VALIDACIÓN DE CONFIGURACIÓN
    // ============================================
    isConfigured: function() {
        return this.supabase.url !== 'YOUR_SUPABASE_URL' &&
               this.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
               this.r2.accountId !== 'YOUR_R2_ACCOUNT_ID' &&
               this.r2.accessKeyId !== 'YOUR_R2_ACCESS_KEY_ID' &&
               this.r2.secretAccessKey !== 'YOUR_R2_SECRET_KEY';
    },

    // ============================================
    // MODO DEMO (desactivado - siempre usa Supabase)
    // ============================================
    useDemoMode: function() {
        // Siempre retornar false para forzar uso de Supabase
        return false;
    }
};

// ✅ Exportar globalmente para scripts no-module (db.js, auth.js)
window.CONFIG = CONFIG;

// ✅ También crear variable global CONFIG (sin window.) para compatibilidad
// Esto permite que scripts usen CONFIG directamente sin window.
if (typeof globalThis !== 'undefined') {
    globalThis.CONFIG = CONFIG;
}

// ✅ Exportar para módulos ES (si se carga como módulo)
// Esto permite que upload.js lo importe si se carga como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Log para verificar que se cargó correctamente
console.log('✅ CONFIG cargado:', {
    isConfigured: CONFIG.isConfigured(),
    useDemoMode: CONFIG.useDemoMode()
});
