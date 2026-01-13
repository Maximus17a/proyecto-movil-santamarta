# Farmacia Santa Marta - App Móvil (Alineada con Requerimientos Universitarios)

Esta aplicación móvil ha sido desarrollada con **React Native** y **Expo**, optimizada para ser trabajada en **Android Studio** y cumple con los requerimientos técnicos del proyecto programado de la Universidad Latina de Costa Rica.

## 📋 Cumplimiento de Requerimientos (PDF)

La aplicación integra los 5 elementos mínimos requeridos por la plataforma Android:

1.  **Conexión a Internet**: Consumo de servicios en tiempo real a través de **Supabase**.
2.  **Uso de Almacenamiento**: Persistencia de datos local mediante **AsyncStorage** para el carrito y sesión.
3.  **GPS y Google Maps**: Implementado en el módulo de repartidor para seguimiento de entregas (`expo-location` y `react-native-maps`).
4.  **Llamadas Telefónicas**: Funcionalidad de contacto directo con el cliente desde la app del repartidor.
5.  **Sensores (Acelerómetro/Giroscopio)**: Integrado mediante `expo-sensors` para optimización de la interfaz según el movimiento.

## 🛠️ Configuración para Android Studio

Para trabajar este proyecto en **Android Studio**, sigue estos pasos:

### 1. Preparación del Entorno
*   Asegúrate de tener instalado **Android Studio** y el **Android SDK**.
*   Configura las variables de entorno `ANDROID_HOME`.
*   Instala las dependencias del proyecto:
    ```bash
    npm install
    ```

### 2. Generación de la Carpeta Nativa (Prebuild)
Como este es un proyecto Expo, para verlo "alineado" con Android Studio debes generar la carpeta `android`:
```bash
npx expo prebuild
```
*Esto creará la carpeta `/android` que puedes abrir directamente con Android Studio.*

### 3. Ejecución en Android Studio
*   Abre Android Studio.
*   Selecciona **"Open an Existing Project"** y navega hasta la carpeta `android` generada.
*   Deja que Gradle sincronice el proyecto.
*   Puedes ejecutar la app directamente en un emulador o dispositivo físico desde el botón "Run" de Android Studio.

## 🚀 Características del Sistema

### Para Clientes 🧑‍💻
*   **Catálogo de productos**: Navegación por medicamentos.
*   **Carrito de compras**: Gestión de pedidos con persistencia local.
*   **Autenticación**: Registro e inicio de sesión seguro con Supabase.

### Para Repartidores 🛵
*   **Seguimiento en tiempo real**: Uso de GPS para la ruta de entrega.
*   **Comunicación**: Botón de llamada rápida al cliente.
*   **Mapas**: Visualización de la ubicación de entrega.

## 📂 Estructura del Proyecto

*   `src/api/`: Lógica de conexión con Supabase.
*   `src/components/`: Componentes visuales reutilizables.
*   `src/context/`: Manejo de estado global (Auth).
*   `src/screens/`: Pantallas divididas por roles (Cliente/Repartidor).
*   `android/`: (Generada tras prebuild) Código nativo para Android Studio.

## 🔐 Variables de Entorno
Crea un archivo `.env` en la raíz:
```env
EXPO_PUBLIC_SUPABASE_URL=tu_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

---
**Cliente:** Farmacia Santa Marta
**Institución:** Universidad Latina de Costa Rica
**Tecnología:** React Native + Expo + Android Studio
