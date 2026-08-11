import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { welcomeEmailHtml } from "@/lib/email-templates";

/** Fire-and-forget welcome email. Never throws to the auth path. */
export async function sendWelcomeEmailSafe(user: {
  id: string;
  email: string;
  name: string;
}): Promise<void> {
  try {
    const { subject, html } = welcomeEmailHtml(user.name);
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      tags: [
        { name: "type", value: "welcome" },
        { name: "user_id", value: user.id },
      ],
      idempotencyKey: `welcome-${user.id}`,
    });

    await prisma.emailSendLog.create({
      data: {
        userId: user.id,
        toEmail: user.email,
        type: "welcome",
        resendId: result.id,
        status: result.error ? "failed" : "sent",
        error: result.error,
      },
    });

    if (!result.error) {
      await prisma.user.update({
        where: { id: user.id },
        data: { welcomeEmailSentAt: new Date() },
      });
    } else {
      console.error("[email.welcome] send failed", {
        userId: user.id,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[email.welcome] unexpected failure", {
      userId: user.id,
      error,
    });
  }
}
