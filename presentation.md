marp: true

# CafeDog - Presentation s

---

# CafeDog

### A Social Platform for Coffee Lovers

CS5610 Web Development - Spring 2026

Jingjing Pan & Yingyi Kong

---

## 1. What is CafeDog?

CafeDog is a full-stack web application for discovering, reviewing, and sharing great coffee shops.

- **Discover** cafes near you with search, filters, and sorting
- **Review** your favorite spots with ratings and photos
- **Connect** with other coffee lovers through likes, saves, and comments
- **Contribute** by adding new cafes to the community

Live demo: https://cafedog.onrender.com

---

## 2. Tech Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| **Frontend** | React 19, React Router 7, Vite 8, CSS Modules |
| **Backend**  | Node.js, Express 5                            |
| **Database** | MongoDB (native driver, no ORM)               |
| **Auth**     | Passport Local, bcrypt, express-session       |
| **Storage**  | Cloudinary (image uploads)                    |
| **APIs**     | Google Places (cafe photos)                   |
| **Deploy**   | Render (single-origin, same server)           |

---

## 3. Database Design

**8 Collections:**

- `users` - email, username, passwordHash, createdAt
- `cafes` - name, address, wifi, quiet, cover_image, createdBy
- `posts` - cafeId, authorId, text, rating, photoUrl, createdAt
- `likes` - postId, userId (post likes)
- `cafeLikes` - cafeId, userId
- `cafeSaves` - cafeId, userId
- `comments` - postId, userId, text, createdAt
- `sessions` - managed by connect-mongo

---

## 4. Feature - Home Page & Discovery

### Cafe Discovery

- **Search**: Real-time search with 300ms debounce
- **Filters**: Toggle WiFi / Quiet tags
- **Sorting Tabs**:
  - Discover (default)
  - New Places (newest first)
  - Top Rated (by average review rating)
- **Pagination**: "Load More" button for infinite browsing
- **Add Cafe**: Floating action button to contribute new cafes

---

## 4. Feature - Home Page & Discovery

### Cafe Cards show:

- Cover image (Google Places or uploaded)
- Name, address
- Colored attribute pills (wifi, quiet)
- Rating badge, likes count

---

## 4. Feature - Cafe Detail Page

### Left Panel (Info)

- Cafe name with inline Like / Save buttons
- Address, WiFi/Quiet tags
- Stats row: posts count, average rating (half-star support), likes, saves
- Edit/Delete (owner only)

---

## 4. Feature - Cafe Detail Page

### Right Panel (Reviews)

- Review form with star rating selector + photo upload
- Paginated review feed
- Each review supports:
  - Edit / Delete (author only)
  - Like / Unlike
  - Comment thread (full CRUD)

---

## 4. Feature - Cafe Detail Page

### Dynamic Average Rating

- Computed from all user reviews using MongoDB aggregation
- Updates in real-time after creating/editing/deleting a review

---

## 4. Feature - User Profiles

### Profile Header

- Avatar (auto-generated from initials)
- Username, email, join date, bio
- Edit Profile button (own profile only)

---

## 4. Feature - User Profiles

### 5 Tabs with Pagination (8 items/page)

| Tab           | Content              | Visibility |
| ------------- | -------------------- | ---------- |
| Added Cafes   | Cafes user submitted | Public     |
| My Reviews    | User's reviews       | Public     |
| Liked Reviews | Reviews user liked   | Self only  |
| Liked Cafes   | Cafes user liked     | Self only  |
| Saved         | Cafes user saved     | Self only  |

- Review cards: list layout with cafe thumbnail, star rating, text preview
- Cafe cards: grid layout with cover image, address, tags

---

## 4. Feature - Authentication & Authorization

### Session-Based Auth

- Passport Local strategy with bcrypt password hashing
- Sessions stored in MongoDB via connect-mongo (7-day expiry)
- Secure cookies in production (httpOnly, sameSite, secure)

### Authorization Rules

- **Cafe edit/delete**: Owner only (createdBy check)
- **Review edit/delete**: Author only (authorId check)
- **Comment edit/delete**: Comment owner only
- **Like/Save**: Login required
- **Private data**: Liked/saved lists visible only to profile owner

---

## 4. Feature - Image Handling

### Two Image Sources

**1. Cloudinary Upload**

- User uploads photo via review form or cafe creation
- Server receives file with Multer (memory storage)
- Streams to Cloudinary, returns secure URL
- Supports JPEG, PNG, WebP (max 5MB)

---

## 4. Feature - Image Handling

**2. Google Places Photo Proxy**

- Cafe cover images from Google Places API
- Only photo reference stored in DB (not the full URL)
- Server proxies requests, keeping API key secure
- 24-hour cache headers for performance

### Smart Image Resolution

- `coverImageSrc()` helper detects source type
- Handles both Cloudinary URLs and Google Places references
- Graceful fallback to placeholder when no image available

---

## 5: API Design Summary

| Resource  | Endpoints | Key Operations                      |
| --------- | --------- | ----------------------------------- |
| Auth      | 5         | Register, Login, Logout, Me, Update |
| Cafes     | 11        | CRUD + Like/Unlike + Save/Unsave    |
| Posts     | 8         | CRUD + Like/Unlike + Pagination     |
| Comments  | 4         | Full CRUD                           |
| Uploads   | 1         | Image upload to Cloudinary          |
| Places    | 1         | Google Places photo proxy           |
| Users     | 1         | Public profile view                 |
| **Total** | **31**    |                                     |

All routes follow RESTful conventions with proper HTTP methods and status codes.

---

## 15: Demo & Summary

### What We Built

- A full-stack social platform for coffee shop discovery
- 31 API endpoints across 7 resource groups
- 8 MongoDB collections with aggregation pipelines
- 5 frontend pages with modular component architecture
- Complete auth system with session management
- Social features: likes, saves, comments, user profiles
- Image handling via Cloudinary + Google Places
- Responsive, modern UI with CSS Modules

### Try: https://cafedog.onrender.com

---
