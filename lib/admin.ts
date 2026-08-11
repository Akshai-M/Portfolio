import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = getAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

export async function requireAdmin(): Promise<
  | { ok: true; email: string; userId: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const userId = session?.user?.id ?? null;

  if (!email || !userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (!isAdminEmail(email)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, email, userId };
}
