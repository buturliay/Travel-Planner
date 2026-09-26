export const EXPENSE_CATEGORIES = [
  "Lodging",
  "Food",
  "Transport",
  "Activities",
  "Shopping",
  "Other",
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN"] as const;

const MAX_TRIP_DAYS = 90;

export function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (`${date.getFullYear()}-${month}-${day}` !== value) return null;
  return date;
}

export function dayCount(start: string, end: string) {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return null;
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

export function validateDateRange(start: string, end: string) {
  const span = dayCount(start, end);
  if (span === null) return "Choose a valid start and end date.";
  if (span < 0) return "The end date has to be on or after the start date.";
  if (span > MAX_TRIP_DAYS) return `Trips can cover up to ${MAX_TRIP_DAYS} days.`;
  return null;
}

export function eachDate(start: string, end: string) {
  const dates: string[] = [];
  const cursor = parseIsoDate(start);
  const last = parseIsoDate(end);
  if (!cursor || !last || cursor > last) return dates;
  while (cursor <= last) {
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${cursor.getFullYear()}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function formatDayHeading(iso: string) {
  const date = parseIsoDate(iso);
  if (!date) return { weekday: iso, label: "" };
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    label: date.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
  };
}

export function formatRange(start: string, end: string) {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return `${start} – ${end}`;
  if (start === end) {
    return startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const startLabel = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatTime(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function totalsByCurrency(expenses: { amount: number; currency: string }[]) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.currency, (totals.get(expense.currency) ?? 0) + Number(expense.amount));
  }
  return [...totals.entries()];
}
