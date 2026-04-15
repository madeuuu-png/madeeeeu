import { View, StyleSheet } from 'react-native';

type Props = {
  variant?: 'default' | 'home' | 'admin';
};

export default function BackgroundCircles({ variant = 'default' }: Props) {
  return (
    <>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      {variant !== 'admin' && <View style={styles.circle3} />}
    </>
  );
}

const styles = StyleSheet.create({
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#F48FB1', opacity: 0.2,  top: -100, left: -50  },
  circle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#EC407A', opacity: 0.15, bottom: -50, right: -30 },
  circle3: { position: 'absolute', width: 150, height: 150, borderRadius: 75,  backgroundColor: '#F8BBD0', opacity: 0.3,  top: 300,  right: 20  },
});