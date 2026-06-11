import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissionsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleDailyReminder(id: string, title: string, body: string, hour: number, minute: number) {
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelReminder(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function scheduleBirthdayReminder(id: string, name: string, month: number, day: number) {
  await Notifications.cancelScheduledNotificationAsync(id);
  
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: '🎂 Birthday Reminder!',
      body: `It's ${name}'s birthday today! Don't forget to wish them!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.YEARLY,
      month,
      day,
      hour: 9,
      minute: 0,
    },
  });
}
