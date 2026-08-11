# The Dineary (Backend)

The Express/MongoDB API behind [The Dineary](https://dineary.onrender.com), a personal
restaurant diary. This folder is one half of a monorepo; the React client lives in
`../Frontend`. In production a single Node process serves both this API and the built
client from one origin.

Start at the root [`README.md`](../README.md) for the project overview, the full feature
list, and setup instructions. This file covers backend specifics only.

<br>

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#env)
- [Running the Server](#running)
- [Tests](#tests)
- [API Routes](#api)
- [Database Schema Overview](#schema)
- [Error Handling & Status Codes](#error)
- [Technologies](#technologies)
- [Feedback](#feedback)

<br>

## Installation <a name="installation"></a>

```sh
git clone https://github.com/SutheeDev/TheDineary.git
cd TheDineary
npm install
cd Backend && npm install
```

<br>

## Environment Variables <a name="env"></a>

Create a `.env` file in this folder:

```sh
PORT=5000
NODE_ENV=development
MONGO_URI=your-mongodb-connection-string
CLIENT_URL=http://localhost:5173

JWT_SECRET=a-long-random-string
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

GOOGLE_CLIENT_ID=your-web-oauth-client-id

RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
```

Notes:

- `CLIENT_URL` is both the allowed CORS origin and the base of every emailed link, so a
  wrong value sends password reset and confirmation links to the wrong environment.
- `RESEND_API_KEY` may be left blank. With no key, emails are printed to the terminal
  instead of being sent, which is how the tests and CI run. With the free
  `onboarding@resend.dev` sender, Resend will only deliver to the address that owns the
  Resend account.
- Do not set `PORT` on Render; it injects its own.

<br>

## Running the Server <a name="running"></a>

```sh
npm start            # node --watch server.mjs
```

Or run the API and client together from the repo root with `npm run dev`.

<br>

## Tests <a name="tests"></a>

```sh
npm test             # vitest run
```

57 tests covering auth and restaurants. They run against a throwaway
`mongodb-memory-server`, so they never touch the real database and need no external
service. GitHub Actions runs them plus a frontend build on every push and pull request.

Project rule: every new test is mutation tested. Reintroduce the bug it claims to catch,
confirm the test fails, then restore. A test that has never failed has not been shown to
test anything.

<br>

## API Routes <a name="api"></a>

Every protected route identifies the user from the httpOnly session cookie, so no user id
ever appears in a URL. Routes marked "protected" require that cookie.

### Auth (`/api/auth`)

- `POST /register` - create an account, sets the session cookie, emails a confirmation link
- `POST /login` - log in; if 2FA is on, returns `{ mfaRequired: true }` and sets a
  short-lived `mfa_pending` cookie instead of the session cookie
- `POST /google` - sign in with a Google ID token; creates or links an account
- `POST /forgot-password` - email a single-use password reset link (1-hour expiry)
- `POST /reset-password` - exchange that token for a new password
- `POST /verify-email` - exchange the emailed token to confirm the address (24-hour expiry)
- `POST /resend-verification` - (protected) send a fresh confirmation link
- `POST /totp/verify` - complete login with the 6-digit code (uses the `mfa_pending` cookie)
- `POST /totp/setup` - (protected) start 2FA setup, returns an `otpauth://` URL
- `POST /totp/verify-setup` - (protected) verify the first code and enable 2FA
- `POST /totp/disable` - (protected) disable 2FA
- `POST /logout` - clear the session cookie
- `GET /me` - (protected) get the logged-in user

Everything except `/totp/setup`, `/totp/verify-setup`, `/totp/disable`, `/logout`, and
`/me` sits behind a rate limiter of 10 requests per 15 minutes per IP.

### User (`/api/user`)

All protected.

- `GET /` - get the logged-in user
- `PATCH /` - update `name`, `lastname`, `email`, `homeLocation`. Any other field in the
  body is ignored. Changing the email clears `isVerified` and sends a fresh confirmation
  link.

### Restaurants (`/api/restaurants`)

All protected, and every query is scoped to the logged-in user.

- `POST /` - create an entry
- `GET /` - list entries, with `search`, `cuisine`, `priceRange`, `category`, `sort`, and
  `order` query params
- `GET /:id` - get one entry
- `PATCH /:id` - update an entry
- `DELETE /:id` - delete an entry and its Cloudinary images
- `POST /upload` - upload up to 20 images (field name `images`, 5MB each, images only)

<br>

## Database Schema Overview <a name="schema"></a>

MongoDB with Mongoose. Summary only; see `models/` for the full definitions.

### User Schema

- `name` (String, required, 2-20 chars, trimmed)
- `lastname` (String, max 20 chars, trimmed)
- `email` (String, required, unique)
- `password` (String, min 6 chars, `select: false`, required only when there is no
  `googleId`; hashed by a `pre("save")` hook, never in a controller)
- `googleId` (String, unique, sparse)
- `totpSecret` / `totpEnabled` (optional 2FA)
- `resetPasswordToken` / `resetPasswordExpires` (`select: false`)
- `isVerified` (Boolean, defaults to false; true on creation for Google accounts)
- `verifyEmailToken` / `verifyEmailExpires` (`select: false`)
- `homeLocation` (optional object, the map's fallback starting point)

Only the SHA-256 hash of an emailed token is ever stored, so a leaked database cannot be
replayed to reset or confirm someone's account.

### Restaurant Schema

- `name` (String, required, trimmed)
- `cuisine` (String, optional)
- `category` (String, optional, fixed enum of place types)
- `visitDate` (Date, optional; falls back to `createdAt`)
- `ratings` (object of `food`, `service`, `ambience`, `value`; each required, 0.5 to 5 in
  half-star steps)
- `finalScore` (Number, the average of those four, computed server-side and never accepted
  from the client)
- `notes` (optional per-category notes) and `review` (String, optional)
- `dishes` (array of `{ name, note }`)
- `images` (ordered array of `{ url, publicId, caption }`; `images[0]` is the cover)
- `priceRange` (String, enum: "", "$", "$$", "$$$", "$$$$")
- `location` (optional object incl. `placeId`, lat/lng, city/state/country)
- `google` (optional read-only block from Google Places: hours, website, price range,
  amenity attributes; preserved across edits because the client never sends it)
- `userId` (reference to User)

<br>

## Error Handling & Status Codes <a name="error"></a>

Controllers throw typed errors from `errors/customErrors.mjs`, each carrying a
`statusCode`, and pass them to `next(err)`. The centralized handler in
`middleware/errorHandlerMiddleware.mjs` reads that and returns `{ msg }`.

- `400` `BadRequestError` - also what every failed `express-validator` rule becomes
- `401` `UnauthorizedError`
- `403` `ForbiddenError`
- `404` `NotFoundError`
- `500` `ServerError`

<br>

## Technologies Used <a name="technologies"></a>

- Node.js and Express (ES Modules, `.mjs` throughout, no CommonJS)
- MongoDB / Mongoose
- `jsonwebtoken` and `cookie-parser` (httpOnly session cookie), `bcryptjs` (hashing)
- `otplib` (TOTP 2FA), `google-auth-library` (verifies Google ID tokens)
- `resend` (password reset and confirmation emails)
- `express-validator` (request validation), `helmet` and `express-rate-limit` (hardening)
- `multer` and `cloudinary` (image upload proxied through this API, so no Cloudinary
  credential reaches the browser)
- `morgan` (request logging), `cors`, `dotenv`
- Vitest, Supertest, and `mongodb-memory-server` for tests
- Deployed on [Render](https://render.com)

<br>

## Feedback <a name="feedback"></a>

Feedback to improve this project is welcome. If you have any suggestions or would like to
collaborate, please get in touch with me on [GitHub](https://github.com/SutheeDev). Thanks!
