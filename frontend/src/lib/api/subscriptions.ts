import { apiClient } from "./client";

export type SubscriptionPlan = "student_pro" | "landlord_pro" | "university_pro";
export type SubscriptionPeriod = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type PaymentGateway = "click" | "payme" | "uzum" | "paynet";

export interface SubscriptionPurchaseInput {
  plan: SubscriptionPlan;
  period: SubscriptionPeriod;
  gateway?: PaymentGateway;
  auto_renew?: boolean;
}

export interface SubscriptionRead {
  id: number;
  plan: SubscriptionPlan;
  period: SubscriptionPeriod;
  status: SubscriptionStatus;
  amount: string;
  currency: "UZS" | "USD";
  starts_at: string;
  ends_at: string;
  cancelled_at?: string | null;
  auto_renew: boolean;
  created_at: string;
}

export interface SubscriptionStatusResponse {
  is_pro: boolean;
  plan?: SubscriptionPlan | null;
  ends_at?: string | null;
  days_remaining?: number | null;
}

export const subscriptionsApi = {
  status: async () => {
    const res = await apiClient.get<SubscriptionStatusResponse>("/subscriptions/status");
    return res.data;
  },

  listMine: async () => {
    const res = await apiClient.get<SubscriptionRead[]>("/subscriptions/me");
    return res.data;
  },

  purchase: async (payload: SubscriptionPurchaseInput) => {
    const res = await apiClient.post<SubscriptionRead>("/subscriptions/purchase", payload);
    return res.data;
  },

  cancel: async (id: number) => {
    const res = await apiClient.post<SubscriptionRead>(`/subscriptions/${id}/cancel`);
    return res.data;
  },
};
