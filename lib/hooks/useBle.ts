// Importa hooks de React para manejar estado, referencias y ciclo de vida
import { useRef, useState, useEffect } from 'react';

// Importa utilidades de React Native para alertas, permisos y plataforma
import { Alert, PermissionsAndroid, Platform } from 'react-native';

// Librería para manejar Bluetooth clásico (HC-05)
import RNBluetoothClassic from 'react-native-bluetooth-classic';

// Constante con el nombre del módulo HC-05
import { HC05_NAME } from '@/lib/constants/bluetooth';

export function useBle() {

  // Estado que indica si el dispositivo está conectado
  const [conectado,  setConectado]  = useState(false);

  // Estado que indica si está en proceso de conexión
  const [conectando, setConectando] = useState(false);

  // Referencia al dispositivo Bluetooth conectado
  const deviceRef = useRef<any>(null);

  // Referencia al listener de desconexión
  const listenerRef = useRef<any>(null);

  // Referencia al listener de datos (no se usa actualmente pero se limpia)
  const dataListenerRef = useRef<any>(null);

  // useEffect que se ejecuta al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpia listeners para evitar fugas de memoria
      listenerRef.current?.remove();
      dataListenerRef.current?.remove();
    };
  }, []);

  // ─────────────────────────────────────────────
  // FUNCIÓN: conectar al dispositivo HC-05
  // ─────────────────────────────────────────────
  const conectar = async () => {

    // Evita múltiples intentos de conexión simultáneos
    if (conectando || conectado) return;

    // Si ya hay un dispositivo guardado, verifica si sigue conectado
    if (deviceRef.current) {
      try {
        const sigue = await deviceRef.current.isConnected();

        // Si sigue conectado, actualiza estado y no vuelve a conectar
        if (sigue) { 
          setConectado(true); 
          return; 
        }
      } catch {}

      // Si falla la verificación, limpia referencia
      deviceRef.current = null;
    }

    // ───── Manejo de permisos en Android ─────
    if (Platform.OS === 'android') {

      // Android 12 o superior (API 31+)
      if (Platform.Version >= 31) {

        // Solicita permisos modernos de Bluetooth + ubicación
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        // Verifica que todos los permisos fueron concedidos
        const todosOk = Object.values(grants).every(
          v => v === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!todosOk) {
          Alert.alert('Permisos', 'Activa Bluetooth y Ubicación en ajustes.');
          return;
        }

      } else {
        // Android 7 a 11 → solo necesita ubicación

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message: 'La app necesita acceso a la ubicación para conectarse por Bluetooth.',
            buttonPositive: 'Aceptar',
            buttonNegative: 'Cancelar',
          }
        );

        // Si el usuario rechaza el permiso
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permisos', 'Activa Ubicación en ajustes para conectar el dispensador.');
          return;
        }
      }
    }

    // Indica que inició el proceso de conexión
    setConectando(true);

    try {
      // Obtiene dispositivos previamente emparejados
      const paired = await RNBluetoothClassic.getBondedDevices();

      // Busca el HC-05 por nombre
      const hc05 = paired.find(d =>
        d.name?.toUpperCase().includes(HC05_NAME.toUpperCase())
      );

      // Si no encuentra el dispositivo
      if (!hc05) {
        Alert.alert(
          'Dispensador no encontrado',
          `Asegúrate de haber emparejado "${HC05_NAME}" en los ajustes Bluetooth del celular.`
        );
        setConectando(false);
        return;
      }

      // Intenta conectarse al dispositivo
      const device = await RNBluetoothClassic.connectToDevice(hc05.address);

      // Guarda referencia del dispositivo conectado
      deviceRef.current = device;

      // Actualiza estado a conectado
      setConectado(true);

      console.log(`✅ Conectado a ${hc05.name}`);

      // Limpia listener previo si existe
      listenerRef.current?.remove();

      // Listener que detecta desconexión del dispositivo
      listenerRef.current = RNBluetoothClassic.onDeviceDisconnected((event) => {
        if (event.device?.address === hc05.address) {

          console.log('🔴 HC-05 desconectado');

          // Actualiza estado y limpia referencias
          setConectado(false);
          deviceRef.current = null;

          dataListenerRef.current?.remove();
          dataListenerRef.current = null;

          listenerRef.current?.remove();
          listenerRef.current = null;
        }
      });

    } catch (e: any) {
      // Manejo de errores en conexión
      console.log('❌ Error BT:', e?.message);
    } finally {
      // Finaliza estado de conexión
      setConectando(false);
    }
  };

  // ─────────────────────────────────────────────
  // FUNCIÓN: enviar comando al Arduino (HC-05)
  // ─────────────────────────────────────────────
  const enviarComando = async (comando: string): Promise<boolean> => {

    // Obtiene el dispositivo conectado
    const device = deviceRef.current;

    // Si no hay dispositivo, no envía nada
    if (!device) return false;

    try {
      // Envía el comando con salto de línea
      await device.write(comando + '\n');

      console.log(`📤 Comando enviado: "${comando}"`);

      // Retorna éxito
      return true;

    } catch (e: any) {
      // Manejo de error al enviar
      console.log('❌ Error enviando comando:', e?.message);
      return false;
    }
  };

  // ─────────────────────────────────────────────
  // FUNCIÓN: desconectar dispositivo
  // ─────────────────────────────────────────────
  const detener = async () => {

    // Limpia listeners
    listenerRef.current?.remove();
    listenerRef.current = null;

    dataListenerRef.current?.remove();
    dataListenerRef.current = null;

    try {
      // Si hay dispositivo, lo desconecta
      if (deviceRef.current) {
        await deviceRef.current.disconnect();
        deviceRef.current = null;
      }
    } catch {}

    // Actualiza estado a desconectado
    setConectado(false);
  };

  // Retorna funciones y estados para usar en la app
  return { conectado, conectando, conectar, enviarComando, detener };
}