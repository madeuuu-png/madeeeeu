// ============================================================
//  EstudiantesCard.tsx
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Users, ChevronDown, ChevronUp, UserPlus, RotateCcw, Trash2 } from 'lucide-react-native';
import type { Estudiante } from '../../hooks/useAdmin';

type Props = {
  estudiantes:      Estudiante[];
  mostrar:          boolean;
  cargando:         boolean;
  onToggle:         () => void;
  onAbrirModal:     () => void;
  onEliminar:       (doc: string, nombre: string) => void;
  onResetCooldown:  (doc: string, nombre: string) => void;
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

export default function EstudiantesCard({
  estudiantes, mostrar, cargando,
  onToggle, onAbrirModal, onEliminar, onResetCooldown,
}: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <Users color="#C2185B" size={24} style={{ marginRight: 10 }} />
        <Text style={styles.title}>Gestionar Estudiantes</Text>
        {cargando
          ? <ActivityIndicator size="small" color="#EC407A" style={styles.icon} />
          : mostrar
            ? <ChevronUp   color="#C2185B" size={20} style={styles.icon} />
            : <ChevronDown color="#C2185B" size={20} style={styles.icon} />
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.addBtn} onPress={onAbrirModal} activeOpacity={0.8}>
        <UserPlus color="#C2185B" size={18} style={{ marginRight: 8 }} />
        <Text style={styles.addBtnText}>Agregar estudiante</Text>
      </TouchableOpacity>

      {mostrar && (
        <View style={{ marginTop: 8 }}>
          {estudiantes.length === 0
            ? <Text style={styles.empty}>No hay estudiantes registradas</Text>
            : estudiantes.map((est, i) => (
                <View key={i} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombre}>{est.NombreCompleto}</Text>
                    <Text style={styles.doc}>CI: {est.NumDocumento}</Text>
                    {est.UltimaEntrega && (
                      <Text style={styles.entrega}>
                        Último kit: {formatFecha(est.UltimaEntrega)}
                      </Text>
                    )}
                  </View>

                  {est.UltimaEntrega && (
                    <TouchableOpacity
                      style={styles.resetBtn}
                      onPress={() => onResetCooldown(est.NumDocumento, est.NombreCompleto)}
                      activeOpacity={0.7}
                    >
                      <RotateCcw color="#E65100" size={16} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onEliminar(est.NumDocumento, est.NombreCompleto)}
                    activeOpacity={0.7}
                  >
                    <Trash2 color="#C62828" size={18} />
                  </TouchableOpacity>
                </View>
              ))
          }
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  header:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title:   { fontSize: 18, fontWeight: 'bold', color: '#C2185B' },
  icon:    { marginLeft: 'auto' },
  addBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCE4EC', borderRadius: 12, paddingVertical: 12, marginTop: 4, borderWidth: 1.5, borderColor: '#F8BBD0' },
  addBtnText: { color: '#C2185B', fontWeight: 'bold', fontSize: 14 },
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCE4EC', gap: 8 },
  nombre:  { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  doc:     { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  entrega: { fontSize: 11, color: '#E65100', marginTop: 2 },
  resetBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
  empty:   { color: '#F48FB1', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
});
