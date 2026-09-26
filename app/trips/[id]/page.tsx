import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteTrip } from "@/app/actions";
import { AccountHeader } from "@/components/account-header";
import { DeleteTripButton } from "@/components/delete-trip-button";
import { ExpenseBoard } from "@/components/expense-board";
import { ItineraryBoard } from "@/components/itinerary-board";
import { TripForm } from "@/components/trip-form";
import { formatRange } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Expense, ItineraryItem, Trip } from "@/lib/types";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) redirect("/");

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: tripRow } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (!tripRow) notFound();
  const trip = tripRow as Trip;

  const [{ data: itemRows }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("itinerary_items")
      .select("*")
      .eq("trip_id", id)
      .order("date", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", id)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const items = (itemRows ?? []) as ItineraryItem[];
  const expenses = ((expenseRows ?? []) as Expense[]).map((expense) => ({
    ...expense,
    amount: Number(expense.amount),
  }));

  return (
    <div className="min-h-full">
      <AccountHeader email={user.email ?? ""} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/trips" className="text-sm text-moss">
          All trips
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              {formatRange(trip.start_date, trip.end_date)}
            </p>
            <h1 className="mt-2 font-serif text-5xl tracking-tight">{trip.title}</h1>
            <p className="mt-2 text-xl text-moss">{trip.destination}</p>
            {trip.notes ? <p className="mt-4 max-w-2xl leading-7 text-muted">{trip.notes}</p> : null}
          </div>
          <form action={deleteTrip}>
            <input type="hidden" name="tripId" value={trip.id} />
            <DeleteTripButton label="Delete trip" />
          </form>
        </div>

        <section id="edit" className="mt-8 rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-4 font-serif text-2xl">Edit trip</h2>
          <TripForm trip={trip} />
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <ItineraryBoard trip={trip} items={items} />
          <ExpenseBoard trip={trip} expenses={expenses} />
        </div>
      </main>
    </div>
  );
}
