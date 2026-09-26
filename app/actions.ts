"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  parseIsoDate,
  validateDateRange,
} from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { emptyActionState, type ActionState, type ItineraryItem, type Trip } from "@/lib/types";

const missingKeys = "Add your Supabase URL and anon key to .env.local, then restart the app.";

type Failure = { ok: false; error: string };

function fail(error: string): Failure {
  return { ok: false, error };
}

async function requireUser() {
  if (!isSupabaseConfigured()) return fail(missingKeys);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");
  return { ok: true as const, supabase, user };
}

function textField(formData: FormData, name: string, label: string, max: number, required = true) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value && required) return fail(`${label} is required.`);
  if (value.length > max) return fail(`${label} must be ${max} characters or fewer.`);
  return { ok: true as const, value };
}

async function getOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) return origin;
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

async function ownedTrip(tripId: string) {
  const session = await requireUser();
  if (!session.ok) return session;

  const { data, error } = await session.supabase.from("trips").select("*").eq("id", tripId).maybeSingle();
  if (error || !data) return fail("That trip could not be found.");
  return { ok: true as const, supabase: session.supabase, trip: data as Trip };
}

function tripFields(formData: FormData) {
  const title = textField(formData, "title", "Title", 120);
  if (!title.ok) return title;
  const destination = textField(formData, "destination", "Destination", 120);
  if (!destination.ok) return destination;
  const notes = textField(formData, "notes", "Notes", 2000, false);
  if (!notes.ok) return notes;
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const rangeError = validateDateRange(startDate, endDate);
  if (rangeError) return fail(rangeError);
  return {
    ok: true as const,
    title: title.value,
    destination: destination.value,
    notes: notes.value,
    start_date: startDate,
    end_date: endDate,
  };
}

function withinTrip(trip: Trip, date: string) {
  return Boolean(parseIsoDate(date) && date >= trip.start_date && date <= trip.end_date);
}

function optionalTime(value: FormDataEntryValue | null) {
  const time = String(value ?? "").trim();
  if (!time) return { ok: true as const, time: null };
  if (!/^\d{2}:\d{2}$/.test(time)) return fail("Use a valid time.");
  return { ok: true as const, time };
}

function moneyFields(formData: FormData, trip: Trip) {
  const description = textField(formData, "description", "Description", 160);
  if (!description.ok) return description;
  const category = String(formData.get("category") ?? "");
  if (!EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])) {
    return fail("Choose a category.");
  }
  const currency = String(formData.get("currency") ?? "USD").toUpperCase();
  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    return fail("Choose a currency.");
  }
  const date = String(formData.get("date") ?? "");
  if (!withinTrip(trip, date)) return fail("Pick a date inside this trip.");
  const amount = Number(String(formData.get("amount") ?? ""));
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    return fail("Enter an amount between 0 and 1,000,000.");
  }
  return {
    ok: true as const,
    description: description.value,
    category,
    currency,
    date,
    amount: Math.round(amount * 100) / 100,
  };
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: missingKeys, message: "" };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required.", message: "" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, message: "" };
  redirect("/trips");
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: missingKeys, message: "" };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required.", message: "" };
  if (password.length < 6) return { error: "Use a password with at least 6 characters.", message: "" };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message, message: "" };
  if (!data.session) {
    return { error: "", message: "Check your email for a confirmation link, then sign in." };
  }
  redirect("/trips");
}

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createTrip(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  if (!session.ok) return { error: session.error, message: "" };

  const fields = tripFields(formData);
  if (!fields.ok) return { error: fields.error, message: "" };

  const { data, error } = await session.supabase
    .from("trips")
    .insert({
      user_id: session.user.id,
      title: fields.title,
      destination: fields.destination,
      notes: fields.notes,
      start_date: fields.start_date,
      end_date: fields.end_date,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "The trip could not be created.", message: "" };
  revalidatePath("/trips");
  redirect(`/trips/${data.id}`);
}

export async function updateTrip(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tripId = String(formData.get("tripId") ?? "");
  const owned = await ownedTrip(tripId);
  if (!owned.ok) return { error: owned.error, message: "" };

  const fields = tripFields(formData);
  if (!fields.ok) return { error: fields.error, message: "" };

  const { error } = await owned.supabase
    .from("trips")
    .update({
      title: fields.title,
      destination: fields.destination,
      notes: fields.notes,
      start_date: fields.start_date,
      end_date: fields.end_date,
    })
    .eq("id", tripId);
  if (error) return { error: error.message, message: "" };
  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  return { error: "", message: "Trip saved." };
}

export async function deleteTrip(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "");
  const owned = await ownedTrip(tripId);
  if (!owned.ok) return;
  const { error } = await owned.supabase.from("trips").delete().eq("id", tripId);
  if (error) return;
  revalidatePath("/trips");
  redirect("/trips");
}

