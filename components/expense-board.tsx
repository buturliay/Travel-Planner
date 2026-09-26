"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createExpense, deleteExpense, updateExpense } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  formatDayHeading,
  formatMoney,
  totalsByCurrency,
} from "@/lib/dates";
import { emptyActionState, type Expense, type Trip } from "@/lib/types";

export function ExpenseBoard({ trip, expenses }: { trip: Trip; expenses: Expense[] }) {
  const [state, formAction] = useActionState(createExpense, emptyActionState);
  const totals = totalsByCurrency(expenses);
  const running = new Map<string, number>();

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay">Expenses</p>
          <h2 className="mt-1 font-serif text-3xl">Spending</h2>
        </div>
        <p className="font-serif text-2xl text-ink">
          {totals.length === 0
            ? "0"
            : totals.map(([currency, amount]) => formatMoney(amount, currency)).join(" · ")}
        </p>
      </div>

      {expenses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-6 text-sm text-muted">
          No expenses yet. Add lodging, meals, tickets, or anything else the trip costs.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {expenses.map((expense) => {
            const next = (running.get(expense.currency) ?? 0) + Number(expense.amount);
            running.set(expense.currency, next);
            const outside = expense.date < trip.start_date || expense.date > trip.end_date;
            return (
              <ExpenseRow
                key={expense.id}
                trip={trip}
                expense={expense}
                runningTotal={next}
                outside={outside}
              />
            );
          })}
        </ul>
      )}

      <form action={formAction} className="grid gap-3 rounded-2xl border border-line bg-sand/60 p-4">
        <input type="hidden" name="tripId" value={trip.id} />
        <h3 className="font-serif text-xl">Add an expense</h3>
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
              defaultValue={trip.start_date}
            />
          </label>
          <label>
            <span className="label">Category</span>
            <select className="field" name="category" defaultValue="Food">
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className="label">Description</span>
          <input className="field" name="description" required maxLength={160} placeholder="Tram day pass" />
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
          <label>
            <span className="label">Amount</span>
            <input className="field" name="amount" type="number" min="0" step="0.01" required placeholder="12.50" />
          </label>
          <label>
            <span className="label">Currency</span>
            <select className="field" name="currency" defaultValue="USD">
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton className="btn-primary w-full" pendingLabel="Adding…">
            Add expense
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}

function ExpenseRow({
  trip,
  expense,
  runningTotal,
  outside,
}: {
  trip: Trip;
  expense: Expense;
  runningTotal: number;
  outside: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateExpense, emptyActionState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setEditing(false);
    wasPending.current = pending;
  }, [pending, state.error]);
  const heading = formatDayHeading(expense.date);

  if (editing) {
    return (
      <li className="p-4">
        <form action={formAction} className="grid gap-3">
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="expenseId" value={expense.id} />
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
                defaultValue={expense.date}
              />
            </label>
            <label>
              <span className="label">Category</span>
              <select className="field" name="category" defaultValue={expense.category}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span className="label">Description</span>
            <input className="field" name="description" required maxLength={160} defaultValue={expense.description} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="label">Amount</span>
              <input
                className="field"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={Number(expense.amount).toFixed(2)}
              />
            </label>
            <label>
              <span className="label">Currency</span>
              <select className="field" name="currency" defaultValue={expense.currency}>
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <SubmitButton className="btn-primary">Save expense</SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          {expense.category} · {heading.label}
          {outside ? " · outside trip dates" : ""}
        </p>
        <p className="mt-1 font-medium">{expense.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-right">
          <p className="font-serif text-xl">{formatMoney(Number(expense.amount), expense.currency)}</p>
          <p className="text-xs text-muted">Running {formatMoney(runningTotal, expense.currency)}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
          Edit
        </button>
        <form action={deleteExpense}>
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="expenseId" value={expense.id} />
          <button type="submit" className="btn-ghost text-clay-dark">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
