type AuditLog = {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

const logs: AuditLog[] = [];

export class AuditService {
  async append(input: Omit<AuditLog, "id" | "createdAt">) {
    const item: AuditLog = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    logs.unshift(item);
    return item;
  }

  async list(actorUserId: string) {
    return logs.filter((log) => log.actorUserId === actorUserId);
  }
}
