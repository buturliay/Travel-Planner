import { deleteTrip } from "@/app/actions";
import { formatRange, formatMoney, totalsByCurrency } from "@/lib/dates";
import type { Trip } from "@/lib/types";
import Link from "next/link";
import { DeleteTripButton } from "@/components/delete-trip-button";

export function TripCard({
  trip,
  expenses,
}: {
  trip: Trip;
  expenses: { amount: number; currency: string }[];
}) {
  const totals = totalsByCurrency(expenses);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 pl-6">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-clay" aria-hidden="true" />
      <Link href={`/trips/${trip.id}`} className="block">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {formatRange(trip.start_date, trip.end_date)}
        </p>
        <h2 className="mt-2 font-serif text-3xl tracking-tight text-ink">{trip.title}</h2>
        <p className="mt-1 text-lg text-moss">{trip.destination}</p>
        <p className="mt-4 text-sm text-muted">
          {totals.length === 0
            ? "No expenses yet"
            : totals.map(([currency, amount]) => formatMoney(amount, currency)).join(" · ")}
        </p>
      </Link>
      <div className="mt-5 flex gap-2">
        <Link href={`/trips/${trip.id}#edit`} className="btn-ghost">
          Edit
        </Link>
        <form action={deleteTrip}>
          <input type="hidden" name="tripId" value={trip.id} />
          <DeleteTripButton />
        </form>
      </div>
    </article>
  );
}
