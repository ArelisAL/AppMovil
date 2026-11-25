import { useState } from "react";
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
import apiAuth, { mensajeDeError } from "../src/api/auth";
import { guardarTokens } from "../src/auth/sesion";
import { estilos } from "../src/theme/estilos";
import { marca, tema } from "../src/theme/marca";

export default function CambiarContrasenaScreen() {
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const guardar = async (): Promise<void> => {
    if (nuevaContrasena !== confirmar) { setError("Las contraseñas deben coincidir."); return; }
    setCargando(true);
    setError(null);
    try {
      const tokens = await apiAuth.cambiarContrasena(contrasenaActual, nuevaContrasena);
      await guardarTokens(tokens.access, tokens.refresh);
      router.replace("/");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  };

  const campoPassword = (key: string, label: string, placeholder: string, value: string, onChangeText: (valor: string) => void) => (
    <>
      <Text style={vistas.etiqueta}>{label}</Text>
      <CampoMarca icono="hilo" placeholder={placeholder} secureTextEntry={!mostrar[key]} value={value} onChangeText={onChangeText} accessibilityLabel={label} textContentType={key === "actual" ? "password" : "newPassword"} returnKeyType={key === "confirmar" ? "done" : "next"} onSubmitEditing={key === "confirmar" ? () => void guardar() : undefined} accion={
        <Pressable accessibilityRole="button" accessibilityLabel={mostrar[key] ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} onPress={() => setMostrar((actual) => ({ ...actual, [key]: !actual[key] }))} hitSlop={8} style={vistas.mostrar}>
          <Text style={vistas.mostrarTexto}>{mostrar[key] ? "Ocultar" : "Mostrar"}</Text>
        </Pressable>
      } />
    </>
  );

  return (
    <KeyboardAvoidingView style={vistas.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={vistas.scroll} keyboardShouldPersistTaps="handled">
        <View style={vistas.cabecera}>
          <View style={vistas.logoCaja}><Image source={require("../assets/logo-fran-costuras.png")} style={vistas.logo} resizeMode="contain" accessibilityLabel="Fran-Costuras — Diseña, Cose, Crea" /></View>
          <View style={vistas.iconoCaja}><IconoCostura nombre="aguja" size={24} color={tema.titulo} /></View>
          <Text style={vistas.titulo}>Protege tu cuenta</Text>
          <Text style={vistas.intro}>Crea una contraseña personal para continuar en la app.</Text>
        </View>

        <View style={[estilos.tarjetaBlanca, vistas.formulario]}>
          <View style={vistas.aviso}><IconoCostura nombre="hilo" size={17} color={tema.titulo} /><Text style={vistas.avisoTexto}>Este cambio es necesario en tu primer ingreso.</Text></View>
          {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}
          {campoPassword("actual", "Contraseña temporal actual", "Contraseña temporal actual", contrasenaActual, setContrasenaActual)}
          {campoPassword("nueva", "Nueva contraseña", "Nueva contraseña", nuevaContrasena, setNuevaContrasena)}
          {campoPassword("confirmar", "Confirmar nueva contraseña", "Confirmar nueva contraseña", confirmar, setConfirmar)}
          <Text style={vistas.nota}>El servidor validará los requisitos de seguridad antes de guardar.</Text>
          <BotonMarca onPress={() => void guardar()} cargando={cargando} accessibilityLabel="Cambiar contraseña" style={vistas.boton}>{cargando ? "Guardando…" : "Cambiar contraseña"}</BotonMarca>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const vistas = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tema.fondo },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20, paddingVertical: 28 },
  cabecera: { width: "100%", maxWidth: 430, alignItems: "center", marginBottom: 18 },
  logoCaja: { width: 160, height: 104, borderRadius: 18, backgroundColor: marca.blanco, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logo: { width: 150, height: 98 },
  iconoCaja: { width: 46, height: 46, borderRadius: 16, backgroundColor: marca.rosaPastel, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  titulo: { color: tema.titulo, fontSize: 24, fontWeight: "800", textAlign: "center" },
  intro: { maxWidth: 320, color: tema.texto, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 5 },
  formulario: { maxWidth: 430 },
  aviso: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, backgroundColor: marca.amarilloSuave, marginBottom: 17 },
  avisoTexto: { flex: 1, color: tema.texto, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  etiqueta: { color: tema.texto, fontSize: 13, fontWeight: "700", marginBottom: 7, marginLeft: 2 },
  mostrar: { paddingVertical: 8, paddingLeft: 5 },
  mostrarTexto: { color: tema.titulo, fontSize: 12, fontWeight: "800" },
  nota: { color: tema.texto, fontSize: 12, lineHeight: 17, marginTop: 0, marginBottom: 14 },
  boton: { marginTop: 2 },
});
