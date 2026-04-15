import { View, Text, StyleSheet } from 'react-native';
import { Flower2, Pill, Package, Star } from 'lucide-react-native';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Flower2,
  Pill,
  Package,
  Star,
};

type InfoCardProps = {
  icon: string;
  title: string;
  text: string;
  boldTitle?: string;
};

export default function InfoCard({ icon, title, text, boldTitle }: InfoCardProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {IconComponent && <IconComponent color="#C2185B" size={28} style={styles.icon} />}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.text}>
        {boldTitle && <Text style={styles.boldLabel}>{boldTitle + '\n'}</Text>}
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon:       { marginRight: 12 },
  title:      { fontSize: 20, fontWeight: 'bold', color: '#C2185B', flex: 1 },
  text:       { fontSize: 15, color: '#666', lineHeight: 24 },
  boldLabel:  { fontWeight: 'bold', color: '#C2185B' },
});