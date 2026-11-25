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

import { BotonMarca, CampoMarca, IconoCostura } from "../src/components/Marca";
import apiAuth, { esCosturera, mensajeDeError } from "../src/api/auth";
import { cerrarSesion, guardarTokens, leerTokens, marcarUso } from "../src/auth/sesion";
import { estilos } from "../src/theme/estilos";
import { marca, tema } from "../src/theme/marca";

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
      <ScrollView contentContainerStyle={vistas.scroll} keyboardShouldPersistTaps="handled">
        <View style={vistas.hero}>
          <View style={vistas.adornos}><View style={vistas.puntoGrande} /><View style={vistas.puntoPequeno} /><Text style={vistas.adornosTexto}>✂</Text></View>
          <View style={vistas.logoCaja}>
            <Image source={require("../assets/logo-fran-costuras.png")} style={vistas.logo} resizeMode="contain" accessible accessibilityLabel="Fran-Costuras — Diseña, Cose, Crea" />
          </View>
          <Text style={vistas.titulo}>Tu taller, en orden</Text>
          <Text style={vistas.intro}>Ingresa a tu espacio de trabajo y continúa creando.</Text>
        </View>

        <View style={[estilos.tarjetaBlanca, vistas.formulario]}>
          <View style={vistas.rol}><IconoCostura nombre="aguja" size={16} color={tema.titulo} /><Text style={vistas.rolTexto}>Acceso de costurera</Text></View>
          <Text style={vistas.saludo}>¡Bienvenida!</Text>
          <Text style={vistas.ayuda}>Usa las credenciales que te entregó la administradora.</Text>
          {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}

          <Text style={vistas.etiqueta}>Correo electrónico</Text>
          <CampoMarca icono="persona" placeholder="Escribe tu correo" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} accessibilityLabel="Correo electrónico" returnKeyType="next" />

          <Text style={vistas.etiqueta}>Contraseña</Text>
          <CampoMarca icono="hilo" placeholder="Escribe tu contraseña" textContentType="password" secureTextEntry={!mostrarContrasena} value={contrasena} onChangeText={setContrasena} accessibilityLabel="Contraseña" returnKeyType="go" onSubmitEditing={() => void iniciarSesion()} accion={
            <Pressable accessibilityRole="button" accessibilityLabel={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"} onPress={() => setMostrarContrasena((visible) => !visible)} hitSlop={8} style={vistas.mostrar}>
              <Text style={vistas.mostrarTexto}>{mostrarContrasena ? "Ocultar" : "Mostrar"}</Text>
            </Pressable>
          } />

          <BotonMarca onPress={() => void iniciarSesion()} cargando={cargando} accessibilityLabel="Iniciar sesión" style={vistas.boton}>{cargando ? "Iniciando…" : "Iniciar sesión"}</BotonMarca>
          <View style={vistas.privacidad}><IconoCostura nombre="cerrar" size={16} color={tema.encabezado} /><Text style={vistas.privacidadTexto}>Tu sesión se protege en este dispositivo.</Text></View>
        </View>
        <Text style={vistas.pie}>Fran-Costuras  ·  Diseña · Cose · Crea</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const vistas = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tema.fondo },
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  hero: { width: "100%", maxWidth: 430, alignItems: "center", paddingTop: 12, paddingBottom: 20, position: "relative" },
  adornos: { position: "absolute", width: "100%", height: "100%", overflow: "hidden", top: 0, left: 0 },
  puntoGrande: { position: "absolute", width: 150, height: 150, borderRadius: 75, right: -80, top: -38, backgroundColor: marca.celestePastel, opacity: 0.48 },
  puntoPequeno: { position: "absolute", width: 78, height: 78, borderRadius: 39, left: -44, bottom: 20, backgroundColor: marca.rosaPastel, opacity: 0.45 },
  adornosTexto: { position: "absolute", right: 24, bottom: 7, color: marca.rosaIntenso, fontSize: 32 },
  logoCaja: { width: 220, height: 138, borderRadius: 22, backgroundColor: marca.blanco, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: marca.moradoOscuro, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  logo: { width: 208, height: 132 },
  titulo: { color: tema.titulo, fontSize: 24, lineHeight: 31, fontWeight: "800", textAlign: "center" },
  intro: { maxWidth: 310, color: tema.texto, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 5 },
  formulario: { width: "100%", maxWidth: 430, padding: 22 },
  rol: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: marca.lila, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 15 },
  rolTexto: { color: tema.texto, fontSize: 12, fontWeight: "800" },
  saludo: { color: tema.titulo, fontSize: 21, fontWeight: "800" },
  ayuda: { color: tema.texto, fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 18 },
  etiqueta: { color: tema.texto, fontSize: 13, fontWeight: "700", marginBottom: 7, marginLeft: 2 },
  mostrar: { paddingVertical: 8, paddingLeft: 5 },
  mostrarTexto: { color: tema.titulo, fontSize: 12, fontWeight: "800" },
  boton: { marginTop: 2 },
  privacidad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 15 },
  privacidadTexto: { color: tema.texto, fontSize: 12 },
  pie: { color: tema.encabezado, fontSize: 12, fontWeight: "600", textAlign: "center", marginTop: 18 },
});
