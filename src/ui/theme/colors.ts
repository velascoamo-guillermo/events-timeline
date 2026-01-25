/**
 * Color constants for the Timeline UI with light and dark mode support
 */

export interface ThemeColors {
  background: string;
  cardBackground: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  syncStatus: {
    pending: string;
    synced: string;
    failed: string;
  };
  eventCategory: {
    domain: string;
    sync: string;
    system: string;
  };
  divider: string;
  shadow: string;
  indicator: string;
}

export const LightColors: ThemeColors = {
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    tertiary: '#8E8E93',
  },
  syncStatus: {
    pending: '#FF9500',
    synced: '#34C759',
    failed: '#FF3B30',
  },
  eventCategory: {
    domain: '#007AFF',
    sync: '#AF52DE',
    system: '#8E8E93',
  },
  divider: '#E5E5E5',
  shadow: '#000000',
  indicator: '#007AFF',
};

export const DarkColors: ThemeColors = {
  background: '#000000',
  cardBackground: '#1C1C1E',
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    tertiary: '#8E8E93',
  },
  syncStatus: {
    pending: '#FF9F0A',
    synced: '#30D158',
    failed: '#FF453A',
  },
  eventCategory: {
    domain: '#0A84FF',
    sync: '#BF5AF2',
    system: '#8E8E93',
  },
  divider: '#38383A',
  shadow: '#000000',
  indicator: '#0A84FF',
};

// Default export for backwards compatibility
export const Colors = LightColors;
