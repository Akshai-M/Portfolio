import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
  idempotencyKey?: string;
};

export type SendEmailResult = {
  id: string | null;
  error: string | null;
};

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() || "Livefolio <team@livefolio.me>"
  );
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    return {
      id: null,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const { data, error } = await client.emails.send(
      {
        from: getFromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        ...(input.tags?.length ? { tags: input.tags } : {}),
      },
      input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey }
        : undefined,
    );

    if (error) {
      return { id: null, error: error.message };
    }

    return { id: data?.id ?? null, error: null };
  } catch (error) {
    return {
      id: null,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export function renderTemplatePlaceholders(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return vars[key] ?? "";
  });
}
