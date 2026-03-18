import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ title: "Inicio" }} />
      <Stack.Screen name="informacion" options={{ title: "Información" }} />
      <Stack.Screen name="recuperarCedula" options={{ title: "Recuperar Cédula" }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}