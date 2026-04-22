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
  const [cedula, setCedula] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    const ced = cedula.trim();

    if (ced.length !== 10) {
      Alert.alert('Cédula inválida', 'Ingresa una cédula válida (10 dígitos)');
      return;
    }

    setCargando(true);
  };

  return {
    cedula,
    cargando,
    handleLogin,
    setCedula,
  };
}
