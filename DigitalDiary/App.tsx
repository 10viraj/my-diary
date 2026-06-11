import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

import { ThemeProvider, ThemeContext } from './src/theme/ThemeContext';
import { DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

function AppContent() {
  const { isDarkMode, theme } = React.useContext(ThemeContext);

  const navigationTheme = isDarkMode ? {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    }
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
