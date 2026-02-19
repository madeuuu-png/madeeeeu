import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";

// 👑 Importar Supabase
import { supabase } from "../lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 añadido

export default function Index() {
  const [cedula, setCedula] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const ced = cedula.trim();

    if (ced.length !== 10) {
      alert("Ingresa una cédula válida (10 dígitos)");
      return;
    }

    try {
      // 🔍 Consulta Supabase
      const { data, error } = await supabase
        .from("estudiantes")
        .select("*")
        .eq("NumDocumento", ced);

      console.log("📦 Resultado Supabase:", { data, error });

      if (error) {
        console.error("⚠️ Error Supabase:", error.message);
        alert("Error al consultar Supabase: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert("❌ Cédula no registrada en Supabase");
        return;
      }

      // ✅ Éxito: estudiante encontrado
      console.log("✅ Estudiante encontrado:", data[0]);

      // 👑 Guardar el número de documento en AsyncStorage
      await AsyncStorage.setItem("numDocumento", ced);

      router.replace("/home");

    } catch (err) {
      console.error("🚨 Error inesperado:", err);
      alert("Hubo un error inesperado, intenta nuevamente");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🌸 Círculos decorativos */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>👑</Text>
            </View>
            <Text style={styles.appName}>MAKANA</Text>
            <Text style={styles.subtitle}>Bienvenida de vuelta</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.description}>
              Ingresa tu cédula para continuar
            </Text>

            {/* 🆔 Campo de cédula */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🆔</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de cédula"
                placeholderTextColor="#F8BBD0"
                value={cedula}
                onChangeText={setCedula}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* 🔘 Botón */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              activeOpacity={0.8}>
              <Text style={styles.buttonText}>Ingresar</Text>
              <Text style={styles.buttonIcon}>→</Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
            <TouchableOpacity onPress={() => router.push('/recuperarCedula')}>
            <Text style={styles.link}>¿Olvidaste tu cédula?</Text>
            </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>Hecho con 💖 por tu equipo</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
// 🎨 Estilos (sin cambios mayores)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCE4EC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    minHeight: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#F48FB1",
    opacity: 0.2,
    top: -100,
    left: -50,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#EC407A",
    opacity: 0.15,
    bottom: -50,
    right: -30,
  },
  circle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F8BBD0",
    opacity: 0.3,
    top: 200,
    right: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EC407A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#EC407A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#EC407A",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#EC407A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#F48FB1",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE4EC",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#F8BBD0",
  },
  inputIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#C2185B",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#EC407A",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#EC407A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    color: "#F48FB1",
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    marginTop: 32,
    color: "#F48FB1",
    fontSize: 12,
    textAlign: "center",
  },
});