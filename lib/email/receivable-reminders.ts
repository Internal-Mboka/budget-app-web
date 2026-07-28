import { sendMbokaEmail } from "@/lib/email/send-mboka-email";

type ReceivableReminderEmailInput = {
  clientEmail: string;
  clientName: string;
  transactionCode: string;
  remainingAmount: number;
  dueLabel: string;
};

export async function notifyReceivableReminder(input: ReceivableReminderEmailInput) {
  await sendMbokaEmail(input.clientEmail, {
    subject: `Mboka Budget — Rappel de solde · ${input.transactionCode}`,
    previewText: `Solde restant sur votre réservation ${input.transactionCode}.`,
    greeting: `Bonjour ${input.clientName},`,
    paragraphs: [
      `Votre réservation ${input.transactionCode} comporte un solde de ${input.remainingAmount.toFixed(2)} USD à régler.`,
      `Échéance prévue : ${input.dueLabel}.`,
      "Merci de nous contacter pour finaliser votre règlement.",
    ],
  });
}
