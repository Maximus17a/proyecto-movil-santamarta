import React, { Suspense } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

// Navegadores
import AuthNavigator from './AuthNavigator';

// Lazy Loading de pantallas del cliente
const HomeScreen = React.lazy(() => import('../screens/cliente/HomeScreen'));
const ProductDetailScreen = React.lazy(() => import('../screens/cliente/ProductDetailScreen'));
const CheckoutScreen = React.lazy(() => import('../screens/cliente/CheckoutScreen'));

// Lazy Loading de pantallas del repartidor  
const DeliveriesScreen = React.lazy(() => import('../screens/repartidor/DeliveriesScreen'));
const TrackingScreen = React.lazy(() => import('../screens/repartidor/TrackingScreen'));

const Stack = createStackNavigator();

// Componente de carga para Suspense
const LazyLoadingFallback = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.colors.primary 
  }}>
    <ActivityIndicator size="large" color="white" />
  </View>
);

// Wrapper para componentes lazy con Suspense
const withSuspense = (Component) => (props) => (
  <Suspense fallback={<LazyLoadingFallback />}>
    <Component {...props} />
  </Suspense>
);

const AppNavigator = () => {
  const { isAuthenticated, loading, user, profile, profileLoading } = useAuth();

  console.log('🔄 AppNavigator - Estado detallado:', { 
    loading, 
    profileLoading,
    isAuthenticated, 
    hasUser: !!user, 
    hasProfile: !!profile,
    userEmail: user?.email,
    profileRole: profile?.rol
  });

  // Pantalla de carga mientras se verifica la autenticación inicial
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: theme.colors.primary 
      }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Si no está autenticado, mostrar pantallas de autenticación
  if (!isAuthenticated) {
    console.log('🔒 Usuario no autenticado, mostrando LoginScreen');
    return <AuthNavigator />;
  }

  // Determinar el tipo de navegación basado en el rol del usuario
  const userRole = profile?.rol || 'cliente';
  console.log('✅ Usuario autenticado - Rol:', userRole);

  // Navegación específica por rol
  if (userRole === 'repartidor') {
    console.log('🚴‍♂️ Mostrando navegación de repartidor');
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.light,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Deliveries" 
          component={withSuspense(DeliveriesScreen)}
          options={{ 
            title: 'Mis Entregas',
            headerLeft: null, // Evitar botón de atrás
          }}
        />
        <Stack.Screen 
          name="Tracking" 
          component={withSuspense(TrackingScreen)}
          options={{ title: 'Detalles de Entrega' }}
        />
      </Stack.Navigator>
    );
  }

  // Navegación para clientes y admins (por defecto)
  console.log('🛒 Mostrando navegación de cliente/admin');
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.light,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Navegación para clientes */}
      <Stack.Screen 
        name="Home" 
        component={withSuspense(HomeScreen)}
        options={{ 
          title: 'Farmacia Santa Marta',
          headerLeft: null, // Evitar botón de atrás
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={withSuspense(ProductDetailScreen)}
        options={{ title: 'Detalles del Producto' }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={withSuspense(CheckoutScreen)}
        options={{ title: 'Finalizar Pedido' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;