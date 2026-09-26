import Link from "next/link";

export default function TripNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Missing trip</p>
      <h1 className="mt-3 font-serif text-4xl">This trip is not in your notebook.</h1>
      <Link href="/trips" className="btn-primary mt-6">
        Back to trips
      </Link>
    </main>
  );
}
