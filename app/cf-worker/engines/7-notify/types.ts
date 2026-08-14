export interface NotifyEvent {
  type: 'PAYROLL_FINALIZED' | 'PAYSLIP_GENERATED' | 'COMPLIANCE_DEADLINE' | 'audit' | 'email' | string;
  payload: any;
  recipientEmail?: string;
  recipientPhone?: string;
  timestamp?: string;
}

export interface DeliveryConfirmation {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface Notifier {
  send(event: NotifyEvent): Promise<DeliveryConfirmation>;
}
