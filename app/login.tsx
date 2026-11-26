import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { BotonMarca, CampoMarca, ChipMarca, IconoCostura } from "../src/components/Marca";
import apiAuth, { esCosturera, mensajeDeError } from "../src/api/auth";
import { cerrarSesion, guardarTokens, leerTokens, marcarUso } from "../src/auth/sesion";
import { estilos } from "../src/theme/estilos";
import { espacio, marca, tema, tipo } from "../src/theme/marca";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { acceso } = await leerTokens();
      if (acceso) router.replace("/");
    })();
  }, []);

  const iniciarSesion = async (): Promise<void> => {
    setCargando(true);
    setError(null);
    try {
      const { access, refresh } = await apiAuth.login(email, contrasena);
      await guardarTokens(access, refresh);
      const usuario = await apiAuth.yo();
      if (!esCosturera(usuario)) {
        await cerrarSesion();
        setError("Esta aplicación es solo para la costurera.");
      } else {
        router.replace(usuario["debe_cambiar_contraseña"] ? "/cambiar-contrasena" : "/");
      }
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
      marcarUso();
    }
  };

  return (
    <KeyboardAvoidingView style={vistas.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[estilos.contenedor, vistas.scroll]} keyboardShouldPersistTaps="handled">
        <View style={vistas.hero}>
          <View style={vistas.logoCaja}>
            <Image source={require("../assets/logo-fran-costuras.png")} style={vistas.logo} resizeMode="contain" accessible accessibilityLabel="Fran-Costuras — Diseña, Cose, Crea" />
          </View>
          <Text style={[estilos.titulo, vistas.centrado]}>Tu taller, en orden</Text>
          <Text style={[estilos.texto, vistas.centrado]}>Ingresa a tu espacio de trabajo y continúa creando.</Text>
        </View>

        <View style={[estilos.tarjetaBlanca, vistas.formulario]}>
          <ChipMarca icono="aguja">Acceso de costurera</ChipMarca>
          <Text style={vistas.saludo}>¡Bienvenida!</Text>
          <Text style={estilos.texto}>Usa las credenciales que te entregó la administradora.</Text>
          {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}

          <CampoMarca etiqueta="Correo electrónico" icono="aguja" placeholder="Escribe tu correo" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} accessibilityLabel="Correo electrónico" returnKeyType="next" />

          <CampoMarca etiqueta="Contraseña" icono="aguja" placeholder="Escribe tu contraseña" textContentType="password" secureTextEntry={!mostrarContrasena} value={contrasena} onChangeText={setContrasena} accessibilityLabel="Contraseña" returnKeyType="go" onSubmitEditing={() => void iniciarSesion()} accion={
            <Pressable accessibilityRole="button" accessibilityLabel={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"} onPress={() => setMostrarContrasena((visible) => !visible)} hitSlop={8} style={vistas.mostrar}>
              <Text style={vistas.mostrarTexto}>{mostrarContrasena ? "Ocultar" : "Mostrar"}</Text>
            </Pressable>
          } />

          <BotonMarca onPress={() => void iniciarSesion()} cargando={cargando} accessibilityLabel="Iniciar sesión">{cargando ? "Iniciando…" : "Iniciar sesión"}</BotonMarca>
          <View style={vistas.privacidad}><IconoCostura nombre="carrete" size={16} color={tema.titulo} /><Text style={[estilos.nota, vistas.privacidadTexto]}>Tu sesión se protege en este dispositivo.</Text></View>
        </View>
        <Text style={vistas.pie}>Fran-Costuras  ·  Diseña · Cose · Crea</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const vistas = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tema.fondo },
  scroll: { alignItems: "center" },
  hero: { width: "100%", maxWidth: 430, alignItems: "center", gap: 8 },
  logoCaja: { width: 210, height: 140, borderRadius: 24, backgroundColor: marca.blanco, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logo: { width: 210, height: 140 },
  centrado: { textAlign: "center" },
  formulario: { maxWidth: 430, gap: espacio.lista },
  saludo: { ...tipo.subtitulo, color: tema.titulo },
  mostrar: { paddingVertical: 8, paddingLeft: 4 },
  mostrarTexto: { ...tipo.etiqueta, color: tema.titulo },
  privacidad: { flexDirection: "row", alignItems: "center", gap: 6 },
  privacidadTexto: { flex: 1 },
  pie: { width: "100%", maxWidth: 430, fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 0.48, color: tema.encabezado },
});
