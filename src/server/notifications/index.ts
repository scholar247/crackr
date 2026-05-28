import { emailNotificationService } from './services/email.service';
import { smsNotificationService } from './services/sms.service';
import { appNotificationService } from './services/app.service';
import { logAttempt, logSuccess, logFailure } from './logger';
import type { NotificationRequest, NotificationResult } from './types';

/**
 * Send a notification.
 *
 * Usage:
 *   await send({ notif_type: 'email',     payload: { to, subject, html } });
 *   await send({ notif_type: 'sms',       payload: { to, body } });
 *   await send({ notif_type: 'app_notif', payload: { userId, title, body } });
 */
export async function send(request: NotificationRequest): Promise<NotificationResult> {
  const { notif_type } = request;
  const start = Date.now();

  // Derive a loggable recipient without branching on type twice
  const recipient = (() => {
    switch (notif_type) {
      case 'email':     return request.payload.to;
      case 'sms':       return request.payload.to;
      case 'app_notif': return request.payload.userId;
    }
  })();

  logAttempt(notif_type, recipient);

  try {
    let result: NotificationResult;

    switch (notif_type) {
      case 'email':
        result = await emailNotificationService.execute(request.payload);
        break;
      case 'sms':
        result = await smsNotificationService.execute(request.payload);
        break;
      case 'app_notif':
        result = await appNotificationService.execute(request.payload);
        break;
    }

    logSuccess(notif_type, recipient, result, Date.now() - start);
    return result;
  } catch (err) {
    logFailure(notif_type, recipient, err, Date.now() - start);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
