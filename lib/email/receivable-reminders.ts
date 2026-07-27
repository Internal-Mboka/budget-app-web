import { sendTransactionalEmail } from "@/lib/email/send-transactional";

type ReceivableReminderEmailInput = {
  clientEmail: string;
  clientName: string;
  transactionCode: string;
  remainingAmount: number;
  dueLabel: string;
};

export async function notifyReceivableReminder(input: ReceivableReminderEmailInput) {
  const subject = `Mboka Budget — Rappel de solde · ${input.transactionCode}`;
  const body = `Bonjour ${input.clientName},

Votre réservation ${input.transactionCode} comporte un solde de ${input.remainingAmount.toFixed(2)} USD à régler.
Échéance prévue : ${input.dueLabel}.

Merci de nous contacter pour finaliser votre règlement.

— Mboka Budget`;

  await sendTransactionalEmail({ to: input.clientEmail, subject, text: body });
}
