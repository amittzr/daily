import { PrismaClient } from "../generated/prisma/index.js";

// Singleton Prisma Client instance — import this everywhere you need DB access
const prisma = new PrismaClient();

export default prisma;
