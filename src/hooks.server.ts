import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { randomUUID } from 'node:crypto';
import { ensureEntitlement } from '$lib/server/entitlements-store';
import { lucia, type LuciaUserAttributes } from '$lib/server/lucia';
import { dev } from '$app/environment';
import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/private';
import { devAuthHandle } from '$lib/server/dev-auth';

// Initialize Sentry for server-side error tracking
const SENTRY_DSN = env.SENTRY_DSN;
if (SENTRY_DSN && !dev) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: dev ? 'development' : 'production',
		tracesSampleRate: 0.1,
	});
}

const ENTITLEMENT_COOKIE = 'seoauditlite_entitlement';

const mainHandle: Handle = async ({ event, resolve }) => {
	// Skip auth for webhook endpoints
	if (event.url.pathname.startsWith('/api/lemonsqueezy/webhook')) {
		return resolve(event);
	}

	// 1. Check Lucia session first
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (sessionId) {
		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		if (user && session) {
			// User attributes are transformed by Lucia's getUserAttributes
			const userAttrs = user as typeof user & LuciaUserAttributes;
			event.locals.user = {
				id: user.id,
				email: userAttrs.email,
				name: userAttrs.name,
				avatarUrl: userAttrs.avatarUrl,
				googleId: userAttrs.googleId
			};
			event.locals.session = {
				id: session.id,
				userId: session.userId,
				expiresAt: session.expiresAt
			};
		}
	}

	// 2. Handle anonymous entitlement (existing logic unchanged)
	let entitlementKey = event.cookies.get(ENTITLEMENT_COOKIE);

	if (!entitlementKey) {
		entitlementKey = randomUUID();
		event.cookies.set(ENTITLEMENT_COOKIE, entitlementKey, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:'
		});
	}

	event.locals.entitlementKey = entitlementKey;
	await ensureEntitlement(entitlementKey);

	// Request logging (non-blocking, for debugging and audit trail)
	const startTime = Date.now();
	const response = await resolve(event);
	const duration = Date.now() - startTime;

	// Log API requests in production (skip static assets)
	if (!dev && event.url.pathname.startsWith('/api/')) {
		console.log('[request]', {
			method: event.request.method,
			path: event.url.pathname,
			status: response.status,
			durationMs: duration,
			hasUser: !!event.locals.user,
		});
	}

	return response;
};

// Dev auth runs first (only active when DEV_PASSWORD is set)
export const handle = sequence(devAuthHandle, mainHandle);

// Sentry error handler for server-side errors
export const handleError: HandleServerError = Sentry.handleErrorWithSentry(({ error, event }) => {
	// Log error details
	console.error('[server-error]', {
		path: event.url.pathname,
		message: error instanceof Error ? error.message : 'Unknown error',
	});

	return {
		message: 'An unexpected error occurred',
		code: 'INTERNAL_ERROR',
	};
});
