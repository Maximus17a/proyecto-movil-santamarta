import { supabase, logSupabaseOperation } from './supabaseClient';

/**
 * Obtener todos los productos disponibles
 */
export const getProducts = async (filters = {}) => {
  try {
    console.log('📦 Obteniendo productos con filtros:', filters);
    
    let query = supabase
      .from('productos')
      .select(`
        *,
        categorias(nombre)
      `);
      
    // Si no se especifica explícitamente, incluir productos con stock > 0
    if (filters.includeOutOfStock !== true) {
      query = query.gt('stock', 0);
      console.log('📦 Filtrando solo productos con stock disponible');
    }

    // Aplicar filtros opcionales
    if (filters.categoria_id) {
      query = query.eq('categoria_id', filters.categoria_id);
    }

    if (filters.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    // Ordenar por nombre por defecto
    query = query.order('nombre');

    const result = await query;
    
    if (result.data) {
      console.log(`✅ Productos obtenidos: ${result.data.length} productos encontrados`);
      console.log('📊 Stock disponible:', result.data.map(p => ({ nombre: p.nombre, stock: p.stock })));
    }
    
    logSupabaseOperation('Obtener productos', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getProducts:', error);
    return { error };
  }
};

/**
 * Obtener un producto específico por ID
 */
export const getProductById = async (productId, includeOutOfStock = false) => {
  try {
    console.log('🔍 Obteniendo producto por ID:', productId);
    
    let query = supabase
      .from('productos')
      .select(`
        *,
        categorias(nombre)
      `)
      .eq('id', productId);
      
    // Solo filtrar por stock si no se especifica incluir productos sin stock
    if (!includeOutOfStock) {
      query = query.gt('stock', 0);
    }

    const result = await query.single();
    
    if (result.data) {
      console.log('✅ Producto encontrado:', { 
        nombre: result.data.nombre, 
        stock: result.data.stock,
        precio: result.data.precio
      });
    }

    logSupabaseOperation('Obtener producto por ID', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getProductById:', error);
    return { error };
  }
};

/**
 * Obtener categorías de productos
 */
export const getCategories = async () => {
  try {
    const result = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('nombre');

    logSupabaseOperation('Obtener categorías', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getCategories:', error);
    return { error };
  }
};

/**
 * Crear un nuevo pedido
 */
export const createOrder = async (orderData) => {
  try {
    console.log('🛒 Creando pedido:', orderData);
    
    // Validar datos requeridos
    if (!orderData.items || orderData.items.length === 0) {
      return { error: { message: 'Datos de pedido incompletos' } };
    }

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error: Usuario no autenticado', userError);
      return { error: { message: 'Usuario no autenticado' } };
    }
    
    console.log('👤 Usuario autenticado:', user.email, user.id);
    
    // Primero, crear una dirección para el usuario
    const direccionResult = await supabase
      .from('direcciones')
      .insert({
        cliente_id: user.id,
        direccion_completa: orderData.direccion_entrega,
        latitud: null,
        longitud: null
      })
      .select()
      .single();

    if (direccionResult.error) {
      console.error('❌ Error creando dirección:', direccionResult.error);
      logSupabaseOperation('Crear dirección', direccionResult);
      return direccionResult;
    }

    console.log('✅ Dirección creada:', direccionResult.data.id);

    // Crear el pedido principal
    const pedidoData = {
      cliente_id: user.id,
      repartidor_id: null,
      direccion_id: direccionResult.data.id,
      estado: 'pendiente',
      total: orderData.total,
      metodo_pago: orderData.metodo_pago || 'efectivo',
      id_pago_stripe: null
    };
    
    console.log('📦 Datos del pedido:', pedidoData);

    const pedidoResult = await supabase
      .from('pedidos')
      .insert(pedidoData)
      .select()
      .single();

    if (pedidoResult.error) {
      // Si falla, eliminar la dirección creada
      await supabase.from('direcciones').delete().eq('id', direccionResult.data.id);
      logSupabaseOperation('Crear pedido', pedidoResult);
      return pedidoResult;
    }

    // Crear los detalles del pedido
    const itemsData = orderData.items.map(item => ({
      pedido_id: pedidoResult.data.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario
    }));

    const itemsResult = await supabase
      .from('detalles_pedido')
      .insert(itemsData);

    if (itemsResult.error) {
      // Si falla la inserción de items, eliminar el pedido y dirección creados
      await supabase.from('pedidos').delete().eq('id', pedidoResult.data.id);
      await supabase.from('direcciones').delete().eq('id', direccionResult.data.id);
      logSupabaseOperation('Crear detalles del pedido', itemsResult);
      return itemsResult;
    }

    logSupabaseOperation('Crear pedido completo', { data: pedidoResult.data, error: null });
    return { data: pedidoResult.data, error: null };
  } catch (error) {
    console.error('❌ Error en createOrder:', error);
    return { error };
  }
};

/**
 * Obtener historial de pedidos del usuario (sin autenticación, devuelve vacío)
 */
export const getUserOrders = async (userId = null, limit = 20) => {
  try {
    // Sin autenticación, no hay pedidos de usuario específico
    // Podrías implementar un sistema de pedidos por sesión/localStorage si necesitas
    return { data: [], error: null };
  } catch (error) {
    console.error('❌ Error en getUserOrders:', error);
    return { error };
  }
};

/**
 * Obtener detalles de un pedido específico
 */
export const getOrderDetails = async (orderId) => {
  try {
    const result = await supabase
      .from('pedidos')
      .select(`
        *,
        detalles_pedido (
          *,
          productos (nombre, precio, imagen_url, descripcion)
        ),
        direcciones (direccion_completa),
        perfiles!pedidos_cliente_id_fkey (nombre_completo)
      `)
      .eq('id', orderId)
      .single();

    logSupabaseOperation('Obtener detalles del pedido', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getOrderDetails:', error);
    return { error };
  }
};

/**
 * Cancelar un pedido (solo si está en estado pendiente)
 */
export const cancelOrder = async (orderId, clienteId = null) => {
  try {
    const result = await supabase
      .from('pedidos')
      .update({ estado: 'cancelado' })
      .eq('id', orderId)
      .eq('estado', 'pendiente') // Solo se puede cancelar si está pendiente
      .select()
      .single();

    logSupabaseOperation('Cancelar pedido', result);
    return result;
  } catch (error) {
    console.error('❌ Error en cancelOrder:', error);
    return { error };
  }
};