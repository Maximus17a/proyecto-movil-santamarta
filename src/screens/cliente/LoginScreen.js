import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle, getCurrentSession } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, loading, profileLoading, checkSession } = useAuth();

  // Detectar cuando el usuario se ha autenticado para evitar bucles
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ Usuario detectado en LoginScreen, navegación manejada por AppNavigator');
    }
  }, [user, loading]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Iniciando login con Google...');
      
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log('✅ Login exitoso');
        
        if (result.manualAuth && result.session) {
          console.log('🎉 Autenticación manual exitosa, sesión ya disponible');
          // La sesión ya fue establecida manualmente, no necesitamos verificaciones adicionales
        } else {
          console.log('🔄 Esperando detección automática de sesión...');
          
          // Solo unas pocas verificaciones para el procesamiento automático
          const verificationIntervals = [1000, 3000, 6000];
          verificationIntervals.forEach((delay, index) => {
            setTimeout(async () => {
              console.log(`🔄 Verificación ${index + 1}/${verificationIntervals.length}...`);
              await checkSession();
            }, delay);
          });
        }
      } else {
        Alert.alert(
          'Error de autenticación',
          result.error || 'No se pudo completar el inicio de sesión',
          [{ text: 'Entendido', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert(
        'Error inesperado',
        'Ocurrió un problema al iniciar sesión. Por favor intenta nuevamente.',
        [{ text: 'Entendido', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar spinner si está cargando la autenticación inicial
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  // Mostrar spinner si está intentando hacer login
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  // Mostrar spinner si está cargando el perfil después del login
  if (user && profileLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ADE80" />
      
      <LinearGradient
        colors={['#4ADE80', '#22C55E', '#16A34A']}
        style={styles.gradientBackground}
      >
        {/* Elementos decorativos */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Sección del encabezado */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/logo-farmacia-santa-marta..png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appTitle}>Farmacia Santa Marta</Text>
            <Text style={styles.appSubtitle}>
              Tu farmacia de confianza, ahora en tu móvil
            </Text>
          </View>

          {/* Sección de login */}
          <View style={styles.loginSection}>
            <Text style={styles.welcomeText}>Bienvenido</Text>
            <Text style={styles.instructionText}>
              Inicia sesión con tu cuenta de Google para continuar
            </Text>

            {/* Botón de Google */}
            <TouchableOpacity
              style={[styles.googleButton, isLoading && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#4ADE80" />
                    <Text style={styles.buttonText}>Iniciando sesión...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text style={styles.buttonText}>Continuar con Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Información adicional */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                Al continuar, aceptas nuestros términos de servicio y política de privacidad
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Versión 1.0.0 • Santa Marta, Costa Rica
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  infoSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});