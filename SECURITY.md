# Seguridad de la Aplicación - Farmacia Santa Marta

## ⚠️ ADVERTENCIA CRÍTICA DE SEGURIDAD

### ROW LEVEL SECURITY (RLS) - IMPLEMENTACIÓN OBLIGATORIA

> **🚨 URGENTE**: La aplicación utiliza `EXPO_PUBLIC_SUPABASE_ANON_KEY` en el frontend, lo que significa que **TODAS las tablas de la base de datos DEBEN tener Row Level Security (RLS) habilitado y configurado correctamente**. Sin RLS, cualquier usuario puede acceder a todos los datos de la base de datos.

## 1. Estado Actual de Seguridad

### Exposición de Claves
```javascript
// En supabaseClient.js
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

**Riesgo**: La clave anónima está expuesta en el frontend y es accesible desde el código del cliente. Esto es normal para aplicaciones React Native/Expo, pero requiere configuración especial de seguridad en Supabase.

### Protección Requerida
**Row Level Security DEBE estar habilitado** en todas las tablas sensibles:
- `perfiles`
- `pedidos`  
- `detalles_pedido`
- `direcciones`
- `productos` (si contiene datos sensibles)
- Cualquier otra tabla con información privada

## 2. Configuración Crítica de RLS en Supabase

### A. Habilitar RLS en Todas las Tablas
```sql
-- OBLIGATORIO: Habilitar RLS en cada tabla
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;
```

### B. Políticas de Seguridad Esenciales

#### Tabla `perfiles`
```sql
-- Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "Users can view own profile" ON perfiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON perfiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON perfiles FOR INSERT WITH CHECK (id = auth.uid());

-- Los repartidores pueden ver perfiles de clientes para entregas
CREATE POLICY "Deliverers can view client profiles" ON perfiles FOR SELECT USING (
  rol = 'cliente' AND 
  EXISTS (
    SELECT 1 FROM pedidos 
    WHERE pedidos.cliente_id = perfiles.id 
    AND pedidos.repartidor_id = auth.uid()
    AND pedidos.estado IN ('confirmado', 'en_camino')
  )
);
```

#### Tabla `pedidos`
```sql
-- Clientes solo ven sus propios pedidos
CREATE POLICY "Clients can view own orders" ON pedidos FOR SELECT USING (cliente_id = auth.uid());
CREATE POLICY "Clients can create orders" ON pedidos FOR INSERT WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "Clients can cancel own pending orders" ON pedidos FOR UPDATE USING (
  cliente_id = auth.uid() AND estado = 'pendiente'
) WITH CHECK (estado = 'cancelado');

-- Repartidores ven pedidos asignados o disponibles
CREATE POLICY "Deliverers can view assigned orders" ON pedidos FOR SELECT USING (
  repartidor_id = auth.uid() OR 
  (repartidor_id IS NULL AND estado = 'pendiente')
);
CREATE POLICY "Deliverers can accept and update orders" ON pedidos FOR UPDATE USING (
  repartidor_id = auth.uid() OR 
  (repartidor_id IS NULL AND estado = 'pendiente')
);
```

#### Tabla `direcciones`
```sql
-- Solo el cliente propietario puede ver sus direcciones
CREATE POLICY "Clients can view own addresses" ON direcciones FOR SELECT USING (cliente_id = auth.uid());
CREATE POLICY "Clients can manage own addresses" ON direcciones FOR ALL USING (cliente_id = auth.uid());

-- Repartidores pueden ver direcciones de pedidos asignados
CREATE POLICY "Deliverers can view delivery addresses" ON direcciones FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pedidos 
    WHERE pedidos.direccion_id = direcciones.id 
    AND pedidos.repartidor_id = auth.uid()
    AND pedidos.estado IN ('confirmado', 'en_camino')
  )
);
```

#### Tabla `detalles_pedido`
```sql
-- Basado en la propiedad del pedido
CREATE POLICY "Users can view own order details" ON detalles_pedido FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pedidos 
    WHERE pedidos.id = detalles_pedido.pedido_id 
    AND (pedidos.cliente_id = auth.uid() OR pedidos.repartidor_id = auth.uid())
  )
);
```

## 3. Verificación de Seguridad

### A. Comandos de Verificación
```sql
-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- No debe devolver filas para tablas sensibles

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### B. Pruebas de Penetración Básicas
```javascript
// Intentar acceder a datos de otros usuarios (DEBE FALLAR)
const { data, error } = await supabase
  .from('perfiles')
  .select('*')
  .neq('id', 'current_user_id'); // Debe devolver vacío o error

// Intentar modificar datos de otros usuarios (DEBE FALLAR)
const { error: updateError } = await supabase
  .from('pedidos')
  .update({ estado: 'cancelado' })
  .neq('cliente_id', 'current_user_id'); // Debe fallar
```

