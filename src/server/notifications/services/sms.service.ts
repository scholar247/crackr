import type { INotificationService, NotificationResult, SmsPayload } from '../types';

// TODO: install twilio (or aws-sdk for SNS) and configure here.
// Example with Twilio:
//   import twilio from 'twilio';
//   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class SmsNotificationService implements INotificationService<SmsPayload> {
  async execute(payload: SmsPayload): Promise<NotificationResult> {
    const { to, body } = payload;

    if (body.length > 160) {
      // Warn — multi-part SMS incurs extra cost; caller should keep OTPs short.
      console.warn(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: 'warn',
          module: 'notification',
          event: 'sms_body_exceeds_single_segment',
          length: body.length,
        })
      );
    }

    // TODO: replace stub with real transport call, e.g.:
    //   const msg = await client.messages.create({
    //     from: process.env.TWILIO_FROM_NUMBER,
    //     to,
    //     body,
    //   });
    //   return { success: true, messageId: msg.sid };

    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error('SMS transport not configured (TWILIO_ACCOUNT_SID missing)');
    }

    throw new Error('SMS transport not implemented — plug in Twilio / AWS SNS');
  }
}

export const smsNotificationService = new SmsNotificationService();
