import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

import { ThemeProvider, ThemeContext } from './src/theme/ThemeContext';
import { DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

function AppContent() {
  const { isDarkMode, theme } = React.useContext(ThemeContext);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'global-web-styles';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        html, body, #root {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background-color: ${isDarkMode ? '#0f172a' : '#f0f4f8'};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#334155' : '#cbd5e1'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#475569' : '#94a3b8'};
        }
      `;
    }
  }, [isDarkMode]);

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
