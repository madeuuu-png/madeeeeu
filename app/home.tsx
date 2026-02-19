import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Home() {
  const router = useRouter();
  const [numDocumento, setNumDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [motor1Toallas, setMotor1Toallas] = useState(9);
  const [motor2Toallas, setMotor2Toallas] = useState(9);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      const valor = await AsyncStorage.getItem("numDocumento");

      if (valor) {
        setNumDocumento(valor);

        const { data, error } = await supabase
          .from("estudiantes")
          .select("NombreCompleto")
          .eq("NumDocumento", valor)
          .single();

        if (error) {
          console.error("Error al obtener nombre:", error);
        } else if (data) {
          setNombre(data.NombreCompleto);
        }
      }
      
      // Cargar inventario
      await cargarInventario();
    };

    cargarDatos();
    
    // Actualizar inventario cada 3 segundos
    const intervalo = setInterval(cargarInventario, 3000);
    
    return () => clearInterval(intervalo);
  }, []);

  const cargarInventario = async () => {
    try {
      const { data, error } = await supabase
        .from("inventario")
        .select("motor1_toallas, motor2_toallas")
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error al cargar inventario:", error);
      } else if (data) {
        setMotor1Toallas(data.motor1_toallas);
        setMotor2Toallas(data.motor2_toallas);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const handleSacarKit = async () => {
    if (!numDocumento) {
      alert("No se encontró el número de documento del usuario");
      return;
    }

    // Verificar si hay toallas disponibles
    if (motor1Toallas === 0 && motor2Toallas === 0) {
      alert("⚠️ No hay toallas disponibles. Por favor contacta al personal.");
      return;
    }

    try {
      const hoy = new Date();

      // 1️⃣ Consultar última entrega
      const { data: estudiante, error: errorConsulta } = await supabase
        .from("estudiantes")
        .select("UltimaEntrega")
        .eq("NumDocumento", numDocumento)
        .single();

      if (errorConsulta) {
        console.error(errorConsulta);
        alert("Error al verificar la última entrega");
        return;
      }

      // 2️⃣ Validar 28 días
      if (estudiante?.UltimaEntrega) {
        const ultimaEntrega = new Date(estudiante.UltimaEntrega);
        const diferenciaTiempo = hoy.getTime() - ultimaEntrega.getTime();
        const diferenciaDias = diferenciaTiempo / (1000 * 60 * 60 * 24);

        if (diferenciaDias < 28) {
          const diasRestantes = Math.ceil(28 - diferenciaDias);
          alert(`⏳ Aún faltan ${diasRestantes} días para tu próximo kit 💖`);
          return;
        }
      }

      // 3️⃣ Actualizar última entrega
      const fechaActual = hoy.toISOString().split("T")[0];

      const { error: errorEstudiante } = await supabase
        .from("estudiantes")
        .update({ UltimaEntrega: fechaActual })
        .eq("NumDocumento", numDocumento);

      if (errorEstudiante) {
        console.error(errorEstudiante);
        alert("Hubo un error al registrar la entrega");
        return;
      }

      // 4️⃣ Insertar comando
      const { error: errorComando } = await supabase
        .from("comandos")
        .insert({
          accion: "dispensar_kit",
          estado: "pendiente",
          estudiante_doc: numDocumento,
        });

      if (errorComando) {
        console.error(errorComando);
        alert("Error al comunicarse con el dispensador");
        return;
      }

      // ✅ Todo OK
      const motorActivo = motor1Toallas > 0 ? 1 : 2;
      alert(`✅ Kit solicitado. Motor ${motorActivo} se activará en breve.`);
      
      // Recargar inventario después de 3 segundos
      setTimeout(cargarInventario, 3000);

    } catch (err) {
      console.error("Error inesperado:", err);
      alert("Algo salió mal");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("numDocumento");
    router.replace('/');
  };

  const sinToallas = motor1Toallas === 0 && motor2Toallas === 0;
  const totalToallas = motor1Toallas + motor2Toallas;

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.welcomeTitle}>
            {nombre ? `¡Hola, ${nombre}!` : "¡Hola, Hermosa!"}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Estamos aquí para cuidarte 💖
          </Text>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>🌸</Text>
          <Text style={styles.messageText}>
            "Tu bienestar es nuestra prioridad. Siempre estaremos aquí para ti."
          </Text>
        </View>

        {/* INVENTARIO */}
        {cargando ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#EC407A" />
            <Text style={styles.loadingText}>Cargando inventario...</Text>
          </View>
        ) : (
          <>
            {/* Alerta sin toallas */}
            {sinToallas && (
              <View style={styles.alertCard}>
                <Text style={styles.alertIcon}>⚠️</Text>
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>Sin toallas disponibles</Text>
                  <Text style={styles.alertSubtitle}>
                    Por favor contacta al personal
                  </Text>
                </View>
              </View>
            )}

            {/* Contador de toallas */}
            <View style={styles.inventoryCard}>
              <Text style={styles.inventoryTitle}>📦 Toallas disponibles</Text>
              
              <View style={styles.inventoryRow}>
                <View style={styles.inventoryItem}>
                  <Text style={styles.inventoryLabel}>Motor 1 🔴</Text>
                  <Text style={[
                    styles.inventoryNumber,
                    motor1Toallas === 0 && styles.inventoryNumberEmpty
                  ]}>
                    {motor1Toallas}
                  </Text>
                </View>
                
                <View style={styles.inventoryDivider} />
                
                <View style={styles.inventoryItem}>
                  <Text style={styles.inventoryLabel}>Motor 2 🔵</Text>
                  <Text style={[
                    styles.inventoryNumber,
                    motor2Toallas === 0 && styles.inventoryNumberEmpty
                  ]}>
                    {motor2Toallas}
                  </Text>
                </View>
              </View>
              
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>
                  Total: {totalToallas} toallas
                </Text>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            sinToallas && styles.primaryButtonDisabled
          ]}
          onPress={handleSacarKit}
          activeOpacity={0.8}
          disabled={sinToallas}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>🎀</Text>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>
                {sinToallas ? "Sin toallas" : "Saca tu Kit"}
              </Text>
              <Text style={styles.buttonSubtitle}>
                {sinToallas 
                  ? "Contacta al personal" 
                  : motor1Toallas > 0 
                    ? "Se activará Motor 1" 
                    : "Se activará Motor 2"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => router.push('/informacion')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>💡</Text>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.infoButtonTitle}>Información</Text>
              <Text style={styles.infoButtonSubtitle}>
                Conoce más sobre nosotras
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>👋</Text>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#FCE4EC' },
  container: { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  circle1: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#F48FB1', opacity: 0.15, top: -80, right: -50,
  },
  circle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#EC407A', opacity: 0.1, bottom: 100, left: -40,
  },
  circle3: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#F8BBD0', opacity: 0.2, top: 300, left: 50,
  },
  header: { alignItems: 'center', marginBottom: 24, zIndex: 10 },
  emoji: { fontSize: 48, marginBottom: 12 },
  welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: '#C2185B', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 16, color: '#EC407A', fontWeight: '500' },
  messageCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  messageIcon: { fontSize: 32, marginRight: 16 },
  messageText: { flex: 1, fontSize: 15, color: '#C2185B', fontWeight: '500', lineHeight: 22 },
  loadingCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16, zIndex: 10,
  },
  loadingText: { marginTop: 10, color: '#EC407A', fontSize: 14 },
  alertCard: {
    backgroundColor: '#FFEBEE', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: '#EF5350', zIndex: 10,
  },
  alertIcon: { fontSize: 32, marginRight: 12 },
  alertTextContainer: { flex: 1 },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#C62828', marginBottom: 4 },
  alertSubtitle: { fontSize: 13, color: '#D32F2F' },
  inventoryCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    marginBottom: 20, shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15,
    shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  inventoryTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#C2185B',
    marginBottom: 16, textAlign: 'center',
  },
  inventoryRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', marginBottom: 12,
  },
  inventoryItem: { alignItems: 'center', flex: 1 },
  inventoryLabel: { fontSize: 14, color: '#F48FB1', marginBottom: 8, fontWeight: '600' },
  inventoryNumber: {
    fontSize: 36, fontWeight: 'bold', color: '#EC407A',
  },
  inventoryNumberEmpty: { color: '#BDBDBD' },
  inventoryDivider: {
    width: 2, height: 60, backgroundColor: '#F8BBD0',
  },
  totalContainer: {
    backgroundColor: '#FCE4EC', borderRadius: 12,
    padding: 12, marginTop: 8,
  },
  totalText: {
    textAlign: 'center', fontSize: 15, fontWeight: 'bold',
    color: '#C2185B',
  },
  primaryButton: {
    backgroundColor: '#EC407A', borderRadius: 24, padding: 28,
    marginBottom: 16, shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4,
    shadowRadius: 16, elevation: 8, zIndex: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#BDBDBD', shadowOpacity: 0.2,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { fontSize: 42, marginRight: 20 },
  buttonTextContainer: { flex: 1 },
  buttonTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  buttonSubtitle: { fontSize: 15, color: '#FCE4EC', fontWeight: '500' },
  infoButton: {
    backgroundColor: 'white', borderRadius: 24, padding: 24,
    borderWidth: 2, borderColor: '#F8BBD0', marginBottom: 32,
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  infoButtonTitle: { fontSize: 22, fontWeight: 'bold', color: '#C2185B', marginBottom: 4 },
  infoButtonSubtitle: { fontSize: 14, color: '#F48FB1', fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, backgroundColor: 'white', borderRadius: 16,
    borderWidth: 2, borderColor: '#F8BBD0', zIndex: 10,
  },
  logoutIcon: { fontSize: 20, marginRight: 8 },
  logoutText: { color: '#EC407A', fontWeight: 'bold', fontSize: 16 },
});