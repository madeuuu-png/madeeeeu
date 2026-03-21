import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
  ActivityIndicator, Alert, PermissionsAndroid, Platform
} from 'react-native';
import {
  Sparkles, Flower2, Ribbon, Info, LogOut,
  Bluetooth, BluetoothOff, AlertTriangle, ShieldCheck
} from 'lucide-react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/core/supabase/supabase';
import {
  guardarEntregaLocal,
  obtenerUltimaEntregaLocal,
  sincronizarConSupabase,
} from '../lib/core/dataBase/database';

const SERVICE_UUID        = '12345678-1234-1234-1234-123456789abc';
const CHARACTERISTIC_UUID = 'abcd1234-ab12-ab12-ab12-abcdef123456';
const ESP32_MAC           = '08:D1:F9:C8:D5:3E'; // MAC del ESP32 — más confiable que el nombre

// Global para que no muera entre renders
const bleManager = new BleManager();

export default function Home() {
  const router = useRouter();

  const [numDocumento, setNumDocumento] = useState('');
  const [nombre,       setNombre]       = useState('');
  const [hayToallas,   setHayToallas]   = useState(true);
  const [cargando,     setCargando]     = useState(true);
  const [esAdmin,      setEsAdmin]      = useState(false);
  const [bleConectado,  setBleConectado]  = useState(false);
  const [bleConectando, setBleConectando] = useState(false);

  const dispositivoRef = useRef<Device | null>(null);

  // ── Inicialización ─────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const doc       = await AsyncStorage.getItem('numDocumento');
      const adminFlag = await AsyncStorage.getItem('esAdmin');
      setEsAdmin(adminFlag === 'true');

      if (doc) {
        setNumDocumento(doc);
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          const { data } = await supabase
            .from('estudiantes')
            .select('NombreCompleto')
            .eq('NumDocumento', doc)
            .single();
          if (data) setNombre(data.NombreCompleto);
        }
      }

      // Inventario ya no está en Supabase — lo trae el ESP32 por BLE
      setCargando(false);

      // Subir entregas pendientes
      sincronizarConSupabase();
    };

    init();
    return () => { bleManager.stopDeviceScan(); };
  }, []);

  // ── Conectar BLE ───────────────────────────────────────────
  const conectarBLE = async () => {
    if (bleConectando || bleConectado) return;

    // Si ya hay dispositivo guardado, verificar si sigue conectado
    if (dispositivoRef.current) {
      try {
        const sigue = await dispositivoRef.current.isConnected();
        if (sigue) { setBleConectado(true); return; }
      } catch { /* nada */ }
      dispositivoRef.current = null;
    }

    pedirPermisosYEscanear();
  };

  const pedirPermisosYEscanear = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const todosOk = Object.values(granted).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!todosOk) {
        Alert.alert('Permisos', 'Activa Bluetooth y Ubicación en ajustes de la app.');
        return;
      }
    }
    iniciarEscaneo();
  };

  const iniciarEscaneo = async () => {
    // Verificar que el Bluetooth esté encendido antes de escanear
    const estado = await bleManager.state();
    console.log('[BLE] Estado:', estado);

    if (estado !== 'PoweredOn') {
      setBleConectando(false);
      Alert.alert(
        'Bluetooth apagado',
        'Por favor activa el Bluetooth e intenta de nuevo.'
      );
      return;
    }

    setBleConectando(true);

    // Filtrar por SERVICE_UUID para encontrar solo el ESP32
    bleManager.startDeviceScan([SERVICE_UUID], null, async (error, device) => {
      if (error) {
        setBleConectando(false);
        Alert.alert('Error Bluetooth', 'Error al escanear: ' + error.message);
        return;
      }

      // Log para debug — útil para ver qué llega
      console.log('[BLE] Dispositivo:', device?.name, '|', device?.localName, '| ID:', device?.id);

      // Conectar por MAC (más confiable) O por nombre como backup
      const esPorMAC    = device?.id === ESP32_MAC;
      const nombre      = device?.name || device?.localName || '';
      const esPorNombre = nombre.includes('MAKANA');

      if (!esPorMAC && !esPorNombre) return;

      bleManager.stopDeviceScan();

      try {
        const conectado = await device!.connect();
        await new Promise(r => setTimeout(r, 500)); // delay para que ESP32 esté listo
        await conectado.discoverAllServicesAndCharacteristics();
        dispositivoRef.current = conectado;
        setBleConectado(true);
        setBleConectando(false);

        conectado.onDisconnected(() => {
          setBleConectado(false);
          dispositivoRef.current = null;
        });

      } catch (e) {
        setBleConectando(false);
        Alert.alert('Error', 'No se pudo conectar al dispensador. Reinicia el ESP32 e intenta de nuevo.');
      }
    });

    // Timeout de 12 segundos
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setBleConectando(false);
    }, 12000);
  };

  // ── Enviar comando BLE ─────────────────────────────────────
  const enviarComandoBLE = (comando: string): Promise<string | null> => {
    return new Promise(async (resolve) => {
      const device = dispositivoRef.current;
      if (!device) return resolve(null);

      let suscripcion: Subscription | null = null;

      const timeout = setTimeout(() => {
        suscripcion?.remove();
        resolve(null);
      }, 6000);

      try {
        // Primero suscribirse, luego escribir
        suscripcion = device.monitorCharacteristicForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          (err, char) => {
            clearTimeout(timeout);
            suscripcion?.remove();
            if (err || !char?.value) return resolve(null);
            const respuesta = Buffer.from(char.value, 'base64').toString('utf-8');
            resolve(respuesta);
          }
        );

        // Pequeño delay para que el monitor esté listo
        await new Promise(r => setTimeout(r, 100));

        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          Buffer.from(comando).toString('base64')
        );

      } catch {
        clearTimeout(timeout);
        suscripcion?.remove();
        resolve(null);
      }
    });
  };

  // ── Verificar cooldown ─────────────────────────────────────
  const verificarCooldown = async (): Promise<boolean> => {
    const hoy = new Date();

    // 1. SQLite local (funciona offline)
    const fechaLocal = obtenerUltimaEntregaLocal(numDocumento); // síncrona, sin await
    if (fechaLocal) {
      const dias = (hoy.getTime() - new Date(fechaLocal).getTime()) / (1000 * 60 * 60 * 24);
      if (dias < 28) {
        Alert.alert('', `Aún faltan ${Math.ceil(28 - dias)} días para tu próximo kit`);
        return false;
      }
    }

    // 2. Supabase (si hay internet)
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      const { data } = await supabase
        .from('estudiantes')
        .select('UltimaEntrega')
        .eq('NumDocumento', numDocumento)
        .single();

      if (data?.UltimaEntrega) {
        const dias = (hoy.getTime() - new Date(data.UltimaEntrega).getTime()) / (1000 * 60 * 60 * 24);
        if (dias < 28) {
          Alert.alert('', `Aún faltan ${Math.ceil(28 - dias)} días para tu próximo kit`);
          return false;
        }
      }
    }

    return true;
  };

  // ── Sacar Kit ──────────────────────────────────────────────
  const handleSacarKit = async () => {
    if (!numDocumento) { Alert.alert('Error', 'No se encontró tu número de documento'); return; }
    if (!bleConectado) { Alert.alert('Conexión', 'Conecta el dispensador primero.'); return; }

    // Los admins no tienen restricción de cooldown
    if (!esAdmin) {
      const puedeRetirar = await verificarCooldown();
      if (!puedeRetirar) return;
    }

    const respuesta = await enviarComandoBLE('DISPENSAR');

    if (!respuesta || respuesta === 'SIN_TOALLAS') {
      Alert.alert('Sin toallas', 'El dispensador está vacío. Avisa al personal.');
      setHayToallas(false);
      return;
    }

    if (respuesta.startsWith('OK:')) {
      const partes = respuesta.split(':');
      setHayToallas(parseInt(partes[1]) + parseInt(partes[2]) > 0);

      const fecha = new Date().toISOString().split('T')[0];
      guardarEntregaLocal(numDocumento, fecha);
      sincronizarConSupabase();

      Alert.alert('✅ ¡Listo!', 'Tu kit fue dispensado. ¡Cuídate mucho!');
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    await AsyncStorage.removeItem('numDocumento');
    await AsyncStorage.removeItem('esAdmin');
    bleManager.stopDeviceScan();
    router.replace('/');
  };

  // ── RENDER ─────────────────────────────────────────────────
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
            {nombre ? `¡Hola, ${nombre}!` : '¡Hola, Hermosa!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>Estamos aquí para cuidarte</Text>
        </View>

        {/* Admin */}
        {esAdmin && (
          <TouchableOpacity style={styles.adminTab} onPress={() => router.push('/admin')} activeOpacity={0.8}>
            <ShieldCheck color="white" size={22} style={{ marginRight: 10 }} />
            <Text style={styles.adminTabText}>Panel Administración</Text>
          </TouchableOpacity>
        )}

        {/* Mensaje */}
        <View style={styles.messageCard}>
          <Flower2 color="#EC407A" size={32} style={{ marginRight: 16 }} />
          <Text style={styles.messageText}>
            "Tu bienestar es nuestra prioridad. Siempre estaremos aquí para ti."
          </Text>
        </View>

        {/* Estado inventario */}
        {cargando ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#EC407A" />
            <Text style={styles.loadingText}>Cargando...</Text>
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

        {/* Bluetooth */}
        <TouchableOpacity
          style={[styles.bleCard, bleConectado ? styles.bleCardOk : styles.bleCardOff]}
          onPress={conectarBLE}
          disabled={bleConectando || bleConectado}
          activeOpacity={0.8}
        >
          {bleConectando ? (
            <>
              <ActivityIndicator size="small" color="#E65100" style={{ marginRight: 10 }} />
              <Text style={styles.bleTextOff}>Buscando dispensador...</Text>
            </>
          ) : bleConectado ? (
            <>
              <Bluetooth color="#2E7D32" size={22} style={{ marginRight: 10 }} />
              <Text style={styles.bleTextOk}>Dispensador conectado ✓</Text>
            </>
          ) : (
            <>
              <BluetoothOff color="#E65100" size={22} style={{ marginRight: 10 }} />
              <Text style={styles.bleTextOff}>Toca para conectar el dispensador</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Botón Sacar Kit */}
        <TouchableOpacity
          style={[styles.primaryButton, (!hayToallas || !bleConectado) && styles.primaryButtonDisabled]}
          onPress={handleSacarKit}
          activeOpacity={0.8}
          disabled={!hayToallas || !bleConectado}
        >
          <View style={styles.buttonContent}>
            <Ribbon color="white" size={42} strokeWidth={1.5} style={{ marginRight: 20 }} />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>
                {!bleConectado ? 'Desconectado' : !hayToallas ? 'Sin kits' : 'Saca tu Kit'}
              </Text>
              <Text style={styles.buttonSubtitle}>
                {!bleConectado ? 'Conecta el dispensador primero' : !hayToallas ? 'Contacta al personal' : 'Toca para solicitar'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botón Información */}
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

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut color="#EC407A" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView:  { flex: 1, backgroundColor: '#FCE4EC' },
  container:   { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  circle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#F48FB1', opacity: 0.15, top: -80,  right: -50 },
  circle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: '#EC407A', opacity: 0.1,  bottom: 100, left: -40 },
  circle3: { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: '#F8BBD0', opacity: 0.2,  top: 300,  left: 50  },

  header:          { alignItems: 'center', marginBottom: 20, zIndex: 10, gap: 8 },
  welcomeTitle:    { fontSize: 32, fontWeight: 'bold', color: '#C2185B', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 16, color: '#EC407A', fontWeight: '500' },

  adminTab:     { backgroundColor: '#C2185B', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, zIndex: 10, shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  adminTabText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  messageCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10 },
  messageText: { flex: 1, fontSize: 15, color: '#C2185B', fontWeight: '500', lineHeight: 22 },

  loadingCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, zIndex: 10, flexDirection: 'row', gap: 12, justifyContent: 'center' },
  loadingText: { color: '#EC407A', fontSize: 14 },

  statusCard:      { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 16, zIndex: 10, borderWidth: 2 },
  statusCardOk:    { backgroundColor: '#E8F5E9', borderColor: '#66BB6A' },
  statusCardEmpty: { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  statusEmoji:     { fontSize: 24, marginRight: 12 },
  statusTitle:     { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  statusSub:       { fontSize: 13 },

  bleCard:    { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderWidth: 1.5, zIndex: 10 },
  bleCardOk:  { backgroundColor: '#E8F5E9', borderColor: '#66BB6A' },
  bleCardOff: { backgroundColor: '#FFF3E0', borderColor: '#FFA726' },
  bleTextOk:  { color: '#2E7D32', fontSize: 14, fontWeight: '500' },
  bleTextOff: { color: '#E65100', fontSize: 14, fontWeight: '500' },

  primaryButton:         { backgroundColor: '#EC407A', borderRadius: 24, padding: 28, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, zIndex: 10 },
  primaryButtonDisabled: { backgroundColor: '#BDBDBD', shadowOpacity: 0.2 },
  buttonContent:         { flexDirection: 'row', alignItems: 'center' },
  buttonTextContainer:   { flex: 1 },
  buttonTitle:           { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  buttonSubtitle:        { fontSize: 15, color: '#FCE4EC', fontWeight: '500' },

  infoButton:         { backgroundColor: 'white', borderRadius: 24, padding: 24, borderWidth: 2, borderColor: '#F8BBD0', marginBottom: 32, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10 },
  infoButtonTitle:    { fontSize: 22, fontWeight: 'bold', color: '#C2185B', marginBottom: 4 },
  infoButtonSubtitle: { fontSize: 14, color: '#F48FB1', fontWeight: '500' },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'white', borderRadius: 16, borderWidth: 2, borderColor: '#F8BBD0', zIndex: 10 },
  logoutText:   { color: '#EC407A', fontWeight: 'bold', fontSize: 16 },
});