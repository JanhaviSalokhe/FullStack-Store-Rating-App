# Store Rating App

Stage 1 project foundation and Stage 2 MySQL schema: a React + Vite frontend, an Express API, and related users, stores, and ratings tables.

## Prerequisites

- Node.js 20.17 or newer
- MySQL Server running locally

## Configure the backend

The local `backend/.env` file contains development defaults. Update its MySQL user and password to match your local MySQL installation. The file is ignored by Git.

Set `DB_USER` and `DB_PASSWORD` in `backend/.env` to a MySQL account with permission to create databases and tables. Then create the application database and tables:

```powershell
cd backend
npm install
npm run db:setup
```

The setup creates `users`, `stores`, and `ratings`. Ratings reference one user and one store, and each user can submit one rating per store. The schema enforces unique emails, user/store relationships, and rating values from 1 to 5. User names are limited to 20–60 characters. Re-running setup safely leaves existing tables and data in place.

## Run the application

Open two terminals from the project root:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend URL printed by Vite (usually http://localhost:5173). Its status panel checks the Express API and MySQL connection. The API health endpoint is http://localhost:5000/api/health.

The Vite development server proxies `/api` requests to the backend.

The backend is organized under `backend/src` into `config`, `controllers`, `middleware`, `models`, `routes`, and `utils`.

## Authentication

Set `JWT_SECRET` in `backend/.env` to a private random value of at least 32 characters before starting the backend. For example, generate one locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` and copy the output into `.env`. Never use the example placeholder or commit `.env`.

The shared sign-in accepts users of any assigned role. Public registration creates only normal-user accounts; protected profile and password-change endpoints identify the authenticated user's role. Passwords are stored as bcrypt hashes. The JWT is held in an HttpOnly cookie, not browser storage. Logout and changing the password revoke existing sessions; changing the password refreshes the current session.

Authentication endpoints:

- `POST /api/auth/register` — create an account and start a session.
- `POST /api/auth/login` — sign in any existing role.
- `POST /api/auth/logout` — revoke sessions and clear the session cookie; requires a valid session.
- `GET /api/auth/me` — return the authenticated user's profile; requires a valid session.
- `PATCH /api/auth/password` — change password; requires the current password and a valid session.

The user table includes an authentication token version. Running `npm run db:setup` adds it to an existing database without deleting user data.

## Input validation

The frontend provides matching HTML form limits, and the backend validates every submitted value independently:

- User and store names: 20–60 characters.
- Addresses: required, with a maximum of 400 characters.
- Email addresses: valid format and no more than 254 characters.
- New passwords: 8–16 characters, including an uppercase letter and a special character.
- Ratings: whole numbers from 1 to 5, inclusive.

Invalid API input returns `400 Bad Request`; client-side form validation is a convenience and does not replace server checks.

## Role-based dashboards

Dashboard APIs verify the signed-in user on every request and enforce the account role on the server:

- `GET /api/dashboard/admin` — system-administrator totals for users, stores, and submitted ratings.
- `GET /api/dashboard/user` — normal-user submitted-rating count.
- `GET /api/dashboard/store-owner` — stores owned by the signed-in owner, average ratings, and customer rating details.

The frontend loads only the endpoint associated with the authenticated user's role. A valid login alone does not grant access to another role's dashboard; mismatched roles receive `403 Forbidden`.

## Store-owner APIs

These endpoints require a signed-in `store_owner`; other roles receive `403`.

- `GET /api/owner/dashboard` — each owned store's average rating and total rating count (including stores without ratings).
- `GET /api/owner/ratings` — ratings for the owner's stores, including the submitting user's name and email, store name, score, and last-updated time.
- `PATCH /api/auth/password` — the shared authenticated password-change endpoint; owners must provide their current password and a valid new password.

The store-owner frontend at `/dashboard` shows a rating-weighted average across the owner's stores, store-by-store scores, and the customers who rated them. The shared `/change-password` page is available to owners from the Password navigation link.

## Normal-user store and rating APIs

These endpoints require a signed-in `normal_user`. In Postman, send `POST http://localhost:5000/api/auth/login` with `Content-Type: application/json` and a JSON body containing `email` and `password`. Postman stores the HttpOnly session cookie from the response; send subsequent requests to the same host and port so it can send the cookie. No Bearer token is needed.

- `GET /api/stores` — list stores alphabetically, with `overallRating`, `ratingCount`, and the signed-in user's `userRating` (`null` if they have not rated the store).
- `GET /api/stores/search?name=Market` — search store names. Use `address=Main%20Street` to search addresses, or provide both parameters to match both. Search can also be applied to `GET /api/stores`.
- `POST /api/ratings` — JSON body: `{ "storeId": 1, "rating": 5 }`. Creates a rating from 1 to 5. Repeating a rating for the same store returns `409`; update the existing rating instead.
- `PUT /api/ratings/:id` — JSON body: `{ "rating": 4 }`. Updates only the signed-in user's rating. A rating belonging to another user is not disclosed and returns `404`.

Rating endpoints reject missing/invalid fields with `400`. Store and rating requests without a session return `401`; authenticated non-normal roles return `403`.

## Normal-user frontend

The React app provides `/login`, `/register`, `/stores`, and `/change-password` pages. Sign in or register in the browser to access the stores page. Search by store name and/or address, view overall and personal ratings, and use **Rate store** or **Edit rating** to submit or change a score from 1 to 5. The browser sends the HttpOnly session cookie automatically; normal-user pages are protected by both frontend routing and backend authorization.

## Admin APIs

All `/api/admin` endpoints require a signed-in `system_administrator`; other roles receive `403`.

- `GET /api/admin/dashboard` — user, store, and rating totals.
- `POST /api/admin/users` — create a `normal_user` or `system_administrator`. JSON fields: `name`, `email`, `address`, `password`, `role`. Passwords are stored as bcrypt hashes.
- `GET /api/admin/users` — list users; optional `name`, `email`, `address` substring filters and `role` exact filter. Sort with `sortBy=name|email|address|role` and `order=asc|desc`.
- `GET /api/admin/users/:id` — user details; store owners include their average rating and per-store rating summaries.
- `POST /api/admin/stores` — create a store. JSON fields: `name`, `email`, `address`; optionally set `ownerId` to an existing store-owner user ID.
- `GET /api/admin/stores` — list stores with average rating and rating count; optional `name`, `email`, `address` substring filters. Sort with `sortBy=name|email|address|rating` and `order=asc|desc`.

Listings return `{ status, total, users|stores }`. Search filters match literal text (SQL wildcard characters are escaped); unsupported roles, sort fields, and invalid input are rejected.

The admin React area is available at `/admin`, `/admin/users`, `/admin/stores`, `/admin/users/add`, `/admin/stores/add`, and `/admin/users/:id`. Administrators can review platform totals and listings, search by name/email/address, filter users by role, and sort by selecting table headings (click again to reverse direction). User listings sort by name, email, address, or role; store listings sort by name, email, address, or rating. Administrators can also create accounts and stores, and inspect user details. Store-owner details show their average rating and assigned stores.

## Git and GitHub

Git is already initialized in a parent directory on this machine. No GitHub remote was provided, so this setup does not change that repository or publish any files. Add a project-specific GitHub remote when one is available.
