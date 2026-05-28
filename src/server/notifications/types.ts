// ─── Result ───────────────────────────────────────────────────────────────────

export type NotificationResult = {
  success: boolean;
  /** Provider-assigned message / delivery ID */
  messageId?: string;
  error?: string;
};

// ─── Payloads ─────────────────────────────────────────────────────────────────

export type EmailPayload = {
  /** Single address or list of recipients */
  to: string | string[];
  subject: string;
  /** Full HTML body */
  html: string;
  /** Plain-text fallback (auto-stripped from html if omitted) */
  text?: string;
  replyTo?: string;
};

export type SmsPayload = {
  /** E.164 format, e.g. +919876543210 */
  to: string;
  /** Plain text only — keep under 160 chars for a single segment */
  body: string;
};

export type AppNotifPayload = {
  /** Recipient user ID (resolved to FCM token by the service) */
  userId: string;
  title: string;
  body: string;
  /** Optional image shown in the notification */
  imageUrl?: string;
  /** Arbitrary key-value pairs for deep-link / action routing */
  data?: Record<string, string>;
  /** iOS badge count */
  badge?: number;
};

// ─── Discriminated union ─────────────────────────────────────────────────────

export type NotificationRequest =
  | { notif_type: 'email';     payload: EmailPayload }
  | { notif_type: 'sms';       payload: SmsPayload }
  | { notif_type: 'app_notif'; payload: AppNotifPayload };

// ─── Service contract ─────────────────────────────────────────────────────────

export interface INotificationService<TPayload> {
  execute(payload: TPayload): Promise<NotificationResult>;
}
