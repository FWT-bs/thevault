export type PaymentMethod = {
  id: string;
  methodType: string;
  destinationMasked: string;
  isDefault: boolean;
};

const methods = new Map<string, PaymentMethod[]>();

export class PaymentMethodsService {
  async list(userId: string): Promise<PaymentMethod[]> {
    return methods.get(userId) ?? [];
  }

  async add(userId: string, methodType: string, destinationMasked: string): Promise<PaymentMethod> {
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
