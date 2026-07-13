import { env } from '../config/env';
import { AIProvider } from './AIProvider';
import { MockAIProvider } from './MockAIProvider';

/**
 * Single place that decides which AIProvider implementation is active, driven by the
 * AI_PROVIDER environment variable. Adding a real provider in a future sprint means adding
 * a new case here (e.g. "gemini" -> new GeminiProvider()) and extending the AI_PROVIDER enum
 * in src/config/env.ts — nothing in src/routes needs to change.
 */
let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  switch (env.AI_PROVIDER) {
    case 'mock':
      cachedProvider = new MockAIProvider();
      return cachedProvider;
    default: {
      // Unreachable while the env schema only allows "mock", but kept explicit so a future
      // provider added to the enum without a matching case fails loudly instead of silently.
      const exhaustiveCheck: never = env.AI_PROVIDER;
      throw new Error(`No AIProvider registered for AI_PROVIDER="${exhaustiveCheck}"`);
    }
  }
}
