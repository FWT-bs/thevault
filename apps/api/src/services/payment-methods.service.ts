import { getSupabaseAdmin, isMockUserId, isSupabaseConfigured } from "../lib/supabase";

export type PaymentMethod = {
  id: string;
  methodType: string;
  destinationMasked: string;
  isDefault: boolean;
};

const methods = new Map<string, PaymentMethod[]>();

export class PaymentMethodsService {
  async list(userId: string): Promise<PaymentMethod[]> {
    if (isSupabaseConfigured() && !isMockUserId(userId)) {
      const result = await getSupabaseAdmin()
        .from("payment_methods")
        .select("id, method_type, destination_masked, is_default")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (result.error) throw new Error(result.error.message);
      return (result.data ?? []).map((item) => ({
        id: item.id,
        methodType: item.method_type,
        destinationMasked: item.destination_masked,
        isDefault: item.is_default,
      }));
    }

    return methods.get(userId) ?? [];
  }

  async add(userId: string, methodType: string, destinationMasked: string): Promise<PaymentMethod> {
    if (isSupabaseConfigured() && !isMockUserId(userId)) {
      const existing = await this.list(userId);
      const result = await getSupabaseAdmin()
        .from("payment_methods")
        .insert({
          user_id: userId,
          method_type: methodType,
          destination_masked: destinationMasked,
          is_default: existing.length === 0,
        })
        .select("id, method_type, destination_masked, is_default")
        .single();
      if (result.error) throw new Error(result.error.message);
      return {
        id: result.data.id,
        methodType: result.data.method_type,
        destinationMasked: result.data.destination_masked,
        isDefault: result.data.is_default,
      };
    }

    const item: PaymentMethod = {
      id: crypto.randomUUID(),
      methodType,
      destinationMasked,
      isDefault: (methods.get(userId) ?? []).length === 0,
    };
    const next = [item, ...(methods.get(userId) ?? [])];
    methods.set(userId, next);
    return item;
  }
}
