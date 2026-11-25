import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
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
import { marca, tema } from "../src/theme/marca";

const ESTADOS = ["Todos", "PENDIENTE", "EN_PROCESO", "TERMINADO", "ENTREGADO"];

function etiquetaEstado(estado: string) {
  return estado.replace(/_/g, " ");
}

function colorEstado(estado: string) {
  if (estado === "PENDIENTE") return marca.amarilloSuave;
  if (estado === "EN_PROCESO") return marca.celestePastel;
  if (estado === "TERMINADO") return marca.verdeMenta;
  return marca.lila;
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
    <ScrollView contentContainerStyle={styles.contenido}>
      <View style={styles.cabecera}>
        <Image
          source={require("../assets/logo-fran-costuras.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Fran-Costuras — Diseña, Cose, Crea"
        />
        <Text style={styles.saludo}>Hola, {usuario?.nombre || usuario?.email || "costurera"}</Text>
        <Text style={styles.intro}>Tus pedidos y fechas de entrega, siempre a mano.</Text>
      </View>

      <View style={styles.tituloFila}>
        <View>
          <Text style={estilos.titulo}>Mis pedidos</Text>
          <Text style={styles.subtitulo}>{total} asignado{total === 1 ? "" : "s"}</Text>
        </View>
        <Text style={styles.iconoCostura} accessibilityElementsHidden>✂︎</Text>
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
              style={[styles.filtro, activo && styles.filtroActivo]}
            >
              <Text style={[styles.filtroTexto, activo && styles.filtroTextoActivo]}>{opcion === "Todos" ? "Todos" : etiquetaEstado(opcion)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}
      {cargando ? <Text style={estilos.texto}>Cargando pedidos…</Text> : null}
      {!cargando && pedidos.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioIcono} accessibilityElementsHidden>✧</Text>
          <Text style={styles.vacioTitulo}>Todo listo por aquí</Text>
          <Text style={styles.vacioTexto}>No tienes pedidos en este estado. Cuando te asignen uno, aparecerá en esta lista.</Text>
        </View>
      ) : null}

      {pedidos.map((pedido) => (
        <View key={pedido.id} style={styles.pedido}>
          <View style={styles.pedidoEncabezado}>
            <View style={styles.pedidoIcono}><Text style={styles.iconoCostura} accessibilityElementsHidden>✂︎</Text></View>
            <View style={styles.pedidoNombre}>
              <Text style={styles.codigo}>{pedido.codigo}</Text>
              <Text style={styles.prenda}>{pedido.prenda_nombre}</Text>
            </View>
            <View style={[styles.estadoPill, { backgroundColor: colorEstado(pedido.estado) }]}>
              <Text style={styles.estadoTexto}>{etiquetaEstado(pedido.estado)}</Text>
            </View>
          </View>
          <View style={styles.detalleFila}>
            <Text style={styles.detalleIcono}>◉</Text>
            <Text style={styles.detalleTexto}>{pedido.cliente_nombre}</Text>
          </View>
          <View style={styles.detalleFila}>
            <Text style={styles.detalleIcono}>◷</Text>
            <Text style={styles.detalleTexto}>Entrega: {pedido.fecha_entrega}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver detalle y medidas"
            style={styles.botonDetalle}
            onPress={() => router.push({ pathname: "/pedido/[id]", params: { id: pedido.codigo } })}
          >
            <Text style={styles.botonDetalleTexto}>Ver detalle y medidas</Text>
            <Text style={styles.botonFlecha} accessibilityElementsHidden>→</Text>
          </Pressable>
        </View>
      ))}

      {!cargando && total > 0 ? (
        <View style={styles.paginacion}>
          <Pressable accessibilityRole="button" accessibilityLabel="Anterior" disabled={pagina <= 1} onPress={() => { setPagina((actual) => actual - 1); setCargando(true); }} style={[styles.botonPagina, pagina <= 1 && styles.botonDesactivado]}>
            <Text style={styles.botonPaginaTexto}>‹ Anterior</Text>
          </Pressable>
          <Text style={styles.paginaTexto}>{pagina} / {paginasTotales}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Siguiente" disabled={pagina >= paginasTotales} onPress={() => { setPagina((actual) => actual + 1); setCargando(true); }} style={[styles.botonPagina, pagina >= paginasTotales && styles.botonDesactivado]}>
            <Text style={styles.botonPaginaTexto}>Siguiente ›</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => void cerrarSesion().finally(() => router.replace("/login"))} accessibilityLabel="Salir de la sesión" style={styles.salir}>
        <Text style={styles.salirTexto}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30, backgroundColor: tema.fondo },
  cabecera: { alignItems: "center", padding: 18, borderRadius: 22, backgroundColor: marca.blanco, borderWidth: 1, borderColor: marca.lila, marginBottom: 22 },
  logo: { width: 150, height: 100, marginBottom: 2 },
  saludo: { color: tema.titulo, fontSize: 20, fontWeight: "800", textAlign: "center" },
  intro: { color: tema.texto, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 5 },
  tituloFila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  subtitulo: { color: tema.texto, fontSize: 13, marginTop: -9, marginBottom: 12 },
  iconoCostura: { color: tema.encabezado, fontSize: 27 },
  filtros: { gap: 8, paddingVertical: 2, paddingBottom: 15 },
  filtro: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: marca.lila, backgroundColor: marca.blanco },
  filtroActivo: { backgroundColor: marca.moradoOscuro, borderColor: marca.moradoOscuro },
  filtroTexto: { color: tema.texto, fontSize: 12, fontWeight: "700" },
  filtroTextoActivo: { color: "#FFFFFF" },
  pedido: { width: "100%", marginBottom: 13, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: marca.lila, backgroundColor: marca.blanco, shadowColor: marca.moradoOscuro, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  pedidoEncabezado: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: marca.blancoLavanda, marginBottom: 10 },
  pedidoIcono: { width: 42, height: 42, borderRadius: 14, backgroundColor: marca.rosaPastel, alignItems: "center", justifyContent: "center" },
  pedidoNombre: { flex: 1, minWidth: 0 },
  codigo: { color: tema.encabezado, fontSize: 12, fontWeight: "700" },
  prenda: { color: tema.titulo, fontSize: 16, fontWeight: "800", marginTop: 2 },
  estadoPill: { maxWidth: 112, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  estadoTexto: { color: tema.texto, fontSize: 10, fontWeight: "800", textAlign: "center" },
  detalleFila: { flexDirection: "row", alignItems: "center", gap: 9, marginVertical: 5 },
  detalleIcono: { width: 18, color: tema.encabezado, fontSize: 16, textAlign: "center" },
  detalleTexto: { color: tema.texto, fontSize: 14, flexShrink: 1 },
  botonDetalle: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: marca.azulCeleste },
  botonDetalleTexto: { color: tema.texto, fontSize: 14, fontWeight: "800" },
  botonFlecha: { color: tema.titulo, fontSize: 18, fontWeight: "800" },
  vacio: { alignItems: "center", padding: 24, borderRadius: 18, borderWidth: 1, borderColor: marca.lila, borderStyle: "dashed", backgroundColor: marca.blanco },
  vacioIcono: { fontSize: 32, color: tema.encabezado, marginBottom: 7 },
  vacioTitulo: { color: tema.titulo, fontSize: 17, fontWeight: "800", textAlign: "center" },
  vacioTexto: { maxWidth: 300, color: tema.texto, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  paginacion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, marginVertical: 12 },
  botonPagina: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, backgroundColor: marca.celestePastel },
  botonDesactivado: { opacity: 0.45 },
  botonPaginaTexto: { color: tema.texto, fontSize: 12, fontWeight: "700" },
  paginaTexto: { color: tema.texto, fontSize: 12, fontWeight: "700" },
  salir: { alignItems: "center", marginTop: 8, padding: 12 },
  salirTexto: { color: tema.titulo, fontSize: 14, fontWeight: "700" },
});
