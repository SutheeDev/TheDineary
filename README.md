# Dineary

![The Dineary](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698549/ReadMe-Images/Dineary/Home.png)

A personal restaurant diary app where users can log, manage, and organize their dining experiences.

## Table of Contents

- [Pages and Features](#pages-and-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Future Plans](#future-plans)
- [Acknowledgments](#acknowledgments)
- [Feedback](#feedback)

## Pages and Features

### Home Page

- Displays all restaurant entries with images, titles, and visit dates.
- Personalized greeting with the user's name.

### Create Entry Page

![Create Entry Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698477/ReadMe-Images/Dineary/Create_Entry.png)

- Input fields for restaurant name, review, cuisine, visit date, rating, and price range.
- Image upload stored via Cloudinary.
- Date picker limited to the present date or earlier.
- Star icons for rating (1-5) and dollar sign icons for price range.

### Restaurant Page

![Restaurant Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698510/ReadMe-Images/Dineary/Restaurant_Page.png)

- Full detail view for a single restaurant entry.
- Dropdown menu with Edit and Delete options.
- Delete confirmation prompt before permanently removing an entry.

### Update Entry Page

![Update Entry Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698545/ReadMe-Images/Dineary/Update_Entry.png)

- Pre-populated with existing data for easy editing.
- Replace image, modify any field, then save or cancel.

### Update Profile Page

![Profile Update Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698477/ReadMe-Images/Dineary/Profile_Update.png)

- Accessible from the navbar user icon.
- Update name, last name, and email. Changing the email un-confirms the address and sends a fresh confirmation link.
- Enable or disable two-factor authentication (TOTP): scan a QR code with an authenticator app and confirm a 6-digit code to turn it on.

### Email Confirmation

- New password accounts are emailed a single-use confirmation link that expires after 24 hours.
- Until it is clicked the app works normally, with a banner across the top carrying a "Resend email" button.
- Accounts created with "Sign in with Google" are already confirmed and never see the banner.

### Error 404 Page

- Shown for any unrecognized route.
- Includes a Home button to return to the main page.

## Tech Stack

**Frontend** -- React 18, Vite, React Router v7, styled-components, react-datepicker, react-icons, Axios, qrcode.react (2FA QR code)

**Backend** -- Node.js, Express, MongoDB (Mongoose), ES Modules (`.mjs` throughout), JWT + bcryptjs (auth), otplib (TOTP 2FA)

**External Services** -- MongoDB Atlas (database), Cloudinary (image storage), Render (deployment)

## Getting Started

### Prerequisites

- Node.js (v18+)
- A MongoDB Atlas cluster
- A Cloudinary account

### Installation

```sh
git clone https://github.com/SutheeDev/Dineary.git
cd Dineary
npm install
cd Backend && npm install
cd ../Frontend && npm install
```

### Environment Variables

**Backend** -- create `Backend/.env`:

```
PORT=5000
MONGO_URI=your-mongodb-connection-string
NODE_ENV=development
JWT_SECRET=your-jwt-signing-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

`CLIENT_URL` is the address of the frontend the backend allows requests from (CORS). Set it to your deployed frontend URL in production. The three `CLOUDINARY_*` values are the server-side credentials used to upload images; they must stay on the backend and never appear in `Frontend/.env`.

**Frontend** -- create `Frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

`VITE_API_URL` is the address of the backend the frontend talks to. Set it to your deployed backend URL in production.

## Running the App

**Both together (recommended):**

```sh
# from the repo root
npm run dev
```

**Backend only:**

```sh
cd Backend
npm start
```

**Frontend only:**

```sh
cd Frontend
npm run dev       # dev server (localhost:5173)
npm run build     # production build
npm run lint      # ESLint
```

## API Routes

All protected routes identify the user from the httpOnly session cookie, so the user id never appears in the URL.

### Auth

- `POST /api/auth/register` -- create an account, sets the session cookie
- `POST /api/auth/login` -- log in; if 2FA is enabled, returns `{ mfaRequired: true }` and sets a short-lived `mfa_pending` cookie instead of the session cookie
- `POST /api/auth/google` -- sign in with a Google ID token; creates or links an account
- `POST /api/auth/forgot-password` -- email a single-use password reset link (1-hour expiry)
- `POST /api/auth/reset-password` -- exchange the emailed token for a new password
- `POST /api/auth/verify-email` -- exchange the emailed token to confirm the address (24-hour expiry)
- `POST /api/auth/resend-verification` -- (protected) send a fresh confirmation link
- `POST /api/auth/totp/verify` -- complete login by verifying the 6-digit code (uses the `mfa_pending` cookie)
- `POST /api/auth/totp/setup` -- (protected) start 2FA setup, returns an `otpauth://` URL for the QR code
- `POST /api/auth/totp/verify-setup` -- (protected) verify the first code and enable 2FA
- `POST /api/auth/totp/disable` -- (protected) disable 2FA
- `POST /api/auth/logout` -- clear the session cookie
- `GET /api/auth/me` -- (protected) get the logged-in user

### User

- `GET /api/user` -- (protected) get user details
- `PATCH /api/user` -- (protected) update user details

### Restaurants

All restaurant routes are protected.

- `POST /api/restaurants` -- create a restaurant entry
- `GET /api/restaurants` -- get all entries for the logged-in user
- `GET /api/restaurants/:id` -- get a single entry
- `PATCH /api/restaurants/:id` -- update an entry
- `DELETE /api/restaurants/:id` -- delete an entry

## Database Schema

### User

| Field      | Type   | Rules                        |
|------------|--------|------------------------------|
| `name`     | String | required, 2-20 chars, trimmed |
| `lastname` | String | max 20 chars, trimmed        |
| `email`    | String | required, unique             |
| `password` | String | required, min 6 chars        |
| `totpSecret`  | String  | optional, set during 2FA setup (never returned to the client) |
| `totpEnabled` | Boolean | defaults to `false`          |
| `isVerified`  | Boolean | defaults to `false`; `true` for Google accounts on creation |

### Restaurant

| Field        | Type   | Rules                                        |
|--------------|--------|----------------------------------------------|
| `name`       | String | required, trimmed                            |
| `cuisine`    | String | optional                                     |
| `visitDate`  | Date   | required                                     |
| `rating`     | Number | required, 1-5                                |
| `review`     | String | optional                                     |
| `priceRange` | String | enum: `""`, `"$"`, `"$$"`, `"$$$"`, `"$$$$"` |
| `image`      | String | defaults to placeholder                      |
| `userId`     | Ref    | references User                              |

## Error Handling

| Status | Meaning               |
|--------|-----------------------|
| 400    | Bad request           |
| 404    | Not found             |
| 500    | Internal server error |

## Future Plans

- Calendar and list views for entries
- Multiple image uploads with carousel display
- Additional user profile options

## Acknowledgments

- [Unsplash](https://unsplash.com/) for food and restaurant images.
- [React Icons](https://react-icons.github.io/react-icons/) for UI icons.

## Feedback

Suggestions and collaboration are welcome. Reach out on [GitHub](https://github.com/SutheeDev).
