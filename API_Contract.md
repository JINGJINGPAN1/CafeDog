# GET /api/cafes

`[
  {
  "_id": "60d5ec9af682...",
  "name": "Blue Bottle Coffee",
  "address": "123 University Ave",
  "has_good_wifi": true,
  "is_quiet": false,
  "rating": 4.5,   // <-- 新增的字段
  "cover_image": "https://..."
  }
]`

# GET /api/cafes/:id/posts

or

# GET /api/posts?cafeId=xxx

`[
  {
    "_id": "71e6fd8bg793hce40b2c976c",
    "cafeId": "60d5ec9af682fbd39a1b865b",
    "author": "CoffeeLover99",
    "text": "cold brew is so nice",
    "rating": 5,
    "photoUrl": "https://your-image-host.com/post1.jpg",
    "createdAt": "2026-03-12T10:00:00Z"
  }
]`

# POST /api/posts

Request body:

`{
  "cafeId": "60d5ec9af682fbd39a1b865b",
  "author": "CoffeeLover99",
  "text": "cold brew is so nice",
  "rating": 5,
  "photoUrl": "https://your-image-host.com/post1.jpg"
}`

Response body:

`{
  "message": "Post successfully created.",
  "postId": "71e6fd8bg793hce40b2c976c"
}`
