import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Share,
  Platform,
  useWindowDimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import api, { BASE_URL } from '../services/api';
import { ThemeContext } from '../theme/ThemeContext';
import AnimatedTouchable from '../components/AnimatedTouchable';

export default function EntryDetailsScreen({ route, navigation }: any) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { width } = useWindowDimensions();
  const { entry } = route.params || {};

  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(entry?.isFavorite || false);
  const [isArchived, setIsArchived] = useState(entry?.isArchived || false);
  const [isLocked, setIsLocked] = useState(entry?.isLocked || false);
  const viewShotRef = useRef<any>(null);

  const isDesktop = Platform.OS === 'web' && width >= 768;

  if (!entry) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.danger }]}>Entry not found</Text>
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

  const formattedDate = new Date(entry.createdAt || entry.date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  const ActionCard = ({ icon, label, onPress, color, loading = false }: any) => (
    <AnimatedTouchable
      style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: `${color}15` }]}>
        {loading ? (
          <ActivityIndicator color={color} size="small" />
        ) : (
          <Ionicons name={icon} size={20} color={color} />
        )}
      </View>
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </AnimatedTouchable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDesktop ? (isDarkMode ? '#0f172a' : '#f0f4f8') : theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.webCard, isDesktop && styles.desktopCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Navigation Bar */}
        <View style={[styles.detailsNav, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.navRightActions}>
            {!entry.isDeleted && (
              <TouchableOpacity
                style={[styles.favoriteBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={toggleFavorite}
              >
                <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={20} color={isFavorite ? '#f59e0b' : theme.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: theme.primaryLight }]}
              onPress={() => navigation.navigate('EditEntry', { entry })}
            >
              <Ionicons name="create-outline" size={18} color={theme.primary} />
              <Text style={[styles.editBtnText, { color: theme.primary }]}>Edit Entry</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ViewShot Container */}
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={{ backgroundColor: theme.card }}>
          {entry.image && (
            <Image
              source={{ uri: `${BASE_URL}${entry.image}` }}
              style={[styles.heroImage, { backgroundColor: theme.background }]}
            />
          )}

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{entry.title}</Text>
            <Text style={[styles.date, { color: theme.primary }]}>
              📅 {formattedDate} {entry.isHandwritten && ' • 🎨 Sketch Note'}
            </Text>
          </View>

          <View style={styles.contentContainer}>
            <Text style={[styles.content, { color: theme.text }]}>
              {entry.content}
            </Text>
          </View>

          {total !== 0 && (
            <View style={[styles.totalContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Auto-calculated Total:</Text>
              <Text style={[styles.totalValue, { color: theme.primary }]}>
                {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        </ViewShot>

        {/* Quick Actions Row */}
        {entry.isDeleted ? (
          <View style={[styles.actionsWrapper, { borderTopColor: theme.border }]}>
            <Text style={[styles.actionsTitle, { color: theme.text }]}>Deleted Entry Actions</Text>
            <View style={styles.actionsGrid}>
              <ActionCard icon="refresh-outline" label="Restore" onPress={handleRestore} color="#10b981" loading={deleting} />
              <ActionCard icon="trash-bin-outline" label="Delete Forever" onPress={handlePermanentDelete} color="#ef4444" loading={deleting} />
            </View>
          </View>
        ) : (
          <View style={[styles.actionsWrapper, { borderTopColor: theme.border }]}>
            <Text style={[styles.actionsTitle, { color: theme.text }]}>Options & Tools</Text>
            <View style={styles.actionsGrid}>
              <ActionCard icon="create-outline" label="Edit" onPress={() => navigation.navigate('EditEntry', { entry })} color={theme.primary} />
              <ActionCard icon="share-outline" label="Export" onPress={handleShare} color="#8b5cf6" />
              <ActionCard icon={isArchived ? "archive" : "archive-outline"} label={isArchived ? "Unarchive" : "Archive"} onPress={toggleArchive} color="#10b981" />
              <ActionCard icon={isLocked ? "lock-closed" : "lock-open-outline"} label={isLocked ? "Unlock" : "Lock"} onPress={toggleLock} color="#f59e0b" />
              <ActionCard icon="trash-outline" label="Trash" onPress={handleDelete} color="#ef4444" loading={deleting} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Platform.OS === 'web' ? 24 : 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCard: {
    width: '100%',
    flex: 1,
  },
  desktopCard: {
    maxWidth: 920,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    marginVertical: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },

  /* ── Nav Header ── */
  detailsNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* ── Content ── */
  heroImage: {
    width: '100%',
    height: 380,
    resizeMode: 'contain',
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  content: {
    fontSize: 18,
    lineHeight: 30,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 28,
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  /* ── Quick Actions ── */
  actionsWrapper: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderTopWidth: 1,
    marginTop: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
