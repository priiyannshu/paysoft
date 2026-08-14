import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  orgCode: z.string().min(1),
  turnstileToken: z.string().optional(),
});

export const RunPayrollSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2035),
  orgId: z.string(),
  departmentId: z.string().optional(),
  employees: z.array(z.any()).optional().default([]),
});

export const DeclarationSchema = z.object({
  sec80C: z.number().min(0).max(150000).optional().default(0),
  sec80D: z.number().min(0).max(100000).optional().default(0),
  hraRent: z.number().min(0).optional().default(0),
  sec24b: z.number().min(0).max(200000).optional().default(0),
});

export const ESSDeclarationSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  financialYear: z.string(),
  declarations: DeclarationSchema,
});

export const LeaveApplicationSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  leaveType: z.enum(['sick', 'casual', 'earned']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().positive(),
});

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/).optional(),
  pfUan: z.string().regex(/^\d{12}$/).optional(),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  bankAccount: z.string().min(5).optional(),
  departmentId: z.string().optional(),
  basicPay: z.union([z.number(), z.string()]).optional(),
  daPercent: z.union([z.number(), z.string()]).optional(),
  hraPercent: z.union([z.number(), z.string()]).optional(),
  esiNumber: z.string().optional(),
  bankName: z.string().optional(),
  taxRegime: z.string().optional(),
  status: z.string().optional(),
});
