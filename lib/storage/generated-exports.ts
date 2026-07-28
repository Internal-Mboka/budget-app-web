import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "exports");

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
}

function getExportFilePath(exportId: string, fileName: string): string {
  const year = new Date().getFullYear();
  const safeName = sanitizeFileName(fileName);
  return path.join(STORAGE_ROOT, String(year), `${exportId}-${safeName}`);
}

export async function saveGeneratedExportFile(input: {
  exportId: string;
  fileName: string;
  bytes: Buffer;
}): Promise<string> {
  const filePath = getExportFilePath(input.exportId, input.fileName);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, input.bytes);
  return filePath;
}

export async function readGeneratedExportFile(storagePath: string): Promise<Buffer> {
  return readFile(storagePath);
}
