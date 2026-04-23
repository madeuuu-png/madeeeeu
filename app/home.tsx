import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Flower2, LogOut, ShieldCheck } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';

import { supabase } from '@/lib/core/supabase/supabase';
import { storageAdapter } from '@/lib/core/storage/storage.adapter';
import { useInventario } from '@/lib/hooks/useInventario';
import { useBle } from '@/lib/hooks/useBle';
import BackgroundCircles from '@/components/layout/BackgroundCircles';
import StatusCard from '@/components/ui/StatusCard';
import BleStatusCard from '@/components/ui/BleStatusCard';
import HomeHeader from '@/components/ui/home/HomeHeader';
import ActionButtons from '@/components/ui/home/ActionButtons';

export default function Home() {
  const router = useRouter();

  const [numDocumento, setNumDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [esAdmin, setEsAdmin] = useState(false);

  const { conectado, conectando, conectar, enviarComando, detener } = useBle();
  const { inventario, cargando, puedeRetirar, registrarEntrega } =
    useInventario(numDocumento, esAdmin);

  const hayToallas = inventario.motor1 + inventario.motor2 > 0;

  // ── Carga inicial ──────────────────────────────────────────────
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        const doc = await storageAdapter.getItem('numDocumento');
        const adminFlag = await storageAdapter.getItem('esAdmin');

        setEsAdmin(adminFlag === 'true');

        if (!doc) return;
        setNumDocumento(doc);

        const net = await NetInfo.fetch();
        if (!net.isConnected) return;

        const { data } = await supabase
          .from('estudiantes')
          .select('NombreCompleto')
          .eq('NumDocumento', doc)
          .single();

        if (data) setNombre(data.NombreCompleto);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      }
    };

    inicializarDatos();
    conectar(); // ← se conecta sola al entrar

    return () => {
      detener();
    };
  }, []);

  // ── Sacar kit ──────────────────────────────────────────────────
  const handleSacarKit = async () => {
    if (!numDocumento) {
      Alert.alert('Error', 'No se encontró tu número de documento');
      return;
    }
    if (!conectado) {
      Alert.alert('Conexión', 'Conecta el dispensador primero.');
      return;
    }

    const puede = await puedeRetirar();
    if (!puede) return;

    if (!hayToallas) {
      Alert.alert('Sin stock', 'No hay toallas disponibles');
      return;
    }

    // '1' → motor1, '2' → motor2
    const comando = inventario.motor1 > 0 ? '1' : '2';
    const respuesta = await enviarComando(comando);

    if (!respuesta) {
      Alert.alert('Error', 'No se pudo comunicar con el dispensador. Intenta de nuevo.');
    } else if (respuesta === 'S') {
      Alert.alert('Sin toallas', 'El dispensador está vacío. Avisa al personal.');
    } else if (respuesta === 'A' || respuesta === 'B') {
      registrarEntrega();
      Alert.alert('✅ ¡Listo!', 'Tu kit fue dispensado. ¡Cuídate mucho!');
    } else {
      Alert.alert('Error', 'El dispensador no respondió correctamente');
    }
  };

  // ── Logout ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    await storageAdapter.removeItem('numDocumento');
    await storageAdapter.removeItem('esAdmin');
    detener();
    router.replace('/');
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <BackgroundCircles variant="home" />

        <HomeHeader nombre={nombre} />

        {esAdmin && (
          <TouchableOpacity
            style={styles.adminTab}
            onPress={() => router.push('/admin')}
            activeOpacity={0.8}
          >
            <ShieldCheck color="white" size={22} style={{ marginRight: 10 }} />
            <Text style={styles.adminTabText}>Panel Administración</Text>
          </TouchableOpacity>
        )}

        <View style={styles.messageCard}>
          <Flower2 color="#EC407A" size={32} style={{ marginRight: 16 }} />
          <Text style={styles.messageText}>
            "Tu bienestar es nuestra prioridad. Siempre estaremos aquí para ti."
          </Text>
        </View>

        <StatusCard
          cargando={cargando}
          motor1={inventario.motor1}
          motor2={inventario.motor2}
        />

        <BleStatusCard
          conectado={conectado}
          conectando={conectando}
          onPress={conectar}
        />

        <ActionButtons
          hayToallas={hayToallas}
          bleConectado={conectado}
          onSacarKit={handleSacarKit}
          onInformacion={() => router.push('/informacion')}
        />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut color="#EC407A" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FCE4EC',
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  adminTab: {
    backgroundColor: '#C2185B',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    zIndex: 10,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  adminTabText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    color: '#C2185B',
    fontWeight: '500',
    lineHeight: 22,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F8BBD0',
    zIndex: 10,
  },
  logoutText: {
    color: '#EC407A',
    fontWeight: 'bold',
    fontSize: 16,
  },
});