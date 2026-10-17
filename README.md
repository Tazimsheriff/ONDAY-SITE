# Class 101 — Out of Syllabus

Sapiens Campus first-year freshers meetup. Each person gets a desk with a task, a secret task, a team, and Sapien Dollars. Scanning a card can connect two people. Admins allot teams, award points, and run the goodie counter.

This file describes the `new-changes` branch.

## Live site

These URLs are the hosted app. They follow `main` until this branch is deployed.

- Railway (database kept on a volume): https://onday-site-production-47b3.up.railway.app
- Vercel: https://onday-site.vercel.app
- Repository: https://github.com/Tazimsheriff/ONDAY-SITE
- This branch: https://github.com/Tazimsheriff/ONDAY-SITE/tree/new-changes

Sign in with your name and account password. The demo desk is **Demo Sapien**, phone **9000000001**, password **9000000001**. Admin signs in as **admin** with `ADMIN_PASSWORD`. That variable has to be set before the database is seeded. There is no default.

## Changes on this branch

`new-changes` keeps the meetup app and replaces phone-as-password login with a real password, plus a few tighter rules around sessions, redemptions, and the public URL.

- Signup, walk-in, and admin accounts store an scrypt password hash. The password must be at least 8 characters. The phone number is still the account identifier.
- Login checks the name and the password. Ten failures for the same name inside 15 minutes are rejected.
- Logout bumps `session_version`, so a cookie from before logout stops working.
- Goodie redemption takes a quantity. Dollars and stock move by cost times quantity, and a refund puts that quantity back.
- Opening another person's card no longer connects you. The card has a Connect button.
- Production reads the public site address from `APP_ORIGIN` (https, no path, no userinfo). It does not trust forwarded host headers.
- The admin student list no longer prints phone numbers.
- `.env` is gitignored. The demo account is not created in production unless `ENABLE_DEMO=true`.

The home page still says the phone number is the password. The login and signup forms on this branch ask for a separate password.

## How this branch differs from main

| | `main` | `new-changes` |
| --- | --- | --- |
| Login | Name and phone number. The phone number is the password. | Name and password. The password is hashed. The phone field is still on the form and is not what login checks. |
| New accounts | Signup and walk-in only need a name and phone. | Signup and walk-in also require a password of 8 or more characters. |
| Admin password | `ADMIN_PASSWORD`, with a built-in fallback if it is unset. | Seeding stops unless `ADMIN_PASSWORD` is set. |
| Sessions | A signed cookie. | The cookie includes a session version. Logout invalidates older cookies. |
| Goodies | Redeem or refund one item. | Redeem or refund a chosen quantity. |
| Connections | Viewing someone else's card records the connection. | The viewer has to press Connect. |
| Public URL | Taken from the request host. | `APP_ORIGIN` is required in production. |
| Demo account | Always seeded. | Skipped in production unless `ENABLE_DEMO=true`. |
| Secrets in the repo | `.env.example` lists `SESSION_SECRET` and `ADMIN_PASSWORD`. | `.env` is ignored. `.env.example` only shows `SESSION_SECRET`. Set `ADMIN_PASSWORD` and `APP_ORIGIN` yourself. |

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Put a long random `SESSION_SECRET` in `.env.local`, and set `ADMIN_PASSWORD`. `APP_ORIGIN` is only required when `NODE_ENV` is production. Open http://localhost:3000.

Guest rows load from `data/guests.csv` when that file is present. Do not commit it. It contains phone numbers and email addresses, and this GitHub repo is public.
