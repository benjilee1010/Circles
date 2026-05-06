export const lightColors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F2EF',
  border: '#E8E4DF',
  text: '#1A1714',
  textSecondary: '#7A746E',
  textTertiary: '#B0A89F',
  accent: '#B5A99A',
  accentDark: '#8C7F72',
  overdue: '#C97B5A',
  overdueLight: '#FBF0EB',
  dueSoon: '#C9A85A',
  dueSoonLight: '#FBF6EB',
  ok: '#6A9E7F',
  okLight: '#EBF5EF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E4DF',
};

export const darkColors = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  surfaceAlt: '#3A3A3C',
  border: '#48484A',
  text: '#F2F2F7',
  textSecondary: '#AEAEB2',
  textTertiary: '#636366',
  accent: '#B5A99A',
  accentDark: '#C4B5A8',
  overdue: '#FF7F7F',
  overdueLight: '#3D1F1F',
  dueSoon: '#FFD166',
  dueSoonLight: '#3D3320',
  ok: '#7BC99A',
  okLight: '#1F3D2A',
  tabBar: '#1C1C1E',
  tabBarBorder: '#38383A',
};

// Keep Colors as a named export alias for lightColors for any static fallback usage
export const Colors = lightColors;

export type ColorScheme = typeof lightColors;
