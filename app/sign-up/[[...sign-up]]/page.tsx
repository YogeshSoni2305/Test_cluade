import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { BYPASS } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Get started" };

export default function SignUpPage() {
  if (BYPASS) redirect("/dev-login?signup=1");
  return (
    <AuthShell title="Start your journey" sub="Create a free account with your mobile number. No résumé needed.">
      <SignUp />
    </AuthShell>
  );
}
