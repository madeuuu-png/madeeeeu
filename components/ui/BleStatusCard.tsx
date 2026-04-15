import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Bluetooth, BluetoothOff } from 'lucide-react-native';

type Props = {
  conectado:  boolean;
  conectando: boolean;
  onPress:    () => void;
};

export default function BleStatusCard({ conectado, conectando, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, conectado ? styles.ok : styles.off]}
      onPress={onPress}
      disabled={conectando || conectado}
      activeOpacity={0.8}
    >
      {conectando ? (
        <>
          <ActivityIndicator size="small" color="#E65100" style={{ marginRight: 10 }} />
          <Text style={styles.textOff}>Buscando dispensador...</Text>
        </>
      ) : conectado ? (
        <>
          <Bluetooth color="#2E7D32" size={22} style={{ marginRight: 10 }} />
          <Text style={styles.textOk}>Dispensador conectado ✓</Text>
        </>
      ) : (
        <>
          <BluetoothOff color="#E65100" size={22} style={{ marginRight: 10 }} />
          <Text style={styles.textOff}>Toca para conectar el dispensador</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:    { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1.5 },
  ok:      { backgroundColor: '#E8F5E9', borderColor: '#66BB6A' },
  off:     { backgroundColor: '#FFF3E0', borderColor: '#FFA726' },
  textOk:  { color: '#2E7D32', fontSize: 14, fontWeight: '500' },
  textOff: { color: '#E65100', fontSize: 14, fontWeight: '500' },
});