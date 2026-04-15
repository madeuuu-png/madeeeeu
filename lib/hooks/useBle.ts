import { useRef, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import {
  SERVICE_UUID, CHARACTERISTIC_UUID, ESP32_MAC,
  BLE_RESPONSE_TIMEOUT_MS, BLE_SUBSCRIBE_DELAY_MS,
} from '@/lib/constants/ble';

const bleManager = new BleManager();

export function useBle() {
  const [conectado,  setConectado]  = useState(false);
  const [conectando, setConectando] = useState(false);
  const dispositivoRef = useRef<Device | null>(null);

  // ── Permisos + escaneo ────────────────────────────────────────
  const conectar = async () => {
    if (conectando || conectado) return;

    if (dispositivoRef.current) {
      try {
        const sigue = await dispositivoRef.current.isConnected();
        if (sigue) { setConectado(true); return; }
      } catch { /* nada */ }
      dispositivoRef.current = null;
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const todosOk = Object.values(granted).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!todosOk) {
        Alert.alert('Permisos', 'Activa Bluetooth y Ubicación en ajustes de la app.');
        return;
      }
    }

    await _escanear();
  };

  const _escanear = async () => {
    const estado = await bleManager.state();
    if (estado !== 'PoweredOn') {
      Alert.alert('Bluetooth apagado', 'Activa el Bluetooth e intenta de nuevo.');
      return;
    }

    setConectando(true);

    bleManager.startDeviceScan([SERVICE_UUID], null, async (error, device) => {
      if (error) {
        setConectando(false);
        Alert.alert('Error Bluetooth', error.message);
        return;
      }

      const nombreDev = device?.name || device?.localName || '';
      if (device?.id !== ESP32_MAC && !nombreDev.includes('MAKANA')) return;

      bleManager.stopDeviceScan();

      try {
        const conectado = await device!.connect();
        await new Promise(r => setTimeout(r, 500));
        await conectado.discoverAllServicesAndCharacteristics();
        dispositivoRef.current = conectado;
        setConectado(true);
        setConectando(false);
        conectado.onDisconnected(() => {
          setConectado(false);
          dispositivoRef.current = null;
        });
      } catch {
        setConectando(false);
        Alert.alert('Error', 'No se pudo conectar. Reinicia el ESP32 e intenta de nuevo.');
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setConectando(false);
    }, 12_000);
  };

  // ── Enviar comando ────────────────────────────────────────────
  const enviarComando = (comando: string): Promise<string | null> =>
    new Promise(async (resolve) => {
      const device = dispositivoRef.current;
      if (!device) return resolve(null);

      let suscripcion: Subscription | null = null;
      let resuelto = false;

      const timeout = setTimeout(() => {
        if (!resuelto) { resuelto = true; suscripcion?.remove(); resolve(null); }
      }, BLE_RESPONSE_TIMEOUT_MS);

      try {
        suscripcion = device.monitorCharacteristicForService(
          SERVICE_UUID, CHARACTERISTIC_UUID,
          (err, char) => {
            if (resuelto) return;
            resuelto = true;
            clearTimeout(timeout);
            suscripcion?.remove();
            if (err || !char?.value) return resolve(null);
            resolve(Buffer.from(char.value, 'base64').toString('utf-8'));
          }
        );
        await new Promise(r => setTimeout(r, BLE_SUBSCRIBE_DELAY_MS));
        await device.writeCharacteristicWithResponseForService(
          SERVICE_UUID, CHARACTERISTIC_UUID,
          Buffer.from(comando).toString('base64')
        );
      } catch {
        if (!resuelto) {
          resuelto = true;
          clearTimeout(timeout);
          suscripcion?.remove();
          resolve(null);
        }
      }
    });

  const detener = () => bleManager.stopDeviceScan();

  return { conectado, conectando, conectar, enviarComando, detener };
}