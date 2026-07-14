import { Task } from '../types/task';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isTaskDueToday(task: Task, referenceDate: Date = new Date()): boolean {
  const due = new Date(task.dueDate);
  if (task.repeatType === 'none') {
    return isSameDay(due, referenceDate);
  }
  if (startOfDay(due) > startOfDay(referenceDate)) {
    return false;
  }
  switch (task.repeatType) {
    case 'daily':
      return true;
    case 'weekly':
      return due.getDay() === referenceDate.getDay();
    case 'monthly':
      return due.getDate() === referenceDate.getDate();
    default:
      return false;
  }
}

export function isTaskCompletedToday(task: Task, referenceDate: Date = new Date()): boolean {
  if (!task.completed || !task.completedAt) {
    return false;
  }
  if (task.repeatType === 'none') {
    return true;
  }
  return isSameDay(new Date(task.completedAt), referenceDate);
}

export function isTaskOverdue(task: Task, referenceDate: Date = new Date()): boolean {
  if (task.repeatType !== 'none' || task.completed) {
    return false;
  }
  return new Date(task.dueDate) < startOfDay(referenceDate);
}

export function formatDueTime(dueDate: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(dueDate));
}

export function formatDueDate(dueDate: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dueDate));
}

export function formatDueDateTime(dueDate: string): string {
  return `${formatDueDate(dueDate)} · ${formatDueTime(dueDate)}`;
}

const repeatCadenceLabels: Record<Task['repeatType'], string> = {
  none: 'Does not repeat',
  daily: 'Repeats daily',
  weekly: 'Repeats weekly',
  monthly: 'Repeats monthly',
};

export function repeatLabel(repeatType: Task['repeatType']): string {
  return repeatCadenceLabels[repeatType] ?? repeatCadenceLabels.none;
}

export function taskScheduleLabel(task: Pick<Task, 'dueDate' | 'repeatType'>): string {
  if (task.repeatType === 'none') {
    return formatDueDateTime(task.dueDate);
  }
  return `${repeatLabel(task.repeatType)} · ${formatDueTime(task.dueDate)}`;
}

/**
 * Estimates when a task's notification will next fire, for display in a preview card — mirrors
 * (without duplicating) the calendar semantics of `buildTaskTrigger` in notificationService.ts:
 * DAILY/WEEKLY/MONTHLY triggers are OS wall-clock/calendar-based, so "next occurrence" is
 * computed relative to now rather than reading a single stored instant.
 */
export function computeNextTaskOccurrence(
  due: Date,
  repeatType: Task['repeatType'],
  now: Date = new Date()
): Date | null {
  if (repeatType === 'none') {
    return due > now ? due : null;
  }

  const result = new Date(now);
  result.setHours(due.getHours(), due.getMinutes(), 0, 0);

  if (repeatType === 'daily') {
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }

  if (repeatType === 'weekly') {
    const targetDay = due.getDay();
    while (result.getDay() !== targetDay || result <= now) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }

  const targetDate = due.getDate();
  result.setDate(targetDate);
  if (result <= now) {
    result.setMonth(result.getMonth() + 1);
    result.setDate(targetDate);
  }
  return result;
}

export function getTimeOfDayGreeting(referenceDate: Date = new Date()): string {
  const hour = referenceDate.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

/**
 * Parses a bare `YYYY-MM-DD` string into a Date using local year/month/day components,
 * unlike `new Date(dateString)` which parses bare dates as UTC midnight — a real bug for any
 * negative-UTC-offset user once `.setHours()`/`.setDate()` are applied downstream.
 */
export function parseLocalDateString(dateString: string, hour = 0, minute = 0): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function parseDateTimeInputs(dateText: string, timeText: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeText.trim());
  if (!dateMatch || !timeMatch) {
    return null;
  }
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}
