import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaQueryCount?: number };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  if (process.env.PRISMA_QUERY_COUNT !== "1") return new PrismaClient({ adapter });
  const client = new PrismaClient({ adapter, log: [{ emit: "event", level: "query" }] });
  client.$on("query", () => {
    globalForPrisma.prismaQueryCount = (globalForPrisma.prismaQueryCount ?? 0) + 1;
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

export function takeQueryCount() {
  const n = globalForPrisma.prismaQueryCount ?? 0;
  globalForPrisma.prismaQueryCount = 0;
  return n;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
