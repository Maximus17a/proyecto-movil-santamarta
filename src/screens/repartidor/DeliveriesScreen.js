import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { 
  getAssignedOrders, 
  updateOrderStatus,
  getDeliveryStats 
} from '../../api/repartidorApi';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

import PedidoItem from '../../components/PedidoItem';
import Boton from '../../components/Boton';

const DeliveriesScreen = ({ navigation }) => {
  const { user, profile, signOut } = useAuth();
  
  // Solo mostrar pedidos asignados, no hay tabs ni pedidos disponibles
  const [misPedidos, setMisPedidos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMisPedidos(),
        loadStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMisPedidos = async () => {
    try {
      const result = await getAssignedOrders(user.id);
      if (result.error) {
        console.error('Error al cargar mis pedidos:', result.error);
      } else {
        setMisPedidos(result.data || []);
      }
    } catch (error) {
      console.error('Error al cargar mis pedidos:', error);
    }
  };

  // Función eliminada - Los repartidores no ven pedidos disponibles
  // Solo los administradores asignan pedidos desde la web

  const loadStats = async () => {
    try {
      const result = await getDeliveryStats(user.id);
      if (result.error) {
        console.error('Error al cargar estadísticas:', result.error);
      } else {
        setStats(result.data || {});
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Función eliminada - Los repartidores no pueden auto-asignarse pedidos
  // Solo los administradores asignan pedidos desde la web

  const handleUpdateStatus = async (pedido, newStatus) => {
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
              const result = await updateOrderStatus(pedido.id, newStatus, user.id);
              if (result.error) {
                Alert.alert('Error', 'No se pudo actualizar el estado');
              } else {
                Alert.alert('¡Éxito!', 'Estado actualizado correctamente');
                await loadMisPedidos();
              }
            } catch (error) {
              Alert.alert('Error', 'Error de conexión');
            }
          }
        }
      ]
    );
  };

  const handlePedidoPress = (pedido) => {
    navigation.navigate('Tracking', { pedido });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(price);
  };



  const renderPedido = ({ item }) => (
    <PedidoItem
      pedido={item}
      onPress={handlePedidoPress}
      onUpdateStatus={handleUpdateStatus}
      showActions={true}
      userRole="repartidor"
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No tienes pedidos asignados.{'\n'}
        Los pedidos son asignados por el administrador desde la web.
      </Text>
      <Boton
        tipo="outline"
        onPress={onRefresh}
        style={styles.emptyButton}
      >
        Actualizar
      </Boton>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>
            ¡Hola, {profile?.nombre_completo || 'Repartidor'}!
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'Sistema de entregas'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            Alert.alert(
              'Cerrar sesión',
              '¿Estás seguro que deseas cerrar sesión?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar sesión', onPress: signOut, style: 'destructive' }
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.entregasHoy || 0}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalEntregas || 0}</Text>
            <Text style={styles.statLabel}>Este mes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatPrice(stats.ingresosTotales || 0)}</Text>
            <Text style={styles.statLabel}>Ingresos</Text>
          </View>
        </View>
      )}

      {/* Título de sección */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Pedidos Asignados ({misPedidos.length})
        </Text>
        <Text style={styles.sectionSubtitle}>
          Los pedidos son asignados por el administrador
        </Text>
      </View>

      {/* Lista de pedidos asignados */}
      <FlatList
        data={misPedidos}
        renderItem={renderPedido}
        keyExtractor={(item) => `pedido-${item.id}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  headerLeft: {
    flex: 1,
  },
  logoutButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.light,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  welcomeText: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  userEmail: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  sectionHeader: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  listContainer: {
    padding: theme.spacing.sm,
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {},
});

export default DeliveriesScreen;