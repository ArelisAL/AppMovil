import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import apiAuth from "../src/api/auth";
import { cerrarSesion, inactividadExpirada } from "../src/auth/sesion";
import PantallaPrincipal from "./index";

jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    router: { replace: jest.fn() },
    useFocusEffect: (callback: () => void | (() => void)) =>
      React.useEffect(callback, [callback]),
  };
});

jest.mock("../src/api/pedidos", () => ({
  listarMisPedidos: jest.fn(async () => ({ count: 0, results: [] })),
}));

jest.mock("../src/api/auth", () => ({
  __esModule: true,
  ...jest.requireActual("../src/api/auth"),
  default: {
    ...jest.requireActual("../src/api/auth").default,
    login: jest.fn(),
    refresh: jest.fn(),
    yo: jest.fn(),
    logout: jest.fn(),
    cambiarContrasena: jest.fn(),
  },
}));

jest.mock("../src/auth/sesion", () => ({
  guardarTokens: jest.fn(),
  leerTokens: jest.fn(async () => ({ acceso: "access", refresco: "refresh" })),
  marcarUso: jest.fn(),
  cerrarSesion: jest.fn(async () => undefined),
  inactividadExpirada: jest.fn(async () => false),
}));

const api = jest.mocked(apiAuth);
const cerrar = jest.mocked(cerrarSesion);
const expirada = jest.mocked(inactividadExpirada);

describe("PantallaPrincipal (pantalla principal de sesión, 2.2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el nombre del usuario desde GET /api/v1/auth/yo/", async () => {
    api.yo.mockResolvedValue({
      id: 7,
      nombre: "María López",
      email: "maria@ejemplo.com",
      rol: "costurera",
      activo: true,
      debe_cambiar_contraseña: false,
    });
    await render(<PantallaPrincipal />);
    expect(await screen.findByText("Hola, María López")).toBeTruthy();
    expect(api.yo).toHaveBeenCalled();
  });

  it("comprueba expiración por inactividad antes de consultar la API", async () => {
    api.yo.mockResolvedValue({
      id: 7,
      nombre: "María López",
      email: "maria@ejemplo.com",
      rol: "costurera",
      activo: true,
      debe_cambiar_contraseña: false,
    });
    await render(<PantallaPrincipal />);
    await waitFor(() => expect(expirada).toHaveBeenCalled());
  });

  it("invoca cerrarSesion al presionar Salir", async () => {
    api.yo.mockResolvedValue({
      id: 7,
      nombre: "María López",
      email: "maria@ejemplo.com",
      rol: "costurera",
      activo: true,
      debe_cambiar_contraseña: false,
    });
    await render(<PantallaPrincipal />);
    const boton = await screen.findByRole("button", {
      name: "Salir de la sesión",
    });
    await fireEvent.press(boton);
    await waitFor(() => expect(cerrar).toHaveBeenCalled());
  });
});
