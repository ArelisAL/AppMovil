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

import { IconoFigma, type NombreIcono } from "./Iconos";
import { estilos } from "../theme/estilos";
import { espacio, marca, radio, tema, tipo } from "../theme/marca";

type IconoProps = { nombre: NombreIcono | "hilo"; size?: number; color?: string };

/** Íconos de trazo del diseño de Figma; «hilo» se muestra como el carrete. */
export function IconoCostura({ nombre, size = 20, color = tema.titulo }: IconoProps) {
  return <IconoFigma nombre={nombre === "hilo" ? "carrete" : nombre} size={size} color={color} />;
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

type CampoProps = TextInputProps & {
  icono?: IconoProps["nombre"];
  accion?: ReactNode;
  contenedorStyle?: ViewStyle;
  /** Rótulo en negrita sobre la entrada (Campo/Texto del diseño). */
  etiqueta?: string;
  /** Texto de ayuda bajo la entrada, por ejemplo «cómo se toma». */
  ayuda?: string;
};

export function CampoMarca({ icono, accion, style, contenedorStyle, etiqueta, ayuda, ...props }: CampoProps) {
  const entrada = (
    <View style={[ui.campoCaja, !etiqueta && !ayuda && contenedorStyle]}>
      {icono ? <View style={ui.campoIcono}><IconoCostura nombre={icono} size={20} /></View> : null}
      <TextInput {...props} style={[ui.campo, style]} placeholderTextColor="#77718B" />
      {accion ? <View style={ui.campoAccion}>{accion}</View> : null}
    </View>
  );
  if (!etiqueta && !ayuda) return entrada;
  return (
    <View style={[ui.campoGrupo, contenedorStyle]}>
      {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
      {entrada}
      {ayuda ? <Text style={estilos.nota}>{ayuda}</Text> : null}
    </View>
  );
}

/** Pastilla redondeada para roles, filtros y selecciones. */
export function ChipMarca({ children, fondo = marca.lila, colorTexto = tema.texto, icono, style }: { children: ReactNode; fondo?: string; colorTexto?: string; icono?: IconoProps["nombre"]; style?: ViewStyle }) {
  return (
    <View style={[estilos.chip, { backgroundColor: fondo }, style]}>
      {icono ? <IconoCostura nombre={icono} size={15} /> : null}
      <Text style={[estilos.chipTexto, { color: colorTexto }]}>{children}</Text>
    </View>
  );
}

/** Colores de estado de pedido (AGENTS §12.4). */
export function colorEstado(estado: string): string {
  if (estado === "PENDIENTE") return marca.amarilloSuave;
  if (estado === "EN_PROCESO") return marca.celestePastel;
  if (estado === "TERMINADO") return marca.verdeMenta;
  return marca.lila;
}

export function EstadoPedido({ estado }: { estado: string }) {
  return (
    <View style={[estilos.estado, { backgroundColor: colorEstado(estado) }]}>
      <Text style={estilos.estadoTexto}>{estado.replace(/_/g, " ")}</Text>
    </View>
  );
}

export function EtiquetaSeccion({ icono, children }: { icono: IconoProps["nombre"]; children: string }) {
  return <View style={ui.seccionEtiqueta}><IconoCostura nombre={icono} size={18} /><Text style={ui.seccionTitulo}>{children}</Text></View>;
}

export const ui = StyleSheet.create({
  boton: { minHeight: 52, borderRadius: radio.boton, paddingHorizontal: 18, backgroundColor: marca.moradoOscuro, alignItems: "center", justifyContent: "center" },
  botonSecundario: { backgroundColor: marca.celestePastel },
  botonTexto: { color: marca.blanco, fontSize: 16, lineHeight: 20, fontWeight: "700", letterSpacing: 0.16 },
  botonSecundarioTexto: { color: tema.texto },
  botonDeshabilitado: { opacity: 0.55 },
  botonPresionado: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  campoGrupo: { width: "100%", gap: espacio.campo },
  campoCaja: { width: "100%", minHeight: 54, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: marca.lila, borderRadius: radio.campo, backgroundColor: marca.blanco, paddingHorizontal: 12 },
  campoIcono: { width: 20, alignItems: "center" },
  campo: { flex: 1, minWidth: 0, paddingVertical: 12, ...tipo.campo, color: tema.texto },
  campoAccion: { justifyContent: "center" },
  seccionEtiqueta: { flexDirection: "row", alignItems: "center", gap: 8 },
  seccionTitulo: { ...tipo.seccion, color: tema.titulo },
});
