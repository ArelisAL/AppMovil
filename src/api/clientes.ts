import { api } from "./client";

export interface MedidaMovil {
  id: number;
  cliente: number;
  categoria: string;
  prenda: string | null;
  valores_cm: Record<string, number>;
  fecha: string;
  tomada_por: string;
}

export async function registrarMedidas(
  clienteId: number,
  categoria: string,
  prenda: number | null,
  valores_cm: Record<string, number>,
): Promise<MedidaMovil> {
  const { data } = await api.post<MedidaMovil>(`/clientes/${clienteId}/medidas/`, {
    categoria,
    prenda,
    valores_cm,
  });
  return data;
}
