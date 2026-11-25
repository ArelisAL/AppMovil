import { useEffect, useState } from "react";
import {
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
} from "react-native";
import { router } from "expo-router";

import apiAuth, { esCosturera, mensajeDeError } from "../src/api/auth";
import { cerrarSesion, guardarTokens, leerTokens, marcarUso } from "../src/auth/sesion";
import { estilos } from "../src/theme/estilos";
import { tema } from "../src/theme/marca";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { acceso } = await leerTokens();
      if (acceso) {
        router.replace("/");
      }
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[estilos.contenedor, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
      <Image
        source={require("../assets/logo-fran-costuras.png")}
        style={{ width: 240, height: 160, marginBottom: 16 }}
        resizeMode="contain"
        accessible
        accessibilityLabel="Fran-Costuras — Diseña, Cose, Crea"
      />
      <Text style={estilos.titulo}>Iniciar sesión</Text>
      {error ? <Text style={estilos.error}>{error}</Text> : null}
      <Text style={estilos.texto}>Correo electrónico</Text>
      <TextInput
        style={estilos.input}
        placeholder="Escribe tu correo"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Correo electrónico"
      />
      <Text style={estilos.texto}>Contraseña</Text>
      <TextInput
        style={estilos.input}
        placeholder="Escribe tu contraseña"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
        accessibilityLabel="Contraseña"
      />
      <Button
        title={cargando ? "Iniciando…" : "Iniciar sesión"}
        color={tema.titulo}
        onPress={iniciarSesion}
        disabled={cargando}
        accessibilityLabel="Iniciar sesión"
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
