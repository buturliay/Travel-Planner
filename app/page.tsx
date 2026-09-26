import { AuthForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const features = [
  {
    index: "01",
    title: "Trip creation",
    copy: "Name the trip, set the destination, and bound it with a start and end date.",
  },
  {
    index: "02",
    title: "Date-based itineraries",
    copy: "Each day in the range gets its own page in the notebook, with stops you can reorder.",
  },
  {
    index: "03",
    title: "Expense tracking",
    copy: "Log what you spend by category and watch a running total while you travel.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/trips");
  }

  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
      </header>
      <main className="mx-auto grid max-w-6xl items-start gap-12 px-6 pb-20 pt-4 lg:grid-cols-[1.15fr_0.85fr] lg:pt-10">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-clay">Travel planning</p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Keep every day of the trip in one place.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted">
            A private notebook for itineraries and spending. Create a trip, line up the days, and
            record what each one costs.
          </p>
          <ol className="mt-10 space-y-5">
            {features.map((feature) => (
              <li key={feature.index} className="grid grid-cols-[3rem_1fr] gap-3">
                <span className="font-serif text-xl text-clay">{feature.index}</span>
                <div>
                  <h2 className="font-serif text-2xl">{feature.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">{feature.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <div className="space-y-4">
          {isSupabaseConfigured() ? null : (
            <p className="rounded-2xl border border-line bg-sand px-4 py-3 text-sm leading-6 text-ink">
              Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code>.env.local</code>, run the SQL in <code>supabase/schema.sql</code>, then restart the
              dev server.
            </p>
          )}
          <AuthForm
            notice={
              params.error === "auth"
                ? "That confirmation link did not sign you in. Try again."
                : ""
            }
          />
        </div>
      </main>
    </div>
  );
}
