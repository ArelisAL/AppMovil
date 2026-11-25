import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

import apiAuth from "../api/auth";

const ACCESO_KEY = "fc_acceso";
const REFRESCO_KEY = "fc_refresco";
const ULTIMO_USO_KEY = "fc_ultimo_uso";
const DURACION_30_MINUTOS = 30 * 60 * 1000;

let ultimoUso: number | null = null;

export const marcarUso = (): void => {
  ultimoUso = Date.now();
  void SecureStore.setItemAsync(ULTIMO_USO_KEY, String(ultimoUso)).catch(() => undefined);
};

export const guardarTokens = async (acceso: string, refresco: string): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESO_KEY, acceso),
    SecureStore.setItemAsync(REFRESCO_KEY, refresco),
  ]);
  marcarUso();
};

export const leerTokens = async (): Promise<{
  acceso: string | null;
  refresco: string | null;
}> => {
  const [acceso, refresco] = await Promise.all([
    SecureStore.getItemAsync(ACCESO_KEY),
    SecureStore.getItemAsync(REFRESCO_KEY),
  ]);
  return { acceso, refresco };
};

/** Cierra la sesión: invalida el refresco en la API y borra ambos tokens. */
export const cerrarSesion = async (): Promise<void> => {
  const { refresco } = await leerTokens();
  if (refresco) {
    try {
      await apiAuth.logout(refresco);
    } catch {
      // Si el token ya no es válido, seguimos invalidando en local.
    }
  }
  await SecureStore.deleteItemAsync(ACCESO_KEY);
  await SecureStore.deleteItemAsync(REFRESCO_KEY);
  await SecureStore.deleteItemAsync(ULTIMO_USO_KEY);
  ultimoUso = null;
  router.replace("/login");
};

/** true si no hubo uso en los últimos 30 minutos (cierre por inactividad). */
export const cerradoPorInactividad = (): boolean =>
  ultimoUso !== null && Date.now() - ultimoUso > DURACION_30_MINUTOS;

export const inactividadExpirada = async (): Promise<boolean> => {
  const almacenado = await SecureStore.getItemAsync(ULTIMO_USO_KEY);
  const ultimaActividad = almacenado ? Number(almacenado) : ultimoUso;
  return (
    ultimaActividad !== null &&
    Number.isFinite(ultimaActividad) &&
    Date.now() - ultimaActividad >= DURACION_30_MINUTOS
  );
};
