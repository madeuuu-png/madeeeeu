// ============================================================
//  HistorialCard.tsx
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { History, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { HistorialItem } from '../../hooks/useAdmin';

type Props = {
  historial: HistorialItem[];
  mostrar:   boolean;
  cargando:  boolean;
  onToggle:  () => void;
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

export default function HistorialCard({ historial, mostrar, cargando, onToggle }: Props) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <History color="#C2185B" size={24} style={{ marginRight: 10 }} />
        <Text style={styles.title}>Historial de Entregas</Text>
        {cargando
          ? <ActivityIndicator size="small" color="#EC407A" style={styles.icon} />
          : mostrar
            ? <ChevronUp   color="#C2185B" size={20} style={styles.icon} />
            : <ChevronDown color="#C2185B" size={20} style={styles.icon} />
        }
      </TouchableOpacity>

      {mostrar && (
        <View style={{ marginTop: 12 }}>
          {historial.length === 0
            ? <Text style={styles.empty}>No hay entregas registradas aún</Text>
            : historial.map((item, i) => (
                <View key={i} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombre}>{item.NombreCompleto}</Text>
                    <Text style={styles.doc}>CI: {item.NumDocumento}</Text>
                  </View>
                  <Text style={styles.fecha}>{formatFecha(item.UltimaEntrega)}</Text>
                </View>
              ))
          }
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:   { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title:  { fontSize: 18, fontWeight: 'bold', color: '#C2185B' },
  icon:   { marginLeft: 'auto' },
  row:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FCE4EC' },
  nombre: { fontSize: 14, fontWeight: '600', color: '#C2185B' },
  doc:    { fontSize: 12, color: '#F48FB1', marginTop: 2 },
  fecha:  { fontSize: 12, color: '#EC407A', fontWeight: '600' },
  empty:  { color: '#F48FB1', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
});
