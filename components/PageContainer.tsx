import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: object;
}

export function PageContainer({ children, style }: Props) {
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: 680 },
});
