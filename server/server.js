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

app.post("/signup", async (req, res) => {
  const { email, password, nickname } = req.body
  
  if (!email || !password || !nickname) {
    return res.status(400).send({ message: "All fields are required" })
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] }
  })

  if (existingUser) {
    return res.status(409).send({ message: "Email or Nickname already exists" })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, nickname, password: hashedPassword }
  })

  const token = jwt.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET)
  res.setCookie("token", token, { path: "/", httpOnly: true })
  
  return { id: user.id, nickname: user.nickname, email: user.email }
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

// Get Book Detail (with Chapters)
app.get("/books/:id", async (req, res) => {
  let bookId = req.params.id;

  // 1. Try finding by UUID (DB ID)
  let book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { chapters: { orderBy: { title: 'asc' } } }
  });

  // 2. If not found, try finding by ISBN
  if (!book) {
    book = await prisma.book.findFirst({
      where: { isbn: { contains: bookId } }, // ISBN check
      include: { chapters: { orderBy: { title: 'asc' } } }
    });
  }

  // 3. If still not found, and it looks like an ISBN (search result click), fetch from Naver and create
  if (!book && /^\d+/.test(bookId)) { // Simple check if it's numeric (ISBN-like)
    const searchResult = await searchNaverBooks(bookId, 1); // Search by ISBN (d_isbn option is better but query works)
    
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
          include: { chapters: true } // Empty chapters initially
        })
      );
    }
  }

  if (!book) {
    return res.status(404).send({ message: "Book not found" });
  }

  return book;
})

// Get Chapter Detail (with Comments)
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

app.get("/chapters/:id", async (req, res) => {
  const { sortBy } = req.query
  const orderBy = sortBy === 'likes' 
    ? { likes: { _count: 'desc' } } 
    : { createdAt: 'desc' }

  const chapter = await commitToDb(
    prisma.chapter.findUnique({
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

  if (!chapter) return res.status(404).send({ message: "Chapter not found" })

  const userId = req.user?.id
  let likes = []
  if (userId) {
    likes = await prisma.like.findMany({
      where: {
        userId: userId,
        commentId: { in: chapter.comments.map(c => c.id) }
      }
    })
  }

  return {
    ...chapter,
    comments: chapter.comments.map(comment => {
      const { _count, ...commentFields } = comment
      return {
        ...commentFields,
        likedByMe: likes.find(like => like.commentId === comment.id),
        likeCount: _count.likes
      }
    })
  }
})

// --- Comment Routes ---

app.post("/chapters/:id/comments", async (req, res) => {
  if (!req.user) return res.status(401).send({ message: "Unauthorized" })
  if (!req.body.message) return res.status(400).send({ message: "Message is required" })

  return await commitToDb(
    prisma.comment.create({
      data: {
        message: req.body.message,
        userId: req.user.id,
        parentId: req.body.parentId,
        chapterId: req.params.id,
      },
      select: COMMENT_SELECT_FIELDS
    }).then(comment => ({
      ...comment,
      likeCount: 0,
      likedByMe: false
    }))
  )
})

app.put("/chapters/:chapterId/comments/:commentId", async (req, res) => {
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

app.delete("/chapters/:chapterId/comments/:commentId", async (req, res) => {
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

app.post("/chapters/:chapterId/comments/:commentId/toggleLike", async (req, res) => {
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
