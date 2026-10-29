import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { submitFeedback } from "@/app/actions";
import { IArrowLeft } from "@/components/icons";
import { btn, Card, Chips, Field, FieldGroup, Notice, PageHeader } from "@/components/ui";
import { getI18n } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Share feedback", robots: { index: false } };

export default async function FeedbackPage({ params, searchParams }: { params: Promise<{ applicationId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const id = Number((await params).applicationId);
  const sp = await searchParams;
  const row = getDb().prepare(`
    SELECT a.id, a.candidate_id, a.status, j.title, e.business_name, e.user_id AS employer_user, u.name AS candidate_name
    FROM applications a JOIN jobs j ON j.id=a.job_id JOIN employers e ON e.id=j.employer_id JOIN users u ON u.id=a.candidate_id WHERE a.id=?`).get(id) as
    | { id: number; candidate_id: number; status: string; title: string; business_name: string; employer_user: number; candidate_name: string } | undefined;
  if (!row) notFound();
  const role = row.candidate_id === user.id ? "candidate" : row.employer_user === user.id ? "employer" : null;
  if (!role) redirect("/");
  const back = role === "candidate" ? "/candidate" : "/employer";
  const existing = getDb().prepare("SELECT * FROM feedback WHERE application_id=? AND from_role=?").get(id, role) as { rating: number; comment: string } | undefined;
  const subject = role === "candidate" ? row.business_name : row.candidate_name;

  const { t } = await getI18n();
  const cp = ["30d", "90d"].includes(sp.checkpoint ?? "") ? sp.checkpoint! : "joined";
  const yesNo = [{ value: "yes", label: t("sp_yes") }, { value: "no", label: t("sp_no") }];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href={back} className="mb-6 inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink-soft hover:text-sindoor-700"><IArrowLeft size={16} />{t("sp_back")}</Link>
      <PageHeader deva="अनुभव बताइए" title={t("fb_title")} sub={`${row.title} · ${subject}`} />
      {sp.thanks && <div className="mb-6"><Notice tone="ok">{t("fb_thanks")}</Notice></div>}
      {sp.error && <div className="mb-6"><Notice tone="bad">{sp.error}</Notice></div>}
      <Card className="p-6">
        <form action={submitFeedback} className="space-y-6">
          <input type="hidden" name="application_id" value={id} />
          <FieldGroup label={`${t("fb_rating")} ${subject}`}>
            <Chips type="radio" name="rating" selected={existing ? [String(existing.rating)] : []} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${"★".repeat(n)} ${n}` }))} />
          </FieldGroup>
          <FieldGroup label={role === "candidate" ? t("fb_terms_candidate") : t("fb_terms_employer")}>
            <Chips type="radio" name="terms_matched" options={yesNo} />
          </FieldGroup>
          <FieldGroup label={role === "candidate" ? t("fb_still_candidate") : t("fb_still_employer")}>
            <Chips type="radio" name="still_working" options={yesNo} />
          </FieldGroup>
          <FieldGroup label={t("fb_checkpoint")}>
            <Chips type="radio" name="checkpoint" selected={[cp]} options={[{ value: "joined", label: t("fb_cp_joined") }, { value: "30d", label: t("fb_cp_30") }, { value: "90d", label: t("fb_cp_90") }]} />
          </FieldGroup>
          <Field label={t("fb_comment")} hint={t("fb_comment_hint")}>
            <textarea name="comment" maxLength={2000} className="field" defaultValue={existing?.comment} />
          </Field>
          {role === "candidate" && <p className="text-[0.88rem] text-ink-soft">{t("fb_serious")}</p>}
          <button className={btn("primary", "lg")}>{t("fb_submit")}</button>
        </form>
      </Card>
    </div>
  );
}
