import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
  ActivityIndicator, TextInput, Alert, Modal
} from 'react-native';
import {
  ShieldCheck, ArrowLeft, Package, RefreshCw, Users,
  History, AlertTriangle, CheckCircle, Trash2, UserPlus,
  ChevronDown, ChevronUp, X
} from 'lucide-react-native';
import { supabase } from '../lib/core/supabase/supabase';

export default function Admin() {
  const router = useRouter();

  // Inventario
  const [motor1, setMotor1] = useState(0);
  const [motor2, setMotor2] = useState(0);
  const [cargandoInv, setCargandoInv] = useState(true);

  // Historial
  const [historial, setHistorial] = useState<any[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHist, setCargandoHist] = useState(false);

  // Estudiantes
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [mostrarEstudiantes, setMostrarEstudiantes] = useState(false);
  const [cargandoEst, setCargandoEst] = useState(false);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [nuevoDoc, setNuevoDoc] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    // Verificar que sea admin
    const verificar = async () => {
      const flag = await AsyncStorage.getItem("esAdmin");
      if (flag !== "true") { router.replace('/home'); return; }
      cargarInventario();
    };
    verificar();

    const intervalo = setInterval(cargarInventario, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // ── Inventario ──────────────────────────────────────────
  const cargarInventario = async () => {
    try {
      const { data, error } = await supabase
        .from("inventario")
        .select("motor1_toallas, motor2_toallas")
        .order('id', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        setMotor1(data.motor1_toallas);
        setMotor2(data.motor2_toallas);
      }
    } catch { }
    finally { setCargandoInv(false); }
  };

  // Botón "Inventario recargado" — solo actualiza la BD con valores máximos
  const marcarInventarioRecargado = async () => {
    Alert.alert(
      "Confirmar recarga",
      "¿Confirmas que el dispensador fue recargado físicamente? Esto actualizará el inventario a máximo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, recargar",
          onPress: async () => {
            try {
              // Obtener el id del registro actual
              const { data: actual } = await supabase
                .from("inventario")
                .select("id")
                .order('id', { ascending: false })
                .limit(1)
                .single();

              if (!actual) { Alert.alert("Error", "No se encontró el registro de inventario"); return; }

              const { error } = await supabase
                .from("inventario")
                .update({ motor1_toallas: 9, motor2_toallas: 9 })
                .eq('id', actual.id);

              if (error) { Alert.alert("Error", "No se pudo actualizar el inventario"); return; }

              setMotor1(9);
              setMotor2(9);
              Alert.alert("✅ Listo", "Inventario actualizado a máximo (9+9 toallas)");
            } catch {
              Alert.alert("Error", "Algo salió mal");
            }
          }
        }
      ]
    );
  };

  // ── Historial ────────────────────────────────────────────
  const cargarHistorial = async () => {
    if (mostrarHistorial) { setMostrarHistorial(false); return; }
    setCargandoHist(true);
    try {
      const { data, error } = await supabase
        .from("estudiantes")
        .select("NombreCompleto, NumDocumento, UltimaEntrega")
        .not("UltimaEntrega", "is", null)
        .order("UltimaEntrega", { ascending: false })
        .limit(50);
      if (!error && data) setHistorial(data);
    } catch { }
    finally { setCargandoHist(false); setMostrarHistorial(true); }
  };

  // ── Estudiantes ──────────────────────────────────────────
  const cargarEstudiantes = async () => {
    if (mostrarEstudiantes) { setMostrarEstudiantes(false); return; }
    setCargandoEst(true);
    try {
      const { data, error } = await supabase
        .from("estudiantes")
        .select("NumDocumento, NombreCompleto, UltimaEntrega")
        .order("NombreCompleto", { ascending: true });
      if (!error && data) setEstudiantes(data);
    } catch { }
    finally { setCargandoEst(false); setMostrarEstudiantes(true); }
  };

  const eliminarEstudiante = (doc: string, nombre: string) => {
    Alert.alert(
      "Eliminar estudiante",
      `¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("estudiantes").delete().eq("NumDocumento", doc);
            if (error) { Alert.alert("Error", "No se pudo eliminar"); return; }
            setEstudiantes(prev => prev.filter(e => e.NumDocumento !== doc));
          }
        }
      ]
    );
  };

  const agregarEstudiante = async () => {
    if (nuevoDoc.length !== 10) { Alert.alert("Error", "La cédula debe tener 10 dígitos"); return; }
    if (!nuevoNombre.trim()) { Alert.alert("Error", "El nombre no puede estar vacío"); return; }
    setGuardando(true);
    try {
      const { error } = await supabase
        .from("estudiantes")
        .insert({ NumDocumento: nuevoDoc.trim(), NombreCompleto: nuevoNombre.trim() });
      if (error) {
        Alert.alert("Error", error.code === "23505" ? "Esa cédula ya existe" : error.message);
        return;
      }
      Alert.alert("✅ Listo", `${nuevoNombre} agregada correctamente`);
      setModalAgregar(false);
      setNuevoDoc(""); setNuevoNombre("");
      // Refrescar lista si está abierta
      if (mostrarEstudiantes) cargarEstudiantes();
    } catch {
      Alert.alert("Error", "Algo salió mal");
    }
    finally { setGuardando(false); }
  };

  const totalToallas = motor1 + motor2;
  const sinToallas = totalToallas === 0;

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Header */}
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
            <Text style={styles.sectionTitle}>Inventario</Text>
          </View>

          {cargandoInv ? (
            <ActivityIndicator color="#EC407A" style={{ marginVertical: 16 }} />
          ) : (
            <>
              {/* Alerta específica para admins */}
              {sinToallas ? (
                <View style={styles.alertCardRed}>
                  <AlertTriangle color="#C62828" size={22} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.alertTitleRed}>⚠️ Dispensador vacío</Text>
                    <Text style={styles.alertSubRed}>Ambos motores en 0. Recarga urgente necesaria.</Text>
                  </View>
                </View>
              ) : totalToallas <= 4 ? (
                <View style={styles.alertCardOrange}>
                  <AlertTriangle color="#E65100" size={22} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.alertTitleOrange}>⚠️ Inventario bajo</Text>
                    <Text style={styles.alertSubOrange}>Quedan solo {totalToallas} toallas en total.</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.alertCardGreen}>
                  <CheckCircle color="#2E7D32" size={22} style={{ marginRight: 10 }} />
                  <Text style={styles.alertTitleGreen}>Inventario OK — {totalToallas} toallas disponibles</Text>
                </View>
              )}

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

              {/* Botón recargar inventario */}
              <TouchableOpacity style={styles.reloadBtn} onPress={marcarInventarioRecargado} activeOpacity={0.8}>
                <RefreshCw color="white" size={20} style={{ marginRight: 10 }} />
                <Text style={styles.reloadBtnText}>Marcar inventario como recargado</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── HISTORIAL ── */}
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.sectionHeader} onPress={cargarHistorial} activeOpacity={0.7}>
            <History color="#C2185B" size={24} style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Historial de Entregas</Text>
            {cargandoHist
              ? <ActivityIndicator size="small" color="#EC407A" style={{ marginLeft: 'auto' }} />
              : mostrarHistorial
                ? <ChevronUp color="#C2185B" size={20} style={{ marginLeft: 'auto' }} />
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
                ? <ChevronUp color="#C2185B" size={20} style={{ marginLeft: 'auto' }} />
                : <ChevronDown color="#C2185B" size={20} style={{ marginLeft: 'auto' }} />
            }
          </TouchableOpacity>

          {/* Botón agregar siempre visible */}
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

        {/* Volver */}
        <TouchableOpacity style={styles.backBottomBtn} onPress={() => router.push('/home')} activeOpacity={0.8}>
          <ArrowLeft color="white" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.backBottomText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL AGREGAR ESTUDIANTE ── */}
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
  container: { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  circle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#F48FB1', opacity: 0.12, top: -80, right: -50 },
  circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#EC407A', opacity: 0.08, bottom: 100, left: -60 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, zIndex: 10 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#C2185B' },

  sectionCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#C2185B' },

  // Alertas inventario
  alertCardRed: { backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#EF5350' },
  alertTitleRed: { fontSize: 15, fontWeight: 'bold', color: '#C62828' },
  alertSubRed: { fontSize: 13, color: '#D32F2F', marginTop: 2 },
  alertCardOrange: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#FFA726' },
  alertTitleOrange: { fontSize: 15, fontWeight: 'bold', color: '#E65100' },
  alertSubOrange: { fontSize: 13, color: '#EF6C00', marginTop: 2 },
  alertCardGreen: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#66BB6A' },
  alertTitleGreen: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },

  motorRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
  motorBox: { alignItems: 'center', flex: 1 },
  motorLabel: { fontSize: 14, color: '#F48FB1', fontWeight: '600', marginBottom: 4 },
  motorNum: { fontSize: 40, fontWeight: 'bold', color: '#EC407A' },
  motorNumEmpty: { color: '#BDBDBD' },
  motorSub: { fontSize: 12, color: '#F48FB1' },
  motorDivider: { width: 2, height: 60, backgroundColor: '#F8BBD0' },

  reloadBtn: {
    backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  reloadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  // Historial
  historialItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FCE4EC',
  },
  historialNombre: { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  historialDoc: { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  historialFecha: { fontSize: 12, color: '#EC407A', fontWeight: '600' },
  emptyText: { color: '#F48FB1', fontSize: 14, textAlign: 'center', paddingVertical: 12 },

  // Estudiantes
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FCE4EC', borderRadius: 12, paddingVertical: 12,
    marginTop: 12, borderWidth: 1.5, borderColor: '#F8BBD0',
  },
  addBtnText: { color: '#C2185B', fontWeight: 'bold', fontSize: 14 },
  estudianteItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FCE4EC',
  },
  estudianteNombre: { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  estudianteDoc: { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFEBEE',
    justifyContent: 'center', alignItems: 'center',
  },

  backBottomBtn: {
    backgroundColor: '#EC407A', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 8, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  backBottomText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#C2185B' },
  modalLabel: { fontSize: 14, color: '#C2185B', fontWeight: '600', marginBottom: 8 },
  modalInput: {
    backgroundColor: '#FCE4EC', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
    marginBottom: 20, borderWidth: 2, borderColor: '#F8BBD0',
  },
  modalInputText: { fontSize: 16, color: '#C2185B', fontWeight: '600' },
  modalSaveBtn: {
    backgroundColor: '#EC407A', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalSaveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
