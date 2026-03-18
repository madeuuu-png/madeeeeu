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
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Search, User, FileText, ArrowLeft, Lightbulb, Heart } from "lucide-react-native";
import { supabase } from '../lib/core/supabase/supabase';

export default function RecuperarCedula() {
  const router = useRouter();
  const [primerNombre, setPrimerNombre] = useState<string>("");
  const [segundoNombre, setSegundoNombre] = useState<string>("");
  const [primerApellido, setPrimerApellido] = useState<string>("");
  const [segundoApellido, setSegundoApellido] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);

  const handleBuscarCedula = async (): Promise<void> => {
    if (!primerNombre.trim() || !primerApellido.trim()) {
      Alert.alert("Campos incompletos", "Debes ingresar al menos tu primer nombre y primer apellido");
      return;
    }

    setCargando(true);

    try {
      const pNombre = primerNombre.trim().toUpperCase();
      const pApellido = primerApellido.trim().toUpperCase();

      const { data, error } = await supabase
        .from("estudiantes")
        .select("NumDocumento, Nombre, Apellidos, NombreCompleto")
        .ilike("Apellidos", `%${pApellido}%`)
        .ilike("Nombre", `%${pNombre}%`);

      if (error) {
        Alert.alert("Error de conexión", `No se pudo consultar la base de datos.\n\nDetalle: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.log("❌ No encontrado — Apellido:", pApellido, "| Nombre:", pNombre);
        Alert.alert(
          "No encontrado",
          `No se encontró ningún registro con:\n\nApellido: ${pApellido}\nNombre: ${pNombre}\n\nVerifica que los datos estén correctos.`
        );
        return;
      }

      const cedula = data[0].NumDocumento;
      const nombreEncontrado = data[0].NombreCompleto || `${data[0].Apellidos} ${data[0].Nombre}`;
      console.log("✅ Estudiante encontrado:", { cedula, nombre: nombreEncontrado, totalResultados: data.length });

      Alert.alert(
        "¡Cédula encontrada!",
        `Nombre: ${nombreEncontrado}\n\nTu cédula es: ${cedula}`,
        [{ text: "Volver al login", onPress: () => router.back() }]
      );

    } catch (err) {
      Alert.alert("Error", `Algo salió mal:\n\n${err instanceof Error ? err.message : 'Error desconocido'}`);
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft color="#EC407A" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
            <Search color="#EC407A" size={56} strokeWidth={1.5} style={{ marginBottom: 16 }} />
            <Text style={styles.headerTitle}>Recuperar Cédula</Text>
            <Text style={styles.headerSubtitle}>Ingresa tus datos personales</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos Personales</Text>
            <Text style={styles.cardDescription}>
              Ingresa tus nombres y apellidos tal como están registrados
            </Text>

            {/* Primer Nombre */}
            <View style={styles.inputContainer}>
              <User color="#EC407A" size={22} style={styles.inputIconComponent} />
              <TextInput
                style={styles.input}
                placeholder="Primer Nombre"
                placeholderTextColor="#F8BBD0"
                value={primerNombre}
                onChangeText={setPrimerNombre}
                autoCapitalize="words"
              />
            </View>

            {/* Segundo Nombre */}
            <View style={styles.inputContainer}>
              <User color="#EC407A" size={22} style={styles.inputIconComponent} />
              <TextInput
                style={styles.input}
                placeholder="Segundo Nombre (opcional)"
                placeholderTextColor="#F8BBD0"
                value={segundoNombre}
                onChangeText={setSegundoNombre}
                autoCapitalize="words"
              />
            </View>

            {/* Primer Apellido */}
            <View style={styles.inputContainer}>
              <FileText color="#EC407A" size={22} style={styles.inputIconComponent} />
              <TextInput
                style={styles.input}
                placeholder="Primer Apellido"
                placeholderTextColor="#F8BBD0"
                value={primerApellido}
                onChangeText={setPrimerApellido}
                autoCapitalize="words"
              />
            </View>

            {/* Segundo Apellido */}
            <View style={styles.inputContainer}>
              <FileText color="#EC407A" size={22} style={styles.inputIconComponent} />
              <TextInput
                style={styles.input}
                placeholder="Segundo Apellido (opcional)"
                placeholderTextColor="#F8BBD0"
                value={segundoApellido}
                onChangeText={setSegundoApellido}
                autoCapitalize="words"
              />
            </View>

            {/* Botón */}
            <TouchableOpacity
              style={[styles.button, cargando && styles.buttonDisabled]}
              onPress={handleBuscarCedula}
              disabled={cargando}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{cargando ? "Buscando..." : "Buscar mi cédula"}</Text>
              <Search color="white" size={18} />
            </TouchableOpacity>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Lightbulb color="#C2185B" size={24} style={{ marginRight: 12 }} />
              <Text style={styles.infoText}>
                Solo necesitas tu primer nombre y primer apellido. Los demás campos son opcionales.
              </Text>
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
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60, minHeight: "100%" },
  content: { flex: 1, zIndex: 10 },
  circle1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#F48FB1", opacity: 0.2, top: -100, left: -50 },
  circle2: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#EC407A", opacity: 0.15, bottom: -50, right: -30 },
  circle3: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#F8BBD0", opacity: 0.3, top: 300, right: 20 },
  header: { alignItems: "center", marginBottom: 32, position: "relative" },
  backButton: {
    position: "absolute", left: 0, top: 0, width: 44, height: 44, borderRadius: 22,
    backgroundColor: "white", justifyContent: "center", alignItems: "center",
    shadowColor: "#EC407A", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#C2185B", marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: "#EC407A", fontWeight: "500" },
  card: {
    backgroundColor: "white", borderRadius: 30, padding: 28,
    shadowColor: "#EC407A", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { fontSize: 24, fontWeight: "bold", color: "#C2185B", marginBottom: 8, textAlign: "center" },
  cardDescription: { fontSize: 13, color: "#F48FB1", marginBottom: 24, textAlign: "center", lineHeight: 18 },
  inputContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FCE4EC",
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16,
    borderWidth: 2, borderColor: "#F8BBD0",
  },
  inputIconComponent: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#C2185B", fontWeight: "600" },
  button: {
    backgroundColor: "#EC407A", borderRadius: 20, paddingVertical: 18, paddingHorizontal: 32,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginBottom: 20, marginTop: 8, gap: 8,
    shadowColor: "#EC407A", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 17, fontWeight: "bold" },
  infoBox: {
    backgroundColor: "#FCE4EC", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#F8BBD0",
  },
  infoText: { flex: 1, fontSize: 13, color: "#C2185B", lineHeight: 18, fontWeight: "500" },
  footerRow: { marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  footer: { color: "#F48FB1", fontSize: 12 },
});
