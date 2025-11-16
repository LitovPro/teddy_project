import { z } from 'zod';

// Languages
export type Language = 'EN' | 'PT';

// Visit Sources
export type VisitSource = 'CODE' | 'QR' | 'DESK';

// Voucher Status
export type VoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED';

// Menu Categories
export type MenuCategory = 'FOOD' | 'DRINKS';

// Subscription Topics
export type SubscriptionTopic = 'EVENTS' | 'PROMOS';

// Staff Roles
export type StaffRole = 'ADMIN' | 'CASHIER';

// WhatsApp Message Types
export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
    };
  };
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: WhatsAppMessage[];
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

export interface WhatsAppWebhook {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

// DTOs
export const CreateFamilyDto = z.object({
  phone: z.string().optional(),
  waId: z.string().optional(),
  lang: z.enum(['EN', 'PT']).default('EN'),
  kidsCount: z.number().optional(),
  consentMarketing: z.boolean().default(false),
});

export const ConfirmVisitDto = z.object({
  code: z.string(),
  staffId: z.string().optional(),
  source: z.enum(['CODE', 'QR', 'DESK']).default('CODE'),
  note: z.string().optional(),
});

export const IssueCodeDto = z.object({
  familyId: z.string(),
  ttlMinutes: z.number().default(10),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RedeemVoucherDto = z.object({
  code: z.string(),
  staffId: z.string(),
});

export const BroadcastDto = z.object({
  templateName: z.string(),
  language: z.enum(['EN', 'PT']),
  audience: z.enum(['ALL', 'SUBSCRIBERS_EVENTS', 'SUBSCRIBERS_PROMOS']),
  variables: z.record(z.string()).optional(),
});

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoyaltyProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface VisitConfirmation {
  visitId: string;
  loyaltyProgress: LoyaltyProgress;
  cardImageUrl?: string;
  voucherIssued?: {
    voucherId: string;
    code: string;
    imageUrl: string;
  };
}

// Payments
export interface PaymentLink {
  url: string;
  id: string;
}

export interface CreatePaymentRequest {
  amountCents: number;
  currency: string;
  description: string;
  familyId: string;
}

export type CreateFamilyDtoType = z.infer<typeof CreateFamilyDto>;
export type ConfirmVisitDtoType = z.infer<typeof ConfirmVisitDto>;
export type IssueCodeDtoType = z.infer<typeof IssueCodeDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type RedeemVoucherDtoType = z.infer<typeof RedeemVoucherDto>;
export type BroadcastDtoType = z.infer<typeof BroadcastDto>;
