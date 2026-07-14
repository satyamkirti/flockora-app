const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDateString(value: string): boolean {
  return DATE_PATTERN.test(value.trim());
}

export function isValidTimeString(value: string): boolean {
  return TIME_PATTERN.test(value.trim());
}
