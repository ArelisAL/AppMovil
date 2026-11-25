import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import apiAuth, { esCosturera, mensajeDeError } from "../../src/api/auth";
import { registrarMedidas } from "../../src/api/clientes";
import {
  listarCategorias,
  listarMedidasPrenda,
  listarPrendas,
  type Categoria,
  type Prenda,
  type TipoMedida,
} from "../../src/api/catalogo";
import {
  cambiarEstado,
  listarConsumos,
  listarHistorial,
  obtenerPedido,
  type HistorialMovil,
  type PedidoMovil,
  type UsoTelaMovil,
} from "../../src/api/pedidos";
import { estilos } from "../../src/theme/estilos";
import { marca, tema } from "../../src/theme/marca";
import { BotonMarca, CampoMarca, EtiquetaSeccion, IconoCostura } from "../../src/components/Marca";
import {
  cerrarSesion,
  inactividadExpirada,
  leerTokens,
} from "../../src/auth/sesion";

type Campo = TipoMedida & { opcional?: boolean };

export default function DetallePedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoMovil | null>(null);
  const [historial, setHistorial] = useState<HistorialMovil[]>([]);
  const [consumos, setConsumos] = useState<UsoTelaMovil[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [categoria, setCategoria] = useState("");
  const [prenda, setPrenda] = useState<number | null>(null);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardandoMedidas, setGuardandoMedidas] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const requiereConsumos =
    pedido?.estado === "PENDIENTE" &&
    !consumos.some((uso) => uso.vigente && !uso.confirmado);

  useEffect(() => {
    const cargar = async () => {
      try {
        if (await inactividadExpirada()) {
          await cerrarSesion();
          router.replace("/login");
          return;
        }
        const tokens = await leerTokens();
        if (!tokens.acceso || !tokens.refresco) {
          router.replace("/login");
          return;
        }
        const usuario = await apiAuth.yo();
        if (!esCosturera(usuario)) {
          await cerrarSesion();
          router.replace("/login");
          return;
        }
        if (usuario["debe_cambiar_contrase\u00f1a"]) {
          router.replace("/cambiar-contrasena");
          return;
        }
        const [actual, listaCategorias] = await Promise.all([
          obtenerPedido(String(id)),
          listarCategorias(),
        ]);
        const [estados, usos] = await Promise.all([
          listarHistorial(actual.codigo),
          listarConsumos(actual.codigo),
        ]);
        setPedido(actual);
        setHistorial(estados);
        setConsumos(usos);
        setCategorias(listaCategorias);
        setCategoria(actual.categoria_codigo);
        setPrenda(actual.prenda);
        const categoriaPedido = listaCategorias.find(
          (item) => item.codigo === actual.categoria_codigo,
        );
        if (actual.categoria_codigo === "BEBE" && categoriaPedido) {
          setCampos(categoriaPedido.tipos_medida);
        } else {
          setPrendas(await listarPrendas(actual.categoria_codigo));
          setCampos(await listarMedidasPrenda(actual.prenda));
        }
        setError(null);
      } catch (e) {
        const codigo = (e as { response?: { status?: number } })?.response
          ?.status;
        if (codigo === 401) {
          await cerrarSesion();
          router.replace("/login");
        } else if (codigo === 403) {
          setError("No tienes permiso para ver este pedido.");
        } else {
          setError(`No se pudo cargar el pedido. ${mensajeDeError(e)}`);
        }
      } finally {
        setCargando(false);
      }
    };
    void cargar();
  }, [id]);

  async function seleccionarCategoria(codigo: string) {
    setCategoria(codigo);
    setPrenda(null);
    setValores({});
    setError(null);
    const seleccionada = categorias.find((item) => item.codigo === codigo);
    if (codigo === "BEBE" && seleccionada) {
      setPrendas([]);
      setCampos(seleccionada.tipos_medida);
      return;
    }
    setCampos([]);
    try {
      setPrendas(await listarPrendas(codigo));
    } catch (e) {
      setError(`No se pudo cargar el catalogo. ${mensajeDeError(e)}`);
    }
  }

  async function seleccionarPrenda(item: Prenda) {
    setPrenda(item.id);
    setError(null);
    try {
      const requeridas = await listarMedidasPrenda(item.id);
      setCampos(requeridas);
      setValores({});
    } catch (e) {
      setError(`No se pudieron cargar las medidas. ${mensajeDeError(e)}`);
    }
  }

  function confirmarAvance() {
    if (!pedido || pedido.estado === "ENTREGADO" || actualizandoEstado) return;
    if (
      pedido.estado === "PENDIENTE" &&
      !consumos.some((uso) => uso.vigente && !uso.confirmado)
    ) {
      setError(
        "Recepción debe registrar los consumos antes de iniciar el pedido.",
      );
      return;
    }
    Alert.alert(
      "Avanzar pedido",
      `Confirmas pasar ${pedido.codigo} al siguiente estado?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            void (async () => {
              setActualizandoEstado(true);
              try {
                await cambiarEstado(pedido.codigo);
                const [actualizado, estados, usos] = await Promise.all([
                  obtenerPedido(pedido.codigo),
                  listarHistorial(pedido.codigo),
                  listarConsumos(pedido.codigo),
                ]);
                setPedido(actualizado);
                setHistorial(estados);
                setConsumos(usos);
                setError(null);
              } catch (e) {
                setError(
                  `No se pudo actualizar el pedido. ${mensajeDeError(e)}`,
                );
              } finally {
                setActualizandoEstado(false);
              }
            })();
          },
        },
      ],
    );
  }

  async function guardarToma() {
    if (!pedido) return;
    const faltantes = campos.filter(
      (campo) =>
        !("opcional" in campo && campo.opcional) &&
        !valores[campo.codigo]?.trim(),
    );
    if (faltantes.length) {
      setError("Completa todas las medidas obligatorias.");
      return;
    }
    const cuerpo: Record<string, number> = {};
    for (const campo of campos) {
      const texto = valores[campo.codigo]?.trim();
      if (!texto) continue;
      const numero = Number(texto);
      if (!Number.isFinite(numero) || numero <= 0 || (numero * 10) % 1 !== 0) {
        setError(
          `La medida ${campo.nombre} debe ser mayor que cero y tener hasta un decimal.`,
        );
        return;
      }
      cuerpo[campo.codigo] = numero;
    }
    setGuardandoMedidas(true);
    setError(null);
    setMensaje(null);
    try {
      await registrarMedidas(pedido.cliente, categoria, prenda, cuerpo);
      setPedido(await obtenerPedido(pedido.codigo));
      setValores({});
      setMensaje("Toma de medidas guardada.");
    } catch (e) {
      setError(`No se pudieron guardar las medidas. ${mensajeDeError(e)}`);
    } finally {
      setGuardandoMedidas(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={pantalla.contenido} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={pantalla.volver}>
        <IconoCostura nombre="flecha" size={22} /><Text style={pantalla.volverTexto}>Mis pedidos</Text>
      </Pressable>
      {cargando ? <Text style={estilos.texto}>Cargando detalle…</Text> : null}
      {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}
      {mensaje ? <Text accessibilityRole="alert" style={pantalla.mensaje}>{mensaje}</Text> : null}

      {pedido ? (
        <>
          <View style={pantalla.resumen}>
            <View style={pantalla.resumenIcono}><IconoCostura nombre="prenda" size={28} color={tema.titulo} /></View>
            <Text style={pantalla.codigo}>PEDIDO {pedido.codigo}</Text>
            <Text style={pantalla.nombrePrenda}>{pedido.prenda_nombre}</Text>
            <View style={pantalla.resumenLinea}>
              <View style={[pantalla.estadoPill, { backgroundColor: colorEstado(pedido.estado) }]}><Text style={pantalla.estadoTexto}>{pedido.estado.replace(/_/g, " ")}</Text></View>
            </View>
            <View style={pantalla.datosResumen}>
              <View style={pantalla.dato}><IconoCostura nombre="persona" size={15} /><Text style={pantalla.datoTexto}>{pedido.cliente_nombre}</Text></View>
              <View style={pantalla.dato}><IconoCostura nombre="calendario" size={15} /><Text style={pantalla.datoTexto}>Entrega {pedido.fecha_entrega}</Text></View>
            </View>
            {pedido.estado !== "ENTREGADO" ? (
              <>
                {requiereConsumos ? <Text style={pantalla.ayudaEstado}>Recepción debe registrar los consumos antes de iniciar el pedido.</Text> : null}
                <BotonMarca onPress={confirmarAvance} cargando={actualizandoEstado} disabled={requiereConsumos} accessibilityLabel="Confirmar siguiente estado" style={pantalla.botonAvance}>Confirmar siguiente estado</BotonMarca>
              </>
            ) : null}
          </View>

          {pedido.descripcion ? <View style={pantalla.tarjeta}><EtiquetaSeccion icono="aguja">Indicaciones del trabajo</EtiquetaSeccion><Text style={pantalla.cuerpo}>{pedido.descripcion}</Text></View> : null}

          <View style={pantalla.tarjeta}>
            <EtiquetaSeccion icono="hilo">Consumos de tela</EtiquetaSeccion>
            {consumos.length === 0 ? <Text style={pantalla.vacioTexto}>Recepción aún no ha registrado consumos.</Text> : consumos.map((uso) => (
              <View key={uso.id} style={pantalla.registro}>
                <View style={pantalla.registroIcono}><IconoCostura nombre="hilo" size={18} /></View>
                <View style={pantalla.registroTexto}><Text style={pantalla.registroTitulo}>{uso.tela_nombre} · {uso.tela_color}</Text><Text style={pantalla.cuerpo}>{uso.metros_usados} m{uso.registrado_por_nombre ? ` · Capturó ${uso.registrado_por_nombre}` : ""}</Text><Text style={pantalla.meta}>{uso.confirmado ? "Inventario descontado" : uso.vigente ? "Pendiente de confirmación" : "Registro reemplazado"}</Text></View>
              </View>
            ))}
          </View>

          <View style={pantalla.tarjeta}>
            <EtiquetaSeccion icono="persona">Medidas más recientes</EtiquetaSeccion>
            {pedido.medidas_ultima_toma ? <>
              <Text style={pantalla.meta}>{pedido.medidas_ultima_toma.categoria} · {new Date(pedido.medidas_ultima_toma.fecha).toLocaleDateString("es-EC")}</Text>
              <View style={pantalla.medidasGrid}>{Object.entries(pedido.medidas_ultima_toma.valores_cm).map(([codigo, valor]) => <View key={codigo} style={pantalla.medida}><Text style={pantalla.medidaNombre}>{codigo.replace(/_/g, " ")}</Text><Text style={pantalla.medidaValor}>{valor} cm</Text></View>)}</View>
            </> : <Text style={pantalla.vacioTexto}>No hay medidas registradas para esta prenda.</Text>}
          </View>

          {pedido.nota_interna ? <View style={pantalla.tarjeta}><EtiquetaSeccion icono="aguja">Nota interna</EtiquetaSeccion><Text style={pantalla.cuerpo}>{pedido.nota_interna}</Text></View> : null}

          <View style={pantalla.tarjeta}>
            <EtiquetaSeccion icono="calendario">Historial del pedido</EtiquetaSeccion>
            {historial.length === 0 ? <Text style={pantalla.vacioTexto}>Aún no hay cambios de estado.</Text> : historial.map((cambio, indice) => (
              <View key={cambio.id} style={pantalla.historialFila}>
                <View style={[pantalla.puntoHistorial, indice === 0 && pantalla.puntoActual]} />
                <View style={pantalla.historialTexto}><Text style={pantalla.registroTitulo}>{cambio.estado_anterior.replace(/_/g, " ")} → {cambio.estado_nuevo.replace(/_/g, " ")}</Text><Text style={pantalla.meta}>{new Date(cambio.fecha_hora).toLocaleString("es-EC")}</Text></View>
              </View>
            ))}
          </View>

          <View style={pantalla.tarjeta}>
            <EtiquetaSeccion icono="aguja">Registrar nueva toma</EtiquetaSeccion>
            <Text style={pantalla.cuerpo}>Elige la categoría y prenda. Las medidas se guardan en centímetros.</Text>
            <Text style={pantalla.etiqueta}>Categoría</Text>
            <View style={pantalla.opciones}>{categorias.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: categoria === item.codigo }} onPress={() => void seleccionarCategoria(item.codigo)} style={[pantalla.opcion, categoria === item.codigo && pantalla.opcionActiva]}><Text style={[pantalla.opcionTexto, categoria === item.codigo && pantalla.opcionTextoActiva]}>{item.nombre}</Text></Pressable>)}</View>
            {categoria !== "BEBE" ? <>
              <Text style={pantalla.etiqueta}>Prenda</Text>
              <View style={pantalla.opciones}>{prendas.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: prenda === item.id }} onPress={() => void seleccionarPrenda(item)} style={[pantalla.opcion, prenda === item.id && pantalla.opcionActiva]}><Text style={[pantalla.opcionTexto, prenda === item.id && pantalla.opcionTextoActiva]}>{item.nombre}</Text></Pressable>)}</View>
            </> : null}
            {campos.map((campo) => <View key={campo.codigo} style={pantalla.campoMedida}><Text style={pantalla.etiqueta}>{campo.nombre}{campo.opcional ? " (opcional)" : ""} · cm</Text><Text style={pantalla.instruccion}>{campo.como_se_toma}</Text><CampoMarca accessibilityLabel={`Medida ${campo.nombre} en centimetros`} keyboardType="decimal-pad" value={valores[campo.codigo] ?? ""} onChangeText={(valor) => setValores((actual) => ({ ...actual, [campo.codigo]: valor.replace(/,/g, ".") }))} placeholder="Ejemplo: 86.5" />
            </View>)}
            {campos.length > 0 ? <BotonMarca onPress={() => void guardarToma()} cargando={guardandoMedidas} accessibilityLabel="Guardar medidas" style={pantalla.botonGuardar}>Guardar medidas</BotonMarca> : null}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function colorEstado(estado: string): string {
  if (estado === "PENDIENTE") return marca.amarilloSuave;
  if (estado === "EN_PROCESO") return marca.celestePastel;
  if (estado === "TERMINADO") return marca.verdeMenta;
  return marca.lila;
}

const pantalla = StyleSheet.create({
  contenido: { flexGrow: 1, backgroundColor: tema.fondo, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 12 },
  volver: { minHeight: 42, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 5 },
  volverTexto: { color: tema.titulo, fontSize: 14, fontWeight: "800" },
  resumen: { alignItems: "center", padding: 20, borderRadius: 22, borderWidth: 1, borderColor: marca.lila, backgroundColor: marca.blanco, marginBottom: 2 },
  resumenIcono: { width: 56, height: 56, borderRadius: 18, backgroundColor: marca.rosaPastel, alignItems: "center", justifyContent: "center", marginBottom: 11 },
  codigo: { color: tema.encabezado, fontSize: 12, fontWeight: "800", letterSpacing: 0.7 },
  nombrePrenda: { color: tema.titulo, fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 3 },
  resumenLinea: { marginTop: 10 },
  estadoPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  estadoTexto: { color: tema.texto, fontSize: 11, fontWeight: "800" },
  datosResumen: { width: "100%", borderTopWidth: 1, borderTopColor: marca.blancoLavanda, marginTop: 16, paddingTop: 12, gap: 8 },
  dato: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  datoTexto: { flexShrink: 1, color: tema.texto, fontSize: 13 },
  ayudaEstado: { color: tema.texto, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 14, marginBottom: 5, padding: 11, backgroundColor: marca.amarilloSuave, borderRadius: 12 },
  botonAvance: { width: "100%", marginTop: 14 },
  mensaje: { color: tema.exito, fontSize: 14, padding: 12, borderRadius: 12, backgroundColor: marca.verdeMenta },
  tarjeta: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: marca.lila, backgroundColor: marca.blanco },
  cuerpo: { color: tema.texto, fontSize: 14, lineHeight: 20 },
  vacioTexto: { color: tema.texto, fontSize: 13, lineHeight: 19 },
  registro: { flexDirection: "row", gap: 11, paddingVertical: 11, borderTopWidth: 1, borderTopColor: marca.blancoLavanda },
  registroIcono: { width: 38, height: 38, borderRadius: 13, backgroundColor: marca.celestePastel, alignItems: "center", justifyContent: "center" },
  registroTexto: { flex: 1, minWidth: 0 },
  registroTitulo: { color: tema.titulo, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  meta: { color: tema.texto, opacity: 0.82, fontSize: 12, lineHeight: 18, marginTop: 3 },
  medidasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 },
  medida: { width: "48%", minWidth: 122, flexGrow: 1, padding: 11, borderRadius: 12, backgroundColor: marca.blancoLavanda },
  medidaNombre: { color: tema.texto, fontSize: 11, lineHeight: 16 },
  medidaValor: { color: tema.titulo, fontSize: 14, fontWeight: "800", marginTop: 3 },
  historialFila: { minHeight: 52, flexDirection: "row", alignItems: "flex-start", gap: 11, paddingVertical: 8 },
  puntoHistorial: { width: 12, height: 12, borderRadius: 6, backgroundColor: marca.lila, marginTop: 3, borderWidth: 2, borderColor: marca.blanco },
  puntoActual: { backgroundColor: marca.morado },
  historialTexto: { flex: 1 },
  etiqueta: { color: tema.texto, fontSize: 13, fontWeight: "800", marginTop: 13, marginBottom: 7 },
  opciones: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opcion: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: marca.lila, borderRadius: 100, backgroundColor: marca.blancoLavanda },
  opcionActiva: { borderColor: marca.moradoOscuro, backgroundColor: marca.moradoOscuro },
  opcionTexto: { color: tema.texto, fontSize: 12, fontWeight: "700" },
  opcionTextoActiva: { color: marca.blanco },
  campoMedida: { marginTop: 6 },
  instruccion: { color: tema.texto, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  botonGuardar: { marginTop: 4 },
});
