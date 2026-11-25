import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { router } from "expo-router";

import apiAuth from "../src/api/auth";
import CambiarContrasenaScreen from "./cambiar-contrasena";

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

const api = jest.mocked(apiAuth);
const replace = jest.mocked(router.replace);

describe("CambiarContrasenaScreen (RF-M0-05, 2.2, SEG-03)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("llama a POST /api/v1/auth/cambiar-contraseña/ con nueva_contrasena", async () => {
    api.cambiarContrasena.mockResolvedValue({
      access: "nuevo-access",
      refresh: "nuevo-refresh",
    });
    await render(<CambiarContrasenaScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Contraseña temporal actual"),
      "temporal-correcta",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Nueva contraseña"),
      "nueva-secreta-123",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Confirmar nueva contraseña"),
      "nueva-secreta-123",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() =>
      expect(api.cambiarContrasena).toHaveBeenCalledWith(
        "temporal-correcta",
        "nueva-secreta-123",
      ),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("muestra el mensaje de error que devuelve la API", async () => {
    api.cambiarContrasena.mockRejectedValue({
      response: {
        data: { detalle: "La contraseña debe tener al menos 10 caracteres" },
      },
    });
    await render(<CambiarContrasenaScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Nueva contraseña"),
      "corta",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Confirmar nueva contraseña"),
      "corta",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      await screen.findByText(
        "La contraseña debe tener al menos 10 caracteres",
      ),
    ).toBeTruthy();
  });

  it("no llama a la API si las contraseñas no coinciden", async () => {
    await render(<CambiarContrasenaScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Nueva contraseña"),
      "abc1234567",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Confirmar nueva contraseña"),
      "otra-diferente",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      await screen.findByText("Las contraseñas deben coincidir."),
    ).toBeTruthy();
    expect(api.cambiarContrasena).not.toHaveBeenCalled();
  });
});
