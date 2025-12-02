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

// Get all books or search
app.get("/books", async (req, res) => {
  const { q } = req.query
  const where = q ? {
    OR: [
      { title: { contains: q } },
      { author: { contains: q } }
    ]
  } : {}

  return await commitToDb(
    prisma.book.findMany({ where })
  )
})

// Get Book Detail (with Chapters)
app.get("/books/:id", async (req, res) => {
  return await commitToDb(
    prisma.book.findUnique({
      where: { id: req.params.id },
      include: {
        chapters: {
          orderBy: { title: 'asc' } // Or create an order field later
        }
      }
    })
  )
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
  const chapter = await commitToDb(
    prisma.chapter.findUnique({
      where: { id: req.params.id },
      include: {
        book: true,
        comments: {
          orderBy: { createdAt: "desc" },
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
