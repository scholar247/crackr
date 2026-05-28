import type { AppNotifPayload, INotificationService, NotificationResult } from '../types';

// TODO: install firebase-admin and configure FCM here.
// Example:
//   import { getMessaging } from 'firebase-admin/messaging';
//   import { getAdminApp } from '@/lib/firebase-admin'; // re-enable when FCM is wired up
//
// The service needs a way to resolve userId → FCM device token(s).
// Add a device_tokens collection / field on the user document and query it here.

class AppNotificationService implements INotificationService<AppNotifPayload> {
  async execute(payload: AppNotifPayload): Promise<NotificationResult> {
    const { userId, title, body, imageUrl, data, badge } = payload;

    // TODO: resolve FCM token for userId, e.g.:
    //   const token = await userRepository.getFcmToken(userId);
    //   if (!token) return { success: false, error: 'No FCM token for user' };
    //
    //   const response = await getMessaging().send({
    //     token,
    //     notification: { title, body, imageUrl },
    //     data,
    //     apns: badge !== undefined ? { payload: { aps: { badge } } } : undefined,
    //   });
    //   return { success: true, messageId: response };

    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('App notification transport not configured (FIREBASE_PROJECT_ID missing)');
    }

    throw new Error('App notification transport not implemented — plug in Firebase Admin FCM');
  }
}

export const appNotificationService = new AppNotificationService();
