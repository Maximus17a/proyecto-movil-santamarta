import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/cliente/LoginScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  console.log('🔑 AuthNavigator - Mostrando pantallas de autenticación');
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Sin header para un diseño más limpio
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: 'Iniciar Sesión',
          animationTypeForReplace: 'push',
        }}
      />
    </Stack.Navigator>
  );
}