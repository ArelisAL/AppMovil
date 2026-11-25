import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { router } from "expo-router";

import apiAuth from "../src/api/auth";
import { guardarTokens, leerTokens, marcarUso } from "../src/auth/sesion";
import LoginScreen from "./login";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));

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
  leerTokens: jest.fn(async () => ({ acceso: null, refresco: null })),
  marcarUso: jest.fn(),
  cerrarSesion: jest.fn(),
  cerradoPorInactividad: jest.fn(() => false),
}));

const api = jest.mocked(apiAuth);
const guardar = jest.mocked(guardarTokens);
const leer = jest.mocked(leerTokens);
const marcar = jest.mocked(marcarUso);
const replace = jest.mocked(router.replace);

describe("LoginScreen (Pantalla inicial de sesión, 2.2/2.3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    leer.mockResolvedValue({ acceso: null, refresco: null });
  });

  it("llama a la API con email y contraseña al ingresar y guarda los tokens", async () => {
    api.login.mockResolvedValue({
      access: "token-acceso",
      refresh: "token-refresco",
    });
    api.yo.mockResolvedValue({
      id: 1,
      nombre: "María López",
      email: "costurera@ejemplo.com",
      rol: "costurera",
      activo: true,
      debe_cambiar_contraseña: false,
    });
    await render(<LoginScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Escribe tu correo"),
      "costurera@ejemplo.com",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Escribe tu contraseña"),
      "contrasena123",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() =>
      expect(api.login).toHaveBeenCalledWith(
        "costurera@ejemplo.com",
        "contrasena123",
      ),
    );
    await waitFor(() =>
      expect(guardar).toHaveBeenCalledWith("token-acceso", "token-refresco"),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(marcar).toHaveBeenCalled();
  });

  it("muestra el mensaje de error devuelto por la API", async () => {
    api.login.mockRejectedValue({
      response: { data: { detalle: "Credenciales inválidas" } },
    });
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Credenciales inválidas")).toBeTruthy();
  });

  it("redirige a principal si ya hay sesión activa", async () => {
    leer.mockResolvedValue({
      acceso: "ya-tiene-token",
      refresco: "ya-tiene-refresco",
    });
    await render(<LoginScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(api.login).not.toHaveBeenCalled();
  });
});
