import { redirect, type RequestHandler } from '@sveltejs/kit';
import { google, getGoogleUser } from '$lib/server/google-oauth';
import { lucia } from '$lib/server/lucia';
import { getDb } from '$lib/server/db';
import { randomUUID } from 'node:crypto';
import * as arctic from 'arctic';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	if (!google) {
		throw redirect(302, '/?error=oauth_not_configured');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const storedCodeVerifier = cookies.get('google_oauth_code_verifier');

	// Verify state to prevent CSRF
	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		throw redirect(302, '/?error=invalid_oauth_state');
	}

	// Clear OAuth cookies
	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_oauth_code_verifier', { path: '/' });

	try {
		// Exchange code for tokens
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const accessToken = tokens.accessToken();

		// Fetch Google user info
		const googleUser = await getGoogleUser(accessToken);

		if (!googleUser.email) {
			throw redirect(302, '/?error=no_email');
		}

		const db = await getDb();
		const now = new Date().toISOString();

		// Check if user exists by Google ID or email
		const existingUserResult = await db.execute({
			sql: `SELECT id, email, google_id, name, avatar_url FROM users
			      WHERE google_id = ? OR email = ?`,
			args: [googleUser.sub, googleUser.email]
		});

		let userId: string;

		if (existingUserResult.rows.length > 0) {
			// User exists - update their info
			userId = existingUserResult.rows[0].id as string;
			await db.execute({
				sql: `UPDATE users SET
				        google_id = ?,
				        name = COALESCE(?, name),
				        avatar_url = COALESCE(?, avatar_url),
				        updated_at = ?
				      WHERE id = ?`,
				args: [googleUser.sub, googleUser.name || null, googleUser.picture || null, now, userId]
			});
		} else {
			// Create new user
			userId = randomUUID();
			await db.execute({
				sql: `INSERT INTO users (id, email, google_id, name, avatar_url, created_at, updated_at)
				      VALUES (?, ?, ?, ?, ?, ?, ?)`,
				args: [userId, googleUser.email, googleUser.sub, googleUser.name || null, googleUser.picture || null, now, now]
			});
		}

		// Link anonymous entitlement to user account
		if (locals.entitlementKey) {
			await db.execute({
				sql: `INSERT INTO entitlements_user_map (entitlement_key, id, created_at)
				      VALUES (?, ?, ?)
				      ON CONFLICT(entitlement_key) DO UPDATE SET id = excluded.id`,
				args: [locals.entitlementKey, userId, now]
			});
		}

		// Create session
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(302, '/dashboard');
	} catch (e) {
		if (e instanceof Response) {
			throw e; // Re-throw redirects
		}

		// Structured error logging for debugging
		const errorContext = {
			timestamp: new Date().toISOString(),
			type: e instanceof Error ? e.constructor.name : 'Unknown',
			message: e instanceof Error ? e.message : String(e),
			hasCode: !!(code),
			hasState: !!(state),
			statesMatch: state === storedState,
		};

		if (e instanceof arctic.OAuth2RequestError) {
			console.error('[auth] OAuth2 request error:', {
				...errorContext,
				oauthCode: e.code,
				oauthDescription: e.description,
			});
			throw redirect(302, '/?error=oauth_failed&code=' + encodeURIComponent(e.code));
		}

		console.error('[auth] Callback error:', errorContext);
		throw redirect(302, '/?error=auth_failed');
	}
};
