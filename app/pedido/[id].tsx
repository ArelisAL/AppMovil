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
import { espacio, marca, radio, sombraTarjeta, tema, tipo } from "../../src/theme/marca";
import { BotonMarca, CampoMarca, ChipMarca, EstadoPedido, EtiquetaSeccion, IconoCostura } from "../../src/components/Marca";
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
    // La costurera avanza hasta TERMINADO; la entrega la registra recepción (C2).
    if (!pedido || pedido.estado === "ENTREGADO" || pedido.estado === "TERMINADO" || actualizandoEstado) return;
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
    <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={pantalla.volver}>
        <IconoCostura nombre="flecha" size={18} color={tema.titulo} /><Text style={pantalla.volverTexto}>Mis pedidos</Text>
      </Pressable>
      {cargando ? <Text style={estilos.texto}>Cargando detalle…</Text> : null}
      {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}
      {mensaje ? <Text accessibilityRole="alert" style={pantalla.mensaje}>{mensaje}</Text> : null}

      {pedido ? (
        <>
          <View style={[estilos.tarjetaBlanca, pantalla.tarjeta]}>
            <View style={pantalla.codigoFila}>
              <Text style={pantalla.codigo}>PEDIDO {pedido.codigo}</Text>
              <EstadoPedido estado={pedido.estado} />
            </View>
            <Text style={estilos.titulo}>{pedido.prenda_nombre}</Text>
            <View style={pantalla.dato}><IconoCostura nombre="persona" size={16} color={tema.titulo} /><Text style={pantalla.datoTexto}>{pedido.cliente_nombre}</Text></View>
            <View style={pantalla.dato}><IconoCostura nombre="calendario" size={16} color={tema.titulo} /><Text style={pantalla.datoTexto}>Entrega {pedido.fecha_entrega}</Text></View>
          </View>

          {pedido.descripcion ? <View style={[estilos.tarjetaBlanca, pantalla.tarjeta]}><EtiquetaSeccion icono="aguja">Indicaciones del trabajo</EtiquetaSeccion><Text style={estilos.texto}>{pedido.descripcion}</Text></View> : null}

          <View style={[estilos.tarjetaBlanca, pantalla.tarjeta]}>
            <EtiquetaSeccion icono="carrete">Consumos de tela</EtiquetaSeccion>
            {consumos.length === 0 ? <Text style={estilos.texto}>Recepción aún no ha registrado consumos.</Text> : consumos.map((uso, indice) => (
              <View key={uso.id} style={[pantalla.registro, indice > 0 && pantalla.registroSeparado]}>
                <Text style={pantalla.registroTitulo}>{uso.tela_nombre} · {uso.tela_color}</Text>
                <View style={pantalla.metrosFila}>
                  <Text style={pantalla.metros}>{uso.metros_usados} m</Text>
                  <ChipMarca fondo={uso.confirmado ? marca.verdeMenta : uso.vigente ? marca.amarilloSuave : marca.blancoLavanda}>{uso.confirmado ? "Inventario descontado" : uso.vigente ? "Pendiente de confirmación" : "Registro reemplazado"}</ChipMarca>
                </View>
                {uso.registrado_por_nombre ? <Text style={estilos.nota}>Capturó {uso.registrado_por_nombre}</Text> : null}
              </View>
            ))}
          </View>

          {pedido.estado !== "ENTREGADO" && pedido.estado !== "TERMINADO" ? (
            <>
              <BotonMarca onPress={confirmarAvance} cargando={actualizandoEstado} disabled={requiereConsumos} accessibilityLabel="Confirmar siguiente estado">Confirmar siguiente estado</BotonMarca>
              {requiereConsumos ? <Text style={estilos.nota}>Recepción debe registrar los consumos antes de iniciar el pedido.</Text> : null}
            </>
          ) : null}

          <View style={[estilos.tarjetaBlanca, pantalla.tarjeta]}>
            <EtiquetaSeccion icono="aguja">Medidas más recientes</EtiquetaSeccion>
            {pedido.medidas_ultima_toma ? <>
              <Text style={estilos.nota}>{pedido.medidas_ultima_toma.categoria} · {new Date(pedido.medidas_ultima_toma.fecha).toLocaleDateString("es-EC")}</Text>
              <View style={pantalla.medidasGrid}>{Object.entries(pedido.medidas_ultima_toma.valores_cm).map(([codigo, valor]) => <View key={codigo} style={pantalla.medida}><Text style={pantalla.medidaNombre}>{codigo.replace(/_/g, " ")}</Text><Text style={pantalla.medidaValor}>{valor} cm</Text></View>)}</View>
            </> : <Text style={estilos.texto}>No hay medidas registradas para esta prenda.</Text>}
          </View>

          {pedido.nota_interna ? <View style={[estilos.tarjetaBlanca, pantalla.tarjeta]}><EtiquetaSeccion icono="aguja">Nota interna</EtiquetaSeccion><Text style={estilos.texto}>{pedido.nota_interna}</Text></View> : null}

          <View style={[estilos.tarjetaBlanca, pantalla.tarjeta]}>
            <EtiquetaSeccion icono="calendario">Historial del pedido</EtiquetaSeccion>
            {historial.length === 0 ? <Text style={estilos.texto}>Aún no hay cambios de estado.</Text> : historial.map((cambio, indice) => (
              <View key={cambio.id} style={pantalla.historialFila}>
                <View style={[pantalla.puntoHistorial, indice === 0 && pantalla.puntoActual]} />
                <View style={pantalla.historialTexto}><Text style={pantalla.registroTitulo}>{cambio.estado_anterior.replace(/_/g, " ")} → {cambio.estado_nuevo.replace(/_/g, " ")}</Text><Text style={estilos.nota}>{new Date(cambio.fecha_hora).toLocaleString("es-EC")}</Text></View>
              </View>
            ))}
          </View>

          <View style={[estilos.tarjetaBlanca, pantalla.tarjeta]}>
            <Text style={pantalla.codigo}>PEDIDO {pedido.codigo} · {pedido.prenda_nombre}</Text>
            <Text style={estilos.titulo}>Registrar nueva toma</Text>
            <Text style={estilos.texto}>Elige la categoría y prenda. Las medidas se guardan en centímetros.</Text>
            <Text style={estilos.etiqueta}>Categoría</Text>
            <View style={pantalla.opciones}>{categorias.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: categoria === item.codigo }} onPress={() => void seleccionarCategoria(item.codigo)} style={[estilos.chip, pantalla.opcion, categoria === item.codigo && pantalla.categoriaActiva]}><Text style={estilos.chipTexto}>{item.nombre}</Text></Pressable>)}</View>
            {categoria !== "BEBE" ? <>
              <Text style={estilos.etiqueta}>Prenda</Text>
              <View style={pantalla.opciones}>{prendas.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: prenda === item.id }} onPress={() => void seleccionarPrenda(item)} style={[estilos.chip, pantalla.opcion, prenda === item.id && pantalla.prendaActiva]}><Text style={estilos.chipTexto}>{item.nombre}</Text></Pressable>)}</View>
            </> : null}
          </View>

          {campos.length > 0 ? (
            <View style={[estilos.tarjetaBlanca, pantalla.formularioMedidas]}>
              {campos.map((campo) => <CampoMarca key={campo.codigo} etiqueta={`${campo.nombre}${campo.opcional ? " (opcional)" : ""} · cm`} ayuda={campo.como_se_toma} icono="aguja" accessibilityLabel={`Medida ${campo.nombre} en centimetros`} keyboardType="decimal-pad" value={valores[campo.codigo] ?? ""} onChangeText={(valor) => setValores((actual) => ({ ...actual, [campo.codigo]: valor.replace(/,/g, ".") }))} placeholder="Ejemplo: 86.5" />)}
              <BotonMarca onPress={() => void guardarToma()} cargando={guardandoMedidas} accessibilityLabel="Guardar medidas">Guardar medidas</BotonMarca>
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const pantalla = StyleSheet.create({
  volver: { minHeight: 32, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6 },
  volverTexto: { ...tipo.cuerpo, fontWeight: "700", color: tema.titulo },
  mensaje: { ...tipo.cuerpo, color: tema.exito, padding: 12, borderRadius: radio.campo, backgroundColor: marca.verdeMenta },
  tarjeta: { gap: 10 },
  codigoFila: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  codigo: { flex: 1, ...tipo.mini, color: tema.encabezado },
  dato: { minHeight: 22, flexDirection: "row", alignItems: "center", gap: 8 },
  datoTexto: { flexShrink: 1, ...tipo.cuerpo, color: tema.texto },
  registro: { gap: 6 },
  registroSeparado: { borderTopWidth: 1, borderTopColor: marca.blancoLavanda, paddingTop: 10 },
  registroTitulo: { ...tipo.cuerpo, fontWeight: "700", color: tema.texto },
  metrosFila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  metros: { fontSize: 22, lineHeight: 28, fontWeight: "700", color: tema.texto },
  medidasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  medida: { width: "48%", minWidth: 122, flexGrow: 1, padding: 11, borderRadius: radio.campo, backgroundColor: marca.blancoLavanda },
  medidaNombre: { fontSize: 11, lineHeight: 16, color: tema.texto },
  medidaValor: { ...tipo.cuerpo, fontWeight: "700", color: tema.titulo, marginTop: 3 },
  historialFila: { minHeight: 44, flexDirection: "row", alignItems: "flex-start", gap: 11 },
  puntoHistorial: { width: 12, height: 12, borderRadius: 6, backgroundColor: marca.lila, marginTop: 4, borderWidth: 2, borderColor: marca.blanco },
  puntoActual: { backgroundColor: marca.morado },
  historialTexto: { flex: 1 },
  opciones: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  opcion: { backgroundColor: marca.blanco, borderWidth: 1, borderColor: marca.lila, paddingVertical: 6 },
  categoriaActiva: { backgroundColor: marca.lila },
  prendaActiva: { backgroundColor: marca.rosaPastel, borderColor: marca.rosaPastel },
  formularioMedidas: { gap: espacio.bloque, ...sombraTarjeta },
});
