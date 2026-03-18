import { Stack } from "expo-router";
import { useEffect } from "react";
import { inicializarDB } from '../lib/core/database/database';

export default function RootLayout() {

  useEffect(() => {
    // Crea las tablas y pre-carga las cédulas si es la primera vez
    inicializarDB();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index"           options={{ headerShown: false }} />
      <Stack.Screen name="home"            options={{ title: "Inicio" }} />
      <Stack.Screen name="informacion"     options={{ title: "Información" }} />
      <Stack.Screen name="recuperarCedula" options={{ title: "Recuperar Cédula" }} />
      <Stack.Screen name="admin"           options={{ headerShown: false }} />
    </Stack>
  );
}