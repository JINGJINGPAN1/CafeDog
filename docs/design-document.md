# CaféDog – Design Document

## 1. Project Description

**CaféDog** is a coffee shop discovery and check‑in platform. Users can browse cafés, filter for work-friendly spots (e.g., **good WiFi** / **quiet**), and publish **photo-based posts** (reviews) with ratings. Social features like **likes** and **comments** make it easy to engage with other users and revisit favorite places.

Unlike map-first tools that focus on navigation, CaféDog centers on a lightweight “**discover → visit → post → interact**” loop. The goal is to help users quickly find cafés that match their mood (study, hangout, quick espresso), and to capture and share experiences in a simple feed-style format.

### Core Features

| Feature                         | Description                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Café Discovery**              | Browse a paginated list of cafés with search by name/address, filters (WiFi / quiet), and tabs (**Discover / Nearby / New places / Top rated**).                            |
| **Nearby (Geo)**                | Use browser Geolocation to request “Nearby” cafés; backend uses MongoDB `2dsphere` + `$nearSphere` to rank results by distance.                                              |
| **Recommend a café**            | Logged-in users can recommend a café using **Google Places Autocomplete** (address dropdown); the app stores `lat/lng` + optional cover image.                               |
| **Café Detail Page**            | View café info plus aggregated engagement (**likes/saves**) and rating summary (average rating + rating count computed from posts).                                           |
| **Posts (Reviews)**             | Create/edit/delete posts linked to a café with text, rating, and optional photo; per-café feed is paginated and sorted newest-first.                                          |
| **One review per user per café**| Enforced at DB level with a unique compound index on `(authorId, cafeId)`; creating a duplicate returns `409` and the UI guides the user to edit their existing review.       |
| **Social Interactions**         | Like/unlike posts; comment CRUD (create/edit/delete) on posts; like/save cafés.                                                                                              |
| **Auth & Profiles**             | Session-based login (email + password), registration, logout; profile page shows user posts and cafés, plus personal tabs for liked/saved items (only visible to the owner). |
| **Image Handling**              | Upload images to Cloudinary; support Google Places photo references via a backend proxy route so keys never reach the client.                                                |

### Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (native driver)
- **Auth**: `express-session` + `connect-mongo` session store + Passport Local (email/password)
- **Uploads**: Multer (memory storage) → Cloudinary
- **Places**: Google Places (New) for seeding + frontend Autocomplete; photo proxy endpoint (`/api/places/photo`)
- **Frontend**: React (hooks) + React Router + Vite
- **Styling**: CSS modules + component CSS

---

## 2. User Personas

### Persona 1: Mina – The Student Who Studies in Cafés

**Age**: 21  
**Occupation**: College Student  
**Tech Savviness**: High

**Goals**: Find cafés with reliable WiFi and a quiet environment for studying, and keep a short list of go-to spots.

**Pain Points**:

- Hard to know which cafés are actually work-friendly
- Doesn’t want to dig through long reviews on multiple platforms
- Wants to save places for later without making a complex list

**How CaféDog Helps**: Mina filters for **WiFi** and **quiet**, browses “Top rated,” and saves cafés she likes. After a good study session, she posts a quick review with a photo.

---

### Persona 2: Jay – The Weekend Explorer

**Age**: 28  
**Occupation**: Designer  
**Tech Savviness**: Medium–High

**Goals**: Discover new cafés with great vibes and share recommendations with friends.

**Pain Points**:

- “Best café” lists are often outdated or too general
- Wants to see real photos and short impressions, not essays
- Enjoys interacting with posts but doesn’t want heavy social complexity

**How CaféDog Helps**: Jay browses “New places,” likes posts that look interesting, and comments to ask about seating, noise, or drinks. He adds new cafés and uploads cover photos.

---

### Persona 3: Priya – The Café Owner / Community Builder

**Age**: 34  
**Occupation**: Small business owner  
**Tech Savviness**: Medium

**Goals**: Make sure her café is discoverable and represented accurately, and engage with community posts.

**Pain Points**:

- Listing information can be incomplete or wrong
- Wants a simple way to keep the café page current
- Prefers lightweight, authentic community content over marketing-heavy channels

**How CaféDog Helps**: Priya (or a staff member) can create and edit café entries they own, add a cover image, and encourage visitors to post reviews and photos.

---

## 3. User Stories

User stories are written in narrative form: _As a [role], I want to [action], so that [benefit]._

### Café Discovery & Browsing

