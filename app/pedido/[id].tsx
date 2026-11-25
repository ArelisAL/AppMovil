import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";

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
    <ScrollView
      contentContainerStyle={[estilos.contenedor, { alignItems: "stretch" }]}
    >
      <Button
        title="Volver a Mis pedidos"
        color={tema.titulo}
        onPress={() => router.back()}
      />
      {cargando ? <Text style={estilos.texto}>Cargando detalle...</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={estilos.error}>
          {error}
        </Text>
      ) : null}
      {mensaje ? (
        <Text
          accessibilityRole="alert"
          style={[estilos.texto, { color: tema.titulo }]}
        >
          {mensaje}
        </Text>
      ) : null}
      {pedido ? (
        <View style={[estilos.tarjetaBlanca, { marginTop: 16 }]}>
          <Text style={estilos.titulo}>
            {pedido.codigo} - {pedido.prenda_nombre}
          </Text>
          <Text style={estilos.texto}>Cliente: {pedido.cliente_nombre}</Text>
          <Text style={estilos.texto}>
            Fecha de entrega: {pedido.fecha_entrega}
          </Text>
          <Text style={estilos.texto}>
            Estado: {pedido.estado.replace(/_/g, " ")}
          </Text>
          {pedido.estado !== "ENTREGADO" ? (
            <>
              {requiereConsumos ? (
                <Text style={estilos.texto}>
                  Recepción debe registrar los consumos antes de iniciar el
                  pedido.
                </Text>
              ) : null}
              <Button
                title={
                  actualizandoEstado
                    ? "Actualizando..."
                    : "Confirmar siguiente estado"
                }
                disabled={actualizandoEstado || requiereConsumos}
                color={marca.moradoOscuro}
                onPress={confirmarAvance}
              />
            </>
          ) : null}
          {pedido.descripcion ? (
            <Text style={estilos.texto}>Descripcion: {pedido.descripcion}</Text>
          ) : null}
          <Text
            style={[
              estilos.texto,
              { color: tema.titulo, fontWeight: "700", marginTop: 12 },
            ]}
          >
            Consumos de tela
          </Text>
          {consumos.length === 0 ? (
            <Text style={estilos.texto}>
              Recepción aún no ha registrado consumos.
            </Text>
          ) : (
            consumos.map((uso) => (
              <Text key={uso.id} style={estilos.texto}>
                {uso.tela_nombre} ({uso.tela_color}) · {uso.metros_usados} m
                {uso.registrado_por_nombre
                  ? ` · Capturó: ${uso.registrado_por_nombre}`
                  : ""}
                {uso.confirmado
                  ? " · Inventario descontado"
                  : uso.vigente
                    ? " · Pendiente de confirmación"
                    : " · Registro reemplazado"}
              </Text>
            ))
          )}
          <Text
            style={[
              estilos.texto,
              { color: tema.titulo, fontWeight: "700", marginTop: 12 },
            ]}
          >
            Medidas mas recientes
          </Text>
          {pedido.medidas_ultima_toma ? (
            <>
              <Text style={estilos.texto}>
                {pedido.medidas_ultima_toma.categoria} -{" "}
                {new Date(pedido.medidas_ultima_toma.fecha).toLocaleDateString(
                  "es-EC",
                )}
              </Text>
              {Object.entries(pedido.medidas_ultima_toma.valores_cm).map(
                ([codigo, valor]) => (
                  <Text key={codigo} style={estilos.texto}>
                    {codigo}: {valor} cm
                  </Text>
                ),
              )}
            </>
          ) : (
            <Text style={estilos.texto}>
              No hay medidas registradas para esta prenda.
            </Text>
          )}
          {pedido.nota_interna ? (
            <>
              <Text
                style={[
                  estilos.texto,
                  { color: tema.titulo, fontWeight: "700", marginTop: 12 },
                ]}
              >
                Nota interna
              </Text>
              <Text style={estilos.texto}>{pedido.nota_interna}</Text>
            </>
          ) : null}
          <Text
            style={[
              estilos.texto,
              { color: tema.titulo, fontWeight: "700", marginTop: 12 },
            ]}
          >
            Historial de estados
          </Text>
          {historial.map((cambio) => (
            <Text key={cambio.id} style={estilos.texto}>
              {cambio.estado_anterior.replace(/_/g, " ")} {"→"}{" "}
              {cambio.estado_nuevo.replace(/_/g, " ")} -{" "}
              {new Date(cambio.fecha_hora).toLocaleString("es-EC")}
            </Text>
          ))}
          <Text
            style={[
              estilos.texto,
              { color: tema.titulo, fontWeight: "700", marginTop: 16 },
            ]}
          >
            Registrar nueva toma
          </Text>
          {categorias.map((item) => (
            <Button
              key={item.id}
              title={item.nombre}
              color={tema.titulo}
              onPress={() => void seleccionarCategoria(item.codigo)}
            />
          ))}
          {categoria !== "BEBE" ? (
            <>
              <Text style={[estilos.texto, { marginTop: 8 }]}>Prenda</Text>
              {prendas.map((item) => (
                <Button
                  key={item.id}
                  title={`${item.nombre}${prenda === item.id ? " (seleccionada)" : ""}`}
                  color={tema.titulo}
                  onPress={() => void seleccionarPrenda(item)}
                />
              ))}
            </>
          ) : null}
          {campos.map((campo) => (
            <View key={campo.codigo} style={{ marginTop: 10 }}>
              <Text style={estilos.texto}>
                {campo.nombre}
                {campo.opcional ? " (opcional)" : ""} - cm
              </Text>
              <Text style={[estilos.texto, { fontSize: 13 }]}>
                {campo.como_se_toma}
              </Text>
              <TextInput
                accessibilityLabel={`Medida ${campo.nombre} en centimetros`}
                keyboardType="decimal-pad"
                style={estilos.input}
                value={valores[campo.codigo] ?? ""}
                onChangeText={(valor) =>
                  setValores((actual) => ({
                    ...actual,
                    [campo.codigo]: valor.replace(/,/g, "."),
                  }))
                }
                placeholder="Ejemplo: 86.5"
              />
            </View>
          ))}
          {campos.length > 0 ? (
            <Button
              title={guardandoMedidas ? "Guardando..." : "Guardar medidas"}
              disabled={guardandoMedidas}
              color={marca.moradoOscuro}
              onPress={() => void guardarToma()}
            />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
