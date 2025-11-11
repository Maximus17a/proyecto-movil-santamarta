import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

const Boton = ({ 
  children, 
  onPress, 
  tipo = 'primario', 
  tamaño = 'normal', 
  disabled = false, 
  loading = false,
  style = {},
  textStyle = {},
  ...props 
}) => {
  // Estilos dinámicos basados en el tipo
  const getButtonStyle = () => {
    const baseStyle = [styles.boton, styles[`boton_${tamaño}`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.boton_disabled);
    } else {
      baseStyle.push(styles[`boton_${tipo}`]);
    }
    
    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.texto, styles[`texto_${tamaño}`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.texto_disabled);
    } else {
      baseStyle.push(styles[`texto_${tipo}`]);
    }
    
    return [...baseStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={tipo === 'primario' ? theme.colors.light : theme.colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Estilos base
  boton: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
  },
  texto: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Tamaños
  boton_pequeño: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  boton_normal: {
    paddingVertical: theme.spacing.sm,
  },
  boton_grande: {
    paddingVertical: theme.spacing.md,
  },

  texto_pequeño: {
    fontSize: 14,
    lineHeight: 18,
  },
  texto_normal: {
    fontSize: 16,
    lineHeight: 20,
  },
  texto_grande: {
    fontSize: 18,
    lineHeight: 24,
  },

  // Tipos/variantes
  boton_primario: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  texto_primario: {
    color: theme.colors.light,
  },

  boton_secundario: {
    backgroundColor: theme.colors.secondary,
    ...theme.shadows.sm,
  },
  texto_secundario: {
    color: theme.colors.light,
  },

  boton_success: {
    backgroundColor: theme.colors.success,
    ...theme.shadows.sm,
  },
  texto_success: {
    color: theme.colors.light,
  },

  boton_warning: {
    backgroundColor: theme.colors.warning,
    ...theme.shadows.sm,
  },
  texto_warning: {
    color: theme.colors.dark,
  },

  boton_danger: {
    backgroundColor: theme.colors.danger,
    ...theme.shadows.sm,
  },
  texto_danger: {
    color: theme.colors.light,
  },

  boton_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  texto_outline: {
    color: theme.colors.primary,
  },

  boton_ghost: {
    backgroundColor: 'transparent',
  },
  texto_ghost: {
    color: theme.colors.primary,
  },

  // Estados deshabilitado
  boton_disabled: {
    backgroundColor: theme.colors.light,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  texto_disabled: {
    color: theme.colors.textSecondary,
  },
});

export default Boton;