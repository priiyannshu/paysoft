import type { Notifier, NotifyEvent, DeliveryConfirmation } from './types';
import { EmailMessage } from 'cloudflare:email';

export class CloudflareEmailNotifier implements Notifier {
  constructor(private sendEmailBinding: any, private senderAddress: string) {}

  async send(event: NotifyEvent): Promise<DeliveryConfirmation> {
    if (!event.recipientEmail) {
      return { success: false, error: 'No recipientEmail provided' };
    }

    try {
      const subject = this.getSubject(event);
      const body = this.getBody(event);

      // Construct raw RFC 822 email
      const rawEmail = `From: ${this.senderAddress}\r\nTo: ${event.recipientEmail}\r\nSubject: ${subject}\r\n\r\n${body}`;

      const msg = new EmailMessage(
        this.senderAddress,
        event.recipientEmail,
        rawEmail
      );
      
      await this.sendEmailBinding.send(msg);
      return { success: true, messageId: `email-${Date.now()}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private getSubject(event: NotifyEvent): string {
    switch (event.type) {
      case 'PAYROLL_FINALIZED': return 'Payroll Finalized';
      case 'PAYSLIP_GENERATED': return 'Your Payslip is Ready';
      case 'COMPLIANCE_DEADLINE': return 'Compliance Deadline Approaching';
      default: return 'Notification from PaySoft';
    }
  }

  private getBody(event: NotifyEvent): string {
    return `Event: ${event.type}\n\nPayload: ${JSON.stringify(event.payload, null, 2)}`;
  }
}
