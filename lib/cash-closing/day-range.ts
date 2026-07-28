import { endOfDay, parseISO, startOfDay } from "date-fns";

export function parseClosingDateInput(value: string): Date {
  return startOfDay(parseISO(`${value}T12:00:00`));
}

export function getClosingDayRange(closingDate: string): { start: Date; end: Date; date: Date } {
  const date = parseClosingDateInput(closingDate);

  return {
    date,
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

export function formatClosingDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
