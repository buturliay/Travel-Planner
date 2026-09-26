"use client";

export function DeleteTripButton({ label = "Delete" }: { label?: string }) {
  return (
    <button
      type="submit"
      className="btn-ghost text-clay-dark"
      onClick={(event) => {
        if (!window.confirm("Delete this trip, including its days and expenses?")) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}
