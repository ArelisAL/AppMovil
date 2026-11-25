import { StyleSheet } from "react-native";
import { marca, tema } from "./marca";

// Estilos compartidos para pantallas. Solo se usan variables de tema y colores de marca.
export const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: tema.fondo,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tarjetaBlanca: {
    backgroundColor: marca.blancoLavanda,
    width: "100%",
    borderRadius: 12,
    padding: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: tema.titulo,
    marginBottom: 16,
    textAlign: "center",
  },
  texto: {
    fontSize: 16,
    color: tema.texto,
    marginBottom: 8,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: marca.rosaIntenso,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: tema.texto,
    backgroundColor: marca.blancoLavanda,
    minWidth: 0,
  },
  error: {
    color: tema.error,
    fontSize: 14,
    marginBottom: 8,
  },
});
