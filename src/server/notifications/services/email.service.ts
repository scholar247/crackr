import type { EmailPayload, INotificationService, NotificationResult } from '../types';

// TODO: install nodemailer (or @sendgrid/mail / resend) and configure here.
// Example with nodemailer:
//   import nodemailer from 'nodemailer';
//   const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, ... });

class EmailNotificationService implements INotificationService<EmailPayload> {
  async execute(payload: EmailPayload): Promise<NotificationResult> {
    const { to, subject, html, text, replyTo } = payload;

    // TODO: replace stub with real transport call, e.g.:
    //   const info = await transport.sendMail({
    //     from: process.env.EMAIL_FROM,
    //     to: Array.isArray(to) ? to.join(', ') : to,
    //     subject,
    //     html,
    //     text,
    //     replyTo,
    //   });
    //   return { success: true, messageId: info.messageId };

    if (!process.env.SMTP_HOST) {
      throw new Error('Email transport not configured (SMTP_HOST missing)');
    }

    throw new Error('Email transport not implemented — plug in nodemailer / Resend / SendGrid');
  }
}

export const emailNotificationService = new EmailNotificationService();
