// ============================================================
//  admin.tsx — Panel de administración Makana
//  Solo orquesta: toda la lógica vive en hooks/useAdmin.ts
// ============================================================

import { storageAdapter } from '@/lib/core/storage/storage.adapter';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';

import BackgroundCircles          from '@/components/layout/BackgroundCircles';
import InventarioCard             from '@/components/ui/InventarioCard';
import HistorialCard              from '@/components/ui/HistorialCard';
import EstudiantesCard            from '@/components/ui/EstudiantesCard';
import ModalAgregarEstudiante     from '@/components/ui/ModalAgregarEstudiante';
import { useInventario, useHistorial, useEstudiantes } from '../lib/hooks/useAdmin';

export default function Admin() {
  const router      = useRouter();
  const inventario  = useInventario();
  const historial   = useHistorial();
  const estudiantes = useEstudiantes();

  // Redirige si no es admin
  useEffect(() => {
    storageAdapter.getItem('esAdmin').then(flag => {
      if (flag !== 'true') router.replace('/home');
    });
  }, []);

  // Refresca inventario cada vez que entras a la pantalla
  useFocusEffect(useCallback(() => { inventario.refrescar(); }, []));

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <BackgroundCircles variant="admin" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft color="#EC407A" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panel Admin</Text>
          <ShieldCheck color="#C2185B" size={28} />
        </View>

        {/* Secciones */}
        <InventarioCard
          inventario={inventario.inventario}
          onRecargar={inventario.marcarRecargado}
        />

        <HistorialCard
          historial={historial.historial}
          mostrar={historial.mostrar}
          cargando={historial.cargando}
          onToggle={historial.toggleHistorial}
        />

        <EstudiantesCard
          estudiantes={estudiantes.estudiantes}
          mostrar={estudiantes.mostrar}
          cargando={estudiantes.cargando}
          onToggle={estudiantes.toggleEstudiantes}
          onAbrirModal={() => estudiantes.setModalAbierto(true)}
          onEliminar={estudiantes.eliminar}
          onResetCooldown={estudiantes.resetearCooldown}
        />

        <TouchableOpacity style={styles.backBottomBtn} onPress={() => router.push('/home')} activeOpacity={0.8}>
          <ArrowLeft color="white" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.backBottomText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <ModalAgregarEstudiante
        visible={estudiantes.modalAbierto}
        nuevoDoc={estudiantes.nuevoDoc}
        nuevoNombre={estudiantes.nuevoNombre}
        guardando={estudiantes.guardando}
        onChangeDoc={estudiantes.setNuevoDoc}
        onChangeNombre={estudiantes.setNuevoNombre}
        onGuardar={estudiantes.agregar}
        onCerrar={() => estudiantes.setModalAbierto(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:         { flex: 1, backgroundColor: '#FCE4EC' },
  container:      { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  header:         { flexDirection: 'row', alignItems: 'center', marginBottom: 24, zIndex: 10 },
  backBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  headerTitle:    { flex: 1, fontSize: 26, fontWeight: 'bold', color: '#C2185B' },
  backBottomBtn:  { backgroundColor: '#EC407A', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, zIndex: 10 },
  backBottomText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});