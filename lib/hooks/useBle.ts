import { useRef, useState, useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { HC05_NAME, RESPONSE_TIMEOUT_MS } from '@/lib/constants/bluetooth';

export function useBle() {
  const [conectado,  setConectado]  = useState(false);
  const [conectando, setConectando] = useState(false);
  const deviceRef      = useRef<any>(null);
  const listenerRef    = useRef<any>(null);   // desconexión
  const dataListenerRef = useRef<any>(null);  // recepción de datos

  useEffect(() => {
    return () => {
      listenerRef.current?.remove();
      dataListenerRef.current?.remove();
    };
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

      // Listener de desconexión
      listenerRef.current?.remove();
      listenerRef.current = RNBluetoothClassic.onDeviceDisconnected((event) => {
        if (event.device?.address === hc05.address) {
          console.log('🔴 HC-05 desconectado');
          setConectado(false);
          deviceRef.current = null;
          dataListenerRef.current?.remove();
          dataListenerRef.current = null;
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

  // ── enviarComando ────────────────────────────────────────────
  // Usa onDataReceived (eventos) en lugar de read() para capturar
  // la respuesta del Arduino correctamente.
  const enviarComando = (comando: string): Promise<string | null> =>
    new Promise(async (resolve) => {
      const device = deviceRef.current;
      if (!device) return resolve(null);

      let resuelto = false;

      // Limpia cualquier listener de datos anterior
      dataListenerRef.current?.remove();
      dataListenerRef.current = null;

      const limpiarYResolver = (valor: string | null) => {
        if (resuelto) return;
        resuelto = true;
        clearTimeout(timeout);
        dataListenerRef.current?.remove();
        dataListenerRef.current = null;
        resolve(valor);
      };

      // Timeout de seguridad
      const timeout = setTimeout(() => {
        console.log('⏱️ Timeout esperando respuesta del Arduino');
        limpiarYResolver(null);
      }, RESPONSE_TIMEOUT_MS);

      try {
        // Escucha la respuesta ANTES de enviar para no perderla
        dataListenerRef.current = device.onDataReceived((event: any) => {
          const texto = (event?.data ?? '').trim();
          console.log(`📩 Arduino respondió: "${texto}"`);
          if (texto) limpiarYResolver(texto);
        });

        // Envía el comando al Arduino
        await device.write(comando + '\n');
        console.log(`📤 Comando enviado: "${comando}"`);

      } catch (e: any) {
        console.log('❌ Error enviando comando:', e?.message);
        limpiarYResolver(null);
      }
    });

  const detener = async () => {
    listenerRef.current?.remove();
    listenerRef.current = null;
    dataListenerRef.current?.remove();
    dataListenerRef.current = null;
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