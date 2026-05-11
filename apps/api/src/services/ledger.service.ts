import { walletRepository } from "../repositories";

export class LedgerService {
  async timeline(userId: string) {
    return walletRepository.listTransactions(userId);
  }
}
