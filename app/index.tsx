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
import { CreditCard, ArrowRight, Crown, Heart } from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";

import { supabase } from '../lib/core/supabase/supabase';
import { storageAdapter } from "@/lib/core/storage/storage.adapter";
import { existeCedulaLocal } from '../lib/core/dataBase/database';

const ADMINS = [
  "0105181424",
  "0106650344",
  "0107372104",
  "0107416042",
  "0151255551",
  "0150518355",
];

export default function Index() {
  const [cedula, setCedula] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const ced = cedula.trim();

    if (ced.length !== 10) {
      alert("Ingresa una cédula válida (10 dígitos)");
      return;
    }

    setCargando(true);

    try {
      const net = await NetInfo.fetch();

      if (net.isConnected) {
        // ── CON INTERNET → consulta Supabase ──────────────────
        const { data, error } = await supabase
          .from("estudiantes")
          .select("*")
          .eq("NumDocumento", ced);

        if (error) {
          alert("Error al consultar la base de datos: " + error.message);
          return;
        }

        if (!data || data.length === 0) {
          alert("❌ Cédula no registrada");
          return;
        }

      } else {
        // ── SIN INTERNET → verifica en SQLite local ───────────
        const existe = existeCedulaLocal(ced);
        if (!existe) {
          alert("❌ Cédula no encontrada. Necesitas internet para el primer ingreso.");
          return;
        }
      }

      // Guardar sesión
      await storageAdapter.setItem("numDocumento", ced);
      const esAdmin = ADMINS.includes(ced);
      await storageAdapter.setItem("esAdmin", esAdmin ? "true" : "false");

      router.replace("/home");

    } catch (err) {
      alert("Hubo un error inesperado, intenta nuevamente");
    } finally {
      setCargando(false);
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
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Crown color="white" size={48} strokeWidth={1.5} />
            </View>
            <Text style={styles.appName}>MAKANA</Text>
            <Text style={styles.subtitle}>Bienvenida de vuelta</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.description}>
              Ingresa tu cédula para continuar
            </Text>

            <View style={styles.inputContainer}>
              <CreditCard color="#EC407A" size={24} style={styles.inputIconComponent} />
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

            <TouchableOpacity
              style={[styles.button, cargando && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={cargando}
            >
              <Text style={styles.buttonText}>
                {cargando ? "Verificando..." : "Ingresar"}
              </Text>
              {!cargando && <ArrowRight color="white" size={20} />}
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => router.push('/recuperarCedula')}>
                <Text style={styles.link}>¿Olvidaste tu cédula?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Heart color="#F48FB1" size={12} fill="#F48FB1" />
            <Text style={styles.footer}> Hecho con amor por tu equipo</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCE4EC" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24, minHeight: "100%" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 10 },
  circle1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#F48FB1", opacity: 0.2, top: -100, left: -50 },
  circle2: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#EC407A", opacity: 0.15, bottom: -50, right: -30 },
  circle3: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#F8BBD0", opacity: 0.3, top: 200, right: 20 },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#EC407A", justifyContent: "center", alignItems: "center", marginBottom: 16, shadowColor: "#EC407A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: 32, fontWeight: "bold", color: "#C2185B", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#EC407A", fontWeight: "500" },
  card: { backgroundColor: "white", borderRadius: 30, padding: 32, width: "100%", maxWidth: 400, shadowColor: "#EC407A", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#C2185B", marginBottom: 8, textAlign: "center" },
  description: { fontSize: 14, color: "#F48FB1", marginBottom: 32, textAlign: "center" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FCE4EC", borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 24, borderWidth: 2, borderColor: "#F8BBD0" },
  inputIconComponent: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#C2185B", fontWeight: "600" },
  button: { backgroundColor: "#EC407A", borderRadius: 20, paddingVertical: 18, paddingHorizontal: 32, flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 24, shadowColor: "#EC407A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6, gap: 8 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  linksContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  link: { color: "#F48FB1", fontSize: 13, fontWeight: "500" },
  footerRow: { marginTop: 32, flexDirection: "row", alignItems: "center" },
  footer: { color: "#F48FB1", fontSize: 12 },
});