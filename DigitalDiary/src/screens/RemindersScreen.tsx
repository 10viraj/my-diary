import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TextInput, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../theme/ThemeContext';
import { requestPermissionsAsync, scheduleDailyReminder, cancelReminder, scheduleBirthdayReminder } from '../services/NotificationService';
import { Ionicons } from '@expo/vector-icons';
import AnimatedTouchable from '../components/AnimatedTouchable';

interface Birthday {
  id: string;
  name: string;
  month: number;
  day: number;
}

export default function RemindersScreen({ navigation }: any) {
  const { theme } = useContext(ThemeContext);
  
  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [morningEnabled, setMorningEnabled] = useState(false);
  const [eveningEnabled, setEveningEnabled] = useState(false);
  
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newBdayName, setNewBdayName] = useState('');
  const [newBdayDate, setNewBdayDate] = useState(''); // MM-DD
  
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const daily = await AsyncStorage.getItem('@reminders_daily');
      const morning = await AsyncStorage.getItem('@reminders_morning');
      const evening = await AsyncStorage.getItem('@reminders_evening');
      const bdays = await AsyncStorage.getItem('@reminders_birthdays');
      
      if (daily === 'true') setDailyEnabled(true);
      if (morning === 'true') setMorningEnabled(true);
      if (evening === 'true') setEveningEnabled(true);
      if (bdays) setBirthdays(JSON.parse(bdays));
    } catch (error) {
      console.error('Failed to load reminder settings', error);
    }
  };

  const handleToggle = async (
    type: 'daily' | 'morning' | 'evening', 
    value: boolean, 
    id: string, 
    title: string, 
    body: string, 
    hour: number, 
    minute: number
  ) => {
    try {
      if (value) {
        const granted = await requestPermissionsAsync();
        if (!granted) {
          Alert.alert('Permission Denied', 'Please enable notifications in your system settings to use reminders.');
          return;
        }
        await scheduleDailyReminder(id, title, body, hour, minute);
      } else {
        await cancelReminder(id);
      }
      
      if (type === 'daily') {
        setDailyEnabled(value);
        await AsyncStorage.setItem('@reminders_daily', String(value));
      } else if (type === 'morning') {
        setMorningEnabled(value);
        await AsyncStorage.setItem('@reminders_morning', String(value));
      } else if (type === 'evening') {
        setEveningEnabled(value);
        await AsyncStorage.setItem('@reminders_evening', String(value));
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update reminder.');
    }
  };

  const addBirthday = async () => {
    if (!newBdayName || !newBdayDate) {
      Alert.alert('Error', 'Please provide a name and date.');
      return;
    }
    const parts = newBdayDate.split('-');
    if (parts.length !== 2) {
      Alert.alert('Error', 'Date must be in MM-DD format.');
      return;
    }
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    
    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      Alert.alert('Error', 'Invalid date.');
      return;
    }

    const granted = await requestPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', 'Please enable notifications in your system settings.');
      return;
    }

    const id = `bday_${Date.now()}`;
    const newBday: Birthday = { id, name: newBdayName, month, day };
    
    try {
      await scheduleBirthdayReminder(id, newBdayName, month, day);
      const updatedBirthdays = [...birthdays, newBday];
      setBirthdays(updatedBirthdays);
      await AsyncStorage.setItem('@reminders_birthdays', JSON.stringify(updatedBirthdays));
      
      setNewBdayName('');
      setNewBdayDate('');
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to schedule birthday reminder.');
    }
  };

  const removeBirthday = async (id: string) => {
    try {
      await cancelReminder(id);
      const updated = birthdays.filter(b => b.id !== id);
      setBirthdays(updated);
      await AsyncStorage.setItem('@reminders_birthdays', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to remove birthday reminder.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Daily Reminder</Text>
            <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>Reminds you at 8:00 PM to write your diary today.</Text>
          </View>
          <Switch
            value={dailyEnabled}
            onValueChange={(val) => handleToggle('daily', val, 'daily_reminder', 'Daily Diary', 'Write your diary today!', 20, 0)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={dailyEnabled ? theme.background : "#f4f3f4"}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Morning Reminder</Text>
            <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>Reminds you at 8:00 AM to start your day with a thought.</Text>
          </View>
          <Switch
            value={morningEnabled}
            onValueChange={(val) => handleToggle('morning', val, 'morning_reminder', 'Good Morning!', 'Start your day with a thought!', 8, 0)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={morningEnabled ? theme.background : "#f4f3f4"}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Evening Reminder</Text>
            <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>Reminds you at 9:00 PM to reflect on your day.</Text>
          </View>
          <Switch
            value={eveningEnabled}
            onValueChange={(val) => handleToggle('evening', val, 'evening_reminder', 'Good Evening!', 'Take a moment to reflect on your day.', 21, 0)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={eveningEnabled ? theme.background : "#f4f3f4"}
          />
        </View>
      </View>

      <Text style={[styles.headerText, { color: theme.textLight }]}>BIRTHDAY REMINDERS</Text>
      
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {birthdays.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No birthday reminders set.</Text>
        ) : (
          birthdays.map((bday, index) => (
            <View key={bday.id} style={[styles.bdayRow, index === birthdays.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: theme.border }]}>
              <View style={styles.bdayTextContainer}>
                <Text style={[styles.bdayName, { color: theme.text }]}>{bday.name}</Text>
                <Text style={[styles.bdayDate, { color: theme.textMuted }]}>{bday.month}/{bday.day}</Text>
              </View>
              <TouchableOpacity onPress={() => removeBirthday(bday.id)}>
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
        
        <TouchableOpacity style={[styles.addBdayBtn, { backgroundColor: theme.primaryLight }]} onPress={() => setModalVisible(true)}>
          <Text style={[styles.addBdayText, { color: theme.primary }]}>+ Add Birthday</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Birthday Reminder</Text>
            
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Name (e.g. John)"
              placeholderTextColor={theme.textLight}
              value={newBdayName}
              onChangeText={setNewBdayName}
            />
            
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Date (MM-DD)"
              placeholderTextColor={theme.textLight}
              value={newBdayDate}
              onChangeText={setNewBdayDate}
              keyboardType="numbers-and-punctuation"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtn}>
                <Text style={{ color: theme.textMuted, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <AnimatedTouchable onPress={addBirthday} style={[styles.modalBtn, { backgroundColor: theme.primary, borderRadius: 8 }]}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Save</Text>
              </AnimatedTouchable>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerText: {
    marginTop: 30,
    marginLeft: 15,
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
  },
  bdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  bdayTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bdayName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  bdayDate: {
    fontSize: 14,
  },
  addBdayBtn: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBdayText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 10,
  },
});
