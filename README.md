# Velvet Brew

Cafe ordering and point-of-sale app. Customers order from a table, the kitchen tracks tickets, and staff run the register. The API stores data in Supabase and pushes live updates with Socket.io.

## Setup

1. Install dependencies from the repo root, then in each package:

   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Create local env files (these stay untracked):

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   On Windows PowerShell: `Copy-Item backend/.env.example backend/.env` and the same for `frontend`.

3. Fill in the values. The API will not start without `SUPABASE_URL` and `SUPABASE_KEY`. The frontend throws on load without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4. Apply the SQL in `backend/` to the Supabase database: `schema.sql`, then the `phase*.sql` scripts in numeric order (`phase5` through `phase10`; `phase9_prep_type.sql` before `phase9_station_routing.sql`). `fix_permissions.sql` grants API access on `stations` and `order_items`.

5. Start both apps from the repo root:

   ```bash
   npm run dev
   ```

   The API listens on port 3000. The Vite dev server listens on port 5173.

## Environment variables

Backend (`backend/.env`, read with `dotenv` when the process starts in that directory):

| Variable | Required | Used for |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Supabase project URL. Startup throws if missing. |
| `SUPABASE_KEY` | yes | Service-role key. Startup throws if missing. Server only. |
| `PORT` | no | HTTP port. Defaults to `3000`. |
| `RAZORPAY_KEY_ID` | for payments | Checkout order route. The route errors if this or the secret is missing. |
| `RAZORPAY_KEY_SECRET` | for payments | Checkout order route. Never send this to the browser. |

Frontend (`frontend/.env`, inlined by Vite as `import.meta.env`):

| Variable | Required | Used for |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | Browser Supabase client. Startup throws if missing. |
| `VITE_SUPABASE_ANON_KEY` | yes | Anon key for the browser client. Startup throws if missing. |
| `VITE_API_URL` | no | API and Socket.io origin. Defaults to `http://localhost:3000` and logs a warning when unset. |

## Scripts

Root:

| Script | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the Vite dev server together. |
| `npm run start:backend` | `npm run dev` in `backend` (nodemon). |
| `npm run start:frontend` | Vite on port 5173. |

Backend:

| Script | What it does |
| --- | --- |
| `npm start` | `node index.js`. |
| `npm run dev` | `nodemon index.js`. |
| `npm run lint` | ESLint. |
| `npm run format` | Prettier on `*.js`. |

One-off scripts, run from `backend/` with `node` (they are not npm scripts): `seed.js` inserts menu rows through the Supabase client, `seed-api.js` posts the same menu to a running API, `run-seed-history.js` posts sample orders to a running API, `create-admin.js` signs up a staff user.

Frontend:

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server, exposed on the LAN (`--host`). |
| `npm run build` | Production build into `frontend/dist`. |
| `npm run preview` | Serves the production build. |
| `npm run lint` | ESLint. |
| `npm run format` | Prettier on the frontend source. |

## Folder map

```
.
├── package.json          # runs backend and frontend together
├── backend/
│   ├── index.js          # Express API, Socket.io, Razorpay, image upload
│   ├── supabase.js       # server Supabase client (requires env)
│   ├── schema.sql        # base database script
│   ├── phase*.sql        # later database scripts
│   ├── seed.js           # menu seed
│   ├── create-admin.js   # staff auth user
│   └── uploads/          # uploaded images (gitignored, served at /uploads)
└── frontend/
    ├── index.html
    ├── vite.config.js    # React, Tailwind, PWA
    └── src/
        ├── main.jsx
        ├── App.jsx       # routes
        ├── supabase.js   # browser Supabase client (requires env)
        ├── services/     # REST client and Socket.io
        ├── context/      # cart state
        ├── components/   # shared UI and route guard
        └── pages/
            ├── customer/ # menu, cart, tab, pay, loyalty
            ├── admin/    # login, POS, orders, menu, inventory
            ├── kds/      # kitchen display
            └── station/  # station board
```
