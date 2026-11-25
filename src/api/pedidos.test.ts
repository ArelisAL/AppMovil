import { api } from "./client";
import { listarConsumos } from "./pedidos";

jest.mock("./client", () => ({
  api: { get: jest.fn() },
}));

describe("API de consumos del pedido (costurera)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("consulta los consumos del pedido por el endpoint versionado", async () => {
    const usos = [
      {
        id: 8,
        tela: 2,
        tela_nombre: "Algodón",
        tela_color: "Lila",
        metros_usados: "1.25",
        registrado_por_nombre: "Recepción",
        confirmado: false,
        vigente: true,
        reemplazado_en: null,
        reemplazado_por_nombre: null,
        fecha: "2026-11-25T12:00:00Z",
      },
    ];
    jest.mocked(api.get).mockResolvedValueOnce({ data: { results: usos } });

    await expect(listarConsumos("FC-0008")).resolves.toEqual(usos);
    expect(api.get).toHaveBeenCalledWith("/pedidos/FC-0008/consumos/");
  });
});
