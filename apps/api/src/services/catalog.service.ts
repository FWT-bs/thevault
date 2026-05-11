import { catalogRepository } from "../repositories";

export class CatalogService {
  async listCatalog() {
    return catalogRepository.listCatalog();
  }
}
