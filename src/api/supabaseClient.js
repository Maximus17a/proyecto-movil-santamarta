import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Leemos las variables de entorno de Expo
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug: verificar que las variables se cargan correctamente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Presente' : '❌ Ausente');
} else {
  console.log('✅ Variables de Supabase cargadas correctamente');
}

// Configuración simplificada para React Native/Expo
const supabaseOptions = {
  auth: {
    // Configuración esencial para React Native
    detectSessionInUrl: false,
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    // Storage para React Native
    storage: AsyncStorage,
  }
};

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Función de utilidad para logging mejorado
export const logSupabaseOperation = (operation, result) => {
  if (result.error) {
    console.error(`❌ Error en ${operation}:`, result.error);
  } else {
    console.log(`✅ ${operation} exitoso:`, result.data ? 'con datos' : 'sin datos');
  }
};

// Wrapper centralizado para operaciones de Supabase con manejo consistente de errores
export const supabaseWrapper = {
  /**
   * Wrapper para operaciones SELECT con manejo de errores estandarizado
   * @param {string} operation - Nombre de la operación para logging
   * @param {Promise} query - Query de Supabase a ejecutar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Resultado estandarizado
   */
  async select(operation, query, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Iniciando operación: ${operation}`);
      
      const result = await query;
      const duration = Date.now() - startTime;
      
      // Log de performance para consultas lentas
      if (duration > 1000) {
        console.warn(`🐌 Consulta lenta detectada: ${operation} - ${duration}ms`);
      }
      
      if (result.error) {
        console.error(`❌ Error en ${operation}:`, {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code,
          duration: `${duration}ms`
        });
        
        return {
          data: null,
          error: {
            message: result.error.message,
            code: result.error.code,
            operation,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      console.log(`✅ ${operation} completado en ${duration}ms:`, {
        count: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
        hasData: !!result.data
      });
      
      return {
        data: result.data,
        error: null,
        metadata: {
          operation,
          duration,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error inesperado en ${operation}:`, {
        message: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      return {
        data: null,
        error: {
          message: 'Error inesperado en la operación',
          originalError: error.message,
          operation,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Wrapper para operaciones INSERT/UPDATE/DELETE
   * @param {string} operation - Nombre de la operación
   * @param {Promise} query - Query de Supabase a ejecutar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Resultado estandarizado
   */
  async modify(operation, query, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Iniciando operación de modificación: ${operation}`);
      
      const result = await query;
      const duration = Date.now() - startTime;
      
      if (result.error) {
        console.error(`❌ Error en ${operation}:`, {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code,
          duration: `${duration}ms`
        });
        
        return {
          data: null,
          error: {
            message: result.error.message,
            code: result.error.code,
            operation,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      console.log(`✅ ${operation} completado en ${duration}ms:`, {
        affected: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0)
      });
      
      return {
        data: result.data,
        error: null,
        metadata: {
          operation,
          duration,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error inesperado en ${operation}:`, {
        message: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      return {
        data: null,
        error: {
          message: 'Error inesperado en la operación',
          originalError: error.message,
          operation,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Wrapper para operaciones RPC (funciones de base de datos)
   * @param {string} operation - Nombre de la operación
   * @param {string} functionName - Nombre de la función RPC
   * @param {Object} params - Parámetros para la función
   * @returns {Promise<Object>} Resultado estandarizado
   */
  async rpc(operation, functionName, params = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔧 Ejecutando función RPC: ${operation} (${functionName})`);
      
      const result = await supabase.rpc(functionName, params);
      const duration = Date.now() - startTime;
      
      if (result.error) {
        console.error(`❌ Error en RPC ${operation}:`, {
          message: result.error.message,
          function: functionName,
          params,
          duration: `${duration}ms`
        });
        
        return {
          data: null,
          error: {
            message: result.error.message,
            function: functionName,
            operation,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      console.log(`✅ RPC ${operation} completado en ${duration}ms`);
      
      return {
        data: result.data,
        error: null,
        metadata: {
          operation,
          function: functionName,
          duration,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error inesperado en RPC ${operation}:`, {
        message: error.message,
        function: functionName,
        duration: `${duration}ms`
      });
      
      return {
        data: null,
        error: {
          message: 'Error inesperado en función RPC',
          originalError: error.message,
          function: functionName,
          operation,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};

// Cache utilities
export const cacheUtils = {
  /**
   * Generar clave de caché consistente
   * @param {string} prefix - Prefijo de la clave
   * @param {Array} params - Parámetros para la clave
   * @returns {string} Clave de caché
   */
  generateKey(prefix, ...params) {
    return `${prefix}_${params.join('_')}`;
  },

  /**
   * Obtener datos del caché con verificación de expiración
   * @param {string} key - Clave del caché
   * @param {number} ttl - TTL en milisegundos
   * @returns {Promise<Object|null>} Datos del caché o null si expiró
   */
  async get(key, ttl = 30 * 60 * 1000) { // 30 minutos por defecto
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          console.log(`⚡ Cache hit: ${key}`);
          return data;
        } else {
          console.log(`⏱️ Cache expirado: ${key}`);
          await AsyncStorage.removeItem(key);
        }
      }
      console.log(`🔍 Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error(`❌ Error leyendo cache ${key}:`, error);
      return null;
    }
  },

  /**
   * Guardar datos en caché
   * @param {string} key - Clave del caché
   * @param {any} data - Datos a guardar
   * @returns {Promise<boolean>} True si se guardó exitosamente
   */
  async set(key, data) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`💾 Datos guardados en cache: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Error guardando cache ${key}:`, error);
      return false;
    }
  },

  /**
   * Invalidar entrada específica del caché
   * @param {string} key - Clave a invalidar
   * @returns {Promise<boolean>} True si se invalidó exitosamente
   */
  async invalidate(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cache invalidado: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Error invalidando cache ${key}:`, error);
      return false;
    }
  }
};

export default supabase;