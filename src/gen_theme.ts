import { writeFileSync } from "fs";

const MARCA = `// src/theme/marca.ts — mismos valores que marca.css
export const marca = {
  celestePastel: "#8ED8F8",
  azulCeleste: "#55BCE8",
  rosaPastel: "#F5A6D0",
  rosaIntenso: "#E879B2",
  lila: "#C5A3F5",
  morado: "#9670D8",
  moradoOscuro: "#7250B5",
  verdeMenta: "#B8E5D0",
  amarilloSuave: "#FFF0C9",
  blancoLavanda: "#F8F7FC",
  grisVioleta: "#45405A",
} as const;

export const tema = {
  fondo: marca.blancoLavanda,
  texto: marca.grisVioleta,
  primario: marca.azulCeleste,
  titulo: marca.moradoOscuro,
  encabezado: marca.morado,
  destacado: marca.rosaIntenso,
  seccion: marca.lila,
  acento: marca.amarilloSuave,
  secundario: marca.verdeMenta,
} as const;
`;

const ESTILOS = `import { StyleSheet } from "react-native";
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
    color: "#C62828",
    fontSize: 14,
    marginBottom: 8,
  },
});
`;

writeFileSync("src/theme/marca.ts", MARCA);
writeFileSync("src/theme/estilos.ts", ESTILOS);
console.log("generados: src/theme/marca.ts, src/theme/estilos.ts");
