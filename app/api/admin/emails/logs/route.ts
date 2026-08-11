import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const take = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "50") || 50),
  );
  const type = searchParams.get("type")?.trim();

  const logs = await prisma.emailSendLog.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { id: true, name: true, email: true } },
      campaign: { select: { id: true, subject: true } },
    },
  });

  return NextResponse.json({ logs });
}
