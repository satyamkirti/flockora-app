import helmet from 'helmet';

// Sensible, conservative defaults for a JSON/file-upload API with no server-rendered HTML.
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // not serving HTML; CSP is not meaningful for a pure JSON/file API
  crossOriginResourcePolicy: { policy: 'same-origin' },
});
