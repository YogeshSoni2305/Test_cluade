import { getDb } from "./db";

type Actor = { id: number; name: string } | null;

/** Append-only record of who changed what. */
export function audit(actor: Actor, action: string, entity: string, entityId: number | null, details: Record<string, unknown> = {}) {
  getDb()
    .prepare("INSERT INTO audit_log (actor_id, actor_name, action, entity, entity_id, details) VALUES (?,?,?,?,?,?)")
    .run(actor?.id ?? null, actor?.name ?? "system", action, entity, entityId, JSON.stringify(details));
}
