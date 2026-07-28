import { addMonths, format, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { z } from "zod";

export const RECURRING_PERIOD_OPTIONS = [
  { value: "MONTHLY", label: "Mensuelle" },
  { value: "QUARTERLY", label: "Trimestrielle" },
] as const;

export const RECURRING_PERIOD_LABELS = {
  MONTHLY: "Mensuelle",
  QUARTERLY: "Trimestrielle",
} as const;

export type RecurringPeriod = keyof typeof RECURRING_PERIOD_LABELS;

const recurringScheduleSchema = z.object({
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const recurringDueSchema = z.object({
  templateId: z.string().min(1),
  templateCode: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodLabel: z.string().min(1),
});

export type RecurringScheduleMetadata = z.infer<typeof recurringScheduleSchema>;
export type RecurringDueMetadata = z.infer<typeof recurringDueSchema>;

export function parseRecurringScheduleMetadata(raw: unknown): RecurringScheduleMetadata | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const schedule = record.recurringSchedule;

  if (!schedule || typeof schedule !== "object") {
    return null;
  }

  const parsed = recurringScheduleSchema.safeParse(schedule);
  return parsed.success ? parsed.data : null;
}

export function parseRecurringDueMetadata(raw: unknown): RecurringDueMetadata | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const due = record.recurringDue;

  if (!due || typeof due !== "object") {
    return null;
  }

  const parsed = recurringDueSchema.safeParse(due);
  return parsed.success ? parsed.data : null;
}

export function getRecurringPeriodLabel(period: string): string {
  return RECURRING_PERIOD_LABELS[period as RecurringPeriod] ?? period;
}

export function formatDuePeriodLabel(dueDate: string): string {
  return format(new Date(`${dueDate}T12:00:00`), "MMMM yyyy", { locale: fr });
}

export function computeInitialNextDueDate(dayOfMonth: number, referenceDate = new Date()): string {
  const today = startOfDay(referenceDate);
  const candidate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);

  if (candidate < today) {
    return format(addMonths(candidate, 1), "yyyy-MM-dd");
  }

  return format(candidate, "yyyy-MM-dd");
}

export function advanceDueDate(currentDueDate: string, period: RecurringPeriod): string {
  const base = new Date(`${currentDueDate}T12:00:00`);
  const months = period === "QUARTERLY" ? 3 : 1;

  return format(addMonths(base, months), "yyyy-MM-dd");
}

export function isDueDateReached(dueDate: string, referenceDate = new Date()): boolean {
  const due = startOfDay(new Date(`${dueDate}T12:00:00`));
  const today = startOfDay(referenceDate);

  return due.getTime() <= today.getTime();
}
