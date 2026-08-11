# The Dineary (Frontend)

![The Dineary](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698549/ReadMe-Images/Dineary/Home.png)
<br><br>

The React client for [The Dineary](https://dineary.onrender.com), a personal restaurant
diary. This folder is one half of a monorepo; the Express API lives in `../Backend`. In
production the built output here is served by that same Node process from one origin.

Start at the root [`README.md`](../README.md) for the project overview and setup. This
file covers the client only.

<br>

## Table of Contents

- [Design Philosophy](#design)
- [Running It](#running)
- [Environment Variables](#env)
- [Pages & Features](#pages)
- [Technologies Used](#technologies)
- [Acknowledgments](#acknowledgments)
- [Feedback](#feedback)

<br>

## Design Philosophy <a name="design"></a>

- **Simple and Intuitive**: A clean and minimalistic design for ease of use.
- **Subtle Animations**: Smooth transitions on icons, cards, and buttons.
- **One state container**: All shared state lives in `App.jsx` behind a `useGlobalContext`
  hook. There is no external state library.
- **Styles next to their component**: Every page and component defines its
  styled-components block at the bottom of its own file. Global CSS custom properties live
  in `src/index.css`.

<br>

## Running It <a name="running"></a>

```sh
npm install
npm run dev          # Vite dev server on localhost:5173
npm run build        # production build into dist/
npm run lint         # ESLint
```

Or run the client and API together from the repo root with `npm run dev`.

<br>

## Environment Variables <a name="env"></a>

Create a `.env` file in this folder:

```sh
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-web-oauth-client-id
VITE_GOOGLE_MAPS_API_KEY=your-places-api-key
```

Notes:

- In production `VITE_API_URL` is just `/api`, because the client is served from the same
  origin as the API.
- `VITE_*` values are baked into the bundle at build time, so changing one needs a rebuild.
- If `VITE_GOOGLE_MAPS_API_KEY` is blank the Places search box simply does not render and
  manual entry still works.
- No Cloudinary credentials belong here. Image uploads go through the authenticated
  backend.

<br>

## Pages & Features <a name="pages"></a>

### Sign In, Register, and Account Recovery

- Email and password, or "Sign in with Google".
- Optional two-factor authentication (TOTP): a second step at login asking for a 6-digit
  code. Google sign-in skips it.
- "Forgot password" emails a single-use reset link.
- New password accounts are emailed a confirmation link. Until it is clicked the app works
  normally and shows a banner with a "Resend email" button.

### Home Page

- All entries as cards or as a list, toggled and remembered between visits.
- Search, filter by cuisine, price, and place category, and sort. These are server-side,
  so the list stays fast as it grows.
- Each card shows the cover photo, final score, cuisine icon, price, category, and area.

### Create and Update Entry Pages

![Create Entry Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698477/ReadMe-Images/Dineary/Create_Entry.png)

- **Google Places search**: pick a restaurant and its name, cuisine, price, address, and
  coordinates fill themselves in. Everything stays editable.
- **Ratings**: four categories (Food, Service, Ambience, Value) on a half-star scale from
  0.5 to 5, averaged into a final score. Each can carry its own note.
- **Dishes**: a repeating list of what you ate, each an optional name plus note.
- **Photos**: upload several at once, reorder them, caption them, and choose the cover.
  Uploads go through the backend, so no Cloudinary secret reaches the browser.
- **Date Picker** via `react-datepicker`. The visit date is optional; entries without one
  fall back to the date they were added.
- Price range uses dollar-sign icons, the same widget as the star rating.

### Restaurant Page

![Restaurant Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698510/ReadMe-Images/Dineary/Restaurant_Page.png)

- Photo carousel with captions, the final score plus each category, notes, dishes, and the
  review.
- Read-only Google data when the entry came from Places search: opening hours, website,
  per-person price range, and amenity chips.
- Kebab menu with **Edit** and **Delete**, with a confirmation before anything is removed.

### Map, Ranking, Calendar, and Dashboard

- **Map** (`/map`): every entry as a pin on a Leaflet map, plus a search box for adding a
  new place from the map. Opens on your live location, falling back to a saved home
  address.
- **Ranking** (`/ranking`): a numbered leaderboard with filters, a "top N" cap, and a
  share-to-clipboard button.
- **Calendar** (`/calendar`): a month grid of when you went where.
- **Dashboard** (`/dashboard`): totals, category averages, top cuisines, and price mix.

### Update Profile Page

![Profile Update Page](https://res.cloudinary.com/dnc7potxo/image/upload/v1738698477/ReadMe-Images/Dineary/Profile_Update.png)

- Update name, last name, and email. Changing the email asks you to confirm the new
  address.
- Save a home address, used as the map's starting point when the browser cannot resolve a
  live location.
- Turn two-factor authentication on or off by scanning a QR code and confirming a code.

### Error 404 Page

- Shown for any unrecognized route, with a button back to Home.

<br>

## Technologies Used <a name="technologies"></a>

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: styled-components
- **Routing**: React Router v7
- **HTTP**: Axios, through a single configured client in `src/utils/apiClient.jsx`
- **Maps**: Leaflet and React-Leaflet, with Carto tiles
- **Google**: `@react-oauth/google` (sign-in), `@googlemaps/js-api-loader` (Places
  autocomplete)
- **2FA QR codes**: `qrcode.react`
- **Date Selection**: `react-datepicker`
- **Icons**: React-icons
- **Deployed on**: [Render](https://render.com)

<br>

## Acknowledgments <a name="acknowledgments"></a>

Special thanks to:

- [Unsplash](https://unsplash.com/) for food and restaurant images used in this project.
- [React-icons](https://react-icons.github.io/react-icons/search/#q=upload) for various UI
  elements.

<br>

## Feedback <a name="feedback"></a>

Feedback to improve this project is welcome. If you have any suggestions or would like to
collaborate, please get in touch with me on [GitHub](https://github.com/SutheeDev). Thanks!
