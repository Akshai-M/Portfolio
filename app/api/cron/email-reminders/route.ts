import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  noPortfolioReminderEmailHtml,
  unpublishedReminderEmailHtml,
} from "@/lib/email-templates";

const NO_PORTFOLIO_DAYS = 3;
const UNPUBLISHED_DAYS = 7;
const PAGE_SIZE = 100;
const CONCURRENCY = 5;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.all(batch.map((item) => worker(item)));
  }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const noPortfolioCutoff = daysAgo(NO_PORTFOLIO_DAYS);
  const unpublishedCutoff = daysAgo(UNPUBLISHED_DAYS);

  let noPortfolioSent = 0;
  let noPortfolioFailed = 0;
  let unpublishedSent = 0;
  let unpublishedFailed = 0;

  // --- No portfolio reminders ---
  let noPortfolioCursor: string | undefined;
  do {
    const users = await prisma.user.findMany({
      where: {
        portfolio: null,
        noPortfolioReminderSentAt: null,
        createdAt: { lte: noPortfolioCutoff },
      },
      select: { id: true, email: true, name: true },
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(noPortfolioCursor && {
        cursor: { id: noPortfolioCursor },
        skip: 1,
      }),
    });

    await mapPool(users, CONCURRENCY, async (user) => {
      const { subject, html } = noPortfolioReminderEmailHtml(user.name);
      const result = await sendEmail({
        to: user.email,
        subject,
        html,
        tags: [
          { name: "type", value: "no_portfolio" },
          { name: "user_id", value: user.id },
        ],
        idempotencyKey: `no-portfolio-${user.id}`,
      });

      await prisma.emailSendLog.create({
        data: {
          userId: user.id,
          toEmail: user.email,
          type: "no_portfolio",
          resendId: result.id,
          status: result.error ? "failed" : "sent",
          error: result.error,
        },
      });

      if (result.error) {
        noPortfolioFailed += 1;
        console.error("[email.cron.no_portfolio] failed", {
          userId: user.id,
          error: result.error,
        });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { noPortfolioReminderSentAt: new Date() },
      });
      noPortfolioSent += 1;
    });

    noPortfolioCursor =
      users.length === PAGE_SIZE ? users.at(-1)?.id : undefined;
  } while (noPortfolioCursor);

  // --- Unpublished portfolio reminders ---
  let unpublishedCursor: string | undefined;
  do {
    const users = await prisma.user.findMany({
      where: {
        unpublishedReminderSentAt: null,
        portfolio: {
          isPublished: false,
          createdAt: { lte: unpublishedCutoff },
        },
      },
      select: { id: true, email: true, name: true },
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(unpublishedCursor && {
        cursor: { id: unpublishedCursor },
        skip: 1,
      }),
    });

    await mapPool(users, CONCURRENCY, async (user) => {
      const { subject, html } = unpublishedReminderEmailHtml(user.name);
      const result = await sendEmail({
        to: user.email,
        subject,
        html,
        tags: [
          { name: "type", value: "unpublished" },
          { name: "user_id", value: user.id },
        ],
        idempotencyKey: `unpublished-${user.id}`,
      });

      await prisma.emailSendLog.create({
        data: {
          userId: user.id,
          toEmail: user.email,
          type: "unpublished",
          resendId: result.id,
          status: result.error ? "failed" : "sent",
          error: result.error,
        },
      });

      if (result.error) {
        unpublishedFailed += 1;
        console.error("[email.cron.unpublished] failed", {
          userId: user.id,
          error: result.error,
        });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { unpublishedReminderSentAt: new Date() },
      });
      unpublishedSent += 1;
    });

    unpublishedCursor =
      users.length === PAGE_SIZE ? users.at(-1)?.id : undefined;
  } while (unpublishedCursor);

  return NextResponse.json({
    ok: true,
    noPortfolio: { sent: noPortfolioSent, failed: noPortfolioFailed },
    unpublished: { sent: unpublishedSent, failed: unpublishedFailed },
  });
}