**Story 1: Browsing cafés**  
_As a user, I want to browse a list of cafés, so that I can quickly discover places nearby or worth visiting._

- User opens the home page and sees café cards (cover image, name, rating, likes count).
- The list is paginated; user can load more cafés.

**Story 2: Searching and filtering**  
_As a student, I want to search by café name and filter for WiFi/quiet, so that I can find a study-friendly spot._

- User types into the search input; results update with debounce.
- User toggles **WiFi** and/or **Quiet** filters.
- User switches tabs (**Discover / Nearby / New places / Top rated**) to change sort order or switch into distance-based browsing.

**Story 2b: Nearby browsing**  
_As a user, I want to browse cafés near my current location, so that I can quickly find a place around me._

- User clicks **Nearby**; the browser prompts for location permission.
- If permission is granted, cafés are sorted by distance (within a configurable radius on the backend).
- If permission is denied, the app shows a helpful error and keeps the user on the current tab.

---

### Café Management

**Story 3: Adding a café**  
_As a logged-in user, I want to add a new café with a cover photo, so that I can share a new place with the community._

- User opens the “Recommend a cafe” form.
- User selects an address from **Google Places Autocomplete** suggestions (the app records `lat/lng` + `placeId`).
- User enters/adjusts name and selects attributes (WiFi, quiet, rating).
- User optionally uploads a cover image (stored in Cloudinary).
- On submit, the café is created and appears in the list.

**Story 4: Editing or deleting a café I created**  
_As a café creator, I want to edit or delete my café entry, so that the listing stays accurate._

- On the café detail page, the owner sees edit/delete actions.
- Editing updates fields and optionally replaces the cover image.
- Deleting cascades: café is removed along with its posts and related likes/comments/saves.

---

### Posts (Reviews)

**Story 5: Posting a review with rating and photo**  
_As a visitor, I want to create a post on a café page, so that I can record my experience and help others._

- On the café detail page, user opens the review form.
- User writes text, sets a rating (1–5), optionally uploads a photo.
- On submit, the post is created and appears at the top of the feed.

**Story 5b: Preventing duplicate reviews**  
_As a user, I want the app to prevent me from accidentally posting multiple reviews for the same café, so that my review history stays clean._

- If the user already reviewed the café, creating another review returns a `409`.
- The UI shows an inline “edit” entry point to update the existing review instead of creating a duplicate.

**Story 6: Editing or deleting my post**  
_As a user, I want to update or remove my post, so that I can correct mistakes or remove content._

- If the post belongs to the current user, edit/delete actions are available.
- Updates modify text/photo/rating and store `updatedAt`.

---

### Social Interactions

**Story 7: Liking a post**  
_As a user, I want to like posts I enjoy, so that I can support creators and revisit content._

- User clicks Like; the like count updates immediately.
- User can unlike to remove their reaction.

**Story 8: Commenting on a post**  
_As a user, I want to comment on a post and edit/delete my own comments, so that I can ask questions and interact._

- User writes a comment; it appears under the post.
- User can edit or delete their own comments.

**Story 9: Liking and saving cafés**  
_As a user, I want to like and save cafés, so that I can build a personal list of favorites._

- Café detail page shows Like and Save states.
- Saved cafés and liked cafés appear in the user’s own profile tabs.

---

### Auth & Profiles

**Story 10: Registering and logging in**  
_As a new user, I want to register and log in, so that I can post, like, and save._

- User registers with email, username, and password.
- After registration, user is automatically logged in (session cookie).
- User can log out to clear the session.

**Story 11: Viewing a profile**  
_As a user, I want to view my profile and other users’ profiles, so that I can see their posts and cafés._

- Profile page shows basic user info and their created posts/cafés.
- Only when viewing my own profile: show liked posts, liked cafés, and saved cafés.

---

## 4. Design Mockups

### 4.1 Home Page (Café Discovery)

