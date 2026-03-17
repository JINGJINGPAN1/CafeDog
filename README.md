# CaféDog

## Author

- Yingyi Kong
- Jingjing Pan

## Class link

- Add your course link here.

## Project objective

CaféDog is a coffee shop discovery and check-in platform. Users can browse cafés, publish photo-based posts with ratings, and interact via likes and comments.

## Screenshot

- Add a screenshot of the deployed app here.

## Tech stack

- Backend: Node.js + Express + MongoDB (native driver)
- Frontend: React (hooks) + Vite (client-side rendering)
- Auth: Session-based email login

## Requirements / notes

- No prohibited libraries used (no `axios`, `mongoose`, or `cors` package).
- Secrets are stored in `.env` and not committed.

## Environment variables

Create a `.env` file in the project root:

```bash
MONGODB_URI="your_mongodb_connection_string"
SESSION_SECRET="a_long_random_secret"
```

## Install

Backend (root):

```bash
npm install
```

Frontend:

```bash
cd frontend
npm install
```

## Run locally (development)

Start backend:

```bash
npm start
```

Start frontend (Vite dev server):

```bash
cd frontend
npm run dev
```

Frontend uses a Vite proxy so API calls go to `/api/*` while developing.

## Build & run (same-origin production)

Build the frontend:

```bash
npm run build
```

Run the server (serves `frontend/dist`):

```bash
npm start
```

## Seed synthetic data (1k+ records)

This inserts up to 1000 posts (and creates cafés/users if missing):

```bash
npm run seed
```

To drop and recreate seed collections:

```bash
npm run seed -- --drop
```

## Deployed URL

- Add your deployed URL here.
