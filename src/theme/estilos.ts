import { StyleSheet } from "react-native";
import { espacio, marca, radio, sombraTarjeta, tema, tipo } from "./marca";

// Sistema visual compartido (diseño de Figma «Fran-Costuras · App Android»).
export const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    backgroundColor: tema.fondo,
    paddingHorizontal: espacio.pantallaX,
    paddingVertical: espacio.pantallaY,
    gap: espacio.bloque,
  },
  tarjetaBlanca: {
    backgroundColor: marca.blanco,
    width: "100%",
    borderRadius: radio.tarjeta,
    padding: espacio.tarjeta,
    borderWidth: 1,
    borderColor: marca.lila,
    ...sombraTarjeta,
  },
  titulo: { ...tipo.titulo, color: tema.titulo },
  seccion: { ...tipo.seccion, color: tema.titulo },
  texto: { ...tipo.cuerpo, color: tema.texto },
  nota: { ...tipo.nota, color: tema.texto, opacity: 0.85 },
  etiqueta: { ...tipo.etiqueta, color: tema.texto },
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radio.pastilla,
  },
  chipTexto: { ...tipo.chip, color: tema.texto },
  estado: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radio.pastilla },
  estadoTexto: { fontSize: 11, lineHeight: 14, fontWeight: "700", letterSpacing: 0.44, color: tema.texto },
  input: {
    borderWidth: 1,
    borderColor: marca.lila,
    borderRadius: radio.campo,
    paddingHorizontal: 12,
    minHeight: 54,
    ...tipo.campo,
    color: tema.texto,
    backgroundColor: marca.blanco,
    minWidth: 0,
  },
  error: {
    ...tipo.cuerpo,
    color: tema.error,
    padding: 12,
    borderRadius: radio.campo,
    backgroundColor: "#FCE9E9",
  },
});
