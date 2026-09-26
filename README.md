# Travel Planner

A private travel notebook built with Next.js, TypeScript, Tailwind CSS, and Supabase. Sign in to create trips, build a day-by-day itinerary, and track expenses. Each account only sees its own data.

## Local setup

1. Install dependencies and copy the env file:

```bash
npm install
cp .env.example .env.local
```

2. Create a project at [supabase.com](https://supabase.com). In **Project Settings → API**, copy the project URL and the anon public key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. In the Supabase **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). That creates `trips`, `itinerary_items`, and `expenses`, with row-level security so a person can only read and change their own trips.

4. In **Authentication → URL Configuration**, set:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and add a trip. If email confirmation is enabled in Supabase, confirm the message first, then sign in.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com) (or run `npx vercel --prod`).
3. Add the same two environment variables in the Vercel project settings.
4. After the first deploy, add the production URL to Supabase Authentication:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

Redeploy if you change environment variables.
