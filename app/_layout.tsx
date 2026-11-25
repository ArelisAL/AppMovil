import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState, View } from "react-native";

import { cerrarSesion, inactividadExpirada, leerTokens, marcarUso } from "../src/auth/sesion";
import { marca } from "../src/theme/marca";

export default function RootLayout() {
  useEffect(() => {
    const revisar = async () => {
      const tokens = await leerTokens();
      if (tokens.refresco && (await inactividadExpirada())) await cerrarSesion();
    };
    const intervalo = setInterval(() => void revisar(), 30_000);
    const listener = AppState.addEventListener("change", (estado) => {
      if (estado === "active") void revisar();
    });
    return () => {
      clearInterval(intervalo);
      listener.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }} onTouchStart={marcarUso}>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: marca.blancoLavanda },
        headerTintColor: marca.moradoOscuro,
        headerTitleStyle: { color: marca.moradoOscuro },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Iniciar sesión", headerShown: false }} />
      <Stack.Screen
        name="cambiar-contrasena"
        options={{ title: "Cambiar contraseña", headerShown: false }}
      />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="pedido/[id]" options={{ title: "Detalle del pedido" }} />
    </Stack>
    </View>
  );
}
