# Techspian Event Meetings

A phone-first web app for the Techspian sales team to log meetings booked at travel-industry events.

**Status: Phase 1** — email + password sign-in, events, create/edit/delete meetings, meeting list with filters and search.
Later phases add offline mode and install-on-phone (2), business-card scanning (3), spreadsheet import (4), voice notes (5) and Excel export (6).

Everything runs on free plans: **Supabase** (login + database) and **Netlify** (hosting).

---

## Setup, step by step

You need about 30 minutes and a GitHub account. No coding needed.

### Step 1 — Create the Supabase project (database + login)

1. Go to <https://supabase.com>, sign up (free) and click **New project**.
2. Name it `techspian-event-meetings`, choose a strong database password (save it in your password manager), and pick the region closest to your team. Click **Create new project** and wait a minute or two.

### Step 2 — Create the tables and security rules

1. In your Supabase project, open **SQL Editor** (left sidebar) → **New query**.
2. Open the file [`supabase/schema.sql`](supabase/schema.sql) from this project, copy **all** of it, paste it into the editor and click **Run**. You should see “Success. No rows returned”.
3. Add yourself and your teammates to the team list. In a new query, run (edit the names and emails; emails must be lowercase):

   ```sql
   insert into public.team_members (email, full_name) values
     ('shreya@techspian.com', 'Shreya'),
     ('teammate@techspian.com', 'Teammate Name');
   ```

   **Only emails on this list can sign in or see any data.** To add someone later, run the same command with their email, or use **Table Editor → team_members → Insert row**. To remove someone, delete their row.

### Step 3 — Create each person’s login (email + password)

People sign in with their work email and a password that you, the admin, set for them. No emails are sent, so no email setup is needed.

1. **Turn off self sign-up** so nobody can create their own account: go to **Authentication → Sign In / Providers** (called **Providers** or **Auth Settings** in some versions), switch **Allow new users to sign up** off, and save. Make sure the **Email** provider itself stays enabled.
2. For each teammate (they must already be on the team list from Step 2.3): go to **Authentication → Users → Add user → Create new user**.
   - Enter their email (lowercase) and a temporary password (at least 8 characters).
   - Tick **Auto Confirm User**.
   - Click **Create user**.
3. Send each person their temporary password privately (not in a group chat). They can change it in the app under **Account → Change password**.

**Forgotten password:** in **SQL Editor → New query**, run this with their email and a new temporary password, then send them the new password privately:

```sql
update auth.users
set encrypted_password = extensions.crypt('NewTempPassword123', extensions.gen_salt('bf'))
where email = 'teammate@techspian.com';
```

(Don’t delete and re-create the user instead: their old meetings would lose their “Booked by” name.)

> If you get “Database error creating new user”, that email isn’t on the team list yet. Add it (Step 2.3) and try again.

### Step 4 — Copy your Supabase keys

Go to **Project Settings → API** (or **API Keys**) and copy two values into a note:

- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon / public key** (or **publishable key**) — a long string.

These two are safe to put in a website; your data is protected by the security rules from Step 2. Never use the **service_role / secret** key in this app.

### Step 5 — Put the code on GitHub

1. Create a new **private** repository on <https://github.com/new>, e.g. `techspian-event-meetings`.
2. Upload this project’s files (everything except the `node_modules` and `dist` folders). On the repository page you can use **Add file → Upload files** and drag the folder contents in.

### Step 6 — Deploy on Netlify

1. Go to <https://app.netlify.com>, sign up with GitHub (free), click **Add new site → Import an existing project → GitHub**, and choose the repository.
2. Netlify reads the build settings from `netlify.toml` automatically (build command `npm run build`, publish folder `dist`).
3. Before deploying, open **Environment variables** (or after: **Site configuration → Environment variables**) and add:

   | Key | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | the Project URL from Step 4 |
   | `VITE_SUPABASE_ANON_KEY` | the anon / publishable key from Step 4 |

4. Click **Deploy**. When it finishes you get an address like `https://techspian-meetings.netlify.app` (you can rename it under **Site configuration → Change site name**).
5. If you added the variables after the first deploy, go to **Deploys → Trigger deploy → Deploy site** so they take effect.

### Step 7 — Try it

Open your Netlify address on your phone and sign in with your email and password. Add an event, then tap **+** to log a meeting.

---

## Using the app

- **Meetings** (home): search by company, name, email, phone or notes; filter by event, by who booked it, and by status (the chips show counts). The app remembers the last event you picked on that phone.
- **+** button: log a new meeting. If an event is happening today, it is pre-selected.
- **Meeting page**: tap **Call** or **Email**, change the status with one tap (Met, No-show…), edit or delete.
- **Events**: add, edit, or delete events. An event with meetings can’t be deleted (to protect the data).
- **Account** (top-right icon): change your password, see the team list, sign out.

Everyone on the team can see and edit all meetings, so the whole team shares one up-to-date list.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| “Wrong email or password” | Check the email is lowercase and the password is right; or reset it — Step 3. |
| “Database error creating new user” when adding a user | Add the email to `team_members` first — Step 2.3. |
| “This account isn’t confirmed yet” | In **Authentication → Users**, confirm the user (or recreate with **Auto Confirm User** ticked). |
| Signed in but the app says “No access” | Their email isn’t on `team_members` (or is spelled differently) — Step 2.3. |
| The page says “Supabase isn’t connected yet” | The Netlify environment variables are missing or misspelled — Step 6.3, then redeploy. |
| “Too many attempts” | Wait a few minutes and try again. |
| A teammate isn’t in the “Booked by” list | They appear once they have signed in at least once. |

---

## For developers

```
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev                  # http://localhost:5173
npm run build                # typecheck + production build to dist/
```

- Vite + React + TypeScript, Tailwind CSS v4, `@supabase/supabase-js`, React Router.
- `supabase/schema.sql` — tables, triggers and Row Level Security. Re-runnable.
- `src/data/DataProvider.tsx` — loads events, meetings and team once after sign-in and does all writes; screens filter in memory. This is where offline storage plugs in for Phase 2.
- Security model: the `team_members` table is the allow-list. Sign-in is email + password; self sign-up is disabled in Supabase and admins create users in the dashboard. A trigger on `auth.users` also rejects any new user whose email is not on the list, and every table’s RLS policy requires `is_team_member()`. Anonymous users have no access.
- `meetings.updated_at` is set by a trigger on each update, unless the client sends its own value (reserved for Phase 2 conflict resolution).
