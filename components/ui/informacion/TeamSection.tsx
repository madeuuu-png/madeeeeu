import { View, Text, StyleSheet } from 'react-native';
import { Users, Instagram, ShieldCheck } from 'lucide-react-native';
import { TEAM_MEMBERS } from '../informacion/constants';

export default function TeamSection() {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Users color="#C2185B" size={28} />
        <Text style={styles.title}>Conoce a Nuestro Equipo</Text>
      </View>

      {TEAM_MEMBERS.map((member, i) => (
        <View key={i} style={styles.memberCard}>
          <ShieldCheck color="#EC407A" size={40} strokeWidth={1.5} style={styles.memberIcon} />
          <Text style={styles.memberName}>{member.name}</Text>
          <View style={styles.igRow}>
            <Instagram color="#EC407A" size={16} />
            <Text style={styles.memberInstagram}>{member.ig}</Text>
          </View>
          <Text style={styles.memberQuote}>{member.quote}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section:         { marginBottom: 24, zIndex: 10 },
  titleRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  title:           { fontSize: 24, fontWeight: 'bold', color: '#C2185B', textAlign: 'center' },
  memberCard:      { backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#EC407A', alignItems: 'center', shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  memberIcon:      { marginBottom: 12 },
  memberName:      { fontSize: 20, fontWeight: 'bold', color: '#C2185B', marginBottom: 6 },
  igRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  memberInstagram: { fontSize: 16, color: '#EC407A', fontWeight: '600' },
  memberQuote:     { fontSize: 14, color: '#666', lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },
});