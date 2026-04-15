import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/core/supabase/supabase';
import {
  obtenerInventario,
  descontarToalla,
  guardarEntregaLocal,
  obtenerUltimaEntregaLocal,
  sincronizarConSupabase,
  type Inventario,
} from '@/lib/core/dataBase';

export function useInventario(numDocumento: string, esAdmin: boolean) {
  const [inventario, setInventario] = useState<Inventario>({ motor1: 8, motor2: 8 });
  const [cargando,   setCargando]   = useState(true);

  useEffect(() => {
    const inv = obtenerInventario();
    setInventario(inv);
    setCargando(false);

    if (inv.motor1 === 0 && inv.motor2 === 0) {
      Alert.alert(
        '⚠️ Sin kits disponibles',
        'El dispensador está vacío. Por favor avisa al personal del colegio.',
        [{ text: 'Entendido' }]
      );
    }

    sincronizarConSupabase();
  }, []);

  const verificarCooldown = async (): Promise<boolean> => {
    const hoy = new Date();

    const fechaLocal = obtenerUltimaEntregaLocal(numDocumento);
    if (fechaLocal) {
      const dias = (hoy.getTime() - new Date(fechaLocal).getTime()) / (1000 * 60 * 60 * 24);
      if (dias < 28) {
        Alert.alert('', `Aún faltan ${Math.ceil(28 - dias)} días para tu próximo kit`);
        return false;
      }
    }

    const net = await NetInfo.fetch();
    if (net.isConnected) {
      const { data } = await supabase
        .from('estudiantes')
        .select('UltimaEntrega')
        .eq('NumDocumento', numDocumento)
        .single();

      if (data?.UltimaEntrega) {
        const dias = (hoy.getTime() - new Date(data.UltimaEntrega).getTime()) / (1000 * 60 * 60 * 24);
        if (dias < 28) {
          Alert.alert('', `Aún faltan ${Math.ceil(28 - dias)} días para tu próximo kit`);
          return false;
        }
      }
    }

    return true;
  };

  const registrarEntrega = () => {
    const nuevoInv = descontarToalla();
    setInventario(nuevoInv);

    const fecha = new Date().toISOString().split('T')[0];
    guardarEntregaLocal(numDocumento, fecha);
    sincronizarConSupabase();
  };

  const puedeRetirar = async (): Promise<boolean> => {
    if (esAdmin) return true;
    return verificarCooldown();
  };

  return { inventario, cargando, puedeRetirar, registrarEntrega };
}