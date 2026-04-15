// ============================================================
//  useAdmin.ts — Lógica completa del panel de administración
// ============================================================

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../core/supabase/supabase';
import {
  obtenerInventario,
  recargarInventario,
  agregarCedulaLocal,
  type Inventario,
} from '../core/dataBase';

export type Estudiante = {
  NumDocumento: string;
  NombreCompleto: string;
  UltimaEntrega: string | null;
};

export type HistorialItem = {
  NombreCompleto: string;
  NumDocumento:   string;
  UltimaEntrega:  string;
};

// ── Inventario ──────────────────────────────────────────────
export function useInventario() {
  const [inventario, setInventario] = useState<Inventario | null>(null);

  const refrescar = useCallback(() => {
    setInventario(obtenerInventario());
  }, []);

  const marcarRecargado = () => {
    Alert.alert(
      'Confirmar recarga',
      '¿Confirmas que el dispensador fue recargado físicamente con 8+8 toallas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, recargar',
          onPress: () => {
            recargarInventario(8, 8);
            setInventario(obtenerInventario());
            Alert.alert('✅ Listo', 'Inventario recargado a 8+8 toallas');
          },
        },
      ]
    );
  };

  return { inventario, refrescar, marcarRecargado };
}

// ── Historial ───────────────────────────────────────────────
export function useHistorial() {
  const [historial,        setHistorial]        = useState<HistorialItem[]>([]);
  const [mostrar,          setMostrar]          = useState(false);
  const [cargando,         setCargando]         = useState(false);

  const toggleHistorial = async () => {
    if (mostrar) { setMostrar(false); return; }
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('NombreCompleto, NumDocumento, UltimaEntrega')
        .not('UltimaEntrega', 'is', null)
        .order('UltimaEntrega', { ascending: false })
        .limit(50);
      if (!error && data) setHistorial(data);
    } finally {
      setCargando(false);
      setMostrar(true);
    }
  };

  return { historial, mostrar, cargando, toggleHistorial };
}

// ── Estudiantes ─────────────────────────────────────────────
export function useEstudiantes() {
  const [estudiantes,  setEstudiantes]  = useState<Estudiante[]>([]);
  const [mostrar,      setMostrar]      = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoDoc,     setNuevoDoc]     = useState('');
  const [nuevoNombre,  setNuevoNombre]  = useState('');
  const [guardando,    setGuardando]    = useState(false);

  const cargarDesdeSupabase = async () => {
    const { data } = await supabase
      .from('estudiantes')
      .select('NumDocumento, NombreCompleto, UltimaEntrega')
      .order('NombreCompleto', { ascending: true });
    if (data) setEstudiantes(data);
  };

  const toggleEstudiantes = async () => {
    if (mostrar) { setMostrar(false); return; }
    setCargando(true);
    await cargarDesdeSupabase();
    setCargando(false);
    setMostrar(true);
  };

  const eliminar = (doc: string, nombre: string) => {
    Alert.alert(
      'Eliminar estudiante',
      `¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('estudiantes')
              .delete()
              .eq('NumDocumento', doc);
            if (error) { Alert.alert('Error', 'No se pudo eliminar'); return; }
            setEstudiantes(prev => prev.filter(e => e.NumDocumento !== doc));
          },
        },
      ]
    );
  };

  const agregar = async () => {
    const doc    = nuevoDoc.trim();
    const nombre = nuevoNombre.trim();

    if (doc.length !== 10)  { Alert.alert('Error', 'La cédula debe tener 10 dígitos'); return; }
    if (!nombre)            { Alert.alert('Error', 'El nombre no puede estar vacío');  return; }

    setGuardando(true);
    try {
      const { error } = await supabase
        .from('estudiantes')
        .insert({ NumDocumento: doc, NombreCompleto: nombre });

      if (error) {
        Alert.alert('Error', error.code === '23505' ? 'Esa cédula ya existe' : error.message);
        return;
      }

      agregarCedulaLocal(doc);
      Alert.alert('✅ Listo', `${nombre} agregada correctamente`);
      setModalAbierto(false);
      setNuevoDoc('');
      setNuevoNombre('');

      if (mostrar) {
        setCargando(true);
        await cargarDesdeSupabase();
        setCargando(false);
      }
    } catch {
      Alert.alert('Error', 'Algo salió mal');
    } finally {
      setGuardando(false);
    }
  };

  const resetearCooldown = (doc: string, nombre: string) => {
    Alert.alert(
      'Resetear cooldown',
      `¿Permitir que ${nombre} retire un kit ahora aunque no hayan pasado 28 días?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, resetear',
          onPress: async () => {
            const { error } = await supabase
              .from('estudiantes')
              .update({ UltimaEntrega: null })
              .eq('NumDocumento', doc);
            if (error) { Alert.alert('Error', 'No se pudo resetear el cooldown'); return; }
            setEstudiantes(prev =>
              prev.map(e => e.NumDocumento === doc ? { ...e, UltimaEntrega: null } : e)
            );
            Alert.alert('✅ Listo', `Cooldown de ${nombre} reseteado`);
          },
        },
      ]
    );
  };

  return {
    estudiantes, mostrar, cargando,
    modalAbierto, setModalAbierto,
    nuevoDoc, setNuevoDoc,
    nuevoNombre, setNuevoNombre,
    guardando,
    toggleEstudiantes, eliminar, agregar, resetearCooldown,
  };
}