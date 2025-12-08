import fastify from "fastify"
import sensible from "@fastify/sensible"
import cors from "@fastify/cors"
import cookie from "@fastify/cookie"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

dotenv.config()

const app = fastify()
app.register(sensible)
app.register(cookie, { secret: process.env.COOKIE_SECRET })
app.register(cors, {
  origin: ["http://localhost:3000"], // React App URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
})

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"

// Middleware for Auth
app.addHook("onRequest", async (req, res) => {
  const token = req.cookies.token
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
    } catch (err) {
      // Invalid token, clear it
      res.clearCookie("token")
    }
  }
})

// --- Auth Routes ---

// Check nickname availability
app.get("/check-nickname", async (req, res) => {
  const { nickname } = req.query
  
  if (!nickname || nickname.trim() === "") {
    return res.status(400).send({ available: false, message: "닉네임을 입력해주세요." })
  }

  const existingUser = await prisma.user.findUnique({
    where: { nickname: nickname.trim() }
  })

  if (existingUser) {
    return { available: false, message: "이미 사용 중인 닉네임입니다." }
  }

  return { available: true, message: "사용 가능한 닉네임입니다." }
})

app.post("/signup", async (req, res) => {
  const { email, password, nickname } = req.body
  
  if (!email || !password || !nickname) {
    return res.status(400).send({ message: "All fields are required" })
  }

  // 이메일과 닉네임을 각각 확인
  const existingEmail = await prisma.user.findUnique({
    where: { email }
  })

  const existingNickname = await prisma.user.findUnique({
    where: { nickname }
  })

  if (existingNickname) {
    return res.status(409).send({ message: "이미 사용 중인 닉네임입니다. 닉네임 중복 확인을 다시 해주세요." })
  }

  if (existingEmail) {
    return res.status(409).send({ message: "이미 가입된 이메일입니다." })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, nickname, password: hashedPassword }
  })
  
  return { id: user.id, nickname: user.nickname, email: user.email, message: "회원가입이 완료되었습니다." }
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send({ message: "Invalid email or password" })
  }

  const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET)
  res.setCookie("token", token, { path: "/", httpOnly: true })
  
  return { id: user.id, nickname: user.nickname, email: user.email }
})

app.post("/logout", async (req, res) => {
  res.clearCookie("token")
  return { message: "Logged out" }
})

app.get("/me", async (req, res) => {
  if (!req.user) return null
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.id },
    select: { id: true, nickname: true, email: true }
  })
  return user
})

// --- Book & Chapter Routes ---

