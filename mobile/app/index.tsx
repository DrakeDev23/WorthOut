import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worthout</Text>
      <Text style={styles.subtitle}>Every rep is worth it.</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Phase 1 Foundation Ready</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#A0A0A0',
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
  },
  badgeText: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '600',
  },
});
