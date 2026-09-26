import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-ink">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <circle cx="16" cy="16" r="15" className="fill-moss" />
        <path
          d="M16 6.5 18.4 14 26 16l-7.6 2L16 25.5 13.6 18 6 16l7.6-2L16 6.5Z"
          className="fill-paper"
        />
      </svg>
      <span className="font-serif text-2xl leading-none tracking-tight">Travel Planner</span>
    </Link>
  );
}
