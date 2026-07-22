/// <reference types="node" />
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  // Create demo user for MVP testing
  const demoUser = await prisma.user.upsert({
    where: { email: "amit@daily-demo.com" },
    update: {},
    create: {
      id: "user-demo-123",
      email: "amit@daily-demo.com",
      firstName: "עמית",
    },
  });

  console.log("✓ Demo user created:", demoUser);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
