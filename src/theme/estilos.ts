import { StyleSheet } from "react-native";
import { marca, tema } from "./marca";

// Sistema visual compartido para mantener coherencia en las pantallas nativas.
export const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    backgroundColor: tema.fondo,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaBlanca: {
    backgroundColor: marca.blanco,
    width: "100%",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: marca.lila,
    shadowColor: marca.moradoOscuro,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  titulo: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "800",
    color: tema.titulo,
    marginBottom: 10,
  },
  texto: {
    fontSize: 15,
    color: tema.texto,
    marginBottom: 8,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: marca.lila,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    fontSize: 16,
    color: tema.texto,
    backgroundColor: marca.blancoLavanda,
    minWidth: 0,
  },
  error: {
    color: tema.error,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FCE9E9",
  },
});
