import { View, Text, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';

export default function SupportCard() {
  return (
    <View style={styles.card}>
      <MessageCircle color="#C2185B" size={40} style={styles.icon} />
      <Text style={styles.text}>
        Recuerda que tu bienestar es nuestra prioridad. Nunca dudes en usar el dispensador cuando lo
        necesites.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#F8BBD0',
    shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#C2185B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});