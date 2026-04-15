import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface Props {
  nombre: string;
}

export default function HomeHeader({ nombre }: Props) {
  return (
    <View style={styles.header}>
      <Sparkles color="#EC407A" size={48} strokeWidth={1.5} />
      <Text style={styles.title}>
        {nombre ? `¡Hola, ${nombre}!` : '¡Hola, Hermosa!'}
      </Text>
      <Text style={styles.subtitle}>Estamos aquí para cuidarte</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header:   { alignItems: 'center', marginBottom: 20, zIndex: 10, gap: 8 },
  title:    { fontSize: 32, fontWeight: 'bold', color: '#C2185B', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#EC407A', fontWeight: '500' },
});