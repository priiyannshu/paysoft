import type { NotifyEvent } from './types';
import { CloudflareEmailNotifier } from './email';
import { LogNotifier } from './log';

export async function handleQueueMessage(batch: MessageBatch<NotifyEvent>, env: any) {
  // Decide which notifier to use. 
  // We use CloudflareEmailNotifier if SEND_EMAIL is available, else LogNotifier.
  const useEmail = !!env.SEND_EMAIL && !!env.SENDER_EMAIL_ADDRESS;
  
  const notifier = useEmail 
    ? new CloudflareEmailNotifier(env.SEND_EMAIL, env.SENDER_EMAIL_ADDRESS)
    : new LogNotifier(env.DB);

  for (const message of batch.messages) {
    try {
      const event = message.body;
      const result = await notifier.send(event);
      
      if (result.success) {
        message.ack();
      } else {
        console.error('Failed to send notification:', result.error);
        message.retry();
      }
    } catch (err) {
      console.error('Error processing queue message:', err);
      message.retry();
    }
  }
}
