import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { BASE_URL } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Notes' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'handwritten', label: 'Handwritten' },
  { id: 'archived', label: 'Archived' },
  { id: 'deleted', label: 'Recently Deleted' },
];

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchEntries = async () => {
    try {
      const response = await api.get(`/diary?filter=${activeCategory}`);
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
    }, [activeCategory])
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

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  const renderCategoryChips = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
            onPress={() => {
              setLoading(true);
              setActiveCategory(cat.id);
            }}
          >
            <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderCategoryChips()}
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have any diary entries yet.</Text>
          <Text style={styles.emptySubtext}>Tap the + button to create one!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#208AEF']} />
          }
        />
      )}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddEntry')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});
