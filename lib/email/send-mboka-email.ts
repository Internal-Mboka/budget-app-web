import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import {
  renderMbokaEmail,
  type MbokaEmailCta,
  type MbokaEmailRenderInput,
} from "@/lib/email/templates/mboka-email-template";

export type MbokaEmailContent = MbokaEmailRenderInput & {
  subject: string;
};

/** Envoie un email transactionnel avec la charte Mboka — seul le contenu change. */
export async function sendMbokaEmail(
  to: string | string[],
  content: MbokaEmailContent
): Promise<boolean> {
  const { html, text } = renderMbokaEmail(content);

  return sendTransactionalEmail({
    to,
    subject: content.subject,
    text,
    html,
  });
}

export type { MbokaEmailCta };
