import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, Platform, useWindowDimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import api, { BASE_URL } from '../services/api';
import { ThemeContext } from '../theme/ThemeContext';
import AnimatedTouchable from '../components/AnimatedTouchable';
import DesktopHeader from '../components/DesktopHeader';

export default function CalendarScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState<any>({});
  
  const { theme } = useContext(ThemeContext);
  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === 'web' && width >= 768;

  const fetchAllEntries = async () => {
    try {
      const response = await api.get(`/diary?filter=all`);
      const allEntries = response.data;
      setEntries(allEntries);
      
      const newMarkedDates: any = {};
      allEntries.forEach((entry: any) => {
        const dateString = new Date(entry.createdAt || entry.date).toISOString().split('T')[0];
        newMarkedDates[dateString] = {
          marked: true,
          dotColor: theme.primary,
        };
      });

      if (selectedDate) {
        newMarkedDates[selectedDate] = {
          ...newMarkedDates[selectedDate],
          selected: true,
          selectedColor: theme.primary,
        };
      }
      
      setMarkedDates(newMarkedDates);
    } catch (error) {
      console.error('Failed to fetch entries for calendar', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllEntries();
    }, [selectedDate, theme])
  );

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const selectedEntries = entries.filter(entry => {
    const entryDate = new Date(entry.createdAt || entry.date).toISOString().split('T')[0];
    return entryDate === selectedDate;
  });

  const renderTimelineItem = ({ item }: any) => {
    const excerpt = item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content;
    const time = new Date(item.createdAt || item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <View style={styles.timelineItemContainer}>
        <View style={styles.timelineLeft}>
          <Text style={[styles.timelineTime, { color: theme.textMuted }]}>{time}</Text>
          <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
          <View style={[styles.timelineDot, { backgroundColor: theme.primary, borderColor: theme.card }]} />
        </View>
        
        <AnimatedTouchable 
          style={[styles.timelineCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('EntryDetails', { entry: item })}
        >
          <View style={styles.cardContentContainer}>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
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
      </View>
    );
  };

  const renderTimeline = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.timelineHeader}>
        <Text style={[styles.timelineTitle, { color: theme.text }]}>
          {selectedDate ? `Entries for ${new Date(selectedDate).toLocaleDateString()}` : 'Select a date'}
        </Text>
      </View>

      {loading ? (
        <View style={[styles.centerContainer]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : selectedDate && selectedEntries.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No entries on this date.</Text>
        </View>
      ) : (
        <FlatList
          data={selectedEntries}
          renderItem={renderTimelineItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isDesktop && (
        <DesktopHeader
          activeTab="Calendar"
          onSelectTab={(tab) => navigation.navigate(tab)}
          onNewEntry={() => navigation.navigate('AddEntry')}
        />
      )}

      <View style={[styles.webContainer, isDesktop && styles.desktopLayout]}>
        <View style={[isDesktop && styles.desktopCalendarSide, { backgroundColor: theme.card }]}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: theme.background,
              calendarBackground: theme.card,
              textSectionTitleColor: theme.textMuted,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: theme.primary,
              dayTextColor: theme.text,
              textDisabledColor: theme.textLight,
              dotColor: theme.primary,
              selectedDotColor: '#ffffff',
              arrowColor: theme.primary,
              monthTextColor: theme.text,
              indicatorColor: theme.primary,
            }}
            style={{
              borderBottomWidth: isDesktop ? 0 : 1,
              borderBottomColor: theme.border,
            }}
          />
        </View>

        {renderTimeline()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  desktopLayout: {
    flexDirection: 'row',
    padding: 24,
    gap: 24,
  },
  desktopCalendarSide: {
    width: 380,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timelineHeader: {
    padding: 15,
    paddingBottom: 10,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  timelineItemContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'center',
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 20,
    bottom: -30,
    left: 29,
    zIndex: -1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    borderWidth: 2,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardExcerpt: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
  },
});
