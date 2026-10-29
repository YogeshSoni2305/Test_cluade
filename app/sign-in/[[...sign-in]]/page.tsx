import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { BYPASS } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  if (BYPASS) redirect("/dev-login");
  return (
    <AuthShell title="Welcome back" sub="Sign in with your phone number to continue your search.">
      <SignIn />
    </AuthShell>
  );
}
