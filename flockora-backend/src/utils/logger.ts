/**
 * A deliberately narrow logging surface. Callers can only pass the fields listed in
 * LogFields — there is no way to accidentally log a request body, file buffer, header
 * value, or other free-form payload through this module. This is the concrete control for
 * SECURITY.md Rule 8 ("Never log sensitive information").
 */
type LogFields = {
  requestId?: string;
  route?: string;
  statusCode?: number;
  provider?: string;
  mimeType?: string;
  sizeBytes?: number;
  code?: string;
};

function write(level: 'info' | 'warn' | 'error', message: string, fields: LogFields = {}): void {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  // eslint-disable-next-line no-console
  console[level === 'info' ? 'log' : level](JSON.stringify(entry));
}

export const logger = {
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
};
