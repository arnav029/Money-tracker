# Money Management App — Plan 2: Backend, Auth & Phone Verification

This continues from `money-management-app-plan.md` (product/UI plan). This one covers turning the app from a local-only prototype into a real multi-user product: backend, phone-based sign-in, and keeping each user's data private.

---

## Why Supabase

- You already need a real database for expense data — Supabase gives you **Postgres + Auth in one system**, instead of stitching together Firebase Auth with a separate DB.
- **Row-Level Security (RLS)** solves your core requirement directly: a user can only ever see their own rows, enforced at the database level — not just in your frontend code.
- Free tier is generous enough for early launch; scales without a re-platform later.
- Not locked into one SMS vendor — you can swap in a cheaper India-first OTP provider instead of Twilio's default.

---

## Step 1 — Set up Supabase

1. Create a project at supabase.com
2. Note your project URL and anon/public API key (used in your frontend)
3. Install the client: `npm install @supabase/supabase-js`

## Step 2 — Enable phone authentication

1. In the Supabase dashboard → Authentication → Providers → enable **Phone**
2. By default it routes through Twilio — for India, swap this to a cheaper provider:
   - **MSG91** (~₹0.15/OTP, India-first, DLT-compliant) — recommended starting point
   - Gupshup (~₹0.17/OTP) as an alternative
3. Complete **DLT registration** (required by TRAI for any transactional SMS in India) — this is a compliance step, not optional, or messages get silently blocked by Jio/Airtel/Vi/BSNL

## Step 3 — Sign-in flow (frontend)

```js
// Request OTP
await supabase.auth.signInWithOtp({ phone: '+91XXXXXXXXXX' })

// Verify OTP the user enters
await supabase.auth.verifyOtp({
  phone: '+91XXXXXXXXXX',
  token: '123456',
  type: 'sms'
})
```
Once verified, Supabase issues a session — the user is now authenticated with a stable `user.id` you'll use to tag their data.

## Step 4 — Database schema

```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  amount numeric not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);
```

## Step 5 — Row-Level Security (the actual privacy layer)

```sql
alter table expenses enable row level security;

create policy "Users can view their own expenses"
  on expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on expenses for delete
  using (auth.uid() = user_id);
```
This is what actually stops "any random person" from seeing someone else's expenses — even if there's a bug in your app code, the database itself refuses the query.

## Step 6 — Local-first + sync (optional, matches your PWA offline goal)

- Keep writing to IndexedDB first for instant, offline-friendly logging (your "5-second log" principle from Plan 1)
- Sync to Supabase in the background when online
- On login on a new device, pull the user's Supabase data down to populate local storage

---

## Cost reality check (India, low volume)

- MSG91-style pricing: roughly ₹0.15–0.20 per OTP sent
- At a few hundred signups/month, this is a few hundred rupees — not a threat to staying free for users
- DLT registration is a one-time compliance hurdle, more paperwork than cost

---

## Suggested order of work

1. Supabase project + phone auth enabled (Twilio default, to get it working end-to-end first)
2. Wire up sign-in flow + verify OTP in your existing frontend
3. Create `expenses` table + RLS policies
4. Point your existing add-expense UI at Supabase instead of/alongside local storage
5. Swap SMS provider to MSG91 once the flow works, to cut cost
6. Complete DLT registration in parallel (it can take a few days for approval)