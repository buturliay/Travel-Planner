import { signOut } from "@/app/actions";
import { Brand } from "@/components/brand";
import { SubmitButton } from "@/components/submit-button";

export function AccountHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Brand href="/trips" />
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted sm:block">{email}</p>
          <form action={signOut}>
            <SubmitButton className="btn-ghost" pendingLabel="Signing out…">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
