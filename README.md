# Farmacia Santa Marta - App Móvil

Una aplicación móvil desarrollada con React Native y Expo para la gestión de pedidos de la Farmacia Santa Marta.

## 🚀 Características principales

### Para Clientes 🧑‍💻
- **Catálogo de productos**: Navega por todos los medicamentos disponibles
- **Búsqueda y filtros**: Encuentra productos por nombre o categoría
- **Carrito de compras**: Agrega productos y gestiona tu pedido
- **Proceso de pedido**: Completa tu orden con información de entrega
- **Autenticación**: Registro e inicio de sesión seguro

### Para Repartidores 🛵
- **Dashboard de entregas**: Ve todos tus pedidos asignados
- **Pedidos disponibles**: Acepta nuevos pedidos para entregar
- **Seguimiento en tiempo real**: Actualiza el estado de las entregas
- **Comunicación directa**: Llama al cliente desde la app
- **Navegación integrada**: Abre direcciones en Google Maps
- **Estadísticas**: Ve tu rendimiento y ganancias

## 🛠️ Tecnologías utilizadas

- **React Native**: Framework principal
- **Expo**: Plataforma de desarrollo
- **React Navigation**: Navegación entre pantallas
- **Supabase**: Backend y base de datos
- **Expo Location**: Servicios de geolocalización
- **AsyncStorage**: Almacenamiento local

## 📱 Instalación y configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Expo CLI: `npm install -g @expo/cli`
- Dispositivo móvil con la app Expo Go o emulador

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone [url-del-repositorio]
   cd proyecto-movil-santamarta
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Edita el archivo `.env` con tus credenciales de Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_maps
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm start
   ```

5. **Ejecutar en dispositivo**
   - Escanea el código QR con Expo Go (Android/iOS)
   - O usa un emulador: `npm run android` o `npm run ios`

## 📂 Estructura del proyecto

```
src/
├── api/                    # Servicios de API (Supabase)
│   ├── authApi.js         # Autenticación
│   ├── clienteApi.js      # API para clientes
│   ├── repartidorApi.js   # API para repartidores
│   └── supabaseClient.js  # Configuración de Supabase
├── components/            # Componentes reutilizables
│   ├── Boton.js          # Botón personalizado
│   ├── TarjetaProducto.js # Tarjeta de producto
│   └── PedidoItem.js     # Item de pedido
├── context/              # Contextos de React
│   └── AuthContext.js    # Contexto de autenticación
├── hooks/                # Custom hooks
│   └── useCart.js        # Hook del carrito
├── navigation/           # Configuración de navegación
│   ├── AppNavigator.js   # Navegador principal
│   └── AuthStack.js      # Stack de autenticación
├── screens/              # Pantallas de la aplicación
│   ├── auth/            # Pantallas de autenticación
│   ├── cliente/         # Pantallas del cliente
│   └── repartidor/      # Pantallas del repartidor
├── App.js               # Punto de entrada
└── theme.js             # Configuración de tema
```

## 🔐 Autenticación y roles

La aplicación maneja dos tipos de usuarios:

### Clientes
- Pueden registrarse directamente en la app
- Acceso al catálogo y carrito de compras
- Historial de pedidos

### Repartidores
- Deben ser creados por un administrador
- Acceso a pedidos disponibles y asignados
- Herramientas de seguimiento y entrega

## 🗄️ Base de datos

La aplicación utiliza Supabase con las siguientes tablas principales:
- `users`: Información de usuarios y perfiles
- `productos`: Catálogo de medicamentos
- `pedidos`: Órdenes de compra
- `pedido_items`: Items individuales de cada pedido

## 🚀 Scripts disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm run android`: Ejecuta en emulador Android
- `npm run ios`: Ejecuta en emulador iOS
- `npm run web`: Ejecuta en navegador web

## 🔧 Configuración adicional

### Permisos requeridos
- **Ubicación**: Para el seguimiento de entregas
- **Teléfono**: Para llamadas directas a clientes
- **Internet**: Para conexión con la base de datos

### Configuración de producción
Para builds de producción, asegúrate de:
1. Configurar las variables de entorno correctas
2. Actualizar el `app.config.js` con tu información
3. Generar y configurar certificados necesarios

## 🤝 Contribución

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas, contacta al equipo de desarrollo.