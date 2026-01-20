import { MD3DarkTheme, configureFonts, adaptNavigationTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// 1. Define your specific B2B Palette
const colors = {
  slate900: '#0F172A', // Main Background
  slate800: '#1E293B', // Surface / Cards
  slate700: '#334155', // Borders / Dividers
  teal600:  '#0D9488', // Primary Accent
  teal800:  '#115E59', // Darker Teal for active states
  white:    '#F8FAFC', // High Emphasis Text (Slate 50)
  grey:     '#94A3B8', // Medium Emphasis Text (Slate 400)
  error:    '#EF4444', // Red 500
};

// 2. Configure Typography (Optional: Adjust for higher density B2B data)
const fontConfig = {
  fontFamily: 'System', // Or your custom font
};

// 3. Construct the Paper Theme
export const AppTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({config: fontConfig}),
  colors: {
    ...MD3DarkTheme.colors,

    // Core Backgrounds
    background: colors.slate900,
    surface: colors.slate800,
    surfaceVariant: colors.slate800, // Used for Card backgrounds in MD3

    // Primary Accents
    primary: colors.teal600,
    onPrimary: colors.slate900, // Text on top of primary button
    primaryContainer: colors.teal800,
    onPrimaryContainer: '#CCFBF1', // Teal 100

    // Secondary / Tertiary (Muted elements)
    secondary: colors.slate700,
    onSecondary: colors.white,
    secondaryContainer: colors.slate700,
    onSecondaryContainer: colors.white,

    // Text & Borders
    onBackground: colors.white,
    onSurface: colors.white,
    onSurfaceVariant: colors.grey, // Good for labels/subtitles
    outline: colors.slate700, // Input borders
    outlineVariant: colors.slate700,

    // Feedback
    error: colors.error,
  },
};

// 4. Adapt for Expo Router / React Navigation
// This ensures the navigation header matches the page background
const { DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDarkTheme, // Not using light, but required by func
  reactNavigationDark: NavigationDarkTheme,
  materialDark: AppTheme,
});

export const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: AppTheme.colors.background,
    card: AppTheme.colors.surface, // Header background
    text: AppTheme.colors.onSurface,
    border: AppTheme.colors.outline,
  },
};
