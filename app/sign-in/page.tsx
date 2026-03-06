import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-4">
        <AuthForm mode="sign-in" />
        <p className="text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/sign-up">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
