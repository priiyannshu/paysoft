import type { Notifier, NotifyEvent, DeliveryConfirmation } from './types';

export class LogNotifier implements Notifier {
  constructor(private db: D1Database) {}

  async send(event: NotifyEvent): Promise<DeliveryConfirmation> {
    try {
      // Ensure table exists for swappability/testing without migrations
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          recipient TEXT,
          created_at TEXT NOT NULL
        )
      `).run();

      await this.db.prepare(`
        INSERT INTO audit_logs (event_type, payload, recipient, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(
        event.type,
        JSON.stringify(event.payload),
        event.recipientEmail || event.recipientPhone || 'unknown',
        new Date().toISOString()
      ).run();

      return { success: true, messageId: `log-${Date.now()}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
