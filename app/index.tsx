import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import apiAuth, { esCosturera, mensajeDeError, type Usuario } from "../src/api/auth";
import { listarMisPedidos, type PedidoMovil } from "../src/api/pedidos";
import { cerrarSesion, inactividadExpirada, leerTokens } from "../src/auth/sesion";
import { estilos } from "../src/theme/estilos";
import { EstadoPedido, IconoCostura, colorEstado } from "../src/components/Marca";
import { espacio, marca, radio, tema, tipo } from "../src/theme/marca";

const ESTADOS = ["Todos", "PENDIENTE", "EN_PROCESO", "TERMINADO", "ENTREGADO"];

function etiquetaEstado(estado: string) {
  return estado.replace(/_/g, " ");
}

export default function PantallaPrincipal() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pedidos, setPedidos] = useState<PedidoMovil[]>([]);
  const [estado, setEstado] = useState("Todos");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = useCallback(async () => {
    try {
      const datos = await listarMisPedidos(estado === "Todos" ? undefined : estado, pagina);
      setPedidos(datos.results);
      setTotal(datos.count);
      setError(null);
    } catch (e) {
      setError(`Sin conexión con el servidor. ${mensajeDeError(e)}`);
    } finally {
      setCargando(false);
    }
  }, [estado, pagina]);

  useFocusEffect(
    useCallback(() => {
      let activa = true;
      const validarSesion = async () => {
        if (await inactividadExpirada()) { await cerrarSesion(); return; }
        const tokens = await leerTokens();
        if (!tokens.acceso || !tokens.refresco) { router.replace("/login"); return; }
        try {
          const actual = await apiAuth.yo();
          if (!esCosturera(actual)) { await cerrarSesion(); return; }
          if (actual["debe_cambiar_contrase\u00f1a"]) { router.replace("/cambiar-contrasena"); return; }
          if (activa) { setUsuario(actual); await cargarPedidos(); }
        } catch (e) {
          const codigo = (e as { response?: { status?: number } })?.response?.status;
          if (codigo === 401) await cerrarSesion();
          else if (activa) { setError(`Sin conexión con el servidor. ${mensajeDeError(e)}`); setCargando(false); }
        }
      };
      void validarSesion();
      return () => { activa = false; };
    }, [cargarPedidos]),
  );

  const paginasTotales = Math.max(1, Math.ceil(total / 20));

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <View style={styles.barra}>
        <View style={styles.marcaApp}>
          <IconoCostura nombre="tijeras" size={25} color={tema.titulo} />
          <Text style={styles.marcaTexto}>Fran-Costuras</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => void cerrarSesion().finally(() => router.replace("/login"))} accessibilityLabel="Salir de la sesión" hitSlop={8} style={styles.salir}>
          <Text style={styles.salirTexto}>Cerrar sesión</Text>
          <IconoCostura nombre="flecha" size={15} />
        </Pressable>
      </View>

      <View style={styles.cabecera}>
        <Text style={styles.saludo}>Hola, {usuario?.nombre || usuario?.email || "costurera"}</Text>
        <Text style={estilos.titulo}>Mis pedidos</Text>
        <Text style={estilos.texto}>Tus pedidos y fechas de entrega, siempre a mano.</Text>
        <Text style={estilos.nota}>{total} asignado{total === 1 ? "" : "s"}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
        {ESTADOS.map((opcion) => {
          const activo = estado === opcion;
          return (
            <Pressable
              key={opcion}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              onPress={() => { setEstado(opcion); setPagina(1); setCargando(true); }}
              style={[estilos.chip, { backgroundColor: opcion === "Todos" ? marca.blanco : colorEstado(opcion) }, opcion === "Todos" && styles.filtroTodos, activo && styles.filtroActivo]}
            >
              <Text style={[estilos.chipTexto, activo && styles.filtroTextoActivo]}>{opcion === "Todos" ? "Todos" : etiquetaEstado(opcion)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}
      {cargando ? <Text style={estilos.texto}>Cargando pedidos…</Text> : null}
      {!cargando && pedidos.length === 0 ? (
        <View style={styles.vacio}>
          <IconoCostura nombre="carrete" size={28} color={tema.encabezado} />
          <Text style={estilos.seccion}>Todo listo por aquí</Text>
          <Text style={[estilos.texto, styles.centrado]}>No tienes pedidos en este estado. Cuando te asignen uno, aparecerá en esta lista.</Text>
        </View>
      ) : null}

      {pedidos.map((pedido) => (
        <View key={pedido.id} style={styles.pedido}>
          <View style={styles.pedidoEncabezado}>
            <View style={styles.pedidoIcono}><IconoCostura nombre="prenda" size={22} color={tema.titulo} /></View>
            <View style={styles.pedidoNombre}>
              <Text style={styles.codigo}>{pedido.codigo}</Text>
              <Text style={styles.prenda} numberOfLines={2}>{pedido.prenda_nombre}</Text>
            </View>
            <EstadoPedido estado={pedido.estado} />
          </View>
          <View style={styles.detalleFila}>
            <IconoCostura nombre="persona" size={16} color={tema.titulo} />
            <Text style={styles.detalleTexto}>{pedido.cliente_nombre}</Text>
          </View>
          <View style={styles.detalleFila}>
            <IconoCostura nombre="calendario" size={16} color={tema.titulo} />
            <Text style={styles.detalleTexto}>Entrega: {pedido.fecha_entrega}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver detalle y medidas"
            style={styles.botonDetalle}
            onPress={() => router.push({ pathname: "/pedido/[id]", params: { id: pedido.codigo } })}
          >
            <Text style={styles.botonDetalleTexto}>Ver detalle y medidas</Text>
            <IconoCostura nombre="flecha" size={18} />
          </Pressable>
        </View>
      ))}

      {!cargando && total > 0 ? (
        <View style={styles.paginacion}>
          <Pressable accessibilityRole="button" accessibilityLabel="Anterior" disabled={pagina <= 1} onPress={() => { setPagina((actual) => actual - 1); setCargando(true); }} hitSlop={8} style={[styles.botonPagina, pagina <= 1 && styles.botonDesactivado]}>
            <Text style={[styles.paginaEnlace, pagina <= 1 && styles.paginaInactiva]}>‹ Anterior</Text>
          </Pressable>
          <Text style={styles.paginaTexto}>{pagina} / {paginasTotales}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Siguiente" disabled={pagina >= paginasTotales} onPress={() => { setPagina((actual) => actual + 1); setCargando(true); }} hitSlop={8} style={[styles.botonPagina, pagina >= paginasTotales && styles.botonDesactivado]}>
            <Text style={[styles.paginaEnlace, pagina >= paginasTotales && styles.paginaInactiva]}>Siguiente ›</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  barra: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  marcaApp: { flexDirection: "row", alignItems: "center", gap: 7 },
  marcaTexto: { ...tipo.seccion, color: tema.titulo },
  salir: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 4 },
  salirTexto: { ...tipo.etiqueta, color: tema.titulo },
  cabecera: { gap: 4 },
  saludo: { fontSize: 15, lineHeight: 20, fontWeight: "500", color: tema.encabezado },
  centrado: { textAlign: "center" },
  filtros: { gap: 8, paddingVertical: 2 },
  filtroTodos: { borderWidth: 1, borderColor: marca.lila, paddingVertical: 6 },
  filtroActivo: { backgroundColor: marca.moradoOscuro, borderColor: marca.moradoOscuro },
  filtroTextoActivo: { color: marca.blanco },
  pedido: { width: "100%", gap: 8, padding: 14, borderRadius: radio.tarjeta, borderWidth: 1, borderColor: marca.lila, backgroundColor: marca.blanco },
  pedidoEncabezado: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 8 },
  pedidoIcono: { width: 40, height: 40, borderRadius: radio.campo, backgroundColor: marca.rosaPastel, alignItems: "center", justifyContent: "center" },
  pedidoNombre: { flex: 1, minWidth: 0, gap: 2 },
  codigo: { ...tipo.mini, color: tema.encabezado },
  prenda: { ...tipo.seccion, color: tema.titulo },
  detalleFila: { minHeight: 22, flexDirection: "row", alignItems: "center", gap: 8 },
  detalleTexto: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: tema.texto },
  botonDetalle: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  botonDetalleTexto: { flex: 1, ...tipo.etiqueta, color: tema.titulo },
  vacio: { alignItems: "center", gap: 6, padding: espacio.tarjeta, borderRadius: radio.tarjeta, borderWidth: 2, borderColor: marca.lila, borderStyle: "dashed", backgroundColor: marca.blanco },
  paginacion: { minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  botonPagina: { paddingVertical: 7 },
  botonDesactivado: { opacity: 0.5 },
  paginaEnlace: { ...tipo.etiqueta, color: tema.titulo },
  paginaInactiva: { fontWeight: "400", color: tema.texto },
  paginaTexto: { ...tipo.etiqueta, color: tema.titulo },
});
