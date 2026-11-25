import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { marca, tema } from "../theme/marca";

type IconoProps = { nombre: "tijeras" | "hilo" | "aguja" | "prenda" | "persona" | "calendario" | "reloj" | "flecha" | "ojo" | "cerrar"; size?: number; color?: string };

/** Glifos nativos para no introducir una dependencia de iconos en Expo. */
export function IconoCostura({ nombre, size = 20, color = tema.encabezado }: IconoProps) {
  const glifos: Record<IconoProps["nombre"], string> = {
    tijeras: "✂", hilo: "◉", aguja: "╱", prenda: "◇", persona: "●", calendario: "▦", reloj: "◷", flecha: "›", ojo: "◉", cerrar: "×",
  };
  return <Text accessible={false} style={{ color, fontSize: size, lineHeight: size + 4, fontWeight: "700" }}>{glifos[nombre]}</Text>;
}

type BotonProps = {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  cargando?: boolean;
  secundario?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function BotonMarca({ children, onPress, disabled = false, cargando = false, secundario = false, accessibilityLabel, style }: BotonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || cargando }}
      onPress={onPress}
      disabled={disabled || cargando}
      style={({ pressed }) => [
        ui.boton,
        secundario && ui.botonSecundario,
        (disabled || cargando) && ui.botonDeshabilitado,
        pressed && !(disabled || cargando) && ui.botonPresionado,
        style,
      ]}
    >
      {cargando ? <ActivityIndicator color={secundario ? tema.titulo : marca.blanco} /> : typeof children === "string" ? <Text style={[ui.botonTexto, secundario && ui.botonSecundarioTexto]}>{children}</Text> : children}
    </Pressable>
  );
}

type CampoProps = TextInputProps & { icono?: IconoProps["nombre"]; accion?: ReactNode; contenedorStyle?: ViewStyle };

export function CampoMarca({ icono, accion, style, contenedorStyle, ...props }: CampoProps) {
  return (
    <View style={[ui.campoCaja, contenedorStyle]}>
      {icono ? <View style={ui.campoIcono}><IconoCostura nombre={icono} /></View> : null}
      <TextInput {...props} style={[ui.campo, style]} placeholderTextColor="#77718B" />
      {accion ? <View style={ui.campoAccion}>{accion}</View> : null}
    </View>
  );
}

export function EtiquetaSeccion({ icono, children }: { icono: IconoProps["nombre"]; children: string }) {
  return <View style={ui.seccionEtiqueta}><IconoCostura nombre={icono} size={17} /><Text style={ui.seccionTitulo}>{children}</Text></View>;
}

export const ui = StyleSheet.create({
  boton: { minHeight: 52, borderRadius: 15, paddingHorizontal: 18, backgroundColor: marca.moradoOscuro, alignItems: "center", justifyContent: "center", shadowColor: marca.moradoOscuro, shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  botonSecundario: { backgroundColor: marca.celestePastel, shadowOpacity: 0 },
  botonTexto: { color: marca.blanco, fontSize: 16, fontWeight: "800", letterSpacing: 0.15 },
  botonSecundarioTexto: { color: tema.texto },
  botonDeshabilitado: { opacity: 0.55 },
  botonPresionado: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  campoCaja: { minHeight: 54, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: marca.lila, borderRadius: 14, backgroundColor: marca.blancoLavanda, marginBottom: 15, paddingHorizontal: 12 },
  campoIcono: { width: 30, alignItems: "center", marginRight: 4 },
  campo: { flex: 1, minWidth: 0, paddingVertical: 13, paddingHorizontal: 5, color: tema.texto, fontSize: 15 },
  campoAccion: { paddingHorizontal: 4, justifyContent: "center" },
  seccionEtiqueta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  seccionTitulo: { color: tema.titulo, fontSize: 16, fontWeight: "800" },
});
