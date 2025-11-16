// import { PrismaClient } from "@prisma/client";
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function seed() {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  const steven = await prisma.user.create({ data: { name: "Steven" } });
  const gizz = await prisma.user.create({ data: { name: "Gizz" } });

  const post1 = await prisma.post.create({
    data: {
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat urna vel ante volutpat, ut elementum mi placerat. Phasellus varius nisi a nisl interdum, at ultrices ex tincidunt. Duis nec nunc vel urna ullamcorper eleifend ac id dolor. Phasellus vitae tortor ac metus laoreet rutrum. Aenean condimentum consequat elit, ut placerat massa mattis vitae. Vivamus dictum faucibus massa, eget euismod turpis pretium a. Aliquam rutrum rhoncus mi, eu tincidunt mauris placerat nec. Nunc sagittis libero sed facilisis suscipit. Curabitur nisi lacus, ullamcorper eu maximus quis, malesuada sit amet nisi. Proin dignissim, lacus vitae mattis fermentum, dui dolor feugiat turpis, ut euismod libero purus eget dui.",
      title: "Post 1",
    },
  });
  const post2 = await prisma.post.create({
    data: {
      body: "auctor urna nunc id cursus. Tincidunt dui ut ornare lectus. Amet consectetur adipiscing elit pellentesque habitant morbi tristique senectus. Dolor magna eget est lorem ipsum. Vestibulum lectus mauris ultrices eros. Dignissim enim sit amet venenatis urna cursus eget nunc. Velit aliquet sagittis id consectetur purus ut faucibus pulvinar elementum. Dui vivamus arcu felis bibendum ut tristique. Sit amet nisl suscipit adipiscing bibendum est ultricies integer. Egestas sed tempus urna et pharetra pharetra massa massa. Tempus egestas sed sed risus. Sit amet nisl purus in. Ultricies tristique",
      title: "Post 2",
    },
  });

  const comment1 = await prisma.comment.create({
    data: {
      message: "I am a root comment",
      userId: steven.id,
      postId: post1.id,
    },
  });
  const comment2 = await prisma.comment.create({
    data: {
      parentId: comment1.id,
      message: "I am a nested comment",
      userId: gizz.id,
      postId: post1.id,
    },
  });
  const comment3 = await prisma.comment.create({
    data: {
      message: "I am another root comment",
      userId: gizz.id,
      postId: post1.id,
    },
  });
}

seed();