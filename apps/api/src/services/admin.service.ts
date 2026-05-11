export class AdminService {
  async summary() {
    return {
      openRiskReviews: 0,
      redemptionsPending: 0,
      suspiciousAccounts: 0,
      generatedAt: new Date().toISOString(),
    };
  }
}
