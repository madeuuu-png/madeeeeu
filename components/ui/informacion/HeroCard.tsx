import { View, Text, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';

export default function HeroCard() {
  return (
    <View style={styles.card}>
      <Heart color="white" size={48} fill="white" strokeWidth={1.5} style={styles.icon} />
      <Text style={styles.title}>Nuestra Misión</Text>
      <Text style={styles.text}>
        Desarrollar un dispensador automatizado controlado por esta app para que todas las chicas del
        colegio tengan acceso rápido, seguro y discreto a productos de emergencia menstrual cuando más
        lo necesiten.
      </Text>
      <Text style={styles.subtext}>
        Somos 3 estudiantes del Técnico Salesiano comprometidas con transformar una situación social
        difícil en una solución práctica. Porque nadie debería pasar por un momento incómodo sola. Tu
        bienestar es nuestra motivación para seguir adelante.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:    { backgroundColor: '#EC407A', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 24, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, zIndex: 10 },
  icon:    { marginBottom: 12 },
  title:   { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 12, textAlign: 'center' },
  text:    { fontSize: 15, color: 'white', textAlign: 'center', lineHeight: 24, fontWeight: '500' },
  subtext: { fontSize: 14, color: '#FCE4EC', textAlign: 'center', marginTop: 12, lineHeight: 22, fontStyle: 'italic' },
});