import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import Boton from './Boton';

const TarjetaProducto = ({ 
  producto, 
  onPress, 
  onAddToCart,
  cartQuantity = 0,
  showAddButton = true,
  style = {} 
}) => {
  const { nombre, precio, imagen_url, descripcion, stock = 0 } = producto;
  const disponible = stock > 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !disponible && styles.containerDisabled, style]}
      onPress={() => disponible && onPress?.(producto)}
      activeOpacity={0.7}
      disabled={!disponible}
    >
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        {imagen_url ? (
          <Image 
            source={{ uri: imagen_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        {!disponible && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>No disponible</Text>
          </View>
        )}
        {cartQuantity > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartQuantity}</Text>
          </View>
        )}
      </View>

      {/* Información del producto */}
      <View style={styles.infoContainer}>
        <Text style={styles.nombre} numberOfLines={2}>
          {nombre}
        </Text>
        
        {descripcion && (
          <Text style={styles.descripcion} numberOfLines={2}>
            {descripcion}
          </Text>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.precio}>
            {formatPrice(precio)}
          </Text>
          
          {showAddButton && disponible && (
            <Boton
              tipo="primario"
              tamaño="pequeño"
              onPress={() => onAddToCart?.(producto)}
              style={styles.addButton}
            >
              {cartQuantity > 0 ? 'Agregar más' : 'Agregar'}
            </Boton>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    margin: theme.spacing.xs,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  containerDisabled: {
    opacity: 0.6,
  },

  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.md,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.light,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  placeholderText: {
    fontSize: 32,
  },

  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    color: theme.colors.light,
    fontWeight: 'bold',
    fontSize: 14,
  },

  cartBadge: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  cartBadgeText: {
    color: theme.colors.light,
    fontSize: 12,
    fontWeight: 'bold',
  },

  infoContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  descripcion: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
    flex: 1,
  },
  addButton: {
    paddingHorizontal: theme.spacing.sm,
  },
});

export default TarjetaProducto;