export async function createItineraryItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = await itineraryFields(formData);
  if (!parsed.ok) return { error: parsed.error, message: "" };

  const { data: last } = await parsed.supabase
    .from("itinerary_items")
    .select("sort_order")
    .eq("trip_id", parsed.tripId)
    .eq("date", parsed.date)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await parsed.supabase.from("itinerary_items").insert({
    trip_id: parsed.tripId,
    date: parsed.date,
    time: parsed.time,
    title: parsed.title,
    location: parsed.location,
    notes: parsed.notes,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return { error: error.message, message: "" };
  revalidatePath(`/trips/${parsed.tripId}`);
  return emptyActionState;
}

export async function updateItineraryItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = await itineraryFields(formData);
  if (!parsed.ok) return { error: parsed.error, message: "" };
  const itemId = String(formData.get("itemId") ?? "");

  const { data: current } = await parsed.supabase
    .from("itinerary_items")
    .select("date, sort_order")
    .eq("id", itemId)
    .eq("trip_id", parsed.tripId)
    .maybeSingle();
  if (!current) return { error: "That stop could not be found.", message: "" };

  let sortOrder = current.sort_order as number;
  if (current.date !== parsed.date) {
    const { data: last } = await parsed.supabase
      .from("itinerary_items")
      .select("sort_order")
      .eq("trip_id", parsed.tripId)
      .eq("date", parsed.date)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (last?.sort_order ?? -1) + 1;
  }

  const { error } = await parsed.supabase
    .from("itinerary_items")
    .update({
      date: parsed.date,
      time: parsed.time,
      title: parsed.title,
      location: parsed.location,
      notes: parsed.notes,
      sort_order: sortOrder,
    })
    .eq("id", itemId)
    .eq("trip_id", parsed.tripId);
  if (error) return { error: error.message, message: "" };
  revalidatePath(`/trips/${parsed.tripId}`);
  return emptyActionState;
}

async function itineraryFields(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "");
  const owned = await ownedTrip(tripId);
  if (!owned.ok) return owned;

  const date = String(formData.get("date") ?? "");
  if (!withinTrip(owned.trip, date)) return fail("Pick a date inside this trip.");
  const title = textField(formData, "title", "Title", 160);
  if (!title.ok) return title;
  const location = textField(formData, "location", "Place", 160, false);
  if (!location.ok) return location;
  const notes = textField(formData, "notes", "Notes", 1000, false);
  if (!notes.ok) return notes;
  const time = optionalTime(formData.get("time"));
  if (!time.ok) return time;

  return {
    ok: true as const,
    supabase: owned.supabase,
    tripId,
    date,
    title: title.value,
    location: location.value,
    notes: notes.value,
    time: time.time,
  };
}

export async function deleteItineraryItem(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const owned = await ownedTrip(tripId);
  if (!owned.ok) return;
  await owned.supabase.from("itinerary_items").delete().eq("id", itemId).eq("trip_id", tripId);
  revalidatePath(`/trips/${tripId}`);
}

export async function moveItineraryItem(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const owned = await ownedTrip(tripId);
  if (!owned.ok) return;

  const { data: item } = await owned.supabase
    .from("itinerary_items")
    .select("*")
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .maybeSingle();
  if (!item) return;
  const current = item as ItineraryItem;

  const { data: siblings } = await owned.supabase
    .from("itinerary_items")
    .select("id, sort_order")
    .eq("trip_id", tripId)
    .eq("date", current.date)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const list = siblings ?? [];
  const index = list.findIndex((row) => row.id === itemId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= list.length) return;

  const reordered = [...list];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(swapWith, 0, moved);

  await Promise.all(
    reordered.map((row, sortOrder) =>
      owned.supabase
        .from("itinerary_items")
        .update({ sort_order: sortOrder })
        .eq("id", row.id)
        .eq("trip_id", tripId),
    ),
  );
  revalidatePath(`/trips/${tripId}`);
}

export async function createExpense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = await expenseFields(formData);
  if (!parsed.ok) return { error: parsed.error, message: "" };

  const { error } = await parsed.supabase.from("expenses").insert({
    trip_id: parsed.tripId,
    date: parsed.date,
    category: parsed.category,
    description: parsed.description,
    amount: parsed.amount,
    currency: parsed.currency,
  });
  if (error) return { error: error.message, message: "" };
  revalidatePath("/trips");
  revalidatePath(`/trips/${parsed.tripId}`);
  return emptyActionState;
}

export async function updateExpense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = await expenseFields(formData);
  if (!parsed.ok) return { error: parsed.error, message: "" };
  const expenseId = String(formData.get("expenseId") ?? "");

  const { error } = await parsed.supabase
    .from("expenses")
    .update({
      date: parsed.date,
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount,
      currency: parsed.currency,
    })
    .eq("id", expenseId)
    .eq("trip_id", parsed.tripId);
  if (error) return { error: error.message, message: "" };
  revalidatePath("/trips");
  revalidatePath(`/trips/${parsed.tripId}`);
  return emptyActionState;
}

async function expenseFields(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "");
  const owned = await ownedTrip(tripId);
  if (!owned.ok) return owned;
  const fields = moneyFields(formData, owned.trip);
  if (!fields.ok) return fields;
  return { ...fields, supabase: owned.supabase, tripId };
}

export async function deleteExpense(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "");
  const expenseId = String(formData.get("expenseId") ?? "");
  const owned = await ownedTrip(tripId);
  if (!owned.ok) return;
  await owned.supabase.from("expenses").delete().eq("id", expenseId).eq("trip_id", tripId);
  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
}
