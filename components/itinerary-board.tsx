"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createItineraryItem,
  deleteItineraryItem,
  moveItineraryItem,
  updateItineraryItem,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { eachDate, formatDayHeading, formatTime } from "@/lib/dates";
import { emptyActionState, type ItineraryItem, type Trip } from "@/lib/types";

export function ItineraryBoard({ trip, items }: { trip: Trip; items: ItineraryItem[] }) {
  const planned = eachDate(trip.start_date, trip.end_date);
  const extras = [...new Set(items.map((item) => item.date).filter((date) => !planned.includes(date)))].sort();
  const dates = [...planned, ...extras];

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay">Itinerary</p>
        <h2 className="mt-1 font-serif text-3xl">Days</h2>
      </div>
      <div className="space-y-5">
        {dates.map((date, index) => (
          <DayColumn
            key={date}
            trip={trip}
            date={date}
            dayNumber={planned.includes(date) ? index + 1 : null}
            outside={!planned.includes(date)}
            items={items
              .filter((item) => item.date === date)
              .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))}
          />
        ))}
      </div>
    </section>
  );
}

function DayColumn({
  trip,
  date,
  dayNumber,
  outside,
  items,
}: {
  trip: Trip;
  date: string;
  dayNumber: number | null;
  outside: boolean;
  items: ItineraryItem[];
}) {
  const [state, formAction] = useActionState(createItineraryItem, emptyActionState);
  const heading = formatDayHeading(date);

  return (
    <article className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <header className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            {dayNumber ? `Day ${dayNumber}` : "Outside the trip dates"}
          </p>
          <h3 className="font-serif text-2xl">
            {heading.weekday}
            <span className="text-muted"> · {heading.label}</span>
          </h3>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="py-4 text-sm text-muted">Nothing planned yet.</p>
      ) : (
        <ol className="divide-y divide-line">
          {items.map((item, index) => (
            <ItemRow
              key={item.id}
              trip={trip}
              item={item}
              first={index === 0}
              last={index === items.length - 1}
            />
          ))}
        </ol>
      )}

      {outside ? null : (
        <form action={formAction} className="mt-4 grid gap-3 border-t border-dashed border-line pt-4">
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="date" value={date} />
          {state.error ? (
            <p className="text-sm text-clay-dark" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-[7rem_1fr_1fr_auto]">
            <label>
              <span className="label">Time</span>
              <input className="field" type="time" name="time" />
            </label>
            <label>
              <span className="label">Stop</span>
              <input className="field" name="title" required maxLength={160} placeholder="Time Out market" />
            </label>
            <label>
              <span className="label">Place</span>
              <input className="field" name="location" maxLength={160} placeholder="Cais do Sodré" />
            </label>
            <div className="sm:self-end">
              <SubmitButton className="btn-primary w-full sm:w-auto" pendingLabel="Adding…">
                Add
              </SubmitButton>
            </div>
          </div>
          <label>
            <span className="label">Notes</span>
            <input className="field" name="notes" maxLength={1000} placeholder="Optional" />
          </label>
        </form>
      )}
    </article>
  );
}

function ItemRow({
  trip,
  item,
  first,
  last,
}: {
  trip: Trip;
  item: ItineraryItem;
  first: boolean;
  last: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateItineraryItem, emptyActionState);
  const wasPending = useRef(false);
  const time = formatTime(item.time);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setEditing(false);
    wasPending.current = pending;
  }, [pending, state.error]);

  if (editing) {
    return (
      <li className="py-4">
        <form action={formAction} className="grid gap-3">
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="itemId" value={item.id} />
          {state.error ? (
            <p className="text-sm text-clay-dark" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="label">Date</span>
              <input
                className="field"
                type="date"
                name="date"
                required
                min={trip.start_date}
                max={trip.end_date}
                defaultValue={item.date}
              />
            </label>
            <label>
              <span className="label">Time</span>
              <input className="field" type="time" name="time" defaultValue={time} />
            </label>
          </div>
          <label>
            <span className="label">Stop</span>
            <input className="field" name="title" required maxLength={160} defaultValue={item.title} />
          </label>
          <label>
            <span className="label">Place</span>
            <input className="field" name="location" maxLength={160} defaultValue={item.location} />
          </label>
          <label>
            <span className="label">Notes</span>
            <input className="field" name="notes" maxLength={1000} defaultValue={item.notes} />
          </label>
          <div className="flex gap-2">
            <SubmitButton className="btn-primary">Save stop</SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-medium text-ink">
          {time ? <span className="mr-2 font-serif text-clay">{time}</span> : null}
          {item.title}
        </p>
        {item.location ? <p className="text-sm text-moss">{item.location}</p> : null}
        {item.notes ? <p className="mt-1 text-sm text-muted">{item.notes}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <form action={moveItineraryItem}>
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="direction" value="up" />
          <button type="submit" className="btn-ghost" disabled={first} aria-label={`Move ${item.title} earlier`}>
            Up
          </button>
        </form>
        <form action={moveItineraryItem}>
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="direction" value="down" />
          <button type="submit" className="btn-ghost" disabled={last} aria-label={`Move ${item.title} later`}>
            Down
          </button>
        </form>
        <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
          Edit
        </button>
        <form action={deleteItineraryItem}>
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="itemId" value={item.id} />
          <button type="submit" className="btn-ghost text-clay-dark">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
