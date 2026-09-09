import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import api, { BASE_URL } from '../services/api';
import { ThemeContext } from '../theme/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import AnimatedTouchable from '../components/AnimatedTouchable';
import DesktopHeader from '../components/DesktopHeader';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: 'all', label: 'All Notes', icon: 'document-text-outline' },
  { id: 'favorites', label: 'Favorites', icon: 'star-outline' },
  { id: 'handwritten', label: 'Handwritten', icon: 'create-outline' },
  { id: 'archived', label: 'Archived', icon: 'archive-outline' },
  { id: 'locked', label: 'Locked Notes', icon: 'lock-closed-outline' },
  { id: 'deleted', label: 'Recently Deleted', icon: 'trash-outline' },
];

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= 768;
  const numColumns = isDesktop ? (width >= 1150 ? 3 : 2) : 1;

  const handleUnlockNotes = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Security Warning',
          'Your device does not have biometric authentication enabled. Anyone can view locked notes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unlock Anyway', onPress: () => setIsUnlocked(true) }
          ]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your private notes',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setIsUnlocked(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'An error occurred during authentication.');
    }
  };

  const fetchEntries = async () => {
    try {
      let url = `/diary?filter=${activeCategory}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (titleQuery) url += `&title=${encodeURIComponent(titleQuery)}`;
      if (dateQuery) url += `&date=${encodeURIComponent(dateQuery)}`;

      const response = await api.get(url);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch entries', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [activeCategory, searchQuery, titleQuery, dateQuery])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  const getUserFirstName = () => {
    if (!user?.name) return 'Friend';
    return user.name.split(' ')[0];
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Desktop Navigation Header */}
      {isDesktop && (
        <DesktopHeader
          activeTab="Home"
          onSelectTab={(tab) => navigation.navigate(tab)}
          onNewEntry={() => navigation.navigate('AddEntry')}
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.webContainer}>
          {/* Welcome Banner on Desktop */}
          {isDesktop && (
            <View style={styles.heroSection}>
              <View>
                <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                  Good day, {getUserFirstName()} 👋
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: theme.textMuted }]}>
                  Here is a glance at your daily journal entries & memories.
                </Text>
              </View>

              {/* Stats badges */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={styles.statIcon}>📝</Text>
                  <View>
                    <Text style={[styles.statCount, { color: theme.text }]}>{entries.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Entries</Text>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={styles.statIcon}>⭐</Text>
                  <View>
                    <Text style={[styles.statCount, { color: theme.text }]}>
                      {entries.filter(e => e.isFavorite).length}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Favorites</Text>
                  </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={styles.statIcon}>🎨</Text>
                  <View>
                    <Text style={[styles.statCount, { color: theme.text }]}>
                      {entries.filter(e => e.isHandwritten).length}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Drawings</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Search bar & filter trigger */}
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.background }]}>
              <Ionicons name="search" size={20} color={theme.textLight} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by title, keywords or content..."
                placeholderTextColor={theme.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textLight} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: (titleQuery || dateQuery) ? theme.primaryLight : theme.background, borderColor: theme.border }
              ]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons
                name="options-outline"
                size={22}
                color={(titleQuery || dateQuery) ? theme.primary : theme.text}
              />
            </TouchableOpacity>
          </View>

          {/* Category Chips */}
          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => {
                      if (cat.id !== 'locked') setIsUnlocked(false);
                      setLoading(true);
                      setActiveCategory(cat.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isActive ? '#fff' : theme.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[
                      styles.categoryText,
                      { color: theme.textMuted },
                      isActive && { color: '#fff', fontWeight: '700' }
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Locked screen prompt */}
          {activeCategory === 'locked' && !isUnlocked ? (
            <View style={[styles.lockCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.lockIconBadge}>
                <Text style={{ fontSize: 36 }}>🔒</Text>
              </View>
              <Text style={[styles.lockTitle, { color: theme.text }]}>Private & Locked Notes</Text>
              <Text style={[styles.lockSubtitle, { color: theme.textMuted }]}>
                Authenticate to unlock and view your encrypted diary entries.
              </Text>
              <TouchableOpacity onPress={handleUnlockNotes} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#1a73e8', theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.unlockBtn}
                >
                  <Text style={styles.unlockBtnText}>Unlock Notes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : entries.length === 0 ? (
            /* Beautiful Empty State */
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <LinearGradient
                colors={['#e0f2fe', '#dbeafe']}
                style={styles.emptyIconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{ fontSize: 44 }}>📖</Text>
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {searchQuery ? 'No matching entries found' : 'Your diary is ready for your first entry'}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                {searchQuery
                  ? 'Try searching for another title or clear your filters.'
                  : 'Start capturing your thoughts, memories, sketches, and daily moments.'}
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('AddEntry')}
                activeOpacity={0.85}
                style={{ marginTop: 24 }}
              >
                <LinearGradient
                  colors={['#1a73e8', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createFirstBtn}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createFirstBtnText}>Create Diary Entry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* Entry Cards Grid */
            <FlatList
              key={numColumns}
              numColumns={numColumns}
              data={entries}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const excerpt = item.content.length > 90 ? item.content.substring(0, 90) + '...' : item.content;
                const formattedDate = new Date(item.createdAt || item.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <AnimatedTouchable
                    style={[
                      styles.card,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      isDesktop && styles.desktopGridCard,
                    ]}
                    onPress={() => navigation.navigate('EntryDetails', { entry: item })}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardDate, { color: theme.primary }]}>{formattedDate}</Text>
                      {item.isHandwritten && (
                        <View style={[styles.badgeChip, { backgroundColor: theme.primaryLight }]}>
                          <Text style={[styles.badgeText, { color: theme.primary }]}>🎨 Sketch</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <Text style={[styles.cardExcerpt, { color: theme.textMuted }]} numberOfLines={3}>
                      {excerpt || 'No additional text content.'}
                    </Text>

                    {item.image && (
                      <Image
                        source={{ uri: `${BASE_URL}${item.image}` }}
                        style={[styles.cardThumbnail, { backgroundColor: theme.border }]}
                      />
                    )}
                  </AnimatedTouchable>
                );
              }}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (Mobile & Small screens) */}
      {!isDesktop && (
        <AnimatedTouchable
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddEntry')}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </AnimatedTouchable>
      )}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="fade" transparent={true} onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filter Entries</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>Done</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.filterLabel, { color: theme.text, marginTop: 16 }]}>Entry Title</Text>
            <TextInput
              style={[styles.tagInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Filter by title..."
              placeholderTextColor={theme.textLight}
              value={titleQuery}
              onChangeText={setTitleQuery}
            />

            <Text style={[styles.filterLabel, { color: theme.text, marginTop: 16 }]}>Specific Date</Text>
            <TextInput
              style={[styles.tagInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textLight}
              value={dateQuery}
              onChangeText={setDateQuery}
            />

            <TouchableOpacity
              style={[styles.clearButton, { borderColor: theme.danger }]}
              onPress={() => {
                setTitleQuery('');
                setDateQuery('');
              }}
            >
              <Text style={[styles.clearButtonText, { color: theme.danger }]}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  webContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    paddingTop: 16,
  },

  /* ── Hero / Welcome Section ── */
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 8,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 22,
  },
  statCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },

  /* ── Search Container ── */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  filterButton: {
    width: 44,
    height: 44,
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Categories ── */
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesScroll: {
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* ── Empty State Card ── */
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 22,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  createFirstBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* ── Lock Card ── */
  lockCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 10,
  },
  lockIconBadge: {
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 400,
  },
  unlockBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  unlockBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* ── List / Cards Grid ── */
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  desktopGridCard: {
    flex: 1,
    margin: 8,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardExcerpt: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  cardThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: 4,
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },

  /* ── Filter Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModalContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  clearButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
