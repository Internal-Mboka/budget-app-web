type SendTransactionalEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

function normalizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];

  return [...new Set(list.map((email) => email.trim()).filter(Boolean))];
}

/** Envoi email transactionnel — Brevo si configuré, sinon log dev. */
export async function sendTransactionalEmail(input: SendTransactionalEmailInput): Promise<boolean> {
  const recipients = normalizeRecipients(input.to);

  if (recipients.length === 0) {
    return false;
  }

  const apiKey = process.env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    console.info("[email:dev]", {
      to: recipients,
      subject: input.subject,
      text: input.text,
    });
    return true;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "noreply@mboka.studio";
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "Mboka Budget";

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: recipients.map((email) => ({ email })),
        subject: input.subject,
        textContent: input.text,
        htmlContent: input.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email:brevo-error]", response.status, body);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[email:brevo-error]", error);
    return false;
  }
}
