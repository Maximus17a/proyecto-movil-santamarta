import { supabase, supabaseWrapper, cacheUtils } from './supabaseClient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configurar WebBrowser para manejar la autenticación
WebBrowser.maybeCompleteAuthSession();

// URLs de redirección
const redirectUrl = AuthSession.makeRedirectUri({
  scheme: undefined,
  preferLocalhost: false,
});



/**
 * Iniciar sesión con Google usando Supabase Auth
 */
export const signInWithGoogle = async () => {
  try {
    console.log('🔄 Iniciando autenticación con Google...');
    console.log('🔗 URL de redirección:', redirectUrl);
    
    // Crear URL de autenticación de Google con Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('❌ Error al iniciar sesión con Google:', error);
      throw error;
    }

    console.log('✅ URL de autenticación creada:', data.url);
    
    // Abrir navegador para autenticación
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    
    if (result.type === 'success') {
      console.log('✅ Autenticación exitosa con Google');
      console.log('🔗 URL de resultado:', result.url);
      
      // Para OAuth con código, ayudar a Supabase a procesarlo
      if (result.url && result.url.includes('code=')) {
        console.log('✅ OAuth exitoso - código recibido');
        console.log('🔄 Forzando detección del código en Supabase...');
        
        try {
          // Extraer parámetros de la URL
          const url = new URL(result.url);
          const urlParams = url.searchParams;
          
          // Crear objeto con todos los parámetros OAuth
          const oauthParams = {};
          urlParams.forEach((value, key) => {
            oauthParams[key] = value;
          });
          
          console.log('📦 Parámetros OAuth:', oauthParams);
          console.log('🔗 URL de redirección original:', redirectUrl);
          console.log('🔗 URL de resultado completa:', result.url);
          
          // Intentar múltiples métodos para procesar el código OAuth
          const code = oauthParams.code;
          
          if (code) {
            // Método 1: Intentar con la función nativa de Supabase
            console.log('🔄 Método 1: Usando exchangeCodeForSession...');
            try {
              const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              
              if (!exchangeError && sessionData?.session) {
                console.log('✅ Sesión obtenida con método nativo:', sessionData.session.user.email);
                return { success: true, data: result, session: sessionData.session, manualAuth: true };
              } else {
                console.log('⚠️ Método nativo falló:', exchangeError?.message);
              }
            } catch (nativeError) {
              console.log('⚠️ Método nativo error:', nativeError.message);
            }
            
            // Método 2: API REST manual
            console.log('🔄 Método 2: Usando API REST...');
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                  grant_type: 'authorization_code',
                  code: code,
                  redirect_uri: redirectUrl,
                })
              });
              
              if (response.ok) {
                const tokenData = await response.json();
                console.log('✅ Tokens obtenidos con API REST');
                
                if (tokenData.access_token && tokenData.refresh_token) {
                  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token
                  });
                  
                  if (!sessionError && sessionData?.session) {
                    console.log('✅ Sesión establecida manualmente:', sessionData.session.user.email);
                    return { success: true, data: result, session: sessionData.session, manualAuth: true };
                  } else {
                    console.error('❌ Error estableciendo sesión:', sessionError);
                  }
                }
              } else {
                const errorText = await response.text();
                console.error('❌ Error API REST:', response.status, errorText);
              }
            } catch (apiError) {
              console.error('❌ Error en API REST:', apiError.message);
            }
          }
          
        } catch (error) {
          console.error('⚠️ Error procesando parámetros OAuth:', error);
        }
        
        return { success: true, data: result, requiresSessionCheck: true };
      }
      
      // Para tokens directos (poco común en móvil)
      if (result.url && result.url.includes('access_token')) {
        console.log('✅ OAuth exitoso - tokens directos');
        try {
          const url = new URL(result.url);
          const hashParams = new URLSearchParams(url.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            const { data: session, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (session && !error) {
              console.log('✅ Sesión configurada exitosamente:', session.user.email);
              return { success: true, data: result, session: session };
            }
          }
        } catch (error) {
          console.error('❌ Error procesando tokens directos:', error);
        }
      }
      
      // Fallback - retornar éxito de todas formas
      return { success: true, data: result, requiresSessionCheck: true };
      
    } else {
      console.log('⚠️ Autenticación cancelada:', result.type);
      return { success: false, error: 'Autenticación cancelada' };
    }
    
  } catch (error) {
    console.error('❌ Error en signInWithGoogle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener sesión actual
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      return { data: null, error };
    }
    
    return { data: session, error: null };
  } catch (error) {
    console.error('❌ Error inesperado al obtener sesión:', error);
    return { data: null, error };
  }
};

