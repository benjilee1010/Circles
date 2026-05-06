import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: object;
}

export function PageContainer({ children, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
});
