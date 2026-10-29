import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { chooseRole } from "@/app/actions";
import { btn, Card, Field, Tiles } from "@/components/ui";

export const metadata = { title: "Welcome" };

export default async function Onboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role) redirect("/");
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-indigo-900">Welcome! Who are you?</h1>
      <p className="mt-2 text-ink-soft">Choose how you’ll use the platform. You can’t change this later, so pick carefully.</p>
      <Card className="mt-8 p-6">
        <form action={chooseRole} className="space-y-6">
          <Tiles type="radio" name="role" selected={["candidate"]} options={[
            { value: "candidate", icon: "🧑‍🎓", title: "I’m looking for work", sub: "From Rajasthan — want to earn and learn a business." },
            { value: "employer", icon: "🏪", title: "I’m hiring", sub: "Shop, showroom, workshop or wholesale owner." },
          ]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" required><input name="name" className="field" required defaultValue={user.name} /></Field>
            <Field label="Mobile number"><input name="phone" className="field" inputMode="tel" defaultValue={user.phone ?? ""} /></Field>
          </div>
          <button className={btn("gold", "lg", "w-full")}>Continue →</button>
        </form>
      </Card>
    </div>
  );
}
