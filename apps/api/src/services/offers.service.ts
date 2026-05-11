export class OffersService {
  async ingestCompletion(userId: string, offerId: string, providerRef: string) {
    return {
      id: crypto.randomUUID(),
      userId,
      offerId,
      providerRef,
      status: "pending_review",
      createdAt: new Date().toISOString(),
    };
  }
}
