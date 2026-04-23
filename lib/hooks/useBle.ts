import { useRef, useState, useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { HC05_NAME, RESPONSE_TIMEOUT_MS } from '@/lib/constants/bluetooth';

export function useBle() {
  const [conectado,  setConectado]  = useState(false);
  const [conectando, setConectando] = useState(false);
  const deviceRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    return () => { listenerRef.current?.remove(); };
  }, []);

  const conectar = async () => {
    if (conectando || conectado) return;

    if (deviceRef.current) {
      try {
        const sigue = await deviceRef.current.isConnected();
        if (sigue) { setConectado(true); return; }
      } catch {}
      deviceRef.current = null;
    }

    if (Platform.OS === 'android') {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const todosOk = Object.values(grants).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!todosOk) {
        Alert.alert('Permisos', 'Activa Bluetooth y Ubicación en ajustes.');
        return;
      }
    }

    setConectando(true);
    try {
      const paired = await RNBluetoothClassic.getBondedDevices();
      
      // Busca por nombre — sin necesitar la MAC
      const hc05 = paired.find(d =>
        d.name?.toUpperCase().includes(HC05_NAME.toUpperCase())
      );

      if (!hc05) {
        Alert.alert(
          'Dispensador no encontrado',
          `Asegúrate de haber emparejado "${HC05_NAME}" en los ajustes Bluetooth del celular.`
        );
        setConectando(false);
        return;
      }

      const device = await RNBluetoothClassic.connectToDevice(hc05.address);
      deviceRef.current = device;
      setConectado(true);
      console.log(`✅ Conectado a ${hc05.name}`);

      listenerRef.current?.remove();
      listenerRef.current = RNBluetoothClassic.onDeviceDisconnected((event) => {
        if (event.device?.address === hc05.address) {
          console.log('🔴 HC-05 desconectado');
          setConectado(false);
          deviceRef.current = null;
          listenerRef.current?.remove();
          listenerRef.current = null;
        }
      });

    } catch (e: any) {
      console.log('❌ Error BT:', e?.message);
    } finally {
      setConectando(false);
    }
  };

  const enviarComando = (comando: string): Promise<string | null> =>
    new Promise(async (resolve) => {
      const device = deviceRef.current;
      if (!device) return resolve(null);

      let resuelto = false;
      const timeout = setTimeout(() => {
        if (!resuelto) { resuelto = true; resolve(null); }
      }, RESPONSE_TIMEOUT_MS);

      try {
        await device.write(comando + '\n');
        const respuesta = await device.read();
        if (!resuelto) {
          resuelto = true;
          clearTimeout(timeout);
          resolve(respuesta?.trim() ?? null);
        }
      } catch {
        if (!resuelto) {
          resuelto = true;
          clearTimeout(timeout);
          resolve(null);
        }
      }
    });

  const detener = async () => {
    listenerRef.current?.remove();
    listenerRef.current = null;
    try {
      if (deviceRef.current) {
        await deviceRef.current.disconnect();
        deviceRef.current = null;
      }
    } catch {}
    setConectado(false);
  };

  return { conectado, conectando, conectar, enviarComando, detener };
}