export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, safeMessage: string) {
    super(safeMessage);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
