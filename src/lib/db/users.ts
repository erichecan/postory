import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./client";
import type { AccountSource } from "@/generated/prisma/client";
import { DEMO_PROFILE, DEMO_USER } from "@/lib/demo";

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

export async function findActiveSessionUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, role: true, disabled: true },
  });
  return user && !user.disabled ? user : null;
}

export async function findUserRole(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { role: true } });
}

export async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({ where: { phone: DEMO_USER.phone }, select: { id: true, role: true, disabled: true } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  return prisma.user.upsert({
    where: { phone: DEMO_USER.phone },
    create: { ...DEMO_USER, passwordHash, source: "OFFLINE", profile: { create: DEMO_PROFILE } },
    update: {},
    select: { id: true, role: true, disabled: true },
  });
}
