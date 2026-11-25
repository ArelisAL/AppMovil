import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

import apiAuth from "../api/auth";
import {
  cerradoPorInactividad,
  cerrarSesion,
  guardarTokens,
  leerTokens,
  marcarUso,
} from "./sesion";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("../api/auth", () => ({
  __esModule: true,
  ...jest.requireActual("../api/auth"),
  default: {
    ...jest.requireActual("../api/auth").default,
    login: jest.fn(),
    refresh: jest.fn(),
    yo: jest.fn(),
    logout: jest.fn(),
    cambiarContrasena: jest.fn(),
  },
}));

const storeSet = jest.mocked(SecureStore.setItemAsync);
const storeGet = jest.mocked(SecureStore.getItemAsync);
const storeDelete = jest.mocked(SecureStore.deleteItemAsync);
const logout = jest.mocked(apiAuth.logout);
const replace = jest.mocked(router.replace);

describe("sesion (src/auth/sesion.ts — Token solo en expo-secure-store, 2.2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("guardarTokens guarda acceso y refresco en SecureStore", async () => {
    storeSet.mockResolvedValue(undefined);
    await guardarTokens("access-abc", "refresh-xyz");
    expect(storeSet).toHaveBeenCalledWith("fc_acceso", "access-abc");
    expect(storeSet).toHaveBeenCalledWith("fc_refresco", "refresh-xyz");
    expect(storeSet).not.toHaveBeenCalledWith(expect.anything(), expect.stringContaining("AsyncStorage"));
  });

  it("leerTokens lee ambos tokens", async () => {
    storeGet.mockResolvedValue("access-abc");
    const tokens = await leerTokens();
    expect(tokens.acceso).toBe("access-abc");
  });

  it("cerrarSesion invalida el refresco en la API, borra tokens y redirige a login", async () => {
    storeGet.mockResolvedValue("refresh-xyz");
    storeDelete.mockResolvedValue(undefined);
    logout.mockResolvedValue(undefined);
    await cerrarSesion();
    expect(logout).toHaveBeenCalledWith("refresh-xyz");
    expect(storeDelete).toHaveBeenCalledWith("fc_acceso");
    expect(storeDelete).toHaveBeenCalledWith("fc_refresco");
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("cierra por inactividad tras 30 minutos sin uso", () => {
    const ahora = jest.spyOn(Date, "now");
    ahora.mockReturnValue(1_000_000);
    marcarUso();
    expect(cerradoPorInactividad()).toBe(false);
    ahora.mockReturnValue(1_000_000 + 30 * 60 * 1000 + 1);
    expect(cerradoPorInactividad()).toBe(true);
    ahora.mockRestore();
  });

  it("no cierra por inactividad si nunca hubo uso", () => {
    const ahora = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    expect(cerradoPorInactividad()).toBe(false);
    ahora.mockRestore();
  });
});
