import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, type ThemeColors } from '@/src/ui/theme/colors';

export type ColorScheme = 'light' | 'dark';

interface UseThemeReturn {
  colors: ThemeColors;
  isDark: boolean;
  colorScheme: ColorScheme;
}

export function useTheme(): UseThemeReturn {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  return {
    colors: isDark ? DarkColors : LightColors,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}
