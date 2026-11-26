// src/theme/marca.ts — mismos valores que marca.css
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
  blanco: "#FFFFFF",
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
  error: "#C62828",
  exito: "#2E7D32",
} as const;

/** Escalas del diseño de Figma «Fran-Costuras · App Android» (Roboto en Android). */
export const tipo = {
  titulo: { fontSize: 24, lineHeight: 30, fontWeight: "700", letterSpacing: -0.12 },
  subtitulo: { fontSize: 20, lineHeight: 26, fontWeight: "700" },
  seccion: { fontSize: 17, lineHeight: 22, fontWeight: "700" },
  cuerpo: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  campo: { fontSize: 15, lineHeight: 20, fontWeight: "400" },
  etiqueta: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  nota: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  chip: { fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 0.24 },
  mini: { fontSize: 11, lineHeight: 14, fontWeight: "700", letterSpacing: 0.66 },
} as const;

export const espacio = { pantallaX: 20, pantallaY: 24, bloque: 16, tarjeta: 20, lista: 12, campo: 6 } as const;

export const radio = { campo: 12, boton: 16, tarjeta: 20, pastilla: 100 } as const;

export const sombraTarjeta = {
  shadowColor: marca.moradoOscuro,
  shadowOpacity: 0.08,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;