/**
 * Obtener perfil de usuario con caché persistente optimizado
 */
export const getUserProfile = async (userId, useCache = true) => {
  try {
    console.log('🔍 Buscando perfil para usuario:', userId);
    
    // 1. Verificar caché persistente si está habilitado (TTL: 30 minutos)
    if (useCache) {
      const cacheKey = cacheUtils.generateKey('profile', userId);
      const cached = await cacheUtils.get(cacheKey, 30 * 60 * 1000); // 30 minutos
      
      if (cached) {
        console.log('⚡ Perfil obtenido del caché persistente');
        return { data: cached, error: null, fromCache: true };
      }
    }
    
    // 2. Consulta a la base de datos con wrapper mejorado
    console.log('🔍 Consultando base de datos...');
    
    const query = supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Usar maybeSingle() para manejar casos sin datos
    
    const result = await supabaseWrapper.select('Obtener perfil de usuario', query);
    
    // 3. Guardar en caché persistente si hay datos y se permite caché
    if (result.data && !result.error && useCache) {
      const cacheKey = cacheUtils.generateKey('profile', userId);
      await cacheUtils.set(cacheKey, result.data);
      console.log('💾 Perfil guardado en caché persistente');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error inesperado al obtener perfil:', error);
    return { 
      data: null, 
      error: {
        message: 'Error inesperado al obtener perfil',
        originalError: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Invalidar caché de perfil de usuario
 * Útil después de actualizaciones del perfil
 */
export const invalidateUserProfileCache = async (userId) => {
  try {
    const cacheKey = cacheUtils.generateKey('profile', userId);
    await cacheUtils.invalidate(cacheKey);
    console.log('🗑️ Caché de perfil invalidado para usuario:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error invalidando caché de perfil:', error);
    return false;
  }
};

/**
 * Listener de cambios de autenticación
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * Cerrar sesión
 */
export const signOutUser = async () => {
  try {
    console.log('🔄 Cerrando sesión...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error al cerrar sesión:', error);
      return { success: false, error };
    }
    
    console.log('✅ Sesión cerrada exitosamente');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Error inesperado al cerrar sesión:', error);
    return { success: false, error };
  }
};

/**
 * Crear o actualizar perfil de usuario después del registro
 */
export const createUserProfile = async (user, additionalData = {}) => {
  try {
    console.log('🔄 Iniciando creación de perfil para:', user.email);
    console.log('📋 Datos del usuario:', {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    });

    const profileData = {
      id: user.id,
      nombre_completo: user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      additionalData.nombre_completo || 
                      user.email,
      rol: additionalData.rol || 'cliente',
      ...additionalData
    };

    console.log('📝 Datos del perfil a crear:', profileData);

    const query = supabase
      .from('perfiles')
      .upsert(profileData)
      .select()
      .single();

    const result = await supabaseWrapper.modify('Crear/actualizar perfil de usuario', query);

    // Invalidar caché anterior y actualizar con nuevos datos
    if (result.data && !result.error) {
      await invalidateUserProfileCache(user.id);
      
      // Guardar nuevo perfil en caché
      const cacheKey = cacheUtils.generateKey('profile', user.id);
      await cacheUtils.set(cacheKey, result.data);
      console.log('💾 Nuevo perfil guardado en caché persistente');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error inesperado al crear perfil:', error);
    return { 
      data: null, 
      error: {
        message: 'Error inesperado al crear perfil',
        originalError: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};