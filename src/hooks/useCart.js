import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const CART_STORAGE_KEY = '@farmacia_cart';

export function useCart() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener clave del carrito específica por usuario
  const getUserCartKey = useCallback(() => {
    return user?.id ? `${CART_STORAGE_KEY}_${user.id}` : CART_STORAGE_KEY;
  }, [user?.id]);

  // Cargar carrito del storage al inicializar o cambiar usuario
  useEffect(() => {
    loadCartFromStorage();
  }, [user?.id]); // Recargar cuando cambie el usuario

  // Cargar carrito desde AsyncStorage
  const loadCartFromStorage = async () => {
    try {
      const cartKey = getUserCartKey();
      console.log('🛒 Cargando carrito para usuario:', user?.email, 'con clave:', cartKey);
      
      const storedCart = await AsyncStorage.getItem(cartKey);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        console.log('✅ Carrito cargado desde AsyncStorage:', {
          itemsCount: parsedCart.length,
          items: parsedCart.map(item => ({ id: item.id, nombre: item.nombre, cantidad: item.cantidad }))
        });
        setCartItems(parsedCart);
      } else {
        console.log('🛒 No hay carrito guardado para este usuario');
        setCartItems([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar carrito del storage:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Guardar carrito en AsyncStorage
  const saveCartToStorage = async (items) => {
    try {
      const cartKey = getUserCartKey();
      console.log('💾 Guardando carrito:', { cartKey, itemsCount: items.length, userEmail: user?.email });
      await AsyncStorage.setItem(cartKey, JSON.stringify(items));
      console.log('✅ Carrito guardado exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar carrito en storage:', error);
    }
  };

  // Agregar producto al carrito
  const addToCart = useCallback((product, quantity = 1) => {
    console.log('🛒 addToCart llamado con:', { 
      productName: product?.nombre, 
      productId: product?.id, 
      quantity,
      currentCartLength: cartItems.length 
    });
    
    setCartItems(prevItems => {
      console.log('🛒 Estado previo del carrito:', prevItems.length, 'items');
      
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      let newItems;

      if (existingItemIndex > -1) {
        // Si el producto ya existe, actualizar cantidad
        console.log('📦 Producto ya existe, actualizando cantidad');
        newItems = [...prevItems];
        newItems[existingItemIndex].cantidad += quantity;
      } else {
        // Si es un nuevo producto, agregarlo
        console.log('📦 Nuevo producto, agregando al carrito');
        newItems = [...prevItems, {
          ...product,
          cantidad: quantity
        }];
      }

      console.log('🛒 Nuevo estado del carrito:', {
        itemsCount: newItems.length,
        items: newItems.map(item => ({ id: item.id, nombre: item.nombre, cantidad: item.cantidad }))
      });

      saveCartToStorage(newItems);
      return newItems;
    });
  }, []);

  // Remover producto del carrito
  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== productId);
      saveCartToStorage(newItems);
      return newItems;
    });
  }, []);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === productId ? { ...item, cantidad: newQuantity } : item
      );
      saveCartToStorage(newItems);
      return newItems;
    });
  }, [removeFromCart]);

  // Limpiar todo el carrito
  const clearCart = useCallback(() => {
    setCartItems([]);
    saveCartToStorage([]);
  }, []);

  // Limpiar carrito de usuario específico (para logout)
  const clearUserCart = useCallback(async (userId) => {
    try {
      const cartKey = userId ? `${CART_STORAGE_KEY}_${userId}` : CART_STORAGE_KEY;
      await AsyncStorage.removeItem(cartKey);
      console.log('🗑️ Carrito eliminado para usuario:', userId);
      
      // Si es el usuario actual, limpiar también el estado
      if (userId === user?.id) {
        setCartItems([]);
      }
    } catch (error) {
      console.error('❌ Error al limpiar carrito de usuario:', error);
    }
  }, [user?.id]);

  // Obtener cantidad total de items
  const getTotalItems = useCallback(() => {
    const total = cartItems.reduce((total, item) => total + item.cantidad, 0);
    console.log('🧮 Calculando total de items:', { cartItems: cartItems.length, total });
    return total;
  }, [cartItems]);

  // Obtener precio total
  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }, [cartItems]);

  // Verificar si un producto está en el carrito
  const isInCart = useCallback((productId) => {
    return cartItems.some(item => item.id === productId);
  }, [cartItems]);

  // Obtener cantidad de un producto específico
  const getItemQuantity = useCallback((productId) => {
    const item = cartItems.find(item => item.id === productId);
    return item ? item.cantidad : 0;
  }, [cartItems]);

  // Preparar datos para crear pedido
  const getOrderData = useCallback(() => {
    return cartItems.map(item => ({
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio
    }));
  }, [cartItems]);

  // Calcular valores computados de forma segura
  const totalItems = cartItems.reduce((total, item) => total + (item.cantidad || 0), 0);
  const totalPrice = cartItems.reduce((total, item) => total + ((item.precio || 0) * (item.cantidad || 0)), 0);
  
  console.log('🔄 useCart return - Estado final:', {
    cartItemsLength: cartItems.length,
    totalItems,
    loading,
    cartItems: cartItems.map(item => ({ id: item.id, nombre: item.nombre, cantidad: item.cantidad }))
  });

  return {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearUserCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
    getItemQuantity,
    getOrderData,
    // Computed values - calculados directamente aquí para evitar problemas de timing
    isEmpty: cartItems.length === 0,
    totalItems,
    totalPrice,
  };
}