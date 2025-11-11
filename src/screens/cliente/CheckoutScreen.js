import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';

import { createOrder } from '../../api/clienteApi';
import { useCart } from '../../hooks/useCart';
import { theme } from '../../theme';
import Boton from '../../components/Boton';

const CheckoutScreen = ({ navigation }) => {
  const { 
    cartItems, 
    getTotalPrice, 
    getTotalItems, 
    clearCart, 
    updateQuantity,
    removeFromCart,
    isEmpty,
    loading: cartLoading 
  } = useCart();
  
  console.log('🛒 CheckoutScreen - Estado del carrito:', {
    isEmpty,
    cartLoading,
    cartItemsLength: cartItems.length,
    cartItems: cartItems.map(item => ({ id: item.id, nombre: item.nombre, cantidad: item.cantidad }))
  });

  const [loading, setLoading] = useState(false);
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [notas, setNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const metodosPago = [
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'tarjeta', label: 'Tarjeta (en entrega)' },
    { id: 'transferencia', label: 'Transferencia' },
  ];

  useEffect(() => {
    console.log('🛒 CheckoutScreen useEffect - evaluando redirección:', { 
      isEmpty, 
      cartLoading, 
      shouldRedirect: isEmpty && !cartLoading 
    });
    
    // Solo redirigir si el carrito está vacío Y no está cargando
    if (isEmpty && !cartLoading) {
      console.log('🔄 Carrito vacío y carga completa - redirigiendo a Home');
      navigation.navigate('Home');
    }
  }, [isEmpty, cartLoading, navigation]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const validateForm = () => {
    if (!direccionEntrega.trim()) {
      Alert.alert('Error', 'Por favor ingresa la dirección de entrega');
      return false;
    }
    if (!telefonoContacto.trim()) {
      Alert.alert('Error', 'Por favor ingresa un teléfono de contacto');
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        })),
        total: getTotalPrice(),
        direccion_entrega: direccionEntrega.trim(),
        telefono_contacto: telefonoContacto.trim(),
        notas: notas.trim() || null,
        metodo_pago: metodoPago
      };

      console.log('🛒 Enviando datos del pedido:', {
        ...orderData,
        itemsCount: orderData.items.length,
        totalPrice: orderData.total
      });

      const result = await createOrder(orderData);

      console.log('📦 Resultado de createOrder:', result);

      if (result.error) {
        const errorMessage = result.error.message || 'No se pudo crear el pedido. Intenta de nuevo.';
        Alert.alert('Error al crear pedido', errorMessage);
        console.error('❌ Error al crear pedido:', result.error);
      } else {
        // Limpiar carrito
        clearCart();
        
        Alert.alert(
          '✅ Pedido creado',
          'Tu pedido se ha creado exitosamente. En breve te contactaremos para confirmar la entrega.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Home') }
          ]
        );
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.nombre}</Text>
        <Text style={styles.itemPrice}>
          {formatPrice(item.precio)} c/u
        </Text>
      </View>
      
      <View style={styles.itemControls}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.cantidad - 1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.cantidad}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.cantidad + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.itemSubtotal}>
        {formatPrice(item.precio * item.cantidad)}
      </Text>
    </View>
  );

  const renderPaymentMethod = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.paymentMethod,
        metodoPago === item.id && styles.paymentMethodSelected
      ]}
      onPress={() => setMetodoPago(item.id)}
    >
      <View style={styles.paymentMethodRadio}>
        {metodoPago === item.id && <View style={styles.paymentMethodRadioSelected} />}
      </View>
      <Text style={[
        styles.paymentMethodText,
        metodoPago === item.id && styles.paymentMethodTextSelected
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Tu carrito está vacío</Text>
        <Boton
          tipo="primario"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyButton}
        >
          Ir a comprar
        </Boton>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Resumen del carrito */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tu pedido ({getTotalItems()} productos)</Text>
        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total: {formatPrice(getTotalPrice())}
          </Text>
        </View>
      </View>

      {/* Información de entrega */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de entrega</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dirección de entrega *</Text>
          <TextInput
            style={styles.textInput}
            value={direccionEntrega}
            onChangeText={setDireccionEntrega}
            placeholder="Calle 123 #45-67, Barrio, Ciudad"
            placeholderTextColor={theme.colors.placeholder}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono de contacto *</Text>
          <TextInput
            style={styles.textInput}
            value={telefonoContacto}
            onChangeText={setTelefonoContacto}
            placeholder="300 123 4567"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notas adicionales (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notas}
            onChangeText={setNotas}
            placeholder="Instrucciones especiales para la entrega..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Método de pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Método de pago</Text>
        <FlatList
          data={metodosPago}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Información importante */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ Información importante</Text>
        <Text style={styles.infoText}>
          • El tiempo estimado de entrega es de 30-60 minutos{'\n'}
          • Verificaremos disponibilidad antes de confirmar{'\n'}
          • Para medicamentos con receta, ten a mano tu prescripción médica{'\n'}
          • El repartidor te contactará antes de la entrega
        </Text>
      </View>

      {/* Botón de confirmar */}
      <View style={styles.actionContainer}>
        <Boton
          tipo="success"
          tamaño="grande"
          onPress={handleCreateOrder}
          loading={loading}
          disabled={loading}
          style={styles.confirmButton}
        >
          Confirmar pedido - {formatPrice(getTotalPrice())}
        </Boton>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  section: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
  },
  itemPrice: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  quantityText: {
    ...theme.typography.body1,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  removeButtonText: {
    fontSize: 16,
  },
  itemSubtotal: {
    ...theme.typography.body1,
    fontWeight: 'bold',
    color: theme.colors.success,
    minWidth: 80,
    textAlign: 'right',
  },

  totalContainer: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignItems: 'flex-end',
  },
  totalText: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: 'bold',
  },

  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body2,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.light,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  paymentMethodSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  paymentMethodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.light,
  },
  paymentMethodText: {
    ...theme.typography.body1,
    color: theme.colors.text,
  },
  paymentMethodTextSelected: {
    color: theme.colors.light,
    fontWeight: 'bold',
  },

  infoSection: {
    backgroundColor: theme.colors.light,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.body1,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  actionContainer: {
    padding: theme.spacing.md,
  },
  confirmButton: {},

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {},
});

export default CheckoutScreen;