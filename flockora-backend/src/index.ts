import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info('Flockora backend started', { route: `http://localhost:${env.PORT}` });
});
