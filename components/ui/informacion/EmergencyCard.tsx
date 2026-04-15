import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

export default function EmergencyCard() {
  return (
    <View style={[styles.card, styles.emergencyCard]}>
      <View style={styles.cardHeader}>
        <AlertTriangle color="#E65100" size={28} style={styles.icon} />
        <Text style={[styles.title, styles.emergencyTitle]}>En Emergencia</Text>
      </View>
      <Text style={[styles.text, styles.emergencyText]}>
        {`Si tienes una emergencia menstrual:\n1. Mantén la calma\n2. Usa la app para solicitar un kit\n3. Dirígete al dispensador más cercano\n4. Si necesitas ayuda, contacta a la enfermería`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:           { backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  emergencyCard:  { backgroundColor: '#FFF3E0', borderWidth: 2, borderColor: '#FFB74D' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon:           { marginRight: 12 },
  title:          { fontSize: 20, fontWeight: 'bold', color: '#C2185B', flex: 1 },
  emergencyTitle: { color: '#E65100' },
  text:           { fontSize: 15, color: '#666', lineHeight: 24 },
  emergencyText:  { color: '#E65100', fontWeight: '500' },
});