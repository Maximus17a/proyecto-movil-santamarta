import { supabase, logSupabaseOperation } from './supabaseClient';

/**
 * Obtener pedidos asignados al repartidor
 */
export const getAssignedOrders = async (repartidorId = null) => {
  try {
    // Si no se proporciona repartidorId, obtenerlo del usuario autenticado
    let delivererId = repartidorId;
    if (!delivererId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ Error: Usuario no autenticado', userError);
        return { error: { message: 'Usuario no autenticado' } };
      }
      delivererId = user.id;
    }

    console.log('📦 Obteniendo pedidos asignados para repartidor:', delivererId);

    const result = await supabase
      .from('pedidos')
      .select(`
        *,
        detalles_pedido (
          *,
          productos (nombre, precio)
        ),
        perfiles!pedidos_cliente_id_fkey (nombre_completo),
        direcciones (direccion_completa)
      `)
      .eq('repartidor_id', delivererId)
      .in('estado', ['confirmado', 'en_camino'])
      .order('created_at', { ascending: true });

    console.log('✅ Pedidos asignados obtenidos:', result.data?.length || 0);
    logSupabaseOperation('Obtener pedidos asignados', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getAssignedOrders:', error);
    return { error };
  }
};

/**
 * Obtener todos los pedidos disponibles para asignar
 */
export const getAvailableOrders = async () => {
  try {
    console.log('📦 Obteniendo pedidos disponibles para asignar');

    const result = await supabase
      .from('pedidos')
      .select(`
        *,
        detalles_pedido (
          *,
          productos (nombre, precio)
        ),
        perfiles!pedidos_cliente_id_fkey (nombre_completo),
        direcciones (direccion_completa)
      `)
      .is('repartidor_id', null)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    console.log('✅ Pedidos disponibles obtenidos:', result.data?.length || 0);
    logSupabaseOperation('Obtener pedidos disponibles', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getAvailableOrders:', error);
    return { error };
  }
};

/**
 * Aceptar un pedido para entrega
 */
export const acceptOrder = async (orderId, repartidorId = null) => {
  try {
    // Si no se proporciona repartidorId, obtenerlo del usuario autenticado
    let delivererId = repartidorId;
    if (!delivererId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ Error: Usuario no autenticado', userError);
        return { error: { message: 'Usuario no autenticado' } };
      }
      delivererId = user.id;
    }

    console.log('✋ Aceptando pedido', orderId, 'para repartidor:', delivererId);

    const result = await supabase
      .from('pedidos')
      .update({
        repartidor_id: delivererId,
        estado: 'confirmado'
      })
      .eq('id', orderId)
      .eq('estado', 'pendiente') // Solo se puede aceptar si está pendiente
      .is('repartidor_id', null) // Solo si no tiene repartidor asignado
      .select()
      .single();

    console.log('✅ Pedido aceptado:', result.data ? 'exitoso' : 'falló');
    logSupabaseOperation('Aceptar pedido', result);
    return result;
  } catch (error) {
    console.error('❌ Error en acceptOrder:', error);
    return { error };
  }
};

// Función auxiliar para descontar stock usando función SQL con permisos elevados
const descontarStockProductos = async (pedidoId) => {
  try {
    console.log('📦 Iniciando descuento de stock para pedido:', pedidoId);
    
    // Llamar a la función SQL personalizada con permisos elevados
    const { data, error } = await supabase.rpc('descontar_stock_pedido', {
      pedido_id: pedidoId
    });
    
    console.log('🔍 Resultado de función SQL:', { data, error });
    
    if (error) {
      console.error('❌ Error en función SQL:', error);
      return { success: false, error };
    }
    
    // La función SQL devuelve un objeto JSON con el resultado
    if (data && data.success) {
      console.log('✅ Stock descontado exitosamente:', data.mensaje);
      return { success: true, data };
    } else {
      console.error('❌ Error reportado por función SQL:', data?.error);
      return { success: false, error: { message: data?.error || 'Error desconocido en función SQL' } };
    }
    
  } catch (error) {
    console.error('❌ Error inesperado en descuento de stock:', error);
    return { success: false, error: { message: 'Error inesperado al descontar stock: ' + error.message } };
  }
};

/**
 * Actualizar el estado de un pedido
 */
