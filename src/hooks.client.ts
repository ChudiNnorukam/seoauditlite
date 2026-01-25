import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

const SENTRY_DSN = env.PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: import.meta.env.MODE,

		// Performance monitoring
		tracesSampleRate: 0.1, // 10% of transactions

		// Session replay for debugging
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,

		// Filter out known non-errors
		ignoreErrors: [
			'ResizeObserver loop limit exceeded',
			'ResizeObserver loop completed with undelivered notifications',
			'Non-Error promise rejection captured',
		],

		// Don't send PII
		beforeSend(event) {
			// Remove IP address
			if (event.user) {
				delete event.user.ip_address;
			}
			return event;
		},
	});
}

export const handleError = Sentry.handleErrorWithSentry();
