// ============================================================
//  ModalAgregarEstudiante.tsx
// ============================================================

import React from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';

type Props = {
  visible:         boolean;
  nuevoDoc:        string;
  nuevoNombre:     string;
  guardando:       boolean;
  onChangeDoc:     (v: string) => void;
  onChangeNombre:  (v: string) => void;
  onGuardar:       () => void;
  onCerrar:        () => void;
};

export default function ModalAgregarEstudiante({
  visible, nuevoDoc, nuevoNombre, guardando,
  onChangeDoc, onChangeNombre, onGuardar, onCerrar,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Agregar Estudiante</Text>
            <TouchableOpacity onPress={onCerrar}>
              <X color="#C2185B" size={24} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Número de cédula</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="0000000000"
              placeholderTextColor="#F8BBD0"
              value={nuevoDoc}
              onChangeText={onChangeDoc}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>Nombre completo</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Nombre Apellido"
              placeholderTextColor="#F8BBD0"
              value={nuevoNombre}
              onChangeText={onChangeNombre}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, guardando && { opacity: 0.6 }]}
            onPress={onGuardar}
            disabled={guardando}
            activeOpacity={0.8}
          >
            {guardando
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.saveBtnText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card:      { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:     { fontSize: 22, fontWeight: 'bold', color: '#C2185B' },
  label:     { fontSize: 14, color: '#C2185B', fontWeight: '600', marginBottom: 8 },
  inputWrap: { backgroundColor: '#FCE4EC', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 20, borderWidth: 2, borderColor: '#F8BBD0' },
  input:     { fontSize: 16, color: '#C2185B', fontWeight: '600' },
  saveBtn:   { backgroundColor: '#EC407A', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
