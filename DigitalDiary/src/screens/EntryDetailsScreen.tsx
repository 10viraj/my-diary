import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Share } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import api, { BASE_URL } from '../services/api';

export default function EntryDetailsScreen({ route, navigation }: any) {
  const { entry } = route.params || {};
  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(entry?.isFavorite || false);
  const [isArchived, setIsArchived] = useState(entry?.isArchived || false);
  const [isLocked, setIsLocked] = useState(entry?.isLocked || false);
  const viewShotRef = useRef<any>(null);

  if (!entry) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to move this diary entry to the trash?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await api.delete(`/diary/${entry._id}`);
              navigation.goBack();
            } catch (error) {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete the entry.');
            }
          }
        }
      ]
    );
  };

  const handlePermanentDelete = async () => {
    Alert.alert(
      "Permanently Delete",
      "This action cannot be undone. Permanently delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await api.delete(`/diary/${entry._id}/permanent`);
              navigation.goBack();
            } catch (error) {
              setDeleting(false);
              Alert.alert('Error', 'Failed to permanently delete the entry.');
            }
          }
        }
      ]
    );
  };

  const handleRestore = async () => {
    try {
      setDeleting(true);
      await api.put(`/diary/${entry._id}`, { isDeleted: false });
      navigation.goBack();
    } catch (error) {
      setDeleting(false);
      Alert.alert('Error', 'Failed to restore the entry.');
    }
  };

  const toggleFavorite = async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    try {
      await api.put(`/diary/${entry._id}`, { isFavorite: newValue });
    } catch (error) {
      setIsFavorite(!newValue);
    }
  };

  const toggleArchive = async () => {
    const newValue = !isArchived;
    setIsArchived(newValue);
    try {
      await api.put(`/diary/${entry._id}`, { isArchived: newValue });
    } catch (error) {
      setIsArchived(!newValue);
    }
  };

  const toggleLock = async () => {
    const newValue = !isLocked;
    setIsLocked(newValue);
    try {
      await api.put(`/diary/${entry._id}`, { isLocked: newValue });
    } catch (error) {
      setIsLocked(!newValue);
    }
  };

  const formattedDate = new Date(entry.createdAt || entry.date).toLocaleDateString();

  const calculateTotal = (text: string) => {
    if (!text) return 0;
    const matches = text.match(/-?\d+(\.\d+)?/g);
    if (!matches) return 0;
    return matches.reduce((acc, val) => acc + parseFloat(val), 0);
  };

  const total = calculateTotal(entry.content);

  const handleShare = () => {
    Alert.alert(
      'Export Format',
      'How would you like to export this entry?',
      [
        {
          text: 'As Image',
          onPress: async () => {
            try {
              if (viewShotRef.current) {
                const uri = await viewShotRef.current.capture();
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(uri, { dialogTitle: 'Export Diary Entry', mimeType: 'image/jpeg' });
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to export the entry image.');
            }
          }
        },
        {
          text: 'As Text',
          onPress: async () => {
            try {
              const message = `Diary Entry: ${entry.title}\nDate: ${formattedDate}\n\n${entry.content}${total !== 0 ? `\n\nTotal: ${total.toLocaleString()}` : ''}`;
              await Share.share({ message, title: entry.title });
            } catch (error) {
              Alert.alert('Error', 'Failed to share the entry text.');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.viewShotContainer}>
        {entry.image && (
          <Image 
            source={{ uri: `${BASE_URL}${entry.image}` }} 
            style={styles.heroImage} 
          />
        )}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{entry.title}</Text>
            {!entry.isDeleted && (
              <TouchableOpacity onPress={toggleFavorite}>
                <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={28} color={isFavorite ? '#f39c12' : '#999'} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.date}>
            {formattedDate} {entry.isHandwritten && ' • ✍️ Handwritten'}
          </Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.content}>
            {entry.content}
          </Text>
        </View>

        {total !== 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Auto-calculated Total:</Text>
            <Text style={styles.totalValue}>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
          </View>
        )}
      </ViewShot>
      
      {entry.isDeleted ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRestore} disabled={deleting}>
            <Text style={styles.actionButtonText}>Restore Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handlePermanentDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#e74c3c" /> : <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Forever</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditEntry', { entry })} disabled={deleting}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={handleShare} disabled={deleting}>
            <Text style={[styles.actionButtonText, styles.exportButtonText]}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={toggleArchive} disabled={deleting}>
            <Text style={[styles.actionButtonText, styles.exportButtonText]}>{isArchived ? 'Unarchive' : 'Archive'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.lockButton]} onPress={toggleLock} disabled={deleting}>
            <Text style={[styles.actionButtonText, styles.lockButtonText]}>{isLocked ? 'Unlock' : 'Lock'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#e74c3c" /> : <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Trash</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
  },
  viewShotContainer: {
    backgroundColor: '#fff',
    paddingBottom: 20, // Give some breathing room at bottom before buttons
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: '#888',
  },
  contentContainer: {
    padding: 20,
  },
  content: {
    fontSize: 18,
    color: '#444',
    lineHeight: 28,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: '#208AEF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 40,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#208AEF',
  },
  exportButtonText: {
    color: '#208AEF',
  },
  lockButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  lockButtonText: {
    color: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#e74c3c',
  },
  heroImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f8f9fa',
  },
});
