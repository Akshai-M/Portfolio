import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

/** Light-mode brand tokens from app/globals.css — inlined for email clients. */
const brand = {
  primary: "#2a2744",
  secondary: "#e86a5a",
  dark: "#211f3d",
  light: "#f3f1ec",
  text: "#3f3f46",
  muted: "#71717a",
  white: "#ffffff",
  border: "#e8e4dc",
} as const;

/** Prefer a public origin for images — email clients cannot load localhost assets. */
function emailAssetUrl(path: string, preview = false): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const site = getSiteUrl();
  // In browser previews, use the current site origin so localhost logos load.
  if (
    !preview &&
    (site.includes("localhost") || site.includes("127.0.0.1"))
  ) {
    return `https://livefolio.me${normalized}`;
  }
  return `${site}${normalized}`;
}

type EmailRenderOptions = {
  /** Use local asset URLs so logos render in browser previews. */
  preview?: boolean;
};

function emailShell(
  params: {
    title: string;
    preheader: string;
    bodyHtml: string;
  },
  options: EmailRenderOptions = {},
): string {
  const { title, preheader, bodyHtml } = params;
  const homeUrl = absoluteUrl("/");
  const logoUrl = emailAssetUrl("/logo-email.png", options.preview);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${brand.light};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${brand.primary};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.light};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${brand.white};border-radius:16px;overflow:hidden;border:1px solid ${brand.border};">
          <tr>
            <td style="padding:0;background:${brand.primary};height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 28px 12px;">
              <a href="${homeUrl}" style="display:inline-block;text-decoration:none;color:${brand.primary};">
                <img src="${logoUrl}" width="40" height="40" alt="" style="display:block;border:0;outline:none;width:40px;height:40px;" />
              </a>
              <a href="${homeUrl}" style="display:inline-block;margin-top:12px;text-decoration:none;color:${brand.primary};font-size:22px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;">
                ${siteConfig.name}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-size:15px;line-height:1.65;color:${brand.text};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;font-size:12px;line-height:1.55;color:${brand.muted};border-top:1px solid ${brand.border};background:${brand.light};">
              Questions? Reply to this email or write
              <a href="mailto:${siteConfig.supportEmail}" style="color:${brand.secondary};text-decoration:none;font-weight:600;">${siteConfig.supportEmail}</a>.
              <br />
              <a href="${homeUrl}" style="color:${brand.primary};text-decoration:none;font-weight:600;">${siteConfig.name}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:28px 0 8px;">
  <a href="${href}" style="display:inline-block;background:${brand.secondary};color:${brand.white};text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.01em;">
    ${label}
  </a>
</p>`;
}

export function welcomeEmailHtml(
  name: string,
  options: EmailRenderOptions = {},
): {
  subject: string;
  html: string;
} {
  const dashboardUrl = absoluteUrl("/dashboard");
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Welcome to ${siteConfig.name}`,
    html: emailShell(
      {
        title: `Welcome to ${siteConfig.name}`,
        preheader: "Your portfolio builder is ready — publish in minutes.",
        bodyHtml: `
        <p style="margin:0 0 12px;color:${brand.primary};font-size:18px;font-weight:650;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:0 0 12px;">
          Welcome to ${siteConfig.name}. Upload your resume, pick a template, and publish a live portfolio on your own link.
        </p>
        ${ctaButton(dashboardUrl, "Open your dashboard")}
        <p style="margin:16px 0 0;font-size:13px;color:${brand.muted};">
          Need a hand getting started? Just reply to this email — we're here.
        </p>
      `,
      },
      options,
    ),
  };
}

export function noPortfolioReminderEmailHtml(
  name: string,
  options: EmailRenderOptions = {},
): {
  subject: string;
  html: string;
} {
  const dashboardUrl = absoluteUrl("/dashboard");
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Create your ${siteConfig.name} portfolio`,
    html: emailShell(
      {
        title: `Create your ${siteConfig.name} portfolio`,
        preheader: "You're a few clicks away from a live portfolio.",
        bodyHtml: `
        <p style="margin:0 0 12px;color:${brand.primary};font-size:18px;font-weight:650;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:0 0 12px;">
          You signed up for ${siteConfig.name} but have not created a portfolio yet. Import your resume and we will structure your experience, projects, and skills for you.
        </p>
        ${ctaButton(dashboardUrl, "Create your portfolio")}
      `,
      },
      options,
    ),
  };
}

export function unpublishedReminderEmailHtml(
  name: string,
  options: EmailRenderOptions = {},
): {
  subject: string;
  html: string;
} {
  const previewUrl = absoluteUrl("/dashboard/preview");
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Publish your ${siteConfig.name} portfolio`,
    html: emailShell(
      {
        title: `Publish your ${siteConfig.name} portfolio`,
        preheader: "Your draft is ready — go live with one click.",
        bodyHtml: `
        <p style="margin:0 0 12px;color:${brand.primary};font-size:18px;font-weight:650;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:0 0 12px;">
          Your ${siteConfig.name} portfolio is drafted but not published yet. Choose a slug, preview it, and share your live link.
        </p>
        ${ctaButton(previewUrl, "Preview and publish")}
      `,
      },
      options,
    ),
  };
}

export type AutomatedEmailDemo = {
  id: "welcome" | "no_portfolio" | "unpublished";
  label: string;
  description: string;
  subject: string;
  html: string;
};

export function getAutomatedEmailDemos(
  name = "Alex",
  options: EmailRenderOptions = { preview: true },
): AutomatedEmailDemo[] {
  const welcome = welcomeEmailHtml(name, options);
  const noPortfolio = noPortfolioReminderEmailHtml(name, options);
  const unpublished = unpublishedReminderEmailHtml(name, options);

  return [
    {
      id: "welcome",
      label: "Welcome (on signup)",
      description: "Sent once when a new user account is created via OAuth.",
      subject: welcome.subject,
      html: welcome.html,
    },
    {
      id: "no_portfolio",
      label: "No portfolio reminder",
      description: "Sent once if the user still has no portfolio after 3 days.",
      subject: noPortfolio.subject,
      html: noPortfolio.html,
    },
    {
      id: "unpublished",
      label: "Unpublished reminder",
      description:
        "Sent once if a portfolio exists but is still unpublished after 7 days.",
      subject: unpublished.subject,
      html: unpublished.html,
    },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
