import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getProducts, getCategories } from '../../api/clienteApi';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

import TarjetaProducto from '../../components/TarjetaProducto';
import Boton from '../../components/Boton';

const HomeScreen = ({ navigation }) => {
  const { addToCart, getItemQuantity, totalItems, cartItems } = useCart();
  const { user, profile, signOut } = useAuth();
  
  console.log('🏠 HomeScreen - Estado del usuario:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!profile,
    profileRole: profile?.rol
  });
  
  // Monitor cambios en el carrito
  useEffect(() => {
    console.log('🛒 HomeScreen - Carrito actualizado:', {
      totalItems,
      cartLength: cartItems?.length || 0,
      showCartButton: totalItems > 0,
      items: cartItems?.map(item => ({ nombre: item.nombre, cantidad: item.cantidad })) || []
    });
  }, [cartItems, totalItems]);
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    console.log('🏠 HomeScreen - useEffect ejecutado, cargando datos...');
    loadInitialData();
  }, []);

  // Recargar datos cuando cambie el usuario
  useEffect(() => {
    if (user) {
      console.log('👤 Usuario cambió, recargando datos para:', user.email);
      loadInitialData();
    }
  }, [user?.id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadCategories()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (filters = {}) => {
    try {
      console.log('🔍 Cargando productos con filtros:', filters);
      
      // Temporalmente, obtener TODOS los productos para debug
      const resultWithAllProducts = await getProducts({
        ...filters,
        includeOutOfStock: true, // Incluir productos sin stock para debug
      });
      
      console.log('📊 Todos los productos obtenidos:', resultWithAllProducts.data?.map(p => ({
        nombre: p.nombre,
        stock: p.stock,
        id: p.id
      })));
      
      const result = await getProducts({
        ...filters,
        search: searchText || undefined,
        categoria_id: selectedCategory || undefined,
      });

      if (result.error) {
        Alert.alert('Error', 'No se pudieron cargar los productos');
        console.error('Error al cargar productos:', result.error);
      } else {
        setProductos(result.data || []);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const loadCategories = async () => {
    try {
      const result = await getCategories();
      if (result.data && !result.error) {
        setCategorias(result.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refrescando productos...');
    try {
      await Promise.all([
        loadProducts(),
        loadCategories()
      ]);
      console.log('✅ Datos refrescados exitosamente');
    } catch (error) {
      console.error('❌ Error al refrescar datos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    loadProducts();
  };

  const handleCategorySelect = (categoriaId) => {
    const newCategory = selectedCategory === categoriaId ? null : categoriaId;
    setSelectedCategory(newCategory);
    // Recargar productos con el nuevo filtro
    setTimeout(() => {
      loadProducts();
    }, 100);
  };

  const handleProductPress = (producto) => {
    navigation.navigate('ProductDetail', { producto });
  };

  const handleAddToCart = (producto) => {
    console.log('➕ Agregando al carrito:', producto.nombre);
    addToCart(producto, 1);
    console.log('✅ Producto agregado, nuevos totales:', { totalItems });
    Alert.alert('✅ Agregado', `${producto.nombre} se agregó al carrito`);
  };

  const goToCart = () => {
    console.log('🛒 goToCart llamado - navegando a Checkout');
    try {
      navigation.navigate('Checkout');
      console.log('✅ Navegación a Checkout iniciada');
    } catch (error) {
      console.error('❌ Error navegando a Checkout:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <TarjetaProducto
      producto={item}
      onPress={handleProductPress}
      onAddToCart={handleAddToCart}
      cartQuantity={getItemQuantity(item.id)}
      style={styles.productCard}
    />
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonSelected
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextSelected
      ]}>
        {item.nombre}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>
            ¡Hola, {profile?.nombre_completo || 'Usuario'}!
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'Bienvenido a Farmacia Santa Marta'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {(() => {
            console.log('🔍 Renderizando header cart - totalItems:', totalItems);
            return totalItems > 0;
          })() && (
            <TouchableOpacity style={styles.cartButton} onPress={goToCart}>
              <Text style={styles.cartIcon}>🛒</Text>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar medicamentos..."
          placeholderTextColor={theme.colors.placeholder}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Boton
          tipo="primario"
          tamaño="pequeño"
          onPress={handleSearch}
          style={styles.searchButton}
        >
          🔍
        </Boton>
      </View>

      {/* Categorías */}
      {categorias.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <FlatList
            data={categorias}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Productos */}
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? `Productos - ${selectedCategory}` : 'Todos los productos'}
        </Text>
        
        <FlatList
          data={productos}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading ? 'Cargando productos...' : 'No se encontraron productos'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Botón flotante de carrito */}
      {(() => {
        console.log('🔍 Renderizando floating cart - totalItems:', totalItems);
        return totalItems > 0;
      })() && (
        <TouchableOpacity style={styles.floatingCartButton} onPress={goToCart}>
          <Text style={styles.floatingCartText}>
            Ver carrito ({totalItems})
          </Text>
        </TouchableOpacity>
      )}
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
  welcomeText: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  userEmail: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoutButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  cartButton: {
    position: 'relative',
    padding: theme.spacing.xs,
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: theme.colors.light,
    fontSize: 12,
    fontWeight: 'bold',
  },

  searchContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
  },
  searchButton: {
    paddingHorizontal: theme.spacing.md,
  },

  categoriesSection: {
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  categoriesList: {
    paddingHorizontal: theme.spacing.md,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    ...theme.typography.body2,
    color: theme.colors.text,
  },
  categoryTextSelected: {
    color: theme.colors.light,
    fontWeight: 'bold',
  },

  productsSection: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  productsList: {
    padding: theme.spacing.sm,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  productCard: {
    width: '48%',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  floatingCartButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  floatingCartText: {
    color: theme.colors.light,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;