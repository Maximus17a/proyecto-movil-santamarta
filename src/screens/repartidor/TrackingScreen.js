import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as Location from 'expo-location';

import { updateOrderStatus, updateDeliveryLocation, reportOrderIssue } from '../../api/repartidorApi';
import { theme } from '../../theme';
import Boton from '../../components/Boton';

const TrackingScreen = ({ route, navigation }) => {
  const { pedido: initialPedido } = route.params;
  
  const [pedido, setPedido] = useState(initialPedido);
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [trackingLocation, setTrackingLocation] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error al solicitar permisos de ubicación:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
    }
  };

  const startLocationTracking = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu ubicación para rastrear la entrega'
      );
      return;
    }

    setTrackingLocation(true);
    
    // Actualizar ubicación cada 30 segundos
    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 segundos
        distanceInterval: 50, // 50 metros
      },
      async (newLocation) => {
        setLocation(newLocation);
        
        // Enviar ubicación al servidor
        try {
          await updateDeliveryLocation(
            pedido.id,
            null, // Sin autenticación, usar null
            newLocation.coords.latitude,
            newLocation.coords.longitude
          );
        } catch (error) {
          console.error('Error al actualizar ubicación:', error);
        }
      }
    );

    return () => locationSubscription.remove();
  };

  const stopLocationTracking = () => {
    setTrackingLocation(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    const statusMessages = {
      'en_camino': '¿Confirmar que saliste a entregar este pedido?',
      'entregado': '¿Confirmar que el pedido fue entregado exitosamente?'
    };

    Alert.alert(
      'Actualizar estado',
      statusMessages[newStatus] || '¿Actualizar el estado del pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const result = await updateOrderStatus(pedido.id, newStatus, null); // Sin autenticación
              if (result.error) {
                Alert.alert('Error', 'No se pudo actualizar el estado');
              } else {
                setPedido({ ...pedido, estado: newStatus });
                Alert.alert('¡Éxito!', 'Estado actualizado correctamente');
                
                // Si se marca como entregado, dejar de rastrear ubicación
                if (newStatus === 'entregado') {
                  stopLocationTracking();
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Error de conexión');
            }
          }
        }
      ]
    );
  };

  const handleCallCustomer = () => {
    const phoneNumber = pedido.users?.telefono;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Error', 'No hay número de teléfono disponible');
    }
  };

  const handleOpenMaps = () => {
    if (pedido.direccion_entrega) {
      const encodedAddress = encodeURIComponent(pedido.direccion_entrega);
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No hay dirección disponible');
    }
  };

  const handleReportIssue = () => {
    Alert.prompt(
      'Reportar problema',
      'Describe el problema que encontraste:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          onPress: async (issue) => {
            if (issue && issue.trim()) {
              try {
                const result = await reportOrderIssue(pedido.id, null, issue.trim()); // Sin autenticación
                if (result.error) {
                  Alert.alert('Error', 'No se pudo reportar el problema');
                } else {
                  Alert.alert('Reportado', 'El problema ha sido reportado al administrador');
                  setPedido({ ...pedido, estado: 'problema' });
                }
              } catch (error) {
                Alert.alert('Error', 'Error de conexión');
              }
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmado':
        return theme.colors.info;
      case 'en_camino':
        return theme.colors.primary;
      case 'entregado':
        return theme.colors.success;
      case 'problema':
        return theme.colors.danger;
      default:
        return theme.colors.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmado':
        return 'Confirmado';
      case 'en_camino':
        return 'En camino';
      case 'entregado':
        return 'Entregado';
      case 'problema':
        return 'Problema reportado';
      default:
        return status;
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Text style={styles.itemName}>
        {item.cantidad}x {item.productos?.nombre || 'Producto'}
      </Text>
      <Text style={styles.itemPrice}>
        {formatPrice(item.precio_unitario * item.cantidad)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header del pedido */}
      <View style={styles.header}>
        <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pedido.estado) }]}>
          <Text style={styles.statusText}>{getStatusText(pedido.estado)}</Text>
        </View>
      </View>

      {/* Información del cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Cliente</Text>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{pedido.users?.nombre || 'Cliente'}</Text>
          <Text style={styles.clientEmail}>{pedido.users?.email}</Text>
          {pedido.users?.telefono && (
            <TouchableOpacity 
              style={styles.phoneContainer}
              onPress={handleCallCustomer}
            >
              <Text style={styles.phoneText}>📞 {pedido.users.telefono}</Text>
              <Text style={styles.callText}>Tocar para llamar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dirección de entrega */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Dirección de entrega</Text>
        <TouchableOpacity 
          style={styles.addressContainer}
          onPress={handleOpenMaps}
        >
          <Text style={styles.address}>{pedido.direccion_entrega}</Text>
          <Text style={styles.mapsText}>Tocar para abrir en Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Productos del pedido */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Productos</Text>
        <FlatList
          data={pedido.detalles_pedido || pedido.pedido_items || []}
          renderItem={renderOrderItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total: {formatPrice(pedido.total)}
          </Text>
        </View>
      </View>

      {/* Información adicional */}
      {pedido.notas && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notas especiales</Text>
          <Text style={styles.notes}>{pedido.notas}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Método de pago</Text>
        <Text style={styles.paymentMethod}>
          {pedido.metodo_pago === 'efectivo' ? 'Efectivo' :
           pedido.metodo_pago === 'tarjeta' ? 'Tarjeta (en entrega)' :
           pedido.metodo_pago === 'transferencia' ? 'Transferencia' :
           pedido.metodo_pago}
        </Text>
      </View>

      {/* Acciones según el estado */}
      <View style={styles.actionsSection}>
        {pedido.estado === 'confirmado' && (
          <>
            <Boton
              tipo="primary"
              tamaño="grande"
              onPress={() => {
                handleStatusUpdate('en_camino');
                startLocationTracking();
              }}
              style={styles.actionButton}
            >
              Salir a entregar
            </Boton>
            <Boton
              tipo="outline"
              onPress={handleReportIssue}
              style={styles.actionButton}
            >
              Reportar problema
            </Boton>
          </>
        )}

        {pedido.estado === 'en_camino' && (
          <>
            <Boton
              tipo="success"
              tamaño="grande"
              onPress={() => handleStatusUpdate('entregado')}
              style={styles.actionButton}
            >
              Marcar como entregado
            </Boton>
            <Boton
              tipo="outline"
              onPress={handleReportIssue}
              style={styles.actionButton}
            >
              Reportar problema
            </Boton>
          </>
        )}

        {pedido.estado === 'entregado' && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>✅ Pedido entregado exitosamente</Text>
          </View>
        )}

        {pedido.estado === 'problema' && (
          <View style={styles.problemContainer}>
            <Text style={styles.problemText}>⚠️ Problema reportado</Text>
            <Text style={styles.problemSubtext}>
              El administrador ha sido notificado y te contactará pronto
            </Text>
          </View>
        )}
      </View>

      {/* Información de ubicación */}
      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Mi ubicación</Text>
          <Text style={styles.locationText}>
            Lat: {location.coords.latitude.toFixed(6)}{'\n'}
            Lng: {location.coords.longitude.toFixed(6)}
          </Text>
          <Text style={styles.locationStatus}>
            {trackingLocation ? '🟢 Ubicación en seguimiento' : '🔴 Seguimiento desactivado'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pedidoId: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    color: theme.colors.light,
    fontSize: 14,
    fontWeight: 'bold',
  },

  section: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: 'bold',
  },

  clientInfo: {
    gap: theme.spacing.xs,
  },
  clientName: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
  },
  clientEmail: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  phoneContainer: {
    paddingTop: theme.spacing.xs,
  },
  phoneText: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  callText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  addressContainer: {
    paddingVertical: theme.spacing.xs,
  },
  address: {
    ...theme.typography.body1,
    color: theme.colors.text,
    lineHeight: 20,
  },
  mapsText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },

  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemName: {
    ...theme.typography.body1,
    color: theme.colors.text,
    flex: 1,
  },
  itemPrice: {
    ...theme.typography.body1,
    color: theme.colors.success,
    fontWeight: '600',
  },

  totalContainer: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    alignItems: 'flex-end',
  },
  totalText: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: 'bold',
  },

  notes: {
    ...theme.typography.body1,
    color: theme.colors.text,
    lineHeight: 20,
  },

  paymentMethod: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
  },

  actionsSection: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    marginBottom: theme.spacing.xs,
  },

  completedContainer: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  completedText: {
    color: theme.colors.light,
    fontSize: 16,
    fontWeight: 'bold',
  },

  problemContainer: {
    backgroundColor: theme.colors.danger,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  problemText: {
    color: theme.colors.light,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  problemSubtext: {
    color: theme.colors.light,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },

  locationText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  locationStatus: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

export default TrackingScreen;