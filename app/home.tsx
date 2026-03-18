import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import {
  Sparkles, Flower2, Ribbon, Info, LogOut,
  WifiOff, AlertTriangle, ShieldCheck
} from 'lucide-react-native';
import { supabase } from '../lib/core/supabase/supabase';

export default function Home() {
  const router = useRouter();
  const [numDocumento, setNumDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [hayToallas, setHayToallas] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [esp32EnLinea, setEsp32EnLinea] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const valor = await AsyncStorage.getItem("numDocumento");
      const adminFlag = await AsyncStorage.getItem("esAdmin");
      setEsAdmin(adminFlag === "true");

      if (valor) {
        setNumDocumento(valor);
        const { data, error } = await supabase
          .from("estudiantes")
          .select("NombreCompleto")
          .eq("NumDocumento", valor)
          .single();
        if (!error && data) setNombre(data.NombreCompleto);
      }
      await cargarInventario();
      await verificarEstadoESP32();
    };

    cargarDatos();
    const intervalo = setInterval(() => {
      cargarInventario();
      verificarEstadoESP32();
    }, 3000);
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
      if (!error && data) {
        const total = data.motor1_toallas + data.motor2_toallas;
        setHayToallas(total > 0);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const verificarEstadoESP32 = async () => {
    try {
      const { data, error } = await supabase
        .from("estado_esp32")
        .select("en_linea")
        .order('id', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) setEsp32EnLinea(data.en_linea);
      else setEsp32EnLinea(false);
    } catch {
      setEsp32EnLinea(false);
    }
  };

  const handleSacarKit = async () => {
    if (!numDocumento) { alert("No se encontró el número de documento del usuario"); return; }
    if (!hayToallas) { alert("Sin toallas disponibles. Por favor contacta al personal."); return; }
    if (!esp32EnLinea) { alert("El dispensador está desconectado. Por favor contacta al personal."); return; }

    try {
      const hoy = new Date();
      const { data: estudiante, error: errorConsulta } = await supabase
        .from("estudiantes").select("UltimaEntrega").eq("NumDocumento", numDocumento).single();
      if (errorConsulta) { alert("Error al verificar la última entrega"); return; }

      if (estudiante?.UltimaEntrega) {
        const ultimaEntrega = new Date(estudiante.UltimaEntrega);
        const diferenciaDias = (hoy.getTime() - ultimaEntrega.getTime()) / (1000 * 60 * 60 * 24);
        if (diferenciaDias < 28) {
          alert(`Aún faltan ${Math.ceil(28 - diferenciaDias)} días para tu próximo kit`); return;
        }
      }

      const fechaActual = hoy.toISOString().split("T")[0];
      const { error: errorEstudiante } = await supabase
        .from("estudiantes").update({ UltimaEntrega: fechaActual }).eq("NumDocumento", numDocumento);
      if (errorEstudiante) { alert("Hubo un error al registrar la entrega"); return; }

      const { error: errorComando } = await supabase
        .from("comandos").insert({ accion: "dispensar_kit", estado: "pendiente", estudiante_doc: numDocumento });
      if (errorComando) { alert("Error al comunicarse con el dispensador"); return; }

      alert("✅ Kit solicitado. El dispensador se activará en breve.");
      setTimeout(cargarInventario, 3000);
    } catch {
      alert("Algo salió mal");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("numDocumento");
    await AsyncStorage.removeItem("esAdmin");
    router.replace('/');
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* Header */}
        <View style={styles.header}>
          <Sparkles color="#EC407A" size={48} strokeWidth={1.5} />
          <Text style={styles.welcomeTitle}>
            {nombre ? `¡Hola, ${nombre}!` : "¡Hola, Hermosa!"}
          </Text>
          <Text style={styles.welcomeSubtitle}>Estamos aquí para cuidarte</Text>
        </View>

        {/* Tab Admin — solo visible para admins */}
        {esAdmin && (
          <TouchableOpacity
            style={styles.adminTab}
            onPress={() => router.push('/admin')}
            activeOpacity={0.8}
          >
            <ShieldCheck color="white" size={22} style={{ marginRight: 10 }} />
            <Text style={styles.adminTabText}>Panel Administración</Text>
          </TouchableOpacity>
        )}

        {/* Message Card */}
        <View style={styles.messageCard}>
          <Flower2 color="#EC407A" size={32} style={{ marginRight: 16 }} />
          <Text style={styles.messageText}>
            "Tu bienestar es nuestra prioridad. Siempre estaremos aquí para ti."
          </Text>
        </View>

        {/* Estado disponibilidad — mensaje genérico para usuarios normales */}
        {cargando ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#EC407A" />
            <Text style={styles.loadingText}>Verificando disponibilidad...</Text>
          </View>
        ) : (
          <View style={[styles.statusCard, hayToallas ? styles.statusCardOk : styles.statusCardEmpty]}>
            {hayToallas ? (
              <>
                <Text style={styles.statusEmoji}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusTitle, { color: '#2E7D32' }]}>Kits disponibles</Text>
                  <Text style={[styles.statusSub, { color: '#388E3C' }]}>Puedes solicitar tu kit ahora</Text>
                </View>
              </>
            ) : (
              <>
                <AlertTriangle color="#C62828" size={28} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusTitle, { color: '#C62828' }]}>Sin kits disponibles</Text>
                  <Text style={[styles.statusSub, { color: '#D32F2F' }]}>Contacta al personal del colegio</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Estado dispensador offline */}
        {!esp32EnLinea && (
          <View style={styles.offlineCard}>
            <WifiOff color="#E65100" size={22} style={{ marginRight: 10 }} />
            <Text style={styles.offlineText}>Dispensador desconectado en este momento</Text>
          </View>
        )}

        {/* Botón Kit */}
        <TouchableOpacity
          style={[styles.primaryButton, (!hayToallas || !esp32EnLinea) && styles.primaryButtonDisabled]}
          onPress={handleSacarKit}
          activeOpacity={0.8}
          disabled={!hayToallas || !esp32EnLinea}
        >
          <View style={styles.buttonContent}>
            <Ribbon color="white" size={42} strokeWidth={1.5} style={{ marginRight: 20 }} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>
                {!hayToallas ? "Sin kits" : !esp32EnLinea ? "Desconectado" : "Saca tu Kit"}
              </Text>
              <Text style={styles.buttonSubtitle}>
                {!hayToallas
                  ? "Contacta al personal"
                  : !esp32EnLinea
                    ? "Dispensador offline"
                    : "Toca para solicitar"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botón Info */}
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => router.push('/informacion')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Info color="#C2185B" size={36} style={{ marginRight: 20 }} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.infoButtonTitle}>Información</Text>
              <Text style={styles.infoButtonSubtitle}>Conoce más sobre nosotras</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut color="#EC407A" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#FCE4EC' },
  container: { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  circle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#F48FB1', opacity: 0.15, top: -80, right: -50 },
  circle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#EC407A', opacity: 0.1, bottom: 100, left: -40 },
  circle3: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#F8BBD0', opacity: 0.2, top: 300, left: 50 },
  header: { alignItems: 'center', marginBottom: 20, zIndex: 10, gap: 8 },
  welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: '#C2185B', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 16, color: '#EC407A', fontWeight: '500' },

  adminTab: {
    backgroundColor: '#C2185B', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, zIndex: 10,
    shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  adminTabText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  messageCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, flexDirection: 'row',
    alignItems: 'center', marginBottom: 16, shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  messageText: { flex: 1, fontSize: 15, color: '#C2185B', fontWeight: '500', lineHeight: 22 },

  loadingCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, zIndex: 10, flexDirection: 'row', gap: 12, justifyContent: 'center' },
  loadingText: { color: '#EC407A', fontSize: 14 },

  statusCard: {
    borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, zIndex: 10, borderWidth: 2,
  },
  statusCardOk: { backgroundColor: '#E8F5E9', borderColor: '#66BB6A' },
  statusCardEmpty: { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  statusEmoji: { fontSize: 24, marginRight: 12 },
  statusTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  statusSub: { fontSize: 13 },

  offlineCard: {
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#FFA726', zIndex: 10,
  },
  offlineText: { color: '#E65100', fontSize: 14, fontWeight: '500', flex: 1 },

  primaryButton: {
    backgroundColor: '#EC407A', borderRadius: 24, padding: 28, marginBottom: 16,
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, zIndex: 10,
  },
  primaryButtonDisabled: { backgroundColor: '#BDBDBD', shadowOpacity: 0.2 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonTextContainer: { flex: 1 },
  buttonTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  buttonSubtitle: { fontSize: 15, color: '#FCE4EC', fontWeight: '500' },

  infoButton: {
    backgroundColor: 'white', borderRadius: 24, padding: 24, borderWidth: 2,
    borderColor: '#F8BBD0', marginBottom: 32, shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  infoButtonTitle: { fontSize: 22, fontWeight: 'bold', color: '#C2185B', marginBottom: 4 },
  infoButtonSubtitle: { fontSize: 14, color: '#F48FB1', fontWeight: '500' },

  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, backgroundColor: 'white', borderRadius: 16,
    borderWidth: 2, borderColor: '#F8BBD0', zIndex: 10,
  },
  logoutText: { color: '#EC407A', fontWeight: 'bold', fontSize: 16 },
});