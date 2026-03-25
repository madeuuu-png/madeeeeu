import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
  ActivityIndicator, TextInput, Alert, Modal,
  PermissionsAndroid, Platform
} from 'react-native';
import {
  ShieldCheck, ArrowLeft, Package, RefreshCw, Users,
  History, AlertTriangle, CheckCircle, Trash2, UserPlus,
  ChevronDown, ChevronUp, X, Bluetooth, BluetoothOff
} from 'lucide-react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { supabase } from '../lib/core/supabase/supabase';
import {
  obtenerInventario,
  recargarInventario,
  type Inventario,
} from '../lib/core/dataBase/database';

const SERVICE_UUID        = '12345678-1234-1234-1234-123456789abc';
const CHARACTERISTIC_UUID = 'abcd1234-ab12-ab12-ab12-abcdef123456';
const ESP32_MAC           = '08:D1:F9:C8:D5:3E';

const bleManager = new BleManager();

export default function Admin() {
  const router = useRouter();

  const [inventario,    setInventario]    = useState<Inventario | null>(null);
  const [bleConectado,  setBleConectado]  = useState(false);
  const [bleConectando, setBleConectando] = useState(false);
  const dispositivoRef = useRef<Device | null>(null);

  const [historial,        setHistorial]        = useState<any[]>([]);
  const [mostrarHistorial, setMostrarHistorial]  = useState(false);
  const [cargandoHist,     setCargandoHist]      = useState(false);

  const [estudiantes,        setEstudiantes]        = useState<any[]>([]);
  const [mostrarEstudiantes, setMostrarEstudiantes] = useState(false);
  const [cargandoEst,        setCargandoEst]        = useState(false);
  const [modalAgregar,       setModalAgregar]       = useState(false);
  const [nuevoDoc,           setNuevoDoc]           = useState('');
  const [nuevoNombre,        setNuevoNombre]        = useState('');
  const [guardando,          setGuardando]          = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const flag = await AsyncStorage.getItem('esAdmin');
      if (flag !== 'true') { router.replace('/home'); return; }
    };
    verificar();

    // Cargar inventario desde SQLite al abrir
    const inv = obtenerInventario();
    setInventario(inv);

    return () => { bleManager.stopDeviceScan(); };
  }, []);

  // ── Conectar BLE ───────────────────────────────────────────
  const conectarBLE = async () => {
    if (bleConectando || bleConectado) return;

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
    const estado = await bleManager.state();
    if (estado !== 'PoweredOn') {
      Alert.alert('Bluetooth apagado', 'Por favor activa el Bluetooth e intenta de nuevo.');
      return;
    }

    setBleConectando(true);

    bleManager.startDeviceScan([SERVICE_UUID], null, async (error, device) => {
      if (error) {
        setBleConectando(false);
        Alert.alert('Error Bluetooth', 'Error al escanear: ' + error.message);
        return;
      }

      console.log('[BLE Admin] Dispositivo:', device?.name, '|', device?.localName, '| ID:', device?.id);

      const esPorMAC    = device?.id === ESP32_MAC;
      const nombreDev   = device?.name || device?.localName || '';
      const esPorNombre = nombreDev.includes('MAKANA');

      if (!esPorMAC && !esPorNombre) return;

      bleManager.stopDeviceScan();

      try {
        const conectado = await device!.connect();
        await new Promise(r => setTimeout(r, 500));
        await conectado.discoverAllServicesAndCharacteristics();
        dispositivoRef.current = conectado;
        setBleConectado(true);
        setBleConectando(false);

        conectado.onDisconnected(() => {
          setBleConectado(false);
          dispositivoRef.current = null;
        });

      } catch {
        setBleConectando(false);
        Alert.alert('Error', 'No se pudo conectar. Reinicia el ESP32 e intenta de nuevo.');
      }
    });

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
        suscripcion = device.monitorCharacteristicForService(
          SERVICE_UUID, CHARACTERISTIC_UUID,
          (err, char) => {
            clearTimeout(timeout);
            suscripcion?.remove();
            if (err || !char?.value) return resolve(null);
            resolve(Buffer.from(char.value, 'base64').toString('utf-8'));
          }
        );

        await new Promise(r => setTimeout(r, 100));
        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID, CHARACTERISTIC_UUID,
          Buffer.from(comando).toString('base64')
        );

      } catch {
        clearTimeout(timeout);
        suscripcion?.remove();
        resolve(null);
      }
    });
  };

  // ── Recargar inventario ────────────────────────────────────
  const marcarInventarioRecargado = async () => {
    if (!bleConectado) {
      Alert.alert('Sin conexión', 'Conecta el dispensador por Bluetooth primero');
      return;
    }
    Alert.alert(
      'Confirmar recarga',
      '¿Confirmas que el dispensador fue recargado físicamente con 8+8 toallas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, recargar',
          onPress: async () => {
            // Avisar al ESP32 para que resetee su turno de motores
            await enviarComandoBLE('RECARGAR');

            // SQLite es la fuente de verdad
            recargarInventario(8, 8);
            const inv = obtenerInventario();
            setInventario(inv);

            Alert.alert('✅ Listo', 'Inventario recargado a 8+8 toallas');
          }
        }
      ]
    );
  };

  // ── Historial ──────────────────────────────────────────────
  const cargarHistorial = async () => {
    if (mostrarHistorial) { setMostrarHistorial(false); return; }
    setCargandoHist(true);
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('NombreCompleto, NumDocumento, UltimaEntrega')
        .not('UltimaEntrega', 'is', null)
        .order('UltimaEntrega', { ascending: false })
        .limit(50);
      if (!error && data) setHistorial(data);
    } catch { }
    finally { setCargandoHist(false); setMostrarHistorial(true); }
  };

  // ── Estudiantes ────────────────────────────────────────────
  const cargarEstudiantes = async () => {
    if (mostrarEstudiantes) { setMostrarEstudiantes(false); return; }
    setCargandoEst(true);
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('NumDocumento, NombreCompleto, UltimaEntrega')
        .order('NombreCompleto', { ascending: true });
      if (!error && data) setEstudiantes(data);
    } catch { }
    finally { setCargandoEst(false); setMostrarEstudiantes(true); }
  };

  const eliminarEstudiante = (doc: string, nombre: string) => {
    Alert.alert(
      'Eliminar estudiante',
      `¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('estudiantes').delete().eq('NumDocumento', doc);
            if (error) { Alert.alert('Error', 'No se pudo eliminar'); return; }
            setEstudiantes(prev => prev.filter(e => e.NumDocumento !== doc));
          }
        }
      ]
    );
  };

  const agregarEstudiante = async () => {
    if (nuevoDoc.length !== 10) { Alert.alert('Error', 'La cédula debe tener 10 dígitos'); return; }
    if (!nuevoNombre.trim())    { Alert.alert('Error', 'El nombre no puede estar vacío'); return; }
    setGuardando(true);
    try {
      const { error } = await supabase
        .from('estudiantes')
        .insert({ NumDocumento: nuevoDoc.trim(), NombreCompleto: nuevoNombre.trim() });
      if (error) {
        Alert.alert('Error', error.code === '23505' ? 'Esa cédula ya existe' : error.message);
        return;
      }
      Alert.alert('✅ Listo', `${nuevoNombre} agregada correctamente`);
      setModalAgregar(false);
      setNuevoDoc(''); setNuevoNombre('');
      if (mostrarEstudiantes) cargarEstudiantes();
    } catch {
      Alert.alert('Error', 'Algo salió mal');
    }
    finally { setGuardando(false); }
  };

  const motor1       = inventario?.motor1 ?? 0;
  const motor2       = inventario?.motor2 ?? 0;
  const totalToallas = motor1 + motor2;
  const sinToallas   = totalToallas === 0;

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft color="#EC407A" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Panel Admin</Text>
          </View>
          <ShieldCheck color="#C2185B" size={28} />
        </View>

        {/* ── INVENTARIO ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Package color="#C2185B" size={24} style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Inventario del dispensador</Text>
          </View>

          {/* Alerta de estado — siempre visible, sin necesitar BLE */}
          {sinToallas ? (
            <View style={styles.alertCardRed}>
              <AlertTriangle color="#C62828" size={22} style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.alertTitleRed}>Dispensador vacío</Text>
                <Text style={styles.alertSubRed}>Ambos motores en 0. Recarga urgente.</Text>
              </View>
            </View>
          ) : totalToallas <= 4 ? (
            <View style={styles.alertCardOrange}>
              <AlertTriangle color="#E65100" size={22} style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.alertTitleOrange}>Inventario bajo</Text>
                <Text style={styles.alertSubOrange}>Quedan solo {totalToallas} toallas en total.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.alertCardGreen}>
              <CheckCircle color="#2E7D32" size={22} style={{ marginRight: 10 }} />
              <Text style={styles.alertTitleGreen}>Inventario OK — {totalToallas} toallas disponibles</Text>
            </View>
          )}

          {/* Conteo por motor */}
          <View style={styles.motorRow}>
            <View style={styles.motorBox}>
              <Text style={styles.motorLabel}>Motor 1</Text>
              <Text style={[styles.motorNum, motor1 === 0 && styles.motorNumEmpty]}>{motor1}</Text>
              <Text style={styles.motorSub}>toallas</Text>
            </View>
            <View style={styles.motorDivider} />
            <View style={styles.motorBox}>
              <Text style={styles.motorLabel}>Motor 2</Text>
              <Text style={[styles.motorNum, motor2 === 0 && styles.motorNumEmpty]}>{motor2}</Text>
              <Text style={styles.motorSub}>toallas</Text>
            </View>
          </View>

          {/* BLE — solo para enviar RECARGAR al ESP32 */}
          <TouchableOpacity
            style={[styles.bleCard, bleConectado ? styles.bleCardOk : styles.bleCardOff]}
            onPress={conectarBLE}
            activeOpacity={bleConectado ? 1 : 0.8}
            disabled={bleConectado || bleConectando}
          >
            {bleConectando ? (
              <>
                <ActivityIndicator size="small" color="#E65100" style={{ marginRight: 10 }} />
                <Text style={styles.bleTextOff}>Buscando dispensador...</Text>
              </>
            ) : bleConectado ? (
              <>
                <Bluetooth color="#2E7D32" size={20} style={{ marginRight: 10 }} />
                <Text style={styles.bleTextOk}>Dispensador conectado ✓</Text>
              </>
            ) : (
              <>
                <BluetoothOff color="#E65100" size={20} style={{ marginRight: 10 }} />
                <Text style={styles.bleTextOff}>Conectar para enviar recarga al dispensador</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reloadBtn, !bleConectado && styles.reloadBtnDisabled]}
            onPress={marcarInventarioRecargado}
            activeOpacity={0.8}
          >
            <RefreshCw color="white" size={20} style={{ marginRight: 10 }} />
            <Text style={styles.reloadBtnText}>Marcar inventario como recargado</Text>
          </TouchableOpacity>
        </View>

        {/* ── HISTORIAL ── */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.sectionHeader} onPress={cargarHistorial} activeOpacity={0.7}>
            <History color="#C2185B" size={24} style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Historial de Entregas</Text>
            {cargandoHist
              ? <ActivityIndicator size="small" color="#EC407A" style={{ marginLeft: 'auto' }} />
              : mostrarHistorial
                ? <ChevronUp   color="#C2185B" size={20} style={{ marginLeft: 'auto' }} />
                : <ChevronDown color="#C2185B" size={20} style={{ marginLeft: 'auto' }} />
            }
          </TouchableOpacity>

          {mostrarHistorial && (
            <View style={{ marginTop: 12 }}>
              {historial.length === 0 ? (
                <Text style={styles.emptyText}>No hay entregas registradas aún</Text>
              ) : (
                historial.map((item, i) => (
                  <View key={i} style={styles.historialItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historialNombre}>{item.NombreCompleto}</Text>
                      <Text style={styles.historialDoc}>CI: {item.NumDocumento}</Text>
                    </View>
                    <Text style={styles.historialFecha}>
                      {new Date(item.UltimaEntrega).toLocaleDateString('es-EC', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── ESTUDIANTES ── */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.sectionHeader} onPress={cargarEstudiantes} activeOpacity={0.7}>
            <Users color="#C2185B" size={24} style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Gestionar Estudiantes</Text>
            {cargandoEst
              ? <ActivityIndicator size="small" color="#EC407A" style={{ marginLeft: 'auto' }} />
              : mostrarEstudiantes
                ? <ChevronUp   color="#C2185B" size={20} style={{ marginLeft: 'auto' }} />
                : <ChevronDown color="#C2185B" size={20} style={{ marginLeft: 'auto' }} />
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.addBtn} onPress={() => setModalAgregar(true)} activeOpacity={0.8}>
            <UserPlus color="#C2185B" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>Agregar estudiante</Text>
          </TouchableOpacity>

          {mostrarEstudiantes && (
            <View style={{ marginTop: 8 }}>
              {estudiantes.length === 0 ? (
                <Text style={styles.emptyText}>No hay estudiantes registradas</Text>
              ) : (
                estudiantes.map((est, i) => (
                  <View key={i} style={styles.estudianteItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.estudianteNombre}>{est.NombreCompleto}</Text>
                      <Text style={styles.estudianteDoc}>CI: {est.NumDocumento}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => eliminarEstudiante(est.NumDocumento, est.NombreCompleto)}
                      activeOpacity={0.7}
                    >
                      <Trash2 color="#C62828" size={18} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.backBottomBtn} onPress={() => router.push('/home')} activeOpacity={0.8}>
          <ArrowLeft color="white" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.backBottomText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL ── */}
      <Modal visible={modalAgregar} transparent animationType="slide" onRequestClose={() => setModalAgregar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Estudiante</Text>
              <TouchableOpacity onPress={() => setModalAgregar(false)}>
                <X color="#C2185B" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Número de cédula</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalInputText}
                placeholder="0000000000"
                placeholderTextColor="#F8BBD0"
                value={nuevoDoc}
                onChangeText={setNuevoDoc}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <Text style={styles.modalLabel}>Nombre completo</Text>
            <View style={styles.modalInput}>
              <TextInput
                style={styles.modalInputText}
                placeholder="Nombre Apellido"
                placeholderTextColor="#F8BBD0"
                value={nuevoNombre}
                onChangeText={setNuevoNombre}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalSaveBtn, guardando && { opacity: 0.6 }]}
              onPress={agregarEstudiante}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.modalSaveBtnText}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#FCE4EC' },
  container:  { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  circle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#F48FB1', opacity: 0.12, top: -80,  right: -50 },
  circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#EC407A', opacity: 0.08, bottom: 100, left: -60 },
  header:      { flexDirection: 'row', alignItems: 'center', marginBottom: 24, zIndex: 10 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#C2185B' },
  sectionCard:   { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 18, fontWeight: 'bold', color: '#C2185B' },
  bleCard:    { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, borderWidth: 1.5 },
  bleCardOk:  { backgroundColor: '#E8F5E9', borderColor: '#66BB6A' },
  bleCardOff: { backgroundColor: '#FFF3E0', borderColor: '#FFA726' },
  bleTextOk:  { color: '#2E7D32', fontSize: 14, fontWeight: '500' },
  bleTextOff: { color: '#E65100', fontSize: 14, fontWeight: '500' },
  alertCardRed:    { backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#EF5350' },
  alertTitleRed:   { fontSize: 15, fontWeight: 'bold', color: '#C62828' },
  alertSubRed:     { fontSize: 13, color: '#D32F2F', marginTop: 2 },
  alertCardOrange: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#FFA726' },
  alertTitleOrange:{ fontSize: 15, fontWeight: 'bold', color: '#E65100' },
  alertSubOrange:  { fontSize: 13, color: '#EF6C00', marginTop: 2 },
  alertCardGreen:  { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#66BB6A' },
  alertTitleGreen: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  motorRow:      { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
  motorBox:      { alignItems: 'center', flex: 1 },
  motorLabel:    { fontSize: 14, color: '#F48FB1', fontWeight: '600', marginBottom: 4 },
  motorNum:      { fontSize: 40, fontWeight: 'bold', color: '#EC407A' },
  motorNumEmpty: { color: '#BDBDBD' },
  motorSub:      { fontSize: 12, color: '#F48FB1' },
  motorDivider:  { width: 2, height: 60, backgroundColor: '#F8BBD0' },
  reloadBtn:         { backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  reloadBtnDisabled: { backgroundColor: '#BDBDBD', shadowOpacity: 0.1, elevation: 0 },
  reloadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  historialItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCE4EC' },
  historialNombre: { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  historialDoc:    { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  historialFecha:  { fontSize: 12, color: '#EC407A', fontWeight: '600' },
  emptyText:       { color: '#F48FB1', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCE4EC', borderRadius: 12, paddingVertical: 12, marginTop: 4, borderWidth: 1.5, borderColor: '#F8BBD0' },
  addBtnText: { color: '#C2185B', fontWeight: 'bold', fontSize: 14 },
  estudianteItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCE4EC' },
  estudianteNombre: { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  estudianteDoc:    { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  deleteBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
  backBottomBtn:  { backgroundColor: '#EC407A', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, zIndex: 10 },
  backBottomText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard:       { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:      { fontSize: 22, fontWeight: 'bold', color: '#C2185B' },
  modalLabel:      { fontSize: 14, color: '#C2185B', fontWeight: '600', marginBottom: 8 },
  modalInput:      { backgroundColor: '#FCE4EC', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 20, borderWidth: 2, borderColor: '#F8BBD0' },
  modalInputText:  { fontSize: 16, color: '#C2185B', fontWeight: '600' },
  modalSaveBtn:    { backgroundColor: '#EC407A', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalSaveBtnText:{ color: 'white', fontSize: 18, fontWeight: 'bold' },
});