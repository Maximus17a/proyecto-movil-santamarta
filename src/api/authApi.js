import { supabase } from './supabaseClient';
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

// Cache básico para perfiles (en memoria)
const profileCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

/**
 * Obtener perfil de usuario con caché básico
 */
export const getUserProfile = async (userId, useCache = true) => {
  try {
    console.log('🔍 Buscando perfil para usuario:', userId);
    
    // 1. Verificar caché en memoria si está habilitado
    if (useCache && profileCache.has(userId)) {
      const cached = profileCache.get(userId);
      if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
        console.log('⚡ Perfil obtenido del caché');
        return { data: cached.data, error: null };
      } else {
        profileCache.delete(userId); // Limpiar caché expirado
      }
    }
    
    // 2. Consulta a la base de datos con timeout
    console.log('🔍 Consultando base de datos...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
    
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle(); // Usar maybeSingle() en lugar de single()
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('❌ Error al obtener perfil:', error);
        console.error('📄 Detalles del error:', JSON.stringify(error, null, 2));
        return { data: null, error };
      }
      
      if (data) {
        console.log('✅ Perfil encontrado en BD:', data);
      } else {
        console.log('⚠️ No se encontró perfil para usuario:', userId);
      }
      
      // 3. Guardar en caché si hay datos
      if (data && useCache) {
        profileCache.set(userId, {
          data,
          timestamp: Date.now()
        });
        console.log('💾 Perfil guardado en caché');
      }
      
      return { data, error: null };
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ Timeout al obtener perfil');
        return { data: null, error: { message: 'Timeout al cargar perfil de usuario' } };
      }
      throw fetchError;
    }
    
  } catch (error) {
    console.error('❌ Error inesperado al obtener perfil:', error);
    return { data: null, error };
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

    const { data, error } = await supabase
      .from('perfiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error al crear/actualizar perfil:', error);
      console.error('📄 Detalles del error:', JSON.stringify(error, null, 2));
      return { data: null, error };
    }

    console.log('✅ Perfil creado/actualizado exitosamente:', data);
    
    // Actualizar caché después de crear
    if (data) {
      profileCache.set(user.id, {
        data,
        timestamp: Date.now()
      });
      console.log('💾 Perfil guardado en caché');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error inesperado al crear perfil:', error);
    console.error('📄 Stack trace:', error.stack);
    return { data: null, error };
  }
};