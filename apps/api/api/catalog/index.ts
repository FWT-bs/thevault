import { CatalogListResponseSchema } from "@thevault/contracts";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { fail, ok, withMethod } from "../../src/lib/http";
import { CatalogService } from "../../src/services/catalog.service";

const service = new CatalogService();

async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    ok(res, CatalogListResponseSchema.shape.data.parse({ items: await service.listCatalog() }));
  } catch (error) {
    fail(res, 500, { code: "catalog_list_failed", message: (error as Error).message });
  }
}

export default withMethod(["GET"], handler);
