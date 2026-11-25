import { useState } from "react";
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
} from "react-native";
import { router } from "expo-router";

import apiAuth, { mensajeDeError } from "../src/api/auth";
import { guardarTokens } from "../src/auth/sesion";
import { estilos } from "../src/theme/estilos";
import { tema } from "../src/theme/marca";

export default function CambiarContrasenaScreen() {
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const guardar = async (): Promise<void> => {
    if (nuevaContrasena !== confirmar) {
      setError("Las contraseñas deben coincidir.");
      return;
    }
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[estilos.contenedor, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={estilos.titulo}>Cambiar contraseña</Text>
      {error ? <Text style={estilos.error}>{error}</Text> : null}
      <Text style={estilos.texto}>Contraseña temporal actual</Text>
      <TextInput
        style={estilos.input}
        placeholder="Contraseña temporal actual"
        secureTextEntry
        value={contrasenaActual}
        onChangeText={setContrasenaActual}
        accessibilityLabel="Contraseña temporal actual"
      />
      <Text style={estilos.texto}>Nueva contraseña</Text>
      <TextInput
        style={estilos.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={nuevaContrasena}
        onChangeText={setNuevaContrasena}
        accessibilityLabel="Nueva contraseña"
      />
      <Text style={estilos.texto}>Confirmar nueva contraseña</Text>
      <TextInput
        style={estilos.input}
        placeholder="Confirmar nueva contraseña"
        secureTextEntry
        value={confirmar}
        onChangeText={setConfirmar}
        accessibilityLabel="Confirmar nueva contraseña"
      />
      <Button
        title={cargando ? "Guardando…" : "Cambiar contraseña"}
        color={tema.titulo}
        onPress={guardar}
        disabled={cargando}
        accessibilityLabel="Cambiar contraseña"
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
