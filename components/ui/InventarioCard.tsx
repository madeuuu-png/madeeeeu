// ============================================================
//  InventarioCard.tsx
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Package, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react-native';
import type { Inventario } from '../../lib/core/dataBase';

type Props = {
  inventario: Inventario | null;
  onRecargar: () => void;
};

export default function InventarioCard({ inventario, onRecargar }: Props) {
  const motor1       = inventario?.motor1 ?? 0;
  const motor2       = inventario?.motor2 ?? 0;
  const total        = motor1 + motor2;
  const vacio        = total === 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Package color="#C2185B" size={24} style={{ marginRight: 10 }} />
        <Text style={styles.title}>Inventario del dispensador</Text>
      </View>

      {/* Alerta de estado */}
      {vacio ? (
        <View style={styles.alertRed}>
          <AlertTriangle color="#C62828" size={22} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.alertTitleRed}>Dispensador vacío</Text>
            <Text style={styles.alertSubRed}>Ambos motores en 0. Recarga urgente.</Text>
          </View>
        </View>
      ) : total <= 4 ? (
        <View style={styles.alertOrange}>
          <AlertTriangle color="#E65100" size={22} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.alertTitleOrange}>Inventario bajo</Text>
            <Text style={styles.alertSubOrange}>Quedan solo {total} toallas en total.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.alertGreen}>
          <CheckCircle color="#2E7D32" size={22} style={{ marginRight: 10 }} />
          <Text style={styles.alertTitleGreen}>Inventario OK — {total} toallas disponibles</Text>
        </View>
      )}

      {/* Motores */}
      <View style={styles.motorRow}>
        {[{ label: 'Motor 1', val: motor1 }, { label: 'Motor 2', val: motor2 }].map((m, i) => (
          <React.Fragment key={m.label}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.motorBox}>
              <Text style={styles.motorLabel}>{m.label}</Text>
              <Text style={[styles.motorNum, m.val === 0 && styles.motorNumEmpty]}>{m.val}</Text>
              <Text style={styles.motorSub}>toallas</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={onRecargar} activeOpacity={0.8}>
        <RefreshCw color="white" size={20} style={{ marginRight: 10 }} />
        <Text style={styles.btnText}>Marcar inventario como recargado</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card:      { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  header:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title:     { fontSize: 18, fontWeight: 'bold', color: '#C2185B' },
  alertRed:    { backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#EF5350' },
  alertTitleRed:  { fontSize: 15, fontWeight: 'bold', color: '#C62828' },
  alertSubRed:    { fontSize: 13, color: '#D32F2F', marginTop: 2 },
  alertOrange:    { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#FFA726' },
  alertTitleOrange: { fontSize: 15, fontWeight: 'bold', color: '#E65100' },
  alertSubOrange:   { fontSize: 13, color: '#EF6C00', marginTop: 2 },
  alertGreen:    { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#66BB6A' },
  alertTitleGreen: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  motorRow:  { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 16 },
  motorBox:  { alignItems: 'center', flex: 1 },
  motorLabel: { fontSize: 14, color: '#F48FB1', fontWeight: '600', marginBottom: 4 },
  motorNum:   { fontSize: 40, fontWeight: 'bold', color: '#EC407A' },
  motorNumEmpty: { color: '#BDBDBD' },
  motorSub:   { fontSize: 12, color: '#F48FB1' },
  divider:    { width: 2, height: 60, backgroundColor: '#F8BBD0' },
  btn:      { backgroundColor: '#C2185B', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#C2185B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText:  { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
