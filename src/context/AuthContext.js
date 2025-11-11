import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getCurrentSession, 
  getUserProfile, 
  onAuthStateChange, 
  signOutUser,
  createUserProfile 
} from '../api/authApi';

// 1. Crear el contexto
const AuthContext = createContext();

// 2. Auth Provider (Provee la sesión a toda la app)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Función para obtener el perfil con timeout y manejo mejorado de errores
  const fetchProfile = async (userId, useCache = false) => {
    if (!userId) return null;
    
    setProfileLoading(true);
    try {
      // Configurar timeout para evitar esperas muy largas
      const profilePromise = getUserProfile(userId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 8000)
      );
      
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);
      
      if (profileError) {
        console.error("❌ Error al obtener perfil móvil:", profileError);
        
        // Si es error de conexión, mostrar mensaje específico
        if (profileError.message?.includes('internet') || 
            profileError.message?.includes('network') || 
            profileError.message?.includes('connection')) {
          console.warn("⚠️ Error de conectividad detectado. Reintentando...");
          return null;
        }
        return null;
      }
      
      console.log("✅ Perfil cargado:", profileData);
      return profileData;
    } catch (error) {
      if (error.message === 'Profile load timeout') {
        console.warn("⏱️ Timeout cargando perfil, continuando con la app");
        // Intentar cargar el perfil en segundo plano
        getUserProfile(userId).then(({ data }) => {
          if (data) {
            console.log("✅ Perfil cargado en segundo plano:", data);
            setProfile(data);
          }
        }).catch(console.error);
      } else {
        console.error("❌ Error inesperado al obtener perfil:", error);
      }
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Verificar sesión inicial
    const checkInitialSession = async () => {
      try {
        const { data: session } = await getCurrentSession();
        if (session && isMounted) {
          console.log('🔄 Sesión inicial encontrada:', session.user.email);
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Error verificando sesión inicial:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkInitialSession();
    
    // Verificación periódica de sesión (para capturar autenticación OAuth)
    const sessionInterval = setInterval(async () => {
      if (isMounted && !user) {
        try {
          const { data: session, error } = await getCurrentSession();
          if (error) {
            console.error('❌ Error verificando sesión:', error.message);
          }
          if (session && session.user) {
            console.log('🔄 Sesión detectada por verificación periódica:', session.user.email);
            clearInterval(sessionInterval); // Limpiar inmediatamente
            clearTimeout(timeoutCleanup); // Limpiar timeout también
            setUser(session.user);
            
            const userProfile = await fetchProfile(session.user.id);
            if (!userProfile) {
              console.log('🔄 Creando perfil para usuario OAuth...');
              const createResult = await createUserProfile(session.user);
              if (createResult.data && isMounted) {
                setProfile(createResult.data);
                console.log('✅ Perfil creado:', createResult.data);
              }
            } else if (isMounted) {
              setProfile(userProfile);
              console.log('✅ Perfil encontrado:', userProfile);
            }
          }
        } catch (error) {
          console.error('Error en verificación periódica:', error);
        }
      }
    }, 1000); // Verificar cada 1 segundo

    // Limpiar el intervalo después de 60 segundos para dar más tiempo al OAuth
    const timeoutCleanup = setTimeout(() => {
      clearInterval(sessionInterval);
      console.log('⚠️ Timeout de verificación OAuth alcanzado');
    }, 60000);
    
    // 3. Listener principal de Supabase (inspirado en el proyecto web)
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      console.log('� Cambio de autenticación:', event, session ? '✅ Con sesión' : '❌ Sin sesión');
      
      try {
        if (!isMounted) return; // Evitar actualizaciones si el componente se desmontó
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session && session.user) {
            console.log('� Usuario autenticado:', session.user.email);
            // Limpiar verificaciones periódicas ya que tenemos la sesión
            clearInterval(sessionInterval);
            clearTimeout(timeoutCleanup);
            setUser(session.user);
            
            // Para INITIAL_SESSION, intentar usar caché primero (como en el proyecto web)
            const useCache = event === 'INITIAL_SESSION';
            
            // Intentar obtener perfil con manejo de errores mejorado
            try {
              console.log('� Buscando perfil existente...');
              let userProfile = await fetchProfile(session.user.id, useCache);
              
              // Si no existe perfil, crear uno nuevo (especialmente para usuarios de Google)
              if (!userProfile && session.user) {
                console.log('🔄 Creando perfil para nuevo usuario...');
                const createResult = await createUserProfile(session.user);
                if (createResult.data) {
                  userProfile = createResult.data;
                  console.log('✅ Perfil creado exitosamente:', userProfile);
                } else {
                  console.error('❌ Error al crear perfil:', createResult.error);
                }
              }
              
              if (isMounted) {
                setProfile(userProfile);
                console.log('🏠 Usuario autenticado - navegación habilitada');
              }
            } catch (profileError) {
              console.error("❌ Error crítico obteniendo perfil:", profileError);
              if (isMounted) {
                setProfile(null);
              }
            }
          } else {
            console.log('❌ No hay sesión de usuario');
            setUser(null);
            setProfile(null);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuario cerró sesión');
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("❌ Error en el callback de onAuthStateChange:", error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        // Garantizamos que la carga termine
        if (isMounted) {
          setLoading(false);
          setProfileLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearInterval(sessionInterval);
      clearTimeout(timeoutCleanup);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Función para verificar sesión manualmente (especialmente después de OAuth)
  const checkSession = async () => {
    try {
      console.log('🔄 Verificación manual de sesión iniciada...');
      
      // Intentar obtener la sesión con reintentos
      let session = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!session && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Intento ${attempts}/${maxAttempts} de obtener sesión...`);
        
        const { data: sessionData, error } = await getCurrentSession();
        if (error) {
          console.error(`❌ Error en intento ${attempts}:`, error.message);
        }
        
        if (sessionData && sessionData.user) {
          session = sessionData;
          break;
        }
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        }
      }
      
      if (session && session.user) {
        console.log('✅ Sesión verificada manualmente:', session.user.email);
        setUser(session.user);
        
        let userProfile = await fetchProfile(session.user.id);
        if (!userProfile) {
          console.log('🔄 Creando perfil después de verificación manual...');
          const createResult = await createUserProfile(session.user);
          if (createResult.data) {
            setProfile(createResult.data);
            console.log('✅ Perfil creado:', createResult.data);
          }
        } else {
          setProfile(userProfile);
          console.log('✅ Perfil encontrado:', userProfile);
        }
        return session;
      } else {
        console.log('⚠️ No hay sesión activa después de todos los intentos');
      }
      return null;
    } catch (error) {
      console.error('❌ Error verificando sesión manual:', error);
      return null;
    }
  };

  // 4. Función de Logout
  const signOut = async () => {
    const currentUserId = user?.id;
    console.log('👋 Cerrando sesión para usuario:', user?.email);
    
    await signOutUser();
    
    // Limpiar datos del usuario actual (incluyendo carrito)
    if (currentUserId) {
      try {
        // Eliminar carrito del usuario
        import('../hooks/useCart').then(({ useCart }) => {
          // No podemos usar el hook directamente aquí, pero podemos limpiar AsyncStorage
          import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.removeItem(`@farmacia_cart_${currentUserId}`);
            console.log('🗑️ Carrito eliminado del storage para usuario:', currentUserId);
          });
        });
      } catch (error) {
        console.error('❌ Error al limpiar datos del usuario:', error);
      }
    }
    
    // El listener onAuthStateChange pondrá user/profile en null
  };

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    signOut,
    checkSession,
    // La clave para la navegación en móvil
    isAuthenticated: !!user && !loading, // Usuario + carga terminada
    isAdmin: profile?.rol === 'admin',
    isDeliverer: profile?.rol === 'repartidor',
    isClient: profile?.rol === 'cliente',
  };  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 5. Custom Hook para consumir el contexto
export function useAuth() {
  return useContext(AuthContext);
}