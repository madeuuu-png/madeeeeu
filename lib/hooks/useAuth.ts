import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../core/supabase/supabase';
import { storageAdapter } from '@/lib/core/storage/storage.adapter';
import { existeCedulaLocal } from '@/lib/core/dataBase';
import { ADMINS } from '@/lib/constants/admins';

export function useAuth() {
  const router = useRouter();
  const [cedula,   setCedula]   = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    const ced = cedula.trim();

    if (ced.length !== 10) {
      Alert.alert('Cédula inválida', 'Ingresa una cédula válida (10 dígitos)');
      return;
    }

    setCargando(true);

    try {
      const net = await NetInfo.fetch();

      if (net.isConnected) {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('*')
          .eq('NumDocumento', ced);

        if (error) {
          // Supabase falló — intenta con la base local como respaldo
          console.log('⚠️ Supabase no disponible, usando base local');
          const existe = existeCedulaLocal(ced);
          if (!existe) {
            Alert.alert('❌ Cédula no registrada', 'No encontramos tu cédula');
            return;
          }
        } else if (!data || data.length === 0) {
          Alert.alert('❌ Cédula no registrada', 'No encontramos tu cédula');
          return;
        }

      } else {
        const existe = existeCedulaLocal(ced);
        if (!existe) {
          Alert.alert('Sin conexión', 'Cédula no encontrada. Necesitas internet para el primer ingreso.');
          return;
        }
      }

      await storageAdapter.setItem('numDocumento', ced);
      await storageAdapter.setItem('esAdmin', ADMINS.includes(ced) ? 'true' : 'false');

      router.replace('/home');

    } catch {
      Alert.alert('Error', 'Algo salió mal, intenta de nuevo');
    } finally {
      setCargando(false);
    }
  };

  return {
    cedula,
    setCedula,
    cargando,
    handleLogin,
  };
}