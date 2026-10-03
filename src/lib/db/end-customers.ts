import "server-only";
import { prisma } from "./client";
import { sendWelcomeOutreach } from "./outreach";

export async function listEndCustomers(userId: string) {
  return prisma.endCustomer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createEndCustomer(userId: string, input: { name: string | null; email: string | null; phone: string | null; birthday: Date | null }) {
  const customer = await prisma.endCustomer.create({ data: { userId, ...input, source: "manual" } });
  await sendWelcomeOutreach(customer.id).catch(() => {});
  return customer;
}

export async function deleteEndCustomer(userId: string, id: string) {
  const result = await prisma.endCustomer.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
