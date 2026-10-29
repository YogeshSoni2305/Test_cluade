import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { chooseRole } from "@/app/actions";
import { btn, Field, PageHeader, Tiles } from "@/components/ui";
import { IBriefcase, IHaveli } from "@/components/icons";

export const metadata = { title: "Welcome" };

export default async function Onboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role) redirect("/");
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <PageHeader deva="स्वागत है" title="Who are you?" sub="Choose how you’ll use the platform. This can’t be changed later." />
      <form action={chooseRole} className="space-y-6">
        <Tiles type="radio" name="role" selected={["candidate"]} options={[
          { value: "candidate", icon: <IBriefcase size={22} />, title: "I’m looking for work", sub: "From Rajasthan — want to earn and learn a business." },
          { value: "employer", icon: <IHaveli size={22} />, title: "I’m hiring", sub: "Shop, showroom, workshop or wholesale owner." },
        ]} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" required><input name="name" className="field" required defaultValue={user.name} /></Field>
          <Field label="Mobile number"><input name="phone" className="field" inputMode="tel" defaultValue={user.phone ?? ""} /></Field>
        </div>
        <button className={btn("primary", "lg", "w-full")}>Continue</button>
      </form>
    </div>
  );
}
