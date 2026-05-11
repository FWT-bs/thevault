import { vaultLevelRepository } from "../repositories";

export class VaultLevelService {
  async getStatus(userId: string) {
    return vaultLevelRepository.getStatus(userId);
  }
}
