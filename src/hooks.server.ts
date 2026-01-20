import type { Handle } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { ensureEntitlement } from '$lib/server/entitlements-store';
import { lucia } from '$lib/server/lucia';

const ENTITLEMENT_COOKIE = 'seoauditlite_entitlement';

export const handle: Handle = async ({ event, resolve }) => {
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
			event.locals.user = {
				id: user.id,
				email: user.email,
				name: user.name,
				avatarUrl: user.avatarUrl,
				googleId: user.googleId
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

	return resolve(event);
};
