import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Image, ScrollView, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import api, { BASE_URL } from '../services/api';
import { ThemeContext } from '../theme/ThemeContext';
import AnimatedTouchable from '../components/AnimatedTouchable';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: 'all', label: 'All Notes' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'handwritten', label: 'Handwritten' },
  { id: 'archived', label: 'Archived' },
  { id: 'locked', label: 'Locked Notes' },
  { id: 'deleted', label: 'Recently Deleted' },
];

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [moodQuery, setMoodQuery] = useState('');
  const [tagsQuery, setTagsQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { theme } = React.useContext(ThemeContext);

  const handleUnlockNotes = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Security Warning',
          'Your device does not have a passcode or biometric authentication set up. Anyone can view your locked notes.',
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
      if (moodQuery) url += `&mood=${encodeURIComponent(moodQuery)}`;
      if (tagsQuery) url += `&tags=${encodeURIComponent(tagsQuery)}`;
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
    }, [activeCategory, searchQuery, moodQuery, tagsQuery, dateQuery])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries();
  };

  const renderItem = ({ item }: any) => {
    // Generate a short excerpt if content is long
    const excerpt = item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content;
    // Format date nicely
    const formattedDate = new Date(item.createdAt || item.date).toLocaleDateString();

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('EntryDetails', { entry: item })}
      >
        <View style={styles.cardContentContainer}>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDate}>{formattedDate}</Text>
            <Text style={styles.cardExcerpt}>{excerpt}</Text>
          </View>
          {item.image && (
            <Image 
              source={{ uri: `${BASE_URL}${item.image}` }} 
              style={styles.cardThumbnail} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="search" size={20} color={theme.textLight} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search entries..."
            placeholderTextColor={theme.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, (moodQuery || tagsQuery || dateQuery) && { backgroundColor: theme.primaryLight }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={24} color={(moodQuery || tagsQuery || dateQuery) ? theme.primary : theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.categoriesContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map(cat => (
            <AnimatedTouchable
              key={cat.id}
              style={[
                styles.categoryChip, 
                { backgroundColor: theme.border },
                activeCategory === cat.id && { backgroundColor: theme.primary }
              ]}
              onPress={() => {
                if (cat.id !== 'locked') setIsUnlocked(false);
                setLoading(true);
                setActiveCategory(cat.id);
              }}
            >
              <Text style={[
                styles.categoryText, 
                { color: theme.textMuted },
                activeCategory === cat.id && { color: '#fff' }
              ]}>
                {cat.label}
              </Text>
            </AnimatedTouchable>
          ))}
        </ScrollView>
      </View>
      {activeCategory === 'locked' && !isUnlocked ? (
        <View style={styles.lockContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={[styles.lockTitle, { color: theme.text }]}>Locked Notes</Text>
          <Text style={[styles.lockSubtitle, { color: theme.textMuted }]}>Tap below to unlock your private notes</Text>
          <AnimatedTouchable 
            style={[styles.unlockButton, { backgroundColor: theme.primary }]}
            onPress={handleUnlockNotes}
          >
            <Text style={styles.unlockButtonText}>Unlock Notes</Text>
          </AnimatedTouchable>
        </View>
      ) : loading && !refreshing ? (
        <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>You don't have any diary entries yet.</Text>
          <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>Tap the + button to create one!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={({ item }) => {
            const excerpt = item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content;
            const formattedDate = new Date(item.createdAt || item.date).toLocaleDateString();
            return (
              <AnimatedTouchable 
                style={[styles.card, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate('EntryDetails', { entry: item })}
              >
                <View style={styles.cardContentContainer}>
                  <View style={styles.cardTextContainer}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.cardDate, { color: theme.textLight }]}>{formattedDate}</Text>
                    <Text style={[styles.cardExcerpt, { color: theme.textMuted }]}>{excerpt}</Text>
                  </View>
                  {item.image && (
                    <Image 
                      source={{ uri: `${BASE_URL}${item.image}` }} 
                      style={[styles.cardThumbnail, { backgroundColor: theme.border }]} 
                    />
                  )}
                </View>
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
      <AnimatedTouchable 
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddEntry')}
      >
        <Text style={styles.fabText}>+</Text>
      </AnimatedTouchable>

      <Modal visible={filterModalVisible} animationType="slide" transparent={true} onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>Done</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.filterLabel, { color: theme.text }]}>Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
              {['', '😊', '😔', '😡', '😌', '🤔', '💼', '🤒', '🎉'].map(emoji => (
                <TouchableOpacity 
                  key={emoji || 'all'} 
                  style={[
                    styles.moodButton, 
                    moodQuery === emoji && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setMoodQuery(emoji)}
                >
                  <Text style={styles.moodEmoji}>{emoji || 'All'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { color: theme.text, marginTop: 20 }]}>Tags (comma separated)</Text>
            <TextInput
              style={[styles.tagInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. work, personal"
              placeholderTextColor={theme.textLight}
              value={tagsQuery}
              onChangeText={setTagsQuery}
            />

            <Text style={[styles.filterLabel, { color: theme.text, marginTop: 20 }]}>Specific Date</Text>
            <TextInput
              style={[styles.tagInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textLight}
              value={dateQuery}
              onChangeText={setDateQuery}
            />

            <TouchableOpacity 
              style={[styles.clearButton, { borderColor: theme.danger }]}
              onPress={() => {
                setMoodQuery('');
                setTagsQuery('');
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
    marginLeft: 10,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  moodScroll: {
    flexDirection: 'row',
  },
  moodButton: {
    height: 45,
    minWidth: 45,
    paddingHorizontal: 10,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  moodEmoji: {
    fontSize: 20,
  },
  tagInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  clearButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryChipActive: {
    backgroundColor: '#208AEF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  cardExcerpt: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#208AEF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
    lineHeight: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  lockSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  unlockButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
