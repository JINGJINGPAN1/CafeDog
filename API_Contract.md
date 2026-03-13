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

# GET /api/posts?cafe_id=xxx

`[
  {
    "_id": "71e6fd8bg793hce40b2c976c",
    "cafe_id": "60d5ec9af682fbd39a1b865b",
    "author_name": "CoffeeLover99",
    "content": "cold brew is so nice",
    "rating": 5,
    "image_url": "https://你的s3地址.com/post1.jpg",
    "created_at": "2026-03-12T10:00:00Z"
  }
]`
