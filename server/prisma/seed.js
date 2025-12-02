import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function seed() {
  // Clean up existing data
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const user1 = await prisma.user.create({ 
    data: { 
      nickname: "ReaderOne",
      email: "reader1@example.com",
      password: hashedPassword
    } 
  });

  const user2 = await prisma.user.create({ 
    data: { 
      nickname: "BookLover",
      email: "lover@example.com",
      password: hashedPassword
    } 
  });

  // Create Books
  const book1 = await prisma.book.create({
    data: {
      title: "데미안",
      author: "헤르만 헤세"
    }
  });

  const book2 = await prisma.book.create({
    data: {
      title: "1984",
      author: "조지 오웰"
    }
  });

  // Create Chapters for Book 1
  const ch1 = await prisma.chapter.create({
    data: { title: "제1장: 두 세계", bookId: book1.id }
  });
  const ch2 = await prisma.chapter.create({
    data: { title: "제2장: 카인", bookId: book1.id }
  });
  
  // Create Chapters for Book 2
  await prisma.chapter.create({
    data: { title: "제1부", bookId: book2.id }
  });

  // Create Comments on Chapter 1
  const comment1 = await prisma.comment.create({
    data: {
      message: "싱클레어의 내면 갈등이 잘 드러나는 챕터입니다.",
      userId: user1.id,
      chapterId: ch1.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      parentId: comment1.id,
      message: "맞아요, 특히 어두운 세계에 대한 묘사가 인상적이었어요.",
      userId: user2.id,
      chapterId: ch1.id,
    },
  });

  console.log("Seeding finished.");
}

seed();
