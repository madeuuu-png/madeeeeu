import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Heart, Target, Flower2, Pill, Package,
  AlertTriangle, Star, Users, LogOut, Home, MessageCircle,
  Instagram, Droplets, ShieldCheck
} from 'lucide-react-native';

export default function Informacion() {
  const router = useRouter();

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
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

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Heart color="white" size={48} fill="white" strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <Text style={styles.heroTitle}>Nuestra Misión</Text>
          <Text style={styles.heroText}>
            Desarrollar un dispensador automatizado controlado por esta app para que todas las chicas del colegio tengan acceso rápido, seguro y discreto a productos de emergencia menstrual cuando más lo necesiten.
          </Text>
          <Text style={styles.heroSubtext}>
            Somos 3 estudiantes del Técnico Salesiano comprometidas con transformar una situación social difícil en una solución práctica. Porque nadie debería pasar por un momento incómodo sola. Tu bienestar es nuestra motivación para seguir adelante.
          </Text>
        </View>

        {/* Secciones */}
        <View style={styles.sectionsContainer}>

          {/* Menstruación */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Flower2 color="#C2185B" size={28} style={{ marginRight: 12 }} />
              <Text style={styles.cardTitle}>Sobre la Menstruación</Text>
            </View>
            <Text style={styles.cardText}>
              La menstruación es un proceso natural y saludable. Es importante conocer tu ciclo y saber que nunca estás sola. Estamos aquí para apoyarte en cada momento.
            </Text>
          </View>

          {/* Cólicos */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Pill color="#C2185B" size={28} style={{ marginRight: 12 }} />
              <Text style={styles.cardTitle}>Alivio de Cólicos</Text>
            </View>
            <Text style={styles.cardText}>
              <Text style={styles.bold}>Tips para aliviar:{'\n'}</Text>
              • Aplicar calor en el abdomen{'\n'}
              • Tomar analgésicos (consulta con tu médico){'\n'}
              • Descansar lo necesario{'\n'}
              • Beber agua tibia{'\n'}
              • Realizar estiramientos suaves
            </Text>
          </View>

          {/* Productos */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Package color="#C2185B" size={28} style={{ marginRight: 12 }} />
              <Text style={styles.cardTitle}>Productos Disponibles</Text>
            </View>
            <Text style={styles.cardText}>
              Nuestro dispensador contiene:{'\n'}
              • Toallas sanitarias{'\n'}
              • Tampones{'\n'}
              • Protectores diarios{'\n'}
              • Toallitas húmedas{'\n'}
              • Analgésicos (bajo supervisión)
            </Text>
          </View>

          {/* Emergencias */}
          <View style={[styles.infoCard, styles.emergencyCard]}>
            <View style={styles.cardHeader}>
              <AlertTriangle color="#E65100" size={28} style={{ marginRight: 12 }} />
              <Text style={[styles.cardTitle, { color: '#E65100' }]}>En Emergencia</Text>
            </View>
            <Text style={[styles.cardText, styles.emergencyText]}>
              Si tienes una emergencia menstrual:{'\n'}
              1. Mantén la calma{'\n'}
              2. Usa la app para solicitar un kit{'\n'}
              3. Dirígete al dispensador más cercano{'\n'}
              4. Si necesitas ayuda, contacta a la enfermería
            </Text>
          </View>

          {/* Tips */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Star color="#C2185B" size={28} style={{ marginRight: 12 }} />
              <Text style={styles.cardTitle}>Tips de Bienestar</Text>
            </View>
            <Text style={styles.cardText}>
              • Lleva un registro de tu ciclo{'\n'}
              • Mantente hidratada{'\n'}
              • Come alimentos saludables{'\n'}
              • Descansa lo suficiente{'\n'}
              • Habla con alguien de confianza{'\n'}
              • Recuerda: ¡Eres increíble!
            </Text>
          </View>
        </View>

        {/* Equipo */}
        <View style={styles.teamSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <Users color="#C2185B" size={28} />
            <Text style={styles.sectionTitleTeam}>Conoce a Nuestro Equipo</Text>
          </View>

          {[
            { name: 'Madelayne Palomi', ig: '@madeu.cs_', quote: '"Juntas creamos espacios seguros donde cada chica se sienta apoyada y comprendida"' },
            { name: 'Kayle Culcay', ig: '@kayle_culcay', quote: '"Tu comodidad y bienestar no son un lujo, son un derecho que mereces"' },
            { name: 'Nayeli Peralta', ig: '@nays_pbv', quote: '"Transformando pequeñas acciones en grandes cambios para todas nosotras"' },
          ].map((member, i) => (
            <View key={i} style={styles.memberCard}>
              <ShieldCheck color="#EC407A" size={40} strokeWidth={1.5} style={{ marginBottom: 12 }} />
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Instagram color="#EC407A" size={16} />
                <Text style={styles.memberInstagram}>{member.ig}</Text>
              </View>
              <Text style={styles.memberQuote}>{member.quote}</Text>
            </View>
          ))}
        </View>

        {/* Support Card */}
        <View style={styles.supportCard}>
          <MessageCircle color="#C2185B" size={40} style={{ marginBottom: 12 }} />
          <Text style={styles.supportText}>
            Recuerda que tu bienestar es nuestra prioridad. Nunca dudes en usar el dispensador cuando lo necesites.
          </Text>
        </View>

        {/* Volver */}
        <TouchableOpacity style={styles.backButtonBottom} onPress={() => router.push('/home')} activeOpacity={0.8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Home color="white" size={20} />
            <Text style={styles.backButtonText}>Volver al inicio</Text>
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')} activeOpacity={0.7}>
          <LogOut color="#EC407A" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#FCE4EC' },
  container: { flex: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#F48FB1', opacity: 0.12, top: -100, left: -80 },
  circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#EC407A', opacity: 0.1, bottom: 200, right: -60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, zIndex: 10 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#C2185B' },
  heroCard: {
    backgroundColor: '#EC407A', borderRadius: 24, padding: 28, alignItems: 'center',
    marginBottom: 24, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, zIndex: 10,
  },
  heroTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 12, textAlign: 'center' },
  heroText: { fontSize: 15, color: 'white', textAlign: 'center', lineHeight: 24, fontWeight: '500' },
  heroSubtext: { fontSize: 14, color: '#FCE4EC', textAlign: 'center', marginTop: 12, lineHeight: 22, fontStyle: 'italic' },
  sectionsContainer: { marginBottom: 24, zIndex: 10 },
  infoCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 16,
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  emergencyCard: { backgroundColor: '#FFF3E0', borderWidth: 2, borderColor: '#FFB74D' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#C2185B', flex: 1 },
  cardText: { fontSize: 15, color: '#666', lineHeight: 24 },
  emergencyText: { color: '#E65100', fontWeight: '500' },
  bold: { fontWeight: 'bold', color: '#C2185B' },
  teamSection: { marginBottom: 24, zIndex: 10 },
  sectionTitleTeam: { fontSize: 24, fontWeight: 'bold', color: '#C2185B', textAlign: 'center' },
  memberCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 16,
    shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    borderLeftWidth: 4, borderLeftColor: '#EC407A', alignItems: 'center',
  },
  memberName: { fontSize: 20, fontWeight: 'bold', color: '#C2185B', marginBottom: 6 },
  memberInstagram: { fontSize: 16, color: '#EC407A', fontWeight: '600' },
  memberQuote: { fontSize: 14, color: '#666', lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },
  supportCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 24, borderWidth: 2, borderColor: '#F8BBD0', zIndex: 10,
  },
  supportText: { fontSize: 15, color: '#C2185B', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  backButtonBottom: {
    backgroundColor: '#EC407A', borderRadius: 20, padding: 18, alignItems: 'center',
    marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, zIndex: 10,
  },
  backButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, backgroundColor: 'white', borderRadius: 16,
    borderWidth: 2, borderColor: '#F8BBD0', zIndex: 10,
  },
  logoutText: { color: '#EC407A', fontWeight: 'bold', fontSize: 16 },
});