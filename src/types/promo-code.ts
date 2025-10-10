export interface PromoCode {
  id: string;
  code: string;
  description: string;
  type: PromoCodeTypeEnum;
  discount: number; // Float value
  max_usage_times: number; // Integer
  max_usage_per_user: number; // Integer
  current_usage: number; // Current total usage count
  used_by: PromoCodeUsage[]; // Array of usage records
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  is_active: string; // '0' or '1'
}

// Enum for promo code types
export enum PromoCodeTypeEnum {
  INFLUENCER = 'INFLUENCER',
  EVENT = 'EVENT',
}

// Label helpers
export const PromoCodeTypeLabel: Record<PromoCodeTypeEnum, string> = {
  [PromoCodeTypeEnum.INFLUENCER]: 'Influencer',
  [PromoCodeTypeEnum.EVENT]: 'Event',
};

export interface CreatePromoCodeData {
  code: string;
  description: string;
  type: PromoCodeTypeEnum;
  discount: number;
  max_usage_times: number;
  max_usage_per_user: number;
}

export interface UpdatePromoCodeData {
  code?: string;
  description?: string;
  type?: PromoCodeTypeEnum;
  discount?: number;
  max_usage_times?: number;
  max_usage_per_user?: number;
  is_active?: string;
}

export interface PromoCodeFilters {
  search?: string;
  type?: PromoCodeTypeEnum;
  is_active?: boolean;
  min_discount?: number;
  max_discount?: number;
}

// Interface for promo code usage tracking (used_by array field)
export interface PromoCodeUsage {
  student_id: string; // Student ID
  email: string; // Student email
  number_of_usage: number; // Number of times this student used the promo code
}

// Interface for creating usage records
export interface CreatePromoCodeUsageData {
  student_id: string; // Student ID
  email: string; // Student email
  number_of_usage: number; // Number of times used
}

