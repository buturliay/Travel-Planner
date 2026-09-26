"use client";

import { useActionState } from "react";
import { createTrip, updateTrip } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { emptyActionState, type Trip } from "@/lib/types";

export function TripForm({ trip }: { trip?: Trip }) {
  const action = trip ? updateTrip : createTrip;
  const [state, formAction] = useActionState(action, emptyActionState);

  return (
    <form action={formAction} className="space-y-4">
      {trip ? <input type="hidden" name="tripId" value={trip.id} /> : null}
      {state.error ? (
        <p className="rounded-xl bg-[#f8e4da] px-3 py-2 text-sm text-clay-dark" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl bg-[#e5efe6] px-3 py-2 text-sm text-moss" role="status">
          {state.message}
        </p>
      ) : null}
      <label className="block">
        <span className="label">Trip name</span>
        <input className="field" name="title" required maxLength={120} defaultValue={trip?.title} placeholder="Autumn in Lisbon" />
      </label>
      <label className="block">
        <span className="label">Destination</span>
        <input
          className="field"
          name="destination"
          required
          maxLength={120}
          defaultValue={trip?.destination}
          placeholder="Lisbon, Portugal"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Start</span>
          <input className="field" type="date" name="startDate" required defaultValue={trip?.start_date} />
        </label>
        <label className="block">
          <span className="label">End</span>
          <input className="field" type="date" name="endDate" required defaultValue={trip?.end_date} />
        </label>
      </div>
      <label className="block">
        <span className="label">Notes</span>
        <textarea
          className="field min-h-24 resize-y"
          name="notes"
          maxLength={2000}
          defaultValue={trip?.notes}
          placeholder="Neighborhoods, who is coming, what not to forget."
        />
      </label>
      <SubmitButton className="btn-primary w-full">{trip ? "Save trip" : "Create trip"}</SubmitButton>
    </form>
  );
}
