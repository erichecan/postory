import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "./client";
import type { AccountSource } from "@/generated/prisma/client";

export async function createUser(input: { phone: string; name: string; password: string; source: AccountSource }) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.user.create({
    data: { phone: input.phone, name: input.name, passwordHash, source: input.source },
    select: { id: true, role: true },
  });
}

export async function findUserByPhone(phone: string) {
  return prisma.user.findUnique({ where: { phone } });
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      phone: true,
      name: true,
      role: true,
      source: true,
      disabled: true,
      createdAt: true,
      _count: { select: { designs: true } },
    },
  });
}

export async function setUserDisabled(id: string, disabled: boolean) {
  return prisma.user.update({ where: { id }, data: { disabled }, select: { id: true } });
}
