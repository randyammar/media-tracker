import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-4">
        <AuthForm mode="sign-up" />
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/auth/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

