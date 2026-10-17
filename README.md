# Class 101 — Out of Syllabus

Sapiens Campus first-year freshers meetup. Each person gets a desk with a task, a secret task, a team, and Sapien Dollars. Scanning a card opens it, and Connect adds that person to your account. Admins allot teams, award points, and run the goodie counter.

[![Architecture diagram of tazimsheriff/onday-site](https://gitdiagram.com/tazimsheriff/onday-site/diagram.png)](https://gitdiagram.com/tazimsheriff/onday-site?utm_source=readme&utm_medium=picture)

## Live site

- Railway (database kept on a volume): https://onday-site-production-47b3.up.railway.app
- Vercel: https://onday-site.vercel.app
- Repository: https://github.com/Tazimsheriff/ONDAY-SITE

Sign in with the name and phone number you were given. The phone number is the password. There is no public signup. The demo desk is **Demo Sapien** / **9000000001**. Admin signs in as **admin**, with `ADMIN_PASSWORD` typed in the phone field. Changing `ADMIN_PASSWORD` updates that login on the next start.

## What is on this branch

`main` is the hosted meetup app:

- Home, login, personal desk, profile card, QR scan, leaderboard, and goodie redemption. Logins are created ahead of time.
- Admin pages for students, teams, and goodies.
- Guest rows load from `data/guests.csv` when that file is present. It is not in git.
- SQLite lives under `/tmp` on Vercel so the homepage can render on a read-only app disk. That copy does not survive a new server. Railway keeps the database on a volume.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `SESSION_SECRET` and `ADMIN_PASSWORD` in `.env.local` before you rely on login. A fresh database will not seed the admin until `ADMIN_PASSWORD` is set. In production, set `APP_ORIGIN` to the public https address so profile and desk QR codes resolve, and leave `ENABLE_DEMO` unset so the demo account is not created. Open http://localhost:3000.
