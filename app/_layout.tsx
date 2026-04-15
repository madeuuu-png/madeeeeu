// Polyfill de Buffer — debe ir PRIMERO antes de todo
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { Stack } from "expo-router";
import { useEffect } from "react";
import { inicializarDB } from '../lib/core/dataBase';

export default function RootLayout() {

  useEffect(() => {
    // Crea las tablas y pre-carga las cédulas si es la primera vez
    inicializarDB();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index"           options={{ headerShown: false }} />
      <Stack.Screen name="home"            options={{ headerShown: false, title: "Inicio" }} />
      <Stack.Screen name="informacion"     options={{ headerShown: false, title: "Información" }} />
      <Stack.Screen name="recuperarCedula" options={{ headerShown: false, title: "Recuperar Cédula" }} />
      <Stack.Screen name="admin"           options={{ headerShown: false }} />
    </Stack>
  );
}