import '@testing-library/svelte/vitest';
import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  dev: true,
  browser: false,
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    TURSO_DATABASE_URL: 'file:test.db',
    TURSO_AUTH_TOKEN: '',
  },
}));

vi.mock('$env/static/private', () => ({
  TURSO_DATABASE_URL: 'file:test.db',
  TURSO_AUTH_TOKEN: '',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  ORIGIN: 'http://localhost:5173',
  LEMONSQUEEZY_API_KEY: '',
  LEMONSQUEEZY_STORE_ID: '',
  LEMONSQUEEZY_WEBHOOK_SECRET: '',
}));

vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_APP_URL: 'http://localhost:5173',
  },
}));
