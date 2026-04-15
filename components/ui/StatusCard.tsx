import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

type Props = {
  cargando: boolean;
  motor1: number;
  motor2: number;
};

export default function StatusCard({ cargando, motor1, motor2 }: Props) {
  const hayToallas = motor1 + motor2 > 0;

  if (cargando) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color="#EC407A" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.statusCard, hayToallas ? styles.ok : styles.empty]}>
      {hayToallas ? (
        <>
          <Text style={styles.emoji}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: '#2E7D32' }]}>Kits disponibles</Text>
            <Text style={[styles.sub,   { color: '#388E3C' }]}>Puedes solicitar tu kit ahora</Text>
          </View>
        </>
      ) : (
        <>
          <AlertTriangle color="#C62828" size={28} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: '#C62828' }]}>Sin kits disponibles</Text>
            <Text style={[styles.sub,   { color: '#D32F2F' }]}>Contacta al personal del colegio</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, flexDirection: 'row', gap: 12, justifyContent: 'center' },
  loadingText: { color: '#EC407A', fontSize: 14 },
  statusCard:  { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 2 },
  ok:          { backgroundColor: '#E8F5E9', borderColor: '#66BB6A' },
  empty:       { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  emoji:       { fontSize: 24, marginRight: 12 },
  title:       { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  sub:         { fontSize: 13 },
});