export const updateOrderStatus = async (orderId, newStatus, repartidorId = null, additionalData = {}) => {
  try {
    // Si no se proporciona repartidorId, obtenerlo del usuario autenticado
    let delivererId = repartidorId;
    if (!delivererId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ Error: Usuario no autenticado', userError);
        return { error: { message: 'Usuario no autenticado' } };
      }
      delivererId = user.id;
    }

    console.log('🔄 Actualizando estado del pedido', orderId, 'a:', newStatus);

    // Si el nuevo estado es 'entregado', descontar automáticamente el stock
    if (newStatus === 'entregado') {
      console.log('🏷️ Estado es "entregado", descontando stock...');
      const resultado = await descontarStockProductos(orderId);
      
      if (!resultado.success) {
        console.error('❌ No se pudo descontar el stock:', resultado.error);
        return { error: resultado.error };
      }
      console.log('✅ Stock descontado exitosamente');
    }

    const updateData = {
      estado: newStatus,
      ...additionalData
    };

    const result = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', orderId)
      .eq('repartidor_id', delivererId) // Verificar que el repartidor sea el asignado
      .select()
      .single();

    console.log('✅ Estado actualizado:', result.data ? 'exitoso' : 'falló');
    logSupabaseOperation('Actualizar estado del pedido', result);
    return result;
  } catch (error) {
    console.error('❌ Error en updateOrderStatus:', error);
    return { error };
  }
};

/**
 * Actualizar la ubicación del repartidor durante la entrega
 */
export const updateDeliveryLocation = async (orderId, repartidorId, latitude, longitude) => {
  try {
    const result = await supabase
      .from('pedidos')
      .update({
        repartidor_lat: latitude,
        repartidor_lng: longitude,
        ultima_actualizacion_ubicacion: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('repartidor_id', repartidorId)
      .in('estado', ['confirmado', 'en_camino'])
      .select()
      .single();

    logSupabaseOperation('Actualizar ubicación del repartidor', result);
    return result;
  } catch (error) {
    console.error('❌ Error en updateDeliveryLocation:', error);
    return { error };
  }
};

/**
 * Obtener historial de entregas del repartidor
 */
export const getDeliveryHistory = async (repartidorId, limit = 50) => {
  try {
    const result = await supabase
      .from('pedidos')
      .select(`
        *,
        detalles_pedido (
          *,
          productos (nombre, precio)
        ),
        perfiles!pedidos_cliente_id_fkey (nombre_completo)
      `)
      .eq('repartidor_id', repartidorId)
      .in('estado', ['entregado', 'cancelado'])
      .order('created_at', { ascending: false })
      .limit(limit);

    logSupabaseOperation('Obtener historial de entregas', result);
    return result;
  } catch (error) {
    console.error('❌ Error en getDeliveryHistory:', error);
    return { error };
  }
};

/**
 * Obtener estadísticas del repartidor
 */
export const getDeliveryStats = async (repartidorId) => {
  try {
    // Obtener estadísticas de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await supabase
      .from('pedidos')
      .select('estado, total, created_at')
      .eq('repartidor_id', repartidorId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (result.data) {
      const stats = {
        totalEntregas: result.data.filter(p => p.estado === 'entregado').length,
        totalCancelados: result.data.filter(p => p.estado === 'cancelado').length,
        ingresosTotales: result.data
          .filter(p => p.estado === 'entregado')
          .reduce((sum, p) => sum + (p.total || 0), 0),
        entregasHoy: result.data.filter(p => {
          if (p.estado !== 'entregado' || !p.created_at) return false;
          const today = new Date().toDateString();
          const createdDate = new Date(p.created_at).toDateString();
          return today === createdDate;
        }).length
      };

      logSupabaseOperation('Obtener estadísticas del repartidor', { data: stats, error: null });
      return { data: stats, error: null };
    }

    return result;
  } catch (error) {
    console.error('❌ Error en getDeliveryStats:', error);
    return { error };
  }
};

/**
 * Reportar un problema con el pedido
 */
export const reportOrderIssue = async (orderId, repartidorId, issue) => {
  try {
    const result = await supabase
      .from('pedidos')
      .update({
        estado: 'problema',
        notas_repartidor: issue,
        fecha_reporte_problema: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('repartidor_id', repartidorId)
      .select()
      .single();

    logSupabaseOperation('Reportar problema del pedido', result);
    return result;
  } catch (error) {
    console.error('❌ Error en reportOrderIssue:', error);
    return { error };
  }
};