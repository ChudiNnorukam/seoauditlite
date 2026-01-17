import type { Handle } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { ensureEntitlement } from '$lib/server/entitlements-store';

const ENTITLEMENT_COOKIE = 'seoauditlite_entitlement';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/stripe/webhook')) {
		return resolve(event);
	}

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
