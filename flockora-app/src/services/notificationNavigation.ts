import * as Notifications from 'expo-notifications';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../navigation/navigationRef';
import { NOTIFICATION_CATEGORIES } from './notificationService';

/** Registers iOS notification categories once at app startup. No action buttons are defined —
 * the brief calls for "category" as classification metadata, not interactive actions. */
export async function registerNotificationCategories(): Promise<void> {
  await Promise.all(
    Object.values(NOTIFICATION_CATEGORIES).map((identifier) =>
      Notifications.setNotificationCategoryAsync(identifier, [])
    )
  );
}

function navigateToTabFromRoot(tabName: string, screenName: string, params: object = {}) {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Main',
      params: { screen: tabName, params: { screen: screenName, params } },
    })
  );
}

/** Routes a tapped notification to the right detail screen, keyed on the `type` discriminant
 * every notification's `data` payload carries (see notificationService.ts). */
export function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as Record<string, unknown>;

  switch (data.type) {
    case 'task':
      navigateToTabFromRoot('Today', 'TaskDetail', { taskId: data.taskId });
      break;
    case 'healthRecord':
      navigateToTabFromRoot('Flock', 'HealthRecordDetail', { recordId: data.recordId });
      break;
    case 'feedItem':
      navigateToTabFromRoot('Flock', 'FeedInventory');
      break;
    case 'clutch':
      navigateToTabFromRoot('Flock', 'ClutchDetail', { clutchId: data.clutchId });
      break;
    default:
      break;
  }
}
