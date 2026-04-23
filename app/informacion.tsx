import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Home, LogOut } from 'lucide-react-native';
import { storageAdapter } from '@/lib/core/storage/storage.adapter';
import HeroCard      from '../components/ui/informacion/HeroCard';
import InfoCard      from '../components/ui/informacion/InfoCard';
import EmergencyCard from '../components/ui/informacion/EmergencyCard';
import TeamSection   from '../components/ui/informacion/TeamSection';
import SupportCard   from '../components/ui/informacion/SupportCard';
import { INFO_SECTIONS } from '../components/ui/informacion/constants';

export default function Informacion() {
  const router = useRouter();
const handleLogout = async () => {
  await storageAdapter.removeItem('numDocumento');
  await storageAdapter.removeItem('esAdmin');
  router.replace('/');
};
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>

        {/* Decoración */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft color="#EC407A" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Información</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <HeroCard />

        {/* Secciones */}
        <View style={styles.sectionsContainer}>
          {INFO_SECTIONS.map((section) => (
            <InfoCard key={section.id} {...section} />
          ))}
          <EmergencyCard />
        </View>

        {/* Equipo */}
        <TeamSection />

        {/* Soporte */}
        <SupportCard />

        {/* Volver al inicio */}
        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/home')} activeOpacity={0.8}>
          <View style={styles.homeButtonInner}>
            <Home color="white" size={20} />
            <Text style={styles.homeButtonText}>Volver al inicio</Text>
          </View>
        </TouchableOpacity>

        {/* Cerrar sesión */}
        <TouchableOpacity  style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut color="#EC407A" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView:       { flex: 1, backgroundColor: '#FCE4EC' },
  container:        { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  circle1:          { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#F48FB1', opacity: 0.12, top: -100, left: -80 },
  circle2:          { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#EC407A', opacity: 0.1, bottom: 200, right: -60 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, zIndex: 10 },
  backButton:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#EC407A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  headerTitle:      { fontSize: 24, fontWeight: 'bold', color: '#C2185B' },
  sectionsContainer:{ marginBottom: 24, zIndex: 10 },
  homeButton:       { backgroundColor: '#EC407A', borderRadius: 20, padding: 18, alignItems: 'center', marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, zIndex: 10 },
  homeButtonInner:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  homeButtonText:   { color: 'white', fontSize: 18, fontWeight: 'bold' },
  logoutButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'white', borderRadius: 16, borderWidth: 2, borderColor: '#F8BBD0', zIndex: 10 },
  logoutText:       { color: '#EC407A', fontWeight: 'bold', fontSize: 16 },
});