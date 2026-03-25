// ============================================================
//  ADMIN — Panel administración Makana
//  Fix: al agregar estudiante también se inserta en cedulas SQLite
//  Fix: reset de cooldown individual desde el panel
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
  ActivityIndicator, TextInput, Alert, Modal
} from 'react-native';
import {
  ShieldCheck, ArrowLeft, Package, RefreshCw, Users,
  History, AlertTriangle, CheckCircle, Trash2, UserPlus,
  ChevronDown, ChevronUp, X, RotateCcw
} from 'lucide-react-native';
import { supabase } from '../lib/core/supabase/supabase';
import {
  obtenerInventario,
  recargarInventario,
  agregarCedulaLocal,       // <-- asegúrate de exportar esto desde database.ts (ver abajo)
  type Inventario,
} from '../lib/core/dataBase/database';

export default function Admin() {
  const router = useRouter();

  const [inventario,    setInventario]    = useState<Inventario | null>(null);

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
  }, []);

  // Actualiza inventario cada vez que entras a la pantalla
  useFocusEffect(
    useCallback(() => {
      const inv = obtenerInventario();
      setInventario(inv);
    }, [])
  );

  // ── Recargar inventario ─────────────────────────────────────
  const marcarInventarioRecargado = async () => {
    Alert.alert(
      'Confirmar recarga',
      '¿Confirmas que el dispensador fue recargado físicamente con 8+8 toallas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, recargar',
          onPress: () => {
            recargarInventario(8, 8);
            const inv = obtenerInventario();
            setInventario(inv);
            Alert.alert('✅ Listo', 'Inventario recargado a 8+8 toallas');
          }
        }
      ]
    );
  };

  // ── Historial ───────────────────────────────────────────────
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
    } catch {}
    finally { setCargandoHist(false); setMostrarHistorial(true); }
  };

  // ── Estudiantes ─────────────────────────────────────────────
  const cargarEstudiantes = async () => {
    if (mostrarEstudiantes) { setMostrarEstudiantes(false); return; }
    setCargandoEst(true);
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('NumDocumento, NombreCompleto, UltimaEntrega')
        .order('NombreCompleto', { ascending: true });
      if (!error && data) setEstudiantes(data);
    } catch {}
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
            const { error } = await supabase
              .from('estudiantes')
              .delete()
              .eq('NumDocumento', doc);
            if (error) { Alert.alert('Error', 'No se pudo eliminar'); return; }
            setEstudiantes(prev => prev.filter(e => e.NumDocumento !== doc));
          }
        }
      ]
    );
  };

  // ── Agregar estudiante ──────────────────────────────────────
  // FIX: también inserta la cédula en SQLite para que pueda
  //      hacer login sin internet en este dispositivo.
  const agregarEstudiante = async () => {
    const docLimpio    = nuevoDoc.trim();
    const nombreLimpio = nuevoNombre.trim();

    if (docLimpio.length !== 10) {
      Alert.alert('Error', 'La cédula debe tener 10 dígitos');
      return;
    }
    if (!nombreLimpio) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setGuardando(true);
    try {
      // 1. Insertar en Supabase
      const { error } = await supabase
        .from('estudiantes')
        .insert({ NumDocumento: docLimpio, NombreCompleto: nombreLimpio });

      if (error) {
        Alert.alert('Error', error.code === '23505' ? 'Esa cédula ya existe' : error.message);
        return;
      }

      // 2. FIX: insertar también en SQLite local para login offline
      agregarCedulaLocal(docLimpio);

      Alert.alert('✅ Listo', `${nombreLimpio} agregada correctamente`);
      setModalAgregar(false);
      setNuevoDoc('');
      setNuevoNombre('');

      // Refrescar lista si está visible
      if (mostrarEstudiantes) {
        setCargandoEst(true);
        const { data } = await supabase
          .from('estudiantes')
          .select('NumDocumento, NombreCompleto, UltimaEntrega')
          .order('NombreCompleto', { ascending: true });
        if (data) setEstudiantes(data);
        setCargandoEst(false);
      }
    } catch {
      Alert.alert('Error', 'Algo salió mal');
    } finally {
      setGuardando(false);
    }
  };

  // ── Reset cooldown individual ───────────────────────────────
  // Útil si una estudiante perdió su kit y necesita retirarlo de nuevo
  const resetearCooldown = (doc: string, nombre: string) => {
    Alert.alert(
      'Resetear cooldown',
      `¿Permitir que ${nombre} retire un kit ahora aunque no hayan pasado 28 días?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, resetear',
          onPress: async () => {
            const { error } = await supabase
              .from('estudiantes')
              .update({ UltimaEntrega: null })
              .eq('NumDocumento', doc);

            if (error) {
              Alert.alert('Error', 'No se pudo resetear el cooldown');
              return;
            }

            // Actualizar lista local
            setEstudiantes(prev =>
              prev.map(e =>
                e.NumDocumento === doc ? { ...e, UltimaEntrega: null } : e
              )
            );
            Alert.alert('✅ Listo', `Cooldown de ${nombre} reseteado`);
          }
        }
      ]
    );
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

          <TouchableOpacity
            style={styles.reloadBtn}
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
                      {est.UltimaEntrega && (
                        <Text style={styles.estudianteEntrega}>
                          Último kit: {new Date(est.UltimaEntrega).toLocaleDateString('es-EC', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </Text>
                      )}
                    </View>
                    {/* Botón reset cooldown */}
                    {est.UltimaEntrega && (
                      <TouchableOpacity
                        style={styles.resetBtn}
                        onPress={() => resetearCooldown(est.NumDocumento, est.NombreCompleto)}
                        activeOpacity={0.7}
                      >
                        <RotateCcw color="#E65100" size={16} />
                      </TouchableOpacity>
                    )}
                    {/* Botón eliminar */}
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

      {/* ── MODAL AGREGAR ── */}
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
  reloadBtn:     { backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  reloadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  historialItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCE4EC' },
  historialNombre: { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  historialDoc:    { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  historialFecha:  { fontSize: 12, color: '#EC407A', fontWeight: '600' },
  emptyText:       { color: '#F48FB1', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCE4EC', borderRadius: 12, paddingVertical: 12, marginTop: 4, borderWidth: 1.5, borderColor: '#F8BBD0' },
  addBtnText: { color: '#C2185B', fontWeight: 'bold', fontSize: 14 },
  estudianteItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCE4EC', gap: 8 },
  estudianteNombre:  { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  estudianteDoc:     { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  estudianteEntrega: { fontSize: 11, color: '#E65100', marginTop: 2 },
  resetBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
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