## 4. Roles y Permisos

### A. Definición de Roles
```sql
-- Crear roles personalizados si es necesario
CREATE ROLE cliente_role;
CREATE ROLE repartidor_role;
CREATE ROLE admin_role;

-- Configurar permisos por rol
GRANT SELECT, INSERT, UPDATE ON perfiles TO cliente_role;
GRANT SELECT, INSERT, UPDATE ON pedidos TO cliente_role;
-- etc.
```

### B. Asignación Automática de Roles
```sql
-- Trigger para asignar rol automáticamente al crear perfil
CREATE OR REPLACE FUNCTION assign_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Lógica para asignar rol basado en datos del perfil
  IF NEW.rol = 'repartidor' THEN
    EXECUTE 'SET ROLE repartidor_role';
  ELSE
    EXECUTE 'SET ROLE cliente_role';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON perfiles
  FOR EACH ROW EXECUTE FUNCTION assign_user_role();
```

## 5. Autenticación y Autorización

### A. Validación de JWT
```javascript
// El token JWT debe ser validado en cada request
// Supabase lo hace automáticamente, pero verificar configuración
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  throw new Error('Usuario no autenticado');
}
```

### B. Middleware de Seguridad (Recomendado)
```javascript
// Crear middleware para validar permisos antes de operaciones críticas
export const requireAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Autenticación requerida');
  }
  return user;
};

export const requireRole = async (requiredRole) => {
  const user = await requireAuth();
  const { data: profile } = await getUserProfile(user.id);
  
  if (profile?.rol !== requiredRole) {
    throw new Error(`Rol ${requiredRole} requerido`);
  }
  return { user, profile };
};
```

## 6. Protección de Datos Sensibles

### A. Encriptación de Campos Sensibles
```sql
-- Para campos muy sensibles, usar encriptación adicional
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ejemplo: encriptar números de teléfono
ALTER TABLE perfiles ADD COLUMN telefono_encrypted TEXT;

-- Función para encriptar
CREATE OR REPLACE FUNCTION encrypt_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_encrypt(phone, 'your_secret_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### B. Auditoría y Logging
```sql
-- Tabla de auditoría para operaciones críticas
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger de auditoría
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, operation, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Checklist de Seguridad

### ✅ Implementaciones Obligatorias
- [ ] **RLS habilitado en todas las tablas sensibles**
- [ ] **Políticas de RLS configuradas y probadas**
- [ ] **Validación de roles en operaciones críticas**
- [ ] **Pruebas de acceso no autorizado realizadas**
- [ ] **Logging de operaciones sensibles implementado**

### ⚠️ Vulnerabilidades Actuales Identificadas
- [ ] **Verificar que RLS está habilitado en producción**
- [ ] **Validar que las políticas cubren todos los casos de uso**
- [ ] **Implementar rate limiting para prevenir abuso de API**
- [ ] **Configurar monitoreo de intentos de acceso no autorizado**

### 🔒 Recomendaciones Adicionales
- [ ] **Implementar 2FA para cuentas de repartidores**
- [ ] **Rotación regular de claves de API**
- [ ] **Backup encriptado de datos sensibles**
- [ ] **Revisión periódica de permisos y políticas**

## 8. Monitoreo de Seguridad

### A. Métricas de Seguridad
```sql
-- Consultas para monitorear intentos de acceso
-- Intentos fallidos de autenticación (requiere logging personalizado)
SELECT COUNT(*), DATE(created_at)
FROM auth_failures 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at);

-- Operaciones sospechosas (múltiples operaciones desde la misma IP)
SELECT user_id, COUNT(*), operation
FROM audit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, operation
HAVING COUNT(*) > 100;
```

### B. Alertas Automáticas
```javascript
// Implementar alertas por email/SMS para actividades sospechosas
export const checkSuspiciousActivity = async (userId) => {
  const recentOperations = await supabase
    .from('audit_log')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Última hora
    .count();
    
  if (recentOperations > 50) {
    await sendSecurityAlert(`Usuario ${userId} con actividad sospechosa`);
  }
};
```

---

## 🚨 ACCIÓN INMEDIATA REQUERIDA

1. **Verificar RLS**: Ejecutar comandos de verificación en la base de datos
2. **Implementar Políticas**: Crear políticas de RLS para todas las tablas
3. **Pruebas de Seguridad**: Realizar pruebas de penetración básicas
4. **Monitoreo**: Implementar logging y alertas de seguridad
5. **Documentación**: Mantener esta documentación actualizada con cambios

**Sin estas implementaciones, la aplicación presenta vulnerabilidades críticas de seguridad que pueden resultar en exposición completa de datos de usuarios.**