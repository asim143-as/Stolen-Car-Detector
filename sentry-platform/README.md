# Sentry — Stolen Vehicle Detection Platform

Same shape as the MediSight reference project (Next.js 14 + Supabase Auth +
a Python detection service, three portals with role-based access) rebuilt
for stolen-vehicle reporting instead of healthcare.

```
sentry-platform/
├── frontend/     Next.js 14 App Router (User / Administration / Admin portals)
├── backend/      FastAPI (Supabase Postgres, YOLO video detection, Gemini assistant)
└── supabase/     schema.sql -- one-time SQL to run in the Supabase SQL editor
```

## Portals

| Portal | Route | Who | What they do |
|---|---|---|---|
| User | `/user/*` | Reporters | Submit a stolen-vehicle report, track its status |
| Administration | `/administration/*` | Approved staff | Run live video detection, review matches, mark Found/Not Found |
| Admin | `/admin-portal/*` (separate login) | Admins | Approve Administration staff, manage roles, oversee all reports, audit log |

Login/signup (Google or email) is Supabase Auth, handled entirely by the
Next.js frontend — the backend never sees a password, only a verified
access token.

## Setup order

1. **Supabase project** — create one if you don't have it yet.
2. **Run `supabase/schema.sql`** in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
3. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   # fill in DATABASE_URL, SUPABASE_URL, GEMINI_API_KEY
   pip install -r requirements.txt --break-system-packages
   uvicorn app:app --reload
   ```
   First run creates the `profiles`, `stolen_cars`, and `detections` tables automatically.
4. **Frontend**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   npm install
   npm run dev
   ```
5. **Make yourself Admin** — sign up through the app once (so your `profiles` row exists), then in the Supabase SQL Editor:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
   Log in at `/admin-portal/login` with that account.
6. Everyone else: sign up normally, pick a role on the onboarding screen. Administration accounts stay on **Pending** until you approve them from **Admin → Users & Roles**.

## Notes

- The image carousel on `/welcome` uses placeholder Unsplash photos — swap `HeroCarousel.tsx`'s `SLIDES` array for your own.
- `MLOps/Models` from the reference project became **Detection Settings** (`/admin-portal/models`) — currently a read-only summary of the backend's `.env` values, since changing them live would mean restarting the detection service.
- `Appointments` had no equivalent here and was removed entirely.
- This is a V1: the core three-portal flow (report → review → resolve, live detection, Gemini assistant, roles/approval) is wired end-to-end and tested. Deeper pages (user profile editing, richer analytics) can be layered on top the same way.
