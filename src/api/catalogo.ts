import { api } from "./client";

interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Categoria {
  id: number;
  codigo: string;
  nombre: string;
  tipos_medida: TipoMedida[];
}

export interface TipoMedida {
  codigo: string;
  nombre: string;
  como_se_toma: string;
}

export interface Prenda {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
}

export interface PrendaMedida extends TipoMedida {
  opcional: boolean;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Pagina<Categoria>>("/catalogo/categorias/");
  return data.results;
}

export async function listarPrendas(categoria: string): Promise<Prenda[]> {
  const { data } = await api.get<Pagina<Prenda>>("/catalogo/prendas/", { params: { categoria } });
  return data.results;
}

export async function listarMedidasPrenda(prendaId: number): Promise<PrendaMedida[]> {
  const { data } = await api.get<Pagina<PrendaMedida>>(`/catalogo/prendas/${prendaId}/medidas/`);
  return data.results;
}
