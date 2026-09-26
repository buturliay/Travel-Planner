import { redirect } from "next/navigation";
import { AccountHeader } from "@/components/account-header";
import { TripCard } from "@/components/trip-card";
import { TripForm } from "@/components/trip-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/lib/types";

export default async function TripsPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true });

  const tripList = (trips ?? []) as Trip[];
  const ids = tripList.map((trip) => trip.id);
  let expenseRows: { trip_id: string; amount: number | string; currency: string }[] = [];
  let expenseError: { message: string } | null = null;

  if (ids.length > 0) {
    const expenseQuery = await supabase
      .from("expenses")
      .select("trip_id, amount, currency")
      .in("trip_id", ids);
    expenseRows = (expenseQuery.data ?? []) as typeof expenseRows;
    expenseError = expenseQuery.error;
  }

  return (
    <div className="min-h-full">
      <AccountHeader email={user.email ?? ""} />
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">Your notebook</p>
          <h1 className="mt-2 font-serif text-5xl tracking-tight">Trips</h1>
          {error || expenseError ? (
            <p className="mt-6 rounded-2xl bg-[#f8e4da] px-4 py-3 text-sm text-clay-dark" role="alert">
              {error?.message ?? expenseError?.message}. If this is a new project, run supabase/schema.sql
              in the Supabase SQL editor.
            </p>
          ) : null}
          {tripList.length === 0 && !error ? (
            <p className="mt-8 rounded-2xl border border-dashed border-line bg-card px-5 py-8 text-muted">
              No trips yet. The first one starts with a destination and a pair of dates.
            </p>
          ) : (
            <div className="mt-8 grid gap-4">
              {tripList.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  expenses={expenseRows
                    .filter((expense) => expense.trip_id === trip.id)
                    .map((expense) => ({
                      amount: Number(expense.amount),
                      currency: expense.currency,
                    }))}
                />
              ))}
            </div>
          )}
        </section>
        <aside className="order-1 h-fit rounded-[1.75rem] border border-line bg-card p-5 sm:p-6 lg:sticky lg:top-6 lg:order-2">
          <h2 className="font-serif text-3xl">New trip</h2>
          <p className="mt-1 mb-5 text-sm text-muted">Dates generate the day-by-day itinerary.</p>
          <TripForm />
        </aside>
      </main>
    </div>
  );
}
