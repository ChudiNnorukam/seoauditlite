import { json, type RequestHandler } from '@sveltejs/kit';
import { google } from '$lib/server/google-oauth';
import * as arctic from 'arctic';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ cookies }) => {
	if (!google) {
		return json({ error: 'Google OAuth not configured' }, { status: 503 });
	}

	const state = arctic.generateState();
	const codeVerifier = arctic.generateCodeVerifier();
	const scopes = ['openid', 'email', 'profile'];

	const url = google.createAuthorizationURL(state, codeVerifier, scopes);

	// Store state and code verifier in cookies for validation
	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 10 // 10 minutes
	});

	cookies.set('google_oauth_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 10 // 10 minutes
	});

	return json({ url: url.toString() });
};
