import type { NotifyJobMessage } from './types'
import { CloudflareEmailNotifier } from '../engines/7-notify/email'
import { LogNotifier } from '../engines/7-notify/log'

export async function handleNotifyQueue(
  batch: MessageBatch<NotifyJobMessage>,
  env: any
): Promise<{ processed: number; failed: number }> {
  let processed = 0
  let failed = 0

  const useEmail = !!env.SEND_EMAIL && !!env.SENDER_EMAIL_ADDRESS
  const notifier = useEmail
    ? new CloudflareEmailNotifier(env.SEND_EMAIL, env.SENDER_EMAIL_ADDRESS)
    : new LogNotifier(env.DB)

  for (const message of batch.messages) {
    try {
      const job = message.body

      const result = await notifier.send({
        type: (job.type || 'audit') as any,
        recipientEmail: job.recipient?.includes('@') ? job.recipient : undefined,
        recipientPhone:
          job.recipient && !job.recipient.includes('@') && job.recipient !== 'SYSTEM'
            ? job.recipient
            : undefined,
        payload: {
          recipient: job.recipient,
          subject: job.subject,
          body: job.body,
          ...(job.metadata || {}),
        },
        timestamp: job.timestamp || new Date().toISOString(),
      })

      if (result.success) {
        message.ack()
        processed++
      } else {
        console.error('Notify consumer failed delivery:', result.error)
        failed++
        if (message.retry && typeof message.retry === 'function') {
          message.retry()
        }
      }
    } catch (err: any) {
      console.error('Notify queue worker error:', err)
      failed++
      if (message.retry && typeof message.retry === 'function') {
        message.retry()
      }
    }
  }

  return { processed, failed }
}
