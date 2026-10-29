"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getEmployerByUser } from "@/lib/queries";
import { int, s, safeNext } from "@/lib/form";
import { audit } from "@/lib/audit";

export async function renewJob(fd: FormData) {
  const user = await requireUser("employer");
  const emp = getEmployerByUser(user.id);
  const id = int(fd, "job_id");
  const res = getDb()
    .prepare(`UPDATE jobs SET expires_at = datetime('now','+30 days'), expiry_reminded = 0, status = CASE WHEN status IN ('closed','filled') THEN 'open' ELSE status END,
      updated_at = datetime('now') WHERE id = ? AND employer_id = ? AND status != 'removed'`)
    .run(id, emp?.id ?? 0);
  if (res.changes) audit({ id: user.id, name: user.name }, "job.renew", "job", id);
  revalidatePath("/jobs");
  redirect(safeNext(s(fd, "next"), `/employer/jobs/${id}`) + "?renewed=1");
}
