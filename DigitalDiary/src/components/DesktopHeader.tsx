import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';
import { AuthContext } from '../context/AuthContext';

interface DesktopHeaderProps {
  activeTab: string;
  onSelectTab: (tabName: string) => void;
  onNewEntry: () => void;
}

export default function DesktopHeader({ activeTab, onSelectTab, onNewEntry }: DesktopHeaderProps) {
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (!isDesktop) return null;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <View style={styles.headerInner}>
        {/* Brand Logo */}
        <TouchableOpacity style={styles.brandContainer} onPress={() => onSelectTab('Home')} activeOpacity={0.8}>
          <LinearGradient
            colors={['#1a73e8', '#3b82f6']}
            style={styles.logoBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoIcon}>📖</Text>
          </LinearGradient>
          <View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>Digital Diary</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>Personal Journal</Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Tabs */}
        <View style={styles.navLinks}>
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'Home' && [styles.navTabActive, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
            ]}
            onPress={() => onSelectTab('Home')}
          >
            <Ionicons
              name={activeTab === 'Home' ? 'book' : 'book-outline'}
              size={18}
              color={activeTab === 'Home' ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.navTabText, { color: activeTab === 'Home' ? theme.primary : theme.textMuted }]}>
              My Entries
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'Calendar' && [styles.navTabActive, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
            ]}
            onPress={() => onSelectTab('Calendar')}
          >
            <Ionicons
              name={activeTab === 'Calendar' ? 'calendar' : 'calendar-outline'}
              size={18}
              color={activeTab === 'Calendar' ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.navTabText, { color: activeTab === 'Calendar' ? theme.primary : theme.textMuted }]}>
              Calendar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'Profile' && [styles.navTabActive, { backgroundColor: theme.primaryLight, borderColor: theme.primary }],
            ]}
            onPress={() => onSelectTab('Profile')}
          >
            <Ionicons
              name={activeTab === 'Profile' ? 'person' : 'person-outline'}
              size={18}
              color={activeTab === 'Profile' ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.navTabText, { color: activeTab === 'Profile' ? theme.primary : theme.textMuted }]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={toggleTheme}
            title="Toggle theme"
          >
            <Text style={{ fontSize: 16 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onNewEntry} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1a73e8', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newEntryButton}
            >
              <Text style={styles.plusIcon}>+</Text>
              <Text style={styles.newEntryText}>New Entry</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarChip} onPress={() => onSelectTab('Profile')}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 4,
    borderRadius: 12,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navTabActive: {
    fontWeight: '700',
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  themeToggle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  plusIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
  newEntryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  avatarChip: {
    marginLeft: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
