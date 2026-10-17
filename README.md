# Class 101 — Out of Syllabus

Sapiens Campus first-year freshers meetup. Each person gets a desk with a task, a secret task, a team, and Sapien Dollars. Scanning a card connects two people. Admins allot teams, award points, and run the goodie counter.

## Live site

- Railway (database kept on a volume): https://onday-site-production-47b3.up.railway.app
- Vercel: https://onday-site.vercel.app
- Repository: https://github.com/Tazimsheriff/ONDAY-SITE

Sign in with the name and phone number from the Luma registration. The phone number is the password. People without a Luma row can sign up. The demo desk is **Demo Sapien** / **9000000001**. Admin signs in as **admin** with `ADMIN_PASSWORD`.

## What is on this branch

`main` is the hosted meetup app:

- Home, login, signup, personal desk, profile card, QR scan, leaderboard, and goodie redemption.
- Admin pages for students, teams, and goodies.
- Guest rows load from `data/guests.csv` when that file is present. It is not in git.
- SQLite lives under `/tmp` on Vercel so the homepage can render on a read-only app disk. That copy does not survive a new server. Railway keeps the database on a volume.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `SESSION_SECRET` and `ADMIN_PASSWORD` in `.env.local` before you rely on login. Open http://localhost:3000.
