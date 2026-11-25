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
