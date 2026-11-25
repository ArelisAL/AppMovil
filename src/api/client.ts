import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

export const ACCESO_KEY = "fc_acceso";
const REFRESCO_KEY = "fc_refresco";

/** Token de acceso — solo en expo-secure-store, nunca en AsyncStorage. */
export const leerTokenAcceso = async (): Promise<string | null> =>
  SecureStore.getItemAsync(ACCESO_KEY);

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "";
let refrescoEnCurso: Promise<{ access: string; refresh: string }> | null = null;

if (!__DEV__ && baseURL && !baseURL.startsWith("https://")) {
  throw new Error("La API debe usar HTTPS en la compilación de producción.");
}

export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  if (!baseURL) {
    throw new Error("Configura EXPO_PUBLIC_API_URL para conectar con Fran-Costuras.");
  }
  const token = await leerTokenAcceso();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _fcReintento?: boolean })
      | undefined;
    if (
      error.response?.status !== 401 ||
      !original ||
      original._fcReintento ||
      original.url?.includes("/auth/refresh/")
    ) {
      return Promise.reject(error);
    }

    original._fcReintento = true;
    try {
      const refresh = await SecureStore.getItemAsync(REFRESCO_KEY);
      if (!refresh) return Promise.reject(error);
      if (!refrescoEnCurso) {
        refrescoEnCurso = axios
          .post<{ access: string; refresh: string }>(
            `${baseURL}/auth/refresh/`,
            { refresh },
            { timeout: 15000 },
          )
          .then(async ({ data }) => {
            await Promise.all([
              SecureStore.setItemAsync(ACCESO_KEY, data.access),
              SecureStore.setItemAsync(REFRESCO_KEY, data.refresh),
            ]);
            return data;
          });
      }
      const tokens = await refrescoEnCurso;
      original.headers.Authorization = `Bearer ${tokens.access}`;
      return await api.request(original);
    } catch {
      return Promise.reject(error);
    } finally {
      refrescoEnCurso = null;
    }
  },
);
