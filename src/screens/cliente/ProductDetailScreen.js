import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

import { useCart } from '../../hooks/useCart';
import { theme } from '../../theme';
import Boton from '../../components/Boton';

const ProductDetailScreen = ({ route, navigation }) => {
  const { producto } = route.params;
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const cartQuantity = getItemQuantity(producto.id);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    addToCart(producto, quantity);
    Alert.alert(
      '✅ Agregado al carrito',
      `${quantity} ${producto.nombre} agregado${quantity > 1 ? 's' : ''} al carrito`,
      [
        { text: 'Seguir comprando', style: 'cancel' },
        { text: 'Ver carrito', onPress: () => navigation.navigate('Checkout') },
      ]
    );
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, Math.min(producto.stock || 0, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleUpdateCartQuantity = (delta) => {
    const newCartQuantity = Math.max(0, cartQuantity + delta);
    updateQuantity(producto.id, newCartQuantity);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Imagen del producto */}
      <View style={styles.imageContainer}>
        {producto.imagen_url ? (
          <Image 
            source={{ uri: producto.imagen_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
      </View>

      {/* Información del producto */}
      <View style={styles.infoContainer}>
        <Text style={styles.nombre}>{producto.nombre}</Text>
        
        {producto.categoria && (
          <Text style={styles.categoria}>Categoría: {producto.categoria}</Text>
        )}

        <Text style={styles.precio}>{formatPrice(producto.precio)}</Text>

        {producto.descripcion && (
          <View style={styles.descripcionContainer}>
            <Text style={styles.descripcionLabel}>Descripción:</Text>
            <Text style={styles.descripcion}>{producto.descripcion}</Text>
          </View>
        )}

        {/* Información adicional */}
        <View style={styles.infoAdicional}>
          {producto.dosis && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dosis:</Text>
              <Text style={styles.infoValue}>{producto.dosis}</Text>
            </View>
          )}
          
          {producto.laboratorio && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Laboratorio:</Text>
              <Text style={styles.infoValue}>{producto.laboratorio}</Text>
            </View>
          )}

          {producto.necesita_receta && (
            <View style={styles.recetaWarning}>
              <Text style={styles.recetaText}>⚠️ Este medicamento requiere receta médica</Text>
            </View>
          )}
        </View>

        {/* Control de cantidad */}
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Cantidad a agregar:</Text>
          <View style={styles.quantityControls}>
            <Boton
              tipo="outline"
              tamaño="pequeño"
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              style={styles.quantityButton}
            >
              -
            </Boton>
            <Text style={styles.quantityText}>{quantity}</Text>
            <Boton
              tipo="outline"
              tamaño="pequeño"
              onPress={() => handleQuantityChange(1)}
              style={styles.quantityButton}
            >
              +
            </Boton>
          </View>
        </View>

        {/* Información del carrito si ya está agregado */}
        {cartQuantity > 0 && (
          <View style={styles.cartInfo}>
            <Text style={styles.cartInfoText}>
              Ya tienes {cartQuantity} en tu carrito
            </Text>
            <View style={styles.cartControls}>
              <Boton
                tipo="secondary"
                tamaño="pequeño"
                onPress={() => handleUpdateCartQuantity(-1)}
                disabled={cartQuantity <= 0}
              >
                Quitar 1
              </Boton>
              <Boton
                tipo="secondary"
                tamaño="pequeño"
                onPress={() => handleUpdateCartQuantity(1)}
              >
                Agregar 1
              </Boton>
            </View>
          </View>
        )}

        {/* Información de stock */}
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>Stock disponible:</Text>
          <Text style={[
            styles.stockValue,
            { color: producto.stock > 0 ? theme.colors.success : theme.colors.danger }
          ]}>
            {producto.stock > 0 ? `${producto.stock} unidades` : 'Sin stock'}
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <Boton
            tipo="primario"
            tamaño="grande"
            onPress={handleAddToCart}
            disabled={producto.stock <= 0 || quantity > producto.stock}
            style={styles.addButton}
          >
            {producto.stock > 0 
              ? `Agregar ${quantity} al carrito` 
              : 'No disponible'
            }
          </Boton>

          {cartQuantity > 0 && (
            <Boton
              tipo="success"
              tamaño="normal"
              onPress={() => navigation.navigate('Checkout')}
              style={styles.checkoutButton}
            >
              Ir al carrito ({cartQuantity})
            </Boton>
          )}
        </View>

        {/* Información de disponibilidad */}
        <View style={styles.availabilityInfo}>
          <Text style={[
            styles.availabilityText,
            { color: producto.stock > 0 ? theme.colors.success : theme.colors.danger }
          ]}>
            {producto.stock > 0 
              ? '✅ Disponible para entrega' 
              : '❌ No disponible actualmente'
            }
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  imageContainer: {
    height: 300,
    backgroundColor: theme.colors.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  placeholderText: {
    fontSize: 80,
  },

  infoContainer: {
    padding: theme.spacing.lg,
  },
  nombre: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  categoria: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  precio: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
  },

  descripcionContainer: {
    marginBottom: theme.spacing.lg,
  },
  descripcionLabel: {
    ...theme.typography.body1,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  descripcion: {
    ...theme.typography.body1,
    color: theme.colors.text,
    lineHeight: 24,
  },

  infoAdicional: {
    marginBottom: theme.spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    ...theme.typography.body2,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    minWidth: 100,
  },
  infoValue: {
    ...theme.typography.body2,
    color: theme.colors.text,
    flex: 1,
  },

  recetaWarning: {
    backgroundColor: theme.colors.warning,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  recetaText: {
    ...theme.typography.body2,
    color: theme.colors.dark,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  quantitySection: {
    marginBottom: theme.spacing.lg,
  },
  quantityLabel: {
    ...theme.typography.body1,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  quantityButton: {
    minWidth: 40,
  },
  quantityText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },

  cartInfo: {
    backgroundColor: theme.colors.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  cartInfoText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  cartControls: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  stockLabel: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  stockValue: {
    ...theme.typography.body1,
    fontWeight: 'bold',
  },

  actionButtons: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  addButton: {
    marginBottom: theme.spacing.sm,
  },
  checkoutButton: {},

  availabilityInfo: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  availabilityText: {
    ...theme.typography.body1,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;