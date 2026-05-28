import type { NotificationRequest, NotificationResult } from './types';

type LogLevel = 'info' | 'warn' | 'error';

type LogEntry = {
  ts: string;
  level: LogLevel;
  module: 'notification';
  event: string;
  notif_type?: NotificationRequest['notif_type'];
  recipient?: string;
  messageId?: string;
  error?: string;
  durationMs?: number;
};

function emit(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function redactRecipient(notif_type: NotificationRequest['notif_type'], raw: string | string[]): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (notif_type === 'sms') {
    // keep country code + last 2 digits: +91*****43
    return first.replace(/(\+\d{2})\d+(\d{2})$/, '$1*****$2');
  }
  if (notif_type === 'email') {
    const [local, domain] = first.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
  // app_notif — userId is not PII but keep consistent
  return first;
}

export function logAttempt(
  notif_type: NotificationRequest['notif_type'],
  recipient: string | string[],
): void {
  emit({
    ts: new Date().toISOString(),
    level: 'info',
    module: 'notification',
    event: 'send_attempt',
    notif_type,
    recipient: redactRecipient(notif_type, recipient),
  });
}

export function logSuccess(
  notif_type: NotificationRequest['notif_type'],
  recipient: string | string[],
  result: NotificationResult,
  durationMs: number,
): void {
  emit({
    ts: new Date().toISOString(),
    level: 'info',
    module: 'notification',
    event: 'send_success',
    notif_type,
    recipient: redactRecipient(notif_type, recipient),
    messageId: result.messageId,
    durationMs,
  });
}

export function logFailure(
  notif_type: NotificationRequest['notif_type'],
  recipient: string | string[],
  error: unknown,
  durationMs: number,
): void {
  emit({
    ts: new Date().toISOString(),
    level: 'error',
    module: 'notification',
    event: 'send_failure',
    notif_type,
    recipient: redactRecipient(notif_type, recipient),
    error: error instanceof Error ? error.message : String(error),
    durationMs,
  });
}
