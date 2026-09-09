import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';

interface WebWrapperProps {
  children: React.ReactNode;
  maxWidth?: number;
  isAuth?: boolean;
}

export default function WebWrapper({ children, maxWidth = 1080, isAuth = false }: WebWrapperProps) {
  const { width } = useWindowDimensions();
  const { theme, isDarkMode } = React.useContext(ThemeContext);

  const isWebDesktop = Platform.OS === 'web' && width >= 768;

  if (!isWebDesktop) {
    return <View style={{ flex: 1, width: '100%' }}>{children}</View>;
  }

  // On Web Desktop: wrap in a sleek centered desktop view
  return (
    <View style={[styles.outerBackground, { backgroundColor: isDarkMode ? '#0f172a' : '#e2e8f0' }]}>
      <View
        style={[
          styles.innerContainer,
          {
            maxWidth: isAuth ? 920 : maxWidth,
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
          isAuth && styles.authContainer,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.OS === 'web' ? 24 : 0,
  },
  innerContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  authContainer: {
    maxHeight: 680,
    borderRadius: 24,
  },
});
