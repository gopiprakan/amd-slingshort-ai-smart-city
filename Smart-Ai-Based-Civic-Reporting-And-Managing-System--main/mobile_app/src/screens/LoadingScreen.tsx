import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../utils/constants';

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Civic Reporter</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});

export default LoadingScreen;