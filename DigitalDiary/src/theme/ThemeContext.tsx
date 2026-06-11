import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  background: '#ffffff',
  surface: '#f8f9fa',
  card: '#ffffff',
  text: '#333333',
  textMuted: '#666666',
  textLight: '#999999',
  border: '#eeeeee',
  primary: '#208AEF',
  primaryDark: '#1560A6',
  primaryLight: '#f0f8ff',
  danger: '#e74c3c',
  success: '#2ecc71',
  warning: '#f39c12',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkTheme = {
  background: '#121212',
  surface: '#1e1e1e',
  card: '#242424',
  text: '#ffffff',
  textMuted: '#aaaaaa',
  textLight: '#777777',
  border: '#333333',
  primary: '#3ea6ff',
  primaryDark: '#208AEF',
  primaryLight: '#1e3a5f',
  danger: '#ff6b6b',
  success: '#2ecc71',
  warning: '#f39c12',
  overlay: 'rgba(0,0,0,0.7)',
};

export type ThemeType = typeof lightTheme;

interface ThemeContextProps {
  isDarkMode: boolean;
  theme: ThemeType;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('Failed to load theme setting', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Failed to save theme setting', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
