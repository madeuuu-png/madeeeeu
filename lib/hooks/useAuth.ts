import { useState } from 'react';
import { useRouter } from 'expo-router';
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
      alert('Ingresa una cédula válida (10 dígitos)');
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
          alert('Error al consultar la base de datos: ' + error.message);
          return;
        }
        if (!data || data.length === 0) {
          alert('❌ Cédula no registrada');
          return;
        }
      } else {
        const existe = existeCedulaLocal(ced);
        if (!existe) {
          alert('❌ Cédula no encontrada. Necesitas internet para el primer ingreso.');
          return;
        }
      }

      await storageAdapter.setItem('numDocumento', ced);
      await storageAdapter.setItem('esAdmin', ADMINS.includes(ced) ? 'true' : 'false');

      router.replace('/home');
    } catch {
      alert('Hubo un error inesperado, intenta nuevamente');
    } finally {
      setCargando(false);
    }
  };

  return { cedula, setCedula, cargando, handleLogin };
}