# 🚀 CONFIGURACIÓN COMPLETA: Supabase + Cloudflare R2

## 📋 PASO 1: CONFIGURACIÓN DE SUPABASE

### 1.1 Crear Tablas en Supabase

Ve a tu proyecto en Supabase → **SQL Editor** → **New Query** y ejecuta este SQL:

```sql
-- ============================================
-- TABLA: clients
-- Almacena información de los clientes
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    access_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: photos
-- Almacena referencias a las fotos en R2
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    r2_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: admins
-- Almacena administradores del sistema
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    is_supremo BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para mejorar rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_photos_client_id ON photos(client_id);
CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_clients_access_code ON clients(access_code);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA CLIENTS
-- Los clientes solo pueden ver su propio registro usando access_code
CREATE POLICY "Clients can view own data"
    ON clients FOR SELECT
    USING (true); -- Permitir lectura pública (se filtra por access_code en la app)

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Admins can manage clients"
    ON clients FOR ALL
    USING (true); -- Por ahora permitimos todo, luego restringir con auth

-- POLÍTICAS PARA PHOTOS
-- Los clientes pueden ver fotos de su client_id
CREATE POLICY "Clients can view own photos"
    ON photos FOR SELECT
    USING (true); -- Permitir lectura pública (se filtra por client_id en la app)

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Admins can manage photos"
    ON photos FOR ALL
    USING (true); -- Por ahora permitimos todo, luego restringir con auth

-- POLÍTICAS PARA ADMINS
-- Solo admins pueden ver otros admins
CREATE POLICY "Admins can view admins"
    ON admins FOR SELECT
    USING (true); -- Por ahora permitimos todo, luego restringir con auth

-- ============================================
-- DATOS INICIALES (OPCIONAL)
-- ============================================

-- Insertar admin por defecto (cambiar password después)
-- La contraseña debe ser hasheada con bcrypt antes de insertar
-- Usa: https://bcrypt-generator.com/ (rounds: 10)
-- Ejemplo: password "admin123" → hash "$2a$10$..."

-- INSERT INTO admins (email, password_hash, name, is_supremo, permissions)
-- VALUES (
--     'admin@admin',
--     '$2a$10$TuHashAqui', -- Reemplazar con hash real
--     'Administrador',
--     true,
--     '["all"]'::jsonb
-- );
```

### 1.2 Obtener Credenciales de Supabase

1. Ve a tu proyecto en Supabase
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public key** (la clave pública)
   - **service_role key** (la clave privada - ⚠️ NUNCA la expongas en el frontend)

---

## 📋 PASO 2: CONFIGURACIÓN DE CLOUDFLARE R2

### 2.1 Crear Bucket en R2

1. Ve a tu cuenta de Cloudflare
2. Navega a **R2** → **Create bucket**
3. Nombre sugerido: `cl-fotografos-photos`
4. **Región**: Elige la más cercana a tus usuarios (ej: `weur` para Europa Oeste)

### 2.2 Configurar CORS en R2

Ve a tu bucket → **Settings** → **CORS Policy** y pega esta configuración:

```json
[
  {
    "AllowedOrigins": [
      "https://tudominio.com",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:8080",
      "http://127.0.0.1:8080"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**⚠️ IMPORTANTE**: Reemplaza `https://tudominio.com` con tu dominio real en producción.

### 2.3 Crear API Token de R2

1. Ve a **Manage R2 API Tokens** → **Create API Token**
2. Configuración:
   - **Token name**: `cl-fotografos-upload`
   - **Permissions**: **Object Read & Write**
   - **TTL**: Dejar vacío (sin expiración) o configurar según necesites
3. Copia:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (lo encuentras en la URL del dashboard)

### 2.4 Configurar Dominio Público (Opcional pero Recomendado)

Para servir las imágenes directamente desde R2:

1. Ve a tu bucket → **Settings** → **Public Access**
2. Habilita **Public Access**
3. Copia la **Public URL** (ejemplo: `https://pub-xxxxx.r2.dev`)

O mejor aún, configura un **Custom Domain**:
1. Ve a **Settings** → **Custom Domains**
2. Añade tu dominio (ej: `cdn.tudominio.com`)
3. Configura el DNS según las instrucciones de Cloudflare

---

## 📋 PASO 3: CONFIGURAR ARCHIVO config.js

Una vez tengas todas las credenciales, actualiza `js/config.js` con tus valores reales.

---

## ✅ VERIFICACIÓN

Después de configurar todo:

1. ✅ Tablas creadas en Supabase
2. ✅ RLS habilitado y políticas configuradas
3. ✅ Bucket R2 creado
4. ✅ CORS configurado en R2
5. ✅ API Token de R2 creado
6. ✅ Credenciales copiadas en `js/config.js`

---

## 🔒 SEGURIDAD

**⚠️ IMPORTANTE**: 
- Las claves de R2 en el frontend son un riesgo de seguridad
- Para producción, considera usar un backend intermedio (Cloudflare Workers) que maneje las subidas
- Por ahora, asumimos el riesgo para mantener la simplicidad

---

## 📚 PRÓXIMOS PASOS

Una vez configurado todo, los archivos JavaScript creados (`auth.js`, `db.js`, `upload.js`, `gallery.js`) se encargarán de:
- Autenticación de usuarios
- CRUD de clientes y fotos
- Subida de imágenes a R2
- Visualización de galerías
