import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ribbon, Info } from 'lucide-react-native';

interface Props {
  hayToallas: boolean;
  bleConectado: boolean;
  onSacarKit: () => void;
  onInformacion: () => void;
}

export default function ActionButtons({
  hayToallas,
  bleConectado,
  onSacarKit,
  onInformacion,
}: Props) {
  const disabled = !hayToallas || !bleConectado;

  const titulo = !hayToallas
    ? 'Sin kits'
    : !bleConectado
      ? 'Desconectado'
      : 'Saca tu Kit';

  const subtitulo = !hayToallas
    ? 'Contacta al personal'
    : !bleConectado
      ? 'Conecta el dispensador primero'
      : 'Toca para solicitar';

  return (
    <View>
      <TouchableOpacity
        style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
        onPress={onSacarKit}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          <Ribbon color="white" size={42} strokeWidth={1.5} style={{ marginRight: 20 }} />
          <View style={styles.textContainer}>
            <Text style={styles.primaryTitle}>{titulo}</Text>
            <Text style={styles.primarySubtitle}>{subtitulo}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.infoButton}
        onPress={onInformacion}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Info color="#C2185B" size={36} style={{ marginRight: 20 }} />
          <View style={styles.textContainer}>
            <Text style={styles.infoTitle}>Información</Text>
            <Text style={styles.infoSubtitle}>Conoce más sobre nosotras</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton:         { backgroundColor: '#EC407A', borderRadius: 24, padding: 28, marginBottom: 16, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, zIndex: 10 },
  primaryButtonDisabled: { backgroundColor: '#BDBDBD', shadowOpacity: 0.2 },
  buttonContent:         { flexDirection: 'row', alignItems: 'center' },
  textContainer:         { flex: 1 },
  primaryTitle:          { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  primarySubtitle:       { fontSize: 15, color: '#FCE4EC', fontWeight: '500' },
  infoButton:            { backgroundColor: 'white', borderRadius: 24, padding: 24, borderWidth: 2, borderColor: '#F8BBD0', marginBottom: 32, shadowColor: '#EC407A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 10 },
  infoTitle:             { fontSize: 22, fontWeight: 'bold', color: '#C2185B', marginBottom: 4 },
  infoSubtitle:          { fontSize: 14, color: '#F48FB1', fontWeight: '500' },
});