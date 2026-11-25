import { api } from "./client";

export interface PedidoMovil {
  id: number;
  codigo: string;
  cliente: number;
  prenda: number;
  cliente_nombre: string;
  prenda_nombre: string;
  categoria_codigo: string;
  fecha_entrega: string;
  estado: string;
  descripcion: string;
  nota_interna: string;
  medidas_ultima_toma: {
    categoria: string;
    fecha: string;
    valores_cm: Record<string, number>;
  } | null;
}

export interface HistorialMovil {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  fecha_hora: string;
  usuario_nombre: string;
}

export interface UsoTelaMovil {
  id: number;
  tela: number;
  tela_nombre: string;
  tela_color: string;
  metros_usados: string;
  registrado_por_nombre: string | null;
  confirmado: boolean;
  vigente: boolean;
  reemplazado_en: string | null;
  reemplazado_por_nombre: string | null;
  fecha: string;
}

interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listarMisPedidos(
  estado?: string,
  page = 1,
): Promise<Pagina<PedidoMovil>> {
  const { data } = await api.get<Pagina<PedidoMovil>>("/mis-pedidos/", {
    params: estado
      ? {
          estado,
          page,
          ...(estado === "ENTREGADO" ? { incluir_entregados: true } : {}),
        }
      : { page, incluir_entregados: true },
  });
  return data;
}

export async function obtenerPedido(codigo: string): Promise<PedidoMovil> {
  const { data } = await api.get<PedidoMovil>(`/pedidos/${codigo}/`);
  return data;
}

export async function cambiarEstado(codigo: string): Promise<HistorialMovil> {
  const { data } = await api.post<HistorialMovil>(
    `/pedidos/${codigo}/estado/`,
    { confirmar: true },
  );
  return data;
}

export async function listarHistorial(
  codigo: string,
): Promise<HistorialMovil[]> {
  const { data } = await api.get<Pagina<HistorialMovil>>(
    `/pedidos/${codigo}/historial/`,
  );
  return data.results;
}

export async function listarConsumos(codigo: string): Promise<UsoTelaMovil[]> {
  const { data } = await api.get<Pagina<UsoTelaMovil>>(
    `/pedidos/${codigo}/consumos/`,
  );
  return data.results;
}
