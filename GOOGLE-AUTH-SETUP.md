# Configuración de Google OAuth para Farmacia Santa Marta

## Pasos para configurar Google OAuth en Supabase

### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API** y **Google OAuth2 API**
4. Ve a **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**

### 2. Configurar OAuth Client IDs

#### Para Android:
- **Application type**: Android
- **Package name**: `com.farmacia.santamarta`
- **SHA-1**: `13:0D:70:CB:C9:09:14:81:56:31:A7:3B:67:9B:82:14:9A:97:5F:55`

#### Para iOS:
- **Application type**: iOS
- **Bundle ID**: `com.farmacia.santamarta`

#### Para Web (desarrollo):
- **Application type**: Web application
- **Authorized redirect URIs**: 
  - `https://ladohpkokvxflbgbxysb.supabase.co/auth/v1/callback`
  - `http://localhost:8081`
  - `https://auth.expo.io/@anonymous/farmacia-santamarta-*`
  - `https://auth.expo.io/*`

### 3. Configurar Supabase

1. Ve al dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `ladohpkokvxflbgbxysb`
3. Ve a **Authentication** > **Providers**
4. Habilita **Google** provider
5. Agrega las credenciales:
   - **Client ID**: Los Client IDs generados en Google Cloud Console
   - **Client Secret**: Los Client Secrets generados en Google Cloud Console

### 4. URLs de redirección en Supabase

Agregar estas URLs en **Authentication** > **URL Configuration**:

#### Site URL:
```
https://v9eyvve-anonymous-8081.exp.direct
```

#### Redirect URLs (agregar TODAS estas):
```
https://v9eyvve-anonymous-8081.exp.direct
https://auth.expo.io/*
exp://v9eyvve-anonymous-8081.exp.direct
http://localhost:8081
https://ladohpkokvxflbgbxysb.supabase.co/auth/v1/callback
```

**NOTA IMPORTANTE**: La URL del túnel `v9eyvve-anonymous-8081.exp.direct` es temporal y cambia cada vez que reinicies Expo. Actualiza las URLs en Supabase cuando sea necesario.

**Nota**: Reemplaza `TU_USUARIO_EXPO` con tu nombre de usuario de Expo (no de Supabase). 
Si no tienes cuenta de Expo o estás desarrollando localmente, puedes omitir esta URL por ahora.

### 5. Credenciales actuales (ejemplo)

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS=671299684323-a76otub7a57k10cmp1677p26kq1c93qs.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID=671299684323-qe79h2s6v5nufrl93a0tp70bb9l2d7q0.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB=671299684323-lfmne95ppplrr9jmtr3gq9v6cha3sq69.apps.googleusercontent.com
```

## Verificación

1. La aplicación debería mostrar el LoginScreen al iniciar
2. Al presionar "Continuar con Google", debería:
   - Abrir el navegador web
   - Mostrar la pantalla de login de Google
   - Redirigir de vuelta a la app tras autenticación exitosa
   - Crear automáticamente el perfil en la tabla `perfiles`
   - Navegar a la pantalla principal (HomeScreen)

## Debugging

### Logs importantes:
- `🔄 Iniciando autenticación con Google...`
- `✅ URL de autenticación creada`
- `✅ Autenticación exitosa`
- `🔄 Creando perfil para nuevo usuario...`
- `✅ Perfil creado exitosamente`

### Errores comunes:

1. **"Safari no pudo abrir el enlace - ruta no válida"**:
   - Ir a Supabase Dashboard > Authentication > URL Configuration
   - En "Redirect URLs" agregar: `https://auth.expo.io/*`
   - En "Site URL" poner: `http://localhost:8081`

2. **"Invalid redirect URI"**:
   - Verificar URLs en Google Cloud Console y Supabase
   - Asegurar que las URLs coincidan exactamente

3. **"Client ID not found"**:
   - Verificar las variables de entorno en `.env`
   - Reiniciar la aplicación después de cambiar `.env`

4. **"Network error"**:
   - Verificar conexión a internet
   - Verificar configuración de Supabase

### Configuración paso a paso en Supabase:

1. Ve a: https://supabase.com/dashboard/project/ladohpkokvxflbgbxysb/auth/url-configuration
2. En **"Site URL"** poner: `http://localhost:8081`
3. En **"Redirect URLs"** agregar (una por línea):
   ```
   http://localhost:8081
   https://auth.expo.io/*
   https://ladohpkokvxflbgbxysb.supabase.co/auth/v1/callback
   ```
4. Guardar cambios