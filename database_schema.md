# Esquema de Base de Datos - Farmacia Santa Marta

Para manejar los 10,000+ productos y el sistema de pedidos tipo Uber, utilizaremos **Firebase Realtime Database** por su capacidad de actualización en tiempo real para el seguimiento en mapas.

## 1. Colección: `users`
Almacena la información de todos los usuarios del sistema.
- `uid`: ID único de Firebase Auth.
- `nombre`: Nombre completo.
- `email`: Correo electrónico.
- `rol`: "CLIENTE", "REPARTIDOR", "ADMIN".
- `telefono`: Número de contacto.
- `ubicacion`: { lat, lng } (Solo para repartidores activos).

## 2. Colección: `products`
Optimizado para búsqueda rápida y escaneo.
- `id`: Código de barras o ID generado.
- `nombre`: Nombre del medicamento/producto.
- `descripcion`: Detalles del producto.
- `precio`: Precio unitario.
- `stock`: Cantidad disponible.
- `categoria`: Categoría del producto.
- `imagen_url`: Link a Firebase Storage.

## 3. Colección: `orders`
Manejo del flujo de pedidos.
- `id`: ID del pedido.
- `cliente_id`: Referencia al usuario cliente.
- `repartidor_id`: Referencia al repartidor asignado.
- `productos`: Listado de { product_id, cantidad, subtotal }.
- `total`: Monto total.
- `estado`: "PENDIENTE", "PREPARANDO", "EN_CAMINO", "ENTREGADO", "CANCELADO".
- `ubicacion_entrega`: { lat, lng, direccion_texto }.
- `timestamp`: Fecha y hora de creación.

## 4. Colección: `tracking`
Para el seguimiento en tiempo real sin sobrecargar la colección de pedidos.
- `order_id`: ID del pedido.
- `lat`: Latitud actual del repartidor.
- `lng`: Longitud actual del repartidor.
- `last_update`: Timestamp de la última posición.
