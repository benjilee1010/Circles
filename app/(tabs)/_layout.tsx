import { Tabs, useRouter, useSegments } from 'expo-router';
import { Platform, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';

function CustomTabBar({ colors }: { colors: ColorScheme }) {
  const router = useRouter();
  const segments = useSegments();
  const activeTab = segments[1] ?? 'index';
  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, activeTab === 'index' && styles.labelActive]}>
            People
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, activeTab === 'settings' && styles.labelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={() => <CustomTabBar colors={colors} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bar: {
      flexDirection: 'row',
      height: 52,
      alignItems: 'stretch',
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      width: 1,
      marginVertical: 12,
      backgroundColor: colors.border,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    labelActive: {
      color: colors.text,
    },
  });
}
