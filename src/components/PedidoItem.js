import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import Boton from './Boton';

const PedidoItem = ({ 
  pedido, 
  onPress, 
  onAccept, // Para repartidores
  onUpdateStatus, // Para repartidores
  showActions = false,
  userRole = 'cliente' 
}) => {
  const { 
    id, 
    estado, 
    total, 
    direccion_entrega, 
    created_at, 
    pedido_items = [],
    detalles_pedido = [],
    users,
    repartidor_id 
  } = pedido;

  // Usar detalles_pedido si existe, sino usar pedido_items
  const items = detalles_pedido.length > 0 ? detalles_pedido : pedido_items;

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return theme.colors.warning;
      case 'confirmado':
        return theme.colors.info;
      case 'en_camino':
        return theme.colors.primary;
      case 'entregado':
        return theme.colors.success;
      case 'cancelado':
        return theme.colors.danger;
      case 'problema':
        return theme.colors.danger;
      default:
        return theme.colors.secondary;
    }
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'confirmado':
        return 'Confirmado';
      case 'en_camino':
        return 'En camino';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      case 'problema':
        return 'Problema';
      default:
        return status;
    }
  };

  // Contar productos
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(pedido)}
      activeOpacity={0.7}
    >
      {/* Header del pedido */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pedidoId}>Pedido #{id}</Text>
          <Text style={styles.fecha}>{formatDate(created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(estado) }]}>
          <Text style={styles.statusText}>{getStatusText(estado)}</Text>
        </View>
      </View>

      {/* Información del cliente (para repartidores) */}
      {userRole === 'repartidor' && users && (
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>👤 {users.nombre}</Text>
          {users.telefono && (
            <Text style={styles.clientPhone}>📞 {users.telefono}</Text>
          )}
        </View>
      )}

      {/* Dirección */}
      <View style={styles.direccionContainer}>
        <Text style={styles.direccionLabel}>📍 Dirección:</Text>
        <Text style={styles.direccion}>{direccion_entrega}</Text>
      </View>

      {/* Items del pedido */}
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsLabel}>
          📦 {totalItems} producto{totalItems !== 1 ? 's' : ''}
        </Text>
        {items.slice(0, 2).map((item, index) => (
          <Text key={index} style={styles.itemText}>
            • {item.cantidad}x {item.productos?.nombre || item.producto?.nombre || item.nombre || 'Producto'}
          </Text>
        ))}
        {items.length > 2 && (
          <Text style={styles.moreItems}>
            ... y {items.length - 2} más
          </Text>
        )}
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.total}>Total: {formatPrice(total)}</Text>
      </View>

      {/* Acciones (para repartidores) */}
      {showActions && userRole === 'repartidor' && (
        <View style={styles.actionsContainer}>
          {estado === 'pendiente' && !repartidor_id && (
            <Boton
              tipo="success"
              tamaño="pequeño"
              onPress={() => onAccept?.(pedido)}
              style={styles.actionButton}
            >
              Aceptar
            </Boton>
          )}
          {estado === 'confirmado' && (
            <Boton
              tipo="primary"
              tamaño="pequeño"
              onPress={() => onUpdateStatus?.(pedido, 'en_camino')}
              style={styles.actionButton}
            >
              Salir a entregar
            </Boton>
          )}
          {estado === 'en_camino' && (
            <Boton
              tipo="success"
              tamaño="pequeño"
              onPress={() => onUpdateStatus?.(pedido, 'entregado')}
              style={styles.actionButton}
            >
              Marcar entregado
            </Boton>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    margin: theme.spacing.xs,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  pedidoId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  fecha: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },

  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    color: theme.colors.light,
    fontSize: 12,
    fontWeight: 'bold',
  },

  clientInfo: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.light,
    borderRadius: theme.borderRadius.sm,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  clientPhone: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },

  direccionContainer: {
    marginBottom: theme.spacing.sm,
  },
  direccionLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  direccion: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: theme.spacing.xs / 2,
  },

  itemsContainer: {
    marginBottom: theme.spacing.sm,
  },
  itemsLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  itemText: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 16,
  },
  moreItems: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
});

export default PedidoItem;