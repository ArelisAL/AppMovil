import { useState } from "react";
import {
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
import { espacio, marca, radio, tema, tipo } from "../src/theme/marca";

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
    <CampoMarca etiqueta={label} icono="aguja" placeholder={placeholder} secureTextEntry={!mostrar[key]} value={value} onChangeText={onChangeText} accessibilityLabel={label} textContentType={key === "actual" ? "password" : "newPassword"} returnKeyType={key === "confirmar" ? "done" : "next"} onSubmitEditing={key === "confirmar" ? () => void guardar() : undefined} accion={
      <Pressable accessibilityRole="button" accessibilityLabel={mostrar[key] ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} onPress={() => setMostrar((actual) => ({ ...actual, [key]: !actual[key] }))} hitSlop={8} style={vistas.mostrar}>
        <Text style={vistas.mostrarTexto}>{mostrar[key] ? "Ocultar" : "Mostrar"}</Text>
      </Pressable>
    } />
  );

  return (
    <KeyboardAvoidingView style={vistas.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[estilos.contenedor, vistas.scroll]} keyboardShouldPersistTaps="handled">
        <View style={vistas.cabecera}>
          <View style={vistas.iconoCaja}><IconoCostura nombre="aguja" size={24} color={tema.titulo} /></View>
          <Text style={estilos.titulo}>Protege tu cuenta</Text>
          <Text style={estilos.texto}>Crea una contraseña personal para continuar en la app.</Text>
        </View>

        <View style={[estilos.tarjetaBlanca, vistas.formulario]}>
          <View style={vistas.aviso}><IconoCostura nombre="aguja" size={18} color={tema.titulo} /><Text style={vistas.avisoTexto}>Este cambio es necesario en tu primer ingreso.</Text></View>
          {error ? <Text accessibilityRole="alert" style={estilos.error}>{error}</Text> : null}
          {campoPassword("actual", "Contraseña temporal actual", "Contraseña temporal actual", contrasenaActual, setContrasenaActual)}
          {campoPassword("nueva", "Nueva contraseña", "Nueva contraseña", nuevaContrasena, setNuevaContrasena)}
          {campoPassword("confirmar", "Confirmar nueva contraseña", "Confirmar nueva contraseña", confirmar, setConfirmar)}
          <BotonMarca onPress={() => void guardar()} cargando={cargando} accessibilityLabel="Cambiar contraseña">{cargando ? "Guardando…" : "Cambiar contraseña"}</BotonMarca>
          <Text style={estilos.nota}>El servidor validará los requisitos de seguridad antes de guardar.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const vistas = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tema.fondo },
  scroll: { alignItems: "center" },
  cabecera: { width: "100%", maxWidth: 430, gap: 8 },
  iconoCaja: { width: 46, height: 46, borderRadius: radio.boton, backgroundColor: marca.rosaPastel, alignItems: "center", justifyContent: "center" },
  formulario: { maxWidth: 430, gap: espacio.lista },
  aviso: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: marca.amarilloSuave },
  avisoTexto: { flex: 1, ...tipo.cuerpo, color: tema.texto },
  mostrar: { paddingVertical: 8, paddingLeft: 4 },
  mostrarTexto: { ...tipo.etiqueta, color: tema.titulo },
});