```
┌──────────────────────────────────────────────────────────────────┐
│  CaféDog                              [Login] [Register] [👤]  │
├──────────────────────────────────────────────────────────────────┤
│  [ Search cafés…________________ ]  [☐ WiFi] [☐ Quiet]           │
│                                                                  │
│  Tabs:  [Discover] [Nearby] [New places] [Top rated]             │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  [cover img]  │  │  [cover img]  │  │  [cover img]  │        │
│  │  Cafe A       │  │  Cafe B       │  │  Cafe C       │        │
│  │  ★ 4.6   ♥ 12 │  │  ★ 4.2   ♥  8 │  │  ★ 4.9   ♥ 33 │        │
│  │  Wifi • Quiet │  │  Wifi         │  │        Quiet  │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
│                         [Load more]                              │
│                                                                  │
│                       [Recommend a cafe]                          │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Café Detail Page (Info + Posts)

```
┌──────────────────────────────────────────────────────────────────┐
│  < Back                         CaféDog                          │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ [cover image]                                               │  │
│  │ Cafe Name                         ★ 4.5                     │  │
│  │ 123 Main St                        ♥ 25   🔖 12              │  │
│  │ Tags: WiFi • Quiet                                         │  │
│  │ Actions:  [Like/Unlike] [Save/Unsave]  (Owner: [Edit] [Del])│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Posts                                                           │
│  [Write a post]  rating: ★★★★★  [upload photo]  [Submit]         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ @username  ★ 5   [Like · 8]   [Comments · 2]                │  │
│  │ "Great espresso and cozy seating..."                        │  │
│  │ [photo]                                                     │  │
│  │  - comment list...                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│                         [Load more posts]                        │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Auth Pages (Login / Register)

```
┌──────────────────────────────────────────────────────────────────┐
│  CaféDog                                                      │
├──────────────────────────────────────────────────────────────────┤
│  Login                                                          │
│  Email:    [________________________]                            │
│  Password: [________________________]                            │
│  [Log in]                                                       │
│                                                                  │
│  Register                                                       │
│  Email:    [________________________]                            │
│  Username: [________________________]                            │
│  Password: [________________________]                            │
│  [Create account]                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Profile Page (Public + Private Tabs)

```
┌──────────────────────────────────────────────────────────────────┐
│  CaféDog                           Profile                       │
├──────────────────────────────────────────────────────────────────┤
│  @username (email)                                               │
│  [Edit profile] (only if self)                                   │
│                                                                  │
│  Tabs: [Posts] [Cafes] (Self only: [Liked posts] [Liked cafes] [Saved]) │
│                                                                  │
│  - Post cards / cafe cards grid                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Design Principles

1. **Fast discovery** – Primary UX focuses on searching, filtering, and scanning cards quickly.
2. **Low-friction posting** – Posting a review should be short: text + rating + optional photo.
3. **Clear ownership** – Only creators can edit/delete their cafés and posts; UI makes this obvious.
4. **Meaningful engagement** – Likes/saves/comments are lightweight signals, not a complex social graph.
5. **Privacy by default** – Personal tabs (liked/saved) are only shown on the user’s own profile.
6. **Accessibility & responsiveness** – Mobile-friendly layout and keyboard-friendly forms.

---

## 6. Technical Architecture Summary

- **Backend**: Express.js JSON API under `/api/*`, with session cookies and Passport Local authentication.
- **Database**: MongoDB database `cafedog` with collections:
  - `users`: `{ email, username, passwordHash, createdAt }`
  - `cafes`: `{ name, address, has_good_wifi, is_quiet, rating, cover_image, createdBy, placeId?, googlePlaceId?, location: { type:'Point', coordinates:[lng,lat] } }`
  - `posts`: `{ cafeId, authorId?, author, text, photoUrl, rating, createdAt, updatedAt? }` with a **unique partial index** on `(authorId, cafeId)` (only when `authorId` is present)
  - `likes`: `{ postId, userId, createdAt }`
  - `comments`: `{ postId, userId, text, createdAt, updatedAt }`
  - `cafeLikes`: `{ cafeId, userId, createdAt }`
  - `cafeSaves`: `{ cafeId, userId, createdAt }`
  - `sessions`: session store used by `connect-mongo`
- **Frontend**: React + React Router; API calls via `fetch` with `credentials: 'include'` so the session cookie is sent.
- **Uploads**: `/api/uploads/image` uses Multer memory storage and uploads to Cloudinary (jpeg/png/webp, max 5MB).
- **Places**: `/api/places/photo?ref=...` proxies Google Places photo bytes to the client without exposing the API key. The “Recommend a cafe” form uses Google Places Autocomplete on the client to obtain `placeId` + `lat/lng`.
- **Geo**: `cafes.location` has a MongoDB `2dsphere` index; `/api/cafes?nearby=true&lat=...&lng=...` returns distance-ranked results.
- **Production hosting**: Backend serves the built React app from `frontend/dist` (same-origin), and routes non-`/api` paths to `index.html`.
- **Data flow**: User action → React hook → `apiFetch` → Express route → MongoDB → JSON response → state update → UI render.
