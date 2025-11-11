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

// Función de utilidad para logging
export const logSupabaseOperation = (operation, result) => {
  if (result.error) {
    console.error(`❌ Error en ${operation}:`, result.error);
  } else {
    console.log(`✅ ${operation} exitoso:`, result.data ? 'con datos' : 'sin datos');
  }
};

export default supabase;