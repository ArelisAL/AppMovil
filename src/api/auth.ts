import { api } from "./client";

/** Campos devueltos por POST /api/v1/auth/login/ y POST /api/v1/auth/refresh/ (DERCAS §7.2). */
export interface Tokens {
  access: string;
  refresh: string;
}

/** Datos del usuario autenticado devueltos por GET /api/v1/auth/yo/. */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  debe_cambiar_contraseña: boolean;
}

export const esCosturera = (usuario: Usuario): boolean => usuario.rol === "costurera";

/** Devuelve el mensaje en español del campo "detalle" que devuelve la API. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof Error && error.message.startsWith("Configura EXPO_PUBLIC_API_URL")) {
    return error.message;
  }
  const anyError = error as { response?: { data?: { detalle?: string } } };
  const detalle = anyError?.response?.data?.detalle;
  if (typeof detalle === "string" && detalle.length > 0) return detalle;
  return "Hubo un error al contactar con la API.";
}

export const apiAuth = {
  /** POST /api/v1/auth/login/ — {email, password} → {access, refresh} (2.2, 2.3). */
  async login(email: string, contrasena: string): Promise<Tokens> {
    const { data } = await api.post<Tokens>("/auth/login/", {
      email,
      password: contrasena,
    });
    return data;
  },

  /** POST /api/v1/auth/refresh/ — {refresh} → {access, refresh} (2.2). */
  async refresh(refresco: string): Promise<Tokens> {
    const { data } = await api.post<Tokens>("/auth/refresh/", { refresh: refresco });
    return data;
  },

  /** GET /api/v1/auth/yo/ — datos del usuario autenticado (2.2). */
  async yo(): Promise<Usuario> {
    const { data } = await api.get<Usuario>("/auth/yo/");
    return data;
  },

  /** POST /api/v1/auth/logout/ — {refresh}; invalida el refresco (2.2, 2.4, SEG-01). */
  async logout(refresco: string): Promise<void> {
    await api.post("/auth/logout/", { refresh: refresco });
  },

  /** POST /api/v1/auth/cambiar-contraseña/ — {nueva_contrasena} (RF-M0-05, 2.2, SEG-03). */
  async cambiarContrasena(contrasenaActual: string, nuevaContrasena: string): Promise<Tokens> {
    const { data } = await api.post<Tokens>("/auth/cambiar-contraseña/", {
      contrasena_actual: contrasenaActual,
      nueva_contrasena: nuevaContrasena,
    });
    return data;
  },
};

export default apiAuth;
