import { walletRepository } from "../repositories";

export class WalletService {
  async getBalance(userId: string) {
    return walletRepository.getBalance(userId);
  }

  async listTransactions(userId: string) {
    return walletRepository.listTransactions(userId);
  }
}
