import "server-only";
import { prisma } from "./client";
import type { Prisma } from "@/generated/prisma/client";
import type { StudioInput } from "@/lib/nails/validation";

// userId must come from a validated server session, never from submitted fields.
async function withOwner<T>(userId: string, run: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.studio_owner_id', ${userId}, true)`;
    return run(tx);
  });
}

export function findStudioForOwner(userId: string) {
  return withOwner(userId, (tx) => tx.studio.findUnique({ where: { ownerId: userId } }));
}

export function createStudioForOwner(userId: string, input: StudioInput) {
  return withOwner(userId, async (tx) => {
    // Native INSERT ON CONFLICT also makes concurrent onboarding idempotent.
    await tx.studio.createMany({ data: { ownerId: userId, ...input }, skipDuplicates: true });
    return tx.studio.findUniqueOrThrow({ where: { ownerId: userId } });
  });
}

export function updateStudioForOwner(userId: string, input: StudioInput) {
  return withOwner(userId, (tx) => tx.studio.update({ where: { ownerId: userId }, data: input }));
}
