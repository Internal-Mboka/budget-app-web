import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { sanitizeAttachmentFileName } from "@/lib/expenses/attachments";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "expense-attachments");

function getAttachmentDirectory(transactionId: string): string {
  return path.join(STORAGE_ROOT, transactionId);
}

function getAttachmentFilePath(
  transactionId: string,
  attachmentId: string,
  fileName: string
): string {
  const safeName = sanitizeAttachmentFileName(fileName);
  return path.join(getAttachmentDirectory(transactionId), `${attachmentId}-${safeName}`);
}

export async function saveExpenseAttachmentFile(input: {
  transactionId: string;
  attachmentId: string;
  fileName: string;
  bytes: Buffer;
}): Promise<string> {
  const directory = getAttachmentDirectory(input.transactionId);
  await mkdir(directory, { recursive: true });

  const filePath = getAttachmentFilePath(input.transactionId, input.attachmentId, input.fileName);
  await writeFile(filePath, input.bytes);

  return filePath;
}

export async function readExpenseAttachmentFile(input: {
  transactionId: string;
  attachmentId: string;
  fileName: string;
}): Promise<Buffer> {
  const filePath = getAttachmentFilePath(input.transactionId, input.attachmentId, input.fileName);
  return readFile(filePath);
}

export function resolveExpenseAttachmentStoragePath(
  transactionId: string,
  attachmentId: string,
  fileName: string
): string {
  return getAttachmentFilePath(transactionId, attachmentId, fileName);
}
