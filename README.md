# Farmacia Santa Marta - Aplicación de Pedidos e Inventario

Este es un proyecto nativo para Android desarrollado en **Java** utilizando **Android Studio**. La aplicación está diseñada para modernizar la gestión de pedidos y el control de inventario de la Farmacia Santa Marta en Pérez Zeledón.

## Características Principales

### 1. Módulo de Administrador (Admin)
- **Gestión de Inventario Masivo:** Optimizado para manejar más de 10,000 productos.
- **Escaneo con Cámara:** Integración con Google ML Kit para lectura de códigos de barras y actualización rápida de stock.
- **Panel de Control:** Visualización de ventas y gestión de empleados.

### 2. Módulo de Cliente
- **Catálogo en Línea:** Búsqueda y filtrado de medicamentos y productos.
- **Carrito de Compras:** Proceso de pedido intuitivo.
- **Seguimiento en Tiempo Real:** Visualización del repartidor en el mapa (estilo Uber).

### 3. Módulo de Repartidor
- **Gestión de Entregas:** Recepción de pedidos cercanos.
- **Navegación:** Integración con Google Maps para rutas óptimas.
- **Actualización de Estado:** Notificaciones al cliente sobre el progreso del pedido.

## Tecnologías Utilizadas
- **Lenguaje:** Java (Android Nativo).
- **Base de Datos:** Firebase Realtime Database (Sincronización en tiempo real).
- **Autenticación:** Firebase Auth.
- **Mapas:** Google Maps SDK & Google Play Services Location.
- **Escaneo:** Google ML Kit Barcode Scanning.

## Estructura del Proyecto
El código sigue una arquitectura limpia organizada por módulos (`ui.admin`, `ui.client`, `ui.delivery`) y modelos de datos centralizados.
