export type Trip = {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  notes: string;
  created_at: string;
};

export type ItineraryItem = {
  id: string;
  trip_id: string;
  date: string;
  time: string | null;
  title: string;
  location: string;
  notes: string;
  sort_order: number;
  created_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  created_at: string;
};

export type ActionState = {
  error: string;
  message: string;
};

export const emptyActionState: ActionState = { error: "", message: "" };