// Helper: Naver API Call
async function searchNaverBooks(query, display = 10) {
  const client_id = process.env.NAVER_CLIENT_ID;
  const client_secret = process.env.NAVER_CLIENT_SECRET;
  
  console.log(`[Naver API] Searching for: "${query}"`);
  console.log(`[Naver API] Client ID exists: ${!!client_id}, Secret exists: ${!!client_secret}`);

  if (!client_id || !client_secret) {
    console.error("[Naver API] Error: Missing API Keys");
    return { items: [] };
  }

  try {
    const url = `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=${display}`;
    console.log(`[Naver API] Request URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
        console.error("[Naver API] Response Error:", response.status, data);
        return { items: [] };
    }

    console.log(`[Naver API] Success! Found ${data.items ? data.items.length : 0} items.`);
    return data;
  } catch (error) {
    console.error("[Naver API] Fetch Error:", error);
    return { items: [] };
  }
}

// Get all books or search
app.get("/books", async (req, res) => {
  const { q } = req.query
  
  if (q) {
    // Search via Naver API
    const data = await searchNaverBooks(q);
    if (data.items) {
      return data.items.map(item => ({
        id: item.isbn.split(' ')[0], // Use ISBN as ID for search results
        title: item.title.replace(/<[^>]+>/g, ''),
        author: item.author.replace(/<[^>]+>/g, ''),
        image: item.image,
        isbn: item.isbn,
        description: item.description.replace(/<[^>]+>/g, '')
      }));
    }
    return [];
  } else {
    // List DB books (or recommendations)
    return await commitToDb(
      prisma.book.findMany({ orderBy: { title: 'asc' } })
    )
  }
})

// Get Book Detail (with SubDiscussions and Comments)
app.get("/books/:id", async (req, res) => {
  let bookId = req.params.id;
  const { sortBy } = req.query;
  const orderBy = sortBy === 'likes' 
    ? { likes: { _count: 'desc' } } 
    : { createdAt: 'desc' };

  // 1. Try finding by UUID (DB ID)
  let book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { 
      subDiscussions: { 
        orderBy: { title: 'asc' },
        include: {
          _count: { select: { comments: true } }
        }
      },
      comments: {
        where: { bookId: bookId },
        orderBy: orderBy,
        select: {
          ...COMMENT_SELECT_FIELDS,
          _count: { select: { likes: true } }
        }
      }
    }
  });

  // 2. If not found, try finding by ISBN
  if (!book) {
    book = await prisma.book.findFirst({
      where: { isbn: { contains: bookId } },
      include: { 
        subDiscussions: { 
          orderBy: { title: 'asc' },
          include: {
            _count: { select: { comments: true } }
          }
        },
        comments: {
          orderBy: orderBy,
          select: {
            ...COMMENT_SELECT_FIELDS,
            _count: { select: { likes: true } }
          }
        }
      }
    });
  }

  // 3. If still not found, and it looks like an ISBN (search result click), fetch from Naver and create
  if (!book && /^\d+/.test(bookId)) {
    const searchResult = await searchNaverBooks(bookId, 1);
    
    if (searchResult.items && searchResult.items.length > 0) {
      const item = searchResult.items[0];
      const title = item.title.replace(/<[^>]+>/g, '');
      const author = item.author.replace(/<[^>]+>/g, '');
      
      // Create Book in DB
      book = await commitToDb(
        prisma.book.create({
          data: {
            title: title,
            author: author,
            isbn: item.isbn,
            image: item.image,
            description: item.description.replace(/<[^>]+>/g, '')
          },
          include: { subDiscussions: true, comments: true }
        })
      );
    }
  }

  if (!book) {
    return res.status(404).send({ message: "Book not found" });
  }

  // Add like info for comments
  const userId = req.user?.id;
  let likes = [];
  if (userId && book.comments && book.comments.length > 0) {
    likes = await prisma.like.findMany({
      where: {
        userId: userId,
        commentId: { in: book.comments.map(c => c.id) }
      }
    });
  }

  return {
    ...book,
    comments: book.comments ? book.comments.map(comment => {
      const { _count, ...commentFields } = comment;
      return {
        ...commentFields,
        likedByMe: likes.find(like => like.commentId === comment.id) ? true : false,
        likeCount: _count?.likes || 0
      };
    }) : []
  };
})

// Create SubDiscussion (Discussion Room)
app.post("/books/:id/sub-discussions", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })
  if (!req.body.title || req.body.title.trim() === "") {
    return res.status(400).send({ message: "토론방 제목을 입력해주세요." })
  }

  // Check if book exists
  const book = await prisma.book.findUnique({ where: { id: req.params.id } })
  if (!book) {
    return res.status(404).send({ message: "Book not found" })
  }

  return await commitToDb(
    prisma.subDiscussion.create({
      data: {
        title: req.body.title.trim(),
        bookId: req.params.id
      }
    })
  )
})

// Get SubDiscussion Detail (with Comments)
const COMMENT_SELECT_FIELDS = {
  id: true,
  message: true,
  parentId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      nickname: true
    }
  }
}

app.get("/sub-discussions/:id", async (req, res) => {
  const { sortBy } = req.query
  const orderBy = sortBy === 'likes' 
    ? { likes: { _count: 'desc' } } 
    : { createdAt: 'desc' }

  const subDiscussion = await commitToDb(
    prisma.subDiscussion.findUnique({
      where: { id: req.params.id },
      include: {
        book: true,
        comments: {
          orderBy: orderBy,
          select: {
            ...COMMENT_SELECT_FIELDS,
            _count: { select: { likes: true } }
          }
        }
      }
    })
  )

  if (!subDiscussion) return res.status(404).send({ message: "SubDiscussion not found" })

  const userId = req.user?.id
  let likes = []
  if (userId) {
    likes = await prisma.like.findMany({
      where: {
        userId: userId,
        commentId: { in: subDiscussion.comments.map(c => c.id) }
      }
    })
  }

  return {
    ...subDiscussion,
    comments: subDiscussion.comments.map(comment => {
      const { _count, ...commentFields } = comment
      return {
        ...commentFields,
        likedByMe: likes.find(like => like.commentId === comment.id),
        likeCount: _count.likes
      }
    })
  }
})

// --- Book Comment Routes ---

app.post("/books/:id/comments", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })
  if (!req.body.message) return res.status(400).send({ message: "Message is required" })

  return await commitToDb(
    prisma.comment.create({
      data: {
        message: req.body.message,
        userId: req.user.id,
        parentId: req.body.parentId,
        bookId: req.params.id,
      },
      select: COMMENT_SELECT_FIELDS
    }).then(comment => ({
      ...comment,
      likeCount: 0,
      likedByMe: false
    }))
  )
})

app.put("/books/:bookId/comments/:commentId", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })
  if (!req.body.message) return res.status(400).send({ message: "Message is required" })

  const comment = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true }
  })

  if (comment.userId !== req.user.id) {
    return res.status(401).send({ message: "You do not have permission to edit this message" })
  }

  return await commitToDb(
    prisma.comment.update({
      where: { id: req.params.commentId },
      data: { message: req.body.message },
      select: { message: true }
    })
  )
})

app.delete("/books/:bookId/comments/:commentId", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })

  const comment = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true }
  })

  if (comment.userId !== req.user.id) {
    return res.status(401).send({ message: "You do not have permission to delete this message" })
  }

  return await commitToDb(
    prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true }
    })
  )
})

app.post("/books/:bookId/comments/:commentId/toggleLike", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })

  const data = {
    commentId: req.params.commentId,
    userId: req.user.id
  }

  const like = await prisma.like.findUnique({
    where: { userId_commentId: data }
  })

  if (like == null) {
    return await commitToDb(prisma.like.create({ data })).then(() => ({ addLike: true }))
  } else {
    return await commitToDb(prisma.like.delete({ where: { userId_commentId: data } })).then(() => ({ addLike: false }))
  }
})

// --- SubDiscussion Comment Routes ---

app.post("/sub-discussions/:id/comments", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })
  if (!req.body.message) return res.status(400).send({ message: "Message is required" })

  return await commitToDb(
    prisma.comment.create({
      data: {
        message: req.body.message,
        userId: req.user.id,
        parentId: req.body.parentId,
        subDiscussionId: req.params.id,
      },
      select: COMMENT_SELECT_FIELDS
    }).then(comment => ({
      ...comment,
      likeCount: 0,
      likedByMe: false
    }))
  )
})

app.put("/sub-discussions/:subDiscussionId/comments/:commentId", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })
  if (!req.body.message) return res.status(400).send({ message: "Message is required" })

  const comment = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true }
  })

  if (comment.userId !== req.user.id) {
    return res.status(401).send({ message: "You do not have permission to edit this message" })
  }

  return await commitToDb(
    prisma.comment.update({
      where: { id: req.params.commentId },
      data: { message: req.body.message },
      select: { message: true }
    })
  )
})

app.delete("/sub-discussions/:subDiscussionId/comments/:commentId", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })

  const comment = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true }
  })

  if (comment.userId !== req.user.id) {
    return res.status(401).send({ message: "You do not have permission to delete this message" })
  }

  return await commitToDb(
    prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true }
    })
  )
})

app.post("/sub-discussions/:subDiscussionId/comments/:commentId/toggleLike", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })

  const data = {
    commentId: req.params.commentId,
    userId: req.user.id
  }

  const like = await prisma.like.findUnique({
    where: { userId_commentId: data }
  })

  if (like == null) {
    return await commitToDb(prisma.like.create({ data })).then(() => ({ addLike: true }))
  } else {
    return await commitToDb(prisma.like.delete({ where: { userId_commentId: data } })).then(() => ({ addLike: false }))
  }
})

async function commitToDb(promise) {
  const [error, data] = await app.to(promise)
  if (error) return app.httpErrors.internalServerError(error.message)
  return data
}

app.listen({ port: process.env.PORT || 3001 }).then(() => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3001}`)
})
