import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { Logo } from "@/components/logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    redirect(admin.status === 401 ? "/sign-in?callbackUrl=/admin/emails" : "/");
  }

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <header className="border-b border-border-default bg-surface-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Logo href="/dashboard" className="h-7" />
            <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-xs font-medium text-text-secondary">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/emails"
              className="text-text-secondary hover:text-text-primary"
            >
              Emails
            </Link>
            <Link
              href="/admin/emails/preview"
              className="text-text-secondary hover:text-text-primary"
            >
              Previews
            </Link>
            <Link
              href="/dashboard"
              className="text-text-secondary hover:text-text-primary"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
